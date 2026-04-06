import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  generateDailyDeliveries,
  generateMonthlyInvoices,
  getAdminInvoices,
  getDailyDeliveries,
  getReportsSummary,
  getSubscriptions,
  getSubscriptionsSummary
} from "../controllers/admin.controller.js";

const router = Router();

router.get("/deliveries/daily", asyncHandler(getDailyDeliveries));
router.get("/subscriptions/summary", asyncHandler(getSubscriptionsSummary));
router.get("/subscriptions", asyncHandler(getSubscriptions));
router.get("/invoices", asyncHandler(getAdminInvoices));
router.get("/reports/summary", asyncHandler(getReportsSummary));
router.post("/deliveries/generate", asyncHandler(generateDailyDeliveries));
router.post("/invoices/generate", asyncHandler(generateMonthlyInvoices));

export default router;