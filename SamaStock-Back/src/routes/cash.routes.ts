import { Router } from "express";
import { cashController } from "../controllers/cash.controller";
import { authorizeRoles, protect } from "../middlewares/auth.middleware";

const router = Router();

router.post(
  "/open",
  protect,
  authorizeRoles("admin", "employee"),
  cashController.openCash,
);
router.post(
  "/close",
  protect,
  authorizeRoles("admin", "employee"),
  cashController.closeCash,
);
router.get(
  "/current",
  protect,
  authorizeRoles("admin", "employee"),
  cashController.currentCash,
);
router.get(
  "/history",
  protect,
  authorizeRoles("admin", "employee"),
  cashController.historyCash,
);
router.post(
  "/movement",
  protect,
  authorizeRoles("admin", "employee"),
  cashController.createMovement,
);

export default router;
