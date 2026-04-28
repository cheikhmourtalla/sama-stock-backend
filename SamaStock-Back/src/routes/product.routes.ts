import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getLowStockProducts,
  getOutOfStockProducts,
  getProductById,
  getProducts,
  updateProduct,
} from "../controllers/product.controller";
import { authorizeRoles, protect } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", protect, authorizeRoles("admin", "employee"), getProducts);
router.get(
  "/low-stock",
  protect,
  authorizeRoles("admin", "employee"),
  getLowStockProducts
);
router.get(
  "/out-of-stock",
  protect,
  authorizeRoles("admin", "employee"),
  getOutOfStockProducts
);
router.get("/:id", protect, authorizeRoles("admin", "employee"), getProductById);

router.post("/", protect, authorizeRoles("admin"), createProduct);
router.put("/:id", protect, authorizeRoles("admin"), updateProduct);
router.delete("/:id", protect, authorizeRoles("admin"), deleteProduct);

export default router;