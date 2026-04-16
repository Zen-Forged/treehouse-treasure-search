## HOW TO START A NEW SESSION

1. Run `th` in Terminal — reads CLAUDE.md and copies to clipboard
2. Open claude.ai → New conversation
3. Paste the opener below, fill in CURRENT ISSUE from clipboard

```
PROJECT: Treehouse — Zen-Forged/treehouse-treasure-search — treehouse-treasure-search.vercel.app
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE:
[paste here]
```

## HOW TO END A SESSION

Tell Claude: "close out the session" then run `thc`

---

## CURRENT ISSUE
> Last updated: 2026-04-16

**Status:** Beta prep sprint. Mixed design/UX/CX/security pass. 6 items shipped.

---

## What was done (this session)
> 2026-04-16 — Beta prep: vendor request flow + UI fixes

### Security
- Verified `.env.local` is gitignored and not tracked ✅
- Confirmed no hardcoded secrets in any source files ✅
- Added `.env.example` to repo (documents all required vars, no values)
- Added `EBAY_CLIENT_ID` and `EBAY_CLIENT_SECRET` to `.env.example`

### Item 2a — Booth number left of mall address (Find detail page)
- `app/find/[id]/page.tsx` — booth pill moved to LEFT, mall address to RIGHT
- Layout now: [Booth 369] → [📍 America's Antique Mall · Directions]

### Item 2b — Remove underline from address link
- `app/find/[id]/page.tsx` — `textDecoration: "none"` on address `<a>` tag

### Item 2c — Full image in edit listing preview (no crop)
- `app/post/preview/page.tsx` — removed `maxHeight` constraint on `ItemImage`
- Image now displays at full natural height with `objectFit: "contain"`

### Item 3 — Edit icons as pill buttons on title, caption, and price
- `app/post/preview/page.tsx` — new `EditableLabel` component with pencil icon pill
- Applied to Title, Caption, AND Price (price previously had no edit affordance)
- Pills show green active state when editing, muted when not

### Item 4 — Share button on public booth pages (`/shelf/[slug]`)
- `app/shelf/[slug]/page.tsx` — share button added to `PublicVendorHero`
- Same frosted circle `Send` icon pattern as `my-shelf`
- No auth check — share is always available to any visitor
- Uses `navigator.share` with clipboard fallback + "Copied!" confirmation

### Item 1 — Vendor access request flow
- New route: `app/vendor-request/page.tsx` — form → success screen
  - Fields: Name (required), Email (required), Mall (dropdown, optional), Booth number (optional)
  - Success screen: "You're on the list." + email confirmation + two CTAs
  - Warm, non-transactional copy throughout
  - Mall pre-fill via `?mall_id=&mall_name=` query params (for mall page entry point)
- New API: `app/api/vendor-request/route.ts`
  - Writes to `vendor_requests` Supabase table (service role, bypasses RLS)
  - Rate limited: 3 req/IP per 10 minutes
  - Email notification: logs to console for now (Resend integration deferred to Sprint 4)
- Feed footer CTA: `app/page.tsx` — "Are you a vendor? Bring your booth to Treehouse." + "Request booth access →" link, shown below feed content when not loading

---

## Deferred / Next session starting point

### ⚠️ ACTION REQUIRED BEFORE DEPLOY — Supabase SQL
Run in Supabase SQL editor to create `vendor_requests` table:
```sql
CREATE TABLE vendor_requests (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name         text NOT NULL,
  email        text NOT NULL,
  booth_number text,
  mall_id      uuid REFERENCES malls(id),
  mall_name    text,
  status       text DEFAULT 'pending',
  created_at   timestamptz DEFAULT now()
);
ALTER TABLE vendor_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role only" ON vendor_requests
  USING (false) WITH CHECK (false);
```

### Priority 1 — Mall page vendor CTA (deferred — needs dark theme treatment)
- `app/mall/[slug]/page.tsx` uses dark reseller palette — CTA needs to match
- Entry point: contextual "Vendor at this mall? Join Treehouse" CTA at bottom of mall page
- Can pass `?mall_id=&mall_name=` to pre-fill the form

### Priority 2 — Error monitoring (S effort, High value, 🟢 Proceed)
- Add structured `console.error` wrapping to all API routes
- Evaluate Sentry free tier vs Vercel function logs

### Priority 3 — Vendor bio field (M effort, High value, 🟢 Proceed)
- `bio` column exists in DB + is fetched, no UI to set or display it
- Inline tap-to-edit on My Booth hero section
- Display on public `/shelf/[slug]`

### Priority 4 — Hero image upload size guard (S effort, Medium value, 🟢 Proceed)
- Add `file.size > 12_000_000` check before upload in `app/my-shelf/page.tsx`

### Priority 5 — Admin PIN production QA (S effort, Medium value, 🟢 Proceed)
- Confirm `ADMIN_PIN` and `SUPABASE_SERVICE_ROLE_KEY` set in Vercel environment
- Test full admin PIN flow on production URL

### Priority 6 — Find Map overhaul (L effort, High value, 🖐️ REVIEW before starting)
- Group saved finds by mall location, per-mall route segments
- Plan required before any code

### Sprint 4 (not started)
- Resend email integration for vendor request notifications
- Feed pagination / infinite scroll
- Search
- Terms of service / privacy policy
- Bookmarks persistence (Supabase, not just localStorage)

---

## PROJECT OVERVIEW

**Two independent layers:**
1. **Ecosystem** (front door, warm parchment theme): feed, vendor profiles, mall pages, post flow → Supabase
2. **Reseller intel** (dark forest theme, untouched): scan → identify → comps → decide → localStorage only

---

## STACK
```
Next.js 14 App Router · TypeScript · Tailwind CSS · Framer Motion
Anthropic SDK (claude-opus-4-5) · Supabase (Postgres + Storage + Auth) · SerpAPI · Vercel
lucide-react (Heart, Send, Store, Home, LayoutGrid icons in ecosystem UI)
```

---

## ENV VARS
```
NEXT_PUBLIC_SUPABASE_URL         https://zogxkarpwlaqmamfzceb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY    eyJhbGci... (full JWT — in .env.local and Vercel)
NEXT_PUBLIC_ADMIN_EMAIL          david@zenforged.com
NEXT_PUBLIC_DEV_VENDOR_EMAIL     vendor@test.com (optional — dev panel vendor test email)
ANTHROPIC_API_KEY                Claude Vision + caption generation
SERPAPI_KEY                      eBay sold comps
ADMIN_PIN                        Server-only PIN for admin login (set in .env.local + Vercel)
SUPABASE_SERVICE_ROLE_KEY        Server-only service role key (set in .env.local + Vercel)
EBAY_CLIENT_ID                   eBay direct API (not yet wired)
EBAY_CLIENT_SECRET               eBay direct API (not yet wired)
```

---

## SUPABASE
- **Tables:** malls, vendors, posts, vendor_requests — RLS ENABLED ✅
- **vendor_requests:** id, name, email, booth_number, mall_id, mall_name, status, created_at
- **Storage bucket:** post-images — PUBLIC
- **Auth:** Magic link (OTP) via email — `supabase.auth.signInWithOtp()`
- **Malls:** 29 locations seeded (KY + Clarksville IN) — slug unique constraint: `malls_slug_key`
- **Primary mall:** America's Antique Mall, id: `19a8ff7e-cb45-491f-9451-878e2dde5bf4`, slug: `americas-antique-mall`
- **Known vendors:**
  - ZenForged Finds, booth 369, id: `65a879f1-c43c-481b-974f-379792a36db8` — user_id SET ✅
  - Zen booth (admin default), id: `5619b4bf-3d05-4843-8ee1-e8b747fc2d81` — no user_id (admin loads by ID)
- **Extra columns vendors:** `facebook_url text`, `user_id uuid`, `hero_image_url text`, `bio text`
- **Extra columns malls:** `phone text`, `website text`, `google_maps_url text`, `latitude numeric(10,7)`, `longitude numeric(10,7)`, `category text`, `zip_code text`
- **Unique constraint vendors:** `vendors_mall_booth_unique` on `(mall_id, booth_number)`
- **Unique constraint malls:** `malls_slug_key` on `(slug)`

---

## WORKING ✅
- Discovery feed — masonry, scroll restore, spring-tap, warmth hover, back-nav anchor
- Feed footer — vendor CTA "Request booth access →" → `/vendor-request`
- Magic link auth + Admin PIN login
- My Booth — hero upload, vendor switcher, Send icon
- Post flow — AI caption, price validation, image upload
- Post preview — full image (no crop), edit pill buttons on title/caption/price
- Find detail — layered drift-in, booth LEFT / mall RIGHT, no address underline
- Public shelf — share button always visible (no auth required)
- Vendor request flow — `/vendor-request` form + success screen + API route
- RLS — 12 policies + vendor_requests table (service role only) ✅
- Rate limiting — `/api/post-caption` 10 req/60s, `/api/vendor-request` 3 req/10min ✅
- PWA manifest ✅
- Session Control Panel (Notion) ✅
- Shell aliases `th` / `thc` ✅
- MASTER_PROMPT.md — HITL standard + Product Agent + Blocker Protocol ✅
- Notion Roadmap — seeded, Product Agent reads at session open ✅
- `.env.example` — all required vars documented ✅

## KNOWN GAPS / SPRINT 3 ⚠️
- vendor_requests Supabase table — needs SQL migration run (see above) ⚠️
- Mall page vendor CTA — deferred (dark theme styling needed)
- No error monitoring (Sentry / structured logs) — Priority 2
- Vendor bio field — no UI to set or display — Priority 3
- Hero image upload: no client-side size guard — Priority 4
- Admin PIN not QA'd in production — Priority 5
- Find Map overhaul — needs plan before build — Priority 6
- Feed needs content seeding before beta invite (Sprint 4)
- No pagination/infinite scroll (Sprint 4)
- No search (Sprint 4)
- No terms of service / privacy policy (Sprint 4)
- Resend email for vendor request notifications (Sprint 4)

---

## DEBUGGING
```bash
curl -s https://treehouse-treasure-search.vercel.app/api/debug | python3 -m json.tool
npx vercel --prod
npm run build 2>&1 | tail -30
git add -A && git commit -m "..." && git push
mkdir -p app/api/your-route-name
```
