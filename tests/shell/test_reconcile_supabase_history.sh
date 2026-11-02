#!/usr/bin/env bash
set -euo pipefail

output="$(SUPABASE_DATABASE_URL='postgresql://postgres:secret@wrong.example/postgres' \
  SUPABASE_PROJECT_REF='expected-project' \
  bash scripts/reconcile_supabase_history.sh 2>&1 || true)"
if [[ "$output" != *"does not match the expected Supabase project"* ]]; then
  echo "reconciliation did not reject a mismatched production URL" >&2
  exit 1
fi
echo "Supabase reconciliation safety check passed"
