const API_BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

async function request(path, options = {}, token) {
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {})
  };

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

export async function apiGet(path, token) {
  return request(path, {}, token);
}

export async function apiPost(path, body, token) {
  return request(
    path,
    {
      method: "POST",
      body: JSON.stringify(body)
    },
    token
  );
}

export async function apiPatch(path, body, token) {
  return request(
    path,
    {
      method: "PATCH",
      body: JSON.stringify(body)
    },
    token
  );
}
