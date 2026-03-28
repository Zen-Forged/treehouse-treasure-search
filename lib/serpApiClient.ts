// lib/serpApiClient.ts
//
// eBay sold listings via SerpAPI.
// Drop-in replacement for getApifySoldComps — same return shape.

import { MockComp } from "@/types";

const SERPAPI_KEY = process.env.SERPAPI_KEY ?? "";
const SERPAPI_BASE = "https://serpapi.com/search.json";

interface SerpApiListing {
  title?: string;
  price?: { raw?: string; extracted?: number };
  condition?: string;
  thumbnail?: string;
  link?: string;
  sold_date?: string;
}

interface SerpApiResponse {
  search_information?: { total_results?: number };
  organic_results?: SerpApiListing[];
  error?: string;
}

export interface SoldCompsResult {
  comps: MockComp[];
  summary: {
    recommendedPrice: number;
    priceRangeLow: number;
    priceRangeHigh: number;
    marketVelocity: string;
    demandLevel: string;
    quickTake: string;
    confidence: string;
    avgDaysToSell: number;
  } | null;
}

export async function getSerpApiSoldComps(query: string): Promise<SoldCompsResult> {
  if (!SERPAPI_KEY) throw new Error("SERPAPI_KEY is not set");

  const params = new URLSearchParams({
    api_key:  SERPAPI_KEY,
    engine:   "ebay",
    _nkw:     query,
    LH_Sold:  "1",       // sold listings only
    LH_Complete: "1",    // completed listings
    _sop:     "13",      // sort by date: newest first
  });

  const url = `${SERPAPI_BASE}?${params.toString()}`;
  const res  = await fetch(url, { next: { revalidate: 0 } });

  if (!res.ok) {
    throw new Error(`SerpAPI returned ${res.status}: ${res.statusText}`);
  }

  const json: SerpApiResponse = await res.json();

  if (json.error) throw new Error(`SerpAPI error: ${json.error}`);

  const listings = json.organic_results ?? [];

  // Map to our internal MockComp shape
  const comps: MockComp[] = listings
    .map((item, i): MockComp | null => {
      const price = item.price?.extracted ?? parsePrice(item.price?.raw ?? "");
      if (!price) return null;
      return {
        title:     item.title ?? "Unknown item",
        price,
        condition: normalizeCondition(item.condition ?? ""),
        daysAgo:   estimateDaysAgo(item.sold_date ?? ""),
        imageUrl:  item.thumbnail ?? null,
        url:       item.link ?? null,
      };
    })
    .filter((c): c is MockComp => c !== null)
    .slice(0, 20);

  if (comps.length === 0) {
    return { comps: [], summary: null };
  }

  const summary = buildSummary(comps, query);
  return { comps, summary };
}

// ── Helpers ──────────────────────────────────────────────

function parsePrice(raw: string): number {
  const n = parseFloat(raw.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function normalizeCondition(raw: string): string {
  const l = raw.toLowerCase();
  if (l.includes("new"))  return "New";
  if (l.includes("mint")) return "Like New";
  if (l.includes("good")) return "Good";
  if (l.includes("fair") || l.includes("acceptable")) return "Fair";
  return "Used";
}

function estimateDaysAgo(soldDate: string): number {
  if (!soldDate) return 30;
  const d = new Date(soldDate);
  if (isNaN(d.getTime())) return 30;
  return Math.round((Date.now() - d.getTime()) / 86_400_000);
}

function computeMedian(sorted: number[]): number {
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function buildSummary(comps: MockComp[], query: string): SoldCompsResult["summary"] {
  const prices = comps.map(c => c.price).sort((a, b) => a - b);
  const median  = computeMedian(prices);
  const low     = prices[0];
  const high    = prices[prices.length - 1];
  const spread  = high - low;

  // Trim outliers — drop anything above 2.5x or below 0.3x median
  const trimmed = prices.filter(p => p >= median * 0.3 && p <= median * 2.5);
  const recommended = computeMedian(trimmed.sort((a, b) => a - b));

  const avgDays = Math.round(
    comps.reduce((sum, c) => sum + (c.daysAgo ?? 30), 0) / comps.length
  );

  const velocity  = avgDays <= 7 ? "fast" : avgDays <= 21 ? "moderate" : "slow";
  const demand    = comps.length >= 10 ? "High" : comps.length >= 5 ? "Moderate" : "Low";
  const confidence = comps.length >= 8 ? "High" : comps.length >= 4 ? "Moderate" : "Low";

  const quickTake = buildQuickTake(demand, velocity, recommended, spread);

  return {
    recommendedPrice: recommended,
    priceRangeLow:    low,
    priceRangeHigh:   high,
    marketVelocity:   velocity,
    demandLevel:      demand,
    quickTake,
    confidence,
    avgDaysToSell:    avgDays,
  };
}

function buildQuickTake(
  demand: string,
  velocity: string,
  price: number,
  spread: number
): string {
  const demandLine  = demand === "High" ? "Strong demand" : demand === "Moderate" ? "Moderate demand" : "Limited demand";
  const velocityLine = velocity === "fast" ? "moves quickly" : velocity === "moderate" ? "sells at a steady pace" : "can take time to sell";
  const priceNote   = spread > price * 0.5 ? " — condition significantly affects price" : "";
  return `${demandLine}, ${velocityLine}${priceNote}.`;
}
