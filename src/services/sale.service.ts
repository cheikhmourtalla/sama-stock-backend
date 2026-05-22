import { prisma } from "../config/prisma.js";
import { AppError, ErrorCodes } from "../utils/app-error.js";
import { SaleRepository } from "../repositories/sale.repository.js";
import {
  CreateSale,
  CreateSaleDto,
  UpdateSaleDto,
} from "../dto/sale/sale.dto.js";
import loggerService from "../services/logger.service.js";
import { PaymentMethod, Prisma } from "../../generated/prisma/client.js";

const logger = loggerService.getLogger("SaleService");

export const SaleService = {
  async getSales(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        skip: skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          product: true,
          client: true,
        },
      }),

      prisma.sale.count(),
    ]);

    return {
      sales,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
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

  // ===============================================
  async createSale(data: CreateSale) {
    const { items, clientId, paidAmount, paymentMethod, customer, note } = data;

    if (!items || items.length === 0) {
      throw new AppError(
        "Aucun produit dans la vente",
        400,
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    return prisma.$transaction(async (tx) => {
      // CLIENT
      let client = null;

      if (clientId) {
        client = await tx.client.findUnique({
          where: { id: clientId },
        });

        if (!client) {
          throw new AppError(
            "Client introuvable",
            404,
            ErrorCodes.CLIENT_NOT_FOUND,
          );
        }
      }

      // TOTALS
      let globalTotal = 0;

      const factureLignes = [];

      const createdSales = [];

      // BOUCLE PRODUITS
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: {
            id: item.productId,
          },
        });

        if (!product) {
          throw new AppError(
            `Produit ${item.productId} introuvable`,
            404,
            ErrorCodes.PRODUCT_NOT_FOUND,
          );
        }

        if (product.quantity < item.quantity) {
          throw new AppError(
            `Stock insuffisant pour ${product.name}`,
            400,
            ErrorCodes.INSUFFICIENT_STOCK,
          );
        }

        // update stock
        await tx.product.update({
          where: {
            id: product.id,
          },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });

        const unitPrice = Number(product.salePrice);

        const lineTotal = unitPrice * item.quantity;

        globalTotal += lineTotal;

        // créer vente
        const sale = await tx.sale.create({
          data: {
            productId: product.id,

            clientId: clientId ?? null,

            quantity: item.quantity,

            unitPrice,

            totalAmount: lineTotal,

            paidAmount: 0,

            remaining: lineTotal,

            customer: customer ?? client?.name ?? "Client Comptant",

            note,
          },
        });

        createdSales.push(sale);

        // ligne facture
        factureLignes.push({
          designation: product.name,

          quantite: item.quantity,

          prixUnitaire: unitPrice,

          montant: lineTotal,
        });

        // stock movement
        await tx.stockMovement.create({
          data: {
            productId: product.id,

            type: "SALE",

            quantity: item.quantity,

            note: note ?? "Vente effectuée",
          },
        });
      }

      // paiement
      const paid = Number(paidAmount ?? globalTotal);

      const remaining = globalTotal - paid;

      // facture number
      const lastFacture = await tx.facture.findFirst({
        orderBy: {
          numero: "desc",
        },
      });

      const nextNumero = lastFacture ? lastFacture.numero + 1 : 1;

      // FACTURE
      const facture = await tx.facture.create({
        data: {
          numero: nextNumero,

          statut: remaining > 0 ? "NON_REGLEE" : "REGLEE",

          sale_id: createdSales[0].id,

          clientNom: customer ?? client?.name ?? "Client Comptant",

          clientAdresse: client?.address ?? "Dakar, Sénégal",

          clientTelephone: client?.phone ?? null,

          entrepriseNom: "TOUBA PALLENE",

          ninea: "008036221",

          total: globalTotal,

          montantVerse: paid,

          resteDu: remaining,

          lignes: {
            create: factureLignes,
          },
        },

        include: {
          lignes: true,
        },
      });

      // CASH SESSION
      const currentSession = await tx.cashSession.findFirst({
        orderBy: {
          openedAt: "desc",
        },
      });

      // if (!currentSession?.isOpen) {
      //   throw new AppError(
      //     "La caisse est fermée",
      //     403,
      //     ErrorCodes.SESSION_NOT_OPEN,
      //   );
      // }

      // mouvement caisse
      await tx.cashMovement.create({
        data: {

          type: "SALE",

          label: "Vente",

          amount: paid,

          paymentMethod: paymentMethod ?? "CASH",
        },
      });

      return facture;
    });
  },
  async addFacturePayment(data: {
    factureId: number;
    amount: number;
    paymentMethod: PaymentMethod;
  }) {
    const { factureId, amount, paymentMethod } = data;

    if (amount <= 0) {
      throw new AppError("Montant invalide", 400, ErrorCodes.VALIDATION_ERROR);
    }

    return prisma.$transaction(async (tx) => {
      // facture
      const facture = await tx.facture.findUnique({
        where: {
          id: factureId,
        },
        include: {
          sale: true,
        },
      });

      if (!facture) {
        throw new AppError(
          "Facture introuvable",
          404,
          ErrorCodes.FACTURE_NOT_FOUND,
        );
      }

      // déjà réglée
      if (facture.resteDu <= 0) {
        throw new AppError(
          "Cette facture est déjà réglée",
          400,
          ErrorCodes.VALIDATION_ERROR,
        );
      }

      // montant trop élevé
      if (amount > facture.resteDu) {
        throw new AppError(
          `Le montant dépasse le reste dû (${facture.resteDu})`,
          400,
          ErrorCodes.VALIDATION_ERROR,
        );
      }

      // session caisse
      const currentSession = await tx.cashSession.findFirst({
        orderBy: {
          openedAt: "desc",
        },
      });

      // if (!currentSession?.isOpen) {
      //   throw new AppError(
      //     "La caisse est fermée",
      //     403,
      //     ErrorCodes.SESSION_NOT_OPEN,
      //   );
      // }

      // calculs
      const newMontantVerse = Number(facture.montantVerse) + amount;

      const newReste = Number(facture.total) - newMontantVerse;

      let newStatut: "REGLEE" | "NON_REGLEE" | "PARTIELLEMENT_REGLEE";

      if (newReste <= 0) {
        newStatut = "REGLEE";
      } else if (newMontantVerse > 0) {
        newStatut = "PARTIELLEMENT_REGLEE";
      } else {
        newStatut = "NON_REGLEE";
      }

      // update facture
      const updatedFacture = await tx.facture.update({
        where: {
          id: factureId,
        },
        data: {
          montantVerse: newMontantVerse,

          resteDu: newReste,

          statut: newStatut,
        },
      });

      // update sale
      await tx.sale.update({
        where: {
          id: facture.sale_id,
        },
        data: {
          paidAmount: newMontantVerse,

          remaining: newReste,
        },
      });

      // mouvement caisse
      await tx.cashMovement.create({
        data: {
          // sessionId: currentSession.id,

          type: "CLIENT_PAYMENT",

          label: `Paiement facture #${facture.numero}`,

          amount,

          paymentMethod,
        },
      });

      return updatedFacture;
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

      await tx.cashMovement.create({
        data: {
          // sessionId: currentCashSession.id,
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

  async getFactures(page = 1, limit = 10, search: string) {
    logger.info(`Récupération des factures`);
    const where: Prisma.FactureWhereInput = search
      ? {
          OR: [
            {
              clientNom: {
                contains: search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              clientTelephone: {
                contains: search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              numero: isNaN(Number(search)) ? undefined : Number(search),
            },
          ],
        }
      : {};

    const skip = (page - 1) * limit;

    const [factures, total] = await Promise.all([
      prisma.facture.findMany({
        where,
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
