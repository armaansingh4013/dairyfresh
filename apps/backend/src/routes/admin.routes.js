import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  generateDailyDeliveries,
  generateMonthlyInvoices,
  getAdminInvoices,
  getCustomerDetail,
  getCustomers,
  getDailyDeliveries,
  getReportsSummary,
  getSubscriptionDetail,
  getSubscriptions,
  getSubscriptionsSummary
} from "../controllers/admin.controller.js";

const router = Router();

router.get("/deliveries/daily", asyncHandler(getDailyDeliveries));
router.get("/subscriptions/summary", asyncHandler(getSubscriptionsSummary));
router.get("/subscriptions", asyncHandler(getSubscriptions));
router.get("/subscriptions/:planId", asyncHandler(getSubscriptionDetail));
router.get("/customers", asyncHandler(getCustomers));
router.get("/customers/:customerId", asyncHandler(getCustomerDetail));
router.get("/invoices", asyncHandler(getAdminInvoices));
router.get("/reports/summary", asyncHandler(getReportsSummary));
router.post("/deliveries/generate", asyncHandler(generateDailyDeliveries));
router.post("/invoices/generate", asyncHandler(generateMonthlyInvoices));

export default router;
