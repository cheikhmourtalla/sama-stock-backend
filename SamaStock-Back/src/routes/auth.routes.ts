import { Router } from "express";
import  loginController  from "../controllers/auth.controller.js";

const router = Router();


/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Connecter un utilisateur
 *     responses:
 *       200:
 *         description: Succès
 */

router.post("/login", loginController.login);

export default router;