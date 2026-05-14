import { prisma } from "../config/prisma";

export const ClientService = {
  // get clients
  async getClient() {
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
        (sum, sale) => sum + sale.totalAmount,
        0,
      );

      const totalPaid = client.sales.reduce(
        (sum, sale) => sum + sale.paidAmount,
        0,
      );

      const totalRemaining = client.sales.reduce(
        (sum, sale) => sum + sale.remaining,
        0,
      );

      return {
        ...client,
        totalPurchases,
        totalPaid,
        totalRemaining,
      };
    });

    return clienWithBillingTotals;
  },

  // get one client
  async getClientById(userId: number) {
    const id = Number(userId);

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
      throw new Error("Client non trouvé");
    }

    const totalPurchases = client.sales.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0,
    );

    const totalPaid = client.sales.reduce(
      (sum, sale) => sum + sale.paidAmount,
      0,
    );

    const totalRemaining = client.sales.reduce(
      (sum, sale) => sum + sale.remaining,
      0,
    );

    return {
      ...client,
      totalPurchases,
      totalPaid,
      totalRemaining,
    };
  },

  // create client
  async createClient(name: string, phone: string) {
    if (!name || !phone) {
      throw new Error("Le nom et le téléphone sont obligatoires");
    }

    const existingClient = await prisma.client.findUnique({
      where: { phone },
    });

    if (existingClient) {
      throw new Error("Client existe déjà");
    }

    const client = await prisma.client.create({
      data: {
        name,
        phone,
      },
    });

    return client;
  },

  // update client
  async updateClient(
    id: number,
    name: string,
    phone: string,
  ) {
    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      throw new Error("Client introuvable");
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
      throw new Error(
        "Un autre client utilise déjà ce numéro",
      );
    }

    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        name,
        phone,
      },
    });

    return updatedClient;
  },

  // delete client
  async deleteClient(id: number) {
    const existingClient = await prisma.client.findUnique({
      where: { id },
      include: {
        sales: true,
      },
    });

    if (!existingClient) {
      throw new Error("Client introuvable");
    }

    if (existingClient.sales.length > 0) {
      throw new Error(
        "Impossible de supprimer un client ayant déjà des ventes",
      );
    }

    await prisma.client.delete({
      where: { id },
    });

    return true;
  },
};