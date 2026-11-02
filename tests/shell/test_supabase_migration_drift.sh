#!/usr/bin/env bash
set -euo pipefail

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
cat > "$tmp/psql" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "${DRIFT_REMOTE_VERSIONS:-}"
EOF
chmod +x "$tmp/psql"

versions="$(find supabase/migrations -maxdepth 1 -type f -name '*.sql' -printf '%f\n' |
  sed 's/_.*//' | sort -u)"
PATH="$tmp:$PATH" DRIFT_REMOTE_VERSIONS="$versions" SUPABASE_DATABASE_URL='postgresql://test' \
  bash scripts/check_supabase_migration_drift.sh >/dev/null

missing_versions="$(printf '%s\n' "$versions" | sed '$d')"
if PATH="$tmp:$PATH" DRIFT_REMOTE_VERSIONS="$missing_versions" SUPABASE_DATABASE_URL='postgresql://test' \
  bash scripts/check_supabase_migration_drift.sh >/dev/null 2>&1; then
  echo "drift check accepted a missing remote migration" >&2
  exit 1
fi

echo "Supabase migration drift checks passed"
