import type { Request, Response } from "express";

import { SaleService } from "../services/sale.service";

import {
  CreateSaleSchema,
  UpdateSaleSchema,
  AddSalePaymentSchema,
} from "../dto/sale/sale.dto";

export const saleController = {
  // get all sales
  async getSales(_req: Request, res: Response) {
    const sales = await SaleService.getSales();

    return res.status(200).json({
      success: true,
      data: sales,
    });
  },

  // get one sale
  async getSaleById(req: Request, res: Response) {
    const id = Number(req.params.id);

    const sale = await SaleService.getSaleById(id);

    return res.status(200).json({
      success: true,
      data: sale,
    });
  },

  // create sale
  async createSale(req: Request, res: Response) {
    const validatedData = CreateSaleSchema.parse(req.body);

    const sale = await SaleService.createSale(validatedData);

    return res.status(201).json({
      success: true,
      data: sale,
      message: "Vente enregistrée avec succès",
    });
  },

  // update sale
  async updateSale(req: Request, res: Response) {
    const id = Number(req.params.id);

    const validatedData = UpdateSaleSchema.parse(req.body);

    const sale = await SaleService.updateSale(id, validatedData);

    return res.status(200).json({
      success: true,
      data: sale,
      message: "Vente modifiée avec succès",
    });
  },

  // delete sale
  async deleteSale(req: Request, res: Response) {
    const id = Number(req.params.id);

    await SaleService.deleteSale(id);

    return res.status(200).json({
      success: true,
      message: "Vente supprimée avec succès",
    });
  },

  // add payment
  async addSalePayment(req: Request, res: Response) {
    const saleId = Number(req.params.id);

    const validatedData = AddSalePaymentSchema.parse(req.body);

    const sale = await SaleService.createSale(req.body);

    return res.status(200).json({
      success: true,
      data: sale,
      message: "Paiement ajouté avec succès",
    });
  },
};
