import type { Request, Response } from "express";

import { SaleService } from "../services/sale.service.js";

import {
  CreateSaleSchema,
  UpdateSaleSchema,
  AddSalePaymentSchema,
} from "../dto/sale/sale.dto.js";
import loggerService from "../services/logger.service.js";
import { AppError, ErrorCodes } from "../utils/app-error.js";
import { prisma } from "../config/prisma.js";

export const saleController = {
  // get all sales
  async getSales(_req: Request, res: Response) {
    const logger = loggerService.getLogger("SaleController");
    const requestId = (_req as any).requestId;

    logger.debug(`Récupération de toutes les ventes`, {
      requestId,
      ip: _req.ip,
    });

    const page = Number(_req.query.page || 1);
    const limit = Number(_req.query.limit || 20);

    const sales = await SaleService.getSales(page, limit);
    logger.info(`Liste des ventes récupérée`, {
      requestId,
      count: sales || 0,
    });

    return res.status(200).json({
      success: true,
      data: sales,
    });
  },

  // get one sale
  async getSaleById(req: Request, res: Response) {
    const logger = loggerService.getLogger("SaleController");
    const requestId = (req as any).requestId;
    const id = Number(req.params.id);

    logger.debug(`Recherche de la vente ID: ${id}`, {
      requestId,
      saleId: id,
      ip: req.ip,
    });

    const sale = await SaleService.getSaleById(id);

    logger.info(`Vente trouvée ID: ${id}`, {
      requestId,
      saleId: id,
    });

    return res.status(200).json({
      success: true,
      data: sale,
    });
  },

  // create sale
  async createSale(req: Request, res: Response) {
    const logger = loggerService.getLogger("SaleController");
    const requestId = (req as any).requestId;
    const validatedData = req.body;

    // logger.info(`Tentative de création d'une nouvelle vente`, {
    //   requestId,
    //   clientId: validatedData.clientId,
    //   productId: validatedData.productId,
    //   quantity: validatedData.quantity,
    //   // totalAmount: validatedData.totalAmount,
    //   ip: req.ip,
    // });

    const sale = await SaleService.createSale(validatedData);

    // logger.info(`Vente créée avec succès`, {
    //   requestId,
    //   saleId: sale,
    // });

    return res.status(201).json({
      success: true,
      data: sale,
      message: "Vente enregistrée avec succèss",
    });
  },

  // update sale
  async updateSale(req: Request, res: Response) {
    const logger = loggerService.getLogger("SaleController");
    const requestId = (req as any).requestId;
    const id = Number(req.params.id);
    const validatedData = UpdateSaleSchema.parse(req.body);

    logger.info(`Tentative de modification de la vente ID: ${id}`, {
      requestId,
      saleId: id,
      ip: req.ip,
    });

    const sale = await SaleService.updateSale(id, validatedData);

    logger.info(`Vente modifiée avec succès ID: ${id}`, {
      requestId,
      saleId: id,
    });

    return res.status(200).json({
      success: true,
      data: sale,
      message: "Vente modifiée avec succès",
    });
  },

  // delete sale
  async deleteSale(req: Request, res: Response) {
    const logger = loggerService.getLogger("SaleController");
    const requestId = (req as any).requestId;
    const id = Number(req.params.id);

    logger.warn(`Tentative de suppression de la vente ID: ${id}`, {
      requestId,
      saleId: id,
      ip: req.ip,
    });

    await SaleService.deleteSale(id);

    logger.info(`Vente supprimée avec succès ID: ${id}`, {
      requestId,
      saleId: id,
    });

    return res.status(200).json({
      success: true,
      message: "Vente supprimée avec succès",
    });
  },

  // add payment
  async addSalePayment(req: Request, res: Response) {
    const logger = loggerService.getLogger("SaleController");
    const requestId = (req as any).requestId;
    const saleId = Number(req.params.id);
    const validatedData = AddSalePaymentSchema.parse(req.body);

    logger.info(`Tentative d'ajout d'un paiement pour la vente ID: ${saleId}`, {
      requestId,
      saleId,
      amount: validatedData.amount,
      paymentMethod: validatedData.paymentMethod,
      ip: req.ip,
    });

    const sale = await SaleService.addSalePayment(
      saleId,
      validatedData.amount,
      validatedData.paymentMethod as any,
    );

    logger.info(`Paiement ajouté avec succès pour la vente ID: ${saleId}`, {
      requestId,
      saleId,
      amount: validatedData.amount,
    });

    return res.status(200).json({
      success: true,
      data: sale,
      message: "Paiement ajouté avec succès",
    });
  },

  async getFacture(req: Request, res: Response) {
    const id = Number(req.params.fac_id);

    if (isNaN(id)) {
      throw new AppError(
        "ID de facture invalide.",
        400,
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    const facture = await SaleService.getFacture(id);
    res.status(200).json({
      success: true,
      message: "Facture récupérée avec succès.",
      data: facture,
    });
  },

  async getFactures(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;

    const limit = Number(req.query.limit) || 10;

    const search = String(req.query.search || "");

    const factures = await SaleService.getFactures(page, limit, search);

    res.status(200).json({
      success: true,
      message: "Factures récupérées avec succès.",
      ...factures,
    });
  },
  async lastFacture(req: Request, res: Response) {
    const facture = await SaleService.getLastFacture();
    res.status(200).json({
      success: true,
      message: "Derniere facture ",
      data: facture,
    });
  },

  async addFacturePayment(req: Request, res: Response) {
    const factureId = Number(req.params.id);

    const { amount, paymentMethod } = req.body;

    const result = await SaleService.addFacturePayment({
      factureId,
      amount,
      paymentMethod,
    });

    return res.status(200).json({
      success: true,
      message: "Paiement enregistré",
      data: result,
    });
  },

  async getSalesStats(_req: Request, res: Response) {
    try {
      /**
       * ALL SALES
       */
      const sales = await prisma.sale.findMany({
        include: {
          product: true,
          client: true,
        },
      });

      /**
       * GLOBALS
       */
      const totalRevenue = sales.reduce(
        (acc, sale) => acc + Number(sale.totalAmount),
        0,
      );

      const totalPaid = sales.reduce(
        (acc, sale) => acc + Number(sale.paidAmount),
        0,
      );

      const totalRemaining = sales.reduce(
        (acc, sale) => acc + Number(sale.remaining),
        0,
      );

      const totalSales = sales.length;

      const totalProductsSold = sales.reduce(
        (acc, sale) => acc + Number(sale.quantity),
        0,
      );

      /**
       * TODAY SALES
       */
      const today = new Date();

      today.setHours(0, 0, 0, 0);

      const todaySales = sales.filter(
        (sale) => new Date(sale.createdAt) >= today,
      );

      const todayRevenue = todaySales.reduce(
        (acc, sale) => acc + Number(sale.totalAmount),
        0,
      );

      /**
       * TOP PRODUCTS
       */
      const productsMap: Record<
        string,
        {
          productId: number;
          name: string;
          quantity: number;
          revenue: number;
        }
      > = {};

      for (const sale of sales) {
        const productId = sale.productId;

        if (!productsMap[productId]) {
          productsMap[productId] = {
            productId,
            name: sale.product?.name || "Produit",
            quantity: 0,
            revenue: 0,
          };
        }

        productsMap[productId].quantity += Number(sale.quantity);

        productsMap[productId].revenue += Number(sale.totalAmount);
      }

      const topProducts = Object.values(productsMap)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      /**
       * MONTHLY SALES
       */
      const monthlyMap: Record<
        string,
        {
          month: string;
          revenue: number;
          sales: number;
        }
      > = {};

      for (const sale of sales) {
        const date = new Date(sale.createdAt);

        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = {
            month: date.toLocaleDateString("fr-FR", {
              month: "short",
              year: "numeric",
            }),

            revenue: 0,
            sales: 0,
          };
        }

        monthlyMap[monthKey].revenue += Number(sale.totalAmount);

        monthlyMap[monthKey].sales += 1;
      }

      const monthlyStats = Object.values(monthlyMap);

      /**
       * RECENT SALES
       */
      const recentSales = sales.slice(0, 5);

      return res.json({
        stats: {
          totalRevenue,
          totalPaid,
          totalRemaining,
          totalSales,
          totalProductsSold,
          todayRevenue,
        },

        topProducts,

        monthlyStats,

        recentSales,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Erreur lors du chargement des statistiques",
      });
    }
  },
};
