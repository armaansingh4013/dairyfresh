// import { User } from "../models/index.js";

// export async function findUserByPhone(phone) {
//   return User.findOne({ phone });
// }

// export async function upsertUserByPhone({ phone, name, email }) {
//   let user = await User.findOne({ phone });

//   if (user) {
//     if (name) user.name = name;
//     if (email) user.email = email;
//     await user.save();
//     return user;
//   }

//   return User.create({
//     phone,
//     ...(name ? { name } : {}),
//     ...(email ? { email } : {})
//   });
// }

// export async function getUserById(userId) {
//   return User.findById(userId);
// }


import { User } from "../models/index.js";
import {
  generateOtp,
  getOtpExpiryDate,
  hashOtp,
  sendOtpEmail,
  verifyOtp as verifyOtpCode
} from "./otp.services.js";

export async function findUserByPhone(phone) {
  return User.findOne({ phone });
}

export async function findUserByEmail(email) {
  return User.findOne({ email });
}

export async function getUserById(userId) {
  return User.findById(userId);
}

export async function upsertUserByPhone({ phone, name, email }) {
  let user = await User.findOne({ phone });

  if (user) {
    if (name) user.name = name;
    if (email) user.email = email;
    await user.save();
    return user;
  }

  return User.create({
    phone,
    ...(name ? { name } : {}),
    ...(email ? { email } : {})
  });
}

export async function upsertUserByEmail({ email, name, phone }) {
  let user = await User.findOne({ email });

  if (user) {
    if (name) user.name = name;
    if (phone) user.phone = phone;
    await user.save();
    return user;
  }
console.log("Creating new user with email:", email, "name:", name, "phone:", phone);

  return User.create({
    email,
    ...(name ? { name } : {}),
    ...(phone ? { phone } : {})
  });
}

export async function requestEmailOtp({ email, name }) {
  console.log("Requesting email OTP for:", { email, name }
  );
  
  const user = await upsertUserByEmail({ email, name });
console.log("Upserted user for email OTP:", user);

  const otp = generateOtp(6);
  user.otpHash = hashOtp(otp);
  user.otpExpiresAt = getOtpExpiryDate();
  user.otpChannel = "EMAIL";
  await user.save();

  await sendOtpEmail({
    to: email,
    otp,
    name: user.name || name || "there"
  });

  return {
    success: true,
    email,
    expiresAt: user.otpExpiresAt
  };
}

export async function verifyEmailOtp({ email, otp, name, phone }) {
  const user = await User.findOne({ email });
  if (!user) {
    return { ok: false, reason: "User not found" };
  }

  const result = verifyOtpCode({
    plainOtp: otp,
    hashedOtp: user.otpHash,
    expiresAt: user.otpExpiresAt
  });

  if (!result.ok) {
    return result;
  }

  if (name) user.name = name;
  if (phone) user.phone = phone;

  user.isEmailVerified = true;
  user.otpHash = null;
  user.otpExpiresAt = null;
  user.otpChannel = null;

  await user.save();

  return {
    ok: true,
    user
  };
}