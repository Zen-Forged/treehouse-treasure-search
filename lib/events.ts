// lib/events.ts
// R3 (session 58) — server-side analytics event helper.
//
// Design record: docs/r3-analytics-design.md
//
// Single entry point `recordEvent()` for inline-writes from existing API
// handlers (D2 hybrid capture: server-side path). Fire-and-forget — never
// throws, never blocks the calling handler. Errors log to console.error and
// the calling handler proceeds as if the event recorded.
//
// Reuses getServiceClient() from lib/adminAuth.ts so there is one place that
// instantiates the service-role Supabase client.

import { getServiceClient } from "@/lib/adminAuth";

export type EventType =
  | "page_viewed"
  | "post_saved"
  | "post_unsaved"
  | "filter_applied"
  | "share_sent"
  | "vendor_request_submitted"
  | "vendor_request_approved"
  | "mall_activated"
  | "mall_deactivated";

export interface RecordEventOptions {
  user_id?:    string | null;
  session_id?: string | null;
  payload?:    Record<string, unknown>;
}

/**
 * Record an analytics event. Never throws. Awaited callers may still proceed
 * regardless of outcome — failures only log.
 *
 * Usage (inline in an existing handler):
 *
 *     await recordEvent("share_sent", {
 *       user_id: user?.id ?? null,
 *       payload: { vendor_slug, auth_mode, recipient_count: 1 },
 *     });
 */
export async function recordEvent(
  type: EventType,
  opts: RecordEventOptions = {},
): Promise<void> {
  const service = getServiceClient();
  if (!service) {
    console.error("[events] service client unavailable — skipping event:", type);
    return;
  }
  const { error } = await service.from("events").insert({
    event_type: type,
    user_id:    opts.user_id ?? null,
    session_id: opts.session_id ?? null,
    payload:    opts.payload ?? {},
  });
  if (error) console.error(`[events] recordEvent(${type}) failed:`, error.message);
}
