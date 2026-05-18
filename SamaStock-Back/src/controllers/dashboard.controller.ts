// controllers/dashboard.controller.ts
import { Request, Response } from "express";
import { DashboardService } from "../services/dashboard.service.js";
import loggerService from "../services/logger.service.js";

export const dashboardController = {

  async getDashboardStats(_req: Request, res: Response) {
    const logger = loggerService.getLogger("DashboardController");
    const requestId = (_req as any).requestId;

    logger.debug(`Récupération des statistiques du dashboard`, {
      requestId,
      ip: _req.ip
    });

    const stats = await DashboardService.getDashboardStats();

    logger.info(`Statistiques du dashboard récupérées`, {
      requestId,
      hasData: !!stats
    });

    return res.status(200).json({
      success: true,
      data: stats,
      message: "Dashboard statistics",
    });
  },
};