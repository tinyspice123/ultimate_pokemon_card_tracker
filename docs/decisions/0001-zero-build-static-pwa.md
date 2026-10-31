# 0001: Zero-build static PWA

- Status: Accepted
- Date: 2026-10-31

## Context

The tracker is small, must remain inexpensive to host, and should work offline
without a framework runtime or build-service dependency.

## Decision

Ship a zero-build static PWA from `public/` using HTML, CSS, classic JavaScript,
and a service worker. CI may package deployment-only files and replace the cache
version, but it does not compile application source.

## Consequences

The repository is easy to serve and roll back as an immutable artifact. Browser
features must work without module bundling, and larger framework migrations need
an explicit superseding decision plus deployment and CSP redesign.

