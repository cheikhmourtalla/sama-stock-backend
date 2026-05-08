import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller";
import { authorizeRoles, protect } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Statistiques globales du système
 */

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Récupérer les statistiques générales du tableau de bord
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalSales:
 *                   type: number
 *                   example: 15400
 *                 totalProducts:
 *                   type: number
 *                   example: 120
 *                 totalClients:
 *                   type: number
 *                   example: 45
 *                 recentActivity:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (Rôles insuffisants)
 */
router.get("/stats", protect, authorizeRoles("admin", "employee"), dashboardController.getDashboardStats);

export default router;
