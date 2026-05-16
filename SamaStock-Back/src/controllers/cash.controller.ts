import { Request, Response } from "express";
import * as cashService from "../services/cash.service";

export const openCash = async (req: Request, res: Response) => {
  try {
    const { userId, openingAmount } = req.body;

    const session = await cashService.openCashSession(
      Number(userId),
      Number(openingAmount)
    );

    return res.status(201).json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const closeCash = async (req: Request, res: Response) => {
  try {
    const session = await cashService.closeCashSession();

    return res.json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const currentCash = async (req: Request, res: Response) => {
  try {
    const session = await cashService.getCurrentSession();
    return res.json(session);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const createMovement = async (req: Request, res: Response) => {
  try {
    const movement = await cashService.addCashMovement(req.body);

    return res.status(201).json({
      success: true,
      data: movement,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const historyCash = async (req: Request, res: Response) => {
  try {
    const history = await cashService.getCashHistory();
    return res.json(history);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};