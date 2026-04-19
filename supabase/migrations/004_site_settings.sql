-- supabase/migrations/004_site_settings.sql
-- v1.1l (session 24) — featured-banner data model.
--
-- Committed in docs/design-system.md §v1.1l (c). A keyed-row table holding
-- admin-editable site-level settings. Initial keys:
--   - featured_find_image_url   (Home "Featured Find" banner)
--   - find_map_banner_image_url (Find Map overlay banner)
--
-- More keys can be added without schema changes (text key → jsonb value).
--
-- Access pattern:
--   - Public read via anon client (no RLS on the table — read is safe for all)
--   - Service-role writes only (via /api/admin/featured-image after admin auth)
--
-- Storage:
--   - Bucket `site-assets` holds the uploaded images
--   - Bucket is PUBLIC (like `post-images`) so direct img tag src works
--   - Service role writes only (no public uploads)
--
-- 🖐️ HITL APPLY STEP:
--   Run this migration via the Supabase SQL editor:
--     https://supabase.com/dashboard/project/zogxkarpwlaqmamfzceb/sql/new
--   Paste the contents of this file, hit Run.
--   Then verify the bucket exists in Storage and is PUBLIC.

-- ─── Table ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.site_settings (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- RLS: intentionally OFF for this table.
--   - Anon reads: public-readable by design (the values are image URLs
--     hydrated into the UI anyway — nothing sensitive)
--   - Writes: service-role only via /api/admin/featured-image after
--     requireAdmin(), which is a server-side gate. Anon clients can't write.
ALTER TABLE public.site_settings DISABLE ROW LEVEL SECURITY;

-- ─── Storage bucket ──────────────────────────────────────────────────────────
-- Create the bucket if it doesn't exist. Public so the URL in the DB can be
-- loaded directly as an img src without signed-URL plumbing.
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- ─── Seed rows (empty values — admin fills them via upload) ──────────────────
INSERT INTO public.site_settings (key, value)
VALUES
  ('featured_find_image_url',   '{"url": null}'::jsonb),
  ('find_map_banner_image_url', '{"url": null}'::jsonb)
ON CONFLICT (key) DO NOTHING;
