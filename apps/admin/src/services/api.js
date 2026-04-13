export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const SESSION_KEY = "dairy-admin-session";

export function readStoredSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeStoredSession(session) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  window.localStorage.removeItem(SESSION_KEY);
}

function getSessionToken() {
  return readStoredSession()?.token || null;
}

async function request(path, options = {}) {
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {})
  };
  const token = getSessionToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    let message = "Request failed";
    try {
      const payload = await res.json();
      message = payload.error || message;
    } catch {
      message = res.statusText || message;
    }
    throw new Error(message);
  }

  return res.json();
}

export async function apiGet(path) {
  return request(path);
}

export async function apiPost(path, body) {
  return request(path, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function apiPatch(path, body) {
  return request(path, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}
