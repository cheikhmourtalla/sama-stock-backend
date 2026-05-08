import { prisma } from "../config/prisma";

export const DashboardService = {

  async getDashboardStats() {

    // products
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
        product.quantity > 0 &&
        product.quantity <= product.alertThreshold
    ).length;

    const outOfStockProducts = allProducts.filter(
      (product) => product.quantity === 0
    ).length;

    const stockValue = allProducts.reduce(
      (total, product) => {
        return (
          total +
          product.quantity * product.purchasePrice
        );
      },
      0
    );

    // sales
    const totalSales = await prisma.sale.count();

    const sales = await prisma.sale.findMany({
      select: {
        totalAmount: true,
      },
    });

    const totalSalesAmount = sales.reduce(
      (total, sale) => {
        return total + sale.totalAmount;
      },
      0
    );

    return {
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      stockValue,
      totalSales,
      totalSalesAmount,
    };
  },
};