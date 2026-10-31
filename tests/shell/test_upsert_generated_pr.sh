#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$tmp/bin"

cat > "$tmp/bin/git" <<'MOCK'
#!/usr/bin/env bash
printf 'git %s\n' "$*" >> "$MOCK_LOG"
MOCK

cat > "$tmp/bin/gh" <<'MOCK'
#!/usr/bin/env bash
set -u
printf 'gh %s\n' "$*" >> "$MOCK_LOG"
args="$*"
if [[ "$args" == *'pr list'*'--state open'* ]]; then
  [[ "$SCENARIO" == existing || "$SCENARIO" == branch_refresh || "$SCENARIO" == api_failure ]] &&
    printf 'https://example.invalid/pull/7\n'
elif [[ "$args" == *'pr list'*'--state closed'* ]]; then
  printf '9\n'
elif [[ "$args" == *'pr create'* ]]; then
  if [[ "$SCENARIO" == closed_recovery ]]; then exit 1; fi
  printf 'https://example.invalid/pull/7\n'
elif [[ "$args" == *'pr view 9'*'--json url'* ]]; then
  printf 'https://example.invalid/pull/9\n'
elif [[ "$args" == *'pr view'*'--json number'* ]]; then
  [[ "$args" == *'/9'* ]] && printf '9\n' || printf '7\n'
elif [[ "$args" == *'api --method PATCH'*'/pulls/'* ]]; then
  if [[ "$SCENARIO" == api_failure ]]; then exit 1; fi
fi
exit 0
MOCK
chmod +x "$tmp/bin/git" "$tmp/bin/gh"

run_case() {
  local scenario="$1" expect_success="$2"
  local log="$tmp/$scenario.log"
  : > "$log"
  if PATH="$tmp/bin:$PATH" MOCK_LOG="$log" SCENARIO="$scenario" \
    GH_REPO=owner/repo AUTOMATION_BRANCH=automation/test \
    PR_TITLE='Generated update' PR_BODY='Generated body' SKIP_STATUS_REPORT=true \
    bash "$repo_root/scripts/upsert_generated_pr.sh"; then
    [[ "$expect_success" == true ]]
  else
    [[ "$expect_success" == false ]]
  fi
  grep -q 'git fetch origin refs/heads/automation/test' "$log"
  grep -q 'git push origin HEAD:refs/heads/automation/test --force-with-lease' "$log"
  if [[ "$scenario" == new ]]; then grep -q 'gh pr create' "$log"; fi
  if [[ "$scenario" == existing ]]; then ! grep -q 'gh pr create' "$log"; fi
  if [[ "$scenario" == closed_recovery ]]; then grep -q 'state=open' "$log"; fi
  if [[ "$scenario" == branch_refresh ]]; then grep -q 'gh workflow run security.yml' "$log"; fi
}

run_case new true
run_case existing true
run_case closed_recovery true
run_case branch_refresh true
run_case api_failure false
echo 'upsert_generated_pr.sh mock scenarios passed'
