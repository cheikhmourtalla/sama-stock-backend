import { Router } from "express";
import { stockController } from "../controllers/stock.controller";
import { authorizeRoles, protect } from "../middlewares/auth.middleware";

const router = Router();

router.post(
  "/entry",
  protect,
  authorizeRoles("admin", "employee"),
  stockController.addStockEntry,
);
router.post(
  "/out",
  protect,
  authorizeRoles("admin", "employee"),
  stockController.addStockOut,
);
router.get(
  "/movements",
  protect,
  authorizeRoles("admin", "employee"),
  stockController.getStockMovements,
);

export default router;
