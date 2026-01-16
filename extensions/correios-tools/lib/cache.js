import { CACHE_KEYS, LIMITS, TIMEOUTS } from "../src/constants.js";

async function generateHash(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .slice(0, LIMITS.HASH_LENGTH / 2)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function parseTimestampFromKey(key) {
  const match = key.match(/_(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

function isExpired(timestamp, ttlMs = TIMEOUTS.CACHE_PANORAMA_TTL) {
  if (!timestamp) return true;
  return Date.now() - timestamp >= ttlMs;
}

export const Cache = {
  async get(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      if (data === null) return defaultValue;

      const parsed = JSON.parse(data);
      if (parsed.expiry && Date.now() > parsed.expiry) {
        localStorage.removeItem(key);
        return defaultValue;
      }

      return parsed.value !== undefined ? parsed.value : parsed;
    } catch {
      return defaultValue;
    }
  },

  async set(key, value, ttlMs = null) {
    try {
      const data = ttlMs ? { value, expiry: Date.now() + ttlMs } : { value };
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  },

  async remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },

  async clear(prefix = null) {
    try {
      if (prefix) {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(prefix)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
      } else {
        localStorage.clear();
      }
      return true;
    } catch {
      return false;
    }
  },

  async getPanorama(address) {
    try {
      const hash = await generateHash(address);
      const cache = await caches.open(CACHE_KEYS.PANORAMA_STORE);
      const keys = await cache.keys();

      for (const request of keys) {
        const url = new URL(request.url);
        const filename = url.pathname.split("/").pop();

        if (filename.startsWith(hash)) {
          const timestamp = parseTimestampFromKey(filename);

          if (isExpired(timestamp)) {
            await cache.delete(request);
            continue;
          }

          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            return URL.createObjectURL(blob);
          }
        }
      }
    } catch {}
    return null;
  },

  async setPanorama(address, blob) {
    try {
      const hash = await generateHash(address);
      const timestamp = Date.now();
      const cacheKey = `${hash}_${timestamp}`;

      const cache = await caches.open(CACHE_KEYS.PANORAMA_STORE);

      const keys = await cache.keys();
      for (const request of keys) {
        const url = new URL(request.url);
        const filename = url.pathname.split("/").pop();
        if (filename.startsWith(hash)) {
          await cache.delete(request);
        }
      }

      const fakeUrl = `https://cache.local/${cacheKey}`;
      await cache.put(fakeUrl, new Response(blob));

      return true;
    } catch {
      return false;
    }
  },

  async cleanExpiredPanoramas() {
    try {
      const cache = await caches.open(CACHE_KEYS.PANORAMA_STORE);
      const keys = await cache.keys();
      let removedCount = 0;

      for (const request of keys) {
        const url = new URL(request.url);
        const filename = url.pathname.split("/").pop();
        const timestamp = parseTimestampFromKey(filename);

        if (isExpired(timestamp)) {
          await cache.delete(request);
          removedCount++;
        }
      }

      return removedCount;
    } catch {
      return 0;
    }
  },
};

export const Position = {
  get() {
    try {
      const data = localStorage.getItem(CACHE_KEYS.POSITION);
      if (data) {
        const parsed = JSON.parse(data);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          return parsed;
        }
      }
    } catch {}
    return { x: 0, y: 0 };
  },

  set(x, y) {
    try {
      localStorage.setItem(CACHE_KEYS.POSITION, JSON.stringify({ x, y }));
      return true;
    } catch {
      return false;
    }
  },

  reset() {
    return this.set(0, 0);
  },
};

export const ViewMode = {
  get() {
    return localStorage.getItem(CACHE_KEYS.VIEW_MODE) || "default";
  },

  set(mode) {
    try {
      localStorage.setItem(CACHE_KEYS.VIEW_MODE, mode);
      return true;
    } catch {
      return false;
    }
  },
};
