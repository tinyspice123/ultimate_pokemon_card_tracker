# CI, generated PRs, and releases

## Protected pull requests

Pull requests to `main` must pass site and JavaScript tests, Python tests,
browser tests, SonarQube, CodeQL for JavaScript/TypeScript and Python, and
dependency review. The ruleset requires zero approving reviews, so approval and
auto-merge are separate: a PR merges automatically only after its required
checks and branch conditions pass.

The CI change classifier keeps all required check names present. For changes
limited to `README.md`, `CHANGELOG.md`, or `docs/`, browser, SonarQube, and
preview jobs complete as successful no-ops while the workflow, unit, Python,
and security checks continue to run.

This personal-account repository cannot enable GitHub Merge Queue. The
workflows retain `merge_group` support for a future organization transfer.
Until then, the scheduled **Generated PR status** workflow updates behind
automation branches and maintains one PR comment containing check, merge,
review, and auto-merge status.

## Generated backup and changelog PRs

`scripts/upsert_generated_pr.sh` is the single path for generated changes. It:

1. Updates the persistent automation branch with force-with-lease protection.
2. Reuses an open PR, creates one, or recovers a safely reusable closed PR.
3. Dispatches **Tests / Security / Deploy** and **Security scanning** with PR
   metadata because `GITHUB_TOKEN`-created PRs do not emit ordinary PR workflow
   events.
4. Enables protected squash auto-merge.
5. Creates or refreshes the maintained automation-status comment.

The backup branch is `automation/collection-backup`; the release changelog
branch is `automation/release-changelog`. The complete changelog is rebuilt
from SemVer tags, so overlapping releases cannot omit earlier history.

## Transactional releases

A successful production deployment triggers the release workflow. It resolves
the exact deployed run and SHA, waits for post-merge CodeQL, calculates SemVer
from Conventional Commits, downloads the retained Pages artifact, generates an
SPDX JSON SBOM, and creates provenance attestations for both files.

The GitHub Release remains a draft while the workflow verifies:

- the draft targets the deployed SHA;
- the Pages archive, SHA-256 checksum, and SBOM exist;
- the checksum matches;
- both provenance attestations verify;
- the protected changelog PR exists on the persistent branch.

Only then is the draft published and its tag target checked. A failure leaves
the release unpublished and opens or updates one `Production release failure`
issue. The next successful release run closes that incident automatically.

Manual release dispatches require the numeric run ID of a successful `main`
**Tests / Security / Deploy** run. This prevents releases from arbitrary or
unvalidated commits.
