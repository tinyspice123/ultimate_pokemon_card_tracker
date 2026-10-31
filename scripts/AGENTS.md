# Maintenance tooling guidance

This file applies to `scripts/` and supplements `../AGENTS.md`.

- Keep reusable logic importable and keep network/process entry points behind a
  `main` guard. Add regression tests under `tests/python`, `tests/unit`, or
  `tests/shell` according to the implementation language.
- Make generated output deterministic, stable-sorted, and atomic where partial
  output would be harmful. Retries must be bounded and limited to transient
  failures.
- Never print tokens, secret keys, editor identities, or authenticated response
  bodies. Secret-key tooling must read credentials from environment variables.
- `backup_supabase.py` produces recovery snapshots; `validate_data.py` enforces
  their identities; `recovery_drill.py` proves they can reconstruct data. Keep
  these contracts aligned when the CSV schema changes.
- The importer derives card IDs from set, card, number, and variant. A change to
  that algorithm is a data migration, not a cosmetic refactor.
- Image scripts must retain valid local files, reject ambiguous mappings, and
  write four-part `card|number|variant|filename` manifests.
- Generated-PR and incident workflows must use the shared shell helpers. Keep
  shell code compatible with GitHub's Ubuntu runners and passing ShellCheck.
- Release/changelog logic uses Conventional Commits and SemVer tags. Add tests
  for classification and edge cases before changing release behavior.

