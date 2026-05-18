import { Request, Response } from "express";
import { StockService } from "../services/stock.service.js";
import loggerService from "../services/logger.service.js";

export const stockController = {
  // entry
  async addStockEntry(req: Request, res: Response) {
    const logger = loggerService.getLogger("StockController");
    const requestId = (req as any).requestId;
    const { productId, quantity, note, supplierId } = req.body;

    logger.info(`Tentative d'ajout d'entrée de stock`, {
      requestId,
      supplierId,
      productId,
      quantity,
      note,
      ip: req.ip,
    });

    const result = await StockService.addStockEntry(
      Number(supplierId),
      Number(productId),
      Number(quantity),
      note,
    );

    logger.info(`Entrée de stock ajoutée avec succès`, {
      requestId,
      productId,
      quantity,
      // newStock: result.product?.stock
    });

    return res.status(201).json({
      success: true,
      message: "Entrée de stock enregistrée avec succès",
      product: result.product,
      movement: result.movement,
    });
  },

  // out
  async addStockOut(req: Request, res: Response) {
    const logger = loggerService.getLogger("StockController");
    const requestId = (req as any).requestId;
    const { productId, quantity, note } = req.body;

    logger.info(`Tentative d'ajout de sortie de stock`, {
      requestId,
      productId,
      quantity,
      note,
      ip: req.ip,
    });

    const result = await StockService.addStockOut(
      Number(productId),
      Number(quantity),
      note,
    );

    logger.info(`Sortie de stock ajoutée avec succès`, {
      requestId,
      productId,
      quantity,
      // newStock: result.product?.stock
    });

    return res.status(201).json({
      success: true,
      message: "Sortie de stock enregistrée avec succès",
      product: result.product,
      movement: result.movement,
    });
  },

  // movements
  async getStockMovements(_req: Request, res: Response) {
    const logger = loggerService.getLogger("StockController");
    const requestId = (_req as any).requestId;

    logger.debug(`Récupération des mouvements de stock`, {
      requestId,
      ip: _req.ip,
    });

    const movements = await StockService.getStockMovements();

    logger.info(`Mouvements de stock récupérés`, {
      requestId,
      count: movements?.length || 0,
    });

    return res.status(200).json({
      success: true,
      data: movements,
    });
  },
};
