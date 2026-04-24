-- supabase/migrations/009_mall_status.sql
-- R4c (session 57) — Mall active/inactive lifecycle.
--
-- Adds a three-state enum (draft / coming_soon / active) to malls + an
-- activated_at timestamp that captures the first activation event. Design
-- decisions D1–D6 are frozen in docs/r4c-mall-active-design.md (session 56).
--
-- Behavior after this migration:
--   - All existing mall rows default to 'draft'. David activates the 1–2
--     real malls via /admin Malls tab post-deploy (~30 sec). Intentionally
--     reveals the pollution problem the picker filter solves — no backfill.
--   - Shopper pickers (home feed, vendor-request dropdown) filter to
--     status = 'active' via the new getActiveMalls() helper.
--   - Admin surfaces (AddBoothInline, /shelves, /admin Malls tab) still
--     read getAllMalls() and surface the status pill.
--   - activated_at is a one-way signal — set on first transition to
--     'active' and never cleared on deactivation. R3 analytics will layer
--     mall_activated / mall_deactivated events on top when it ships.
--
-- RLS: existing "malls: public read" policy returns the new columns to
-- anon reads. Admin writes go through service-role (PATCH /api/admin/malls).
--
-- Index: idx_malls_status_name supports the hot path
-- (SELECT * FROM malls WHERE status = 'active' ORDER BY name).
--
-- 🖐️ HITL APPLY:
--   Run this migration via the Supabase SQL editor for BOTH prod + staging:
--     prod:    https://supabase.com/dashboard/project/zogxkarpwlaqmamfzceb/sql/new
--     staging: (staging project dashboard — see .env.staging.local)
--   Paste the contents of this file, hit Run, then activate the real mall(s)
--   via /admin Malls tab once the deploy lands.

CREATE TYPE public.mall_status AS ENUM ('draft', 'coming_soon', 'active');

ALTER TABLE public.malls
  ADD COLUMN status public.mall_status NOT NULL DEFAULT 'draft',
  ADD COLUMN activated_at timestamp with time zone;

CREATE INDEX idx_malls_status_name ON public.malls (status, name);
