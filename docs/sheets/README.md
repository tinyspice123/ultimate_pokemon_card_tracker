# Standard master-set CSVs

These files match the live Stellar Crown sheet structure:

`Group, Card, Number, Variant / Stamp, Source & Distribution, Status, Have, Image, Price Estimate`

They contain only the numbered set and its standard `Regular` and eligible
`Reverse holo` printings. Promos, retailer stamps, staff cards, product
exclusives and regional variants are intentionally excluded. `Have`, `Image`
and `Price Estimate` are blank so importing a template never claims ownership
or overwrites those values with generated data.

Card names, collector numbers, rarities and variant availability were generated
from the English TCGdex dataset on 21 July 2026. Variant data can be corrected
by publishers after release, so compare newly released sets against an official
checklist before treating them as final.

## Import into Google Sheets

1. Create or select the destination tab.
2. Choose **File → Import → Upload** and select the set's CSV.
3. Set **Import location** to **Replace current sheet**.
4. Leave **Separator type** on **Detect automatically** (or choose **Comma**).
5. Confirm the header occupies row 1 and `Base Set` occupies row 2.
6. Publish that individual tab as CSV and add its numeric `gid` as the set's
   `sheetGid` in `public/sets.js`; the shared URL is configured only once.

The files use UTF-8 with a byte-order mark so Pokémon names and punctuation
import cleanly into both Google Sheets and desktop spreadsheet applications.
