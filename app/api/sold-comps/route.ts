import { NextRequest, NextResponse } from "next/server";
import { cacheGet, cacheSet } from "@/lib/cache";
import { normalizeQuery } from "@/utils/normalizeQuery";
import { getSerpApiSoldComps } from "@/lib/serpApiClient";
import { getApifySoldComps } from "@/lib/apifyClient";

const COMP_SOURCE = process.env.COMP_SOURCE ?? "serpapi";

async function fetchComps(query: string) {
  if (COMP_SOURCE === "apify") {
    console.log("[sold-comps] using Apify");
    return getApifySoldComps(query);
  }
  console.log("[sold-comps] using SerpAPI");
  return getSerpApiSoldComps(query);
}

export async function GET(req: NextRequest) {
  const rawQuery = req.nextUrl.searchParams.get("q");

  if (!rawQuery?.trim()) {
    return NextResponse.json({ error: "Missing query parameter ?q=" }, { status: 400 });
  }

  const normalized = normalizeQuery(rawQuery.trim());

  if (!normalized) {
    return NextResponse.json({ error: "Query could not be normalized" }, { status: 400 });
  }

  const cached = cacheGet<Record<string, unknown>>(rawQuery);

  if (cached) {
    console.log(`[sold-comps] cache hit — "${normalized}"`);
    return NextResponse.json({
      source: "cache",
      normalizedQuery: normalized,
      ...cached.data,
    });
  }

  console.log(`[sold-comps] cache miss — fetching live "${normalized}" via ${COMP_SOURCE}`);

  try {
    const result = await fetchComps(normalized);
    cacheSet(rawQuery, result as unknown as Record<string, unknown>);
    return NextResponse.json({
      source: "live",
      normalizedQuery: normalized,
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[sold-comps] fetch failed (${COMP_SOURCE}):`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
