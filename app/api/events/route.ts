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
