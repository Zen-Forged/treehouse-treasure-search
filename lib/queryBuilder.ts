// lib/queryBuilder.ts
//
// Deterministic search query construction from ItemAttributes.
// Replaces Claude's free-text search_query field, which is fragile and hard to debug.
//
// Priority hierarchy:
//   1. Named product  → brand + model + color
//   2. Brand + type   → brand + objectType (+ color if specific)
//   3. Era + material + type → era + material + objectType
//   4. Material + type + color → material + objectType + color
//   5. Type fallback  → objectType only
//
// Each level only applies if it produces a non-empty, useful result.
// The output is always lowercase, space-separated, and passed through
// normalizeQuery() to strip filler words before reaching SerpAPI.

import { ItemAttributes } from "@/types";
import { normalizeQuery } from "@/utils/normalizeQuery";

// ── Colors specific enough to be worth including in the query ────────────────
// Vague / lighting-dependent colors are excluded — they hurt more than help
const SPECIFIC_COLORS = new Set([
  "white", "black", "silver", "gold", "red", "blue", "green", "pink",
  "purple", "orange", "yellow", "tan", "brown", "gray", "grey", "copper",
  "bronze", "amber", "ivory", "cream", "turquoise", "teal", "navy",
  "rose gold", "space gray", "midnight", "starlight", "platinum",
]);

// ── Eras worth including in a query (confident signal, not vague) ────────────
const QUERY_WORTHY_ERAS = new Set([
  "victorian", "edwardian", "art deco", "art nouveau", "mid-century",
  "1950s", "1960s", "1970s", "1950s-1960s", "1960s-1970s",
  "1970s-1980s", "1900s", "1910s", "1920s", "1930s", "1940s",
  "antique", "vintage",
]);

// ── Material terms that add meaningful signal to a search query ───────────────
const QUERY_WORTHY_MATERIALS = new Set([
  "brass", "bronze", "copper", "silver", "gold", "cast iron", "wrought iron",
  "ceramic", "porcelain", "stoneware", "earthenware", "terracotta",
  "glass", "crystal", "pressed glass", "milk glass",
  "wood", "mahogany", "walnut", "oak", "teak",
  "leather", "suede",
  "sterling", "pewter", "enamel", "bakelite",
]);

function isSpecificColor(color: string | null | undefined): boolean {
  if (!color) return false;
  return SPECIFIC_COLORS.has(color.toLowerCase().trim());
}

function isQueryWorthyEra(era: string | null | undefined): boolean {
  if (!era) return false;
  const lower = era.toLowerCase().trim();
  return QUERY_WORTHY_ERAS.has(lower) || /^\d{4}s/.test(lower);
}

function isQueryWorthyMaterial(material: string | null | undefined): boolean {
  if (!material) return false;
  return QUERY_WORTHY_MATERIALS.has(material.toLowerCase().trim());
}

function clean(...parts: (string | null | undefined)[]): string {
  return parts
    .filter((p): p is string => typeof p === "string" && p.trim().length > 0)
    .map(p => p.trim().toLowerCase())
    .join(" ");
}

// ── Main export ───────────────────────────────────────────────────────────────

export function buildSearchQuery(
  attributes:     ItemAttributes,
  isNamedProduct: boolean,
): string {
  const {
    brand,
    model,
    objectType,
    primaryColor,
    material,
    era,
    category,
  } = attributes;

  const color    = isSpecificColor(primaryColor) ? primaryColor : null;
  const goodEra  = isQueryWorthyEra(era) ? era : null;
  const goodMat  = isQueryWorthyMaterial(material) ? material : null;

  let query = "";

  // ── Priority 1: Named branded product ─────────────────────────────────────
  // brand + model + color  e.g. "canon eos r50 white"
  if (isNamedProduct && brand && model) {
    query = clean(brand, model, color);
  }

  // ── Priority 2: Brand + object type (known brand, unknown model) ───────────
  // e.g. "pyrex cinderella bowl" / "wedgwood vase blue"
  if (!query && brand && objectType) {
    query = clean(brand, objectType, color);
  }

  // ── Priority 3: Brand + category fallback ─────────────────────────────────
  // e.g. "wedgwood collectibles"
  if (!query && brand && category) {
    query = clean(brand, category);
  }

  // ── Priority 4: Era + material + object type ───────────────────────────────
  // e.g. "art deco brass bookend" / "mid-century ceramic vase"
  if (!query && goodEra && goodMat && objectType) {
    query = clean(goodEra, goodMat, objectType);
  }

  // ── Priority 5: Era + object type (no strong material signal) ─────────────
  // e.g. "victorian inkwell" / "1960s lamp"
  if (!query && goodEra && objectType) {
    query = clean(goodEra, objectType);
  }

  // ── Priority 6: Material + object type + color ────────────────────────────
  // e.g. "brass owl bookend" / "amber glass decanter"
  if (!query && goodMat && objectType) {
    query = clean(goodMat, objectType, color);
  }

  // ── Priority 7: Object type + color (minimal but better than nothing) ──────
  // e.g. "bookend brass" / "ceramic vase blue"
  if (!query && objectType) {
    query = clean(objectType, color ?? goodMat);
  }

  // ── Priority 8: Category-only last resort ─────────────────────────────────
  if (!query && category) {
    query = clean(category);
  }

  // Normalize: lowercase, strip filler words, collapse whitespace
  return normalizeQuery(query || "vintage item");
}

// ── Diagnostic helper — returns the priority level that fired ─────────────────
// Useful for logging and debugging which path was taken

export function queryPriority(
  attributes:     ItemAttributes,
  isNamedProduct: boolean,
): string {
  const { brand, model, objectType, primaryColor, material, era, category } = attributes;
  const color   = isSpecificColor(primaryColor) ? primaryColor : null;
  const goodEra = isQueryWorthyEra(era) ? era : null;
  const goodMat = isQueryWorthyMaterial(material) ? material : null;

  if (isNamedProduct && brand && model) return "P1:named-product";
  if (brand && objectType)              return "P2:brand+type";
  if (brand && category)                return "P3:brand+category";
  if (goodEra && goodMat && objectType) return "P4:era+material+type";
  if (goodEra && objectType)            return "P5:era+type";
  if (goodMat && objectType)            return "P6:material+type";
  if (objectType)                       return "P7:type+color";
  if (category)                         return "P8:category";
  return "P9:fallback";
}
