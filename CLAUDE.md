# Treehouse — Claude Working Instructions
> Repo: Zen-Forged/treehouse-treasure-search | Live: treehouse-treasure-search.vercel.app
> Full architecture: CONTEXT.md

---

## HOW TO START A NEW SESSION

1. Start a new chat at claude.ai
2. Run in Terminal: `cat /Users/davidbutler/Projects/treehouse-treasure-search/CLAUDE.md`
3. Paste this into the new chat:

```
PROJECT: Treehouse — Zen-Forged/treehouse-treasure-search — treehouse-treasure-search.vercel.app
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md and CONTEXT.md before doing anything.

CURRENT ISSUE:
[paste the CURRENT ISSUE section below]
```

## HOW TO END A SESSION

Tell Claude: "update CLAUDE.md with current status" then run:
```bash
cd /Users/davidbutler/Projects/treehouse-treasure-search
git add CLAUDE.md && git commit -m "docs: update current issue" && git push
```

---

## CURRENT ISSUE
> Last updated: 2026-04-06

**Status:** iPhone publish flow fails with "vendor creation failed" error. Desktop Chrome works perfectly.

**Confirmed working:**
- Supabase RLS disabled on posts, vendors, malls ✅
- Desktop Chrome full publish: 201 success, confirmed via live browser fetch intercept ✅
- Direct Supabase insert from debug API: vendor ✅ post ✅
- localStorage on desktop has correct data: `mall_id: "19a8ff7e-cb45-491f-9451-878e2dde5bf4"`, `vendor_id: "65a879f1-c43c-481b-974f-379792a36db8"`

**Not yet confirmed on iPhone:**
- Does the vendor profile card show name/booth/mall on `/post`? If blank → localStorage problem
- If profile shows → does AI generate title/caption on preview? If not → image format problem (HEIC)
- If title/caption shows → publish fails → Supabase network issue specific to iPhone Safari

**Most likely cause:** Safari on iPhone is either in private browsing mode (blocks localStorage) or Safari ITP is clearing localStorage between sessions. This would make the profile appear blank, vendor_id would be null, createVendor would be called with an empty mall_id, and the insert would fail with a foreign key error.

**Next debugging step:**
1. Ask user: open `/post` on iPhone — does the vendor profile card show "ZenForged Finds · Booth 369 · America's Antique Mall"?
2. If YES → take photo, on preview page does title/caption auto-populate?
3. If YES → tap publish and read the exact error detail shown on screen
4. The error screen now shows `errorDetail` text — that message tells you exactly which step failed

**Key files for this issue:**
- `app/post/page.tsx` — profile load + mall_id validation
- `app/post/preview/page.tsx` — publish flow, shows errorDetail on screen
- `lib/posts.ts` — createVendor, createPost
- `app/api/debug/route.ts` — run `curl https://treehouse-treasure-search.vercel.app/api/debug`

---

## PROJECT OVERVIEW

**Two independent layers:**
1. **Ecosystem** (front door, light cream theme): feed, vendor profiles, mall pages, post flow → Supabase
2. **Reseller intel** (dark forest theme, untouched): scan → identify → comps → decide → localStorage only

---

## STACK
```
Next.js 14 App Router · TypeScript · Tailwind CSS · Framer Motion
Anthropic SDK (claude-opus-4-5) · Supabase (Postgres + Storage) · SerpAPI · Vercel
```

---

## ENV VARS
```
NEXT_PUBLIC_SUPABASE_URL         https://zogxkarpwlaqmamfzceb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY    eyJhbGci... (full JWT — in .env.local and Vercel)
ANTHROPIC_API_KEY                Claude Vision + caption generation
SERPAPI_KEY                      eBay sold comps
```

---

## SUPABASE
- **Tables:** malls, vendors, posts — RLS DISABLED on all three
- **Storage bucket:** post-images — PUBLIC
- **Only mall:** America's Antique Mall, id: `19a8ff7e-cb45-491f-9451-878e2dde5bf4`
- **Known vendor:** ZenForged Finds, booth 369, id: `65a879f1-c43c-481b-974f-379792a36db8`
- **Extra column:** vendors table has `facebook_url text` (added via SQL)

---

## ROUTE MAP

### Ecosystem (light cream theme)
```
/                   Discovery feed — front door
/find/[id]          Find detail — full image, vendor info, mark sold/delete (own posts)
/mall/[slug]        Mall profile
/vendor/[slug]      Vendor profile — Facebook link, available/sold grid
/post               Vendor capture — camera/gallery, profile setup, Reset button
/post/preview       Edit title/caption/price → publish
```

### Reseller intel (dark theme — do not touch)
```
/scan → /discover → /refine → /decide → /intent → /enhance-text → /share
/finds, /finds/[id]
```

### API
```
POST /api/post-caption    Claude → { title, caption } from image (mock fallback)
POST /api/identify        Claude Vision → { title, description, confidence, searchQuery }
GET  /api/sold-comps      SerpAPI eBay comps, 48h cache
GET  /api/debug           Supabase connectivity + real vendor/post insert test
```

---

## KEY FILES
```
lib/supabase.ts           Client with placeholder fallback for build time
lib/posts.ts              getFeedPosts, getPost, createPost, createVendor,
                          uploadPostImage, updatePostStatus, deletePost,
                          getAllMalls, getMallBySlug, getVendorBySlug, slugify
lib/postStore.ts          In-memory image store for /post → /post/preview flow
types/treehouse.ts        Post, Vendor, Mall, LocalVendorProfile, PostStatus
app/layout.tsx            No max-width wrapper — each page owns its own width
```

---

## DESIGN SYSTEM

### Ecosystem pages (light)
```
bg: #f0ede6  surface: #e8e4db  border: rgba(26,26,24,0.1)
text: #1a1a18 / #4a4a42 / #8a8478 / #b0aa9e
green (CTAs): #1e4d2b
```

### Reseller pages (dark — do not change)
```
bg: #050f05  text: #f5f0e8  gold: #c8b47e  green: #6dbc6d
```

### Shared
```
Font: Georgia serif (headings), monospace (prices), system (body)
Max-width: 430px per page
Safe area: env(safe-area-inset-bottom) on all fixed bars
Animations: opacity 0→1, y 8-16→0, ease [0.25,0.1,0.25,1]
```

---

## RULES & GOTCHAS
- All ecosystem pages need `export const dynamic = "force-dynamic"` (import supabase at module scope)
- Never use `export const config = {}` — deprecated in Next.js 14 App Router
- Always use `git add -A` — never individual paths (zsh glob-expands `[slug]`)
- `uploadPostImage` is non-fatal — post goes through even without image
- vendor_id only carried over in LocalVendorProfile if mall_id unchanged
- Supabase client uses placeholder URL at build time to avoid prerender crash

---

## WORKING ✅
- Discovery feed, skeleton loading, filters (All/Available/Just In)
- Find detail: full image (contain, no crop), vendor/mall card, directions CTA
- Vendor actions on own posts: mark sold/available toggle, delete with confirmation
- Facebook share button (sharer.php popup) + share sheet button
- Vendor profile: Facebook link, light theme, available/sold grid
- Mall profile: grid, directions, available/sold split
- Vendor post flow on desktop: capture → AI title+caption → preview → publish → live
- Image upload to Supabase Storage
- All reseller intel routes (untouched)

## KNOWN GAPS ⚠️
- **iPhone publish broken** — see CURRENT ISSUE
- /enhance-text is mock (not real Claude)
- No Supabase RLS / auth yet
- No pull-to-refresh on feed
- Facebook share is sharer.php popup, not native iOS sheet
- No PWA support

---

## DEBUGGING
```bash
# Live Supabase test (vendor + post insert with real IDs)
curl -s https://treehouse-treasure-search.vercel.app/api/debug | python3 -m json.tool

# Build check before pushing
npm run build 2>&1 | tail -30

# Always use -A for git add
git add -A && git commit -m "..." && git push
```
