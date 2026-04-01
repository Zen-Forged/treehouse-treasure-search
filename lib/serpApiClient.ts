// lib/serpApiClient.ts
//
// Change 1 — color + objectType embedded in query string (filters at eBay level)
// Change 2 — hard-filter wrong-color listings post-fetch
// Change 3 — hard-filter body/kit mismatches for camera-category items
// Change 4 — color scoring weight raised to 35%, comp cap lowered to 15

import { Comp } from "@/types";

const SERPAPI_BASE = "https://serpapi.com/search.json";

// ── Lot pattern — multi-item bundles ─────────────────────────────────────────
const LOT_PATTERN =
  /\b(lot|set|pair|collection|bundle|group)\s+(of\s+)?\d+|\d+\s*(x|pc|pcs|piece|pieces)\b|\b\d{1,2}\s*-?\s*(goblets?|glasses?|cups?|plates?|bowls?|figurines?|statues?)\b/i;

// ── Change 2: known color vocabulary for conflict detection ───────────────────
// If a listing title contains one of these AND it doesn't contain our target
// color, we drop it. Only applies when primaryColor is known and specific.
const KNOWN_COLORS = [
  "black", "white", "silver", "gold", "red", "blue", "green", "pink",
  "purple", "orange", "yellow", "tan", "brown", "gray", "grey", "copper",
  "bronze", "rose gold", "space gray", "midnight", "starlight",
];

// ── Change 3: lens-bundle keywords that indicate a kit, not body-only ────────
const LENS_BUNDLE_KEYWORDS = [
  "with lens", "w/lens", "w/ lens", "+ lens", "kit", "18-55", "15-45",
  "16-50", "18-135", "zoom lens", "with zoom", "and lens", "lens bundle",
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

// ─── Change 1: build a refined query embedding color + object-type signals ────

interface QueryExtras {
  primaryColor?: string | null;
  objectType?:   string | null;
  setType?:      string | null;
}

function buildRefinedQuery(baseQuery: string, extras: QueryExtras): string {
  const parts: string[] = [baseQuery];

  const color      = extras.primaryColor?.toLowerCase().trim();
  const objectType = extras.objectType?.toLowerCase().trim();
  const setType    = extras.setType?.toLowerCase().trim();

  // Append color if known and not already in the base query
  if (color && color !== "unknown" && !baseQuery.toLowerCase().includes(color)) {
    parts.push(color);
  }

  // For camera-type items marked as single/body-only, append "body only"
  // This directly targets the body vs kit disambiguation at the eBay level
  const isCamera = objectType && CAMERA_OBJECT_TYPES.some(t => objectType.includes(t));
  if (isCamera && (setType === "single" || !setType || setType === "unknown")) {
    if (!baseQuery.toLowerCase().includes("body")) {
      parts.push("body only");
    }
  }

  const refined = parts.join(" ");
  if (refined !== baseQuery) {
    console.log(`[serpapi] refined query: "${baseQuery}" → "${refined}"`);
  }
  return refined;
}

// ─── Change 2: detect color conflicts in a listing title ─────────────────────
// Returns true if the title contains a different color and NOT our target color.
// Ambiguous titles (no color mentioned) return false — we keep them.

function hasColorConflict(title: string, targetColor: string): boolean {
  const lower  = title.toLowerCase();
  const target = targetColor.toLowerCase().trim();

  // If the title contains our target color → definitely keep it
  if (lower.includes(target)) return false;

  // If no known color appears in the title → ambiguous, keep it
  const containsAnyColor = KNOWN_COLORS.some(c => lower.includes(c));
  if (!containsAnyColor) return false;

  // Title mentions a different color → conflict → drop it
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
): Promise<CompsResult> {
  const key = process.env.SERPAPI_KEY ?? "";
  if (!key) throw new Error("SERPAPI_KEY is not set");

  // Change 1: embed color + object-type signals into the eBay query
  const refinedQuery = buildRefinedQuery(query, { primaryColor, objectType, setType });

  console.log(`[serpapi] fetching sold + active for query: "${refinedQuery}"`);

  const [soldResult, activeResult] = await Promise.all([
    fetchEbayListings(refinedQuery, key, "sold"),
    fetchEbayListings(refinedQuery, key, "active"),
  ]);

  const soldComps   = parseListings(soldResult.listings, "sold",   primaryColor, objectType);
  const activeComps = parseListings(activeResult.listings, "active", primaryColor, objectType);

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
): Comp[] {
  const colorToken = primaryColor?.toLowerCase().trim() ?? null;
  // Only apply color filter when the color is specific (not generic/unknown)
  const applyColorFilter = !!(
    colorToken &&
    colorToken !== "unknown" &&
    colorToken !== "multi" &&
    colorToken !== "various" &&
    colorToken.length > 2
  );

  const parsed = listings
    .filter(item => {
      const title = item.title ?? "";

      // Lot filter (unchanged)
      if (LOT_PATTERN.test(title)) {
        console.log(`[serpapi] filtered lot (${listingType}):`, title);
        return false;
      }

      // Unsold-completed filter (unchanged)
      if (listingType === "sold" && !item.sold_date && item.unsold_date) {
        return false;
      }

      // Change 2: hard-drop wrong-color listings
      if (applyColorFilter && hasColorConflict(title, colorToken!)) {
        console.log(`[serpapi] filtered color mismatch (${listingType}): "${title}" (want: ${colorToken})`);
        return false;
      }

      // Change 3: hard-drop lens-bundle listings for camera items
      if (hasLensBundleConflict(title, objectType)) {
        console.log(`[serpapi] filtered lens bundle (${listingType}): "${title}"`);
        return false;
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
    return scoreSoldComps(parsed, colorToken);
  }

  // Change 4: active listings cap lowered from 20 → 15
  return parsed.slice(0, 15);
}

// ─── Scoring — Change 4: color weight 20% → 35%, cap 20 → 15 ────────────────

function scoreSoldComps(comps: Comp[], colorToken: string | null): Comp[] {
  if (comps.length === 0) return [];

  const RECENCY_CUTOFF = 90;
  const MIN_COMPS      = 10; // lowered from 15 since we're capping at 15 anyway

  const recent = comps.filter(c => c.daysAgo <= RECENCY_CUTOFF || c.daysAgo === 0);
  const pool   = recent.length >= MIN_COMPS ? recent : comps;

  const prices   = pool.map(c => c.price).sort((a, b) => a - b);
  const median   = computeMedian(prices);
  const MAX_DAYS = Math.max(...pool.map(c => c.daysAgo), 1);

  const scored = pool.map(comp => {
    const priceDiff    = Math.abs(comp.price - median);
    const matchScore   = median > 0 ? Math.max(0, 1 - priceDiff / median) : 0.5;
    const recencyScore = comp.daysAgo === 0 ? 1 : Math.max(0, 1 - comp.daysAgo / MAX_DAYS);
    const colorScore   = colorToken && comp.title.toLowerCase().includes(colorToken) ? 1.0 : 0.0;

    // Change 4: color weight raised from 20% → 35% when color is available
    // Corresponding reduction: match 50%→45%, recency 30%→20%
    // Without color: match 60%, recency 40% (unchanged)
    const finalScore = colorToken
      ? (matchScore * 0.45) + (recencyScore * 0.20) + (colorScore * 0.35)
      : (matchScore * 0.60) + (recencyScore * 0.40);

    return { comp, finalScore };
  });

  // Change 4: cap lowered from 20 → 15
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
