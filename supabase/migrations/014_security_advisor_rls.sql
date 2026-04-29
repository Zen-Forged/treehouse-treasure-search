-- supabase/migrations/014_security_advisor_rls.sql
-- Session 84 — clear `rls_disabled_in_public` from Supabase Security Advisor.
--
-- WHY THIS EXISTS
-- ───────────────
-- Supabase emailed the project owner (2026-04-29) a `rls_disabled_in_public`
-- security advisory for both production (zogxkarpwlaqmamfzceb) and the staging
-- project. Two public-schema tables have RLS disabled:
--
--   1. site_settings — disabled by migration 008 (session 48). Public reads
--      were intentionally allowed because Home + Find Map banners read via
--      anon supabase-js. Writes were gated by service-role API only.
--
--   2. events — disabled by migration 010 (session 58). Anon visibility was
--      blocked at the GRANT level by migration 011 (`REVOKE SELECT FROM
--      anon, authenticated`). Writes via service-role API only.
--
-- Both choices were defensible at the time, but the Supabase Security
-- Advisor only checks `pg_class.relrowsecurity` — it doesn't understand
-- "writes are gated by API auth" or "anon SELECT is REVOKEd at grant level".
-- The advisor will keep flagging both tables until RLS is explicitly enabled.
--
-- The cleanest fix is to enable RLS on both tables with policies that match
-- the existing access intent. Service-role writes bypass RLS regardless, so
-- application behavior is unchanged.
--
-- VERIFICATION BEFORE / AFTER
-- ───────────────────────────
--   npx tsx scripts/security-audit/inspect-rls.ts staging   # before
--   npx tsx scripts/security-audit/inspect-rls.ts prod      # before
--   ⟨paste this migration into the matching Supabase SQL editor⟩
--   npx tsx scripts/security-audit/inspect-rls.ts staging   # after — expect ✅ across the board
--   npx tsx scripts/security-audit/inspect-rls.ts prod      # after — expect ✅ across the board
--
-- 🖐️ HITL APPLY (run for BOTH projects in sequence):
--   Staging: ⟨staging Supabase SQL editor — see .env.staging.local for project ref⟩
--   Prod:    https://supabase.com/dashboard/project/zogxkarpwlaqmamfzceb/sql/new
--
-- The migration is idempotent — safe to re-run.

-- ─── site_settings ─────────────────────────────────────────────────────────
-- The "site_settings_public_read" policy already exists from migration 008
-- (created as a safety net while RLS was off). With RLS enabled, that policy
-- activates and continues to permit anon + authenticated reads. No write
-- policy means writes default-deny for non-service roles — preserving the
-- existing /api/admin/featured-image gating model.
--
-- Order matters: re-create the policy BEFORE enabling RLS. While RLS is off
-- the DROP+CREATE is inert (policies don't apply); enabling RLS last means
-- there is no reader-visible gap where the policy is missing under active RLS.

DROP POLICY IF EXISTS "site_settings_public_read" ON public.site_settings;
CREATE POLICY "site_settings_public_read"
  ON public.site_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- ─── events ────────────────────────────────────────────────────────────────
-- Default-deny for anon + authenticated. NO policies are created — that
-- means every non-service-role request is blocked at the RLS layer. This
-- matches migration 010's design intent (admin reads exclusively via
-- /api/admin/events with the service-role client) without coupling the
-- admin email to a Postgres function the way an explicit admin-read policy
-- would.
--
-- The migration 011 REVOKEs (SELECT FROM anon, authenticated) remain in
-- place as belt-and-suspenders. Service role bypasses BOTH RLS and grants.
--
-- IF EXISTS so this migration is safe on a project that hasn't applied
-- migration 010 yet (e.g. a freshly-bootstrapped staging environment).

ALTER TABLE IF EXISTS public.events ENABLE ROW LEVEL SECURITY;

-- ─── Verification queries (read-only — paste these after running the
-- ALTERs above to sanity-check before closing the SQL editor) ───────────────
--
-- SELECT relname, relrowsecurity
-- FROM pg_class
-- WHERE relnamespace = 'public'::regnamespace
--   AND relname IN ('site_settings', 'events');
-- -- Expect:  site_settings | t
-- --          events        | t   (or row absent if migration 010 not applied)
--
-- SELECT schemaname, tablename, policyname, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('site_settings', 'events')
-- ORDER BY tablename, policyname;
-- -- Expect: one row for site_settings_public_read on site_settings.
-- --         zero rows for events (default-deny via no policies).
