-- 006_multi_booth.sql
-- Session 35 (2026-04-20) — multi-booth rework, Option A.
--
-- Drops the one-vendor-per-user constraint so a single auth.users row can
-- own N vendors rows across multiple malls / booths. Approved via mockup
-- review session 34 — see docs/mockups/my-shelf-multi-booth-v1.html and
-- docs/multi-booth-build-spec.md.
--
-- What this changes:
--   - vendors.user_id remains a plain FK to auth.users (no change).
--   - The UNIQUE (user_id) constraint is dropped.
--   - vendors_mall_booth_unique (mall_id, booth_number) stays — this is the
--     real natural key and the only uniqueness the model needs.
--   - vendors_slug_key stays globally unique (auto-suffix handles collisions
--     per session-13 KI-004 resolution).
--   - vendors_pkey stays.
--
-- No data migration required. All existing rows satisfy the relaxed
-- constraint trivially (each user currently owns at most one vendor row).
--
-- Rollback hazard: once a single user owns a second approved vendor row,
-- re-adding vendors_user_id_key will fail. Session-35 on-device QA walk is
-- mandatory before the git push; see build spec rollback plan.
--
-- 🖐️ HITL — run in Supabase Dashboard → SQL Editor.

ALTER TABLE vendors
  DROP CONSTRAINT IF EXISTS vendors_user_id_key;

-- Verify (run after the ALTER):
--
--   SELECT conname
--   FROM pg_constraint
--   WHERE conrelid = 'vendors'::regclass
--   ORDER BY conname;
--
-- Expected: vendors_mall_booth_unique, vendors_pkey, vendors_slug_key.
-- vendors_user_id_key should be absent.
