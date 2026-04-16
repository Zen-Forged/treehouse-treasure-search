-- =============================================================================
-- RLS Verification Queries
-- Run these in Supabase Dashboard → SQL Editor AFTER applying 002_enable_rls.sql
-- These are read-only checks — they don't modify any data.
-- =============================================================================

-- 1. Confirm RLS is enabled on all three tables
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename IN ('malls', 'vendors', 'posts')
  AND schemaname = 'public'
ORDER BY tablename;
-- Expected: rls_enabled = true for all three rows

-- 2. List all active policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd AS operation,
  qual AS using_clause
FROM pg_policies
WHERE tablename IN ('malls', 'vendors', 'posts')
ORDER BY tablename, cmd;
-- Expected: 11 policies total (3 malls, 4 vendors, 4 posts)

-- 3. Confirm is_treehouse_admin() function exists
SELECT
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name = 'is_treehouse_admin'
  AND routine_schema = 'public';
-- Expected: 1 row, routine_type = FUNCTION

-- 4. Sanity check — confirm posts, vendors, malls are still readable
-- (This runs as the service role so it will always succeed — just checks row counts)
SELECT
  'posts'   AS tbl, COUNT(*) AS row_count FROM posts
UNION ALL
SELECT
  'vendors' AS tbl, COUNT(*) AS row_count FROM vendors
UNION ALL
SELECT
  'malls'   AS tbl, COUNT(*) AS row_count FROM malls;
-- Expected: counts match what you had before migration
