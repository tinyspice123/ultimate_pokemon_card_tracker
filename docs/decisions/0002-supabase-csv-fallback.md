# 0002: Supabase with CSV fallback

- Status: Accepted
- Date: 2026-10-31

## Context

Collection quantities need authenticated live updates, but the public catalogue
should remain usable during database or network outages and be recoverable
independently of the provider.

## Decision

Use Supabase as the live source of truth and retain versioned CSV exports. The
browser falls back to the deployed snapshot in read-only mode when the live
request fails. Scheduled backups validate snapshots and exercise reconstruction.

## Consequences

Users can browse during outages and Git history supplies recovery points.
Snapshot freshness is bounded by backup automation, editing is unavailable in
fallback mode, and schema changes must keep database and CSV tooling aligned.

