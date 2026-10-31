# 0006: Local image manifests

- Status: Accepted
- Date: 2026-10-31

## Context

Third-party card image URLs can change, rate-limit, or identify variants
ambiguously. Important artwork needs a stable reviewed mapping.

## Decision

Store reviewed images under `public/img/<set-id>/` and map exact
card/number/variant identities in `manifest.txt`. Prefer that mapping at runtime,
then the database override, then configured remote APIs. Keep asset generation a
reviewed step rather than an unattended backup side effect.

## Consequences

Known images are stable and offline-capable, with repository-size and copyright
review costs. Identity edits require manifest synchronization, and uncertain
matches must fail rather than silently select the wrong variant.

