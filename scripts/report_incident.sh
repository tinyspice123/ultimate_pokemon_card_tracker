#!/usr/bin/env bash
set -euo pipefail

: "${GH_REPO:?GH_REPO is required}"
: "${INCIDENT_TITLE:?INCIDENT_TITLE is required}"
: "${INCIDENT_FAILED:?INCIDENT_FAILED is required}"
: "${INCIDENT_RUN_URL:?INCIDENT_RUN_URL is required}"

issue_number="$(gh issue list --repo "$GH_REPO" --state open --limit 100 --json number,title \
  --jq '.[] | select(.title == env.INCIDENT_TITLE) | .number' | head -n 1)"

if [[ "$INCIDENT_FAILED" == "true" ]]; then
  body_file="$(mktemp)"
  {
    printf '%s\n\n' "${INCIDENT_HEADING:-Automation detected a failure.}"
    printf '%s\n' "${INCIDENT_DETAILS:-No additional details were supplied.}"
    printf '\nRun: %s\n' "$INCIDENT_RUN_URL"
  } > "$body_file"
  if [[ -n "$issue_number" ]]; then
    gh issue comment "$issue_number" --repo "$GH_REPO" --body-file "$body_file"
  else
    gh issue create --repo "$GH_REPO" --title "$INCIDENT_TITLE" --body-file "$body_file"
  fi
elif [[ -n "$issue_number" ]]; then
  gh issue close "$issue_number" --repo "$GH_REPO" \
    --comment "${INCIDENT_RECOVERY_MESSAGE:-Automation recovered}: $INCIDENT_RUN_URL"
fi
