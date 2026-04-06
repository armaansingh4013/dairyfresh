import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createPaymentController } from "../controllers/billing.controller.js";

const router = Router();

router.post("/invoices/:invoiceId/payments", asyncHandler(createPaymentController));

export default router;