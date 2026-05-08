import { Router } from "express";
import {
  clientController
} from "../controllers/client.controller";
import { authorizeRoles, protect } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", protect, authorizeRoles("admin", "employee"), clientController.getClients);
router.get("/:id", protect, authorizeRoles("admin", "employee"),clientController.getClient);
router.post("/", protect, authorizeRoles("admin", "employee"),clientController.createClient);
// router.put("/:id", protect, authorizeRoles("admin", "employee"), clientController.updateClient);
// router.delete("/:id", protect, authorizeRoles("admin"), clientController.deleteClient);

export default router;