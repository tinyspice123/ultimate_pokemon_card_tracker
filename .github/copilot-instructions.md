# Copilot instructions

Follow the canonical contributor guidance in `/AGENTS.md` for every change.
Also follow the closest scoped `AGENTS.md` under `public/`, `scripts/`,
`.github/`, `tests/`, or `supabase/`. Use `docs/ARCHITECTURE.md`,
`docs/DATA_MODEL.md`, `docs/TESTING.md`, and `docs/decisions/` for the durable
system contracts behind those instructions.

Key constraints:

- This is a zero-build static PWA in `public/`; preserve offline and CSV fallback
  behavior.
- Never expose Supabase secret/service-role keys or weaken RLS/CSP protections.
- Keep Actions pinned to full SHAs and workflow permissions least-privileged.
- Use Conventional Commits; release SemVer and `CHANGELOG.md` are automated.
- Add unit, Playwright, or Python tests appropriate to changed behavior and run
  `npm run test:site` plus relevant suites.
- Treat `public/sets.js`, root `backups/*.csv`, and image manifests according to
  the source-of-truth rules documented in `AGENTS.md`.
- Do not bypass the validated deployment, maintenance restoration, or rollback
  workflows.
- Generated backup/changelog PRs must use the shared upsert/status helpers;
  releases remain drafts until artifact, checksum, attestation, and changelog
  verification succeeds.
