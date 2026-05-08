import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller";
import { authorizeRoles, protect } from "../middlewares/auth.middleware";

const router = Router();

router.get("/stats", protect, authorizeRoles("admin", "employee"), dashboardController.getDashboardStats);

export default router;