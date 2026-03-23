import { MockComp } from "@/types";

const EBAY_API_BASE = "https://api.ebay.com";

interface TokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.token;
  }

  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing EBAY_CLIENT_ID or EBAY_CLIENT_SECRET");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(`${EBAY_API_BASE}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`eBay auth failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return tokenCache.token;
}

interface EbayItem {
  title: string;
  price?: { value: string };
  condition?: string;
  itemWebUrl?: string;
  image?: { imageUrl: string };
  itemEndDate?: string;
  lastSoldDate?: string;
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

export async function getEbaySoldComps(query: string): Promise<MockComp[]> {
  const token = await getAccessToken();

const params = new URLSearchParams({
    q: query,
    filter: "buyingOptions:{FIXED_PRICE},conditions:{USED|VERY_GOOD|GOOD|ACCEPTABLE|LIKE_NEW}",
    sort: "price",
    limit: "10",
  });

  const res = await fetch(
    `${EBAY_API_BASE}/buy/browse/v1/item_summary/search?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`eBay search failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  const items: EbayItem[] = data.itemSummaries ?? [];

  if (items.length === 0) throw new Error("No eBay results found");

  return items
    .filter((item) => item.price?.value)
    .slice(0, 5)
    .map((item) => ({
      title: item.title ?? "Unknown Item",
      platform: "eBay",
      price: parseFloat(item.price!.value),
      condition: normalizeCondition(item.condition),
      daysAgo: daysAgo(item.itemEndDate ?? item.lastSoldDate),
      url: item.itemWebUrl,
      imageUrl: item.image?.imageUrl,
    }));
}