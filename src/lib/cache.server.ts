import { getSql } from "./db";
import { createCache } from "./cache";

export { cacheKey } from "./cache";

/**
 * Process-wide cache: the in-memory LRU tier backed by the shared
 * `cache_entry` table (migrations/0002_cache_entry.sql). Server-only —
 * imported by *.functions.ts server functions, never by client code.
 */
export const appCache = createCache({ sql: getSql });

/**
 * Fetch `key` from the cache, or run `loader` and store the answer
 * for `ttlMs`. `cached` tells the caller which path answered, so
 * the UI can say "respuesta en caché".
 */
export async function cached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<{ value: T; cached: boolean }> {
  return appCache.cached(key, ttlMs, loader);
}
