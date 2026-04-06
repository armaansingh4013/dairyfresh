function encodeBase64(value) {
    return Buffer.from(value, "utf8").toString("base64url");
  }
  
  function decodeBase64(value) {
    return Buffer.from(value, "base64url").toString("utf8");
  }
  
  export function sanitizeUser(user) {
    if (!user) return null;
  
    return {
      id: user.id,
      role: user.role,
      phone: user.phone,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
  
  export function createSessionToken(user) {
    const payload = {
      userId: user.id,
      role: user.role,
      phone: user.phone
    };
  
    return encodeBase64(JSON.stringify(payload));
  }
  
  export function readSessionToken(rawHeader) {
    if (!rawHeader || typeof rawHeader !== "string") return null;
  
    const [scheme, token] = rawHeader.split(" ");
    if (scheme !== "Bearer" || !token) return null;
  
    try {
      return JSON.parse(decodeBase64(token));
    } catch {
      return null;
    }
  }