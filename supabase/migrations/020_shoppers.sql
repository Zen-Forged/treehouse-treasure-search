-- 020_shoppers.sql
-- R1 (session 111+) — Shopper accounts data layer.
--
-- Lands the schema for `shoppers` + `shopper_saves` + `shopper_booth_bookmarks`
-- per the frozen design record at docs/r1-shopper-accounts-design.md
-- (decisions D1–D17, in particular D8 handle constraints + D13 silent claim
-- migration mechanic + D14 hybrid read pattern). No application code change
-- yet — this migration is the smallest+most-isolated arc of the R1 sprint
-- per the smallest→largest commit sequencing rule.
--
-- Design intent recap:
-- - Shoppers are auth.users with a `shoppers` extension row carrying handle +
--   created_at. One auth.users row : one shoppers row (UNIQUE user_id). A
--   single auth.users.id may also have a `vendors` row — shopper + vendor
--   roles compose, they don't conflict.
-- - shopper_saves + shopper_booth_bookmarks are pure join tables with
--   composite primary keys. No surrogate id; the (shopper_id, post_id) pair
--   IS the identity. Idempotent INSERT via ON CONFLICT DO NOTHING in
--   /api/shopper-claim (D13).
-- - RLS: each shopper can read/write only their own rows. Service role
--   (used by /api/shopper-claim for the silent first-claim bulk migration)
--   bypasses RLS regardless. INSERT/DELETE gated through a subquery on
--   shoppers — the join-table rows authorize off the parent shopper row.
--
-- Why a separate shoppers table (vs. stuffing handle into auth.users.user_metadata):
-- (a) UNIQUE constraint on handle cannot be enforced on a JSON field;
-- (b) RLS policies that join through user_metadata are awkward and slow;
-- (c) keeps app concerns out of the auth schema (Supabase recommended split).
--
-- Why CASCADE on FKs: when a shopper deletes their auth.users row (via
-- future R1.5 account-deletion UI or admin action), all saves + bookmarks
-- should follow without a separate cleanup pass.
--
-- 🖐️ HITL APPLY (run for BOTH projects in sequence):
--   Staging: ⟨staging Supabase SQL editor — see .env.staging.local for project ref⟩
--   Prod:    https://supabase.com/dashboard/project/zogxkarpwlaqmamfzceb/sql/new
--
-- VERIFICATION:
--   npx tsx scripts/security-audit/inspect-rls.ts staging   # before + after
--   npx tsx scripts/security-audit/inspect-rls.ts prod      # before + after
-- Expected after: shoppers / shopper_saves / shopper_booth_bookmarks all show
-- relrowsecurity = t with the policies listed below.
--
-- Idempotent: every statement uses IF NOT EXISTS / DROP+CREATE so this file
-- is safe to re-run after a partial failure.

-- ─── shoppers table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shoppers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  handle      text NOT NULL UNIQUE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT shoppers_handle_format
    CHECK (handle ~ '^[a-z0-9-]{3,32}$')
);

COMMENT ON TABLE public.shoppers IS
  'R1 shopper identity. One row per auth.users.id when that user has claimed a shopper account. Handle is user-chosen at /login/email/handle (auto-suggested from email local-part). Created_at backs the "scouting since [month]" eyebrow on /me. See docs/r1-shopper-accounts-design.md.';

COMMENT ON COLUMN public.shoppers.handle IS
  'Lowercase alphanumeric + hyphen, 3-32 chars. Per-shopper unique. CHECK constraint enforces format; UNIQUE enforces collisions. Auto-suggested at claim, user-editable, no public surface at MVP (D2 quiet identity).';

-- ─── shopper_saves join table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shopper_saves (
  shopper_id  uuid NOT NULL REFERENCES public.shoppers(id) ON DELETE CASCADE,
  post_id     uuid NOT NULL REFERENCES public.posts(id)    ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (shopper_id, post_id)
);

COMMENT ON TABLE public.shopper_saves IS
  'R1 saved-find join table. Composite PK (shopper_id, post_id) makes ON CONFLICT DO NOTHING idempotent for the silent claim migration (D13). One row per (shopper, post) save. Reads via useShopperSaves() hook (lib/, R1 Arc 4) joined to posts.';

CREATE INDEX IF NOT EXISTS idx_shopper_saves_shopper_id
  ON public.shopper_saves (shopper_id);

-- ─── shopper_booth_bookmarks join table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shopper_booth_bookmarks (
  shopper_id  uuid NOT NULL REFERENCES public.shoppers(id) ON DELETE CASCADE,
  vendor_id   uuid NOT NULL REFERENCES public.vendors(id)  ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (shopper_id, vendor_id)
);

COMMENT ON TABLE public.shopper_booth_bookmarks IS
  'R1 bookmarked-booth join table. Mirrors shopper_saves shape. Tracks "bookmark this booth so I see updates" intent. Composite PK supports idempotent ON CONFLICT DO NOTHING.';

CREATE INDEX IF NOT EXISTS idx_shopper_booth_bookmarks_shopper_id
  ON public.shopper_booth_bookmarks (shopper_id);

-- ─── RLS — shoppers ────────────────────────────────────────────────────────
-- SELECT: shopper reads their own row (drives /me hydration via authed
-- supabase-js client). No anon read — handles are private at MVP per D2.
-- INSERT/UPDATE/DELETE: no policies → default-deny for anon + authenticated.
-- Service role (used by /api/shopper-claim) bypasses RLS, which is the only
-- write path at MVP. Future R1.5 handle-edit will add an UPDATE policy
-- gated on auth.uid() = user_id.

ALTER TABLE public.shoppers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shoppers_self_read" ON public.shoppers;
CREATE POLICY "shoppers_self_read"
  ON public.shoppers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ─── RLS — shopper_saves ───────────────────────────────────────────────────
-- All three of SELECT/INSERT/DELETE are authorized off the shoppers row
-- belonging to auth.uid(). The subquery is cheap given UNIQUE shoppers.user_id
-- + the planner's awareness of the FK from shopper_saves.shopper_id.
-- UPDATE intentionally has no policy — saves don't have mutable fields.

ALTER TABLE public.shopper_saves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shopper_saves_self_read"   ON public.shopper_saves;
DROP POLICY IF EXISTS "shopper_saves_self_insert" ON public.shopper_saves;
DROP POLICY IF EXISTS "shopper_saves_self_delete" ON public.shopper_saves;

CREATE POLICY "shopper_saves_self_read"
  ON public.shopper_saves
  FOR SELECT
  TO authenticated
  USING (
    shopper_id IN (SELECT id FROM public.shoppers WHERE user_id = auth.uid())
  );

CREATE POLICY "shopper_saves_self_insert"
  ON public.shopper_saves
  FOR INSERT
  TO authenticated
  WITH CHECK (
    shopper_id IN (SELECT id FROM public.shoppers WHERE user_id = auth.uid())
  );

CREATE POLICY "shopper_saves_self_delete"
  ON public.shopper_saves
  FOR DELETE
  TO authenticated
  USING (
    shopper_id IN (SELECT id FROM public.shoppers WHERE user_id = auth.uid())
  );

-- ─── RLS — shopper_booth_bookmarks ─────────────────────────────────────────
-- Identical shape to shopper_saves.

ALTER TABLE public.shopper_booth_bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shopper_booth_bookmarks_self_read"   ON public.shopper_booth_bookmarks;
DROP POLICY IF EXISTS "shopper_booth_bookmarks_self_insert" ON public.shopper_booth_bookmarks;
DROP POLICY IF EXISTS "shopper_booth_bookmarks_self_delete" ON public.shopper_booth_bookmarks;

CREATE POLICY "shopper_booth_bookmarks_self_read"
  ON public.shopper_booth_bookmarks
  FOR SELECT
  TO authenticated
  USING (
    shopper_id IN (SELECT id FROM public.shoppers WHERE user_id = auth.uid())
  );

CREATE POLICY "shopper_booth_bookmarks_self_insert"
  ON public.shopper_booth_bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    shopper_id IN (SELECT id FROM public.shoppers WHERE user_id = auth.uid())
  );

CREATE POLICY "shopper_booth_bookmarks_self_delete"
  ON public.shopper_booth_bookmarks
  FOR DELETE
  TO authenticated
  USING (
    shopper_id IN (SELECT id FROM public.shoppers WHERE user_id = auth.uid())
  );

-- ─── Verification queries (read-only — paste these after running the
-- statements above to sanity-check before closing the SQL editor) ──────────
--
-- SELECT relname, relrowsecurity
-- FROM pg_class
-- WHERE relnamespace = 'public'::regnamespace
--   AND relname IN ('shoppers', 'shopper_saves', 'shopper_booth_bookmarks');
-- -- Expect:  shoppers                 | t
-- --          shopper_saves            | t
-- --          shopper_booth_bookmarks  | t
--
-- SELECT schemaname, tablename, policyname, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('shoppers', 'shopper_saves', 'shopper_booth_bookmarks')
-- ORDER BY tablename, policyname;
-- -- Expect 7 rows total:
-- --   shoppers                 | shoppers_self_read                  | SELECT
-- --   shopper_booth_bookmarks  | shopper_booth_bookmarks_self_delete | DELETE
-- --   shopper_booth_bookmarks  | shopper_booth_bookmarks_self_insert | INSERT
-- --   shopper_booth_bookmarks  | shopper_booth_bookmarks_self_read   | SELECT
-- --   shopper_saves            | shopper_saves_self_delete           | DELETE
-- --   shopper_saves            | shopper_saves_self_insert           | INSERT
-- --   shopper_saves            | shopper_saves_self_read             | SELECT
