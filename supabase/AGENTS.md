# Supabase guidance

This file applies to `supabase/` and supplements `../AGENTS.md`.

- Migration history is append-only. Never rewrite an applied migration; add a
  timestamped migration that safely upgrades the current schema.
- Keep `pokemon_card_main` publicly readable and quantity updates restricted to
  authenticated users present in `private.collection_editors`.
- The private allowlist must remain inaccessible to `anon` and `authenticated`.
  Expose only the boolean `is_collection_editor()` result.
- Use explicit grants and Row Level Security together. New tables start with RLS
  enabled and no privileges until the intended policy is defined.
- Quantity history is immutable to browser clients and readable only by an
  editor. Preserve trigger-based recording of card identity and actor UUID.
- Use schema-qualified objects and a safe `search_path` in security-definer
  functions. Make migrations idempotent where practical.
- Schema or policy changes require matching browser/client, backup/import,
  recovery, documentation, and test updates. Validate on a disposable project
  before production and never put service-role keys in migration files.

