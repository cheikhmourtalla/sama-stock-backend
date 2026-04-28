import { Router } from "express";
import { getDashboardStats } from "../controllers/dashboard.controller";
import { authorizeRoles, protect } from "../middlewares/auth.middleware";

const router = Router();

router.get("/stats", protect, authorizeRoles("admin", "employee"), getDashboardStats);

export default router;