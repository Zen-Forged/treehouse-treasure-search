// lib/serpApiClient.ts
import { Comp } from "@/types";

const SERPAPI_BASE = "https://serpapi.com/search.json";

// Patterns that indicate a multi-item lot — filter these out
const LOT_PATTERN =
  /\b(lot|set|pair|collection|bundle|group)\s+(of\s+)?\d+|\d+\s*(x|pc|pcs|piece|pieces)\b|\b\d{1,2}\s*-?\s*(goblets?|glasses?|cups?|plates?|bowls?|figurines?|statues?)\b/i;

interface SerpApiListing {
  title?:      string;
  price?:      { raw?: string; extracted?: number };
  condition?:  string;
  thumbnail?:  string;
  link?:       string;
  sold_date?:  string;   // present when show_only=Sold
  unsold_date?: string;  // present for completed-but-unsold
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

// ─── Public entry point ───────────────────────────────────────────────────────

export async function getSerpApiSoldComps(query: string, primaryColor?: string): Promise<CompsResult> {
  const key = process.env.SERPAPI_KEY ?? "";
  if (!key) throw new Error("SERPAPI_KEY is not set");

  console.log("[serpapi] fetching sold + active for query:", query);

  const [soldResult, activeResult] = await Promise.all([
    fetchEbayListings(query, key, "sold"),
    fetchEbayListings(query, key, "active"),
  ]);

  const soldComps   = parseListings(soldResult.listings, "sold", primaryColor);
  const activeComps = parseListings(activeResult.listings, "active");

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

// ─── Fetch helpers ────────────────────────────────────────────────────────────

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

  // show_only is the correct SerpAPI parameter — NOT LH_Sold/LH_Complete
  // "Sold" filters to sold listings and returns sold_date on each result
  // "Complete" includes sold + unsold ended listings
  if (mode === "sold") {
    params.set("show_only", "Sold");
  }

  const url = `${SERPAPI_BASE}?${params.toString()}`;
  const res = await fetch(url, { cache: "no-store" });

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

// ─── Parsing ──────────────────────────────────────────────────────────────────

function parseListings(listings: SerpApiListing[], listingType: "sold" | "active", primaryColor?: string): Comp[] {
  const parsed = listings
    .filter(item => {
      const title = item.title ?? "";
      if (LOT_PATTERN.test(title)) {
        console.log(`[serpapi] filtered lot (${listingType}):`, title);
        return false;
      }
      // For sold mode: drop unsold completed listings (have unsold_date but no sold_date)
      if (listingType === "sold" && !item.sold_date && item.unsold_date) {
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
    return scoreSoldComps(parsed, primaryColor);
  }

  return parsed.slice(0, 20);
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function scoreSoldComps(comps: Comp[], primaryColor?: string): Comp[] {
  if (comps.length === 0) return [];

  const RECENCY_CUTOFF = 90; // days
  const MIN_COMPS      = 15;

  // Apply 90-day filter — but only if it leaves enough comps
  const recent = comps.filter(c => c.daysAgo <= RECENCY_CUTOFF || c.daysAgo === 0);
  const pool   = recent.length >= MIN_COMPS ? recent : comps;

  // Compute median price from pool for match_score
  const prices  = pool.map(c => c.price).sort((a, b) => a - b);
  const median  = computeMedian(prices);
  const MAX_DAYS = Math.max(...pool.map(c => c.daysAgo), 1);

  // Normalize color for title matching (e.g. "white", "black", "silver")
  const colorToken = primaryColor?.toLowerCase().trim() ?? null;

  const scored = pool.map(comp => {
    // match_score: price proximity to median (1.0 = exact, 0 = far outlier)
    const priceDiff  = Math.abs(comp.price - median);
    const matchScore = median > 0 ? Math.max(0, 1 - priceDiff / median) : 0.5;

    // recency_score: 1.0 = today, 0 = oldest in pool
    const recencyScore = comp.daysAgo === 0 ? 1 : Math.max(0, 1 - comp.daysAgo / MAX_DAYS);

    // color_score: 1.0 if comp title contains the item's primary color, else 0
    const colorScore = colorToken && comp.title.toLowerCase().includes(colorToken) ? 1.0 : 0.0;

    // Weighted formula — color is a tiebreaker on top of price+recency
    // When color is available: (match × 0.5) + (recency × 0.3) + (color × 0.2)
    // When color is absent:    (match × 0.6) + (recency × 0.4)  — original weights
    const finalScore = colorToken
      ? (matchScore * 0.5) + (recencyScore * 0.3) + (colorScore * 0.2)
      : (matchScore * 0.6) + (recencyScore * 0.4);

    return { comp, finalScore };
  });

  return scored
    .sort((a, b) => b.finalScore - a.finalScore)
    .map(s => s.comp)
    .slice(0, 20);
}

// ─── Summary ──────────────────────────────────────────────────────────────────

function buildSummary(soldComps: Comp[], activeComps: Comp[]): CompsResult["summary"] {
  const pricingComps = soldComps.length > 0 ? soldComps : activeComps;
  const prices       = pricingComps.map(c => c.price).sort((a, b) => a - b);

  if (prices.length === 0) return null;

  const median      = computeMedian(prices);
  const trimmed     = prices.filter(p => p >= median * 0.3 && p <= median * 2.5).sort((a, b) => a - b);
  const recommended = computeMedian(trimmed);

  // avgDaysToSell — only from comps that have a real sold_date
  const soldWithDates = soldComps.filter(c => c.soldDate);
  const avgDaysToSell = soldWithDates.length > 0
    ? Math.round(soldWithDates.reduce((s, c) => s + c.daysAgo, 0) / soldWithDates.length)
    : soldComps.length > 0
      ? Math.round(soldComps.reduce((s, c) => s + c.daysAgo, 0) / soldComps.length)
      : 0;

  const competitionCount = activeComps.length;
  const competitionLevel: "low" | "moderate" | "high" =
    competitionCount >= 20 ? "high" :
    competitionCount >= 8  ? "moderate" : "low";

  const velocity: "fast" | "moderate" | "slow" =
    avgDaysToSell <= 7  ? "fast" :
    avgDaysToSell <= 21 ? "moderate" : "slow";

  const demand: "High" | "Moderate" | "Low" =
    soldComps.length >= 10 ? "High" :
    soldComps.length >= 5  ? "Moderate" : "Low";

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
  if (l.includes("new"))                              return "New";
  if (l.includes("mint"))                             return "Like New";
  if (l.includes("good"))                             return "Good";
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
