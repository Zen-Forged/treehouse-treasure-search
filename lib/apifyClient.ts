import { MockComp } from "@/types";

const APIFY_BASE = "https://api.apify.com/v2";

interface ApifyItem {
  type?: string;
  title?: string;
  url?: string;
  soldPrice?: { cents?: number; display?: string; currency?: string };
  totalPrice?: { cents?: number; display?: string };
  condition?: { condition?: string };
  soldDate?: string;
  daysToSell?: number;
  thumbnailUrl?: string;
  imageUrls?: string[];
  listingType?: string;
}

interface ApifySummary {
  type?: string;
  recommendedPrice?: { display?: string };
  priceRange?: { low?: { display?: string }; high?: { display?: string } };
  marketVelocity?: string;
  averageDaysToSell?: number;
  demandLevel?: string;
  quickTake?: string;
  confidence?: string;
  // flat format fallback
  "summary.recommendedPrice.display"?: string;
  "summary.quickTake"?: string;
  "summary.marketVelocity"?: string;
  "summary.demandLevel"?: string;
  "summary.confidence"?: string;
  "summary.averageDaysToSell"?: number;
  "summary.priceRange.low.display"?: string;
  "summary.priceRange.high.display"?: string;
}

export interface ApifyResult {
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

function parsePrice(display?: string): number {
  if (!display) return 0;
  return parseFloat(display.replace(/[^0-9.]/g, "")) || 0;
}

function daysAgo(dateStr?: string): number {
  if (!dateStr) return Math.floor(Math.random() * 14) + 1;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function normalizeCondition(condition?: string): string {
  if (!condition) return "Good";
  const c = condition.toLowerCase();
  if (c.includes("new")) return "Like New";
  if (c.includes("excellent") || c.includes("refurbished")) return "Very Good";
  if (c.includes("good")) return "Good";
  if (c.includes("acceptable") || c.includes("fair")) return "Acceptable";
  return condition;
}

export async function getApifySoldComps(query: string): Promise<ApifyResult> {
  const token = process.env.APIFY_TOKEN;
  const actorId = process.env.APIFY_ACTOR_ID;

  if (!token || !actorId) {
    throw new Error("Missing APIFY_TOKEN or APIFY_ACTOR_ID");
  }

  // Run the actor
  const runRes = await fetch(
    `${APIFY_BASE}/acts/${actorId}/runs?token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        maxItems: 10,
        soldWithinDays: 30,
        sortBy: "date_desc",
        includeAnalytics: true,
        outputFormat: "full",
        ebaySite: "ebay.com",
      }),
    }
  );

  if (!runRes.ok) {
    const text = await runRes.text();
    throw new Error(`Apify run failed: ${runRes.status} ${text}`);
  }

  const runData = await runRes.json();
  const runId = runData?.data?.id;
  if (!runId) throw new Error("No run ID returned from Apify");

  // Poll for completion (max 90 seconds)
  let status = "RUNNING";
  let attempts = 0;
  const maxAttempts = 18;

  while (status === "RUNNING" || status === "READY") {
    if (attempts >= maxAttempts) throw new Error("Apify run timed out");
    await new Promise((r) => setTimeout(r, 5000));
    attempts++;

    const statusRes = await fetch(
      `${APIFY_BASE}/actor-runs/${runId}?token=${token}`
    );
    const statusData = await statusRes.json();
    status = statusData?.data?.status ?? "FAILED";
  }

  if (status !== "SUCCEEDED") {
    throw new Error(`Apify run failed with status: ${status}`);
  }

  // Fetch results
  const datasetRes = await fetch(
    `${APIFY_BASE}/actor-runs/${runId}/dataset/items?token=${token}&clean=true`
  );

  if (!datasetRes.ok) {
    throw new Error(`Failed to fetch Apify dataset: ${datasetRes.status}`);
  }

  const items: (ApifyItem & ApifySummary)[] = await datasetRes.json();

  // Separate comp items from summary
  const compRows = items.filter(
    (i) => i.type === "item" && i.title && i.soldPrice
  );

  const summaryRow = items.find(
    (i) =>
      i.type === "summary" ||
      i["summary.recommendedPrice.display"] ||
      i.recommendedPrice
  );

  if (compRows.length === 0) {
    throw new Error("No sold comp items returned");
  }

  const comps: MockComp[] = compRows.slice(0, 10).map((item) => ({
    title: (item.title ?? "Unknown Item").replace(
      /Opens in a new window or tab/gi,
      ""
    ).trim(),
    platform: "eBay (Sold)",
    price: item.soldPrice?.cents
      ? item.soldPrice.cents / 100
      : parsePrice(item.soldPrice?.display),
    condition: normalizeCondition(item.condition?.condition),
    daysAgo: daysAgo(item.soldDate),
    url: item.url,
    imageUrl: item.thumbnailUrl ?? item.imageUrls?.[0],
  }));

  // Parse summary
  let summary: ApifyResult["summary"] = null;

  if (summaryRow) {
    const recPrice =
      parsePrice(summaryRow["summary.recommendedPrice.display"]) ||
      parsePrice((summaryRow.recommendedPrice as any)?.display);

    const priceLow =
      parsePrice(summaryRow["summary.priceRange.low.display"]) ||
      parsePrice((summaryRow.priceRange as any)?.low?.display);

    const priceHigh =
      parsePrice(summaryRow["summary.priceRange.high.display"]) ||
      parsePrice((summaryRow.priceRange as any)?.high?.display);

    summary = {
      recommendedPrice: recPrice,
      priceRangeLow: priceLow,
      priceRangeHigh: priceHigh,
      marketVelocity:
        summaryRow["summary.marketVelocity"] ??
        summaryRow.marketVelocity ??
        "unknown",
      demandLevel:
        summaryRow["summary.demandLevel"] ??
        summaryRow.demandLevel ??
        "unknown",
      quickTake:
        summaryRow["summary.quickTake"] ?? summaryRow.quickTake ?? "",
      confidence:
        summaryRow["summary.confidence"] ?? summaryRow.confidence ?? "medium",
      avgDaysToSell:
        summaryRow["summary.averageDaysToSell"] ??
        summaryRow.averageDaysToSell ??
        0,
    };
  }

  return { comps, summary };
}