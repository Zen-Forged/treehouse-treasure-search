// lib/cache.ts
//
// Lightweight in-memory cache with TTL.
// Survives the lifetime of the Node.js process (per Vercel function instance).
// For persistent cross-request caching, swap the store for Redis or Supabase later.

import { normalizeQuery } from "@/utils/normalizeQuery";

const TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

export type CacheSource = "cache" | "live";

export interface CacheEntry<T = unknown> {
  query: string;       // normalized key
  rawQuery: string;    // original for debugging
  data: T;
  timestamp: number;   // ms since epoch
}

// Module-level store — shared across requests in the same process
const store = new Map<string, CacheEntry>();

function isExpired(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp > TTL_MS;
}

/**
 * Retrieve a cache entry by raw query string.
 * Returns null on miss or expiry.
 */
export function cacheGet<T = unknown>(rawQuery: string): CacheEntry<T> | null {
  const key = normalizeQuery(rawQuery);
  if (!key) return null;

  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;

  if (isExpired(entry)) {
    store.delete(key);
    return null;
  }

  return entry;
}

/**
 * Store a result against a raw query string.
 */
export function cacheSet<T = unknown>(rawQuery: string, data: T): CacheEntry<T> {
  const key = normalizeQuery(rawQuery);
  const entry: CacheEntry<T> = {
    query: key,
    rawQuery,
    data,
    timestamp: Date.now(),
  };
  store.set(key, entry);
  return entry;
}

/**
 * Explicitly remove an entry (e.g. force refresh).
 */
export function cacheDelete(rawQuery: string): void {
  store.delete(normalizeQuery(rawQuery));
}

/**
 * How many entries are currently cached.
 */
export function cacheSize(): number {
  return store.size;
}

/**
 * Purge all expired entries. Call occasionally if needed.
 */
export function cachePurgeExpired(): number {
  let removed = 0;
  for (const [key, entry] of store) {
    if (isExpired(entry)) {
      store.delete(key);
      removed++;
    }
  }
  return removed;
}
