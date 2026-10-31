#!/usr/bin/env bash
set -euo pipefail

: "${GH_REPO:?GH_REPO is required}"
marker='<!-- generated-pr-status -->'

if [[ -n "${STATUS_PR_NUMBER:-}" ]]; then
  pr_numbers="$STATUS_PR_NUMBER"
else
  pr_numbers="$(gh pr list --repo "$GH_REPO" --state open --limit 100 \
    --json number,headRefName --jq '.[] | select(.headRefName | startswith("automation/")) | .number')"
fi

while IFS= read -r number; do
  [[ -n "$number" ]] || continue
  # GraphQL variable references must remain literal for GitHub's parser.
  # shellcheck disable=SC2016
  state="$(gh api graphql -f owner="${GH_REPO%%/*}" -f name="${GH_REPO##*/}" -F number="$number" \
    -f query='query($owner:String!,$name:String!,$number:Int!){repository(owner:$owner,name:$name){pullRequest(number:$number){mergeStateStatus reviewDecision autoMergeRequest{enabledAt} commits(last:1){nodes{commit{statusCheckRollup{state}}}}}}}' \
    --jq '.data.repository.pullRequest')"
  merge_state="$(jq -r .mergeStateStatus <<< "$state")"
  checks="$(jq -r '.commits.nodes[0].commit.statusCheckRollup.state // "PENDING"' <<< "$state")"
  auto_merge="$(jq -r 'if .autoMergeRequest then "enabled" else "disabled" end' <<< "$state")"
  review="$(jq -r '.reviewDecision // "not required"' <<< "$state")"
  body="$(cat <<EOF
$marker
## Automation status

- Required checks: **$checks**
- Merge state: **$merge_state**
- Auto-merge: **$auto_merge**
- Review decision: **$review**

This comment is maintained automatically. Approval is not required when the ruleset requires zero reviews; a \`BEHIND\` or \`BLOCKED\` merge state indicates a branch/ruleset condition instead.
EOF
)"
  comment_id="$(gh api --paginate "/repos/$GH_REPO/issues/$number/comments" \
    --jq ".[] | select(.body | contains(\"$marker\")) | .id" | head -n1)"
  if [[ -n "$comment_id" ]]; then
    gh api --method PATCH "/repos/$GH_REPO/issues/comments/$comment_id" -f body="$body" >/dev/null
  else
    gh api --method POST "/repos/$GH_REPO/issues/$number/comments" -f body="$body" >/dev/null
  fi
done <<< "$pr_numbers"
