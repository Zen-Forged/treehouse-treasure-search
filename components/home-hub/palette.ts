// components/home-hub/palette.ts
// Home Hub local accent constants (Arc 2). HUB_GOLD ties the Vendors column +
// VendorCtaCard + the masthead sub-brand together; HUB_TEAL marks the (vision)
// Malls column. Kept local + DRY for the arc.
//
// TODO (Arc 4 / Tier B — design-reviewer REC-7): promote to v2 tokens
// (globals.css CSS vars + tokens.ts) so lint:contrast/lint:colors actually
// SCAN these accents. They escaped the lint net as local constants, which is
// how the sub-4.5:1 text pairings below reached pre-deploy uncaught (REC-1/2/3).
//
// HUB_GOLD / HUB_TEAL are the bright accents for ICON-CIRCLE FILLS (white glyph
// on saturated fill — passes the WCAG 1.4.11 3:1 UI bar).
export const HUB_GOLD = "#B0892C";
export const HUB_TEAL = "#5B7B8A";

// AA-passing TEXT variants (design-reviewer REC-1/2/3). Small label/tag text in
// the bright accents failed WCAG 1.4.3 (4.5:1) on the hub bg #E6DECF — gold
// 2.43:1, teal 3.38:1. These darker hues pass on every hub surface:
//   GOLD_TEXT: 5.34:1 on #E6DECF · 4.86:1 on the vendor-card composite.
//   TEAL_TEXT: 5.66:1 on #E6DECF · 5.00:1 on the COMING SOON tag composite.
// Use for any gold/teal TEXT; keep HUB_GOLD/HUB_TEAL for fills.
export const HUB_GOLD_TEXT = "#6E5416";
export const HUB_TEAL_TEXT = "#3E5862";
