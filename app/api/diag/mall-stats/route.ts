// /api/diag/mall-stats — Session 188 Arc 1.3 diagnostic.
//
// David's iPhone QA reported "0 fresh finds" on PinCallout despite recent
// posts existing on the system. This endpoint reproduces the exact
// getMallStatsByMallId query path (anon client, same .eq + .gte chain)
// AND surfaces the unfiltered count for comparison, so we can see
// whether the 30-day filter is the cause or there's a deeper issue
// (RLS policy, column mismatch, status enum drift, etc.).
//
// Returns JSON only — no auth gate; readonly anon query so safe to
// expose temporarily. Retire after diagnosis (Arc 1.3 cleanup).

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Query 1 — same shape as getMallStatsByMallId (filtered for 30-day freshness).
  const filteredRes = await supabase
    .from("posts")
    .select("mall_id, created_at, status")
    .eq("status", "available")
    .gte("created_at", thirtyDaysAgo);

  // Query 2 — all posts at any mall, no filter. For comparison.
  const allRes = await supabase
    .from("posts")
    .select("mall_id, created_at, status")
    .order("created_at", { ascending: false })
    .limit(50);

  // Query 3 — malls for naming.
  const mallsRes = await supabase
    .from("malls")
    .select("id, name, status");

  // Roll up filtered count by mall.
  const filteredByMall: Record<string, number> = {};
  for (const p of filteredRes.data ?? []) {
    if (p.mall_id) filteredByMall[p.mall_id] = (filteredByMall[p.mall_id] ?? 0) + 1;
  }

  // Roll up unfiltered count by mall (status breakdown too).
  const unfilteredByMall: Record<string, { available: number; sold: number; other: number; oldestCreated: string | null; newestCreated: string | null }> = {};
  for (const p of allRes.data ?? []) {
    if (!p.mall_id) continue;
    const m = unfilteredByMall[p.mall_id] ??= { available: 0, sold: 0, other: 0, oldestCreated: null, newestCreated: null };
    if (p.status === "available") m.available += 1;
    else if (p.status === "sold") m.sold += 1;
    else m.other += 1;
    if (!m.oldestCreated || p.created_at < m.oldestCreated) m.oldestCreated = p.created_at;
    if (!m.newestCreated || p.created_at > m.newestCreated) m.newestCreated = p.created_at;
  }

  const mallNames = new Map<string, string>();
  for (const m of mallsRes.data ?? []) mallNames.set(m.id, m.name);

  const summary = {
    now:                   new Date().toISOString(),
    thirty_days_ago:       thirtyDaysAgo,
    filtered_total_count:  filteredRes.data?.length ?? 0,
    filtered_error:        filteredRes.error?.message ?? null,
    unfiltered_recent_50_count: allRes.data?.length ?? 0,
    unfiltered_error:      allRes.error?.message ?? null,
    malls_total:           mallsRes.data?.length ?? 0,
    malls_error:           mallsRes.error?.message ?? null,
    per_mall: Object.keys({ ...filteredByMall, ...unfilteredByMall }).map((id) => ({
      mall_id:      id,
      name:         mallNames.get(id) ?? "<unknown>",
      filtered_30d: filteredByMall[id] ?? 0,
      unfiltered:   unfilteredByMall[id] ?? null,
    })),
  };

  console.log("[diag/mall-stats]", JSON.stringify(summary, null, 2));

  return NextResponse.json(summary, { status: 200 });
}
