import { prisma } from "../config/prisma";

export const SaleService = {
  // get sales
  async getSales() {
    const sales = await prisma.sale.findMany({
      include: {
        product: true,
        client: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return sales;
  },

  // get one sale
  async getSaleById(id: number) {
    if (!id) {
      throw new Error("Identifiant de vente invalide");
    }

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        product: true,
        client: true,
      },
    });

    if (!sale) {
      throw new Error("Vente introuvable");
    }

    return sale;
  },

  // create sale
  async createSale(data: {
    productId: number;
    clientId?: number;
    quantity: number;
    paidAmount?: number;
    customer?: string;
    note?: string;
  }) {
    const { productId, clientId, quantity, paidAmount, customer, note } = data;

    if (!productId || !quantity) {
      throw new Error("Produit ou quantité manquant");
    }

    const qty = Number(quantity);

    if (qty <= 0) {
      throw new Error("La quantité doit être supérieure à 0");
    }

    const product = await prisma.product.findUnique({
      where: {
        id: Number(productId),
      },
    });

    if (!product) {
      throw new Error("Produit introuvable");
    }

    if (product.quantity < qty) {
      throw new Error("Stock insuffisant pour effectuer cette vente");
    }

    let client = null;

    if (clientId) {
      client = await prisma.client.findUnique({
        where: {
          id: Number(clientId),
        },
      });

      if (!client) {
        throw new Error("Client introuvable");
      }
    }

    const unitPrice = Number(product.salePrice);

    const totalAmount = unitPrice * qty;

    const paid = Number(paidAmount ?? totalAmount);

    if (paid < 0 || paid > totalAmount) {
      throw new Error("Le montant payé est invalide");
    }

    const remaining = totalAmount - paid;

    const updatedProduct = await prisma.product.update({
      where: {
        id: Number(productId),
      },
      data: {
        quantity: product.quantity - qty,
      },
    });

    const sale = await prisma.sale.create({
      data: {
        productId: Number(productId),
        clientId: clientId ? Number(clientId) : null,
        quantity: qty,
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

    if (!sale) {
      throw new Error("Vente a echouer");
    }

    // udpate transaction summary
    const summary = await prisma.transactionSummary.findFirst();

    //  create a summary for the day if it's not exist
    if (!summary) {
      await prisma.transactionSummary.create({
        data: {
          balance: 0,
          entries: 0,
          exits: 0,
          transactions: 0,
        },
      });
    }

    const newEntries = summary!.entries + paidAmount!;
    const newBalance = summary!.balance + paidAmount!
    
      await prisma.transactionSummary.update({
        where: {
          id: summary?.id,
        },
        data: {
          entries: newEntries,
          // exits: newExits,
          balance: newBalance,
          transactions: {
            increment: 1,
          },
        },
      });


    await prisma.stockMovement.create({
      data: {
        productId: Number(productId),
        type: "SALE",
        quantity: qty,
        note: note ?? "Vente effectuée",
      },
    });

    return {
      sale,
      product: updatedProduct,
    };
  },

  // update sale
  async updateSale(
    id: number,
    data: {
      note?: string;
      customer?: string;
    },
  ) {
    if (!id) {
      throw new Error("Identifiant de vente invalide");
    }

    const existingSale = await prisma.sale.findUnique({
      where: { id },
    });

    if (!existingSale) {
      throw new Error("Vente introuvable");
    }

    const updatedSale = await prisma.sale.update({
      where: { id },
      data: {
        note: data.note ?? existingSale.note,

        customer: data.customer ?? existingSale.customer,
      },
      include: {
        product: true,
        client: true,
      },
    });

    return updatedSale;
  },

  // delete sale
  async deleteSale(id: number) {
    if (!id) {
      throw new Error("Identifiant de vente invalide");
    }

    const existingSale = await prisma.sale.findUnique({
      where: { id },
      include: {
        product: true,
      },
    });

    if (!existingSale) {
      throw new Error("Vente introuvable");
    }

    await prisma.product.update({
      where: {
        id: existingSale.productId,
      },
      data: {
        quantity: existingSale.product.quantity + existingSale.quantity,
      },
    });

    await prisma.stockMovement.create({
      data: {
        productId: existingSale.productId,
        type: "ENTRY",
        quantity: existingSale.quantity,
        note: "Annulation / suppression vente",
      },
    });

    await prisma.sale.delete({
      where: { id },
    });

    return true;
  },

  // add payment
  async addSalePayment(saleId: number, amount: number) {
    if (!saleId || amount === undefined || amount === null) {
      throw new Error(
        "L'identifiant de la vente et le montant sont obligatoires",
      );
    }

    const paymentAmount = Number(amount);

    if (paymentAmount <= 0) {
      throw new Error("Le montant doit être supérieur à 0");
    }

    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        product: true,
        client: true,
      },
    });

    if (!sale) {
      throw new Error("Vente introuvable");
    }

    if (sale.remaining <= 0) {
      throw new Error("Cette vente est déjà totalement soldée");
    }

    if (paymentAmount > sale.remaining) {
      throw new Error("Le montant dépasse le reste à payer");
    }

    const updatedSale = await prisma.sale.update({
      where: {
        id: saleId,
      },
      data: {
        paidAmount: sale.paidAmount + paymentAmount,

        remaining: sale.remaining - paymentAmount,
      },
      include: {
        product: true,
        client: true,
        
      },
    });

        // udpate transaction summary
    const summary = await prisma.transactionSummary.findFirst();

    //  create a summary for the day if it's not exist
    if (!summary) {
      await prisma.transactionSummary.create({
        data: {
          balance: 0,
          entries: 0,
          exits: 0,
          transactions: 0,
        },
      });
    }

    const newEntries = summary!.entries + updatedSale.paidAmount;
    const newBalance = summary!.balance + paymentAmount!
    
      await prisma.transactionSummary.update({
        where: {
          id: summary?.id,
        },
        data: {
          entries: newEntries,
          // exits: newExits,
          balance: newBalance,
          transactions: {
            increment: 1,
          },
        },
      });

    

    return updatedSale;
  },
};
