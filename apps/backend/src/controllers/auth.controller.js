import { ensureCoreDemoData, ensureDemoCustomerData } from "../services/demo.service.js";
import { findUserByPhone, getUserById, upsertUserByPhone } from "../services/auth.service.js";
import { badRequest, notFound } from "../utils/response.js";
import { createSessionToken, readSessionToken, sanitizeUser } from "../utils/session.js";
import { requestOtpSchema, verifyOtpSchema } from "../validations/auth.validation.js";

export async function requestOtp(req, res) {
  const parsed = requestOtpSchema.safeParse(req.body);
  if (!parsed.success) throw badRequest("Invalid phone");

  await ensureCoreDemoData();

  res.json({
    success: true,
    otpHint: "1111",
    message: "Use 1111 as the demo OTP."
  });
}

export async function verifyOtp(req, res) {
  const parsed = verifyOtpSchema.safeParse(req.body);
  if (!parsed.success) throw badRequest("Invalid payload");

  if (parsed.data.otp !== "1111") {
    const error = new Error("Invalid OTP. Use 1111 for demo login.");
    error.status = 401;
    throw error;
  }

  await ensureCoreDemoData();

  const existingUser = await findUserByPhone(parsed.data.phone);
  const user = await upsertUserByPhone(parsed.data);

  if (!existingUser) {
    await ensureDemoCustomerData(user);
  }

  res.json({
    token: createSessionToken(user),
    user: sanitizeUser(user)
  });
}

export async function getSession(req, res) {
  const session = readSessionToken(req.headers.authorization);
  if (!session?.userId) {
    const error = new Error("Invalid session");
    error.status = 401;
    throw error;
  }

  const user = await getUserById(session.userId);
  if (!user) throw notFound("User not found");

  res.json({
    token: createSessionToken(user),
    user: sanitizeUser(user)
  });
}