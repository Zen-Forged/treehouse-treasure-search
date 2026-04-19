// lib/tokens.ts
// Single source of truth for Treehouse ecosystem design tokens.
//
// Two coexisting token sets:
//   - `colors` / `radius` / `spacing` — v0.2 ecosystem tokens (feed, post flow,
//     vendor profile, mall page, admin, BottomNav, etc.). Used by surfaces that
//     have NOT yet migrated to v1.1h. Do not touch until each surface migrates.
//   - `v1` / `fonts` — v1.1h journal-vocabulary tokens. Used by Find Detail,
//     Find Map, and Booth page. Matches docs/design-system.md v1.1h.
//
// The v0.2 and v1.1h sets are intentionally separate because the palettes
// differ (v0.2 `#f5f2eb` cream vs v1.1h `#e8ddc7` paperCream, v0.2 black-brown
// inks vs v1.1h warmer brown inks). They live side-by-side during migration
// and the v0.2 set retires when the last consumer migrates.
//
// Dark reseller layer (#050f05) has its own inline tokens — do not merge here.

// ═══════════════════════════════════════════════════════════════════════════
// v0.2 — legacy ecosystem tokens (feed + unmigrated surfaces)
// ═══════════════════════════════════════════════════════════════════════════

export const colors = {
  // Backgrounds
  bg:           "#f5f2eb",
  surface:      "#edeae1",
  surfaceDeep:  "#e4e0d6",
  emptyTile:    "#dedad2",

  // Borders
  border:       "rgba(26,24,16,0.09)",
  borderLight:  "rgba(26,24,16,0.05)",

  // Text
  textPrimary:  "#1c1a14",
  textMid:      "#4a4840",
  textMuted:    "#8a8476",
  textFaint:    "#b4ae9e",

  // Green (CTAs, active states, brand accent)
  green:        "#1e4d2b",
  greenLight:   "rgba(30,77,43,0.08)",
  greenSolid:   "rgba(30,77,43,0.90)",
  greenBorder:  "rgba(30,77,43,0.20)",

  // Red (destructive actions)
  red:          "#8b2020",
  redBg:        "rgba(139,32,32,0.07)",
  redBorder:    "rgba(139,32,32,0.18)",

  // Header / nav surfaces
  header:       "rgba(245,242,235,0.96)",

  // Cinematic banners (vendor hero, explore banner)
  bannerFrom:   "#1e3d24",
  bannerTo:     "#2d5435",

  // Legacy — tag surface (BoothBox)
  tag:          "#faf8f2",
  tagBorder:    "#ccc6b4",
} as const;

export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  pill: 999,
} as const;

export const spacing = {
  pagePad:    16,
  cardPad:    14,
  sectionGap: 24,
  contentGap: 16,
  tileGap:    10,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// v1.1h — journal-vocabulary tokens (Find Detail, Find Map, Booth page)
// ═══════════════════════════════════════════════════════════════════════════
//
// Promoted from inline `v1` objects in session 19A (was duplicated across
// app/find/[id]/page.tsx, app/flagged/page.tsx, components/BoothPage.tsx).
// Matches docs/design-system.md v1.1h palette + radius commitments:
//
//   Paper:        paperCream (#e8ddc7) — committed globally session 17
//   Post-it:      #fffaea (brighter cream, v1.1b calibration)
//   Ink scale:    inkPrimary → inkFaint (warm brown, v1.1b/c calibrated for
//                 WCAG AA on paperCream)
//   Hairline:     inkHairline — used for photo borders and dividers
//   Price ink:    priceInk (#6a4a30) — softer than primary for em-dash prices
//   Pill:         pill* — numeric badges on vendor rows (Find Detail + Find Map)
//   Icon bubble:  iconBubble — low-contrast wash for masthead bubbles
//   Green:        green (#1e4d2b) — saved-state fill + active state
//   Red:          red* — Booth page hero-upload error
//   Radii:        6px for photographs, 16px for banner (the lone exception)

export const v1 = {
  // Paper + post-it
  paperCream:   "#e8ddc7",
  postit:       "#fffaea",

  // Ink scale
  inkPrimary:   "#2a1a0a",
  inkMid:       "#4a3520",
  inkMuted:     "#6b5538",
  inkFaint:     "rgba(42,26,10,0.28)",
  inkHairline:  "rgba(42,26,10,0.18)",

  // Price voice
  priceInk:     "#6a4a30",

  // Pill (numeric badge on vendor rows)
  pillBg:       "rgba(247,239,217,0.88)",
  pillBorder:   "rgba(42,26,10,0.72)",
  pillInk:      "#1c1208",

  // Icon bubble (paper variant — masthead back button)
  iconBubble:   "rgba(42,26,10,0.06)",

  // Active / destructive
  green:        "#1e4d2b",
  red:          "#8b2020",
  redBg:        "rgba(139,32,32,0.07)",
  redBorder:    "rgba(139,32,32,0.18)",

  // Radii
  imageRadius:  6,
  bannerRadius: 16,
} as const;

export const fonts = {
  imFell: 'var(--font-im-fell), "IM Fell English", Georgia, serif',
  sys:    '-apple-system, "Segoe UI", Roboto, system-ui, sans-serif',
  // v1.1l — post-it 36px booth numeral exception. Narrow reversal of v1.1j's
  // FONT_SYS swap: at hero post-it scale, system-ui reads as system chrome on
  // a material gesture. Times New Roman is broadly available, ships with a
  // clearly disambiguated `1` (solving v1.1j's original 1-vs-I concern), and
  // doesn't require an extra Google Fonts load. ONLY applies to the 36px
  // numeral on the booth post-it (Find Detail + Booth banner). Inline pills
  // on vendor rows stay on FONT_SYS.
  postitNumeral: '"Times New Roman", Times, serif',
} as const;

// Convenience named exports (matches what Find Detail / Find Map / Booth
// previously declared as local `FONT_IM_FELL` / `FONT_SYS` constants).
export const FONT_IM_FELL        = fonts.imFell;
export const FONT_SYS            = fonts.sys;
export const FONT_POSTIT_NUMERAL = fonts.postitNumeral;
