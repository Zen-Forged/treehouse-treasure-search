// scripts/inspect-events.ts
// Session 58 — diagnostic for the R3 events table.
//
// Per session-48 / session-57 promoted rule (script-first over SQL-dump-first):
// the next time a class of "what's actually in the events table" question
// surfaces, run this instead of typing SQL into the dashboard.
//
// Prints:
//   - Total row count (via service-role)
//   - Per-event_type counts (via service-role)
//   - Last 24h count (matches admin Events tab counter logic)
//   - Last 7d count (matches admin Events tab counter logic)
//   - 10 most recent events (truncated payload preview)
//   - Anon read attempt (should return zero rows; events table is admin-only
//     via /api/admin/events, no RLS-grant policy means anon never sees rows
//     even though RLS is technically off — PostgREST gates anon reads on the
//     project's default `anon` role, which has no SELECT grant on `events`).
//
// Usage: npx tsx scripts/inspect-events.ts

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const ENV_PATH_CANDIDATES = [
  resolve(process.cwd(), ".env.local"),
  "/Users/davidbutler/Projects/treehouse-treasure-search/.env.local",
];

function loadEnv(): Record<string, string> {
  for (const path of ENV_PATH_CANDIDATES) {
    if (!existsSync(path)) continue;
    const raw = readFileSync(path, "utf8");
    const out: Record<string, string> = {};
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 0) continue;
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      out[t.slice(0, i).trim()] = v;
    }
    return out;
  }
  throw new Error(`No .env.local found. Tried:\n  ${ENV_PATH_CANDIDATES.join("\n  ")}`);
}

const env  = loadEnv();
const svc  = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!);
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

function truncate(obj: unknown, max = 120): string {
  const s = JSON.stringify(obj);
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

(async () => {
  // ── Total count (service-role, exact) ─────────────────────────────────
  console.log("=== events: total count (service-role) ===");
  const all = await svc.from("events").select("id", { count: "exact" }).limit(1);
  console.log(`count: ${all.count ?? "null"}  (error: ${all.error?.message ?? "none"})`);

  // ── Per-event_type counts ─────────────────────────────────────────────
  console.log("\n=== events: per-event_type counts (service-role) ===");
  const types = [
    "page_viewed", "post_saved", "post_unsaved", "filter_applied",
    "share_sent", "vendor_request_submitted", "vendor_request_approved",
    "mall_activated", "mall_deactivated",
  ];
  for (const t of types) {
    const r = await svc.from("events").select("id", { count: "exact" }).eq("event_type", t).limit(1);
    console.log(`  ${t.padEnd(28)} ${(r.count ?? 0).toString().padStart(6)}  (error: ${r.error?.message ?? "none"})`);
  }

  // ── Time-bucket counts mirroring admin Events tab ─────────────────────
  console.log("\n=== events: time-bucket counts (mirrors /api/admin/events) ===");
  const now      = new Date();
  const twentyF  = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const sevenD   = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000).toISOString();
  const last24h  = await svc.from("events").select("id", { count: "exact" }).gte("occurred_at", twentyF).limit(1);
  const last7d   = await svc.from("events").select("id", { count: "exact" }).gte("occurred_at", sevenD).limit(1);
  console.log(`  last_24h:  ${last24h.count ?? "null"}`);
  console.log(`  last_7d:   ${last7d.count  ?? "null"}`);

  // ── Most-recent 10 ────────────────────────────────────────────────────
  console.log("\n=== events: 10 most recent (service-role) ===");
  const recent = await svc
    .from("events")
    .select("id, event_type, user_id, session_id, payload, occurred_at")
    .order("occurred_at", { ascending: false })
    .limit(10);
  if (recent.error) {
    console.log(`(error: ${recent.error.message})`);
  } else if ((recent.data ?? []).length === 0) {
    console.log("(no rows)");
  } else {
    for (const ev of recent.data ?? []) {
      console.log(
        `  ${ev.occurred_at}  ${ev.event_type.padEnd(28)}  user=${(ev.user_id ?? "—").slice(0, 8)}  ${truncate(ev.payload)}`,
      );
    }
  }

  // ── Anon attempt ──────────────────────────────────────────────────────
  // Should return zero rows even though the events table doesn't have RLS:
  // PostgREST grants only what the `anon` role has SELECT on, and the
  // migration deliberately did not GRANT SELECT to anon.
  console.log("\n=== events: anon read attempt (expected: empty / no grant) ===");
  const anonRead = await anon.from("events").select("id, event_type").limit(3);
  console.log(`error: ${anonRead.error?.message ?? "none"}`);
  console.log(`rows:  ${(anonRead.data ?? []).length}`);
  if ((anonRead.data ?? []).length > 0) {
    console.log("  ⚠️  anon CAN read events — that's a security concern. Check Supabase role grants.");
  }
})();
