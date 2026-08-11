# Add or edit cards

Cards live in Supabase's `public.pokemon_cards` table. Changes appear on the
website immediately; a code deployment is not required unless an image or set
configuration file also changes.

## Add one card

Open **Supabase → SQL Editor** and adapt this query:

```sql
insert into public.pokemon_cards (
  id, set_id, sort_order, group_name, card_name, collector_number,
  variant, source, status, price, quantity, image_url
)
select
  gen_random_uuid()::text,
  'stellar-crown',
  coalesce(max(sort_order), -1) + 1,
  'Main Set',
  'Pikachu',
  '001/142',
  'Regular',
  '',
  'Confirmed',
  '',
  0,
  ''
from public.pokemon_cards
where set_id = 'stellar-crown';
```

Required rules:

- `id` must be globally unique. A generated UUID is preferred.
- `set_id` must exactly match a key in `public/sets.js`.
- `sort_order` must be unique within that set.
- `quantity` must be zero or greater.
- Variants of the same printed card need separate rows and IDs.

Use **Table Editor → pokemon_cards** for simple corrections to an existing
row. Quantity changes can normally be made with the website's `+` and `−`
buttons.

## Add cards in bulk

Supabase Table Editor can import a CSV with these headings:

```csv
id,set_id,sort_order,group_name,card_name,collector_number,variant,source,status,price,quantity,image_url
```

Generate a different UUID for every row and assign sequential `sort_order`
values. Check for conflicts with existing rows before importing.

`scripts/import_supabase_cards.py` is intended for initial migration or a full
restore. Do not casually run it against stale repository snapshots because it
can replace current quantities with older CSV values.

## Refresh the recovery snapshot

After making important database changes, run **Backup Supabase collection**
from the repository's GitHub Actions page. The normal daily schedule will also
capture them automatically.

