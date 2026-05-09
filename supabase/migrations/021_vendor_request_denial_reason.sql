-- 021_vendor_request_denial_reason.sql
-- Requests tab redesign Arc 1 (session 136) — admin-internal denial reason.
--
-- Adds `denial_reason text NULL` to vendor_requests. Required at the API
-- layer when status flips to 'denied' (validated in
-- app/api/admin/vendor-requests/route.ts POST deny branch). NULL for pending
-- + approved rows. Never exposed to vendors — admin audit trail only.
--
-- Frozen design decisions: D5 (free-text required on deny), D9 (soft-archive
-- — denied rows persist with denial_reason populated), D14 (API contract).
-- See docs/admin-requests-tab-design.md.
--
-- 🖐️ HITL APPLY (run for BOTH projects in sequence):
--   Staging: ⟨staging Supabase SQL editor — see .env.staging.local for project ref⟩
--   Prod:    https://supabase.com/dashboard/project/zogxkarpwlaqmamfzceb/sql/new
--
-- VERIFICATION (paste after running ALTER):
--   SELECT column_name, data_type, is_nullable
--   FROM information_schema.columns
--   WHERE table_schema = 'public'
--     AND table_name   = 'vendor_requests'
--     AND column_name  = 'denial_reason';
--   -- Expect:  denial_reason | text | YES
--
-- Idempotent: ADD COLUMN IF NOT EXISTS lets this re-run safely after a partial
-- failure or if it lands on staging before prod.

ALTER TABLE public.vendor_requests
  ADD COLUMN IF NOT EXISTS denial_reason text NULL;

COMMENT ON COLUMN public.vendor_requests.denial_reason IS
  'Internal admin notes on why a request was denied. Never exposed to vendor. Required at API layer when status flips to denied. NULL for pending + approved rows. See docs/admin-requests-tab-design.md D5+D9+D14.';
