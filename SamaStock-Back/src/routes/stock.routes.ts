import { Router } from "express";
import { stockController } from "../controllers/stock.controller";
import { authorizeRoles, protect } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Stock
 *   description: Gestion des mouvements de stock (Entrées/Sorties)
 */

/**
 * @swagger
 * /api/stock/entry:
 *   post:
 *     summary: Enregistrer une entrée de stock (Approvisionnement)
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, quantity]
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *                 description: Quantité à ajouter
 *               supplier:
 *                 type: string
 *                 description: Nom du fournisseur (optionnel)
 *     responses:
 *       201:
 *         description: Stock mis à jour avec succès
 */
router.post("/entry", protect, authorizeRoles("admin", "employee"), stockController.addStockEntry);

/**
 * @swagger
 * /api/stock/out:
 *   post:
 *     summary: Enregistrer une sortie de stock (Perte, Casse, etc.)
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, quantity, reason]
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *                 description: Quantité à retirer
 *               reason:
 *                 type: string
 *                 description: Raison de la sortie (ex. Casse, Périmé)
 *     responses:
 *       201:
 *         description: Sortie de stock enregistrée
 */
router.post("/out", protect, authorizeRoles("admin", "employee"), stockController.addStockOut);

/**
 * @swagger
 * /api/stock/movements:
 *   get:
 *     summary: Historique des mouvements de stock
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste de tous les mouvements (entrées et sorties)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get("/movements", protect, authorizeRoles("admin", "employee"), stockController.getStockMovements);

export default router;
