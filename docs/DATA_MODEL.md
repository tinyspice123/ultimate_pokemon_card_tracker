# Data model

## Set registry

`public/sets.js` owns presentation and external-provider metadata. Its kebab-case
key is the canonical `set_id` used by Supabase, CSV filenames, image directories,
URLs, validation, and recovery tooling. Removing a registry entry is therefore a
cross-system operation, not merely a UI change.

## Live tables

`public.pokemon_card_main` contains one row per exact card variant:

| Column | Contract |
| --- | --- |
| `id` | Stable text primary key; importer uses the first 32 hex characters of SHA-256 over `set_id\0card_name\0collector_number\0variant`. |
| `set_id` | Registry key. |
| `sort_order` | Display order, unique within a set. |
| `group_name` | Section/filter label. |
| `card_name` | Display name. |
| `collector_number` | Printed/promotional number. |
| `variant` | Finish, stamp, or other exact distinction. |
| `source`, `status`, `price` | Optional display metadata stored as text. |
| `image_url` | Optional exact remote image override. |
| `quantity` | Non-negative owned count; the only browser-edited card field. |

`public.pokemon_card_quantity_history` is an append-only audit trail containing
card ID, set, name, collector number, previous/new quantity, authenticated actor
UUID, and timestamp. A trigger writes it after quantity changes. Editors may
read it; browser clients cannot mutate it.

`private.collection_editors` stores authorized `auth.users.id` UUIDs. Clients
cannot read this table; `public.is_collection_editor()` exposes only membership.

## Snapshot mapping

The CSV contract maps `Group`, `Card`, `Number`, `Variant / Stamp`, `Source`,
`Status`, `Price`, `Have`, and `Image URL` to the live card fields. Blank rows
with a Group value establish the following section. `Have` is normalized to a
non-negative integer by import/recovery tools. Snapshots are recovery artifacts,
not the normal authoring source after initial import.

## Image manifests

`public/img/<set-id>/manifest.txt` contains
`Card|Number|Variant|filename`. The three descriptive fields form the exact
lookup identity; the filename is a stable repository asset. Manifests and image
files must move together. Validation rejects duplicates, missing files, unsafe
paths, and entries without a corresponding snapshot row.

## Invariants and changes

- Card identity is set + card + collector number + variant. Cosmetic edits can
  change the importer-derived ID, so use the manifest sync tool and plan live
  data migration before renaming identity fields.
- Quantities are never negative. Each set's sort order is unique.
- Every configured set has a valid snapshot; each snapshot identity is unique.
- Database schema changes use a new migration and update client selection,
  importer/exporter, validation, recovery drill, fixtures, and this document.

