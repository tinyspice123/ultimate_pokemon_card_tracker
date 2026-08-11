# Ultimate Pokémon Card Tracker

A static, multi-set Pokémon card collection tracker backed by Supabase, with
versioned database exports retained as a read-only fallback. The home page lists configured sets and their completion; each set opens
the same reusable tracker with shareable filtering, ownership totals, prices,
owned/missing/spares exports, offline caching, local card images, and
marketplace search links. Display and sort preferences persist in the browser.

The site has no application bundling step. Before GitHub Pages receives
`public/`, CI replaces the service worker's cache-version placeholder with the
deploying commit's short SHA and copies the canonical `backups/*.csv` snapshots
into a generated `public/backups/` directory.

## Quick start

Requirements:

- Node.js 24 for checks and browser tests
- Python 3.14 for maintenance scripts and their tests

Install the development dependencies:

```bash
npm ci
```

Run the site locally:

```bash
node tests/e2e/static-server.mjs public
```

Then open <http://127.0.0.1:4173/>. The local server is deliberately small and
serves only the checked-in files under `public/`. It does not package the root
backup snapshots; deterministic Playwright tests mock the deployed
`/backups/<set-id>.csv` endpoint when exercising outage behavior.

Sora and Unbounded are self-hosted under `public/assets/fonts/`, including
their OFL license files, so typography works without Google Fonts or a network
connection.

## Operations guides

Routine maintenance is documented separately:

- [Add or edit cards](docs/ADDING_CARDS.md)
- [Add a new set](docs/ADDING_SETS.md)
- [Delete or archive a set](docs/DELETING_SETS.md)
- [Manage editor access](docs/EDITOR_ACCESS.md)
- [Manage card images](docs/IMAGES.md)
- [Backups and restore](docs/BACKUPS.md)
- [Repository recovery](docs/RECOVERY.md)
- [Service consoles and routine checks](docs/SERVICES.md)

## Tracker controls

- Search, group, and missing-only filters are encoded in the URL so a filtered
  checklist can be shared. Search edits replace the current history entry;
  discrete group/missing changes remain navigable with Back and Forward.
- Card/table view and sort selection persist locally between visits.
- Missing, owned, and spares (`Have > 1`) lists can be copied or downloaded as
  CSV. Exports respect the active search and group filters.
- Press `/` to focus search and `m` to toggle missing-only while keeping the
  shareable URL synchronized.

## Install on a phone

The tracker is a Progressive Web App named **Card Tracker**. Its Mew launcher
art is stored in `public/assets/` at 192px, 512px, and Android maskable sizes.
On Android, open the deployed site in Chrome and choose **Install app** or
**Add to Home screen**. On iPhone, open it in Safari and choose
**Share → Add to Home Screen**. Remove and reinstall an existing shortcut after
an icon change so the phone refreshes the cached launcher artwork.

## Add or edit a set

Set configuration lives in [`public/sets.js`](public/sets.js). Add one entry to
the `SETS` object:

```js
"stellar-crown": {
  name: "Stellar Crown",
  code: "SV7",
  tcgSet: "sv7",
  tcgdexSet: "sv07",
  subtitle: "English master set",
},
```

Rules:

- Use a unique, kebab-case key such as `stellar-crown`.
- Insert the set's card rows into Supabase with this registry key as `set_id`.
- `tcgSet` is the Pokémon TCG API set code; `tcgdexSet` is the TCGdex code.
- Optional fields include `logo`, `eyebrow`, `subtitle`, `imgTemplate`,
  `promoSet`, and `cardmarketSet`.

After editing the registry, run:

```bash
npm run test:site
python scripts/check_logos.py
```

The first command catches malformed configuration and missing site assets. The
second checks external logo fallbacks and therefore needs internet access.

## Supabase database and owner login

Supabase is the primary catalogue and collection store. The collection is
publicly readable, but only user IDs in the private editor allowlist can change
quantities. That restriction is enforced by Row Level Security without
publishing the owner's email address.

1. Apply the migration through the Supabase SQL editor or the linked-repository
   migration workflow.
2. In **Authentication → Providers → Google**, enable Google and enter the
   OAuth client ID and client secret from Google Cloud.
3. In **Authentication → URL Configuration**, set the deployed GitHub Pages
   site URL and add the deployed tracker URL plus
   `http://127.0.0.1:4173/tracker.html` as allowed redirect URLs.
4. Import the current checked-in CSV snapshots into the database:

```powershell
$env:SUPABASE_URL = "https://ekyngjwtoxvkqfalxebm.supabase.co"
$env:SUPABASE_SECRET_KEY = "your-rotated-secret-key"
python scripts/import_supabase_cards.py
Remove-Item Env:SUPABASE_SECRET_KEY
```

The secret key is only for this local import command. Never put it in
`public/`, commit it, or expose it to browser code. The publishable browser key
in `public/supabase-config.js` is intentionally public and remains constrained
by the database policy.

The importer preserves quantities from the `Have` columns. If Supabase is
temporarily unavailable, the tracker automatically falls back to the latest
committed database export and remains read-only.

## CSV snapshot format

Import [`docs/template.csv`](docs/template.csv) into a new sheet tab and replace
the example rows. The tracker recognises these columns:

| Column | Purpose |
| --- | --- |
| Group | Section heading used by the group filter |
| Card | Displayed card name |
| Number | Collector number, for example `107/142` or `SVP 134` |
| Variant / Stamp | Finish, promo source, stamp, or other distinction |
| Source | Optional source or product note |
| Status | Optional checklist status |
| Price | Estimated value of one copy |
| Have | Owned quantity, `x`, or `TRUE` |
| Image URL | Optional exact image override |

This format is produced automatically by `scripts/backup_supabase.py`. It can
also be prepared manually for an initial bulk import.

## Local logos and card images

The site first uses files committed under `public/assets/` and `public/img/`, so
important artwork remains stable even if an external API changes.

Download or refresh all configured set logos:

```bash
python scripts/download_assets.py
```

### Create a card-image manifest

Put the correct source URL in Supabase's `image_url` column, refresh the snapshot,
then run the downloader with the set's `sets.js` key:

```bash
python scripts/backup_supabase.py
python scripts/download_images.py backups/stellar-crown.csv stellar-crown
```

The downloader reads every row with a Card and Image URL, downloads those files
to `public/img/<set-id>/`, and updates `manifest.txt` automatically in this
format:

```text
Card|Number|Variant / Stamp|filename.jpg
```

It preserves valid local mappings for current rows whose Image URL is blank,
including newly added foil variants that share a Card and Number with one
existing scan. Stale rows are removed. Commit the images and manifest together;
rows without either a local mapping or an Image URL continue using the
configured card-image APIs.

If Card, Number, or Variant wording changes later, re-key the existing manifest
without downloading the images again:

```bash
python scripts/sync_manifest.py backups/stellar-crown.csv stellar-crown
```

Use `--check` to report drift without editing the manifest. Cosmetic case and
punctuation changes are already ignored by runtime lookup; the sync command
handles unambiguous wording changes and refuses uncertain matches.
The scheduled backup workflow runs synchronization automatically before
validating and committing refreshed backups. It deliberately does not download
new image files; generating and reviewing repository assets remains an explicit
step. At runtime, a local manifest image takes priority, followed by the
database `image_url` and then the configured API fallbacks.

## Back up collection data

Run this manually to export every configured set from Supabase into `backups/`:

```bash
python scripts/backup_supabase.py
```

The scheduled backup workflow runs the same command daily and commits only
when database data changed. It also synchronizes image manifests; when that changes
anything under `public/`, the workflow explicitly dispatches the normal test and
deployment pipeline so production never waits for an unrelated push.
Temporary timeouts, rate limits, and server errors receive three attempts with
exponential backoff.

At runtime the tracker requests Supabase first. If that request fails, it
requests `backups/<set-id>.csv` from the deployed site and shows a warning that
the latest snapshot is in use. Only root `backups/` is
version-controlled; CI creates `public/backups/` while packaging the Pages
artifact, so the repository does not store duplicate CSV copies. Earlier
snapshots remain recoverable through Git history.

Validate every configured backup and exact-variant image mapping offline with:

```bash
python scripts/validate_data.py
```

The validator rejects malformed backup columns, missing collector numbers,
duplicate card variants, invalid quantities, stale manifest mappings, missing
image files, and orphaned local images.

## Tests

Run each test layer from the repository root:

```bash
npm run test:site
npm run test:coverage
npm run test:e2e
npm run test:python
```

- `npm run test:site` runs ESLint, then `tests/site/` validates configuration,
  HTML, CSP, JavaScript syntax, workflow policy, deployment dispatch behavior,
  service-worker version injection, and PWA precaching.
- `tests/unit/` exercises shared JavaScript and service-worker behavior.
- `tests/python/` tests the maintenance scripts without real network calls.
- `tests/e2e/` runs the tracker in desktop and mobile Chrome with deterministic
  mocked database/snapshot data, plus a service-worker-enabled offline reload integration
  test.

JavaScript coverage is written to `coverage/`; Playwright failures are written
to `test-results/`. Both are generated and ignored by Git.

## CI and deployment

On pushes to `main` and pull requests, GitHub Actions runs:

1. Site checks and JavaScript unit coverage.
2. Python unit coverage.
3. `actionlint` workflow validation with `shellcheck` applied to embedded Bash.
4. Desktop and mobile Playwright tests and SonarQube Quality Gate validation
   in parallel.
5. A packaging job, gated on both browser and SonarQube success, injects a
   commit-derived service-worker shell cache version, copies `backups/*.csv`
   into generated `public/backups/`, and uploads `public/`.
6. A narrowly permissioned deployment job publishes the Pages artifact.
7. Post-deployment smoke checks for the home page, tracker, manifest, and
   service worker.

The weekly **Production dependency canary** checks that the live Supabase
catalogue API returns configured card data. This monitors the primary data
source even when no deployment occurs.

### Maintenance mode

To replace the site temporarily with its maintenance page, open **Actions →
Toggle maintenance mode → Run workflow**, choose `enable`, and run it. Choose
`disable` to redeploy the current site from `public/`. A later successful normal
deployment also replaces maintenance mode with the live site.

For rollback, database restoration, outage and image-repair procedures, see the
[recovery runbook](docs/RECOVERY.md).

The workflow uses least-privilege job permissions. Pages deployment requires
`pages: write` and `id-token: write`; SonarQube authentication also uses an OIDC
token.

## Project structure

```text
.
├── public/                 # Entire GitHub Pages site; URLs are rooted here
│   ├── index.html          # Set selection page
│   ├── tracker.html        # Shared tracker page for every set
│   ├── index.js/css        # Home-page behavior and styles
│   ├── tracker.js/css      # Tracker behavior and styles
│   ├── lib.js              # Shared, testable data and image logic
│   ├── sets.js             # Set registry and sheet URLs
│   ├── sw.js               # Offline service worker with CI version placeholder
│   ├── fonts.css           # Self-hosted font declarations
│   ├── manifest.json       # PWA metadata
│   ├── assets/             # Icons, fonts/licenses, and mirrored set logos
│   ├── backups/            # Generated only in the deployed Pages artifact
│   └── img/<set-id>/       # Local card variants and manifest
├── scripts/                # Download, validation, and backup tools
├── tests/
│   ├── site/               # Static repository/site checks
│   ├── unit/               # JavaScript unit tests
│   ├── python/             # Python script tests
│   └── e2e/                # Playwright tests and local static server
├── docs/template.csv       # Example sheet tab to import
├── backups/                # Versioned collection snapshots
├── playwright.config.mjs
├── eslint.config.mjs
├── sonar-project.properties
└── package.json
```

Root-level files are limited to project configuration and documentation. Runtime
files belong in `public/`; test fixtures belong with their test layer.

## Troubleshooting

**The page is blank locally** — serve `public/` with the command in Quick start.
Opening the HTML directly with a `file://` URL prevents normal fetch and service
worker behavior.

**A set does not appear** — run `npm run test:site` and check its entry in
`public/sets.js`. The key must be kebab-case and the sheet URL must end with a
published CSV output parameter.

**Database data does not load** — confirm the migration and initial import ran,
the table is named `pokemon_card_main`, and its public SELECT policy is enabled.
If the URL works directly, check the browser console for a CSP error on a
changed `doc-XX-YY-sheets.googleusercontent.com` shard and follow the
[recovery runbook](docs/RECOVERY.md).

**A local card image does not appear** — check that its file and manifest are in
`public/img/<set-id>/`. Manifest matching ignores cosmetic case and punctuation;
for substantive label changes, run `scripts/sync_manifest.py`. Clear the sheet's
Image URL if you want the local image to win.

**A logo is missing** — run `python scripts/download_assets.py`, then commit the
new file under `public/assets/logos/`.

**Changes look stale** — reload once while online. The service worker uses a
network-first strategy for pages and configuration, but an already-open tab can
still display its previously loaded version until refreshed.
