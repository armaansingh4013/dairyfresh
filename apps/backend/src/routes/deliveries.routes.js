import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getMyDeliveredDeliveriesController,
  getMyTodayDeliveriesController,
  updateDeliveryController
} from "../controllers/deliveries.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

router.use(asyncHandler(requireAuth));
router.get("/mine/today", requireRole("DELIVERY"), asyncHandler(getMyTodayDeliveriesController));
router.get(
  "/mine/delivered",
  requireRole("DELIVERY"),
  asyncHandler(getMyDeliveredDeliveriesController)
);
router.patch("/:deliveryId", requireRole("ADMIN", "DELIVERY"), asyncHandler(updateDeliveryController));

export default router;
