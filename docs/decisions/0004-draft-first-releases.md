# 0004: Draft-first transactional releases

- Status: Accepted
- Date: 2026-10-31

## Context

A public release should represent the artifact actually deployed to production,
and partial failures must not publish an incomplete or unverifiable release.

## Decision

Resolve the exact successful main deployment, calculate SemVer, prepare a draft,
attach the retained Pages archive, checksum and SPDX SBOM, attest artifacts,
verify targets/assets/attestations/changelog state, and only then publish.

## Consequences

Published releases are traceable to tested production bytes. The pipeline has
more stages and permissions, while failures intentionally leave a draft and a
deduplicated incident for diagnosis.

