# Service consoles

These management links are safe to bookmark; authentication is handled by each
service.

- [Supabase project dashboard](https://supabase.com/dashboard/project/ekyngjwtoxvkqfalxebm) — database, SQL Editor, Authentication users, logs, and settings.
- [GitHub repository](https://github.com/tinyspice123/ultimate_pokemon_card_tracker) — source, commits, backups, and pull requests.
- [GitHub Actions](https://github.com/tinyspice123/ultimate_pokemon_card_tracker/actions) — deploys, scheduled backups, maintenance mode, and canary checks.
- [Repository Actions secrets](https://github.com/tinyspice123/ultimate_pokemon_card_tracker/settings/secrets/actions) — deployment and analysis secrets. Never commit a Supabase secret key.
- [Renovate pull requests](https://github.com/tinyspice123/ultimate_pokemon_card_tracker/pulls?q=is%3Apr%20author%3Aapp%2Frenovate) — dependency and GitHub Action update proposals.
- [SonarCloud project](https://sonarcloud.io/project/overview?id=tinyspice123_ultimate_pokemon_card_tracker) — Quality Gate history and code-quality findings. If `SONAR_HOST_URL` points to a self-hosted server, use that server's project page instead.

## Routine checks

After a collection change, run **Backup Supabase collection** from GitHub
Actions and confirm that **Tests / Security / Deploy** succeeds. Review
Renovate major-update pull requests individually. Patch, pin, and digest
updates wait for the protected checks and then merge automatically after a
three-day minimum release age.

In **Settings → Actions → General**, keep **Workflow permissions** read-only and
enable **Allow GitHub Actions to create and approve pull requests**. Generated
backup and changelog branches rely on that setting, while their workflows grant
only the job-level write permissions they need.

Pull requests produce a `pr-preview-<number>` artifact after browser and
quality checks pass. Download it from the workflow run and serve the extracted
directory with a local static HTTP server for visual review.

The weekly **Production dependency canary** checks the deployed browser app,
Supabase, set logos, and a full backup recovery into an isolated database. A
failure opens or updates one `Production canary failure` issue; the next fully
successful run closes it automatically.

Production pipeline failures similarly maintain one `Production deployment
failure` issue. Release assets include the deployed Pages tarball, its SHA-256
checksum, an SPDX JSON SBOM, and GitHub-hosted build provenance. A release waits
for the post-merge CodeQL checks, then verifies its tag target, assets,
checksum, attestation, and protected changelog PR. The complete changelog is
rebuilt from SemVer tags through one reusable automation PR.
Manual release runs require the numeric ID of a successful main
**Tests / Security / Deploy** run, preventing an unvalidated commit or a release
without its deployed artifact from being published.
