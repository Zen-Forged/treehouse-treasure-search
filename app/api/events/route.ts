// app/api/events/route.ts
// R3 (session 58) — fire-and-forget client event ingestion endpoint.
//
// Design record: docs/r3-analytics-design.md §API surface.
//
// Body: { event_type, session_id, payload? }
//   - event_type validated against the client-allowable set (UI events only;
//     server-side events do NOT come through this route — they inline-write
//     via lib/events.ts recordEvent inside their existing handlers).
//   - session_id required, ≤64 chars (D3 — sessionStorage uuid).
//   - payload optional, jsonb.
//   - If Authorization: Bearer is present, resolves user_id and attaches.
//
// Returns:
//   - 204 No Content on success or "silent discard" (rate-limited)
//   - 400 on malformed body / disallowed event_type / oversized payload
//   - 503 if service client is unavailable (env misconfig)
//
// Rate limit: 60 events/min per session_id. Above the cap, returns 204 and
// discards. Cheap defense against runaway client loops; not security.

import { NextResponse } from "next/server";
import { recordEvent, type EventType } from "@/lib/events";
import { getServiceClient } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

// Client-allowable subset (D2 — server events don't come through this route)
//
// Session 194 — drift closed: 12 client event types declared in
// lib/clientEvents.ts ClientEventType between sessions 100-152 were never
// added to this whitelist (route 400'd silently → never reached recordEvent).
// Now added per the R3 instrumentation completeness audit. Migration 023
// + lib/events.ts EventType extension are the companion changes.
//
// Single dead declaration retired: `flagged_booth_explored` (session 99,
// 0 callsites since declaration) was removed from lib/clientEvents.ts per
// `feedback_dead_code_cleanup_as_byproduct` — NOT added here.
const CLIENT_EVENT_TYPES = [
  "page_viewed",
  "post_saved",
  "post_unsaved",
  "filter_applied",
  // R3 v1.1 amendment (session 73) — booth bookmarks, find share, tag flow.
  // All five new types fire from client-side handlers (no server hooks).
  "booth_bookmarked",
  "booth_unbookmarked",
  "find_shared",
  "tag_extracted",
  "tag_skipped",
  // Session 100 — /find/[id] swipe-between-finds nav.
  "find_swiped",
  // R17 (sessions 117 → 118+) — Geolocation-aware discovery.
  "location_prompted",
  "location_granted",
  "location_denied",
  "find_navigate_tapped",
  "find_view_on_map_tapped",
  // R18 (session 121) — Saved per-mall restructure.
  "flagged_directions_tapped",
  // Session 135 — Share Booth redesign (3-channel grid). Counterpart to
  // the share_mall_* + share_find_* trios below; rides the same path.
  "share_booth_channel_tapped",
  "share_booth_qr_viewed",
  "share_booth_sms_initiated",
  // Session 137 — Share Sheet generalization (Mall + Find entities). Mall
  // + Find use SMS + QR + Copy Link channels (no Email). Per-entity events
  // mirror session 135's share_booth_* shape.
  "share_mall_channel_tapped",
  "share_mall_qr_viewed",
  "share_mall_sms_initiated",
  "share_mall_copy_link_completed",
  "share_find_channel_tapped",
  "share_find_sms_initiated",
  "share_find_copy_link_completed",
  // Session 152 — Share My Shelf (PARKED — defensive include). Wrapper at
  // components/ShelfImageShareScreen.tsx has no consumer today; including
  // here preserves the revive contract when the 4th-tile gets wired back.
  "share_shelf_image_viewed",
  "share_shelf_image_downloaded",
  // Session 154 — Home chrome restructure D12; event key preserved across
  // session 166 chrome restructure (MallStrip tap → MallPickerChip tap;
  // semantic ("user engaged map wayfinding chrome") unchanged).
  "home_strip_tapped",
  // Session 158 — Map enrichment (D14 in docs/map-enrichment-design.md).
  // Carousel card tap + flanking-arrow neighbor-stepping on PinCallout.
  "map_carousel_card_tapped",
  "map_callout_neighbor_stepped",
  // Session 186 — Vendor profile enrichment Arc 1 (D12 in
  // docs/vendor-profile-enrichment-design.md). vendor_social_tapped fires
  // client-side from <AboutBoothSection> in Arc 2 when a shopper taps a
  // Facebook or Instagram bubble. The other three enrichment events
  // (vendor_profile_enriched + vendor_avatar_*) fire server-side and don't
  // ride this whitelist.
  "vendor_social_tapped",
  // Session 194 Ask #2 — Visitor tracking. visitor_engaged fires from
  // lib/visitorTracker.ts via direct fetch (bypasses lib/clientEvents.ts
  // track() to avoid circular import). Once per browser session;
  // sessionStorage guard prevents duplicate fires. Migration 024 adds the
  // matching enum value.
  "visitor_engaged",
] as const;
type ClientEventType = (typeof CLIENT_EVENT_TYPES)[number];

const MAX_SESSION_ID_LEN = 64;
const MAX_PAYLOAD_BYTES  = 4_000;  // 4kb per event — generous; UI payloads are tiny

// ── Rate limit (per-session sliding window) ─────────────────────────────────
const RATE_LIMIT_MAX        = 60;
const RATE_LIMIT_WINDOW_MS  = 60_000;
const sessionAttempts = new Map<string, { count: number; reset: number }>();

function rateLimit(sessionId: string): boolean {
  const now   = Date.now();
  const entry = sessionAttempts.get(sessionId);
  if (!entry || entry.reset < now) {
    sessionAttempts.set(sessionId, { count: 1, reset: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  // Periodic GC so the map doesn't grow unbounded across long uptimes.
  if (sessionAttempts.size > 5000) {
    sessionAttempts.forEach((v, k) => { if (v.reset < now) sessionAttempts.delete(k); });
  }
  return true;
}

export async function POST(req: Request) {
  let body: { event_type?: unknown; session_id?: unknown; payload?: unknown };
  try {
    body = await req.json();
  } catch {
    console.error("[api/events] invalid JSON body");
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  // Session 58 QA aid — visible in Vercel runtime logs.
  console.log(
    `[api/events] received event_type=${typeof body.event_type === "string" ? body.event_type : "?"} ` +
    `session=${typeof body.session_id === "string" ? body.session_id.slice(0, 8) : "?"}`,
  );

  // ── Validate event_type ───────────────────────────────────────────────────
  const eventType = typeof body.event_type === "string" ? body.event_type : "";
  if (!CLIENT_EVENT_TYPES.includes(eventType as ClientEventType)) {
    return NextResponse.json(
      { error: `event_type must be one of: ${CLIENT_EVENT_TYPES.join(", ")}` },
      { status: 400 },
    );
  }

  // ── Validate session_id ───────────────────────────────────────────────────
  const sessionId = typeof body.session_id === "string" ? body.session_id.trim() : "";
  if (!sessionId || sessionId.length > MAX_SESSION_ID_LEN) {
    return NextResponse.json(
      { error: `session_id required, ≤${MAX_SESSION_ID_LEN} chars.` },
      { status: 400 },
    );
  }

  // ── Validate payload (optional, size-limited) ─────────────────────────────
  const payload = (typeof body.payload === "object" && body.payload !== null && !Array.isArray(body.payload))
    ? body.payload as Record<string, unknown>
    : {};
  if (JSON.stringify(payload).length > MAX_PAYLOAD_BYTES) {
    return NextResponse.json(
      { error: `payload exceeds ${MAX_PAYLOAD_BYTES} bytes.` },
      { status: 400 },
    );
  }

  // ── Rate limit (silent discard above cap) ─────────────────────────────────
  if (!rateLimit(sessionId)) {
    return new NextResponse(null, { status: 204 });
  }

  // ── Optional: resolve user_id from bearer token ───────────────────────────
  // Vendors pass a token; shoppers don't. recordEvent gates on null cleanly.
  let userId: string | null = null;
  const header = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (header) {
    const [scheme, token] = header.split(" ");
    if (scheme?.toLowerCase() === "bearer" && token) {
      const service = getServiceClient();
      if (service) {
        const { data } = await service.auth.getUser(token);
        userId = data?.user?.id ?? null;
      }
    }
  }

  await recordEvent(eventType as EventType, {
    user_id:    userId,
    session_id: sessionId,
    payload,
  });

  return new NextResponse(null, { status: 204 });
}
