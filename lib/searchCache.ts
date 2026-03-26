import { MockComp } from "@/types";
import { ApifyResult } from "./apifyClient";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_PREFIX = "tts_cache_";

interface CacheEntry {
  result: ApifyResult;
  cachedAt: number;
  query: string;
}

function cacheKey(query: string): string {
  return `${CACHE_PREFIX}${query.toLowerCase().trim().replace(/\s+/g, "_")}`;
}

export function getCachedResult(query: string): ApifyResult | null {
  try {
    const key = cacheKey(query);
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const entry: CacheEntry = JSON.parse(raw);
    const age = Date.now() - entry.cachedAt;

    if (age > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }

    return entry.result;
  } catch {
    return null;
  }
}

export function setCachedResult(query: string, result: ApifyResult): void {
  try {
    const key = cacheKey(query);
    const entry: CacheEntry = {
      result,
      cachedAt: Date.now(),
      query,
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Storage full or unavailable — fail silently
  }
}

export function clearExpiredCache(): void {
  try {
    const keys = Object.keys(localStorage).filter((k) =>
      k.startsWith(CACHE_PREFIX)
    );
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const entry: CacheEntry = JSON.parse(raw);
      if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // Fail silently
  }
}