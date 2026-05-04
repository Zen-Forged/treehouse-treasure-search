-- 019_post_tags_and_search.sql
-- R16 (session 105) — Discovery search data layer.
--
-- Adds two columns + two GIN indexes that back the SearchBar primitive
-- shipped session 102 (components/SearchBar.tsx). Design record:
-- docs/r16-discovery-search-design.md (decisions D1–D15 frozen session 102).
--
-- Why a generated tsvector and not a separate trigger-maintained column:
-- Postgres 12+ supports `GENERATED ALWAYS AS ... STORED`. Auto-updates on
-- INSERT/UPDATE; no trigger to maintain; zero application-layer concern.
-- Vendor + mall name parts are NOT in the generated column because they live
-- in joined tables — phase-1 limitation per design record D6 / "Search query"
-- recommendation (c). Title + caption + tags cover ~80% of intent.
--
-- Why weights A/B/C: title matches rank highest, tag matches mid, caption
-- matches lowest. Means "brass candlestick" beats "rambling caption that
-- mentions brass" without per-column queries.
--
-- Why default '{}' not NULL: empty array is safer for downstream code (no
-- NULL guards, can &&-against another array, can iterate without crashing).
-- Posts that fail enrichment still index correctly via title + caption.
--
-- RLS: existing `posts: public read` policy already covers the new columns.
-- No RLS change required.
--
-- Backfill: scripts/backfill-tags.ts (Task 7) iterates posts WHERE
-- tags = '{}' and re-calls the enriched /api/post-caption per post.

-- ── Tags column ───────────────────────────────────────────────────────────
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN posts.tags IS
  'Lowercase categorical strings (5–6 typical) drawn from material/era/object_type/color/subject/category axes. Populated by enriched /api/post-caption (Sonnet vision call) at write time. Empty array on extraction failure. Searched via posts.search_tsv with B-weight.';

-- ── Generated tsvector for full-text search ───────────────────────────────
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')),                                    'A') ||
    setweight(to_tsvector('english', array_to_string(coalesce(tags, '{}'::text[]), ' ')),    'B') ||
    setweight(to_tsvector('english', coalesce(caption, '')),                                  'C')
  ) STORED;

COMMENT ON COLUMN posts.search_tsv IS
  'Generated tsvector concatenating title (weight A) + tags (weight B) + caption (weight C). Indexed via idx_posts_search_tsv. Queried via Postgres websearch_to_tsquery in lib/posts.ts searchPosts(). Auto-maintained by the GENERATED clause; no trigger.';

-- ── GIN index on the generated tsvector ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_posts_search_tsv
  ON posts USING GIN (search_tsv);

-- ── Secondary GIN index on the tags array itself ──────────────────────────
-- Cheap given small array per row + GIN supports text[] natively. Lets
-- future queries do `tags && ARRAY['brass']` for axis-narrow filtering
-- (phase-2 hook for the inert PiSlidersHorizontal glyph in SearchBar).
CREATE INDEX IF NOT EXISTS idx_posts_tags
  ON posts USING GIN (tags);
