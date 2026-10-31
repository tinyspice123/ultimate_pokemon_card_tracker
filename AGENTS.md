# AI contributor guide

This file is the canonical operating guide for coding agents working in this
repository. Keep it synchronized with workflow, architecture, and operational
changes.

## Project shape

- `public/` is a zero-build static Progressive Web App deployed to GitHub Pages.
- `public/sets.js` is the source of truth for configured collection sets.
- Supabase is the live catalogue and quantity store. Browser access is in
  `public/supabase-client.js`; never place service-role or secret keys in
  `public/`.
- Root `backups/*.csv` files are versioned read-only recovery snapshots.
  `public/backups/` is generated only while packaging a deployment.
- `public/img/<set-id>/manifest.txt` maps exact card identities to stable local
  images. Do not rename images or identities without synchronizing manifests.
- `scripts/` contains maintenance, validation, release, changelog, and recovery
  tooling. `supabase/migrations/` is append-only database history.

## Development commands

Use the runtime versions configured in CI: Node.js 26 and Python 3.15.

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run test:site
npm run test:coverage
npm run test:e2e
python -m pip install -r requirements-dev.txt
python -m unittest discover -s tests/python -v
python scripts/validate_data.py
python scripts/recovery_drill.py backups
```

Run targeted tests during development, then run every relevant suite before
handoff. Workflow edits must also pass actionlint with shellcheck integration.

## Editing rules

- Preserve the no-bundler architecture unless the user explicitly authorizes a
  migration. Browser scripts are classic scripts except maintenance/release
  tooling using `.mjs`.
- Keep the Content Security Policy strict: no inline script/style, unsafe-eval,
  unsafe-inline, wildcard hosts, or new network origins without justification.
- Treat all remote/database content as untrusted. Prefer DOM text APIs and the
  escaping/safe-image helpers in `public/lib.js`.
- Maintain offline behavior and the Supabase-to-CSV fallback when changing data
  loading.
- Keep GitHub Actions pinned to full commit SHAs. Renovate maintains those
  digests.
- Do not weaken RLS, expose editor identities, print secrets, or broaden workflow
  permissions beyond the job that needs them.
- Do not edit generated `public/backups/`; edit the live database or root backup
  fixture as appropriate.
- Add a new migration instead of rewriting an applied migration.

## Tests and required checks

Pull requests to `main` are expected to pass these protected checks:

- `Site checks + JavaScript unit tests`
- `Python tests (scripts)`
- `Browser tests`
- `SonarQube`
- CodeQL checks for JavaScript/TypeScript and Python
- `Dependency review`

The main CI workflow also creates a seven-day `pr-preview-<number>` artifact for
review. It is a packaged static directory and must be served over HTTP, not
opened directly from disk.

When adding logic:

- Put pure browser/release helpers under unit test.
- Add Playwright coverage for visible behavior and critical failure paths.
- Add Python unittest coverage for maintenance scripts.
- Extend `tests/site/ci_checks.mjs` when introducing a CI/CD invariant that
  future edits must preserve.

## Releases and commits

Use Conventional Commits because `scripts/release.mjs` calculates SemVer:

- `fix:` and `perf:` produce a patch release.
- `feat:` produces a minor release.
- `type!:` or a `BREAKING CHANGE:` body produces a major release.
- Other prefixes do not create a release by themselves.

The release workflow runs only after the production pipeline succeeds. It uses
the exact deployed SHA, attaches the retained Pages artifact and checksum,
publishes a GitHub build-provenance attestation and SPDX SBOM, and updates
`CHANGELOG.md`. It also waits for post-merge CodeQL and verifies the tag,
assets, checksum, attestations, and changelog PR before publishing a draft
release. Both the deployed Pages archive and SBOM receive provenance. The changelog is rebuilt from
all SemVer tags on one persistent automation branch, so overlapping releases
cannot drop history. Do not hand-edit a generated release section unless
correcting release history.
Manual release dispatches require a successful main deployment run ID; never
substitute an arbitrary commit or a pull-request run.

Renovate may automerge patch, pin, and digest updates after a three-day release
age and all protected checks. Major updates always require manual review.

## Deployment and operations

- `.github/workflows/ci-quality-deploy.yml` is the only normal production
  pipeline. It tests, packages backups, injects the service-worker version,
  deploys, and smoke-tests the result.
- Disabling maintenance mode dispatches that full pipeline; never restore by
  deploying raw `public/`.
- `.github/workflows/rollback.yml` accepts a successful main pipeline run ID and
  redeploys its retained immutable Pages artifact.
- The weekly production canary tests the browser app, Supabase, logos, and a
  full backup recovery drill. Failures are deduplicated into a GitHub issue and
  the issue closes after recovery.
- Main deployment failures use the same deduplicated issue pattern and close
  automatically after the next successful deployment.
- Backup and changelog automation write through protected auto-merge PRs. Never
  restore a direct-to-main push or grant a broad ruleset bypass. Because PRs
  created by `GITHUB_TOKEN` do not emit normal PR workflow events, those jobs
  explicitly dispatch CI/security with PR metadata on the generated branch.
- Generated PRs must use `scripts/upsert_generated_pr.sh`; it safely reuses an
  existing PR after retries or overlapping scheduled runs. Deployment and
  canary incidents must use `scripts/report_incident.sh` so notification
  behavior and repository selection stay consistent.
- Pull requests merge through GitHub's merge queue. Required workflows must
  retain their `merge_group` triggers. `scripts/generated_pr_status.sh` keeps a
  single status comment on automation PRs, including their checks, queue state,
  and whether auto-merge is enabled.
- Changelog-only changes still run the inexpensive required contract and Python
  jobs, but browser, SonarQube, and preview work uses the change classifier and
  must remain a successful no-op to preserve required check names.
- Keep the repository's **Allow GitHub Actions to create and approve pull
  requests** setting enabled for that automation. The default workflow token
  permission remains read-only; each job must declare its minimal writes.

See `docs/` for adding sets/cards/images, editor access, backups, recovery, and
service-console procedures.

## Handoff expectations

Report changed behavior, tests actually run, tests that could not run, and any
required repository or Supabase setting. Do not claim a workflow or deployment
passed until its remote run has completed successfully.
