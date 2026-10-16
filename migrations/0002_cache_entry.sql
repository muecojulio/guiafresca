-- Shared response cache for keyless public APIs (Open-Meteo, Open Food
-- Facts, Fruityvice, ipapi.co).
--
-- WHY THIS TABLE EXISTS
-- On Vercel every serverless function is a fresh process: an in-memory
-- Map dies with the instance, so each cold start re-fetches the same
-- upstream answers. This table is the second tier of src/lib/cache.ts —
-- one shared cache across instances that survives cold starts, with the
-- in-memory Map still serving the hot path inside a warm instance.
--
-- INDEX ANALYSIS (what actually gets queried)
--   1. `where cache_key = $1` — every read and the upsert conflict
--      target. Covered by the PRIMARY KEY btree. This is the hot path:
--      point lookup, O(log n), one row.
--   2. `delete ... where expires_at < now()` — the expiry sweep runs
--      opportunistically on writes. Without an index it is a seq scan
--      over every cached answer; with it, a range scan of the (few)
--      already-dead rows.
-- Deliberately NOT indexed: `created_at` (never filtered on its own —
-- an index here would only add write cost and bloat), and `payload`
-- (jsonb, never queried by content). Two indexes total: one per real
-- access path, no more.
--
-- Idempotent (IF NOT EXISTS) so it is safe to re-run; applied by
-- scripts/migrate.mjs on deploy and by src/lib/db.ts in preview.

create table if not exists cache_entry (
  cache_key text primary key,
  payload jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists cache_entry_expires_at_idx on cache_entry (expires_at);
