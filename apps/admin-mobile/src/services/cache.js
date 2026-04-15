const SESSION_KEY = "dairy-admin-mobile:session";
const CACHE_PREFIX = "dairy-admin-mobile:cache:";
const memoryStore = new Map();

let storage = null;

try {
  storage = require("@react-native-async-storage/async-storage")?.default || null;
} catch {
  storage = null;
}

function cacheKey(key) {
  return `${CACHE_PREFIX}${key}`;
}

async function getItem(key) {
  if (storage?.getItem) {
    return storage.getItem(key);
  }
  return memoryStore.has(key) ? memoryStore.get(key) : null;
}

async function setItem(key, value) {
  if (storage?.setItem) {
    return storage.setItem(key, value);
  }
  memoryStore.set(key, value);
}

async function removeItem(key) {
  if (storage?.removeItem) {
    return storage.removeItem(key);
  }
  memoryStore.delete(key);
}

async function multiRemove(keys) {
  if (storage?.multiRemove) {
    return storage.multiRemove(keys);
  }
  keys.forEach((key) => memoryStore.delete(key));
}

export async function loadJson(key, fallback = null) {
  try {
    const raw = await getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export async function saveJson(key, value) {
  try {
    await setItem(key, JSON.stringify(value));
  } catch {
    // storage should not block the app
  }
}

export async function removeKey(key) {
  try {
    await removeItem(key);
  } catch {
    // no-op
  }
}

export async function loadSession() {
  return loadJson(SESSION_KEY, null);
}

export async function saveSession(session) {
  return saveJson(SESSION_KEY, session);
}

export async function clearSession() {
  return removeKey(SESSION_KEY);
}

export async function readCache(key, maxAgeMs) {
  const cached = await loadJson(cacheKey(key), null);
  if (!cached?.timestamp || typeof cached.data === "undefined") {
    return null;
  }
  if (Date.now() - cached.timestamp > maxAgeMs) {
    return null;
  }
  return cached.data;
}

export async function writeCache(key, data) {
  return saveJson(cacheKey(key), {
    timestamp: Date.now(),
    data
  });
}

export async function clearCacheEntries(keys = []) {
  try {
    await multiRemove(keys.map((key) => cacheKey(key)));
  } catch {
    // no-op
  }
}
