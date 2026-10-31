# Test-suite guidance

This file applies to `tests/` and supplements `../AGENTS.md`.

- `site/` protects static assets, configuration, and CI/CD contracts;
  `unit/` covers pure JavaScript and release helpers; `python/` covers scripts;
  `shell/` covers shared automation; `e2e/` covers browser behavior; and
  `production/` performs deliberate live smoke checks.
- Tests outside `production/` must be deterministic and must not depend on live
  services. Mock Supabase, deployed backups, time, and network responses.
- Prefer a focused regression test that fails for the reported bug. Assert user
  behavior and stable contracts rather than incidental implementation details.
- Keep fixtures minimal and free of secrets or real editor identities. Card
  fixtures must preserve set/card/number/variant identity.
- A skipped required CI job still needs a successful contract result. When a
  workflow invariant changes, update both its implementation and site checks.
- Run the smallest relevant suite while iterating, then the full affected
  commands from `../AGENTS.md`. Browser failures should retain useful traces or
  screenshots without uploading credentials.

