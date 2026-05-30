// lib/aiShelfCaption.ts
//
// Session 197 Arc 2 C1 — Share My Shelf caption generator.
// Session 204 Arc 4 — Sonnet enrichment with deterministic fallback (Shape C).
//
// Per session-196 design record §3.5 component contract + D7 (caption strategy
// AI-generated per format) + D15 (caption clipboard auto-copy fires on Share
// or Download).
//
// Two layers, "floor + enrichment" per the session-203 pattern:
//   1. DETERMINISTIC FLOOR — generateShelfCaption() + placeholderHeroHook()
//      compute an instant, never-blank caption + hero hook from the post
//      titles. This is the synchronous first-paint AND the offline/error
//      fallback. Single source of truth: composeStoryCaption() is reused by
//      both this module's generateShelfCaption AND the server route's
//      no-key/error fallback (app/api/shelf-caption/route.ts).
//   2. SONNET ENRICHMENT — fetchShelfCaption() POSTs the picks' titles +
//      captions + tags to /api/shelf-caption; Sonnet writes a vendor-tone
//      Story caption + hero hook referencing the actual finds. The wrapper
//      swaps the enrichment in when it arrives; the floor is what renders
//      until then + what we fall back to if the route 404s or errors.
//
// Format-aware (D7):
//   - "story" → multi-line narrative caption suitable for IG/FB Story text
//   - "feed"  → single hook line suitable for FB feed / IG square post

import type { Mall, Post, Vendor } from "@/types/treehouse";

export type ShelfCaptionFormat = "story" | "feed";

/** Arc 4 — fetchShelfCaption() return shape. source flags Sonnet vs floor. */
export interface ShelfCaptionResult {
  storyCaption: string;
  heroHook:     string;
  source:       "claude" | "mock";
}

export interface GenerateShelfCaptionInput {
  vendor: Vendor;
  mall:   Mall | null;
  posts:  Post[];
  format: ShelfCaptionFormat;
  /** Optional booth URL (preview-stripped in caption text). If omitted the
   *  caller's wrapper composes this from window.location.origin + slug. */
  boothUrl?: string;
}

/**
 * Returns the caption string for the requested format.
 *
 * Arc 4 will swap the body to a Sonnet vision/text call that reads the post
 * titles + photos and writes vendor-tone-matched copy. Until then, the
 * deterministic template is canonical.
 */
export function generateShelfCaption(input: GenerateShelfCaptionInput): string {
  const { vendor, mall, posts, format, boothUrl } = input;

  const vendorName = vendor.display_name;
  const boothNo    = vendor.booth_number;
  const mallName   = mall?.name ?? vendor.mall?.name ?? null;
  const city       = mall?.city ?? vendor.mall?.city ?? null;
  const findCount  = posts.length;

  // Strip protocol for cleaner read inside captions; full URL stays in QR
  // + the share-sheet url field.
  const urlPreview = boothUrl
    ? boothUrl.replace(/^https?:\/\//, "")
    : `app.kentuckytreehouse.com/shelf/${vendor.slug}`;

  if (format === "feed") {
    return buildFeedCaption({ vendorName, findCount, mallName, urlPreview });
  }
  return composeStoryCaption({ vendorName, boothNo, mallName, city, findCount, urlPreview });
}

// ─── Shared builders ──────────────────────────────────────────────────────

/**
 * Composes the multi-line Story caption from primitive parts. Exported so the
 * server route (app/api/shelf-caption/route.ts) reuses the SAME deterministic
 * text as its no-key/error fallback — single source of truth for the floor.
 */
export function composeStoryCaption(parts: {
  vendorName: string;
  boothNo:    string | null;
  mallName:   string | null;
  city:       string | null;
  findCount:  number;
  urlPreview: string;
}): string {
  const { vendorName, boothNo, mallName, city, findCount, urlPreview } = parts;
  const lines: string[] = [];

  // Line 1: hook with vendor name + leaf glyph
  lines.push(`🍃 This week at ${vendorName} — ${findCount} new ${findCount === 1 ? "find" : "finds"} on the shelf.`);

  // Line 2: visit-the-booth call with mall + city when available
  const venueParts = [mallName, city].filter(Boolean);
  const venue = venueParts.length > 0 ? venueParts.join(", ") : null;
  if (boothNo && venue) {
    lines.push(`Visit Booth ${boothNo} at ${venue}.`);
  } else if (boothNo) {
    lines.push(`Visit Booth ${boothNo}.`);
  } else if (venue) {
    lines.push(`Visit us at ${venue}.`);
  }

  // Line 3: URL preview
  lines.push(urlPreview);

  return lines.join("\n");
}

function buildFeedCaption(parts: {
  vendorName: string;
  findCount:  number;
  mallName:   string | null;
  urlPreview: string;
}): string {
  const { vendorName, findCount, mallName, urlPreview } = parts;
  const fresh = findCount === 1 ? "Fresh find" : "Fresh finds";
  const venueClause = mallName ? ` at ${vendorName}, ${mallName}.` : ` at ${vendorName}.`;
  return `🍃 ${fresh} this week${venueClause} ${urlPreview}`;
}

// ─── AI hook variant cycler (placeholder until Arc 4) ─────────────────────
// Per D11 hero card "hook" — template intro + AI-gen hook. Until Arc 4 wires
// the Sonnet call, the wrapper cycles through these variants when regenerate
// is tapped so the hero card visibly changes (paired with the shuffled finds)
// even before AI gen lands. Each call returns the next variant deterministically
// keyed off `seed` so re-renders during capture don't flicker.
const HERO_HOOK_VARIANTS = [
  "{N} new finds on the shelf →",
  "Fresh inventory dropped this week →",
  "{N} pieces just hit the floor →",
  "New treasures on the shelf →",
  "{N} new arrivals this week →",
];

export function placeholderHeroHook(findCount: number, seed: number = 0): string {
  const variant = HERO_HOOK_VARIANTS[seed % HERO_HOOK_VARIANTS.length];
  return variant.replace("{N}", String(findCount));
}
