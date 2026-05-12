// lib/tokens.ts
// Single source of truth for Treehouse ecosystem design tokens.
//
// Arc 6.1.4 (session 144) — Layer 1 token foundation refactor. Every token
// value resolves to a CSS custom property defined in app/globals.css :root.
// Updating a value requires a single :root edit; the ~200 consumer call
// sites continue to read `v1.paperCream` / `v2.bg.main` / etc. unchanged.
//
// Three coexisting token sets (locked: v1/v2 dual namespace stays through
// v2 Arc 10 cleanup):
//   - `colors` / `radius` / `spacing` — v0.2 ecosystem tokens (admin,
//     parked surfaces). Used by surfaces that have NOT yet migrated.
//   - `v1` / `fonts` — v1.1h+ journal-vocabulary tokens. Find Detail,
//     Find Map, Booth page, v1.2 post flow. See docs/design-system.md.
//   - `v2` — session 138 field-guide migration tokens. Saved/Home/Find/
//     /shelf shipped sessions 138–142; auth-bridge partial session 143.
//     See docs/v2-visual-migration.md.
//
// Two new canonical scales above the layered tokens (added Arc 6.1.4):
//   - `space` — 2/4/8/12/16/24/32/48/64 (locked session 143)
//   - `radius` — sm/md/lg/xl/pill canonical scale
//
// Numeric tokens (radii, gaps) carry px units in their CSS var values, so
// inline-style consumers continue working: `borderRadius: v1.imageRadius`
// renders as `border-radius: var(--th-v1-image-radius)` which the browser
// resolves to `6px`. Audit verified (Arc 1.2): zero arithmetic, zero
// template-string interpolation, zero JSX size= usage of token numerics.
//
// Dark reseller layer (#050f05) keeps its own inline tokens — do not merge.

// ═══════════════════════════════════════════════════════════════════════════
// v0.2 — legacy ecosystem tokens (admin, ShelfGrid)
// ═══════════════════════════════════════════════════════════════════════════

export const colors = {
  // Backgrounds
  bg:           "var(--th-c-bg)",
  surface:      "var(--th-c-surface)",
  surfaceDeep:  "var(--th-c-surface-deep)",
  emptyTile:    "var(--th-c-empty-tile)",

  // Borders
  border:       "var(--th-c-border)",
  borderLight:  "var(--th-c-border-light)",

  // Text
  textPrimary:  "var(--th-c-text-primary)",
  textMid:      "var(--th-c-text-mid)",
  textMuted:    "var(--th-c-text-muted)",
  textFaint:    "var(--th-c-text-faint)",

  // Green (CTAs, active states, brand accent)
  green:        "var(--th-c-green)",
  greenLight:   "var(--th-c-green-light)",
  greenSolid:   "var(--th-c-green-solid)",
  greenBorder:  "var(--th-c-green-border)",

  // Red (destructive actions)
  red:          "var(--th-c-red)",
  redBg:        "var(--th-c-red-bg)",
  redBorder:    "var(--th-c-red-border)",

  // Header / nav surfaces
  header:       "var(--th-c-header)",

  // Cinematic banners (vendor hero, explore banner)
  bannerFrom:   "var(--th-c-banner-from)",
  bannerTo:     "var(--th-c-banner-to)",

  // Legacy — tag surface (BoothBox)
  tag:          "var(--th-c-tag)",
  tagBorder:    "var(--th-c-tag-border)",
} as const;

// v0.2 spacing — only consumer is parked components/ShelfGrid.tsx.
export const spacing = {
  pagePad:    "var(--th-c-page-pad)",
  cardPad:    "var(--th-c-card-pad)",
  sectionGap: "var(--th-c-section-gap)",
  contentGap: "var(--th-c-content-gap)",
  tileGap:    "var(--th-c-tile-gap)",
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// Canonical scales — Arc 6.1.4 (session 144)
// ═══════════════════════════════════════════════════════════════════════════
//
// `space` and `radius` sit above the v1/v2/v0.2 layered tokens as the
// project-wide rhythm scales. Use these instead of raw px literals when
// a value isn't already pinned to a v1/v2 semantic token.
//
// Adoption is opt-in; the lint:spacing script (Arc 1.3) warns on raw px
// literals that don't match a scale step. Existing surfaces migrate
// progressively as Layer 2 component primitives ship.

// Canonical spacing scale — locked session 143 at denser rhythm.
// 2  = hairline gap (e.g., between glyph + descender clearance)
// 4  = inline tight (icon→label, badge inner)
// 8  = inline default (most form padding, list-item spacing)
// 12 = card padding tight, row gap medium
// 16 = card padding default, page padding inline
// 24 = section gap, hero margin
// 32 = page section break
// 48 = major gap (footer, hero offset)
// 64 = full-page rhythm (rare)
export const space = {
  s2:  "var(--th-space-2)",
  s4:  "var(--th-space-4)",
  s8:  "var(--th-space-8)",
  s12: "var(--th-space-12)",
  s16: "var(--th-space-16)",
  s24: "var(--th-space-24)",
  s32: "var(--th-space-32)",
  s48: "var(--th-space-48)",
  s64: "var(--th-space-64)",
} as const;

// Canonical radius scale — preserves v0.2 keys/values (sm=8, md=12, lg=16,
// xl=20, pill=999) since v0.2 radius had 0 active consumers per Arc 1.1
// audit; now backs them with var() refs and elevates as the project-wide
// canonical scale.
export const radius = {
  sm:   "var(--th-radius-sm)",
  md:   "var(--th-radius-md)",
  lg:   "var(--th-radius-lg)",
  xl:   "var(--th-radius-xl)",
  pill: "var(--th-radius-pill)",
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// v1 — journal-vocabulary tokens (v1.1h / v1.2)
// ═══════════════════════════════════════════════════════════════════════════
//
// Matches docs/design-system.md v1.1h commitments (paper/post-it/ink
// scale/hairline/price-ink/icon-bubble/green/red/radii). v1.2 additions
// (post-flow trilogy): inkWash form-input bg + amber notice family.
// Session 132 paper-family lift (Shape A bg dial — see CLAUDE.md session
// 132 cost-shape triage) reflected in :root values.

export const v1 = {
  // Paper + post-it
  paperCream:   "var(--th-v1-paper-cream)",
  postit:       "var(--th-v1-postit)",
  paperWarm:    "var(--th-v1-paper-warm)",

  // R10 (session 107) — postcard mall card surface.
  postcardBg:     "var(--th-v1-postcard-bg)",
  postcardBorder: "var(--th-v1-postcard-border)",

  // Ink scale
  inkPrimary:   "var(--th-v1-ink-primary)",
  inkMid:       "var(--th-v1-ink-mid)",
  inkMuted:     "var(--th-v1-ink-muted)",
  inkFaint:     "var(--th-v1-ink-faint)",
  inkHairline:  "var(--th-v1-ink-hairline)",

  // Price voice
  priceInk:     "var(--th-v1-price-ink)",

  // Icon bubble (paper variant — masthead back button)
  iconBubble:   "var(--th-v1-icon-bubble)",

  // Active / destructive
  green:        "var(--th-v1-green)",
  red:          "var(--th-v1-red)",
  redBg:        "var(--th-v1-red-bg)",
  redBorder:    "var(--th-v1-red-border)",

  // Filled-CTA chrome (Phase 2 Session A — 28+ inline #fff usages)
  onGreen:      "var(--th-v1-on-green)",
  greenDisabled: "var(--th-v1-green-disabled)",

  // v1.2 — form input wash (warm off-white on paperCream)
  inkWash:      "var(--th-v1-ink-wash)",

  // v1.2 — amber notice family (graceful-collapse observable signal;
  // see docs/DECISION_GATE.md "Graceful-collapse observability" rule)
  amber:        "var(--th-v1-amber)",
  amberBg:      "var(--th-v1-amber-bg)",
  amberBorder:  "var(--th-v1-amber-border)",

  // Radii — flat values are the canonical photograph + banner radii
  // committed in v1.1h. New scales (radius.input/button/pill/sheet) live
  // under v1.radius below; image + banner stay flat for backwards-compat.
  imageRadius:  "var(--th-v1-image-radius)",
  bannerRadius: "var(--th-v1-banner-radius)",

  // Phase 2 Session A — shadow scale.
  shadow: {
    polaroid:        "var(--th-v1-shadow-polaroid)",
    polaroidPin:     "var(--th-v1-shadow-polaroid-pin)",
    ctaGreen:        "var(--th-v1-shadow-cta-green)",
    ctaGreenCompact: "var(--th-v1-shadow-cta-green-compact)",
    sheetRise:       "var(--th-v1-shadow-sheet-rise)",
    cardSubtle:      "var(--th-v1-shadow-card-subtle)",
    postcard:        "var(--th-v1-shadow-postcard)",
    callout:         "var(--th-v1-shadow-callout)",
  },

  // Phase 2 Session A — spacing rhythm scale (v1-namespaced).
  // Layer 1 canonical `space.*` is preferred for new code.
  gap: {
    xs: "var(--th-v1-gap-xs)",
    sm: "var(--th-v1-gap-sm)",
    md: "var(--th-v1-gap-md)",
    lg: "var(--th-v1-gap-lg)",
    xl: "var(--th-v1-gap-xl)",
  },

  // Phase 2 Session A — radius scale for chrome NOT covered by imageRadius
  // / bannerRadius. Layer 1 canonical `radius.*` is preferred for new code.
  radius: {
    input:  "var(--th-v1-radius-input)",
    button: "var(--th-v1-radius-button)",
    pill:   "var(--th-v1-radius-pill)",
    sheet:  "var(--th-v1-radius-sheet)",
  },

  // Phase 2 Session A — icon size scale.
  icon: {
    xs:  "var(--th-v1-icon-xs)",
    sm:  "var(--th-v1-icon-sm)",
    md:  "var(--th-v1-icon-md)",
    nav: "var(--th-v1-icon-nav)",
    lg:  "var(--th-v1-icon-lg)",
    xl:  "var(--th-v1-icon-xl)",
  },

  // R10 (session 107) — cartographic warm-cream basemap palette.
  // See docs/r10-location-map-design.md D25.
  basemap: {
    cream:  "var(--th-v1-basemap-cream)",
    cream2: "var(--th-v1-basemap-cream2)",
    water:  "var(--th-v1-basemap-water)",
    water2: "var(--th-v1-basemap-water2)",
    park:   "var(--th-v1-basemap-park)",
    label:  "var(--th-v1-basemap-label)",
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

export const v2 = {
  // Background scale. Session 140 Arc 2 chrome dial — bg.main #FBF6EA
  // → #F7F3EB alongside chrome migration (tabs layout + StickyMasthead
  // + BottomNav now consume bg.main). Splits page canvas back from
  // surface.warm — cooler page chrome under warmer card surfaces creates
  // subtle visual hierarchy. Session 143 — body bg also migrated to
  // #F7F3EB at the body layer (app/layout.tsx + app/globals.css) as the
  // structural fix for the per-page page-bg dial bug class.
  bg: {
    main:  "var(--th-v2-bg-main)",
    paper: "var(--th-v2-bg-paper)",
    soft:  "var(--th-v2-bg-soft)",
  },
  surface: {
    card:  "var(--th-v2-surface-card)",
    warm:  "var(--th-v2-surface-warm)",
    // Review Board Finding 6C (session 153) — cooler recessed-well bg
    // for input fields system-wide. Distinct from surface.card (so an
    // input inside a card-bg context reads as recessed) and from bg.main
    // (subtle inset). Sweep: SearchBar + ShareSheet email + form primitives.
    input: "var(--th-v2-surface-input)",
    // Soft pink-paper for error states (ErrorBanner card bg). Solid
    // blend per v2 convention; parallels accent.greenSoft's relationship
    // to its accent. Extended at Arc 6.2 (session 146) — /login ErrorBanner
    // is first consumer.
    error: "var(--th-v2-surface-error)",
  },

  // Text scale — calibrated for WCAG AA on bg.main.
  text: {
    primary:   "var(--th-v2-text-primary)",
    secondary: "var(--th-v2-text-secondary)",
    muted:     "var(--th-v2-text-muted)",
  },

  // Brand green — accent.green canonical CTA + active-state fill;
  // accent.greenDark hover/active variant; accent.greenSoft active-state
  // bg for ★ favorited bubble; accent.greenMid standardized button bg
  // (QA-derived session 139 + adopted as v2 button-fill standard at
  // session 141 when LocationActions Take Trip joined as second consumer).
  accent: {
    green:     "var(--th-v2-accent-green)",
    greenDark: "var(--th-v2-accent-green-dark)",
    greenSoft: "var(--th-v2-accent-green-soft)",
    greenMid:  "var(--th-v2-accent-green-mid)",
    // Deep brick — error text + glyph color (ErrorBanner). Preserves
    // canonical v1.red #8B2020 hue across the v2 migration; only
    // translucency retires (rgba → solid surface.error blend).
    red:       "var(--th-v2-accent-red)",
  },

  // Brand brown — wordmark + secondary brand color.
  brown:     "var(--th-v2-brown)",
  brownSoft: "var(--th-v2-brown-soft)",

  // Hairline borders — light canonical 1px (cards/rows/dividers); medium
  // stronger hairline (dashed flankers around eyebrow + ✓ Found unchecked).
  border: {
    light:  "var(--th-v2-border-light)",
    medium: "var(--th-v2-border-medium)",
    // Pinkish hairline — error state borders (ErrorBanner). Parallels
    // border.light's relationship to v2 chrome.
    error:  "var(--th-v2-border-error)",
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// Fonts (loaded in app/layout.tsx via next/font/google)
// ═══════════════════════════════════════════════════════════════════════════

export const fonts = {
  // Session 82 — Lora is the project-wide literary serif (replaced IM Fell).
  // Modern editorial serif by Cyreal (Google Fonts), variable font with a
  // strong italic. Loaded in app/layout.tsx via next/font/google.
  // Session 138 (v2 migration) — slated for retirement; Cormorant Garamond
  // replaces project-wide. Stays alive until v2 Arc 7 cleanup confirms
  // zero consumers remain. See docs/v2-visual-migration.md.
  lora: 'var(--font-lora), Georgia, serif',
  sys:  '-apple-system, "Segoe UI", Roboto, system-ui, sans-serif',
  // Session 75 — booth-numeral font. Times New Roman across every booth-
  // numeral and count-chip surface. Project-wide rule: letters → FONT_LORA
  // or FONT_SYS; numbers → FONT_NUMERAL. See docs/booth-numeral-font-design.md.
  // Session 138 (v2 migration) — preserved; v2 doesn't touch numerals.
  numeral: '"Times New Roman", Times, serif',
  // Session 120 — Dancing Script. Hand-drawn cursive used sparingly + intentionally
  // for personal-touch labels only. Loaded in app/layout.tsx via next/font/google.
  // Do not let this font sprawl onto body copy / form labels / any high-density
  // surface; it's expensive on legibility at small sizes.
  script: 'var(--font-dancing-script), "Lora", cursive',
  // Session 138 (v2 Arc 1.1) — Cormorant Garamond replaces Lora project-wide.
  // Single editorial serif family for upright + italic across all v2 surfaces.
  // Loaded in app/layout.tsx via next/font/google. Migration: v2 consumers
  // reference FONT_CORMORANT; v1 consumers stay on FONT_LORA until their
  // surface migrates. v2 Arc 7 cleanup retires FONT_LORA.
  cormorant: 'var(--font-cormorant), Georgia, serif',
  // Session 138 (v2 Arc 1.1) — Inter replaces FONT_SYS as the canonical sans
  // companion. Used for metadata / prices / buttons / navigation across all
  // v2 surfaces. Loaded in app/layout.tsx via next/font/google.
  inter: 'var(--font-inter), -apple-system, "Segoe UI", Roboto, system-ui, sans-serif',
} as const;

// Convenience named exports.
export const FONT_LORA      = fonts.lora;
export const FONT_SYS       = fonts.sys;
export const FONT_NUMERAL   = fonts.numeral;
export const FONT_SCRIPT    = fonts.script;
export const FONT_CORMORANT = fonts.cormorant;
export const FONT_INTER     = fonts.inter;

// ═══════════════════════════════════════════════════════════════════════════
// Motion tokens — JS values consumed by framer-motion, NOT migrated to vars
// ═══════════════════════════════════════════════════════════════════════════

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

// Bottom-sheet motion — Layer 2 kickoff (session 149). Consumed by
// components/ui/BottomSheet.tsx primitive (which currently powers
// ShareSheet; future consumers: any modal/picker that needs the same
// scrim + slide-up sheet shape). The ease curve happens to match
// MOTION_EASE_OUT today, but is named separately so future bottom-sheet
// motion can diverge from hero-grid motion without ambiguity (mirrors
// the MOTION_SHARED_ELEMENT_EASE precedent).
export const MOTION_BOTTOM_SHEET_EASE              = [0.25, 0.46, 0.45, 0.94] as const;
export const MOTION_BOTTOM_SHEET_BACKDROP_DURATION = 0.22;
export const MOTION_BOTTOM_SHEET_SHEET_DURATION    = 0.34;
