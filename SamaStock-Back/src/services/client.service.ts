import { prisma } from "../config/prisma";
import loggerService from "../services/logger.service";

const logger = loggerService.getLogger("ClientService");

export const ClientService = {
  // get clients
  async getClient() {
    logger.debug(`Récupération de la liste des clients`);

    const clients = await prisma.client.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        sales: true,
      },
    });

    const clienWithBillingTotals = clients.map((client) => {
      const totalPurchases = client.sales.reduce(
        (sum, sale) => sum + sale.totalAmount.toNumber(),
        0,
      );

      const totalPaid = client.sales.reduce(
        (sum, sale) => sum + sale.paidAmount.toNumber(),
        0,
      );

      const totalRemaining = client.sales.reduce(
        (sum, sale) => sum + sale.remaining.toNumber(),
        0,
      );

      return {
        ...client,
        totalPurchases,
        totalPaid,
        totalRemaining,
      };
    });

    logger.info(`Liste des clients récupérée - ${clients.length} client(s) trouvé(s)`);

    return clienWithBillingTotals;
  },

  // get one client
  async getClientById(userId: number) {
    const id = Number(userId);
    
    logger.debug(`Recherche du client ID: ${id}`);

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        sales: {
          include: {
            product: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!client) {
      logger.warn(`Client non trouvé - ID: ${id}`);
      throw new Error(`Client avec l'ID ${id} non trouvé. Vérifiez l'identifiant et réessayez.`);
    }

    const totalPurchases = client.sales.reduce(
      (sum, sale) => sum + sale.totalAmount.toNumber(),
      0,
    );

    const totalPaid = client.sales.reduce(
      (sum, sale) => sum + sale.paidAmount.toNumber(),
      0,
    );

    const totalRemaining = client.sales.reduce(
      (sum, sale) => sum + sale.remaining.toNumber(),
      0,
    );

    logger.debug(`Client trouvé - ID: ${id}, Nom: ${client.name}, Total achats: ${totalPurchases}, Ventes: ${client.sales.length}`);

    return {
      ...client,
      totalPurchases,
      totalPaid,
      totalRemaining,
    };
  },

  // create client
  async createClient(name: string, phone: string) {
    logger.debug(`Tentative de création d'un nouveau client - Nom: ${name}, Téléphone: ${phone}`);

    if (!name || !phone) {
      logger.warn(`Création client refusée - Champs manquants (nom: ${!!name}, téléphone: ${!!phone})`);
      throw new Error("Le nom et le numéro de téléphone sont obligatoires pour créer un client.");
    }

    const existingClient = await prisma.client.findUnique({
      where: { phone },
    });

    if (existingClient) {
      logger.warn(`Création client refusée - Un client existe déjà avec ce numéro: ${phone} (ID: ${existingClient.id})`);
      throw new Error(`Un client avec le numéro ${phone} existe déjà. Veuillez utiliser un autre numéro.`);
    }

    const client = await prisma.client.create({
      data: {
        name,
        phone,
      },
    });

    logger.info(`Client créé avec succès - ID: ${client.id}, Nom: ${name}, Téléphone: ${phone}`);

    return client;
  },

  // update client
  async updateClient(
    id: number,
    name: string,
    phone: string,
  ) {
    logger.debug(`Tentative de modification du client ID: ${id}`);

    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      logger.warn(`Modification refusée - Client introuvable ID: ${id}`);
      throw new Error(`Client avec l'ID ${id} introuvable. La modification a échoué.`);
    }

    const clientWithPhone = await prisma.client.findFirst({
      where: {
        phone,
        NOT: {
          id,
        },
      },
    });

    if (clientWithPhone) {
      logger.warn(`Modification refusée - Numéro déjà utilisé par un autre client: ${phone} (client ID: ${clientWithPhone.id})`);
      throw new Error(`Le numéro ${phone} est déjà utilisé par un autre client. Veuillez utiliser un autre numéro.`);
    }

    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        name,
        phone,
      },
    });

    logger.info(`Client modifié avec succès - ID: ${id}, Ancien nom: ${existingClient.name}, Nouveau nom: ${name}, Téléphone: ${phone}`);

    return updatedClient;
  },

  // delete client
  async deleteClient(id: number) {
    logger.warn(`Tentative de suppression du client ID: ${id}`);

    const existingClient = await prisma.client.findUnique({
      where: { id },
      include: {
        sales: true,
      },
    });

    if (!existingClient) {
      logger.warn(`Suppression refusée - Client introuvable ID: ${id}`);
      throw new Error(`Client avec l'ID ${id} introuvable. La suppression a échoué.`);
    }

    if (existingClient.sales.length > 0) {
      logger.warn(`Suppression refusée - Client avec ventes existantes ID: ${id}, Nombre de ventes: ${existingClient.sales.length}`);
      throw new Error(`Impossible de supprimer le client "${existingClient.name}" car il a ${existingClient.sales.length} vente(s) associée(s). Supprimez d'abord ses ventes.`);
    }

    await prisma.client.delete({
      where: { id },
    });

    logger.info(`Client supprimé avec succès - ID: ${id}, Nom: ${existingClient.name}`);

    return true;
  },
};