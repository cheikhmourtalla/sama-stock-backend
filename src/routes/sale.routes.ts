import { Router } from "express";
import { saleController } from "../controllers/sale.controller.js";
import { protect, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Ventes
 *   description: Gestion des transactions et paiements
 */

/**
 * @swagger
 * /api/sales/test-payment-route:
 *   get:
 *     summary: Vérifier si le module de paiement est chargé
 *     tags: [Ventes]
 *     responses:
 *       200:
 *         description: Succès
 */
router.get("/test-payment-route", (_req, res) => {
  return res.status(200).json({ message: "sale payment route loaded" });
});

/**
 * @swagger
 * /api/sales:
 *   get:
 *     summary: Récupérer toutes les ventes
 *     tags: [Ventes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des transactions
 */
router.get("/", protect, authorizeRoles("admin", "employee"), saleController.getSales);



/**
 * @swagger
 * /api/sales:
 *   post:
 *     summary: Enregistrer une nouvelle vente
 *     tags: [Ventes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [clientId, items]
 *             properties:
 *               clientId:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *               amountPaid:
 *                 type: number
 *     responses:
 *       201:
 *         description: Vente créée
 */
router.post("/", protect, authorizeRoles("admin", "employee"), saleController.createSale);



/**
 * @swagger
 * /api/sales/{id}:
 *   get:
 *     summary: Détails d'une vente spécifique
 *     tags: [Ventes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Informations sur la vente et les articles
 */
router.get("/:id", protect, authorizeRoles("admin", "employee"), saleController.getSaleById);


/**
 * @swagger
 * /api/sales/{id}/payment:
 *   patch:
 *     summary: Ajouter un paiement complémentaire à une vente
 *     tags: [Ventes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Montant ajouté au paiement actuel
 *     responses:
 *       200:
 *         description: Paiement mis à jour
 */
router.patch("/:id/payment", protect, authorizeRoles("admin", "employee"), saleController.addSalePayment);

/**
 * @swagger
 * /api/sales/{id}:
 *   put:
 *     summary: Modifier une vente existante
 *     tags: [Ventes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vente modifiée
 */
router.put("/:id", protect, authorizeRoles("admin", "employee"), saleController.updateSale);

/**
 * @swagger
 * /api/sales/{id}:
 *   delete:
 *     summary: Supprimer une vente (Admin uniquement)
 *     tags: [Ventes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vente annulée/supprimée
 */
router.delete("/:id", protect, authorizeRoles("admin"), saleController.deleteSale);

export default router;
