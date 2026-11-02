#!/usr/bin/env bash
set -euo pipefail

: "${SUPABASE_DATABASE_URL:?SUPABASE_DATABASE_URL is required}"

local_versions=()
for migration in supabase/migrations/*.sql; do
  version="$(basename "$migration")"
  version="${version%%_*}"
  if [[ ! "$version" =~ ^[0-9]+$ ]]; then
    echo "Migration filename does not start with a numeric version: $migration" >&2
    exit 1
  fi
  local_versions+=("$version")
done

mapfile -t remote_versions < <(
  psql "$SUPABASE_DATABASE_URL" -XAt -v ON_ERROR_STOP=1 \
    -c 'select version from supabase_migrations.schema_migrations order by version'
)

local_list="$(printf '%s\n' "${local_versions[@]}" | sort -u)"
remote_list="$(printf '%s\n' "${remote_versions[@]}" | sort -u)"
if [[ "$local_list" != "$remote_list" ]]; then
  echo "Supabase migration history differs from the repository:" >&2
  diff -u <(printf '%s\n' "$local_list") <(printf '%s\n' "$remote_list") || true
  exit 1
fi

echo "Supabase migration history matches ${#local_versions[@]} repository migrations."
