# Backups and restore

Supabase is the live source of truth. GitHub stores independent, readable CSV
snapshots under `backups/`.

## Automated backup

The **Backup Supabase collection** workflow runs daily. It:

1. Reads every configured set from `public.pokemon_cards`.
2. Writes `backups/<set-id>.csv` in stable set order.
3. Synchronizes local image manifests.
4. Validates every snapshot and manifest.
5. Commits only changed files.
6. Dispatches deployment when fallback data changed.

The export uses the public read policy and does not require a secret.

## Manual backup

```powershell
python scripts/backup_supabase.py
python scripts/validate_data.py
```

The exporter fails if a configured set is empty or unavailable. A failed
GitHub Action does not commit partial output.

## Website outage behavior

The website requests Supabase first. If that fails, it reads the latest
deployed `backups/<set-id>.csv` and becomes read-only. Git history retains
earlier snapshots and makes quantity/catalogue changes reviewable.

## Restore

For a new Supabase project:

1. Apply every SQL file under `supabase/migrations/` in order.
2. Configure Google authentication and redirect URLs.
3. Run `scripts/import_supabase_cards.py` with a temporary rotated secret.
4. Remove the secret from the shell environment.
5. Add the intended Auth user UUID to the private editor allowlist.
6. Verify the public read and owner update policies.

The migrations plus CSV files are sufficient to rebuild the current public
catalogue and collection. A full binary database dump is not currently needed;
add one later if private tables or authentication data become recovery-critical.
