import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  updatePlanController,
  upsertPlanDaysController
} from "../controllers/plans.controller.js";

const router = Router();

router.patch("/:planId", asyncHandler(updatePlanController));
router.post("/:planId/days", asyncHandler(upsertPlanDaysController));

export default router;