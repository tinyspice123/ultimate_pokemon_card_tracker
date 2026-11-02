#!/usr/bin/env bash
set -euo pipefail

: "${SUPABASE_DATABASE_URL:?SUPABASE_DATABASE_URL is required}"
expected_ref="${SUPABASE_PROJECT_REF:-}"
if [[ -n "$expected_ref" && "$SUPABASE_DATABASE_URL" != *"$expected_ref"* ]]; then
  echo "Database URL does not match the expected Supabase project." >&2
  exit 1
fi

baseline="202611020001"
for migration in supabase/migrations/*.sql; do
  version="$(basename "$migration")"
  version="${version%%_*}"
  if [[ ! "$version" =~ ^[0-9]+$ ]]; then
    echo "Migration filename does not start with a numeric version: $migration" >&2
    exit 1
  fi
  (( 10#$version > 10#$baseline )) && continue
  applied="$(psql "$SUPABASE_DATABASE_URL" -XAt -v ON_ERROR_STOP=1 \
    -c "select exists(select 1 from supabase_migrations.schema_migrations where version = '$version')")"
  if [[ "$applied" == "t" ]]; then
    echo "$version is already recorded."
    continue
  fi
  supabase migration repair "$version" --status applied --yes \
    --remote="$SUPABASE_DATABASE_URL"
done

supabase migration list --remote="$SUPABASE_DATABASE_URL"
