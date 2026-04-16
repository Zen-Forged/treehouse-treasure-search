-- =============================================================================
-- Migration: 003_cleanup_old_rls_policies.sql
-- Remove stale/conflicting RLS policies left over from earlier Supabase setup.
--
-- PROBLEM: Supabase RLS is permissive — if ANY policy allows an action, it
-- succeeds. Stale open policies like "anon delete posts" defeat the new
-- ownership-based policies entirely.
--
-- This migration drops all old policies, leaving only the 11 correct ones
-- created in 002_enable_rls.sql.
--
-- Run AFTER 002_enable_rls.sql has already been applied.
-- Safe to run — only removes policies, does not touch data or table structure.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- MALLS — remove stale policies (keep: "malls: public read", "malls: admin *")
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "public read malls"      ON malls;
DROP POLICY IF EXISTS "Public can view malls"  ON malls;

-- ─────────────────────────────────────────────────────────────────────────────
-- POSTS — remove stale/dangerous policies
-- Most critical: "anon delete posts" and "anon update posts" allow anyone to
-- modify or delete any post without authentication.
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon delete posts"           ON posts;
DROP POLICY IF EXISTS "anon update posts"           ON posts;
DROP POLICY IF EXISTS "public insert posts"         ON posts;
DROP POLICY IF EXISTS "Vendor can delete own posts" ON posts;
DROP POLICY IF EXISTS "Vendor can insert own posts" ON posts;
DROP POLICY IF EXISTS "Vendor can update own posts" ON posts;
DROP POLICY IF EXISTS "Public can view posts"       ON posts;
DROP POLICY IF EXISTS "public read posts"           ON posts;

-- ─────────────────────────────────────────────────────────────────────────────
-- VENDORS — remove stale policies
-- "public insert vendors" allows anyone to create vendor rows with no
-- ownership check — the new policy requires user_id = auth.uid().
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "public insert vendors"          ON vendors;
DROP POLICY IF EXISTS "Vendor can view own profile"    ON vendors;
DROP POLICY IF EXISTS "Vendor can update own profile"  ON vendors;
DROP POLICY IF EXISTS "Public can view vendors"        ON vendors;
DROP POLICY IF EXISTS "public read vendors"            ON vendors;
