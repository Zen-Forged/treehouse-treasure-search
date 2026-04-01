// lib/queryBuilder.ts
//
// Deterministic search query construction from ItemAttributes.
//
// Priority hierarchy:
//   1. Named product  → brand + model + color
//   2. Brand + type   → brand + objectType (+ styleDescriptor)
//   3. Brand + category fallback
//   4. Material + styleDescriptor + type → e.g. "brass lily lamp", "carnival glass owl bookend"
//   5. Material + era + type
//   6. Material + type (+ non-material color)
//   7. Era + type (no material)
//   8. Type + color/material fallback
//   9. Category only
//
// styleDescriptor is extracted from distinctiveFeatures — it's the one token
// that makes a generic item specific on eBay (lily, owl, cinderella, gooseneck,
// globe, tulip). Without it "brass lamp" returns thousands; "brass lily lamp" returns 20.

import { ItemAttributes } from "@/types";
import { normalizeQuery } from "@/utils/normalizeQuery";

// ── Colors specific enough to be worth including in the query ────────────────
const SPECIFIC_COLORS = new Set([
  "white", "black", "silver", "gold", "red", "blue", "green", "pink",
  "purple", "orange", "yellow", "tan", "brown", "gray", "grey", "copper",
  "bronze", "amber", "ivory", "cream", "turquoise", "teal", "navy",
  "rose gold", "space gray", "midnight", "starlight", "platinum",
]);

// Colors that are also materials — don't append as color modifiers
const MATERIAL_COLORS = new Set([
  "brass", "copper", "bronze", "silver", "gold", "pewter",
  "sterling", "chrome", "iron", "steel",
]);

const QUERY_WORTHY_ERAS = new Set([
  "victorian", "edwardian", "art deco", "art nouveau", "mid-century",
  "1950s", "1960s", "1970s", "1950s-1960s", "1960s-1970s",
  "1970s-1980s", "1900s", "1910s", "1920s", "1930s", "1940s",
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

// ── Style descriptors — shape/form keywords that define the item on eBay ──────
// These are pulled from distinctiveFeatures when present.
// They dramatically narrow a generic query: "brass lamp" → "brass lily lamp"
// Only single-word or tight two-word tokens that eBay sellers actually use.
const STYLE_DESCRIPTOR_KEYWORDS = new Set([
  // Figural / sculptural forms
  "lily", "lotus", "tulip", "rose", "daisy", "poppy", "sunflower",
  "owl", "eagle", "duck", "rooster", "horse", "lion", "bear", "fox",
  "mermaid", "cherub", "angel", "nude", "figural",
  "peacock", "butterfly", "dragonfly", "hummingbird",

  // Lamp / lighting forms
  "gooseneck", "torchiere", "pharmacy", "swing arm", "hurricane",
  "bankers", "student", "piano", "tiffany", "slag glass",
  "globe", "mushroom", "bullet", "sputnik", "arc",

  // Glass / pottery forms
  "cinderella", "butterprint", "snowflake", "gooseberry",
  "hobnail", "bubble", "thumbprint", "daisy button",
  "transfer ware", "flow blue", "spatterware",
  "majolica", "spongeware", "redware",

  // Furniture / decorative forms
  "chippendale", "queen anne", "sheraton", "hepplewhite",
  "cabriole", "claw foot", "ball foot", "pad foot",
  "wingback", "camelback", "tuxedo",

  // Jewelry / small object forms
  "cameo", "intaglio", "filigree", "repoussé", "champleve",
  "cloisonne", "niello", "guilloche",

  // Collectible-specific
  "carnival", "depression", "vaseline", "opalescent", "slag",
  "uranium", "cranberry", "cobalt", "amethyst",
  "flow blue", "willow", "transferware",
]);

// Multi-word style descriptors checked as substrings
const STYLE_DESCRIPTOR_PHRASES = [
  "lily pad", "lily base", "lotus base", "gooseneck neck",
  "claw foot", "ball foot", "pad foot", "ball and claw",
  "daisy button", "slug glass", "milk glass",
];

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

// ── Style descriptor extraction ───────────────────────────────────────────────
// Scans distinctiveFeatures for the single most valuable shape/form keyword.
// Returns the best match or null if nothing useful found.
//
// Priority: multi-word phrases first (more specific), then single keywords.
// When multiple single keywords match, prefer the one that appears earliest
// in the features list (Claude returns most salient features first).

export function extractStyleDescriptor(
  distinctiveFeatures: string[] | undefined,
): string | null {
  if (!distinctiveFeatures || distinctiveFeatures.length === 0) return null;

  const featuresText = distinctiveFeatures.join(" ").toLowerCase();

  // Check multi-word phrases first — more specific
  for (const phrase of STYLE_DESCRIPTOR_PHRASES) {
    if (featuresText.includes(phrase)) {
      return phrase;
    }
  }

  // Check individual features for single-word descriptors
  // Process features in order — Claude puts most salient first
  for (const feature of distinctiveFeatures) {
    const lower = feature.toLowerCase();
    for (const keyword of STYLE_DESCRIPTOR_KEYWORDS) {
      // Match as a whole word within the feature string
      const pattern = new RegExp(`\\b${keyword}\\b`);
      if (pattern.test(lower)) {
        return keyword;
      }
    }
  }

  return null;
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
    distinctiveFeatures,
  } = attributes;

  const color          = isNonMaterialColor(primaryColor) ? primaryColor : null;
  const goodEra        = isQueryWorthyEra(era) ? era : null;
  const goodMat        = isQueryWorthyMaterial(material) ? material : null;
  const styleDescriptor = extractStyleDescriptor(distinctiveFeatures);

  let query = "";

  // ── Priority 1: Named branded product ─────────────────────────────────────
  if (isNamedProduct && brand && model) {
    query = clean(brand, model, color);
  }

  // ── Priority 2: Brand + type (+ style if present) ─────────────────────────
  if (!query && brand && objectType) {
    query = clean(brand, styleDescriptor, objectType, color);
  }

  // ── Priority 3: Brand + category fallback ─────────────────────────────────
  if (!query && brand && category) {
    query = clean(brand, category);
  }

  // ── Priority 4: Material + styleDescriptor + type ─────────────────────────
  // The most valuable path for vintage/thrift items without a brand.
  // "brass lily lamp" >> "brass gooseneck lamp" >> "brass desk lamp"
  // styleDescriptor is slotted between material and objectType.
  if (!query && goodMat && objectType) {
    query = clean(goodMat, styleDescriptor, objectType, color);
  }

  // ── Priority 5: Era + styleDescriptor + type (no material) ────────────────
  if (!query && goodEra && objectType) {
    query = clean(goodEra, styleDescriptor, objectType);
  }

  // ── Priority 6: styleDescriptor + type (no material, no era) ──────────────
  if (!query && styleDescriptor && objectType) {
    query = clean(styleDescriptor, objectType, color);
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
  const { brand, model, objectType, material, era, category, distinctiveFeatures } = attributes;
  const goodEra        = isQueryWorthyEra(era) ? era : null;
  const goodMat        = isQueryWorthyMaterial(material) ? material : null;
  const styleDescriptor = extractStyleDescriptor(distinctiveFeatures);

  if (isNamedProduct && brand && model)   return "P1:named-product";
  if (brand && objectType)                return "P2:brand+type";
  if (brand && category)                  return "P3:brand+category";
  if (goodMat && objectType && styleDescriptor) return "P4:material+style+type";
  if (goodMat && objectType)              return "P4:material+type";
  if (goodEra && objectType)              return "P5:era+type";
  if (styleDescriptor && objectType)      return "P6:style+type";
  if (objectType)                         return "P7:type+color";
  if (category)                           return "P8:category";
  return "P9:fallback";
}

export { isNonMaterialColor };
