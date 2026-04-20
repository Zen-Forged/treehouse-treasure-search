-- 007_multi_booth_vendor_request_dedup.sql
-- Session 35 (2026-04-20) — multi-booth rework, dedup rekey.
--
-- Session 32 (migration 005) added a partial unique index on
-- (lower(email)) WHERE status='pending' to prevent duplicate pending
-- vendor_requests per email. That rule is too strict once multi-booth
-- ships: a single vendor can legitimately hold booths across multiple
-- malls (or multiple booths in the same mall) and may have multiple
-- pending requests in flight at once.
--
-- The correct composite natural key is (lower(email), mall_id, booth_number).
-- Same email + same mall + same booth + pending → still blocked. Different
-- mall or different booth → allowed.
--
-- Paired with app/api/vendor-request/route.ts dedup pre-check widening,
-- also shipped this session.
--
-- 🖐️ HITL — run in Supabase Dashboard → SQL Editor.

DROP INDEX IF EXISTS vendor_requests_email_pending_idx;

CREATE UNIQUE INDEX IF NOT EXISTS vendor_requests_email_booth_pending_idx
  ON vendor_requests (lower(email), mall_id, booth_number)
  WHERE status = 'pending';

-- Verify (run after both statements):
--
--   SELECT indexname, indexdef
--   FROM pg_indexes
--   WHERE tablename = 'vendor_requests'
--   ORDER BY indexname;
--
-- Expected: vendor_requests_email_booth_pending_idx is present,
-- vendor_requests_email_pending_idx is absent.
