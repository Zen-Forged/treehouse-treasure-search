import { normalizeQuery } from "@/utils/normalizeQuery";

const TTL_MS = 48 * 60 * 60 * 1000;

export type CacheSource = "cache" | "live";

export interface CacheEntry<T = Record<string, unknown>> {
  query: string;
  rawQuery: string;
  data: T;
  timestamp: number;
}

const store = new Map<string, CacheEntry<Record<string, unknown>>>();

function isExpired(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp > TTL_MS;
}

export function cacheGet<T = Record<string, unknown>>(rawQuery: string): CacheEntry<T> | null {
  const key = normalizeQuery(rawQuery);
  if (!key) return null;
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (isExpired(entry)) { store.delete(key); return null; }
  return entry;
}

export function cacheSet<T = Record<string, unknown>>(rawQuery: string, data: T): CacheEntry<T> {
  const key = normalizeQuery(rawQuery);
  const entry: CacheEntry<T> = {
    query: key,
    rawQuery,
    data: data as unknown as Record<string, unknown>,
    timestamp: Date.now(),
  } as CacheEntry<T>;
  store.set(key, entry as CacheEntry<Record<string, unknown>>);
  return entry;
}

export function cacheDelete(rawQuery: string): void {
  store.delete(normalizeQuery(rawQuery));
}

export function cacheSize(): number {
  return store.size;
}

export function cachePurgeExpired(): number {
  let removed = 0;
  const keys = Array.from(store.keys());
  for (const key of keys) {
    const entry = store.get(key);
    if (entry && isExpired(entry)) { store.delete(key); removed++; }
  }
  return removed;
}
