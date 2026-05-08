import { Request, Response } from "express";
import { StockService } from "../services/stock.service";

export const stockController = {

  // entry
  async addStockEntry(
    req: Request,
    res: Response,
  ) {

    const {
      productId,
      quantity,
      note,
    } = req.body;

    const result =
      await StockService.addStockEntry(
        Number(productId),
        Number(quantity),
        note,
      );

    return res.status(201).json({
      success: true,
      message:
        "Entrée de stock enregistrée avec succès",
      product: result.product,
      movement: result.movement,
    });
  },

  // out
  async addStockOut(
    req: Request,
    res: Response,
  ) {

    const {
      productId,
      quantity,
      note,
    } = req.body;

    const result =
      await StockService.addStockOut(
        Number(productId),
        Number(quantity),
        note,
      );

    return res.status(201).json({
      success: true,
      message:
        "Sortie de stock enregistrée avec succès",
      product: result.product,
      movement: result.movement,
    });
  },

  // movements
  async getStockMovements(
    _req: Request,
    res: Response,
  ) {

    const movements =
      await StockService.getStockMovements();

    return res.status(200).json({
      success: true,
      data: movements,
    });
  },
};