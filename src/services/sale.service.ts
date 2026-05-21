import { prisma } from "../config/prisma.js";
import { AppError, ErrorCodes } from "../utils/app-error.js";
import { SaleRepository } from "../repositories/sale.repository.js";
import { CreateSaleDto, UpdateSaleDto } from "../dto/sale/sale.dto.js";
import loggerService from "../services/logger.service.js";
import { PaymentMethod } from "../../generated/prisma/client.js";

const logger = loggerService.getLogger("SaleService");

export const SaleService = {
  async getSales() {
    logger.debug(`Récupération de toutes les ventes`);

    const sales = await SaleRepository.findAll();

    logger.info(
      `Liste des ventes récupérée - ${sales?.length || 0} vente(s) trouvée(s)`,
    );

    return sales;
  },

  async getSaleById(id: number) {
    logger.debug(`Recherche de la vente ID: ${id}`);

    if (!id) {
      logger.warn(`Identifiant invalide pour la recherche de vente`);
      throw new AppError(
        "L'identifiant de la vente est invalide ou manquant.",
        400,
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    const sale = await SaleRepository.findById(id);

    if (!sale) {
      logger.warn(`Vente non trouvée - ID: ${id}`);
      throw new AppError(
        `Vente avec l'ID ${id} introuvable. Vérifiez l'identifiant et réessayez.`,
        404,
        ErrorCodes.SALE_NOT_FOUND,
      );
    }

    logger.debug(
      `Vente trouvée - ID: ${id}, Client: ${sale.customer}, Total: ${sale.totalAmount}`,
    );

    return sale;
  },

  async createSale(data: CreateSaleDto, saleId?: string) {
    const {
      productId,
      clientId,
      quantity,
      paidAmount,
      paymentMethod,
      customer,
      note,
    } = data;

    logger.info(`Tentative de création d'une nouvelle vente`, {
      productId,
      clientId,
      quantity,
      paidAmount,
      paymentMethod,
      customer,
    });

    if (quantity <= 0) {
      logger.warn(`Création vente refusée - Quantité invalide: ${quantity}`);
      throw new AppError(
        `La quantité doit être supérieure à 0. Valeur reçue: ${quantity}.`,
        400,
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    return prisma.$transaction(async (tx) => {
      // product
      const product = await tx.product.findUnique({
        where: {
          id: productId,
        },
      });

      if (!product) {
        logger.warn(
          `Création vente refusée - Produit introuvable ID: ${productId}`,
        );
        throw new AppError(
          `Produit avec l'ID ${productId} introuvable. Vérifiez le produit et réessayez.`,
          404,
          ErrorCodes.PRODUCT_NOT_FOUND,
        );
      }

      // atomic stock update
      const updated = await tx.product.updateMany({
        where: {
          id: productId,
          quantity: {
            gte: quantity,
          },
        },
        data: {
          quantity: {
            decrement: quantity,
          },
        },
      });

      if (updated.count === 0) {
        logger.warn(
          `Création vente refusée - Stock insuffisant pour le produit ID: ${productId}, Quantité demandée: ${quantity}, Stock disponible: ${product.quantity}`,
        );
        throw new AppError(
          `Stock insuffisant pour le produit "${product.name}". Disponible: ${product.quantity}, Demandé: ${quantity}.`,
          400,
          ErrorCodes.INSUFFICIENT_STOCK,
        );
      }

      // client
      let client = null;

      if (clientId) {
        client = await tx.client.findUnique({
          where: {
            id: clientId,
          },
        });

        if (!client) {
          logger.warn(
            `Création vente refusée - Client introuvable ID: ${clientId}`,
          );
          throw new AppError(
            `Client avec l'ID ${clientId} introuvable. Veuillez vérifier le client ou créer la vente sans client.`,
            404,
            ErrorCodes.CLIENT_NOT_FOUND,
          );
        }
      }

      // prices
      const unitPrice = Number(product.salePrice);
      const totalAmount = unitPrice * quantity;
      const paid = Number(paidAmount ?? totalAmount);

      if (paid < 0 || paid > totalAmount) {
        logger.warn(
          `Création vente refusée - Montant payé invalide: ${paid} (Total: ${totalAmount})`,
        );
        throw new AppError(
          `Le montant payé (${paid}) est invalide. Il doit être compris entre 0 et ${totalAmount}.`,
          400,
          ErrorCodes.VALIDATION_ERROR,
        );
      }

      const remaining = totalAmount - paid;

      logger.debug(
        `Calculs vente - Prix unitaire: ${unitPrice}, Total: ${totalAmount}, Payé: ${paid}, Restant: ${remaining}`,
      );

      // create sale
      const sale = await tx.sale.create({
        data: {
          productId,
          clientId: clientId ?? null,
          quantity,
          unitPrice,
          totalAmount,
          paidAmount: paid,
          remaining,
          customer: customer ?? client?.name ?? null,
          note: note ?? null,
        },
        include: {
          product: true,
          client: true,
        },
      });

      logger.debug(`Vente créée en base - ID: ${sale.id}`);

      const lastFacture = await tx.facture.findFirst({
        orderBy: {
          numero: "desc",
        },
      });

      const nextNumero = lastFacture ? lastFacture.numero + 1 : 1;
      await tx.facture.create({
        data: {
          numero: nextNumero,

          statut: remaining > 0 ? "NON_REGLEE" : "REGLEE",

          sale_id: sale.id,

          // infos client
          clientNom: customer ?? client?.name ?? "Client Comptant",
          clientAdresse: client?.address ?? "Dakar, Sénégal",
          clientTelephone: client?.phone ?? null,

          // entreprise
          entrepriseNom: "TOUBA PALLENE",
          ninea: "008036221",

          // montants
          total: totalAmount,
          montantVerse: paid,
          resteDu: remaining,

          lignes: {
            create: [
              {
                designation: product.name,
                quantite: quantity,
                prixUnitaire: unitPrice,
                montant: totalAmount,
              },
            ],
          },
        },
      });

      // stock movement
      await tx.stockMovement.create({
        data: {
          productId,
          type: "SALE",
          quantity,
          note: note ?? "Vente effectuée",
        },
      });

      const currentSession = await tx.cashSession.findFirst({
        orderBy: { openedAt: "desc" },
      });

      if (!currentSession?.isOpen) {
        logger.error(`Création vente échouée - Caisse fermée ou inexistante`);
        throw new AppError(
          "La caisse est fermée. Veuillez ouvrir la caisse avant d'enregistrer une vente.",
          403,
          ErrorCodes.SESSION_NOT_OPEN,
        );
      }

      await tx.cashMovement.create({
        data: {
          sessionId: currentSession.id,
          type: "SALE",
          label: "Vente",
          amount: paidAmount as number,
          paymentMethod: paymentMethod ?? "CASH",
        },
      });

      logger.info(
        `Vente créée avec succès - ID: ${sale.id}, Produit: ${product.name}, Quantité: ${quantity}, Montant total: ${totalAmount}, Payé: ${paid}`,
      );

      return sale;
    });
  },

  async updateSale(id: number, data: UpdateSaleDto) {
    logger.debug(`Tentative de modification de la vente ID: ${id}`);

    const existingSale = await SaleRepository.findById(id);

    if (!existingSale) {
      logger.warn(`Modification refusée - Vente introuvable ID: ${id}`);
      throw new AppError(
        `Vente avec l'ID ${id} introuvable. La modification a échoué.`,
        404,
        ErrorCodes.SALE_NOT_FOUND,
      );
    }

    const updatedSale = await SaleRepository.update(id, {
      customer: data.customer ?? existingSale.customer,
      note: data.note ?? existingSale.note,
    });

    logger.info(
      `Vente modifiée avec succès - ID: ${id}, Client: ${updatedSale?.customer}`,
    );

    return updatedSale;
  },

  async addSalePayment(
    saleId: number,
    paidAmount: number,
    paymentMethod: PaymentMethod = "CASH",
  ) {
    logger.info(
      `Tentative d'ajout de paiement pour la vente ID: ${saleId}, Montant: ${paidAmount}, Moyen: ${paymentMethod}`,
    );

    const payment = prisma.$transaction(async (tx) => {
      const findSale = await tx.sale.findUnique({
        where: { id: saleId },
      });

      if (!paidAmount || paidAmount <= 0) {
        logger.warn(`Ajout paiement refusé - Montant invalide: ${paidAmount}`);
        throw new AppError(
          `Le montant du versement (${paidAmount}) est invalide. Le montant doit être supérieur à 0.`,
          400,
          ErrorCodes.VALIDATION_ERROR,
        );
      }

      if (!findSale) {
        logger.warn(`Ajout paiement refusé - Vente introuvable ID: ${saleId}`);
        throw new AppError(
          `Vente avec l'ID ${saleId} introuvable. Impossible d'ajouter un paiement.`,
          404,
          ErrorCodes.SALE_NOT_FOUND,
        );
      }

      if (!findSale.remaining) {
        logger.warn(
          `Ajout paiement refusé - Vente déjà soldée ID: ${saleId}, Restant: ${findSale.remaining}`,
        );
        throw new AppError(
          `Cette vente est déjà entièrement payée. Aucun paiement supplémentaire n'est requis.`,
          400,
          ErrorCodes.VALIDATION_ERROR,
        );
      }

      if (paidAmount > findSale.remaining.toNumber()) {
        logger.warn(
          `Ajout paiement refusé - Montant supérieur au reste dû pour la vente ID: ${saleId}, Restant: ${findSale.remaining}, Tentative: ${paidAmount}`,
        );
        throw new AppError(
          `Le montant du versement (${paidAmount}) est supérieur au reste à payer (${findSale.remaining}) FCFA. Montant maximum autorisé: ${findSale.remaining} FCFA.`,
          400,
          ErrorCodes.VALIDATION_ERROR,
        );
      }

      const isCompletePayment = findSale.remaining.toNumber() === paidAmount;
      const restPayment = isCompletePayment
        ? 0
        : findSale.remaining.toNumber() - paidAmount;

      logger.debug(
        `Calcul paiement - Reste avant: ${findSale.remaining}, Paiement: ${paidAmount}, Paiement complet: ${isCompletePayment}, Nouveau reste: ${restPayment}`,
      );

      await tx.sale.update({
        where: { id: saleId },
        data: {
          remaining: restPayment,
          paidAmount: {
            increment: paidAmount,
          },
        },
      });

      // mise à jour facture liée à la vente
      await tx.facture.update({
        where: {
          sale_id: saleId,
        },

        data: {
          montantVerse: {
            increment: paidAmount,
          },

          resteDu: restPayment,

          statut:
            restPayment === 0
              ? "REGLEE"
              : paidAmount > 0
                ? "PARTIELLEMENT_REGLEE"
                : "NON_REGLEE",
        },
      });

      const currentCashSession = await tx.cashSession.findFirst({
        orderBy: { openedAt: "desc" },
      });

      if (!currentCashSession || !currentCashSession.isOpen) {
        logger.error(
          `Ajout paiement échoué - Caisse fermée ou inexistante pour la vente ID: ${saleId}`,
        );
        throw new AppError(
          "La caisse est fermée. Veuillez ouvrir la caisse avant d'enregistrer un paiement.",
          403,
          ErrorCodes.SESSION_NOT_OPEN,
        );
      }

      await tx.cashMovement.create({
        data: {
          sessionId: currentCashSession.id,
          type: "CLIENT_PAYMENT",
          label: "Versement dette",
          amount: paidAmount,
          paymentMethod: paymentMethod,
        },
      });

      logger.info(
        `Paiement ajouté avec succès - Vente ID: ${saleId}, Montant: ${paidAmount}, Reste à payer: ${restPayment}, Vente ${isCompletePayment ? "complètement soldée" : "partiellement payée"}`,
      );
    });

    return payment;
  },

  async deleteSale(id: number) {
    logger.warn(`Tentative de suppression de la vente ID: ${id}`);

    return prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id },
        include: {
          product: true,
        },
      });

      if (!sale) {
        logger.warn(`Suppression refusée - Vente introuvable ID: ${id}`);
        throw new AppError(
          `Vente avec l'ID ${id} introuvable. La suppression a échoué.`,
          404,
          ErrorCodes.SALE_NOT_FOUND,
        );
      }

      logger.debug(
        `Suppression de la vente - Produit: ${sale.productId}, Quantité à restaurer: ${sale.quantity}`,
      );

      // restore stock
      await tx.product.update({
        where: {
          id: sale.productId,
        },
        data: {
          quantity: {
            increment: sale.quantity,
          },
        },
      });

      // movement
      await tx.stockMovement.create({
        data: {
          productId: sale.productId,
          type: "ENTRY",
          quantity: sale.quantity,
          note: "Suppression vente",
        },
      });

      // delete
      await tx.sale.delete({
        where: {
          id,
        },
      });

      logger.info(
        `Vente supprimée avec succès - ID: ${id}, Produit ID: ${sale.productId}, Quantité restaurée: ${sale.quantity}`,
      );

      return true;
    });
  },

  async getFacture(id: number) {
    logger.info(`Récupération facture ID: ${id}`);

    const facture = await prisma.facture.findUnique({
      where: {
        id,
      },

      include: {
        sale: {
          include: {
            product: true,
            client: true,
          },
        },

        lignes: true,
      },
    });

    if (!facture) {
      logger.warn(`Facture introuvable ID: ${id}`);

      throw new AppError(
        `Facture avec l'ID ${id} introuvable.`,
        404,
        ErrorCodes.FACTURE_NOT_FOUND,
      );
    }

    logger.info(`Facture récupérée avec succès ID: ${id}`);

    return facture;
  },

async getFactures(page = 1, limit = 10) {
  logger.info(`Récupération des factures`);

  const skip = (page - 1) * limit;

  const [factures, total] = await Promise.all([
    prisma.facture.findMany({
      skip,
      take: limit,

      orderBy: {
        dateFacture: "desc",
      },

      include: {
        sale: {
          include: {
            product: true,
            client: true,
          },
        },

        lignes: true,
      },
    }),

    prisma.facture.count(),
  ]);

  return {
    data: factures,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
},
  async getLastFacture() {
    logger.info(`Récupération des`);

    const getLastSal = prisma.sale.findFirst({
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    const factures = await prisma.facture.findMany({
      where: { sale_id: (await getLastSal).id },
      orderBy: { createdAt: "desc" },
      include: {
        sale: {
          include: {
            product: true,
            client: true,
          },
        },

        lignes: true,
      },
    });

    logger.info(`Factures recupere}`);

    return factures;
  },
};
