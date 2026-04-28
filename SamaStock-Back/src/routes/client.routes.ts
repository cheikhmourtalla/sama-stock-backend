import { Router } from "express";
import {
  createClient,
  deleteClient,
  getClientById,
  getClients,
  updateClient,
} from "../controllers/client.controller";
import { authorizeRoles, protect } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", protect, authorizeRoles("admin", "employee"), getClients);
router.get("/:id", protect, authorizeRoles("admin", "employee"), getClientById);
router.post("/", protect, authorizeRoles("admin", "employee"), createClient);
router.put("/:id", protect, authorizeRoles("admin", "employee"), updateClient);
router.delete("/:id", protect, authorizeRoles("admin"), deleteClient);

export default router;