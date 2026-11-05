# Delta Reign

The `delta-reign` registry entry follows the Mega Evolution set format (`ME06`).
Its English pack checklist contains 141 numbered cards and 93 reverse holos,
for 234 rows, all initially unowned. Store stamps and separately numbered
promos are outside this pack checklist.

Sources verified on November 5, 2026:

- [English card list and release details](https://www.pokebeach.com/2026/10/delta-reign-set-guide-full-card-list-cut-cards-product-lineup-store-promos-and-more)
- [Pack variants and logo](https://mastersetlists.com/delta-reign-master-set/)
- [English card scans](https://billsarchive.com/delta-reign.html)

The logo is bundled at `public/assets/logos/delta-reign.png`. TCGdex's `me06`
endpoint returned 404 during verification. The set now bundles 44 verified
English card scans under `public/img/delta-reign/`, mapped to 69 exact variant
identities in `manifest.txt`. Regular and reverse-holo rows share the numbered
card's scan, as with other sets. Remaining cards use the existing provider
fallback and placeholder until English scans become available. Japanese,
French, and Spanish previews are not substituted for English cards.
Cardmarket uses a set-name search until its catalogue code can be verified.

Migration `202611050001_add_delta_reign.sql` seeds only this set with the same
stable IDs as the CSV importer. Existing IDs are skipped, preserving quantities.
The protected production migration job applies it before Pages packaging.
Do not run the full snapshot importer against production to add this set.
