import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createOrderController,
  getPlanOrdersController,
  getUserOrdersController
} from "../controllers/orders.controller.js";

const router = Router();

router.post("/", asyncHandler(createOrderController));
router.get("/users/:userId", asyncHandler(getUserOrdersController));

router.get("/plan/:planId", asyncHandler(getPlanOrdersController));

export default router;