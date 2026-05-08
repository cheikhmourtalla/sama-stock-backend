import { prisma } from "../config/prisma";

export const ClientService = {
  async getClient() {
    const clients = await prisma.client.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        sales: true,
      },
    });

    if (!clients) {
      throw new Error("Aucune client trouve");
    }

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

    return clienWithBillingTotals
  },
};
