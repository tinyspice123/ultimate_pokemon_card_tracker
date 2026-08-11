# Delete or archive a set

Deleting a set affects Supabase, the website registry, repository snapshots,
and possibly local images. Prefer archiving when there is any chance the set
will be needed again.

## 1. Capture a final backup

Run **Backup Supabase collection** from GitHub Actions, or locally:

```powershell
python scripts/backup_supabase.py
python scripts/validate_data.py
```

Commit that final snapshot before deleting anything. Git history can then
recover the collection later.

## 2. Verify the exact database target

Replace `example-new-set` and run this read-only query in Supabase SQL Editor:

```sql
select set_id, count(*) as card_rows, sum(quantity) as total_copies
from public.pokemon_cards
where set_id = 'example-new-set'
group by set_id;
```

Stop if the returned set ID or row count is unexpected.

## 3. Delete the database rows

After verifying the target, run:

```sql
delete from public.pokemon_cards
where set_id = 'example-new-set';
```

This is permanent in Supabase. The final committed CSV snapshot remains the
recovery source.

## 4. Remove the website entry and files

Remove the matching object from `public/sets.js`, then remove these paths when
they exist:

```text
backups/example-new-set.csv
public/img/example-new-set/
public/assets/logos/example-new-set.png
```

Deleting repository files through Git remains recoverable from Git history.
If images should be retained for future use, move them to an explicit archive
outside `public/` instead of deleting them.

## 5. Validate and deploy

```powershell
python scripts/validate_data.py
npm run test:site
```

Commit the database-removal documentation or migration, registry change,
snapshot deletion, and asset deletion together. Push once the checks pass.

Do not run the daily backup between deleting the database rows and removing
the registry entry: the workflow intentionally fails when a configured set has
no database cards.

## Restore a deleted set

1. Restore its registry entry, CSV snapshot, image directory, and logo from
   Git history.
2. Import only that restored set through Supabase's CSV import or a
   set-specific SQL restore. Do not run the full initial-import script unless
   every snapshot is current, because it can overwrite newer quantities.
3. Run the backup and validation workflows.
4. Deploy only after the set appears correctly in Supabase and locally.
