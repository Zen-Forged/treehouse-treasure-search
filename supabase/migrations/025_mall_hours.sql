-- 025_mall_hours.sql
-- Session 203 — Location hours Shape B Arc 1 schema.
-- Design record: docs/location-hours-design.md (D6).
--
-- Adds five optional columns to malls so the weekly cron (Arc 2) can mirror
-- merchant-maintained hours from the Google Places API (New), and the
-- display layer (Arc 3-4) can compute an "Open now · closes 6 PM" badge.
--
-- We do NOT store a computed open/closed state — that's derived at display
-- time from hours_json + hours_timezone against "now" (D8), so the badge
-- always reflects the current moment without a write.
--
-- Column semantics:
--   place_id        — Google Places place_id; resolved one-time via
--                     scripts/backfill-mall-place-ids.ts (D7). NULL = not yet
--                     resolved / no Google listing → badge falls back to the
--                     Shape A "Hours on Google" deep-link (D9).
--   hours_json      — Place Details regularOpeningHours (+ currentOpeningHours
--                     when present) periods, stored verbatim. NULL = no hours
--                     published → fall back to deep-link (D9).
--   hours_timezone  — IANA zone from Places `timeZone` (e.g. America/New_York
--                     for Louisville, America/Chicago for Owensboro/Paducah).
--                     Load-bearing: KY straddles Eastern + Central, so "open
--                     now" must compute against the mall's own zone (D11).
--   business_status — Places businessStatus (OPERATIONAL / CLOSED_TEMPORARILY
--                     / CLOSED_PERMANENTLY). Drives the explicit closed-listing
--                     badge states (D10).
--   hours_fetched_at — last successful refresh timestamp; staleness tracking.
--
-- All nullable, no default; the cron populates them. Existing rows render
-- exactly as they did pre-migration (badge simply doesn't show → deep-link
-- fallback) until the first refresh runs.

ALTER TABLE malls
  ADD COLUMN IF NOT EXISTS place_id TEXT;

ALTER TABLE malls
  ADD COLUMN IF NOT EXISTS hours_json JSONB;

ALTER TABLE malls
  ADD COLUMN IF NOT EXISTS hours_timezone TEXT;

ALTER TABLE malls
  ADD COLUMN IF NOT EXISTS business_status TEXT;

ALTER TABLE malls
  ADD COLUMN IF NOT EXISTS hours_fetched_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN malls.place_id IS
  'Google Places place_id, resolved one-time via scripts/backfill-mall-place-ids.ts (session 203 / D7). NULL = unresolved or no Google listing; the open-now badge falls back to the Shape A deep-link.';

COMMENT ON COLUMN malls.hours_json IS
  'Place Details regularOpeningHours (+ currentOpeningHours when present) periods, stored verbatim from the weekly cron (session 203 / D6). NULL = no hours published; badge falls back to the Shape A deep-link.';

COMMENT ON COLUMN malls.hours_timezone IS
  'IANA timezone from Places timeZone (America/New_York | America/Chicago). KY straddles Eastern + Central, so "open now" computes against the mall''s own zone (session 203 / D11).';

COMMENT ON COLUMN malls.business_status IS
  'Places businessStatus: OPERATIONAL / CLOSED_TEMPORARILY / CLOSED_PERMANENTLY. Drives explicit closed-listing badge states (session 203 / D10).';

COMMENT ON COLUMN malls.hours_fetched_at IS
  'Timestamp of the last successful hours refresh from the weekly cron (session 203).';
