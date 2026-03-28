// lib/serpApiClient.ts
import { MockComp } from "@/types";

const SERPAPI_BASE = "https://serpapi.com/search.json";

// Patterns that indicate a multi-item lot — filter these out
const LOT_PATTERN = /\b(lot|set|pair|collection|bundle|group)\s+(of\s+)?\d+|\d+\s*(x|pc|pcs|piece|pieces)\b|\b\d{1,2}\s*-?\s*(goblets?|glasses?|cups?|plates?|bowls?|figurines?|statues?)\b/i;

interface SerpApiListing {
  title?: string;
  price?: { raw?: string; extracted?: number };
  condition?: string;
  thumbnail?: string;
  link?: string;
  sold_date?: string;
}

interface SerpApiResponse {
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
  const key = process.env.SERPAPI_KEY ?? "";
  console.log("[serpapi] key length:", key.length, "query:", query);

  if (!key) throw new Error("SERPAPI_KEY is not set");

  const q   = encodeURIComponent(query);
  const url = `${SERPAPI_BASE}?engine=ebay&_nkw=${q}&_sacat=0&api_key=${key}`;

  const res = await fetch(url, { cache: "no-store" });

  console.log("[serpapi] response status:", res.status);

  if (!res.ok) {
    const body = await res.text();
    console.error("[serpapi] error body:", body);
    throw new Error(`SerpAPI returned ${res.status}: ${res.statusText}`);
  }

  const json: SerpApiResponse = await res.json();
  if (json.error) throw new Error(`SerpAPI error: ${json.error}`);

  const listings = json.organic_results ?? [];
  console.log("[serpapi] raw listings:", listings.length);

  const comps: MockComp[] = listings
    .filter(item => {
      const title = item.title ?? "";
      // Filter out multi-item lots
      if (LOT_PATTERN.test(title)) {
        console.log("[serpapi] filtered lot:", title);
        return false;
      }
      return true;
    })
    .map((item): MockComp | null => {
      const price = item.price?.extracted ?? parsePrice(item.price?.raw ?? "");
      if (!price) return null;
      return {
        title:     item.title ?? "Unknown item",
        price,
        condition: normalizeCondition(item.condition ?? ""),
        daysAgo:   estimateDaysAgo(item.sold_date ?? ""),
        imageUrl:  item.thumbnail ?? undefined,
        url:       item.link ?? undefined,
        platform:  "ebay" as const,
      };
    })
    .filter((c): c is MockComp => c !== null)
    .slice(0, 20);

  console.log("[serpapi] comps after filtering:", comps.length);

  if (comps.length === 0) return { comps: [], summary: null };

  return { comps, summary: buildSummary(comps) };
}

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

function buildSummary(comps: MockComp[]): SoldCompsResult["summary"] {
  const prices      = comps.map(c => c.price).sort((a, b) => a - b);
  const median      = computeMedian(prices);
  const trimmed     = prices.filter(p => p >= median * 0.3 && p <= median * 2.5);
  const recommended = computeMedian(trimmed.sort((a, b) => a - b));
  const avgDays     = Math.round(comps.reduce((s, c) => s + (c.daysAgo ?? 30), 0) / comps.length);
  const velocity    = avgDays <= 7 ? "fast" : avgDays <= 21 ? "moderate" : "slow";
  const demand      = comps.length >= 10 ? "High" : comps.length >= 5 ? "Moderate" : "Low";
  const confidence  = comps.length >= 8 ? "High" : comps.length >= 4 ? "Moderate" : "Low";
  const spread      = prices[prices.length - 1] - prices[0];
  const demandLine  = demand === "High" ? "Strong demand" : demand === "Moderate" ? "Moderate demand" : "Limited demand";
  const velLine     = velocity === "fast" ? "moves quickly" : velocity === "moderate" ? "sells at a steady pace" : "can take time to sell";
  const priceNote   = spread > median * 0.5 ? " — condition significantly affects price" : "";

  return {
    recommendedPrice: recommended,
    priceRangeLow:    prices[0],
    priceRangeHigh:   prices[prices.length - 1],
    marketVelocity:   velocity,
    demandLevel:      demand,
    quickTake:        `${demandLine}, ${velLine}${priceNote}.`,
    confidence,
    avgDaysToSell:    avgDays,
  };
}
