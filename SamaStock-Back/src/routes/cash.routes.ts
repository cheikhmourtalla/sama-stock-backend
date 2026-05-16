import { Router } from "express";
import {
  openCash,
  closeCash,
  currentCash,
  createMovement,
  historyCash,
} from "../controllers/cash.controller";

const router = Router();

router.post("/open", openCash);
router.post("/close", closeCash);
router.get("/current", currentCash);
router.get("/history", historyCash);
router.post("/movement", createMovement);

export default router;