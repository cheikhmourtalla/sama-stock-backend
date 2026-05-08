import { Request, Response } from "express";
import { DashboardService } from "../services/dashboard.service";

export const dashboardController = {

  async getDashboardStats(
    _req: Request,
    res: Response
  ) {

    const stats =
      await DashboardService.getDashboardStats();

    return res.status(200).json({
      success: true,
      data: stats,
      message: "Dashboard statistics",
    });
  },
};