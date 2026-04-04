import { Router } from "express";
import { z } from "zod";
import { ensureCoreDemoData, ensureDemoCustomerData } from "../lib/demo.js";
import { findUserByPhone, getUserById, upsertUserByPhone } from "../lib/store.js";
import { createSessionToken, readSessionToken, sanitizeUser } from "../lib/session.js";

const router = Router();

router.post("/request-otp", async (req, res) => {
  const body = z.object({ phone: z.string().min(8) }).safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({ error: "Invalid phone" });
  }

  ensureCoreDemoData();

  res.json({
    success: true,
    otpHint: "1111",
    message: "Use 1111 as the demo OTP."
  });
});

router.post("/verify-otp", async (req, res) => {
  const body = z
    .object({
      phone: z.string().min(8),
      otp: z.string().min(4),
      name: z.string().min(1).optional(),
      email: z.string().email().optional()
    })
    .safeParse(req.body);

  if (!body.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  if (body.data.otp !== "1111") {
    return res.status(401).json({ error: "Invalid OTP. Use 1111 for demo login." });
  }

  ensureCoreDemoData();

  const existingUser = findUserByPhone(body.data.phone);
  const user = upsertUserByPhone(body.data);
  if (!existingUser) {
    ensureDemoCustomerData(user);
  }

  res.json({
    token: createSessionToken(user),
    user: sanitizeUser(user)
  });
});

router.get("/session", async (req, res) => {
  const session = readSessionToken(req.headers.authorization);
  if (!session?.userId) {
    return res.status(401).json({ error: "Invalid session" });
  }

  const user = getUserById(session.userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({
    token: createSessionToken(user),
    user: sanitizeUser(user)
  });
});

export default router;
