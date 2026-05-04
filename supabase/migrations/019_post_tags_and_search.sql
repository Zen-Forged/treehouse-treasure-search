-- 019_post_tags_and_search.sql
-- R16 (session 105) — Discovery search data layer.
--
-- Adds two columns + two GIN indexes that back the SearchBar primitive
-- shipped session 102 (components/SearchBar.tsx). Design record:
-- docs/r16-discovery-search-design.md (decisions D1–D15 frozen session 102).
--
-- Why a wrapper function around to_tsvector():
-- Postgres ships to_tsvector(regconfig, text) as STABLE not IMMUTABLE
-- because the regconfig param could theoretically change at session level.
-- GENERATED ALWAYS AS ... STORED requires IMMUTABLE. Wrapping the
-- expression in a SQL function with the english config hardcoded inline
-- lets us mark the wrapper IMMUTABLE truthfully — same input always
-- yields same output. This is the canonical Postgres pattern recommended
-- by core maintainers for tsvector generated columns. Search lock-down
-- via SET search_path = '' matches the project's session-92 hardening
-- pattern (migration 017_security_function_search_path.sql).
--
-- Why a generated column at all (vs trigger-maintained):
-- Auto-updates on INSERT/UPDATE/DELETE; no trigger to maintain; zero
-- application-layer concern. Vendor + mall name parts are NOT in the
-- generated column because they live in joined tables — phase-1
-- limitation per design record D6 / "Search query" recommendation (c).
-- Title + caption + tags cover ~80% of intent.
--
-- Why weights A/B/C: title matches rank highest, tag matches mid,
-- caption matches lowest. Means "brass candlestick" beats "rambling
-- caption that mentions brass" without per-column queries.
--
-- Why default '{}' not NULL: empty array is safer for downstream code
-- (no NULL guards, can &&-against another array, can iterate without
-- crashing). Posts that fail enrichment still index correctly via
-- title + caption.
--
-- RLS: existing `posts: public read` policy already covers the new
-- columns. No RLS change required.
--
-- Backfill: scripts/backfill-tags.ts (Task 7) iterates posts WHERE
-- tags = '{}' and re-calls the enriched /api/post-caption per post.
--
-- Idempotent: every statement uses IF NOT EXISTS / OR REPLACE so this
-- file is safe to re-run after a partial failure.

-- ── Tags column ───────────────────────────────────────────────────────────
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN posts.tags IS
  'Lowercase categorical strings (5–6 typical) drawn from material/era/object_type/color/subject/category axes. Populated by enriched /api/post-caption (Sonnet vision call) at write time. Empty array on extraction failure. Searched via posts.search_tsv with B-weight.';

-- ── IMMUTABLE wrapper around weighted tsvector concat ─────────────────────
CREATE OR REPLACE FUNCTION posts_search_tsv(
  p_title   text,
  p_tags    text[],
  p_caption text
)
RETURNS tsvector
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT setweight(to_tsvector('pg_catalog.english', coalesce(p_title, '')),                                       'A') ||
         setweight(to_tsvector('pg_catalog.english', array_to_string(coalesce(p_tags, '{}'::text[]), ' ')),       'B') ||
         setweight(to_tsvector('pg_catalog.english', coalesce(p_caption, '')),                                     'C');
$$;

COMMENT ON FUNCTION posts_search_tsv(text, text[], text) IS
  'IMMUTABLE wrapper around weighted to_tsvector concat for posts.search_tsv generated column. Hardcodes pg_catalog.english config so Postgres trusts the IMMUTABLE marking. Search path locked to '''' per project security pattern (see migration 017).';

-- ── Generated tsvector column ─────────────────────────────────────────────
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
  GENERATED ALWAYS AS (posts_search_tsv(title, tags, caption)) STORED;

COMMENT ON COLUMN posts.search_tsv IS
  'Generated tsvector concatenating title (weight A) + tags (weight B) + caption (weight C). Indexed via idx_posts_search_tsv. Queried via Postgres websearch_to_tsquery in lib/posts.ts searchPosts(). Auto-maintained by the GENERATED clause + posts_search_tsv() wrapper; no trigger.';

-- ── GIN index on the generated tsvector ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_posts_search_tsv
  ON posts USING GIN (search_tsv);

-- ── Secondary GIN index on the tags array itself ──────────────────────────
-- Cheap given small array per row + GIN supports text[] natively. Lets
-- future queries do `tags && ARRAY['brass']` for axis-narrow filtering
-- (phase-2 hook for the inert PiSlidersHorizontal glyph in SearchBar).
CREATE INDEX IF NOT EXISTS idx_posts_tags
  ON posts USING GIN (tags);
