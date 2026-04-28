import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    const totalProducts = await prisma.product.count();

    const allProducts = await prisma.product.findMany({
      select: {
        quantity: true,
        alertThreshold: true,
        purchasePrice: true,
      },
    });

    const lowStockProducts = allProducts.filter(
      (product) =>
        product.quantity > 0 && product.quantity <= product.alertThreshold
    ).length;

    const outOfStockProducts = allProducts.filter(
      (product) => product.quantity === 0
    ).length;

    const stockValue = allProducts.reduce((total, product) => {
      return total + product.quantity * product.purchasePrice;
    }, 0);

    const totalSales = await prisma.sale.count();

    const sales = await prisma.sale.findMany({
      select: {
        totalAmount: true,
      },
    });

    const totalSalesAmount = sales.reduce((total, sale) => {
      return total + sale.totalAmount;
    }, 0);

    return res.status(200).json({
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      stockValue,
      totalSales,
      totalSalesAmount,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors de la récupération des statistiques",
      error,
    });
  }
};