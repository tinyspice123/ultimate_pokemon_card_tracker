# Manage card images

The tracker uses a hybrid image system. It tries candidates in this order:

1. A committed local file mapped by the set's `manifest.txt`.
2. The row's `pokemon_card_main.image_url` value.
3. A URL generated from the set's Pokémon TCG API configuration.
4. A URL generated from its TCGdex configuration.
5. The built-in placeholder.

This keeps ordinary sets low-maintenance while protecting unusual variants
from external URL changes.

## Ordinary cards

Leave `image_url` blank when `tcgSet` or `tcgdexSet` can resolve the printed
card number. No download is required.

## Override an incorrect image

Edit the row in Supabase and set `image_url` to the exact HTTPS image. Reload
the tracker and verify the card before making a permanent local copy.

## Create permanent local copies

First refresh the database snapshot, then run the downloader:

```powershell
python scripts/backup_supabase.py
python scripts/download_images.py backups/stellar-crown.csv stellar-crown
```

The downloader saves images under `public/img/<set-id>/` and updates
`manifest.txt` using this identity:

```text
Card|Number|Variant / Stamp|filename.jpg
```

Review and commit the image and manifest together. The daily backup workflow
synchronizes manifest identities but deliberately does not download new files.

## Correct renamed card metadata

If a card name, number, or variant changes but the image remains correct, run:

```powershell
python scripts/sync_manifest.py backups/stellar-crown.csv stellar-crown
```

Use `--check` to report drift without changing the manifest.

