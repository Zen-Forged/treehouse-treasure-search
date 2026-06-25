-- 027_vendor_hidden_from_feed.sql
-- Session 206 #6b — demo / hidden booths.
--
-- Adds a boolean flag to vendors so a booth can be kept out of the public
-- discovery surfaces while remaining fully functional for its owner. The
-- immediate use is the admin's demo booth tied to david@zenforged.com: the
-- admin reaches it via the Booth nav tab (/my-shelf, own user_id) but other
-- users must never see its finds in the Explore feed / search, nor have it
-- counted in per-mall booth/find stats.
--
-- Applied to the PUBLIC read paths only (lib/posts.ts):
--   getFeedPosts          — drops posts whose vendor.hidden_from_feed
--   searchPosts           — drops posts whose vendor.hidden_from_feed
--   getMallStatsByMallId  — excludes hidden vendors from boothCount + findCount
-- NOT applied to getVendorsByMall (admin/internal) or direct-link surfaces
-- (/shelf/[slug], /find/[id]) — hidden-from-feed ≠ deleted.
--
-- NULL semantics: NOT NULL DEFAULT FALSE — every existing + future booth is
-- visible unless explicitly flagged. Fast metadata-only add (PG11+).

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS hidden_from_feed BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN vendors.hidden_from_feed IS
  'When TRUE, the booth + its finds are excluded from the public discovery surfaces (Explore feed, search, per-mall stats). The owner still reaches it via the Booth tab and direct links. Used for the admin demo booth (session 206). Default FALSE = visible.';
