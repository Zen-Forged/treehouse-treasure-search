-- 016_mall_hero_image_url.sql
-- R11 (Wave 1 Task 7, session 91) — mall hero image column.
--
-- Adds an optional `hero_image_url` to the malls table so admins can upload
-- a banner photo per mall. The Discovery Feed (`/`) renders this above the
-- MallScopeHeader when the user has filtered to that specific mall (Frame A
-- per docs/mockups/mall-hero-feed-v1.html). NULL = no hero set; the feed
-- falls back to the existing text-only header without re-layout.
--
-- Storage: photos live in the `site-assets` bucket via the same admin
-- upload pattern used by the home featured banner (`/api/admin/featured-image`).
-- The column stores the public URL of the uploaded object.
--
-- Why no NOT NULL: most malls won't have a hero on day one. David activates
-- malls progressively (R4c) and uploads heros opportunistically. The
-- "Coming soon" status is meaningful even without a photo.
--
-- The TypeScript Mall interface (types/treehouse.ts:34) already declares
-- this column as `hero_image_url?: string | null` from a previous planning
-- pass, so this migration just lands the actual column. No type changes
-- required.

ALTER TABLE malls
  ADD COLUMN IF NOT EXISTS hero_image_url TEXT;

COMMENT ON COLUMN malls.hero_image_url IS
  'Public URL of the per-mall hero banner image. NULL when no hero is set; the feed falls back to a text-only MallScopeHeader. Storage: site-assets bucket, key-prefixed by mall slug. Uploaded via /api/admin/malls/hero-image (admin-only).';
