// controllers/cash.controller.ts
import { Request, Response } from "express";
import * as cashService from "../services/cash.service.js";
import loggerService from "../services/logger.service.js";

export const cashController = {
  async openCash(req: Request, res: Response) {
    const logger = loggerService.getLogger("CashController");
    const requestId = (req as any).requestId;
    const { userId, openingAmount } = req.body;

    logger.info(`Tentative d'ouverture de caisse`, {
      requestId,
      userId,
      openingAmount,
      ip: req.ip,
    });

    const session = await cashService.openCashSession(
      Number(userId),
      Number(openingAmount),
    );

    logger.info(`Caisse ouverte avec succès`, {
      requestId,
      userId,
      sessionId: session?.id,
      openingAmount,
    });

    return res.status(201).json({
      success: true,
      data: session,
    });
  },

  async closeCash(req: Request, res: Response) {
    const logger = loggerService.getLogger("CashController");
    const requestId = (req as any).requestId;

    logger.info(`Tentative de fermeture de caisse`, {
      requestId,
      ip: req.ip,
    });

    const session = await cashService.closeCashSession();

    logger.info(`Caisse fermée avec succès`, {
      requestId,
      sessionId: session?.id,
    });

    return res.json({
      success: true,
      data: session,
    });
  },

  async currentCash(req: Request, res: Response) {
    const logger = loggerService.getLogger("CashController");
    const requestId = (req as any).requestId;

    logger.debug(`Récupération de la session courante`, {
      requestId,
      ip: req.ip,
    });

    const session = await cashService.getCurrentSession();

    return res.json(session);
  },

  async createMovement(req: Request, res: Response) {
    const logger = loggerService.getLogger("CashController");
    const requestId = (req as any).requestId;
    const movementData = req.body;

    logger.info(`Création d'un mouvement de caisse`, {
      requestId,
      movementType: movementData.type,
      amount: movementData.amount,
      ip: req.ip,
    });

    const movement = await cashService.addCashMovement(req.body);

    logger.info(`Mouvement de caisse créé avec succès`, {
      requestId,
      movementId: movement?.id,
      amount: movementData.amount,
      type: movementData.type,
    });

    return res.status(201).json({
      success: true,
      data: movement,
    });
  },

  async historyCash(req: Request, res: Response) {
    const logger = loggerService.getLogger("CashController");
    const requestId = (req as any).requestId;

    logger.debug(`Récupération de l'historique des caisses`, {
      requestId,
      ip: req.ip,
    });

    const history = await cashService.getCashHistory();

    return res.json(history);
  },
};
