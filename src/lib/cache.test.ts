import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cacheKey, createCache, type CacheSql } from "./cache.ts";

/** In-memory stand-in for the cache_entry table. */
function fakeSql() {
  const store = new Map<string, { payload: unknown; expiresAt: number }>();
  let fail = false;
  const sql: CacheSql = {
    async query<T>(text: string, params: unknown[] = []): Promise<T[]> {
      if (fail) throw new Error("db down");
      if (text.startsWith("select payload")) {
        const row = store.get(String(params[0]));
        if (!row || row.expiresAt <= Date.now()) return [];
        return [{ payload: row.payload }] as T[];
      }
      if (text.startsWith("insert into cache_entry")) {
        const [key, payloadJson, expiresAt] = params as [string, string, string];
        store.set(key, {
          payload: JSON.parse(payloadJson),
          expiresAt: Date.parse(expiresAt),
        });
        return [] as T[];
      }
      if (text.startsWith("delete from cache_entry")) {
        const now = Date.now();
        for (const [key, row] of [...store]) {
          if (row.expiresAt <= now) store.delete(key);
        }
        return [] as T[];
      }
      throw new Error(`consulta inesperada: ${text}`);
    },
  };
  return { sql, store, fail: () => (fail = true) };
}

/** The tiers live on globalThis (HMR safety) — clear them per test. */
function resetTiers(): void {
  const g = globalThis as Record<string, unknown>;
  g.__gfCacheMemory__ = new Map();
  g.__gfCacheFlights__ = new Map();
  g.__gfCacheLastSweep__ = 0;
}

describe("cacheKey", () => {
  it("namespaces, normalizes and caps the parts", () => {
    assert.equal(cacheKey("clima", "Ciudad de México"), "clima:ciudad-de-mexico");
    assert.equal(cacheKey("off", "Leche!!  2%"), "off:leche-2");
    assert.equal(cacheKey("a", "x".repeat(300)), `a:${"x".repeat(120)}`);
  });
});

describe("createCache", () => {
  it("runs the loader on a miss and writes through to both tiers", async () => {
    resetTiers();
    const { sql, store } = fakeSql();
    const cache = createCache({ sql: async () => sql });
    let calls = 0;
    const first = await cache.cached("k:one", 60_000, async () => {
      calls += 1;
      return { n: 1 };
    });
    assert.equal(first.cached, false);
    assert.deepEqual(first.value, { n: 1 });
    assert.equal(calls, 1);
    assert.ok(store.has("k:one"), "shared tier must hold the answer");
  });

  it("answers from memory on the next call", async () => {
    resetTiers();
    const { sql } = fakeSql();
    const cache = createCache({ sql: async () => sql });
    let calls = 0;
    const loader = async () => {
      calls += 1;
      return { n: 1 };
    };
    await cache.cached("k:two", 60_000, loader);
    const second = await cache.cached("k:two", 60_000, loader);
    assert.equal(second.cached, true);
    assert.equal(calls, 1);
  });

  it("answers from the shared table when memory is empty", async () => {
    resetTiers();
    const { sql } = fakeSql();
    const writer = createCache({ sql: async () => sql });
    const reader = createCache({ sql: async () => sql });
    let calls = 0;
    await writer.cached("k:three", 60_000, async () => {
      calls += 1;
      return { n: 3 };
    });
    resetTiers(); // memory tier gone, shared table still there
    const hit = await reader.cached("k:three", 60_000, async () => {
      calls += 1;
      return { n: 99 };
    });
    assert.equal(hit.cached, true);
    assert.deepEqual(hit.value, { n: 3 });
    assert.equal(calls, 1);
  });

  it("shares one in-flight loader between concurrent callers", async () => {
    resetTiers();
    const { sql } = fakeSql();
    const cache = createCache({ sql: async () => sql });
    let calls = 0;
    const slow = async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      calls += 1;
      return { n: 42 };
    };
    const [a, b] = await Promise.all([
      cache.cached("k:four", 60_000, slow),
      cache.cached("k:four", 60_000, slow),
    ]);
    assert.equal(calls, 1);
    assert.deepEqual(a.value, { n: 42 });
    assert.deepEqual(b.value, { n: 42 });
  });

  it("degrades to memory-only when the database fails", async () => {
    resetTiers();
    const { sql, fail } = fakeSql();
    fail();
    const cache = createCache({ sql: async () => sql });
    const { value, cached } = await cache.cached("k:five", 60_000, async () => ({ n: 7 }));
    assert.deepEqual(value, { n: 7 });
    assert.equal(cached, false);
  });

  it("expires entries after their TTL in both tiers", async () => {
    resetTiers();
    const { sql } = fakeSql();
    const cache = createCache({ sql: async () => sql });
    let calls = 0;
    const loader = async () => {
      calls += 1;
      return { n: calls };
    };
    await cache.cached("k:six", 1, loader);
    await new Promise((resolve) => setTimeout(resolve, 10));
    const next = await cache.cached("k:six", 60_000, loader);
    assert.equal(next.cached, false);
    assert.deepEqual(next.value, { n: 2 });
  });
});
