// lib/queryBuilder.ts
//
// Deterministic search query construction from ItemAttributes.
//
// Priority hierarchy:
//   1. Named product  → brand + model + color
//   2. Brand + type   → brand + objectType (+ color if specific)
//   3. Brand + category fallback
//   4. Material + era + type → material + era + objectType
//      NOTE: material comes BEFORE era — physical descriptors outrank decade labels.
//      "brass gooseneck lamp 1980s" >>> "1980s 1990s brass desk lamp" on eBay.
//   5. Material + type → material + objectType (+ color if non-material color)
//   6. Era + type → era + objectType (no material signal)
//   7. Type + color/material fallback
//   8. Category only

import { ItemAttributes } from "@/types";
import { normalizeQuery } from "@/utils/normalizeQuery";

const SPECIFIC_COLORS = new Set([
  "white", "black", "silver", "gold", "red", "blue", "green", "pink",
  "purple", "orange", "yellow", "tan", "brown", "gray", "grey", "copper",
  "bronze", "amber", "ivory", "cream", "turquoise", "teal", "navy",
  "rose gold", "space gray", "midnight", "starlight", "platinum",
]);

// Colors that are also materials — don't append these as color modifiers
// since the material itself is already in the query from the material field
const MATERIAL_COLORS = new Set([
  "brass", "copper", "bronze", "silver", "gold", "pewter", "sterling",
  "chrome", "iron", "steel",
]);

const QUERY_WORTHY_ERAS = new Set([
  "victorian", "edwardian", "art deco", "art nouveau", "mid-century",
  "1950s", "1960s", "1970s", "1950s-1960s", "1960s-1970s",
  "1970s-1980s", "1980s-1990s", "1900s", "1910s", "1920s", "1930s", "1940s",
  "antique", "vintage",
]);

const QUERY_WORTHY_MATERIALS = new Set([
  "brass", "bronze", "copper", "silver", "gold", "cast iron", "wrought iron",
  "ceramic", "porcelain", "stoneware", "earthenware", "terracotta",
  "glass", "crystal", "pressed glass", "milk glass",
  "wood", "mahogany", "walnut", "oak", "teak",
  "leather", "suede",
  "sterling", "pewter", "enamel", "bakelite",
]);

// Era strings that contain multiple decades (e.g. "1980s-1990s") are
// low-value eBay query tokens — they'll appear in very few listing titles.
// Single-era terms like "victorian" or "1960s" are fine.
function isMultiDecadeEra(era: string): boolean {
  return /\d{4}s.{1,3}\d{4}s/i.test(era);
}

function isSpecificColor(color: string | null | undefined): boolean {
  if (!color) return false;
  return SPECIFIC_COLORS.has(color.toLowerCase().trim());
}

function isNonMaterialColor(color: string | null | undefined): boolean {
  if (!color) return false;
  const lower = color.toLowerCase().trim();
  return SPECIFIC_COLORS.has(lower) && !MATERIAL_COLORS.has(lower);
}

function isQueryWorthyEra(era: string | null | undefined): boolean {
  if (!era) return false;
  const lower = era.toLowerCase().trim();
  // Multi-decade ranges like "1980s-1990s" are weak eBay signals — exclude
  if (isMultiDecadeEra(lower)) return false;
  return QUERY_WORTHY_ERAS.has(lower) || /^\d{4}s$/.test(lower);
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

  // Only include a color modifier if it's a true color, NOT a material-color.
  // "brass gooseneck lamp brass" is redundant and hurts recall.
  const color    = isNonMaterialColor(primaryColor) ? primaryColor : null;
  // Single-decade eras only — "1980s-1990s" is a bad eBay token
  const goodEra  = isQueryWorthyEra(era) ? era : null;
  const goodMat  = isQueryWorthyMaterial(material) ? material : null;

  let query = "";

  // ── Priority 1: Named branded product ─────────────────────────────────────
  if (isNamedProduct && brand && model) {
    query = clean(brand, model, color);
  }

  // ── Priority 2: Brand + object type ───────────────────────────────────────
  if (!query && brand && objectType) {
    query = clean(brand, objectType, color);
  }

  // ── Priority 3: Brand + category fallback ─────────────────────────────────
  if (!query && brand && category) {
    query = clean(brand, category);
  }

  // ── Priority 4: Material + era + type ─────────────────────────────────────
  // Material leads — "brass art deco lamp" is a better eBay query than
  // "art deco brass lamp" and WAY better than "1980s brass lamp".
  // Era only included when it's a single strong signal (not a decade range).
  if (!query && goodMat && goodEra && objectType) {
    query = clean(goodMat, goodEra, objectType);
  }

  // ── Priority 5: Material + type (+ non-material color) ────────────────────
  // "brass gooseneck lamp" / "amber glass decanter"
  // This is the most reliable path for vintage/thrift items without a brand.
  if (!query && goodMat && objectType) {
    query = clean(goodMat, objectType, color);
  }

  // ── Priority 6: Era + type (no material) ──────────────────────────────────
  // "victorian inkwell" / "1960s lamp" — weaker but better than nothing
  if (!query && goodEra && objectType) {
    query = clean(goodEra, objectType);
  }

  // ── Priority 7: Object type + color/material ──────────────────────────────
  if (!query && objectType) {
    query = clean(objectType, color ?? (goodMat ?? null));
  }

  // ── Priority 8: Category only ─────────────────────────────────────────────
  if (!query && category) {
    query = clean(category);
  }

  return normalizeQuery(query || "vintage item");
}

// ── Diagnostic helper ─────────────────────────────────────────────────────────

export function queryPriority(
  attributes:     ItemAttributes,
  isNamedProduct: boolean,
): string {
  const { brand, model, objectType, primaryColor, material, era, category } = attributes;
  const color   = isNonMaterialColor(primaryColor) ? primaryColor : null;
  const goodEra = isQueryWorthyEra(era) ? era : null;
  const goodMat = isQueryWorthyMaterial(material) ? material : null;

  if (isNamedProduct && brand && model) return "P1:named-product";
  if (brand && objectType)              return "P2:brand+type";
  if (brand && category)                return "P3:brand+category";
  if (goodMat && goodEra && objectType) return "P4:material+era+type";
  if (goodMat && objectType)            return "P5:material+type";
  if (goodEra && objectType)            return "P6:era+type";
  if (objectType)                       return "P7:type+color";
  if (category)                         return "P8:category";
  return "P9:fallback";
}

// keep isNonMaterialColor accessible for serpApiClient
export { isNonMaterialColor };
