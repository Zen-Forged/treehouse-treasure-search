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

**Status:** Operations + systems session. No code changes. All work was documentation, tooling, and workflow architecture.

---

## What was done (this session)
> 2026-04-16 — Agent system + operations infrastructure

### Notion Session Control Panel
- Created 🎛️ Session Control Panel page under Agent System Operating Manual
- Structured into START / ACTIVE / END operational panels
- All steps labeled with 🖐️ HITL / 🖐️ REVIEW / 🟢 AUTO indicator standard
- Roadmap page linked from Control Panel

### Shell aliases
- `th` — reads CLAUDE.md, copies to clipboard, prints confirmation → session start
- `thc` — `git add -A && git commit -m "docs: update session context" && git push` → session close
- Written to `~/.zshrc`, verified clean (duplicate removed)

### MASTER_PROMPT.md — major update
- Added HITL Indicator Standard section (first section, applies everywhere)
- Added Product Agent section with roadmap URL, ranking logic, update protocol
- Updated SESSION OPENING STANDUP to include Product Agent standup as step 2
- Updated SESSION CLOSE PROTOCOL with 🖐️ / 🟢 labels and Notion Roadmap update step
- Updated BLOCKER PROTOCOL with 🖐️ HITL language throughout
- Sprint brief format updated to require indicator labels on every step
- All 🔴/🟡 HITL references replaced with 🖐️ HITL / 🖐️ REVIEW

### Notion Roadmap
- Created 🗺️ Treehouse Roadmap page under Agent System Operating Manual
- Seeded with all Sprint 3, Sprint 4, Icebox, and Done items from CLAUDE.md + DECISION_GATE.md
- Each item has: Status · Type · Effort · Value · Gate · Blocks
- Product Agent reads this at session open to propose next move

### Blocker Protocol — established and documented
- Standard format defined: 🚧 BLOCKED + automatable? + to unblock + human effort
- Written into MASTER_PROMPT.md and Notion Control Panel
- Filesystem MCP browser scope constraint documented and resolved

---

## Next session starting point — Sprint 3 (continued)

### Priority 1 — Error monitoring (S effort, High value, 🟢 Proceed)
- Add structured `console.error` wrapping to all API routes as minimum
- Evaluate Sentry free tier vs leaning on Vercel function logs
- Closes last 🟡 Medium production visibility risk

### Priority 2 — Vendor bio field (M effort, High value, 🟢 Proceed)
- `bio` column exists in DB + is fetched, no UI to set or display it
- Inline tap-to-edit on My Booth hero section (below vendor name)
- Display bio on public `/shelf/[slug]`

### Priority 3 — Hero image upload size guard (S effort, Medium value, 🟢 Proceed)
- Add `file.size > 12_000_000` check before upload in `app/my-shelf/page.tsx`
- Show inline error: "Image too large — please use a photo under 12MB"

### Priority 4 — Admin PIN production QA (S effort, Medium value, 🟢 Proceed)
- Confirm `ADMIN_PIN` and `SUPABASE_SERVICE_ROLE_KEY` set in Vercel environment
- Test full admin PIN flow on production URL

### Priority 5 — Find Map overhaul (L effort, High value, 🖐️ REVIEW before starting)
- Group saved finds by mall location
- Per-mall route segments with car/walk icons
- Plan required before any code — largest Sprint 3 feature

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
```

---

## SUPABASE
- **Tables:** malls, vendors, posts — RLS ENABLED ✅ (12 policies, Sprint 3)
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
- Magic link auth + Admin PIN login
- My Booth — hero upload, vendor switcher, Send icon
- Post flow — AI caption, price validation, image upload
- Find detail — layered drift-in, inline mall/booth row, spring heart
- RLS — 12 policies live across malls, vendors, posts ✅
- Rate limiting — `/api/post-caption` 10 req/60s per IP ✅
- PWA manifest ✅
- Session Control Panel (Notion) ✅
- Shell aliases `th` / `thc` ✅
- MASTER_PROMPT.md — HITL standard + Product Agent + Blocker Protocol ✅
- Notion Roadmap — seeded, Product Agent reads at session open ✅

## KNOWN GAPS / SPRINT 3 ⚠️
- No error monitoring (Sentry / structured logs) — Priority 1
- Vendor bio field — no UI to set or display — Priority 2
- Hero image upload: no client-side size guard — Priority 3
- Admin PIN not QA'd in production — Priority 4
- Find Map overhaul — needs plan before build — Priority 5
- Feed needs content seeding before beta invite (Sprint 4)
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
