-- 005_vendor_request_onboarding_refresh.sql
-- Session 32 (2026-04-20) — onboarding refresh v1.2
--
-- Adds four columns to vendor_requests for the v1.2 onboarding refresh:
--   - first_name      text    — captured at request time, used for email salutation
--   - last_name       text    — captured at request time
--   - booth_name      text    — optional; if set, becomes vendors.display_name at approval;
--                               if null/empty, display_name defaults to first_name + ' ' + last_name
--   - proof_image_url text    — Supabase Storage public URL for booth-proof photo
--                               (uploaded to site-assets bucket under booth-proof/ prefix)
--
-- Keeps the existing `name` column populated for backwards compatibility
-- during rollout. New rows populate `name` as `first_name || ' ' || last_name`
-- so any downstream reader that still references `name` continues to work.
--
-- Also adds a partial unique index to prevent duplicate pending requests
-- per email (server-side dedup is the UX surface; this is the DB safety net).
-- Partial so that rejected-then-reapply still works, and so that approved
-- rows don't block the same email from existing in vendors.
--
-- 🖐️ HITL — run in Supabase Dashboard → SQL Editor

ALTER TABLE vendor_requests
  ADD COLUMN IF NOT EXISTS first_name       text,
  ADD COLUMN IF NOT EXISTS last_name        text,
  ADD COLUMN IF NOT EXISTS booth_name       text,
  ADD COLUMN IF NOT EXISTS proof_image_url  text;

-- Partial unique index: one pending request per email address.
-- Using lower(email) to match the route handler's normalization.
-- Skipped silently if it already exists (re-running the migration is safe).
CREATE UNIQUE INDEX IF NOT EXISTS vendor_requests_email_pending_idx
  ON vendor_requests (lower(email))
  WHERE status = 'pending';

-- Verify (run in Supabase SQL Editor — \d is psql-only and won't work):
--
--   SELECT column_name, data_type, is_nullable
--   FROM information_schema.columns
--   WHERE table_name = 'vendor_requests'
--   ORDER BY ordinal_position;
--
--   SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'vendor_requests';
