// app/api/admin/events-raw/route.ts
// R3 stale-data mystery — parked-since-session-60 raw-PostgREST probe.
//
// Diagnostic surface for the intermittent symptom where /api/admin/events
// returns a snapshot frozen ~25–60 min behind real DB state while
// scripts/inspect-events.ts (using @supabase/supabase-js with the SAME
// URL + key) sees fresh rows. Session 60 disproved the stuck-Fluid-Compute
// theory and ruled out env-var / project / code mismatches.
//
// What this probe does differently from /api/admin/events:
//   - Bypasses @supabase/supabase-js entirely. Uses bare fetch() against
//     the Supabase PostgREST endpoint with the service-role key in headers.
//   - Same query semantics: ORDER BY occurred_at DESC LIMIT 50 with no
//     filter. Mirrors the admin route's default-page query shape so a
//     side-by-side comparison localizes the bug.
//
// Interpretation:
//   - If THIS endpoint returns fresh rows when /api/admin/events returns
//     stale rows → bug is in @supabase/supabase-js (PostgREST client lib).
//   - If THIS endpoint ALSO returns stale rows → bug is in the network or
//     runtime path between Vercel Fluid Compute and Supabase PostgREST.
//
// Either answer is publishable: lib bug → upstream issue + workaround.
// Network bug → Supabase support ticket with reproducible diff.
//
// Auth: requireAdmin-gated like /api/admin/events. The probe is admin-only
// and never exposed to anon traffic.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

interface EventRow {
  id:          string;
  event_type:  string;
  user_id:     string | null;
  session_id:  string | null;
  payload:     Record<string, unknown>;
  occurred_at: string;
}

export async function GET(req: Request) {
  console.log(`[admin/events-raw GET] hit url=${req.url}`);

  const auth = await requireAdmin(req);
  if (!auth.ok) {
    console.log(`[admin/events-raw GET] requireAdmin denied — returning early`);
    return auth.response;
  }

  const supaUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supaKey  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!supaUrl || !supaKey) {
    return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
  }

  // Mirror the /api/admin/events default-page query shape exactly:
  //   .from("events").select(...).order("occurred_at", { ascending: false }).limit(50)
  // PostgREST equivalent:
  //   GET /rest/v1/events?select=...&order=occurred_at.desc&limit=50
  const queryUrl =
    `${supaUrl.replace(/\/+$/, "")}/rest/v1/events` +
    `?select=id,event_type,user_id,session_id,payload,occurred_at` +
    `&order=occurred_at.desc` +
    `&limit=50`;

  const fetchStart = Date.now();
  const res = await fetch(queryUrl, {
    method: "GET",
    headers: {
      "apikey":         supaKey,
      "Authorization":  `Bearer ${supaKey}`,
      "Accept":         "application/json",
      // Prefer count=exact returns Content-Range with total in header.
      // We mostly want the rows; counts come from the existing route.
    },
    // Important: explicitly disable any caching at the runtime layer. We
    // want the raw network truth on every hit — this probe exists precisely
    // because we suspect a caching/snapshot effect somewhere.
    cache: "no-store",
  });
  const fetchMs = Date.now() - fetchStart;

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(
      `[admin/events-raw GET] PostgREST failed status=${res.status} body=${body.slice(0, 200)}`,
    );
    return NextResponse.json(
      { error: `PostgREST returned ${res.status}`, body: body.slice(0, 500) },
      { status: 502 },
    );
  }

  const events: EventRow[] = await res.json();

  // Diag — match the shape of /api/admin/events' diag block so the two
  // routes' logs read the same on inspection.
  const keyPrefix = supaKey.slice(0, 12);
  const keyLen    = supaKey.length;
  const urlPrefix = supaUrl.slice(0, 40);
  const uptimeSec = Math.round(process.uptime());
  console.log(
    `[admin/events-raw GET diag] ` +
    `uptimeSec=${uptimeSec} ` +
    `urlPrefix=${urlPrefix} ` +
    `keyPrefix=${keyPrefix} ` +
    `keyLen=${keyLen} ` +
    `fetchMs=${fetchMs} ` +
    `rows=${events.length} ` +
    `firstOccurred=${events[0]?.occurred_at ?? "—"} ` +
    `lastOccurred=${events[events.length - 1]?.occurred_at ?? "—"}`,
  );

  return NextResponse.json({
    via:           "raw-postgrest",
    fetch_ms:      fetchMs,
    uptime_sec:    uptimeSec,
    rows_returned: events.length,
    first_occurred_at: events[0]?.occurred_at ?? null,
    last_occurred_at:  events[events.length - 1]?.occurred_at ?? null,
    events,
  });
}
