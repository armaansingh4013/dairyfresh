import { Platform } from "react-native";
import { clearCacheEntries, readCache, writeCache } from "./cache";

const DEFAULT_API_BASE =
  Platform.OS === "android" ? "http://10.0.2.2:4000" : "http://localhost:4000";

export const API_BASE = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_BASE;

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

export async function apiGetCached(path, token, options = {}) {
  const maxAgeMs = options.maxAgeMs ?? 60_000;
  const key = options.key || path;

  if (!options.force) {
    const cached = await readCache(key, maxAgeMs);
    if (cached) {
      return cached;
    }
  }

  const data = await request(path, {}, token);
  await writeCache(key, data);
  return data;
}

export async function invalidateCache(keys = []) {
  return clearCacheEntries(keys);
}
