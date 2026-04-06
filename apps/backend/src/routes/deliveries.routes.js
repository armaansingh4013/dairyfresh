import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { updateDeliveryController } from "../controllers/deliveries.controller.js";

const router = Router();

router.patch("/:deliveryId", asyncHandler(updateDeliveryController));

export default router;