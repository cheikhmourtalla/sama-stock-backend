import { Router } from "express";
import { productController } from "../controllers/product.controller.js";
import { authorizeRoles, protect } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Produits
 *   description: Gestion de l'inventaire des produits
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Récupérer tous les produits
 *     tags: [Produits]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des produits récupérée
 */
router.get("/", protect, authorizeRoles("admin", "employee"), productController.getProducts);

/**
 * @swagger
 * /api/products/low-stock:
 *   get:
 *     summary: Liste des produits en stock faible
 *     tags: [Produits]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Produits en dessous du seuil d'alerte
 */
router.get("/low-stock", protect, authorizeRoles("admin", "employee"), productController.getLowStockProducts);

/**
 * @swagger
 * /api/products/out-of-stock:
 *   get:
 *     summary: Liste des produits en rupture de stock
 *     tags: [Produits]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Produits avec quantité à zéro
 */
router.get("/out-of-stock", protect, authorizeRoles("admin", "employee"), productController.getOutOfStockProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Récupérer un produit par son ID
 *     tags: [Produits]
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
 *         description: Détails du produit
 *       404:
 *         description: Produit non trouvé
 */
router.get("/:id", protect, authorizeRoles("admin", "employee"), productController.getProductById);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Créer un nouveau produit (Admin uniquement)
 *     tags: [Produits]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price, stockQuantity]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stockQuantity:
 *                 type: number
 *               categoryId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Produit créé avec succès
 */
router.post("/", protect, authorizeRoles("admin"), productController.createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Mettre à jour un produit (Admin uniquement)
 *     tags: [Produits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               stockQuantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Produit mis à jour
 */
router.put("/:id", protect, authorizeRoles("admin"), productController.updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Supprimer un produit (Admin uniquement)
 *     tags: [Produits]
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
 *         description: Produit supprimé
 */
router.delete("/:id", protect, authorizeRoles("admin"), productController.deleteProduct);

export default router;
