import { prisma } from "../config/prisma";

export const ProductService = {
  // get products
  async getProducts(
    search: string,
    category: string,
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.name = {
        contains: search,
      };
    }

    if (category) {
      where.category = category;
    }

    const total = await prisma.product.count({
      where,
    });

    const products = await prisma.product.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    return {
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // get one product
  async getProductById(id: number) {
    if (isNaN(id)) {
      throw new Error("ID invalide");
    }

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new Error("Produit introuvable");
    }

    return product;
  },

  // create product
  async createProduct(data: {
    supplierId: number;
    name: string;
    description?: string;
    quantity?: number;
    purchasePrice: number;
    salePrice: number;
    alertThreshold?: number;
  }) {
    const {
      supplierId,
      name,
      description,
      quantity,
      purchasePrice,
      salePrice,
      alertThreshold,
    } = data;

    if (!name || purchasePrice == null || salePrice == null) {
      throw new Error("Les champs obligatoires sont manquants");
    }

    const product = await prisma.product.create({
      data: {
        supplier_id: supplierId,
        name,
        description,
        quantity: quantity ?? 0,
        purchasePrice,
        salePrice,
        alertThreshold: alertThreshold ?? 5,
      },
    });
    return product;
  },

  // update product
  async updateProduct(
    id: number,
    data: {
      name?: string;
      description?: string;
      quantity?: number;
      purchasePrice?: number;
      salePrice?: number;
      alertThreshold?: number;
    },
  ) {
    if (isNaN(id)) {
      throw new Error("ID invalide");
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new Error("Produit introuvable");
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data,
    });

    return updatedProduct;
  },

  // delete product
  async deleteProduct(id: number) {
    if (isNaN(id)) {
      throw new Error("ID invalide");
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new Error("Produit introuvable");
    }

    await prisma.product.delete({
      where: { id },
    });

    return true;
  },

  // low stock products
  async getLowStockProducts() {
    const products = await prisma.product.findMany({
      where: {
        quantity: {
          gt: 0,
        },
      },
      orderBy: {
        quantity: "asc",
      },
    });

    const lowStockProducts = products.filter(
      (product) => product.quantity <= product.alertThreshold,
    );

    return lowStockProducts;
  },

  // out of stock products
  async getOutOfStockProducts() {
    const products = await prisma.product.findMany({
      where: {
        quantity: 0,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return products;
  },
};
