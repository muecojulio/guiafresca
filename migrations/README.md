# Migrations

SQL files here are the single source of truth for the app schema. Both
appliers pick them up automatically:

- `scripts/migrate.mjs` — runs during `npm run build` on Vercel, against
  `DATABASE_URL` (Neon). Skipped when the env var is unset.
- `src/lib/db.ts` — applies the same files to the embedded PGLite
  fallback at startup, so preview matches production.

Applied files are recorded by basename in `_migrations` and never run
twice. Files are applied in filename order, so number them
`0001_…`, `0002_…`, …

`migrations/auth/` is opt-in: Better Auth's schema, copied up to this
folder only when an app turns sign-in on. It already ships its own
indexes (`session_userId_idx`, `account_userId_idx`,
`verification_identifier_idx`).

## Index log

| File | Indexes | Why |
| --- | --- | --- |
| `0002_cache_entry.sql` | `cache_entry` PRIMARY KEY (`cache_key`), `cache_entry_expires_at_idx` (`expires_at`) | Point lookups on every cache read (PK) and the expiry sweep `delete … where expires_at < now()` (range scan). Nothing else is filtered, so nothing else is indexed — extra indexes would only add write cost and bloat. |
