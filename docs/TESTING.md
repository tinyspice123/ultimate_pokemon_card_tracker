# Testing strategy

## Local commands

Use Node.js 26 and Python 3.15, matching CI.

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

Workflow edits additionally require actionlint with ShellCheck integration, and
shell helpers require both ShellCheck and `tests/shell/` coverage.

## Choosing coverage

| Change | Minimum useful coverage |
| --- | --- |
| HTML, CSS, assets, set config | Site checks; Playwright for visible behavior |
| Browser logic | JavaScript unit tests plus relevant Playwright scenario |
| Python maintenance script | Python unittest and validation/recovery command when applicable |
| Shell helper or workflow | Shell test, actionlint/ShellCheck, CI invariant test |
| Schema, CSV, or identity | Python tests, data validation, recovery drill, browser fallback test |
| Release/changelog logic | Unit classification/history tests and workflow contract checks |

## Test boundaries

Unit, site, Python, shell, and end-to-end tests must be deterministic and avoid
live external services. Playwright mocks Supabase and packaged backups when
testing outages. Only `tests/production/` and explicit asset checks intentionally
use the network; they run as operational canaries rather than PR correctness
tests.

For a defect, first add the smallest regression that demonstrates user-visible
or contract-level failure. Keep fixtures anonymous and minimal. Avoid assertions
on generated formatting when the behavior has a more stable observable result.

## CI contract

Branch protection requires the check names listed in `AGENTS.md`. Change
classification may skip expensive implementation work, but each required job
must still conclude successfully. Failed browser runs retain diagnostics, and PR
builds publish a seven-day static preview artifact that must be served over HTTP.
Do not report a remote check as passing until GitHub shows its final conclusion.

