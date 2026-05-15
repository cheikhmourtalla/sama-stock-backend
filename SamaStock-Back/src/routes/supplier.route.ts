import { supplierController } from "./../controllers/supplier.controller";
import { Router } from "express";
import { authorizeRoles, protect } from "../middlewares/auth.middleware";
const router = Router();

/**
 * @swagger
 * tags :
 *   name : Fournisseur
 *   description: Gestion des fournisseurs
 */

/**
 * @swagger
 * /api/suppliers:
 *   post:
 *     summary: Ajouter un fournisseur chaque produit ajouter est lier a un fournisseur
 *     tags: [Fournisseur]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *         description: Fournisseur ajouter  avec succès
 */
router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  supplierController.createFournisseur,
);
router.get(
  "/",
  protect,
  authorizeRoles("admin", "employee"),
  supplierController.findSuppliers,
);
router.patch(
  "/:id",
  protect,
  authorizeRoles("admin"),
  supplierController.updateSuppliers,
);
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  supplierController.deleteSuppliers,
);

export default router;
