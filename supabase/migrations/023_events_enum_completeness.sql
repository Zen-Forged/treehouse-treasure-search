-- Migration 023 — Extend event_type enum for R3 instrumentation completeness.
--
-- Design context:        docs/r3-analytics-design.md
-- Investigation context: session 194 R3 write-path audit (CLAUDE.md §Session 194)
--
-- BACKGROUND
-- ──────────
-- Sessions 91 → 186 added 28 new event types to lib/events.ts EventType union
-- + 12 new event types to lib/clientEvents.ts ClientEventType union (10 actively
-- wired, 2 dormant from session-152 parked Share My Shelf wrapper). No
-- migration ever extended the prod `event_type` enum past migration 012's
-- 14-value state (session 73). Every `recordEvent()` call for one of those 40
-- missing types has been hitting Postgres with
--   `invalid input value for enum event_type`
-- and the error is swallowed by recordEvent's fire-and-forget try/catch
-- (logged via console.error to Vercel logs, but never surfaced to the user).
--
-- Session 194 Probe 3 (vendor_request_submitted end-to-end via /vendor-request
-- POST → recordEvent → events table) confirmed:
--   ✅ Service-role auth healthy (env vars correct on prod)
--   ✅ RLS bypass working (service role writes through migration 014's default-deny)
--   ✅ Service client `getServiceClient()` end-to-end functional
--   ✅ The 14 valid enum values (migrations 010 + 012) write cleanly
-- So the substrate is healthy — the failure mode is purely the enum gap.
--
-- This migration adds all 40 missing values in a single additive sweep.
-- Includes:
--   • 28 server-side EventType union additions (recordEvent inline-writes)
--   • 10 actively-wired client-side ClientEventType additions
--   • 2 dormant share_shelf_image_* defensive includes (session 152 parked
--     wrapper; zero runtime cost; preserves revive contract)
--
-- `flagged_booth_explored` is NOT included — declared at session 99 in
-- ClientEventType but never wired in any consumer (0 callsites confirmed via
-- session 194 audit-first grep). Retired as dead-declaration in the C2 code
-- commit per `feedback_dead_code_cleanup_as_byproduct` ✅ Promoted.
--
-- ALTER TYPE ADD VALUE is additive and runs outside a transaction in the
-- Supabase SQL editor by default. IF NOT EXISTS makes every statement
-- re-runnable if the migration is partially applied or re-pasted.
--
-- 🖐️ HITL APPLY (run for BOTH projects in sequence):
--   Staging: ⟨staging Supabase SQL editor — see .env.staging.local for project ref⟩
--   Prod:    https://supabase.com/dashboard/project/zogxkarpwlaqmamfzceb/sql/new
--
-- VERIFICATION (paste this read-only query after the ALTERs above to confirm):
--   SELECT COUNT(*) AS enum_value_count FROM (
--     SELECT unnest(enum_range(NULL::event_type))
--   ) AS t;
--   -- Expect: 54 rows (14 from migrations 010 + 012, + 40 from this migration)

-- ─── Session 91 (Wave 1 admin audit logging) ──────────────────────────────
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'booth_deleted_by_admin';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'booth_edited_by_admin';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'post_deleted_by_admin';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'featured_image_uploaded_by_admin';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'featured_image_removed_by_admin';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'vendor_hero_removed';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'vendor_profile_edited';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'mall_hero_uploaded_by_admin';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'mall_hero_removed_by_admin';

-- ─── Session 100 — /find/[id] swipe-between-finds nav ────────────────────
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'find_swiped';

-- ─── R17 (sessions 117 → 118+) — Geolocation-aware discovery ─────────────
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'location_prompted';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'location_granted';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'location_denied';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'find_navigate_tapped';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'find_view_on_map_tapped';

-- ─── R18 (session 121) — Saved per-mall restructure ──────────────────────
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'flagged_directions_tapped';

-- ─── Arc 4 of login refactor (sessions 124-125 + Arc 2.4 follow-up) ──────
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'vendor_force_unlinked_by_admin';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'vendor_relinked_by_admin';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'vendor_force_deleted_by_admin';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'vendor_invited_by_admin';

-- ─── Session 135 — Share Booth redesign (3-channel grid) ─────────────────
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'share_booth_channel_tapped';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'share_booth_qr_viewed';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'share_booth_sms_initiated';

-- ─── Session 136 — Requests tab redesign Arc 1 ───────────────────────────
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'vendor_request_denied';

-- ─── Session 137 — Share Sheet generalization (Mall + Find entities) ─────
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'share_mall_channel_tapped';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'share_mall_qr_viewed';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'share_mall_sms_initiated';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'share_mall_copy_link_completed';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'share_find_channel_tapped';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'share_find_sms_initiated';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'share_find_copy_link_completed';

-- ─── Session 152 — Share My Shelf (PARKED — defensive include) ───────────
-- Wrapper at components/ShelfImageShareScreen.tsx is parked-for-revive (no
-- consumer imports). Adding to enum defensively so the revive contract stays
-- clean: when ShareSheet.tsx wires the 4th-tile back in, no follow-on
-- migration is needed.
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'share_shelf_image_viewed';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'share_shelf_image_downloaded';

-- ─── Session 154 — Home chrome restructure ───────────────────────────────
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'home_strip_tapped';

-- ─── Session 158 — Map enrichment (carousel + neighbor-stepping) ─────────
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'map_carousel_card_tapped';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'map_callout_neighbor_stepped';

-- ─── Session 186 — Vendor profile enrichment Arc 1 ───────────────────────
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'vendor_profile_enriched';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'vendor_avatar_uploaded';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'vendor_avatar_removed';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'vendor_social_tapped';
