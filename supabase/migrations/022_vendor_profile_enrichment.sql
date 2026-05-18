-- 022_vendor_profile_enrichment.sql
-- Session 184 — Vendor profile enrichment Arc 0 schema (Shape B per
-- docs/queued-sessions.md candidate, will be formalized in session 185
-- design record).
--
-- Adds two optional columns to vendors so vendors can enrich their booth
-- page beyond name + booth_number:
--
--   instagram_url   — Instagram profile URL (full URL, validated client-side)
--   directions_text — free-text directions inside the mall (e.g., "back-left
--                     corner past the antique clocks"), complements the
--                     mall's street address + native maps deep-link
--
-- Already present on vendors (no migration needed): bio, avatar_url,
-- facebook_url, hero_image_url. Session 184 closed the audit gap that
-- these fields exist but aren't surfaced on UI today; sessions 185+ wire
-- the edit surface (EditBoothSheet vendor-mode extension) + display
-- surface (BoothPage on /shelf/[slug]).
--
-- NULL semantics:
--   instagram_url   — NULL = no Instagram presence linked; UI hides the icon
--   directions_text — NULL = no custom directions; UI falls back to the
--                     mall's street address + LocationActions (R17) alone
--
-- Both columns nullable + no default; vendors opt in via the future
-- EditBoothSheet UI. No backfill needed (existing rows render exactly as
-- they did pre-migration).

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS instagram_url TEXT;

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS directions_text TEXT;

COMMENT ON COLUMN vendors.instagram_url IS
  'Optional Instagram profile URL (full https:// URL). NULL = no Instagram linked; /shelf/[slug] hides the Instagram icon. Edited via vendor-mode EditBoothSheet (session 185+).';

COMMENT ON COLUMN vendors.directions_text IS
  'Optional free-text directions to the booth inside the mall (e.g., "back-left corner past the antique clocks"). Complements the mall street address + LocationActions native maps deep-link (R17). NULL = no custom directions; UI falls back to address + LocationActions alone. Edited via vendor-mode EditBoothSheet (session 185+).';
