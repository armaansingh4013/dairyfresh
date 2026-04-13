import { getUserById } from "../services/auth.service.js";
import { readSessionToken, sanitizeUser } from "../utils/session.js";

export async function requireAuth(req, res, next) {
  const session = readSessionToken(req.headers.authorization);
  if (!session?.userId) {
    const error = new Error("Authentication required");
    error.status = 401;
    return next(error);
  }

  const user = await getUserById(session.userId);
  if (!user) {
    const error = new Error("User not found");
    error.status = 401;
    return next(error);
  }

  req.auth = {
    session,
    user,
    safeUser: sanitizeUser(user)
  };

  return next();
}

export function requireRole(...roles) {
  return function roleGuard(req, res, next) {
    const role = req.auth?.user?.role;
    if (!role || !roles.includes(role)) {
      const error = new Error("You do not have access to this resource");
      error.status = 403;
      return next(error);
    }

    return next();
  };
}
