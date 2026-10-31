# GitHub automation guidance

This file applies to `.github/` and supplements `../AGENTS.md`.

- Pin every third-party action to a full commit SHA. Let Renovate update the
  digest and keep the human-readable version comment current.
- Default workflow permissions remain read-only. Grant write permissions only
  to the job that needs them, and never expose secrets to pull-request code.
- The names of protected checks documented in `../AGENTS.md` are API contracts.
  Preserve them, including successful no-op jobs for classified changes.
- Retain `pull_request`, explicit generated-branch dispatch, and `merge_group`
  compatibility. GitHub-token-created PRs do not emit ordinary PR workflows.
- The repository is on a personal account and cannot currently enable Merge
  Queue. Generated branches instead update behind `main`, report status, and
  use auto-merge after required checks pass.
- Generated changes go through `scripts/upsert_generated_pr.sh`; incidents go
  through `scripts/report_incident.sh`. Do not restore direct-to-main writes or
  broad branch-protection bypasses.
- Releases are transactional: resolve the deployed SHA, prepare a draft, attach
  and attest artifacts/SBOM, verify everything, then publish. Never publish an
  unverified draft or release an arbitrary dispatch SHA.
- Workflow changes must pass `actionlint` with ShellCheck integration and the
  workflow invariants in `tests/site/ci_checks.mjs`.

