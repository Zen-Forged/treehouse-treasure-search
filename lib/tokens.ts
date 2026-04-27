// lib/tokens.ts
// Single source of truth for Treehouse ecosystem design tokens.
//
// Two coexisting token sets:
//   - `colors` / `radius` / `spacing` — v0.2 ecosystem tokens (feed, post flow,
//     vendor profile, mall page, admin, BottomNav, etc.). Used by surfaces that
//     have NOT yet migrated to v1.1h. Do not touch until each surface migrates.
//   - `v1` / `fonts` — v1.1h+ journal-vocabulary tokens. Used by Find Detail,
//     Find Map, Booth page, and (v1.2) the post-flow trilogy.
//     Matches docs/design-system.md v1.1h → v1.1l + v1.2 build spec.
//
// The v0.2 and v1.x sets are intentionally separate because the palettes
// differ (v0.2 `#f5f2eb` cream vs v1.x `#e8ddc7` paperCream, v0.2 black-brown
// inks vs v1.x warmer brown inks). They live side-by-side during migration
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
// v1.1h / v1.2 — journal-vocabulary tokens
// ═══════════════════════════════════════════════════════════════════════════
//
// Base palette promoted from inline `v1` objects session 19A. Matches
// docs/design-system.md v1.1h commitments:
//
//   Paper:        paperCream (#e8ddc7) — committed globally session 17
//   Post-it:      #fffaea (brighter cream, v1.1b calibration)
//   Ink scale:    inkPrimary → inkFaint (warm brown, v1.1b/c calibrated for
//                 WCAG AA on paperCream)
//   Hairline:     inkHairline — used for photo borders and dividers
//   Price ink:    priceInk (#6a4a30) — softer than primary for em-dash prices
//   Icon bubble:  iconBubble — low-contrast wash for masthead bubbles
//   Green:        green (#1e4d2b) — saved-state fill + active state
//   Red:          red* — Booth page hero-upload error + v1.2 destructive links
//   Radii:        6px for photographs, 16px for banner (the lone exception)
//
// v1.2 additions (post-flow trilogy — see docs/design-system-v1.2-build-spec.md):
//
//   inkWash:      rgba(255,253,248,0.70) — form-input background on v1.2
//                 Review / Edit pages. Warmer than pure white, sits on
//                 paperCream without creating a card.
//   amber:        #7a5c1e — color + stroke for the <AmberNotice> primitive
//   amberBg:      rgba(122,92,30,0.08) — notice background wash
//   amberBorder:  rgba(122,92,30,0.22) — notice border

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

  // Icon bubble (paper variant — masthead back button)
  iconBubble:   "rgba(42,26,10,0.06)",

  // Active / destructive
  green:        "#1e4d2b",
  red:          "#8b2020",
  redBg:        "rgba(139,32,32,0.07)",
  redBorder:    "rgba(139,32,32,0.18)",

  // v1.2 — form input wash (warm off-white on paperCream)
  inkWash:      "rgba(255,253,248,0.70)",

  // v1.2 — amber notice family (graceful-collapse observable signal;
  // see docs/DECISION_GATE.md "Graceful-collapse observability" rule)
  amber:        "#7a5c1e",
  amberBg:      "rgba(122,92,30,0.08)",
  amberBorder:  "rgba(122,92,30,0.22)",

  // Radii
  imageRadius:  6,
  bannerRadius: 16,
} as const;

export const fonts = {
  imFell: 'var(--font-im-fell), "IM Fell English", Georgia, serif',
  sys:    '-apple-system, "Segoe UI", Roboto, system-ui, sans-serif',
  // Session 75 — booth-numeral font. Times New Roman across every booth-
  // numeral and count-chip surface: post-it 36px, Variant B booth lockup
  // (Booths grid, find detail, /flagged), and MallScopeHeader 22px count
  // prefix. Disambiguated `1` (vs IM Fell's serifed `1` that read as `I`
  // on mixed booth IDs like D19). No webfont load — TNR ships with iOS,
  // macOS, and Windows. Originally introduced in v1.1l as `postitNumeral`
  // and scoped only to the 36px post-it; the narrow naming kept the fix
  // from extending to other numerals. Renamed `numeral` in session 75 to
  // make the broader rule self-evident: letters → IM Fell or sans;
  // numbers → FONT_NUMERAL. See docs/booth-numeral-font-design.md.
  numeral: '"Times New Roman", Times, serif',
} as const;

// Convenience named exports (matches what Find Detail / Find Map / Booth
// previously declared as local `FONT_IM_FELL` / `FONT_SYS` constants).
export const FONT_IM_FELL = fonts.imFell;
export const FONT_SYS     = fonts.sys;
export const FONT_NUMERAL = fonts.numeral;
