// =====================================================================
//  SET REGISTRY — add a new set here and it appears on the home page
//  and gets its own tracker at tracker.html?set=<id>
//
//  Card rows and quantities live in Supabase's pokemon_card_main table. This
//  registry supplies presentation and external image/API metadata only.
//
//  Fields:
//   name       display name  ·  code: display code for the home tile
//   tcgSet     pokemontcg.io id (images + logo; covers sets up to ~2025)
//   tcgdexSet  TCGdex id (images + logo; covers newer sets incl. Mega era)
//   cardmarketSet  Cardmarket catalog code used in marketplace searches
//   cardmarketUrl  optional collection-wide Cardmarket page (e.g. a species)
//   homeGroup  home-page section: sv, mega, or misc
//   logo / imgTemplate / promoSet / subtitle / eyebrow: optional
// =====================================================================

const SETS = {

  // ==================================================================
  //  SCARLET & VIOLET ERA (2023–2025) — un-comment as you add tabs
  //  These all work with pokemontcg.io via tcgSet.
  // ==================================================================

  "scarlet-violet": {          // Mar 2023
    name: "Scarlet & Violet",
    homeGroup: "sv",
    tcgSet: "sv1",
    cardmarketSet: "SVI",
  },

  "paldea-evolved": {          // Jun 2023
    name: "Paldea Evolved",
    homeGroup: "sv",
    tcgSet: "sv2",
    cardmarketSet: "PAL",
  },

  "obsidian-flames": {         // Aug 2023
    name: "Obsidian Flames",
    homeGroup: "sv",
    tcgSet: "sv3",
    cardmarketSet: "OBF",
  },

  "pokemon-151": {             // Sep 2023 · special set (no reverse holos; Poké Ball / Master Ball foils instead)
    name: "151",
    homeGroup: "sv",
    tcgSet: "sv3pt5",
    cardmarketSet: "MEW",
  },

  "paradox-rift": {            // Nov 2023
    name: "Paradox Rift",
    homeGroup: "sv",
    tcgSet: "sv4",
    cardmarketSet: "PAR",
  },

  "paldean-fates": {           // Jan 2024 · special set (shiny Pokémon)
    name: "Paldean Fates",
    homeGroup: "sv",
    tcgSet: "sv4pt5",
    cardmarketSet: "PAF",
  },

  "temporal-forces": {         // Mar 2024
    name: "Temporal Forces",
    homeGroup: "sv",
    tcgSet: "sv5",
    cardmarketSet: "TEF",
  },

  "twilight-masquerade": {     // May 2024
    name: "Twilight Masquerade",
    homeGroup: "sv",
    tcgSet: "sv6",
    cardmarketSet: "TWM",
  },

  "shrouded-fable": {          // Aug 2024 · special set
    name: "Shrouded Fable",
    homeGroup: "sv",
    tcgSet: "sv6pt5",
    cardmarketSet: "SFA",
  },

  "stellar-crown": {
    name: "Stellar Crown",
    homeGroup: "sv",
    tcgSet: "sv7",
    cardmarketSet: "SCR",
  },

  "surging-sparks": {          // Nov 2024
    name: "Surging Sparks",
    homeGroup: "sv",
    tcgSet: "sv8",
    cardmarketSet: "SSP",
  },

  "prismatic-evolutions": {    // Jan 2025 · special set (Eeveelutions; Poké Ball / Master Ball foils)
    name: "Prismatic Evolutions",
    homeGroup: "sv",
    tcgSet: "sv8pt5",
    cardmarketSet: "PRE",
  },

  // ---- 2025 sets: pokemontcg.io coverage gets patchy here, so these ----
  // ---- carry BOTH ids — the fallback chain uses whichever responds. ----

  "journey-together": {        // Mar 2025
    name: "Journey Together",
    homeGroup: "sv",
    tcgSet: "sv9",
    tcgdexSet: "sv09",
    cardmarketSet: "JTG",
  },

  "destined-rivals": {         // May 2025
    name: "Destined Rivals",
    homeGroup: "sv",
    tcgSet: "sv10",
    tcgdexSet: "sv10",
    cardmarketSet: "DRI",
  },

  "black-bolt": {              // Jul 2025 · special set (paired with White Flare)
    name: "Black Bolt",
    homeGroup: "sv",
    tcgSet: "zsv10pt5",        // VERIFY — open images.pokemontcg.io/zsv10pt5/logo.png
    tcgdexSet: "sv10.5b",      // VERIFY on tcgdex.net
    cardmarketSet: "BLK",
  },

  "white-flare": {             // Jul 2025 · special set (paired with Black Bolt)
    name: "White Flare",
    homeGroup: "sv",
    tcgSet: "rsv10pt5",        // VERIFY — open images.pokemontcg.io/rsv10pt5/logo.png
    tcgdexSet: "sv10.5w",      // VERIFY on tcgdex.net
    cardmarketSet: "WHT",
  },

  // ==================================================================
  //  MEGA EVOLUTION ERA (2025–) — not on pokemontcg.io; TCGdex only
  // ==================================================================

  "mega-evolution": {          // Sep 2025
    name: "Mega Evolution",
    homeGroup: "mega",
    code: "ME01",
    tcgdexSet: "me01",
    cardmarketSet: "MEG",
  },

  "phantasmal-flames": {       // Nov 2025
    name: "Phantasmal Flames",
    homeGroup: "mega",
    code: "ME02",
    tcgdexSet: "me02",
    cardmarketSet: "PFL",
  },

  "ascended-heroes": {         // Jan 2026 · special set
    name: "Ascended Heroes",
    homeGroup: "mega",
    code: "ME02.5",
    tcgdexSet: "me02.5",       // VERIFY on tcgdex.net
    cardmarketSet: "ASC",
  },

  "perfect-order": {
    name: "Perfect Order",
    homeGroup: "mega",
    code: "ME03",
    tcgdexSet: "me03",   // images + logo come from TCGdex automatically
    cardmarketSet: "POR",
  },

  "chaos-rising": {
    name: "Chaos Rising",
    homeGroup: "mega",
    code: "ME04",
    tcgdexSet: "me04",       // VERIFY on tcgdex.net
    cardmarketSet: "CRI",
  },

  "pitch-black": {
    name: "Pitch Black",
    homeGroup: "mega",
    code: "ME05",
    tcgdexSet: "me05",       // VERIFY on tcgdex.net
    cardmarketSet: "PBL",
  },

  "mew-collection": {
    name: "Mew Collection",
    homeGroup: "misc",
    code: "MEW",
    cardmarketUrl: "https://www.cardmarket.com/en/Pokemon/Species/Mew",
  },

  "arceus-collection": {
    name: "Arceus Collection",
    homeGroup: "misc",
    code: "ARCEUS",
    cardmarketUrl: "https://www.cardmarket.com/en/Pokemon/Species/Arceus",
  },

  "keldeo-collection": {
    name: "Keldeo Collection",
    homeGroup: "misc",
    code: "KELDEO",
    cardmarketUrl: "https://www.cardmarket.com/en/Pokemon/Species/Keldeo",
  },

  "break-collection": {
    name: "Break Collection",
    homeGroup: "misc",
    code: "BREAK",
    cardmarketUrl: "https://www.cardmarket.com/en/Pokemon/Products/Search?category=-1&searchString=break&searchMode=v2",
  },

};
