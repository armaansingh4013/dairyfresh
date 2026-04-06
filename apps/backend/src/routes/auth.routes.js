import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getSession, requestOtp, verifyOtp } from "../controllers/auth.controller.js";

const router = Router();

router.post("/request-otp", asyncHandler(requestOtp));
router.post("/verify-otp", asyncHandler(verifyOtp));
router.get("/session", asyncHandler(getSession));

export default router;