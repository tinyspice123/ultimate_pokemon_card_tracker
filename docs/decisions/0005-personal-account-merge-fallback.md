# 0005: Personal-account merge fallback

- Status: Accepted
- Date: 2026-10-31

## Context

GitHub Merge Queue is unavailable for this personal-account repository, while
automation still needs safe, current-base merges.

## Decision

Retain `merge_group` triggers for a future organization transfer. Until then,
generated branches update behind `main`, report their check and merge state, and
use GitHub auto-merge after all required checks pass.

## Consequences

The current repository gains queue-like safety without pretending the feature is
enabled. Branch update/status automation remains necessary and can be simplified
if native Merge Queue later becomes available.

