import type { Request, Response } from "express";

import { SaleService } from "../services/sale.service";

import {
  CreateSaleSchema,
  UpdateSaleSchema,
  AddSalePaymentSchema,
} from "../dto/sale/sale.dto";
import loggerService from "../services/logger.service";

export const saleController = {
  // get all sales
  async getSales(_req: Request, res: Response) {
    const logger = loggerService.getLogger("SaleController");
    const requestId = (_req as any).requestId;

    logger.debug(`Récupération de toutes les ventes`, {
      requestId,
      ip: _req.ip,
    });

    const sales = await SaleService.getSales();

    logger.info(`Liste des ventes récupérée`, {
      requestId,
      count: sales?.length || 0,
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
    const validatedData = CreateSaleSchema.parse(req.body);

    logger.info(`Tentative de création d'une nouvelle vente`, {
      requestId,
      clientId: validatedData.clientId,
      productId: validatedData.productId,
      quantity: validatedData.quantity,
      // totalAmount: validatedData.totalAmount,
      ip: req.ip,
    });

    const sale = await SaleService.createSale(validatedData);

    logger.info(`Vente créée avec succès`, {
      requestId,
      saleId: sale,
    });

    return res.status(201).json({
      success: true,
      data: sale,
      message: "Vente enregistrée avec succès",
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
      ip: req.ip,
    });

    const sale = await SaleService.addSalePayment(saleId, validatedData.amount);

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
};
