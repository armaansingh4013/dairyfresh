import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getSession, loginStaff, requestOtp, verifyOtp } from "../controllers/auth.controller.js";

const router = Router();

router.post("/staff-login", asyncHandler(loginStaff));
router.post("/request-otp", asyncHandler(requestOtp));
router.post("/verify-otp", asyncHandler(verifyOtp));
router.get("/session", asyncHandler(getSession));

export default router;
