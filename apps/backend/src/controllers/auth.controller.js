// import { ensureCoreDemoData, ensureDemoCustomerData } from "../services/demo.service.js";
// import { findUserByPhone, getUserById, upsertUserByPhone } from "../services/auth.service.js";
// import { badRequest, notFound } from "../utils/response.js";
// import { createSessionToken, readSessionToken, sanitizeUser } from "../utils/session.js";
// import { requestOtpSchema, verifyOtpSchema } from "../validations/auth.validation.js";

// export async function requestOtp(req, res) {
//   const parsed = requestOtpSchema.safeParse(req.body);
//   if (!parsed.success) throw badRequest("Invalid phone");

//   await ensureCoreDemoData();

//   res.json({
//     success: true,
//     otpHint: "1111",
//     message: "Use 1111 as the demo OTP."
//   });
// }

// export async function verifyOtp(req, res) {
//   const parsed = verifyOtpSchema.safeParse(req.body);
//   if (!parsed.success) throw badRequest("Invalid payload");

//   if (parsed.data.otp !== "1111") {
//     const error = new Error("Invalid OTP. Use 1111 for demo login.");
//     error.status = 401;
//     throw error;
//   }

//   await ensureCoreDemoData();

//   const existingUser = await findUserByPhone(parsed.data.phone);
//   const user = await upsertUserByPhone(parsed.data);

//   if (!existingUser) {
//     await ensureDemoCustomerData(user);
//   }

//   res.json({
//     token: createSessionToken(user),
//     user: sanitizeUser(user)
//   });
// }

// export async function getSession(req, res) {
//   const session = readSessionToken(req.headers.authorization);
//   if (!session?.userId) {
//     const error = new Error("Invalid session");
//     error.status = 401;
//     throw error;
//   }

//   const user = await getUserById(session.userId);
//   if (!user) throw notFound("User not found");

//   res.json({
//     token: createSessionToken(user),
//     user: sanitizeUser(user)
//   });
// }




import { ensureCoreDemoData, ensureDemoCustomerData } from "../services/demo.service.js";
import {
  findUserByEmail,
  findUserByPhone,
  getUserById,
  requestEmailOtp,
  upsertUserByPhone,
  verifyEmailOtp
} from "../services/auth.service.js";
import { badRequest, notFound } from "../utils/response.js";
import { createSessionToken, readSessionToken, sanitizeUser } from "../utils/session.js";
import { requestOtpSchema, verifyOtpSchema } from "../validations/auth.validation.js";

export async function requestOtp(req, res) {
  const parsed = requestOtpSchema.safeParse(req.body);
  if (!parsed.success) throw badRequest("Invalid phone/email");

  await ensureCoreDemoData();

console.log('====================================');
console.log('Requesting OTP for:', parsed.data);
console.log('====================================');
  if (parsed.data.email) {
    const existingUser = await findUserByEmail(parsed.data.email);
    if (parsed.data.email.endsWith("@dairy.local")) {
      return res.json({
        success: true,
        channel: "EMAIL",
        otpHint: "1111",
        message: "Use 1111 as the demo OTP."
      });
    }

    const result = await requestEmailOtp({
      email: parsed.data.email,
      name: parsed.data.name || parsed.data.emailName
    });

    return res.json({
      success: true,
      channel: "EMAIL",
      email: result.email,
      expiresAt: result.expiresAt
    });
  }

  return res.json({
    success: true,
    otpHint: "1111",
    message: "Use 1111 as the demo OTP for phone login."
  });
}

export async function verifyOtp(req, res) {
  const parsed = verifyOtpSchema.safeParse(req.body);
  if (!parsed.success) throw badRequest("Invalid payload");

  await ensureCoreDemoData();

  if (parsed.data.email) {
    const localDemoUser = parsed.data.email.endsWith("@dairy.local")
      ? await findUserByEmail(parsed.data.email)
      : null;

    if (localDemoUser) {
      if (parsed.data.otp !== "1111") {
        const error = new Error("Invalid OTP. Use 1111 for demo login.");
        error.status = 401;
        throw error;
      }

      return res.json({
        token: createSessionToken(localDemoUser),
        user: sanitizeUser(localDemoUser)
      });
    }

    const verified = await verifyEmailOtp({
      email: parsed.data.email,
      otp: parsed.data.otp,
      name: parsed.data.name
    });

    if (!verified.ok) {
      const error = new Error(verified.reason || "Invalid OTP");
      error.status = 401;
      throw error;
    }

    if (verified.user.role === "CUSTOMER") {
      await ensureDemoCustomerData(verified.user);
    }

    return res.json({
      token: createSessionToken(verified.user),
      user: sanitizeUser(verified.user)
    });
  }

  if (parsed.data.otp !== "1111") {
    const error = new Error("Invalid OTP. Use 1111 for demo phone login.");
    error.status = 401;
    throw error;
  }

  const existingUser = await findUserByPhone(parsed.data.phone);
  const user = await upsertUserByPhone({
    phone: parsed.data.phone,
    name: parsed.data.name
  });

  if (!existingUser && user.role === "CUSTOMER") {
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
