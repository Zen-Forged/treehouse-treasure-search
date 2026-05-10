// lib/tokens.ts
// Single source of truth for Treehouse ecosystem design tokens.
//
// Three coexisting token sets:
//   - `colors` / `radius` / `spacing` — v0.2 ecosystem tokens (feed, post flow,
//     vendor profile, mall page, admin, BottomNav, etc.). Used by surfaces that
//     have NOT yet migrated to v1.1h. Do not touch until each surface migrates.
//   - `v1` / `fonts` — v1.1h+ journal-vocabulary tokens. Used by Find Detail,
//     Find Map, Booth page, and (v1.2) the post-flow trilogy.
//     Matches docs/design-system.md v1.1h → v1.1l + v1.2 build spec.
//   - `v2` — session 138 field-guide migration tokens (Cormorant + warm-paper
//     palette + row pattern). Used by Saved page Arc 1; propagates to Home /
//     Find / /shelf / /map in subsequent v2 arcs. v1 retires once all surfaces
//     migrate (v2 Arc 7 cleanup). See docs/v2-visual-migration.md.
//
// The v0.2 + v1.x + v2 sets are intentionally separate because the palettes
// differ (v0.2 `#f5f2eb` cream vs v1.x `#f2ecd8` paperCream vs v2 `#F7F3E8`
// bg-main; warm brown inks shift across the three layers). They live
// side-by-side during migration and each prior set retires when the last
// consumer migrates.
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
//   Paper:        paperCream (#f2ecd8) — committed session 17 as #e8ddc7;
//                 lightened session 132 (Shape A bg dial — see CLAUDE.md
//                 session 132 cost-shape triage). paperWarm + postit +
//                 postcardBg bumped in step to preserve lift relationships.
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
  // Session 132 (Shape A bg dial): paperCream lightened from #e8ddc7 →
  // #f2ecd8 to test "fresher, less dated" feel while keeping warm-paper
  // identity. postit + paperWarm + postcardBg bumped in step below to
  // preserve their lift over the new bg.
  paperCream:   "#f2ecd8",
  postit:       "#fefae8",

  // Phase 2 Session A — paperWarm is the warm-cream variant used as the
  // polaroid mat across Home masonry, /flagged FindTile, /shelf/[slug]
  // WindowTile, /post/tag Find/Tag photos, /post/preview PolaroidPreview.
  // Adoption deferred to Session B PolaroidTile primitive extraction;
  // declared here so the value lives in one place.
  paperWarm:    "#fefae6",

  // R10 (session 107) — postcard mall card surface. Slightly more saturated
  // than paperWarm; reads as "card stock" rather than "off-white." Used by
  // <PostcardMallCard>. See docs/r10-location-map-design.md D7 + D8.
  postcardBg:     "#fbf3dd",
  postcardBorder: "rgba(42,26,10,0.10)",

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
    polaroid:        "0 6px 14px rgba(42,26,10,0.20), 0 1.5px 3px rgba(42,26,10,0.10)",
    polaroidPin:     "0 6px 14px rgba(42,26,10,0.32), 0 0 0 0.5px rgba(42,26,10,0.16)",
    ctaGreen:        "0 2px 12px rgba(30,77,43,0.22)",
    ctaGreenCompact: "0 2px 10px rgba(30,77,43,0.18)",
    sheetRise:       "0 -8px 30px rgba(30,20,10,0.28)",
    cardSubtle:      "0 3px 12px rgba(42,26,10,0.10), 0 1px 3px rgba(42,26,10,0.06)",
    // R10 (session 107) — postcard card chrome (lighter than polaroid because
    // it's a chrome element, not a focal-point) + callout (heavier because it
    // floats on top of the map without a grounded context).
    postcard:        "0 4px 14px rgba(42,26,10,0.16), 0 1px 2px rgba(42,26,10,0.08)",
    callout:         "0 8px 20px rgba(42,26,10,0.22), 0 2px 6px rgba(42,26,10,0.10)",
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

  // R10 (session 107) — cartographic warm-cream basemap palette for D25.
  // Custom-styled Mapbox layer values: cream landmass, tan lowland, sage
  // water (deeper for inland water), park patches, italic-Lora region
  // labels at low opacity. Pinned here so the map-style JSON in Arc 3
  // composes from the same palette as the rest of the v1.x ecosystem.
  // See docs/r10-location-map-design.md D25.
  basemap: {
    cream:  "#efe6cf",
    cream2: "#e6d9b8",
    water:  "#c5d6c4",
    water2: "#aac3aa",
    park:   "#d3dcc4",
    label:  "rgba(42,26,10,0.55)",
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// v2 — field-guide migration tokens (session 138)
// ═══════════════════════════════════════════════════════════════════════════
//
// Cormorant Garamond + Inter typography pairing + warm-paper palette + row
// tile pattern + accordion grouping. Field-guide / National Parks Passport /
// Goodreads-shelf voice replacing v1's exploration-warmth identity.
//
// Locked decisions (system-level): see docs/v2-visual-migration.md
//   Q1  (a) Cormorant Garamond replaces Lora project-wide
//   Q1.1     Inter replaces FONT_SYS as canonical sans companion
//   Q2  (a) v2 palette replaces v1 paper-family entirely
//   Q3  (a) Polaroid retires system-wide; row pattern is new shared primitive
//
// Migration arcs:
//   Arc 1: Saved page (this Arc 1.1 commit lands the additive token layer)
//   Arc 2-5: Home / Find / /shelf / /map (consumers migrate per surface)
//   Arc 6: Decorative leaf chrome universal (sub-Q-A deferred from Arc 1)
//   Arc 7: Cleanup — retire v1.* tokens once no consumers remain
//
// First consumer: components/v2/SavedMallCardV2.tsx + siblings (Arc 1.2).

export const v2 = {
  // Background scale — page-level + card surfaces. bg.main is the page
  // canvas; bg.paper is the bright card surface; bg.soft is the page bg
  // soft variant. surface.card mirrors bg.paper for card chrome
  // semantics; surface.warm is the warm-cream pill + thumbnail bg.
  bg: {
    main:  "#F7F3E8",
    paper: "#FFFCF5",
    soft:  "#F1EBDD",
  },
  surface: {
    card: "#FFFCF5",
    warm: "#FBF6EA",
  },

  // Text scale — primary body / secondary metadata-and-addresses /
  // muted decorative-and-tertiary. Calibrated for WCAG AA on bg.main.
  text: {
    primary:   "#2B211A",
    secondary: "#756A5E",
    muted:     "#A39686",
  },

  // Brand green — accent.green is the canonical CTA + active-state fill.
  // accent.greenDark is the hover/active variant. accent.greenSoft is the
  // active-state bg for ★ favorited bubble + future engagement-on states.
  accent: {
    green:     "#285C3C",
    greenDark: "#1F4A31",
    greenSoft: "#E8EEE6",
  },

  // Brand brown — wordmark + secondary brand color. brown is the upright
  // wordmark + nav default; brownSoft is the decorative botanical chrome
  // stroke (used by deferred v2 Arc 6 leaf SVG).
  brown:     "#6A513E",
  brownSoft: "#B8A996",

  // Hairline borders — light is the canonical 1px hairline (cards + rows
  // + dividers). medium is the stronger hairline (dashed flankers around
  // "X finds waiting" eyebrow + ✓ Found checkbox unchecked-state border).
  border: {
    light:  "#E5DED2",
    medium: "#D6CCBC",
  },
} as const;

export const fonts = {
  // Session 82 — Lora is the project-wide literary serif (replaced IM Fell).
  // Modern editorial serif by Cyreal (Google Fonts), variable font with a
  // strong italic. IM Fell's letterpress glyph variability hurt readability
  // at body sizes (form labels, find-tile captions). Loaded in app/layout.tsx
  // via next/font/google. See docs/mockups/vendor-request-typography-v2.html.
  // Session 138 (v2 migration) — slated for retirement; Cormorant Garamond
  // replaces project-wide. Stays alive until v2 Arc 7 cleanup confirms zero
  // consumers remain. See docs/v2-visual-migration.md.
  lora: 'var(--font-lora), Georgia, serif',
  sys:  '-apple-system, "Segoe UI", Roboto, system-ui, sans-serif',
  // Session 75 — booth-numeral font. Times New Roman across every booth-
  // numeral and count-chip surface: post-it 36px, Variant B booth lockup
  // (Booths grid, find detail, /flagged), and MallScopeHeader 22px count
  // prefix. Disambiguated `1` (vs the prior serif's `1` that read as `I`
  // on mixed booth IDs like D19). No webfont load — TNR ships with iOS,
  // macOS, and Windows. Project-wide rule: letters → FONT_LORA or FONT_SYS;
  // numbers → FONT_NUMERAL. See docs/booth-numeral-font-design.md.
  // Session 138 (v2 migration) — preserved; v2 doesn't touch numerals.
  numeral: '"Times New Roman", Times, serif',
  // Session 120 — Dancing Script. Hand-drawn cursive used sparingly + intentionally
  // for personal-touch labels only. First consumer: <RichPostcardMallCard> "select
  // location" stamp label. Loaded in app/layout.tsx via next/font/google. Do not
  // let this font sprawl onto body copy / form labels / any high-density surface;
  // it's expensive on legibility at small sizes and the script vocabulary loses
  // meaning when overused.
  script: 'var(--font-dancing-script), "Lora", cursive',
  // Session 138 (v2 Arc 1.1) — Cormorant Garamond replaces Lora project-wide
  // per Q1 (a). Single editorial serif family for upright + italic across all
  // v2 surfaces (mall names 28/600, find names 17/500, booth names italic
  // 17/500, narrative italic). Loaded in app/layout.tsx via next/font/google.
  // Migration: v2 consumers reference FONT_CORMORANT; v1 consumers stay on
  // FONT_LORA until their surface migrates. v2 Arc 7 cleanup retires
  // FONT_LORA. See docs/v2-visual-migration.md + docs/saved-v2-redesign-design.md.
  cormorant: 'var(--font-cormorant), Georgia, serif',
  // Session 138 (v2 Arc 1.1) — Inter replaces FONT_SYS as the canonical sans
  // companion per Q1.1 (lock-by-inheritance from mockup spec). Used for
  // metadata / prices / buttons / navigation across all v2 surfaces. Loaded
  // in app/layout.tsx via next/font/google. Migration shape mirrors Cormorant.
  inter: 'var(--font-inter), -apple-system, "Segoe UI", Roboto, system-ui, sans-serif',
} as const;

// Convenience named exports.
export const FONT_LORA      = fonts.lora;
export const FONT_SYS       = fonts.sys;
export const FONT_NUMERAL   = fonts.numeral;
export const FONT_SCRIPT    = fonts.script;
export const FONT_CORMORANT = fonts.cormorant;
export const FONT_INTER     = fonts.inter;

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
