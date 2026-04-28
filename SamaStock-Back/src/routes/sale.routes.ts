import { Router } from "express";
import {
  getSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale,
  addSalePayment,
} from "../controllers/sale.controller";
import { protect, authorizeRoles } from "../middlewares/auth.middleware";

console.log("SALE ROUTES FILE LOADED");

const router = Router();

// route de test
router.get("/test-payment-route", (_req, res) => {
  return res.status(200).json({
    message: "sale payment route loaded",
  });
});

// paiement complémentaire
router.patch(
  "/:id/payment",
  protect,
  authorizeRoles("admin", "employee"),
  addSalePayment
);

// autres routes
router.get("/", protect, authorizeRoles("admin", "employee"), getSales);
router.get("/:id", protect, authorizeRoles("admin", "employee"), getSaleById);
router.post("/", protect, authorizeRoles("admin", "employee"), createSale);
router.put("/:id", protect, authorizeRoles("admin", "employee"), updateSale);
router.delete("/:id", protect, authorizeRoles("admin"), deleteSale);

export default router;