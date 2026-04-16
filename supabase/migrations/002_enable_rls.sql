-- =============================================================================
-- Migration: 002_enable_rls.sql
-- Enable Row Level Security on malls, vendors, posts
--
-- Treehouse auth tiers:
--   Anonymous   → read-only across all three tables
--   Vendor      → read everything + write/edit/delete their own posts + update their own vendor row
--   Admin       → full access (email match via JWT claim)
--
-- IMPORTANT: Run this in Supabase Dashboard → SQL Editor.
-- Server-side API routes (post-image, vendor-hero) use the service role key
-- and bypass RLS entirely — those are unaffected by this migration.
--
-- Test checklist after running:
--   [ ] Unauthed user can read feed posts
--   [ ] Unauthed user cannot insert a post (should get 403)
--   [ ] Vendor can create a post for their own vendor_id
--   [ ] Vendor cannot delete another vendor's post
--   [ ] Vendor can update their own vendor row (bio, etc.)
--   [ ] Admin can delete any post
--   [ ] Admin can update any vendor row
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- HELPER: admin check
-- Returns true if the current JWT email matches the admin email.
-- Update the email string if the admin email ever changes.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_treehouse_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt() ->> 'email') = 'david@zenforged.com'
$$;


-- =============================================================================
-- TABLE: malls
-- Public read. Admin-only write. Vendors never need to modify mall rows.
-- =============================================================================

ALTER TABLE malls ENABLE ROW LEVEL SECURITY;

-- Anyone (anon + authed) can read all malls
CREATE POLICY "malls: public read"
  ON malls FOR SELECT
  USING (true);

-- Only admin can insert, update, or delete malls
CREATE POLICY "malls: admin insert"
  ON malls FOR INSERT
  WITH CHECK (is_treehouse_admin());

CREATE POLICY "malls: admin update"
  ON malls FOR UPDATE
  USING (is_treehouse_admin());

CREATE POLICY "malls: admin delete"
  ON malls FOR DELETE
  USING (is_treehouse_admin());


-- =============================================================================
-- TABLE: vendors
-- Public read. Vendors can create their own row and update it.
-- Only admin can delete vendor rows.
-- =============================================================================

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Anyone can read all vendor profiles
CREATE POLICY "vendors: public read"
  ON vendors FOR SELECT
  USING (true);

-- Authenticated users can create a vendor row linked to their user_id.
-- The user_id in the new row must match auth.uid() (or be admin).
CREATE POLICY "vendors: owner or admin insert"
  ON vendors FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR is_treehouse_admin()
  );

-- Vendors can update their own row. Admin can update any row.
CREATE POLICY "vendors: owner or admin update"
  ON vendors FOR UPDATE
  USING (
    user_id = auth.uid()
    OR is_treehouse_admin()
  );

-- Only admin can delete vendor rows (protects against accidental self-deletion)
CREATE POLICY "vendors: admin delete"
  ON vendors FOR DELETE
  USING (is_treehouse_admin());


-- =============================================================================
-- TABLE: posts
-- Public read. Write operations require ownership via vendor linkage.
--
-- Ownership chain: auth.uid() → vendors.user_id → posts.vendor_id
-- A vendor can only write posts for the vendor row they own.
-- =============================================================================

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read all posts (feed, detail, shelf views)
CREATE POLICY "posts: public read"
  ON posts FOR SELECT
  USING (true);

-- Vendors can insert posts only for a vendor_id they own.
-- The subquery confirms the vendor row's user_id matches the session.
CREATE POLICY "posts: owner or admin insert"
  ON posts FOR INSERT
  WITH CHECK (
    is_treehouse_admin()
    OR EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_id
        AND vendors.user_id = auth.uid()
    )
  );

-- Vendors can update only their own posts. Admin can update any.
CREATE POLICY "posts: owner or admin update"
  ON posts FOR UPDATE
  USING (
    is_treehouse_admin()
    OR EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_id
        AND vendors.user_id = auth.uid()
    )
  );

-- Vendors can delete only their own posts. Admin can delete any.
CREATE POLICY "posts: owner or admin delete"
  ON posts FOR DELETE
  USING (
    is_treehouse_admin()
    OR EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = vendor_id
        AND vendors.user_id = auth.uid()
    )
  );
