// app/api/sold-comps/route.ts
//
// Sold comps endpoint with normalization + caching layer.
// On cache hit: returns immediately with source: "cache"
// On cache miss: calls Apify, caches result, returns with source: "live"

import { NextRequest, NextResponse } from "next/server";
import { cacheGet, cacheSet, CacheSource } from "@/lib/cache";
import { normalizeQuery } from "@/utils/normalizeQuery";
import { getApifySoldComps } from "@/lib/apifyClient";

export async function GET(req: NextRequest) {
  const rawQuery = req.nextUrl.searchParams.get("q");

  if (!rawQuery || rawQuery.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing query parameter ?q=" },
      { status: 400 }
    );
  }

  const normalized = normalizeQuery(rawQuery.trim());

  if (!normalized) {
    return NextResponse.json(
      { error: "Query could not be normalized to useful search terms" },
      { status: 400 }
    );
  }

  // ── Cache check ──────────────────────────────────────
  const cached = cacheGet(rawQuery);

  if (cached) {
    console.log(`[sold-comps] cache hit — "${normalized}"`);
    return NextResponse.json({
      source: "cache" as CacheSource,
      normalizedQuery: normalized,
      ...cached.data,
    });
  }

  // ── Live fetch ───────────────────────────────────────
  console.log(`[sold-comps] cache miss — fetching live for "${normalized}"`);

  try {
    const result = await getApifySoldComps(normalized);

    // Store the raw result object so we can spread it on cache hit too
    cacheSet(rawQuery, result);

    return NextResponse.json({
      source: "live" as CacheSource,
      normalizedQuery: normalized,
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[sold-comps] live fetch failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
