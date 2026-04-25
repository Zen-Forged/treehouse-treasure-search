-- Migration 010 — Events table for R3 analytics capture.
--
-- Design record: docs/r3-analytics-design.md
--
-- Single wide events table with jsonb payload (D1) so adding a new event type
-- is a one-line code change, not a migration. Server-side inline-writes (D2)
-- and client-side fire-and-forget POSTs through /api/events both go through
-- the same shape via lib/events.ts → recordEvent().
--
-- ─── RLS note (deviation from design record, session 58 implementation) ─────
-- The design record §Schema specified RLS-on with an admin-only read policy
-- selecting from an `admin_emails` table. That table does not exist in this
-- project — admin gating uses the NEXT_PUBLIC_ADMIN_EMAIL env var compared
-- inside requireAdmin() in lib/adminAuth.ts. RLS-on with a Postgres-side
-- email comparison would create two sources of truth.
--
-- This migration matches the established project pattern (malls, vendors,
-- posts all RLS-disabled per MASTER_PROMPT.md): RLS stays off; admin reads
-- happen exclusively via /api/admin/events, gated by requireAdmin, using
-- the service-role client. Anonymous browser clients still cannot read or
-- write the table directly because:
--   (a) the table is not exposed via PostgREST without an auth token
--       carrying RLS-grant — and we deliberately do not write such a policy
--   (b) writes go through /api/events which uses the service-role key
--   (c) reads go through /api/admin/events which is requireAdmin-gated
--
-- If the project later adopts RLS more broadly, revisit this in line with
-- the broader posture rather than as a one-off table policy.

-- ── Event-type enum ─────────────────────────────────────────────────────────
-- Closed set; new types added later via `ALTER TYPE event_type ADD VALUE 'foo'`
-- (additive, no downtime). The eight types below are the v1 instrumentation
-- scope frozen at session 58.
CREATE TYPE event_type AS ENUM (
  'page_viewed',
  'post_saved',
  'post_unsaved',
  'filter_applied',
  'share_sent',
  'vendor_request_submitted',
  'vendor_request_approved',
  'mall_activated',
  'mall_deactivated'
);

-- ── Events table ────────────────────────────────────────────────────────────
-- user_id is nullable: populated only for vendor-authenticated events. Shopper
-- events carry session_id (browser sessionStorage uuid) instead — D3 in the
-- design record.
--
-- payload is jsonb (D1) so every event type has flexible per-type properties
-- without a schema migration each time.
CREATE TABLE IF NOT EXISTS events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type   event_type NOT NULL,
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id   text,
  payload      jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ─────────────────────────────────────────────────────────────────
-- Hot paths:
--   (a) admin Events tab default query — most-recent-first, all types
--   (b) filter-by-type queries — most-recent-first within a type
--   (c) per-user lookup once R1 lands (nullable, partial index keeps it lean)
CREATE INDEX IF NOT EXISTS idx_events_occurred_at      ON events (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_type_occurred_at ON events (event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_user_id          ON events (user_id) WHERE user_id IS NOT NULL;
