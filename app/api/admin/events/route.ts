// app/api/admin/events/route.ts
// R3 (session 58) — admin-gated read endpoint for the Events tab.
//
// Design record: docs/r3-analytics-design.md §API surface.
//
// Per the migration 010 RLS note, the events table has RLS off and reads go
// exclusively through this requireAdmin-gated route using the service-role
// client. Anonymous browser clients cannot read or write the table directly.
//
// GET /api/admin/events
//   ?event_type=<one-of>      filter by event_type (or omit for "all")
//   ?limit=<n>                 default 50, max 200
//   ?before=<iso>              cursor for pagination (occurred_at < before)
//   → { events, counts: { last24h, last7d, all } }
//
// Counts are computed server-side via three count() queries — cheap with the
// existing idx_events_occurred_at index. Returned alongside the page payload
// so the admin tab doesn't need a separate round-trip.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

const ALLOWED_FILTERS = [
  "page_viewed",
  "post_saved",
  "post_unsaved",
  "filter_applied",
  "share_sent",
  "vendor_request_submitted",
  "vendor_request_approved",
  "mall_activated",
  "mall_deactivated",
  // UI bucket aliases — translated below into multi-type IN queries
  "saves",
  "views",
  "shares",
] as const;

const SAVES_TYPES  = ["post_saved", "post_unsaved"] as const;
const VIEWS_TYPES  = ["page_viewed"] as const;
const SHARES_TYPES = ["share_sent"] as const;

const DEFAULT_LIMIT = 50;
const MAX_LIMIT     = 200;

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const url       = new URL(req.url);
  const filterRaw = url.searchParams.get("event_type");
  const limitRaw  = url.searchParams.get("limit");
  const beforeRaw = url.searchParams.get("before");

  // ── Resolve type filter ─────────────────────────────────────────────────
  let typeIn: string[] | null = null;
  if (filterRaw) {
    if (!ALLOWED_FILTERS.includes(filterRaw as (typeof ALLOWED_FILTERS)[number])) {
      return NextResponse.json(
        { error: `event_type must be one of: ${ALLOWED_FILTERS.join(", ")}` },
        { status: 400 },
      );
    }
    if (filterRaw === "saves")       typeIn = [...SAVES_TYPES];
    else if (filterRaw === "views")  typeIn = [...VIEWS_TYPES];
    else if (filterRaw === "shares") typeIn = [...SHARES_TYPES];
    else                             typeIn = [filterRaw];
  }

  // ── Resolve limit ───────────────────────────────────────────────────────
  let limit = DEFAULT_LIMIT;
  if (limitRaw) {
    const parsed = parseInt(limitRaw, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return NextResponse.json({ error: "limit must be a positive integer." }, { status: 400 });
    }
    limit = Math.min(parsed, MAX_LIMIT);
  }

  // ── Resolve before cursor ───────────────────────────────────────────────
  let before: string | null = null;
  if (beforeRaw) {
    const t = Date.parse(beforeRaw);
    if (!Number.isFinite(t)) {
      return NextResponse.json({ error: "before must be an ISO timestamp." }, { status: 400 });
    }
    before = new Date(t).toISOString();
  }

  // ── Page query ──────────────────────────────────────────────────────────
  let pageQuery = auth.service
    .from("events")
    .select("id, event_type, user_id, session_id, payload, occurred_at")
    .order("occurred_at", { ascending: false })
    .limit(limit);

  // Session 58 fix — `.in("event_type", [...])` silently returned zero rows
  // even when matching rows existed in the enum column (Supabase JS / PostgREST
  // doesn't always cast a JS string array to the Postgres enum cleanly via the
  // `=in.(…)` operator). `.or()` with explicit `eq.<value>` clauses sidesteps
  // the cast issue entirely — PostgREST handles single-value enum eq cleanly.
  if (typeIn) {
    if (typeIn.length === 1) {
      pageQuery = pageQuery.eq("event_type", typeIn[0]!);
    } else {
      pageQuery = pageQuery.or(typeIn.map(t => `event_type.eq.${t}`).join(","));
    }
  }
  if (before) pageQuery = pageQuery.lt("occurred_at", before);

  const { data: events, error: pageErr } = await pageQuery;
  if (pageErr) {
    console.error("[admin/events GET] page query:", pageErr.message);
    return NextResponse.json({ error: pageErr.message }, { status: 500 });
  }

  // ── Counter strip (24h / 7d / all) ──────────────────────────────────────
  // Three count queries — cheap and parallelizable. Filters (typeIn) are NOT
  // applied to the counter strip — the counters always reflect the un-filtered
  // totals so the user sees both "all activity" at the top and "filtered slice"
  // in the list below.
  //
  // Session 58 fix — `head: true` was returning planner estimates rather than
  // exact counts for the unfiltered query (`pg_class.reltuples` on a freshly
  // CREATEd table reports 0/2 until ANALYZE runs). Removing `head: true` and
  // adding `.limit(1)` forces PostgREST to do a real COUNT(*) and just discards
  // the single returned row. Cost: one tiny row payload per counter; benefit:
  // exact, predictable counts.
  const now      = new Date();
  const twentyFour = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const sevenDay   = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000).toISOString();

  const [c24, c7d, cAll] = await Promise.all([
    auth.service.from("events").select("id", { count: "exact" }).gte("occurred_at", twentyFour).limit(1),
    auth.service.from("events").select("id", { count: "exact" }).gte("occurred_at", sevenDay).limit(1),
    auth.service.from("events").select("id", { count: "exact" }).limit(1),
  ]);

  return NextResponse.json({
    events: events ?? [],
    counts: {
      last24h: c24.count  ?? 0,
      last7d:  c7d.count  ?? 0,
      all:     cAll.count ?? 0,
    },
  });
}
