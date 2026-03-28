import { MockComp } from "@/types";

const SERPAPI_KEY  = process.env.SERPAPI_KEY ?? "";
const SERPAPI_BASE = "https://serpapi.com/search.json";

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
    api_key:     SERPAPI_KEY,
    engine:      "ebay",
    _nkw:        query,
    LH_Sold:     "1",
    LH_Complete: "1",
    _sop:        "13",
  });

  const res = await fetch(`${SERPAPI_BASE}?${params.toString()}`, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`SerpAPI ${res.status}: ${res.statusText}`);

  const json = await res.json();
  if (json.error) throw new Error(`SerpAPI error: ${json.error}`);

  const listings: any[] = json.organic_results ?? [];

  const comps: MockComp[] = listings
    .map((item: any): MockComp | null => {
      const price = item.price?.extracted ?? parsePrice(item.price?.raw ?? "");
      if (!price) return null;
      return {
        title:    item.title ?? "Unknown item",
        price,
        condition: normalizeCondition(item.condition ?? ""),
        daysAgo:  estimateDaysAgo(item.sold_date ?? ""),
        imageUrl: item.thumbnail ?? null,
        url:      item.link ?? null,
      };
    })
    .filter((c): c is MockComp => c !== null)
    .slice(0, 20);

  if (comps.length === 0) return { comps: [], summary: null };

  const summary = buildSummary(comps);
  return { comps, summary };
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
  const prices     = comps.map(c => c.price).sort((a, b) => a - b);
  const median     = computeMedian(prices);
  const trimmed    = prices.filter(p => p >= median * 0.3 && p <= median * 2.5);
  const recommended = computeMedian(trimmed.sort((a, b) => a - b));
  const avgDays    = Math.round(comps.reduce((s, c) => s + (c.daysAgo ?? 30), 0) / comps.length);
  const velocity   = avgDays <= 7 ? "fast" : avgDays <= 21 ? "moderate" : "slow";
  const demand     = comps.length >= 10 ? "High" : comps.length >= 5 ? "Moderate" : "Low";
  const confidence = comps.length >= 8 ? "High" : comps.length >= 4 ? "Moderate" : "Low";
  const spread     = prices[prices.length - 1] - prices[0];
  const demandLine  = demand === "High" ? "Strong demand" : demand === "Moderate" ? "Moderate demand" : "Limited demand";
  const velocityLine = velocity === "fast" ? "moves quickly" : velocity === "moderate" ? "sells at a steady pace" : "can take time to sell";
  const priceNote  = spread > median * 0.5 ? " — condition significantly affects price" : "";
  return {
    recommendedPrice: recommended,
    priceRangeLow:    prices[0],
    priceRangeHigh:   prices[prices.length - 1],
    marketVelocity:   velocity,
    demandLevel:      demand,
    quickTake:        `${demandLine}, ${velocityLine}${priceNote}.`,
    confidence,
    avgDaysToSell:    avgDays,
  };
}
