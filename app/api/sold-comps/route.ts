import { NextRequest, NextResponse } from "next/server";
import { cacheGet, cacheSet } from "@/lib/cache";
import { normalizeQuery } from "@/utils/normalizeQuery";
import { getApifySoldComps } from "@/lib/apifyClient";

export async function GET(req: NextRequest) {
  const rawQuery = req.nextUrl.searchParams.get("q");

  if (!rawQuery?.trim()) {
    return NextResponse.json({ error: "Missing query parameter ?q=" }, { status: 400 });
  }

  const normalized = normalizeQuery(rawQuery.trim());

  if (!normalized) {
    return NextResponse.json({ error: "Query could not be normalized" }, { status: 400 });
  }

  // Cache check
  const cached = cacheGet<Record<string, unknown>>(rawQuery);

  if (cached) {
    console.log(`[sold-comps] cache hit — "${normalized}"`);
    return NextResponse.json({
      source: "cache",
      normalizedQuery: normalized,
      ...cached.data,
    });
  }

  // Live fetch
  console.log(`[sold-comps] cache miss — fetching live for "${normalized}"`);

  try {
    const result = await getApifySoldComps(normalized);
    cacheSet(rawQuery, result as unknown as Record<string, unknown>);
    return NextResponse.json({
      source: "live",
      normalizedQuery: normalized,
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[sold-comps] live fetch failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
