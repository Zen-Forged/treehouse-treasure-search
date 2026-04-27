-- Migration 012 — Extend event_type enum for R3 v1.1 instrumentation gaps.
--
-- Design record: docs/r3-analytics-design.md §Amendment v1.1 (session 73).
--
-- Five new event types unblock four instrumentation gaps that were deferred
-- at sessions 59 / 62 / 67 / 68 while waiting for the R3 admin-tab
-- stale-data mystery (still parked) to close. The session-73 inspector run
-- against prod confirmed the write path is healthy independent of the
-- read mystery, so these can land safely:
--
--   booth_bookmarked / booth_unbookmarked  (deferred session 67)
--     payload: { vendor_slug }
--     callsites: app/shelves/page.tsx handleToggleBookmark
--                app/shelf/[slug]/page.tsx handleToggleBoothBookmark
--
--   find_shared                            (deferred session 59)
--     payload: { post_id, share_method: "native" | "clipboard" }
--     callsite: app/find/[id]/page.tsx handleShare (both branches)
--
--   tag_extracted                          (deferred session 62)
--     payload: { has_price: boolean, has_title: boolean }
--     callsite: app/post/tag/page.tsx handleTagFile success path
--
--   tag_skipped                            (deferred session 62)
--     payload: {}
--     callsite: app/post/tag/page.tsx handleSkip
--
-- The mall-filter `filter_applied` expansion to Booths + Find Map (session 68
-- carry) re-uses the existing event_type and does NOT need an enum addition.
-- That change ships in the same commit as a payload-shape extension
-- (adds `page` field) backfilled to Home for query-time GROUP BY.
--
-- ALTER TYPE ADD VALUE is additive and runs outside a transaction in the
-- Supabase SQL editor by default. IF NOT EXISTS makes the statements
-- re-runnable if the migration is partially applied.

ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'booth_bookmarked';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'booth_unbookmarked';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'find_shared';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'tag_extracted';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'tag_skipped';
