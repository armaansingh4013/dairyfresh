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
import {
  buildUsernameCandidates,
  hashPassword,
  normalizeUsername,
  verifyPassword
} from "./password.service.js";

export async function findUserByPhone(phone) {
  return User.findOne({ phone });
}

export async function findUserByEmail(email) {
  return User.findOne({ email });
}

export async function findUserByUsername(username) {
  return User.findOne({ username: normalizeUsername(username) });
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

export async function createUniqueUsername(payload) {
  const candidates = buildUsernameCandidates(payload);

  for (const candidate of candidates) {
    const normalized = normalizeUsername(candidate);
    if (!normalized) continue;

    const exists = await User.exists({ username: normalized });
    if (!exists) {
      return normalized;
    }
  }

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const base = normalizeUsername(candidates[0] || "user");
    const generated = `${base || "user"}-${Math.random().toString(36).slice(2, 6)}`;
    const exists = await User.exists({ username: generated });
    if (!exists) {
      return generated;
    }
  }

  throw new Error("Unable to create username");
}

export async function authenticateOperationalUser({ username, password }) {
  const identifier = String(username || "").trim().toLowerCase();
  const user =
    (identifier.includes("@") ? await findUserByEmail(identifier) : null) ||
    (await findUserByUsername(identifier));

  if (!user || !["ADMIN", "DELIVERY"].includes(user.role)) {
    return null;
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  return isValid ? user : null;
}

export async function listOperationalUsers() {
  return User.find({ role: { $in: ["ADMIN", "DELIVERY"] } }).sort({ createdAt: -1 });
}

export async function createOperationalUser({ name, email, phone, password, role }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedPhone = String(phone || "").trim();

  const [existingEmail, existingPhone] = await Promise.all([
    User.findOne({ email: normalizedEmail }),
    User.findOne({ phone: normalizedPhone })
  ]);

  if (existingEmail) {
    const error = new Error("Email already exists");
    error.status = 409;
    throw error;
  }

  if (existingPhone) {
    const error = new Error("Phone number already exists");
    error.status = 409;
    throw error;
  }

  const username = await createUniqueUsername({ name, email: normalizedEmail, role });
  const passwordHash = await hashPassword(password);

  return User.create({
    username,
    name: String(name || "").trim(),
    email: normalizedEmail,
    phone: normalizedPhone,
    role,
    isEmailVerified: true,
    passwordHash
  });
}
