-- supabase/migrations/015_security_audit_helpers.sql
-- Session 84 — RPC helpers consumed by scripts/security-audit/* diagnostics.
--
-- WHY THIS EXISTS
-- ───────────────
-- The behavioral probe in inspect-rls.ts cannot tell whether RLS is actually
-- enabled on a table — only whether a given operation succeeds or fails. Two
-- different states can produce identical observable behavior:
--
--   site_settings RLS off, no policies      vs   site_settings RLS on, public-read policy only
--     → anon SELECT succeeds (default-allow)         → anon SELECT succeeds (policy)
--     → anon INSERT blocked (column missing)         → anon INSERT blocked (no policy)
--
-- To make the diagnostic state-aware we need a way to read pg_class.relrowsecurity.
-- PostgREST doesn't expose pg_catalog by default; the standard fix is a
-- service-role-only SECURITY DEFINER function.
--
-- SECURITY POSTURE
-- ────────────────
-- This function is read-only, returns only metadata (table names, booleans,
-- counts — never row data), and is restricted to the service_role:
--
--   - SECURITY DEFINER — runs as the function owner (postgres) so it can read
--     pg_class even when called by service_role. Standard pattern.
--   - SET search_path = pg_catalog, public — locks the resolution path.
--     Mitigates Supabase Security Advisor's `function_search_path_mutable`
--     warning AND prevents search-path-based hijacks.
--   - REVOKE ALL FROM PUBLIC, anon, authenticated — only service_role may call.
--   - GRANT EXECUTE TO service_role — explicit allow.
--
-- 🖐️ HITL APPLY:
--   Staging: https://supabase.com/dashboard/project/thaauohvxfrryejmyisv/sql/new
--   Prod:    https://supabase.com/dashboard/project/zogxkarpwlaqmamfzceb/sql/new
--
-- After applying, re-run:
--   npx tsx scripts/security-audit/inspect-rls.ts <target>
-- and the per-table report will include an "rls_enabled: true/false" line
-- read from pg_class directly.

CREATE OR REPLACE FUNCTION public.audit_rls_state()
RETURNS TABLE (
  table_name   text,
  rls_enabled  boolean,
  policy_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT
    c.relname::text                                                                  AS table_name,
    c.relrowsecurity                                                                 AS rls_enabled,
    (SELECT count(*) FROM pg_policies p
       WHERE p.schemaname = 'public' AND p.tablename = c.relname)                    AS policy_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'   -- ordinary tables only (not views, mat-views, sequences)
  ORDER BY c.relname;
$$;

-- Lock down: only service_role may call this. Anon + authenticated are
-- explicitly revoked even though SECURITY DEFINER would let them run if
-- granted. Belt and suspenders.
REVOKE ALL ON FUNCTION public.audit_rls_state() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.audit_rls_state() FROM anon;
REVOKE ALL ON FUNCTION public.audit_rls_state() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.audit_rls_state() TO service_role;
