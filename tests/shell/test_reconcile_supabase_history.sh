#!/usr/bin/env bash
set -euo pipefail

output="$(SUPABASE_DATABASE_URL='postgresql://postgres:secret@wrong.example/postgres' \
  SUPABASE_PROJECT_REF='expected-project' \
  bash scripts/reconcile_supabase_history.sh 2>&1 || true)"
if [[ "$output" != *"does not match the expected Supabase project"* ]]; then
  echo "reconciliation did not reject a mismatched production URL" >&2
  exit 1
fi

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
cat > "$tmp/psql" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$*" > "$RECONCILE_TEST_LOG"
printf 't\n'
EOF
cat > "$tmp/supabase" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF
chmod +x "$tmp/psql" "$tmp/supabase"
RECONCILE_TEST_LOG="$tmp/psql.log" \
  PATH="$tmp:$PATH" \
  SUPABASE_DATABASE_URL='postgresql://postgres:secret@expected-project.pooler.supabase.com/postgres' \
  SUPABASE_PROJECT_REF='expected-project' \
  bash scripts/reconcile_supabase_history.sh >/dev/null
if ! grep -Fq "version = '202611020001'" "$tmp/psql.log"; then
  echo "reconciliation did not send a literal validated migration version to psql" >&2
  exit 1
fi
if grep -Fq ":'version'" "$tmp/psql.log"; then
  echo "reconciliation still relies on unsupported psql substitution in -c" >&2
  exit 1
fi
echo "Supabase reconciliation safety check passed"
