-- supabase/migrations/018_security_grants_audit.sql
-- Wave 1.5 (session 92) — diagnostic RPC for role-grant drift + auth.users exposure.
--
-- WHY THIS EXISTS
-- ───────────────
-- RLS-state checks (migration 015) cover whether row-level policies engage
-- when the right role hits the right table. They DON'T cover whether a role
-- has a GRANT it shouldn't have in the first place. Examples of drift this
-- diagnostic catches:
--
--   - anon granted SELECT on auth.users (PII exposure — even if PostgREST
--     doesn't expose the auth schema by default, the GRANT is the underlying
--     authorization, and a misconfig elsewhere could turn it into a leak)
--   - authenticated granted INSERT/UPDATE/DELETE on a public table where
--     RLS is ALSO disabled (defense-in-depth gone)
--   - service_role accidentally REVOKEd from a table the server needs
--
-- The diagnostic is read-only metadata — never row data. Restricted to
-- service_role per the same belt-and-suspenders pattern as 015 + 017.
--
-- 🖐️ HITL APPLY:
--   Staging: https://supabase.com/dashboard/project/thaauohvxfrryejmyisv/sql/new
--   Prod:    https://supabase.com/dashboard/project/zogxkarpwlaqmamfzceb/sql/new
--
-- After applying:
--   npx tsx scripts/security-audit/inspect-grants.ts            # prod
--   npx tsx scripts/security-audit/inspect-grants.ts staging    # staging

-- ───────────────────────────────────────────────────────────────────────────
-- audit_role_grants() — flat list of (grantee, schema, table, privilege)
-- for the three application roles, scoped to schemas we care about.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.audit_role_grants()
RETURNS TABLE (
  grantee     text,
  schema_name text,
  table_name  text,
  privilege   text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, information_schema
AS $$
  SELECT
    g.grantee::text,
    g.table_schema::text,
    g.table_name::text,
    g.privilege_type::text
  FROM information_schema.role_table_grants g
  WHERE g.grantee IN ('anon', 'authenticated', 'service_role')
    AND g.table_schema IN ('public', 'auth')
  ORDER BY g.table_schema, g.table_name, g.grantee, g.privilege_type;
$$;

REVOKE ALL ON FUNCTION public.audit_role_grants() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.audit_role_grants() FROM anon;
REVOKE ALL ON FUNCTION public.audit_role_grants() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.audit_role_grants() TO service_role;
