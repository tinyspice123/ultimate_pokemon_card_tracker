# Add a new set

Use the same lowercase, kebab-case set ID everywhere. For example:

```text
example-new-set
```

## 1. Add the registry entry

Add an entry to `public/sets.js`:

```js
"example-new-set": {
  name: "Example New Set",
  code: "EX1",
  homeGroup: "mega",
  tcgSet: "api-set-code",
  tcgdexSet: "tcgdex-code",
  cardmarketSet: "EX1",
  subtitle: "English master set",
},
```

Valid `homeGroup` values are `sv`, `mega`, and `misc`.

## 2. Insert the database rows

Add the cards to `public.pokemon_cards` using the registry key as `set_id`.
Start `sort_order` at zero and increment it for every card/variant row. See
[Add or edit cards](ADDING_CARDS.md) for SQL and CSV examples.

Add database rows before deploying the registry entry. The backup workflow
intentionally fails when a configured set has no cards, preventing an empty
snapshot from replacing a valid collection.

## 3. Add image metadata

Create this file, even if it initially remains empty:

```text
public/img/example-new-set/manifest.txt
```

Add a local PNG logo when available:

```text
public/assets/logos/example-new-set.png
```

The configured Pokémon TCG API or TCGdex set code provides fallback logos and
ordinary card images. See [Manage card images](IMAGES.md).

## 4. Generate and validate the snapshot

```powershell
python scripts/backup_supabase.py
python scripts/validate_data.py
npm run test:site
```

Commit the registry, manifest, optional images/logo, and generated snapshot.
Push the changes so GitHub Pages deploys the new set.

