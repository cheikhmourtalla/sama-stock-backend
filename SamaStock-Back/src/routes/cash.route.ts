import { Router } from "express";
import { authorizeRoles, protect } from "../middlewares/auth.middleware";
import { cashController } from "../controllers/cash.controller";

const router = Router();

// DOCUMENT ROUTE
router.get(
    "/summary",
    protect,
    authorizeRoles("admin"),
    cashController.summary,
);
router.post("/", protect, authorizeRoles("admin"), cashController.addOperation);
router.get("/", protect, authorizeRoles("admin"), cashController.cash);
router.post("/", protect, authorizeRoles("admin"));
router.get("/:opId", protect, authorizeRoles("admin"));

export default router;
