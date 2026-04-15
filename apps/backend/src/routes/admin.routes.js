import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import {
  createOperationalUserController,
  generateDailyDeliveries,
  generateMonthlyInvoices,
  getAdminDeliveries,
  getAdminInvoices,
  getAdminOrders,
  updateAdminOrderStatusController,
  getCustomerDetail,
  getCustomers,
  getDailyDeliveries,
  getOperationalUsers,
  getReportsSummary,
  getSubscriptionDetail,
  getSubscriptions,
  getSubscriptionsSummary
} from "../controllers/admin.controller.js";

const router = Router();

router.use(asyncHandler(requireAuth));
router.use(requireRole("ADMIN"));

router.get("/deliveries/daily", asyncHandler(getDailyDeliveries));
router.get("/deliveries", asyncHandler(getAdminDeliveries));
router.get("/orders", asyncHandler(getAdminOrders));
router.patch("/orders/:orderId", asyncHandler(updateAdminOrderStatusController));
router.get("/subscriptions/summary", asyncHandler(getSubscriptionsSummary));
router.get("/subscriptions", asyncHandler(getSubscriptions));
router.get("/subscriptions/:planId", asyncHandler(getSubscriptionDetail));
router.get("/customers", asyncHandler(getCustomers));
router.get("/customers/:customerId", asyncHandler(getCustomerDetail));
router.get("/invoices", asyncHandler(getAdminInvoices));
router.get("/reports/summary", asyncHandler(getReportsSummary));
router.get("/users", asyncHandler(getOperationalUsers));
router.post("/users", asyncHandler(createOperationalUserController));
router.post("/deliveries/generate", asyncHandler(generateDailyDeliveries));
router.post("/invoices/generate", asyncHandler(generateMonthlyInvoices));

export default router;
