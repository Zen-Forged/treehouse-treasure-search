// lib/serpApiClient.ts
//
// Change 1 — color + objectType embedded in query string (filters at eBay level)
// Change 2 — hard-filter wrong-color listings post-fetch
//            NOTE: material-colors (brass, copper, bronze etc.) are excluded from
//            the conflict filter — sellers describe shade color, not body material.
// Change 3 — hard-filter body/kit mismatches for camera-category items
// Change 4 — color scoring weight raised to 35%, cap lowered to 15

import { Comp } from "@/types";

const SERPAPI_BASE = "https://serpapi.com/search.json";

// ── Lot pattern — multi-item bundles ─────────────────────────────────────────
const LOT_PATTERN =
  /\b(lot|set|pair|collection|bundle|group)\s+(of\s+)?\d+|\d+\s*(x|pc|pcs|piece|pieces)\b|\b\d{1,2}\s*-?\s*(goblets?|glasses?|cups?|plates?|bowls?|figurines?|statues?)\b/i;

// ── Change 2: true colors only — materials excluded ──────────────────────────
// Brass, copper, bronze, gold, silver are MATERIALS, not colors.
// A "Vintage White Glass Gooseneck Lamp" is a valid comp for a brass lamp —
// the seller is describing the shade, not the body. Filtering on material-colors
// wipes out the bulk of valid comps for vintage lighting and metalwork.
const KNOWN_COLORS = [
  "black", "white", "red", "blue", "green", "pink",
  "purple", "orange", "yellow", "tan", "brown", "gray", "grey",
  "rose gold", "space gray", "midnight", "starlight",
];

// Material-colors: never apply the conflict filter when the target color is one of these.
const MATERIAL_COLORS = new Set([
  "brass", "copper", "bronze", "silver", "gold", "pewter",
  "sterling", "chrome", "iron", "steel", "amber",
]);

// ── Material conflict filter ──────────────────────────────────────────────────
// When we know the item's material (e.g. "brass"), drop listings that clearly
// mention a DIFFERENT material AND don't mention our target material.
// This catches "Tin Benjamin Franklin Bank" when we want brass.
//
// Only applies to materials that are both common on eBay AND meaningfully
// different — we don't want to over-filter ambiguous listings.
// Approach: if the title contains a conflicting material word AND does NOT
// contain the target material word, drop it.
//
// We are deliberately conservative — only hard-conflict pairs are listed.
// E.g. "tin" and "brass" are clearly different; "metal" is too vague to filter.
const KNOWN_MATERIALS = [
  "brass", "bronze", "copper", "cast iron", "wrought iron",
  "tin", "zinc", "pewter", "sterling", "silver plate",
  "ceramic", "porcelain", "stoneware", "terracotta", "earthenware",
  "glass", "crystal",
  "wood", "wooden", "mahogany", "walnut", "oak",
  "plastic", "resin", "bakelite",
  "leather", "fabric", "cloth",
];

function hasMaterialConflict(title: string, targetMaterial: string): boolean {
  const lower  = title.toLowerCase();
  const target = targetMaterial.toLowerCase().trim();

  // If title contains our target material → keep it
  if (lower.includes(target)) return false;

  // Special case: "cast iron" and "wrought iron" both contain "iron" — handle together
  const targetIsIron = target === "cast iron" || target === "wrought iron" || target === "iron";
  if (targetIsIron && (lower.includes("cast iron") || lower.includes("wrought iron") || lower.includes(" iron"))) return false;

  // If no known conflicting material appears in the title → ambiguous, keep it
  const hasConflict = KNOWN_MATERIALS.some(mat => {
    if (mat === target) return false;           // skip our own material
    if (targetIsIron && mat.includes("iron")) return false; // don't conflict iron vs iron
    return lower.includes(mat);
  });

  return hasConflict;
}

// ── Change 3: lens-bundle keywords that indicate a kit, not body-only ────────
const LENS_BUNDLE_KEYWORDS = [
  "with lens", "w/lens", "w/ lens", "+ lens",
  "18-55mm", "15-45mm", "16-50mm", "18-135mm",
  "zoom lens", "with zoom", "and lens", "lens bundle",
  "twin lens", "double lens", "lens included",
];

// ── Change 3: object types that activate the body/kit filter ─────────────────
const CAMERA_OBJECT_TYPES = [
  "camera", "mirrorless", "dslr", "slr", "digital camera",
];

interface SerpApiListing {
  title?:       string;
  price?:       { raw?: string; extracted?: number };
  condition?:   string;
  thumbnail?:   string;
  link?:        string;
  sold_date?:   string;
  unsold_date?: string;
}

interface SerpApiResponse {
  organic_results?:    SerpApiListing[];
  search_information?: { total_results?: number };
  error?:              string;
}

export interface CompsResult {
  soldComps:   Comp[];
  activeComps: Comp[];
  summary: {
    recommendedPrice:  number;
    priceRangeLow:     number;
    priceRangeHigh:    number;
    marketVelocity:    "fast" | "moderate" | "slow";
    demandLevel:       "High" | "Moderate" | "Low";
    quickTake:         string;
    confidence:        "High" | "Moderate" | "Low";
    avgDaysToSell:     number;
    competitionCount:  number;
    competitionLevel:  "low" | "moderate" | "high";
  } | null;
}

// ─── Change 1: build a refined query embedding color signal ──────────────────
// Only appends true colors (not material-colors) to avoid redundancy.
// "brass gooseneck lamp brass" is noise; the material is already in the query.

interface QueryExtras {
  primaryColor?: string | null;
  objectType?:   string | null;
  setType?:      string | null;
}

function buildRefinedQuery(baseQuery: string, extras: QueryExtras): string {
  const parts: string[] = [baseQuery];
  const color = extras.primaryColor?.toLowerCase().trim();

  // Only append if it's a true color (not a material) and not already in query
  if (
    color &&
    color !== "unknown" &&
    !MATERIAL_COLORS.has(color) &&
    !baseQuery.toLowerCase().includes(color)
  ) {
    parts.push(color);
  }

  const refined = parts.join(" ");
  if (refined !== baseQuery) {
    console.log(`[serpapi] refined query: "${baseQuery}" → "${refined}"`);
  }
  return refined;
}

// ─── Change 2: detect color conflicts ────────────────────────────────────────
// Returns true only when target is a true color (not a material-color) AND
// the listing title mentions a different specific color.

function hasColorConflict(title: string, targetColor: string): boolean {
  // Never filter on material-colors — they describe the body, not the shade
  if (MATERIAL_COLORS.has(targetColor.toLowerCase().trim())) return false;

  const lower  = title.toLowerCase();
  const target = targetColor.toLowerCase().trim();

  if (lower.includes(target)) return false;

  const containsAnyColor = KNOWN_COLORS.some(c => lower.includes(c));
  if (!containsAnyColor) return false;

  return true;
}

// ─── Change 3: detect lens-bundle listings for camera items ──────────────────

function hasLensBundleConflict(title: string, objectType: string | null | undefined): boolean {
  if (!objectType) return false;
  const isCamera = CAMERA_OBJECT_TYPES.some(t => objectType.toLowerCase().includes(t));
  if (!isCamera) return false;
  const lower = title.toLowerCase();
  return LENS_BUNDLE_KEYWORDS.some(kw => lower.includes(kw));
}

// ─── Public entry point ───────────────────────────────────────────────────────

export async function getSerpApiSoldComps(
  query:       string,
  primaryColor?: string,
  objectType?:   string,
  setType?:      string,
  material?:     string,
): Promise<CompsResult> {
  const key = process.env.SERPAPI_KEY ?? "";
  if (!key) throw new Error("SERPAPI_KEY is not set");

  const refinedQuery = buildRefinedQuery(query, { primaryColor, objectType, setType });

  console.log(`[serpapi] fetching sold + active for query: "${refinedQuery}"`);

  const [soldResult, activeResult] = await Promise.all([
    fetchEbayListings(refinedQuery, key, "sold"),
    fetchEbayListings(refinedQuery, key, "active"),
  ]);

  const soldComps   = parseListings(soldResult.listings, "sold",   primaryColor, objectType, material);
  const activeComps = parseListings(activeResult.listings, "active", primaryColor, objectType, material);

  console.log(`[serpapi] sold: ${soldComps.length}  active: ${activeComps.length}`);

  if (soldComps.length === 0 && activeComps.length === 0) {
    return { soldComps: [], activeComps: [], summary: null };
  }

  return {
    soldComps,
    activeComps,
    summary: buildSummary(soldComps, activeComps),
  };
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchEbayListings(
  query: string,
  key:   string,
  mode:  "sold" | "active",
): Promise<{ listings: SerpApiListing[]; totalResults: number }> {
  const params = new URLSearchParams({
    engine:  "ebay",
    _nkw:    query,
    _sacat:  "0",
    api_key: key,
  });

  if (mode === "sold") {
    params.set("show_only", "Sold");
  }

  const url = `${SERPAPI_BASE}?${params.toString()}`;
  const res  = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[serpapi] ${mode} error body:`, body);
    throw new Error(`SerpAPI ${mode} returned ${res.status}: ${res.statusText}`);
  }

  const json: SerpApiResponse = await res.json();
  if (json.error) throw new Error(`SerpAPI error: ${json.error}`);

  return {
    listings:     json.organic_results ?? [],
    totalResults: json.search_information?.total_results ?? 0,
  };
}

// ─── Parsing — applies Change 2 (color) and Change 3 (lens/kit) filters ──────

function parseListings(
  listings:    SerpApiListing[],
  listingType: "sold" | "active",
  primaryColor?: string,
  objectType?:   string,
  material?:     string,
): Comp[] {
  const colorToken = primaryColor?.toLowerCase().trim() ?? null;

  // Skip color filter entirely for material-colors or vague values
  const applyColorFilter = !!(
    colorToken &&
    colorToken !== "unknown" &&
    colorToken !== "multi" &&
    colorToken !== "various" &&
    colorToken.length > 2 &&
    !MATERIAL_COLORS.has(colorToken)
  );

  const parsed = listings
    .filter(item => {
      const title = item.title ?? "";

      if (LOT_PATTERN.test(title)) {
        console.log(`[serpapi] filtered lot (${listingType}):`, title);
        return false;
      }

      if (listingType === "sold" && !item.sold_date && item.unsold_date) {
        return false;
      }

      if (applyColorFilter && hasColorConflict(title, colorToken!)) {
        console.log(`[serpapi] filtered color mismatch (${listingType}): "${title}" (want: ${colorToken})`);
        return false;
      }

      if (hasLensBundleConflict(title, objectType)) {
        console.log(`[serpapi] filtered lens bundle (${listingType}): "${title}"`);
        return false;
      }

      // Material conflict filter — only active when material is a hard physical material
      // (not vague terms like "metal" or "vintage")
      const materialToken = material?.toLowerCase().trim();
      if (materialToken && KNOWN_MATERIALS.includes(materialToken)) {
        if (hasMaterialConflict(title, materialToken)) {
          console.log(`[serpapi] filtered material mismatch (${listingType}): "${title}" (want: ${materialToken})`);
          return false;
        }
      }

      return true;
    })
    .map((item): Comp | null => {
      const price = item.price?.extracted ?? parsePrice(item.price?.raw ?? "");
      if (!price) return null;

      return {
        title:       item.title ?? "Unknown item",
        price,
        condition:   normalizeCondition(item.condition ?? ""),
        daysAgo:     estimateDaysAgo(item.sold_date ?? ""),
        listingType,
        imageUrl:    item.thumbnail ?? undefined,
        url:         item.link ?? undefined,
        soldDate:    item.sold_date ?? undefined,
        platform:    "ebay",
      };
    })
    .filter((c): c is Comp => c !== null);

  if (listingType === "sold") {
    return scoreSoldComps(parsed, colorToken, applyColorFilter);
  }

  return parsed.slice(0, 15);
}

// ─── Scoring — Change 4 ───────────────────────────────────────────────────────
// Color scoring only applied when color filter is active (i.e. not a material-color)

function scoreSoldComps(comps: Comp[], colorToken: string | null, applyColorFilter: boolean): Comp[] {
  if (comps.length === 0) return [];

  const RECENCY_CUTOFF = 90;
  const MIN_COMPS      = 10;

  const recent = comps.filter(c => c.daysAgo <= RECENCY_CUTOFF || c.daysAgo === 0);
  const pool   = recent.length >= MIN_COMPS ? recent : comps;

  const prices   = pool.map(c => c.price).sort((a, b) => a - b);
  const median   = computeMedian(prices);
  const MAX_DAYS = Math.max(...pool.map(c => c.daysAgo), 1);

  const scored = pool.map(comp => {
    const priceDiff    = Math.abs(comp.price - median);
    const matchScore   = median > 0 ? Math.max(0, 1 - priceDiff / median) : 0.5;
    const recencyScore = comp.daysAgo === 0 ? 1 : Math.max(0, 1 - comp.daysAgo / MAX_DAYS);
    const colorScore   = (applyColorFilter && colorToken && comp.title.toLowerCase().includes(colorToken)) ? 1.0 : 0.0;

    const finalScore = applyColorFilter
      ? (matchScore * 0.45) + (recencyScore * 0.20) + (colorScore * 0.35)
      : (matchScore * 0.60) + (recencyScore * 0.40);

    return { comp, finalScore };
  });

  return scored
    .sort((a, b) => b.finalScore - a.finalScore)
    .map(s => s.comp)
    .slice(0, 15);
}

// ─── Summary ──────────────────────────────────────────────────────────────────

function buildSummary(soldComps: Comp[], activeComps: Comp[]): CompsResult["summary"] {
  const pricingComps = soldComps.length > 0 ? soldComps : activeComps;
  const prices       = pricingComps.map(c => c.price).sort((a, b) => a - b);

  if (prices.length === 0) return null;

  const median      = computeMedian(prices);
  const trimmed     = prices.filter(p => p >= median * 0.3 && p <= median * 2.5).sort((a, b) => a - b);
  const recommended = computeMedian(trimmed);

  const soldWithDates = soldComps.filter(c => c.soldDate);
  const avgDaysToSell = soldWithDates.length > 0
    ? Math.round(soldWithDates.reduce((s, c) => s + c.daysAgo, 0) / soldWithDates.length)
    : soldComps.length > 0
      ? Math.round(soldComps.reduce((s, c) => s + c.daysAgo, 0) / soldComps.length)
      : 0;

  const competitionCount = activeComps.length;
  const competitionLevel: "low" | "moderate" | "high" =
    competitionCount >= 15 ? "high" :
    competitionCount >= 6  ? "moderate" : "low";

  const velocity: "fast" | "moderate" | "slow" =
    avgDaysToSell <= 7  ? "fast" :
    avgDaysToSell <= 21 ? "moderate" : "slow";

  const demand: "High" | "Moderate" | "Low" =
    soldComps.length >= 8 ? "High" :
    soldComps.length >= 4 ? "Moderate" : "Low";

  const confidence: "High" | "Moderate" | "Low" =
    soldComps.length >= 8 ? "High" :
    soldComps.length >= 4 ? "Moderate" : "Low";

  const spread     = prices[prices.length - 1] - prices[0];
  const demandLine = demand === "High" ? "Strong demand" : demand === "Moderate" ? "Moderate demand" : "Limited demand";
  const velLine    = velocity === "fast" ? "moves quickly" : velocity === "moderate" ? "sells at a steady pace" : "can take time to sell";
  const priceNote  = spread > median * 0.5 ? " — condition significantly affects price" : "";
  const compNote   = competitionLevel === "high" ? " High competition on eBay." : competitionLevel === "moderate" ? " Moderate competition." : "";

  return {
    recommendedPrice:  recommended,
    priceRangeLow:     prices[0],
    priceRangeHigh:    prices[prices.length - 1],
    marketVelocity:    velocity,
    demandLevel:       demand,
    quickTake:         `${demandLine}, ${velLine}${priceNote}.${compNote}`,
    confidence,
    avgDaysToSell,
    competitionCount,
    competitionLevel,
  };
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function parsePrice(raw: string): number {
  const n = parseFloat(raw.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function normalizeCondition(raw: string): string {
  const l = raw.toLowerCase();
  if (l.includes("new"))                               return "New";
  if (l.includes("mint"))                              return "Like New";
  if (l.includes("good"))                              return "Good";
  if (l.includes("fair") || l.includes("acceptable")) return "Fair";
  return "Used";
}

function estimateDaysAgo(soldDate: string): number {
  if (!soldDate) return 0;
  const d = new Date(soldDate);
  if (isNaN(d.getTime())) return 0;
  return Math.round((Date.now() - d.getTime()) / 86_400_000);
}

function computeMedian(sorted: number[]): number {
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
