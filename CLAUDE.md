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

**Status:** Beta prep sprint + investor documentation infrastructure.

---

## What was done (this session)
> 2026-04-16 — Beta prep: UI fixes, vendor request flow, investor update system

### Security audit
- Verified `.env.local` is gitignored and not tracked ✅
- Confirmed no hardcoded secrets in any source files ✅
- Added `.env.example` to repo — documents all required vars including EBAY_CLIENT_ID/SECRET

### Item 2a — Booth number left of mall address (Find detail page)
- `app/find/[id]/page.tsx` — booth pill moved to LEFT, mall address RIGHT
- Layout now: [Booth 369] → [📍 America's Antique Mall · Directions]

### Item 2b — Remove underline from address link
- `app/find/[id]/page.tsx` — `textDecoration: "none"` on address link

### Item 2c — Full image in edit listing preview (no crop)
- `app/post/preview/page.tsx` — removed `maxHeight` constraint on `ItemImage`

### Item 3 — Edit icons as pill buttons on title, caption, and price
- `app/post/preview/page.tsx` — new `EditableLabel` component
- Applied to Title, Caption, AND Price — consistent tap-to-edit with green active state

### Item 4 — Share button on public booth pages (`/shelf/[slug]`)
- `app/shelf/[slug]/page.tsx` — share button in `PublicVendorHero`, always visible, no auth required

### Item 1 — Vendor access request flow
- `app/vendor-request/page.tsx` — form + success screen
- `app/api/vendor-request/route.ts` — DB write (service role), rate limit 3/10min, console log notification
- `app/page.tsx` — feed footer CTA "Are you a vendor? Request booth access →"
- Mall page CTA deferred — dark theme styling needed

### Investor documentation infrastructure
- Google Drive folder created: **Treehouse Finds — Investor Updates**
  - Folder ID: `1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW`
  - Drive link: https://drive.google.com/drive/folders/1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW
- First investor update PDF uploaded: **Treehouse Finds — Investor Update — April 16 2026**
- Notion process doc created under Agent System Operating Manual: 📋 Investor Update — Process & Cadence
  - Cadence: end of each sprint (weekly once beta launches)
  - Trigger: David says "generate investor update" at session close
  - No additional access setup needed — Drive MCP already connected

---

## ⚠️ ACTION REQUIRED BEFORE DEPLOY — Supabase SQL
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

---

## Next session starting point — Sprint 3 (continued)

### Priority 1 — Mall page vendor CTA (S effort, deferred)
- `app/mall/[slug]/page.tsx` uses dark reseller palette — CTA needs dark theme styling
- Pass `?mall_id=&mall_name=` to pre-fill the vendor request form

### Priority 2 — Error monitoring (S effort, High value, 🟢 Proceed)
- Add structured `console.error` wrapping to all API routes
- Evaluate Sentry free tier vs Vercel function logs

### Priority 3 — Vendor bio field (M effort, High value, 🟢 Proceed)
- `bio` column exists in DB + is fetched, no UI to set or display
- Inline tap-to-edit on My Booth hero; display on public `/shelf/[slug]`

### Priority 4 — Hero image upload size guard (S effort, Medium value, 🟢 Proceed)
- Add `file.size > 12_000_000` check in `app/my-shelf/page.tsx`

### Priority 5 — Admin PIN production QA (S effort, Medium value, 🟢 Proceed)
- Confirm `ADMIN_PIN` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel env
- Test full admin PIN flow on production URL

### Priority 6 — Find Map overhaul (L effort, High value, 🖐️ REVIEW before starting)
- Group saved finds by mall, per-mall route segments
- Plan required before any code

### Sprint 4 (not started)
- Resend email for vendor request notifications
- Feed pagination / infinite scroll
- Search
- Terms of service / privacy policy
- Bookmarks persistence (Supabase)

---

## INVESTOR UPDATE SYSTEM
- **Google Drive folder:** https://drive.google.com/drive/folders/1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW
- **Folder ID:** `1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW`
- **Cadence:** End of each sprint (weekly once beta launches)
- **Trigger:** Say "generate investor update" at session close
- **Process doc:** Notion → Agent System Operating Manual → 📋 Investor Update — Process & Cadence

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
NEXT_PUBLIC_DEV_VENDOR_EMAIL     vendor@test.com (optional)
ANTHROPIC_API_KEY                Claude Vision + caption generation
SERPAPI_KEY                      eBay sold comps
ADMIN_PIN                        Server-only PIN for admin login
SUPABASE_SERVICE_ROLE_KEY        Server-only service role key
EBAY_CLIENT_ID                   eBay direct API (not yet wired)
EBAY_CLIENT_SECRET               eBay direct API (not yet wired)
```

---

## SUPABASE
- **Tables:** malls, vendors, posts, vendor_requests — RLS ENABLED ✅
- **vendor_requests:** id, name, email, booth_number, mall_id, mall_name, status, created_at (⚠️ run SQL above if not yet created)
- **Storage bucket:** post-images — PUBLIC
- **Auth:** Magic link (OTP) via email — `supabase.auth.signInWithOtp()`
- **Malls:** 29 locations seeded (KY + Clarksville IN)
- **Primary mall:** America's Antique Mall, id: `19a8ff7e-cb45-491f-9451-878e2dde5bf4`, slug: `americas-antique-mall`
- **Known vendors:**
  - ZenForged Finds, booth 369, id: `65a879f1-c43c-481b-974f-379792a36db8` — user_id SET ✅
  - Zen booth (admin default), id: `5619b4bf-3d05-4843-8ee1-e8b747fc2d81`
- **Extra columns vendors:** `facebook_url text`, `user_id uuid`, `hero_image_url text`, `bio text`
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
- RLS — 12 policies + vendor_requests (service role only) ✅
- Rate limiting — `/api/post-caption` 10 req/60s, `/api/vendor-request` 3 req/10min ✅
- PWA manifest ✅
- `.env.example` — all required vars documented ✅
- Session Control Panel (Notion) ✅
- Shell aliases `th` / `thc` ✅
- MASTER_PROMPT.md — HITL standard + Product Agent + Blocker Protocol ✅
- Notion Roadmap — seeded ✅
- Investor update system — Drive folder + first PDF + Notion process doc ✅

## KNOWN GAPS / SPRINT 3 ⚠️
- vendor_requests table — needs SQL migration run (see above) ⚠️
- Mall page vendor CTA — deferred (dark theme)
- No error monitoring — Priority 2
- Vendor bio field — no UI — Priority 3
- Hero image upload: no size guard — Priority 4
- Admin PIN not QA'd in production — Priority 5
- Find Map overhaul — needs plan — Priority 6
- Feed content seeding before beta invite (Sprint 4)
- No pagination/infinite scroll (Sprint 4)
- No search (Sprint 4)
- No terms of service / privacy policy (Sprint 4)

---

## DEBUGGING
```bash
curl -s https://treehouse-treasure-search.vercel.app/api/debug | python3 -m json.tool
npx vercel --prod
npm run build 2>&1 | tail -30
git add -A && git commit -m "..." && git push
mkdir -p app/api/your-route-name
```
