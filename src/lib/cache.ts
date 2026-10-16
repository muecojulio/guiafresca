/**
 * Two-tier response cache for the keyless public APIs (Open-Meteo,
 * Open Food Facts, Fruityvice, ipapi.co).
 *
 * Why two tiers:
 * - **Memory** (per process): the hot path — a warm serverless
 *   instance answers in microseconds.
 * - **Postgres `cache_entry`** (migrations/0002_cache_entry.sql):
 *   the shared tier. On Vercel every function invocation can be a
 *   fresh process, so a Map alone dies with the instance and each
 *   cold start re-fetches the same upstream answers. The table is
 *   shared across instances and survives cold starts.
 *
 * Both tiers are best-effort: if the database is unreachable the
 * call degrades to memory-only and the feature still works — a
 * cache must never take the app down.
 *
 * Single-flight: concurrent callers asking for the same key share
 * one in-flight promise, so a burst does not stampede the upstream
 * API.
 *
 * This module is deliberately free of database imports — the SQL
 * client is injected (see cache.server.ts), which also keeps it
 * runnable under plain `node --test`.
 */

export type Cached<T> = { value: T; cached: boolean };

type MemoryEntry = { at: number; value: unknown };

const MEMORY_MAX = 128;
const SWEEP_EVERY_MS = 10 * 60 * 1000;

/** The SQL surface cache_entry needs (subset of @/lib/db's Sql). */
export interface CacheSql {
  query<T = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<T[]>;
}

interface CacheDeps {
  /** Server-only SQL client provider; inject a fake in tests. */
  sql: () => Promise<CacheSql>;
}

const globalRef = globalThis as typeof globalThis & {
  __gfCacheMemory__?: Map<string, MemoryEntry>;
  __gfCacheFlights__?: Map<string, Promise<Cached<unknown>>>;
  __gfCacheLastSweep__?: number;
};

function memory(): Map<string, MemoryEntry> {
  globalRef.__gfCacheMemory__ ??= new Map();
  return globalRef.__gfCacheMemory__;
}

function flights(): Map<string, Promise<Cached<unknown>>> {
  globalRef.__gfCacheFlights__ ??= new Map();
  return globalRef.__gfCacheFlights__;
}

/** Insert and keep the LRU cap, evicting the least recently used. */
function remember(key: string, value: unknown, ttlMs: number): void {
  const map = memory();
  map.delete(key);
  map.set(key, { at: Date.now() + ttlMs, value });
  while (map.size > MEMORY_MAX) {
    const oldest = map.keys().next().value;
    if (oldest === undefined) break;
    map.delete(oldest);
  }
}

/** A namespace + validated parts, safe to use as a table key. */
export function cacheKey(namespace: string, ...parts: string[]): string {
  const clean = parts
    .map((part) =>
      part
        .normalize("NFD")
        .replace(/[̀-ͯ]/gu, "")
        .toLocaleLowerCase("es")
        .replace(/[^a-z0-9]+/gu, "-")
        .replace(/^-+|-+$/gu, "")
        .slice(0, 120),
    )
    .filter(Boolean)
    .join("-");
  return `${namespace}:${clean}`;
}

export function createCache(deps: CacheDeps) {
  async function readShared(key: string): Promise<unknown | null> {
    try {
      const sql = await deps.sql();
      const rows = await sql.query<{ payload: unknown }>(
        "select payload from cache_entry where cache_key = $1 and expires_at > now()",
        [key],
      );
      return rows[0]?.payload ?? null;
    } catch {
      return null; // cache tier down → behave like a miss
    }
  }

  async function writeShared(key: string, value: unknown, ttlMs: number): Promise<void> {
    try {
      const sql = await deps.sql();
      const expiresAt = new Date(Date.now() + ttlMs).toISOString();
      await sql.query(
        `insert into cache_entry (cache_key, payload, expires_at)
         values ($1, $2::jsonb, $3::timestamptz)
         on conflict (cache_key) do update
           set payload = excluded.payload,
               expires_at = excluded.expires_at,
               created_at = now()`,
        [key, JSON.stringify(value), expiresAt],
      );
      void sweep(sql);
    } catch {
      // best-effort: the answer still reached the caller
    }
  }

  /** Expiry sweep — served by cache_entry_expires_at_idx. */
  let sweeping = false;
  async function sweep(sql: CacheSql): Promise<void> {
    const now = Date.now();
    if (sweeping || now - (globalRef.__gfCacheLastSweep__ ?? 0) < SWEEP_EVERY_MS) return;
    globalRef.__gfCacheLastSweep__ = now;
    sweeping = true;
    try {
      await sql.query("delete from cache_entry where expires_at < now()");
    } catch {
      // best-effort
    } finally {
      sweeping = false;
    }
  }

  return {
    async cached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<Cached<T>> {
      const mem = memory().get(key);
      if (mem && Date.now() < mem.at) {
        const entry = mem; // refresh LRU position
        memory().delete(key);
        memory().set(key, entry);
        return { value: mem.value as T, cached: true };
      }

      const pending = flights().get(key);
      if (pending) return pending as Promise<Cached<T>>;

      const run = (async () => {
        try {
          const shared = await readShared(key);
          if (shared !== null && shared !== undefined) {
            remember(key, shared, ttlMs);
            return { value: shared as T, cached: true };
          }
          const value = await loader();
          remember(key, value, ttlMs);
          void writeShared(key, value, ttlMs);
          return { value, cached: false };
        } finally {
          flights().delete(key);
        }
      })();

      flights().set(key, run as Promise<Cached<unknown>>);
      return run;
    },
  };
}

export type Cache = ReturnType<typeof createCache>;
