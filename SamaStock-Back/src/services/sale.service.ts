import { prisma } from "../config/prisma";
import { SaleRepository } from "../repositories/sale.repository";
import { CreateSaleDto, UpdateSaleDto } from "../dto/sale/sale.dto";
import loggerService from "../services/logger.service";

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
      throw new Error("L'identifiant de la vente est invalide ou manquant.");
    }

    const sale = await SaleRepository.findById(id);

    if (!sale) {
      logger.warn(`Vente non trouvée - ID: ${id}`);
      throw new Error(
        `Vente avec l'ID ${id} introuvable. Vérifiez l'identifiant et réessayez.`,
      );
    }

    logger.debug(
      `Vente trouvée - ID: ${id}, Client: ${sale.customer}, Total: ${sale.totalAmount}`,
    );

    return sale;
  },

  async createSale(data: CreateSaleDto, saleId?: string) {
    const { productId, clientId, quantity, paidAmount, customer, note } = data;

    logger.info(`Tentative de création d'une nouvelle vente`, {
      productId,
      clientId,
      quantity,
      paidAmount,
      customer,
    });

    if (quantity <= 0) {
      logger.warn(`Création vente refusée - Quantité invalide: ${quantity}`);
      throw new Error(
        `La quantité doit être supérieure à 0. Valeur reçue: ${quantity}.`,
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
        throw new Error(
          `Produit avec l'ID ${productId} introuvable. Vérifiez le produit et réessayez.`,
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
        throw new Error(
          `Stock insuffisant pour le produit "${product.name}". Disponible: ${product.quantity}, Demandé: ${quantity}.`,
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
          throw new Error(
            `Client avec l'ID ${clientId} introuvable. Veuillez vérifier le client ou créer la vente sans client.`,
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
        throw new Error(
          `Le montant payé (${paid}) est invalide. Il doit être compris entre 0 et ${totalAmount}.`,
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
        throw new Error(
          "La caisse est fermée. Veuillez ouvrir la caisse avant d'enregistrer une vente.",
        );
      }

      await tx.cashMovement.create({
        data: {
          sessionId: currentSession.id,
          type: "SALE",
          label: "Vente",
          amount: paidAmount as number,
          paymentMethod: "CASH",
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
      throw new Error(
        `Vente avec l'ID ${id} introuvable. La modification a échoué.`,
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

  async addSalePayment(saleId: number, paidAmount: number) {
    logger.info(
      `Tentative d'ajout de paiement pour la vente ID: ${saleId}, Montant: ${paidAmount}`,
    );

    const payment = prisma.$transaction(async (tx) => {
      const findSale = await tx.sale.findUnique({
        where: { id: saleId },
      });

      if (!paidAmount || paidAmount <= 0) {
        logger.warn(`Ajout paiement refusé - Montant invalide: ${paidAmount}`);
        throw new Error(
          `Le montant du versement (${paidAmount}) est invalide. Le montant doit être supérieur à 0.`,
        );
      }

      if (!findSale) {
        logger.warn(`Ajout paiement refusé - Vente introuvable ID: ${saleId}`);
        throw new Error(
          `Vente avec l'ID ${saleId} introuvable. Impossible d'ajouter un paiement.`,
        );
      }

      if (!findSale.remaining) {
        logger.warn(
          `Ajout paiement refusé - Vente déjà soldée ID: ${saleId}, Restant: ${findSale.remaining}`,
        );
        throw new Error(
          `Cette vente est déjà entièrement payée. Aucun paiement supplémentaire n'est requis.`,
        );
      }

      if (paidAmount > findSale.remaining) {
        logger.warn(
          `Ajout paiement refusé - Montant supérieur au reste dû pour la vente ID: ${saleId}, Restant: ${findSale.remaining}, Tentative: ${paidAmount}`,
        );
        throw new Error(
          `Le montant du versement (${paidAmount}) est supérieur au reste à payer (${findSale.remaining} FCFA). Montant maximum autorisé: ${findSale.remaining} FCFA.`,
        );
      }

      const isCompletePayment = findSale.remaining === paidAmount;
      const restPayment = isCompletePayment
        ? 0
        : findSale.remaining - paidAmount;

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

      const currentCashSession = await tx.cashSession.findFirst({
        orderBy: { openedAt: "desc" },
      });

      if (!currentCashSession || !currentCashSession.isOpen) {
        logger.error(
          `Ajout paiement échoué - Caisse fermée ou inexistante pour la vente ID: ${saleId}`,
        );
        throw new Error(
          "La caisse est fermée. Veuillez ouvrir la caisse avant d'enregistrer un paiement.",
        );
      }

      await tx.cashMovement.create({
        data: {
          sessionId: currentCashSession.id,
          type: "CLIENT_PAYMENT",
          label: "Versement dette",
          amount: paidAmount,
          paymentMethod: "CASH",
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
        throw new Error(
          `Vente avec l'ID ${id} introuvable. La suppression a échoué.`,
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
};
