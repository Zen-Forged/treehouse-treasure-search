-- supabase/migrations/017_security_function_search_path.sql
-- Wave 1.5 (session 92) — close the function_search_path_mutable advisor finding.
--
-- WHY THIS EXISTS
-- ───────────────
-- Supabase Security Advisor flags any user-defined function in the `public`
-- schema that doesn't pin its search_path. The risk: a privileged caller can
-- shadow built-in operators or relations by creating same-named objects in
-- a schema earlier on the search_path, hijacking what the function does.
-- Pinning search_path = pg_catalog, public makes resolution deterministic.
--
-- Pre-migration state of public.* user functions (see scripts/security-audit/
-- inspect-functions.ts after applying):
--   public.is_treehouse_admin()    — mutable  → flagged
--   public.set_updated_at()        — mutable  → flagged
--   public.audit_rls_state()       — locked   ✓ (migration 015)
--
-- Post-migration: all three explicitly SET search_path = pg_catalog, public.
-- audit_function_search_path() (added below) is the new RPC the diagnostic
-- consumes — same shape as audit_rls_state() in 015.
--
-- 🖐️ HITL APPLY:
--   Staging: https://supabase.com/dashboard/project/thaauohvxfrryejmyisv/sql/new
--   Prod:    https://supabase.com/dashboard/project/zogxkarpwlaqmamfzceb/sql/new
--
-- After applying, run:
--   npx tsx scripts/security-audit/inspect-functions.ts            # prod
--   npx tsx scripts/security-audit/inspect-functions.ts staging    # staging
-- and confirm every public-schema function reports has_search_path=true.

-- ───────────────────────────────────────────────────────────────────────────
-- Lock is_treehouse_admin: RLS-policy gate.
--
-- auth.jwt() is schema-qualified so resolution still works after locking
-- search_path. Body is unchanged from migration 002 — only the SET clause
-- is new.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_treehouse_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $$
  SELECT (auth.jwt() ->> 'email') = 'david@zenforged.com'
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- Lock set_updated_at: trigger function attached to every table with an
-- updated_at column. now() lives in pg_catalog (already first in the new
-- search_path) so the body resolves identically.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- audit_function_search_path() — diagnostic RPC.
--
-- Returns one row per user-defined function in `public` with its search_path
-- setting (or null) + SECURITY DEFINER flag. PostgREST doesn't expose
-- pg_proc / pg_namespace by default, so this RPC is the bridge for the
-- diagnostic script.
--
-- Locked search_path on this function itself; service-role-only execute.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.audit_function_search_path()
RETURNS TABLE (
  function_name        text,
  has_search_path      boolean,
  search_path_value    text,
  is_security_definer  boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT
    p.proname::text  AS function_name,
    (p.proconfig IS NOT NULL AND EXISTS (
      SELECT 1 FROM unnest(p.proconfig) cfg WHERE cfg LIKE 'search_path=%'
    ))  AS has_search_path,
    (
      SELECT substring(cfg FROM 'search_path=(.*)$')
      FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) cfg
      WHERE cfg LIKE 'search_path=%'
      LIMIT 1
    )  AS search_path_value,
    p.prosecdef  AS is_security_definer
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prokind = 'f'  -- functions only (skip aggregates, procs, windows)
  ORDER BY p.proname;
$$;

REVOKE ALL ON FUNCTION public.audit_function_search_path() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.audit_function_search_path() FROM anon;
REVOKE ALL ON FUNCTION public.audit_function_search_path() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.audit_function_search_path() TO service_role;
