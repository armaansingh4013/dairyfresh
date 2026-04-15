import crypto from "crypto";

const SCRYPT_KEYLEN = 64;

function normalizeUsernamePart(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function scryptAsync(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, SCRYPT_KEYLEN, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });
}

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt);
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password, storedHash) {
  if (!storedHash || !password) return false;

  const [salt, key] = String(storedHash).split(":");
  if (!salt || !key) return false;

  const derivedKey = await scryptAsync(password, salt);
  return crypto.timingSafeEqual(Buffer.from(key, "hex"), derivedKey);
}

export function buildUsernameCandidates({ name, email, role }) {
  const fromEmail = normalizeUsernamePart(String(email || "").split("@")[0]);
  const fromName = normalizeUsernamePart(name);
  const fromRole = normalizeUsernamePart(role);

  return [fromEmail, fromName, fromRole, "user"].filter(Boolean);
}

export function normalizeUsername(value) {
  return normalizeUsernamePart(value);
}
