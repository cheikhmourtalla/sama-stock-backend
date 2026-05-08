import { Router } from "express";
import { productController } from "../controllers/product.controller";
import { authorizeRoles, protect } from "../middlewares/auth.middleware";

const router = Router();

router.get(
  "/",
  protect,
  authorizeRoles("admin", "employee"),
  productController.getProducts,
);
router.get(
  "/low-stock",
  protect,
  authorizeRoles("admin", "employee"),
  productController.getLowStockProducts,
);
router.get(
  "/out-of-stock",
  protect,
  authorizeRoles("admin", "employee"),
  productController.getOutOfStockProducts,
);
router.get(
  "/:id",
  protect,
  authorizeRoles("admin", "employee"),
  productController.getProductById,
);

router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  productController.createProduct,
);
router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  productController.updateProduct,
);
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  productController.deleteProduct,
);

export default router;
