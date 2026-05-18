import { Request, Response } from "express";
import { supplierService } from "../services/supplier.service.js";
export const supplierController = {
  async createFournisseur(req: Request, res: Response) {
    const { body } = req;
    // console.log(body);
    const data = supplierService.create(body);
    return res
      .status(201)
      .json({ success: true, data, message: "Fournissseur cree" });
  },

  findSuppliers: async (req: Request, res: Response) => {
    const data = await supplierService.findSuppliers();
    return res
      .status(200)
      .json({ success: true, data, message: "Fournissseur cree" });
  },

  updateSuppliers: async (req: Request, res: Response) => {
    const sData = req.body;
    const { id } = req.params;
    const sId = Number(id);
    const data = await supplierService.update(sData, sId);
    return res
      .status(200)
      .json({ success: true, data, message: "Fournissseur  updated" });
  },
  deleteSuppliers: async (req: Request, res: Response) => {
    const sId = Number(req.params.id);
    const data = await supplierService.delete(sId);
    return res
      .status(200)
      .json({ success: true, data, message: "Fournissseur  supprimer" });
  },
};
