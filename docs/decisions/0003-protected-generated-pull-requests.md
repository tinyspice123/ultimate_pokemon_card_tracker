# 0003: Protected generated pull requests

- Status: Accepted
- Date: 2026-10-31

## Context

Backups and changelogs are generated automatically, but direct bot pushes to
`main` would bypass reviewable history and protected checks. GitHub-token-created
pull requests also do not emit ordinary pull-request workflow events.

## Decision

Automation writes persistent branches through the shared generated-PR helper,
explicitly dispatches required workflows with PR metadata, updates behind main,
and enables auto-merge only after protected checks pass. No broad ruleset bypass
is granted.

## Consequences

Generated changes follow the same integrity gate as human work and concurrent
runs reuse one PR. Workflows are more complex and must maintain explicit
dispatch/status logic.

