#!/usr/bin/env bash
set -euo pipefail

: "${GH_REPO:?GH_REPO is required}"
: "${AUTOMATION_BRANCH:?AUTOMATION_BRANCH is required}"
: "${PR_TITLE:?PR_TITLE is required}"
: "${PR_BODY:?PR_BODY is required}"

git fetch origin "refs/heads/$AUTOMATION_BRANCH:refs/remotes/origin/$AUTOMATION_BRANCH" || true
git push origin "HEAD:refs/heads/$AUTOMATION_BRANCH" --force-with-lease

pr_url="$(gh pr list --repo "$GH_REPO" --state open --head "$AUTOMATION_BRANCH" \
  --json url --jq '.[0].url')"
if [[ -z "$pr_url" ]] &&
   ! pr_url="$(gh pr create --repo "$GH_REPO" --base main --head "$AUTOMATION_BRANCH" \
     --title "$PR_TITLE" --body "$PR_BODY")"; then
    pr_url="$(gh pr list --repo "$GH_REPO" --state open --head "$AUTOMATION_BRANCH" \
      --json url --jq '.[0].url')"
    if [[ -z "$pr_url" ]]; then
      pr_number="$(gh pr list --repo "$GH_REPO" --state closed --head "$AUTOMATION_BRANCH" \
        --limit 1 --json number --jq '.[0].number')"
      [[ -n "$pr_number" ]] || exit 1
      gh api --method PATCH "/repos/$GH_REPO/pulls/$pr_number" -f state=open >/dev/null
      pr_url="$(gh pr view "$pr_number" --repo "$GH_REPO" --json url --jq .url)"
    fi
fi

pr_number="$(gh pr view "$pr_url" --repo "$GH_REPO" --json number --jq '.number')"
gh api --method PATCH "/repos/$GH_REPO/pulls/$pr_number" \
  -f title="$PR_TITLE" -f body="$PR_BODY" >/dev/null
gh workflow run ci-quality-deploy.yml --repo "$GH_REPO" --ref "$AUTOMATION_BRANCH" \
  -f pull_request_number="$pr_number" -f head_ref="$AUTOMATION_BRANCH" -f base_ref=main
gh workflow run security.yml --repo "$GH_REPO" --ref "$AUTOMATION_BRANCH" \
  -f head_ref="$AUTOMATION_BRANCH" -f base_ref=main
gh pr merge "$pr_url" --repo "$GH_REPO" --auto --squash
if [[ "${SKIP_STATUS_REPORT:-false}" != true ]]; then
  STATUS_PR_NUMBER="$pr_number" bash scripts/generated_pr_status.sh
fi

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  printf 'pr_url=%s\npr_number=%s\n' "$pr_url" "$pr_number" >> "$GITHUB_OUTPUT"
fi
