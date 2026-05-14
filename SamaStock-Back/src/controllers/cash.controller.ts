import { Request, Response } from "express";
import { cashService } from "../services/cash.service";

export const cashController = {
  async addOperation(req: Request, res: Response) {
    const data = await cashService.addOp(req.body);

    return res
      .status(201)
      .json({ success: true, data, message: "depend du type" });
  },

  async cash(req: Request, res: Response) {
    const data = await cashService.findOps();

    return res
      .status(201)
      .json({ success: true, data, message: "Caisse operations" });
  },
};
