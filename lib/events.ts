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
  | "mall_deactivated"
  // ── R3 v1.1 amendment (session 73) — see migration 012 ──────────────────
  | "booth_bookmarked"
  | "booth_unbookmarked"
  | "find_shared"
  | "tag_extracted"
  | "tag_skipped"
  // ── Wave 1 admin audit logging (session 91) — destructive + state-changing
  // admin actions only (per Wave 1 decision 6). Read actions intentionally
  // excluded. `vendor_request_approved` and `mall_activated`/`_deactivated`
  // already capture admin actor via `user_id` and stay above; these are the
  // additional admin-only actions that previously went unlogged.
  | "booth_deleted_by_admin"
  | "booth_edited_by_admin"
  | "post_deleted_by_admin"
  | "featured_image_uploaded_by_admin"
  | "featured_image_removed_by_admin"
  // R4b (session 91, Wave 1) — vendor hero remove. Generic event (no admin
  // distinction) since /api/vendor-hero is currently unauthed; auth/ownership
  // hardening lands in Wave 1.5 security continuation, after which an admin
  // distinction can split off if useful.
  | "vendor_hero_removed"
  // Wave 1 Task 4 (session 91) — vendor self-edits their own booth name
  // (display_name only; booth_number + mall stay admin-only). Distinct from
  // `booth_edited_by_admin` since the actor is the vendor, not an admin.
  | "vendor_profile_edited"
  // R11 (Wave 1 Task 7, session 91) — admin uploads/removes a mall hero.
  | "mall_hero_uploaded_by_admin"
  | "mall_hero_removed_by_admin"
  // Arc 4 of login refactor (session 124+125) — admin Vendors tab destructive
  // actions. Distinct from existing booth_*_by_admin events because these all
  // bypass the user_id != null safety gate (or modify linkage) — the explicit
  // force semantics need their own audit shape per design record D12-D14.
  | "vendor_force_unlinked_by_admin"
  | "vendor_relinked_by_admin"
  | "vendor_force_deleted_by_admin"
  // Arc 4 follow-up (post-Arc-2.4) — admin invites a vendor to claim a
  // pre-seeded booth row. Synthesizes a vendor_request row marked approved
  // + fires the existing approval email; auto-claim attaches user_id when
  // vendor signs in. Distinct from vendor_request_approved (which fires on
  // the self-registration approve path).
  | "vendor_invited_by_admin"
  // Requests tab redesign Arc 1 (session 136) — admin denies a vendor
  // request. Counterpart to vendor_request_approved; soft-archives the row
  // (status flips to 'denied') + fires sendDenialNotice email + persists
  // free-text denial_reason in the row (admin-internal; never exposed).
  // Payload logs reason LENGTH only (not content) per D12.
  | "vendor_request_denied"
  // Session 137 — Share Sheet generalization (Mall + Find entities) ─────
  // Mirrors session 135's share_booth_* shape across the new entity tiers
  // per the 3-tier engagement+share lattice (memory: project_layered_*).
  // Mall + Find use SMS + QR + Copy Link (no Email — booth-only). These
  // events ride the client → /api/events ingest path; the route's
  // CLIENT_EVENT_TYPES whitelist must mirror this list.
  | "share_mall_channel_tapped"
  | "share_mall_qr_viewed"
  | "share_mall_sms_initiated"
  | "share_mall_copy_link_completed"
  | "share_find_channel_tapped"
  | "share_find_qr_viewed"
  | "share_find_sms_initiated"
  | "share_find_copy_link_completed";

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
  if (error) {
    // Verbose log — session 58 QA needed to see the exact Postgres error to
    // diagnose why some inserts were silently failing while others succeeded.
    // recordEvent is fire-and-forget by contract; never surface to the caller.
    console.error(
      `[events] recordEvent(${type}) failed: ${error.message}` +
      (error.code    ? ` code=${error.code}`       : "") +
      (error.details ? ` details=${error.details}` : "") +
      (error.hint    ? ` hint=${error.hint}`       : ""),
    );
  } else {
    console.log(`[events] recordEvent(${type}) ok user_id=${opts.user_id ?? "null"} session=${(opts.session_id ?? "null").slice(0, 8)}`);
  }
}
