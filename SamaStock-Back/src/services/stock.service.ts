import { prisma } from "../config/prisma.js";

export const StockService = {
  // entry stock
  async addStockEntry(
    supplierId: number,
    productId: number,
    quantity: number,
    note?: string,
  ) {
    if (!productId || !quantity || quantity <= 0) {
      throw new Error("productId et quantity sont obligatoires");
    }

    const product = await prisma.product.findUnique({
      where: { id: Number(productId) },
    });

    if (!product) {
      throw new Error("Produit introuvable");
    }

    const updatedProduct = await prisma.product.update({
      where: {
        id: Number(productId),
      },
      data: {
        quantity: product.quantity + Number(quantity),
      },
    });

    const movement = await prisma.stockMovement.create({
      data: {
        supplier_id: supplierId,
        productId: Number(productId),
        type: "ENTRY",
        quantity: Number(quantity),
        note,
      },
    });

    return {
      product: updatedProduct,
      movement,
    };
  },

  // stock out
  async addStockOut( supplierId : number ,productId: number, quantity: number, note?: string) {
    if (!productId || !quantity || quantity <= 0) {
      throw new Error("productId et quantity sont obligatoires");
    }

    const product = await prisma.product.findUnique({
      where: { id: Number(productId) },
    });

    if (!product) {
      throw new Error("Produit introuvable");
    }

    if (product.quantity < Number(quantity)) {
      throw new Error("Stock insuffisant pour effectuer cette sortie");
    }

    const updatedProduct = await prisma.product.update({
      where: {
        id: Number(productId),
      },
      data: {
        quantity: product.quantity - Number(quantity),
      },
    });

    const movement = await prisma.stockMovement.create({
      data: {


supplier_id : supplierId,
        productId: Number(productId),
        type: "OUT",
        quantity: Number(quantity),
        note,
      },
    });

    return {
      product: updatedProduct,
      movement,
    };
  },

  // get movements
  async getStockMovements() {
    const movements = await prisma.stockMovement.findMany({
      include: {
        product: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return movements;
  },
};
