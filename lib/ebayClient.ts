import { MockComp } from "@/types";

const EBAY_API_BASE = "https://api.ebay.com";
const EBAY_FINDING_BASE = "https://svcs.ebay.com/services/search/FindingService/v1";

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

function normalizeCondition(condition?: string): string {
  if (!condition) return "Good";
  const c = condition.toLowerCase();
  if (c.includes("new")) return "Like New";
  if (c.includes("excellent") || c.includes("refurbished")) return "Very Good";
  if (c.includes("good")) return "Good";
  if (c.includes("acceptable") || c.includes("fair")) return "Acceptable";
  return condition;
}

function daysAgo(dateStr?: string): number {
  if (!dateStr) return Math.floor(Math.random() * 14) + 1;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

// Finding API — completed/sold listings
export async function getEbaySoldComps(query: string): Promise<MockComp[]> {
  const clientId = process.env.EBAY_CLIENT_ID;
  if (!clientId) throw new Error("Missing EBAY_CLIENT_ID");

  const params = new URLSearchParams({
    "OPERATION-NAME": "findCompletedItems",
    "SERVICE-VERSION": "1.0.0",
    "SECURITY-APPNAME": clientId,
    "RESPONSE-DATA-FORMAT": "JSON",
    "REST-PAYLOAD": "",
    "keywords": query,
    "itemFilter(0).name": "SoldItemsOnly",
    "itemFilter(0).value": "true",
    "itemFilter(1).name": "ListingType",
    "itemFilter(1).value": "AuctionWithBIN,FixedPrice",
    "itemFilter(2).name": "MinPrice",
    "itemFilter(2).value": "5",
    "sortOrder": "EndTimeSoonest",
    "paginationInput.entriesPerPage": "10",
  });

  const res = await fetch(`${EBAY_FINDING_BASE}?${params}`, {
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`eBay Finding API failed: ${res.status} ${text}`);
  }

  const data = await res.json();

  const searchResult =
    data?.findCompletedItemsResponse?.[0]?.searchResult?.[0];

  if (!searchResult || searchResult["@count"] === "0") {
    throw new Error("No sold listings found");
  }

  const items = searchResult.item ?? [];

  return items
    .filter((item: any) => {
      const price = parseFloat(
        item?.sellingStatus?.[0]?.currentPrice?.[0]?.["__value__"] ?? "0"
      );
      return price >= 5;
    })
    .slice(0, 5)
    .map((item: any) => {
      const price = parseFloat(
        item?.sellingStatus?.[0]?.currentPrice?.[0]?.["__value__"] ?? "0"
      );
      const condition =
        item?.condition?.[0]?.conditionDisplayName?.[0] ?? "Good";
      const endDate = item?.listingInfo?.[0]?.endTime?.[0];
      const url = item?.viewItemURL?.[0];
      const imageUrl = item?.galleryURL?.[0];
      const title = item?.title?.[0] ?? "Unknown Item";

      return {
        title,
        platform: "eBay",
        price,
        condition: normalizeCondition(condition),
        daysAgo: daysAgo(endDate),
        url,
        imageUrl,
      };
    });
}