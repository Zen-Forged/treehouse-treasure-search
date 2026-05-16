// lib/chromeTokens.ts
// Shared geometry constants for the chrome-unification arc shipped this session
// (design record at docs/chrome-unification-design.md). Single source of truth
// across HomeHero (Home-only sticky-collapse) + StickyMasthead (universal strip
// for non-Home surfaces) + TabsChrome (composes them + adds chip overlay on Home).
//
// All vertical values are safe-area-aware (CSS calc strings) so they work
// across flat-bottom iPhones (safe-area ~14px) and notched iPhones (safe-area
// ~47px). Pixel constants are the FLAT-BOTTOM iPhone targets, used for JS
// computations where CSS calc isn't viable.
//
// Geometry contract (flat iPhone, safe-area = 14px):
//   y = 0    -> top of viewport (status bar overlays this)
//   y = 14   -> safe-area-inset-top
//   y = 14   -> masthead strip top (extends down)
//   y = 64   -> logo vertical center (D3)
//   y = 100  -> chip top edge (D5) — chip overlays strip from here down
//   y = 130  -> masthead strip bottom edge (D2)
//
// On notched iPhones, all values shift down by (safe-area - 14). The chip
// always overlays the bottom CHIP_OVERLAP_PX of the strip regardless of
// device, so the trim effect is visually consistent.
//
// Token derivation:
//   MASTHEAD_HEIGHT = safe-area + MASTHEAD_CONTENT_HEIGHT_PX (= safe-area + 116)
//   LOGO_TOP        = safe-area + LOGO_TOP_OFFSET_PX        (= safe-area + 50)
//   CHIP_TOP        = safe-area + CHIP_TOP_OFFSET_PX        (= safe-area + 86)
//   CHIP_TOP        = MASTHEAD_HEIGHT - CHIP_OVERLAP_PX     (= 116 - 30)
//
// Per design record D2/D3/D5.

/**
 * Painted masthead height ABOVE the safe-area inset. Total CSS height =
 * max(safe-area, 14px) + this value. Was 84 pre-chrome-unification arc;
 * bumped to 116 to give the chip-overlay room to "trim" the photo without
 * crowding the logo. Per D2.
 */
export const MASTHEAD_CONTENT_HEIGHT_PX = 116;

/**
 * Logo vertical center, measured from the safe-area inset. Sits in the
 * upper portion of the visible (non-chip-occluded) strip area so the photo
 * has visible breathing room below the logo. Per D3.
 */
export const LOGO_TOP_OFFSET_PX = 50;

/**
 * Chip top edge offset from safe-area inset. Equals MASTHEAD_CONTENT_HEIGHT_PX
 * - CHIP_OVERLAP_PX. Chip sticky-pins here; z-index above strip; chip occludes
 * the bottom CHIP_OVERLAP_PX of the strip's photo. Per D5.
 */
export const CHIP_TOP_OFFSET_PX = 86;

/**
 * How much of the masthead strip's bottom the chip overlay occludes. The
 * "trim" depth per David's verbatim — "the mall selector component to appear
 * to scroll over the top of the bottom portion of the hero image to trim the
 * bottom of the photo."
 */
export const CHIP_OVERLAP_PX = 30;

/**
 * Default wordmark width when logo sits alone in masthead (Home + Saved +
 * surfaces without filled left/right slots). Height auto-sizes from
 * treehouse_transparent.png's 815x399 aspect ratio (~73px at this width).
 * Per D4.
 */
export const LOGO_WIDTH_DEFAULT_PX = 150;

/**
 * Logo width when masthead has filled left + right slots (/find /shelf).
 * Tighter so the slots don't crowd the wordmark. Per D4.
 */
export const LOGO_WIDTH_WITH_SLOTS_PX = 130;

/**
 * z-index ordering for the chrome stack. Chip sits ABOVE the strip so it
 * visually trims the photo via z-index occlusion (no overflow-hidden trickery
 * needed). Floating Profile/Back overlays sit ABOVE both — they remain the
 * top-most affordances. Per D5/D7/D8.
 */
export const STRIP_Z = 30;
export const CHIP_Z  = 38;

/** Asset paths — single source of truth so consumers can't drift. Per D9/D10. */
export const HERO_BG_URL          = "/BG.png";
export const WORDMARK_URL         = "/treehouse_transparent.png";

// -- CSS calc strings (use these in `style` props for safe-area-aware
//    positioning) ----------------------------------------------------

/** Total masthead height = max(14px, safe-area-inset-top) + 116px. Per D2. */
export const MASTHEAD_HEIGHT = `calc(max(14px, env(safe-area-inset-top, 14px)) + ${MASTHEAD_CONTENT_HEIGHT_PX}px)`;

/** Logo vertical center y-coordinate (used with transform: translate(-50%, -50%)). */
export const LOGO_TOP = `calc(max(14px, env(safe-area-inset-top, 14px)) + ${LOGO_TOP_OFFSET_PX}px)`;

/** Chip top edge (sticky-pin position for the mall picker on Home). */
export const CHIP_TOP = `calc(max(14px, env(safe-area-inset-top, 14px)) + ${CHIP_TOP_OFFSET_PX}px)`;

/**
 * Cream-fade gradient applied at the strip's bottom edge so the photo bleeds
 * into the page bg below. Target color varies per surface:
 *   - (tabs)/ surfaces (Home/Saved):  v2.bg.tabs  (#E6DECF)
 *   - Non-(tabs)/ surfaces:           v2.bg.main  (#F7F3EB)
 *
 * Returns a linear-gradient CSS value. Pair with `url('/BG.png')` as the
 * second background layer.
 */
export function stripFadeGradient(targetHex: string): string {
  // Convert #RRGGBB to "R, G, B" for rgba interpolation. Defensive parse —
  // assumes 6-digit hex; falls back to the v2.bg.tabs value if malformed.
  const hex = targetHex.replace(/^#/, "");
  let r = 230, g = 222, b = 207;  // v2.bg.tabs fallback
  if (hex.length === 6) {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  }
  return `linear-gradient(180deg,
    rgba(${r},${g},${b},0) 0%,
    rgba(${r},${g},${b},0.18) 70%,
    rgba(${r},${g},${b},0.50) 95%,
    rgba(${r},${g},${b},0.85) 100%)`;
}

/**
 * Background-image stack for the masthead strip. Composes the cream-fade
 * gradient on top of BG.png positioned to show the bottom slice (matches the
 * collapsed hero state on Home). Returns the value to assign to CSS
 * `background-image`. Caller also sets:
 *   - background-size: auto, cover
 *   - background-position: center, center 92%
 *   - background-repeat: no-repeat
 */
export function stripBackgroundImage(targetHex: string): string {
  return `${stripFadeGradient(targetHex)}, url('${HERO_BG_URL}')`;
}
