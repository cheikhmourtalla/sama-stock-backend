// controllers/auth.controller.ts
import { Request, Response } from "express";
import { AuthService } from "../services/auth.service.js";
import { env } from "../config/env/env.js";
import loggerService from "../services/logger.service.js";

const loginController = {
  async login(req: Request, res: Response) {
    // Logger du contrôleur
    const logger = loggerService.getLogger("AuthController");
    const requestId = (req as any).requestId;

    // Validate Data entry
    const { email, password } = req.body;

    // Log de la tentative de connexion
    logger.info(`Tentative de connexion: ${email}`, {
      requestId,
      email,
      ip: req.ip,
    });

    const token = await AuthService.login(email, password);

    // Log de succès
    logger.info(`Connexion réussie: ${email}`, {
      requestId,
      email,
      ip: req.ip,
    });

    return res.status(200).json({ success: true, token, message: "ok" });
  },
};

export default loginController;
