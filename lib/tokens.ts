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
  postit:       "#fbf3df",

  // Phase 2 Session A — paperWarm is the warm-cream variant used as the
  // polaroid mat across Home masonry, /flagged FindTile, /shelf/[slug]
  // WindowTile + ShelfTile, /post/tag Find/Tag photos, /post/preview
  // PolaroidPreview. Adoption deferred to Session B PolaroidTile primitive
  // extraction; declared here so the value lives in one place.
  paperWarm:    "#faf2e0",

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

  // Phase 2 Session A — text/icon color on filled green CTAs (28+ inline
  // `#fff` usages). Adoption deferred to Session D <FormButton> primitive.
  onGreen:      "#fff",

  // Phase 2 Session A — disabled-state filled green button background.
  // Replaces three close opacity variants (0.18 / 0.22 / 0.25) inlined
  // across /post/preview, /login/email, /vendor-request. Adoption deferred
  // to Session D <FormButton> primitive.
  greenDisabled: "rgba(30,77,43,0.40)",

  // v1.2 — form input wash (warm off-white on paperCream)
  inkWash:      "rgba(255,253,248,0.70)",

  // v1.2 — amber notice family (graceful-collapse observable signal;
  // see docs/DECISION_GATE.md "Graceful-collapse observability" rule)
  amber:        "#7a5c1e",
  amberBg:      "rgba(122,92,30,0.08)",
  amberBorder:  "rgba(122,92,30,0.22)",

  // Radii — flat values are the canonical photograph + banner radii
  // committed in v1.1h. New scales (radius.input/button/pill/sheet) live
  // under v1.radius below; image + banner stay flat for backwards-compat.
  imageRadius:  6,
  bannerRadius: 16,

  // Phase 2 Session A — shadow scale. Replaces 12+ inline boxShadow strings
  // with five canonical stacks. Adoption rolls in across Sessions B–F as
  // each primitive ships:
  //   polaroid     — Session B <PolaroidTile> (8 verbatim duplicates today)
  //   polaroidPin  — Session B (BoothPage post-it pin variant)
  //   ctaGreen     — Session D <FormButton> (resolves 0.18/0.22/0.25 drift)
  //   sheetRise    — Session D/F (resolves 0.25/0.28 drift on bottom sheets)
  //   cardSubtle   — Session F (light counterpart used on /find/[id] strip)
  shadow: {
    polaroid:    "0 6px 14px rgba(42,26,10,0.20), 0 1.5px 3px rgba(42,26,10,0.10)",
    polaroidPin: "0 6px 14px rgba(42,26,10,0.32), 0 0 0 0.5px rgba(42,26,10,0.16)",
    ctaGreen:    "0 2px 12px rgba(30,77,43,0.22)",
    sheetRise:   "0 -8px 30px rgba(30,20,10,0.28)",
    cardSubtle:  "0 3px 12px rgba(42,26,10,0.10), 0 1px 3px rgba(42,26,10,0.06)",
  },

  // Phase 2 Session A — spacing rhythm scale. Phase 1 audit found gap +
  // padding values scattered across 4–28px with no clear cadence. This is
  // the canonical step set; adoption rolls in across Sessions B–F.
  gap: {
    xs: 6,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 22,
  },

  // Phase 2 Session A — radius scale for chrome NOT covered by imageRadius
  // / bannerRadius. Phase 1 audit found button + input radius drift across
  // 8/9/10/12/14 with no canonical step. Adoption rolls in across Sessions
  // B–F. Photo + banner stay on the flat tokens above.
  radius: {
    input:  14,
    button: 14,
    pill:   999,
    sheet:  20,
  },

  // Phase 2 Session A — icon size scale. Phase 1 audit found 14 distinct
  // icon sizes used; canonical ramp from BottomNav (21) + utility (18) +
  // feature (22-24) usage clusters. Adoption rolls in across Sessions B–F.
  icon: {
    xs:  14,
    sm:  16,
    md:  18,
    nav: 21,
    lg:  22,
    xl:  24,
  },
} as const;

export const fonts = {
  // Session 82 — Lora is the project-wide literary serif (replaced IM Fell).
  // Modern editorial serif by Cyreal (Google Fonts), variable font with a
  // strong italic. IM Fell's letterpress glyph variability hurt readability
  // at body sizes (form labels, find-tile captions). Loaded in app/layout.tsx
  // via next/font/google. See docs/mockups/vendor-request-typography-v2.html.
  lora: 'var(--font-lora), Georgia, serif',
  sys:  '-apple-system, "Segoe UI", Roboto, system-ui, sans-serif',
  // Session 75 — booth-numeral font. Times New Roman across every booth-
  // numeral and count-chip surface: post-it 36px, Variant B booth lockup
  // (Booths grid, find detail, /flagged), and MallScopeHeader 22px count
  // prefix. Disambiguated `1` (vs the prior serif's `1` that read as `I`
  // on mixed booth IDs like D19). No webfont load — TNR ships with iOS,
  // macOS, and Windows. Project-wide rule: letters → FONT_LORA or FONT_SYS;
  // numbers → FONT_NUMERAL. See docs/booth-numeral-font-design.md.
  numeral: '"Times New Roman", Times, serif',
} as const;

// Convenience named exports.
export const FONT_LORA    = fonts.lora;
export const FONT_SYS     = fonts.sys;
export const FONT_NUMERAL = fonts.numeral;

// Motion tokens — session 76 Track E (animation consistency).
// docs/animation-consistency-design.md. Use these on Booths VendorCard,
// Find Map (/flagged) tiles + every primary-tab empty state. Home
// MasonryTile keeps bespoke easing/duration for hero-grid polish (E1+E2).
export const MOTION_EASE_OUT       = [0.25, 0.46, 0.45, 0.94] as const;
export const MOTION_CARD_DURATION  = 0.32;
export const MOTION_STAGGER        = 0.04;
export const MOTION_STAGGER_MAX    = 0.30;
export const MOTION_EMPTY_DURATION = 0.34;

// Marketplace shared-element transitions — Track D phase 5 (session 78).
// docs/marketplace-transitions-design.md D7 + D8. Used on the
// <motion.div layoutId> rect on each thumbnail tile + matching detail
// hero across the three rollout surfaces (feed → /find/[id], /shelves →
// /shelf/[slug], /flagged → /find/[id]). Forward duration on the
// destination motion node, back duration on the source tile node — the
// destination's transition wins on each direction.
export const MOTION_SHARED_ELEMENT_EASE     = [0.32, 0.72, 0, 1] as const;
export const MOTION_SHARED_ELEMENT_FORWARD  = 0.34;
export const MOTION_SHARED_ELEMENT_BACK     = 0.30;
