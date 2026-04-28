import { Router } from "express";
import {
  addStockEntry,
  addStockOut,
  getStockMovements,
} from "../controllers/stock.controller";
import { authorizeRoles, protect } from "../middlewares/auth.middleware";

const router = Router();

router.post("/entry", protect, authorizeRoles("admin", "employee"), addStockEntry);
router.post("/out", protect, authorizeRoles("admin", "employee"), addStockOut);
router.get(
  "/movements",
  protect,
  authorizeRoles("admin", "employee"),
  getStockMovements
);

export default router;