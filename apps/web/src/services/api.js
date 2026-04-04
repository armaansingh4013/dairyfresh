export const API_BASE = import.meta.env.VITE_API_URL || "https://dairyfresh.onrender.com";

function getSessionToken() {
  try {
    const raw = window.localStorage.getItem("dairy-session");
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session?.token || null;
  } catch {
    return null;
  }
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

export async function apiDelete(path) {
  return request(path, { method: "DELETE" });
}
