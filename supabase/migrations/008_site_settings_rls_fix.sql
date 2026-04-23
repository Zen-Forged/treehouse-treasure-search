-- supabase/migrations/008_site_settings_rls_fix.sql
-- Session 48 — fix featured-banner reads silently returning null on the public site.
--
-- Symptom: Home "Featured Find" and Find Map hero banner stopped rendering;
-- /admin Banners tab preview went blank after a tab switch even though the
-- upload chain was healthy (files in site-assets bucket, rows in
-- site_settings with valid public URLs, last write timestamps current).
--
-- Diagnosis (scripts/inspect-banners.ts):
--   - Service-role view of site_settings:  2 rows, both populated.
--   - Anon view of site_settings:          empty data array.
--   - Bucket site-assets:                  public, files present.
-- → RLS got re-enabled on site_settings post-migration-004 (no later migration
--   touched the table; most likely a Supabase dashboard toggle), and there is
--   no anon SELECT policy, so anon reads return zero rows. All three public
--   consumers (Home, Find Map, /admin Banners preview) use the anon
--   supabase client via getSiteSettingUrl() and so see null.
--
-- Fix:
--   1. Re-disable RLS to match the explicit intent of 004:
--        "RLS: intentionally OFF for this table."
--   2. ALSO add an anon SELECT policy as a safety net. With RLS off, the
--      policy is a no-op; if RLS ever gets re-enabled in the dashboard
--      again, public reads still work.
--
-- Writes are not affected — /api/admin/featured-image uses the service-role
-- client which bypasses RLS regardless.
--
-- 🖐️ HITL APPLY STEP:
--   Run this migration via the Supabase SQL editor:
--     https://supabase.com/dashboard/project/zogxkarpwlaqmamfzceb/sql/new
--   Paste the contents of this file, hit Run. Then re-run
--     npx tsx scripts/inspect-banners.ts
--   to confirm anon SELECT now returns the two rows.

ALTER TABLE public.site_settings DISABLE ROW LEVEL SECURITY;

-- Safety-net policy. If RLS gets re-enabled later (dashboard toggle, future
-- migration, Supabase default change), public reads still work without
-- regressing the banner rendering.
DROP POLICY IF EXISTS "site_settings_public_read" ON public.site_settings;
CREATE POLICY "site_settings_public_read"
  ON public.site_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);
