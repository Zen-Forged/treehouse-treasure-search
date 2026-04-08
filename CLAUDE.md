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
> Last updated: 2026-04-07

**Status:** ✅ "More on the shelf" feature complete. No known active bugs.

**What was done (this session):**

1. `app/find/[id]/page.tsx` — "More on the shelf" horizontal scroll section:
   - Added `ShelfCard` component — 42vw wide (max 170px), 3:4 aspect ratio image, `loading="lazy"`, sold treatment (grayscale + "Found a home" badge), text fallback tile for no-image posts, faint title label below card.
   - Added `ShelfSection` component — fetches via `getVendorPosts(vendorId, 12)`, excludes current post client-side, hides entirely if 0 results (no empty state rendered).
   - Section placed: below the vendor/booth row divider, above "Keep exploring →". Rendered outside the padded `<div>` wrapper so the scroll strip is full-bleed to page edges.
   - Header row: "MORE ON THE SHELF" label (left, uppercase tracking) + item count (right, italic Georgia).
   - Horizontal scroll: `scrollSnapType: x mandatory`, `WebkitOverflowScrolling: touch`, scrollbar hidden via `hide-scrollbar` class + inline `scrollbarWidth: none`. Trailing spacer div creates peek effect on right edge.
   - No price shown on shelf cards. Sold items still appear with grayscale treatment.
   - Uses existing `getVendorPosts` from `lib/posts.ts` — no new queries added.

**Next session starting point:**
No active issues. Good candidates for next work:
- Wire up "Mark the Spot" for visitors (save to local list, future "shelf" feature)
- Pull-to-refresh on feed
- PWA support
- Supabase RLS / auth
- `/enhance-text` real Claude integration
- Confirm Facebook page URL (`https://www.facebook.com/KentuckyTreehouse`) is correct

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
- **Unique constraint:** `vendors_mall_booth_unique` on `(mall_id, booth_number)`

---

## ROUTE MAP

### Ecosystem (light cream theme)
```
/                   Discovery feed — masonry grid, mall dropdown filter, no status filters
/find/[id]          Find detail — journal layout, image, caption, location, vendor/booth, "More on the shelf"
/mall/[slug]        Mall profile
/vendor/[slug]      Vendor profile — Facebook link, available/sold grid
/post               Vendor capture — camera/gallery, profile setup, Reset button
/post/preview       Edit title/caption/price → publish → "Back to feed" primary, "Visit us on Facebook" secondary
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
lib/posts.ts              getFeedPosts, getPost, getVendorPosts, createPost, createVendor,
                          uploadPostImage, updatePostStatus, deletePost,
                          getAllMalls, getMallBySlug, getVendorBySlug, slugify
                          createVendor + createPost return { data, error }
lib/postStore.ts          In-memory image store for /post → /post/preview flow
lib/safeStorage.ts        localStorage wrapper with sessionStorage + memory fallback
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
Font: Georgia serif (headings/captions), monospace (prices/booth), system (body)
Max-width: 430px per page
Safe area: env(safe-area-inset-bottom) on all fixed bars
Animations: opacity 0→1, y 8-16→0, ease [0.25,0.1,0.25,1]
```

---

## RULES & GOTCHAS
- All ecosystem pages need `export const dynamic = "force-dynamic"` (import supabase at module scope)
- Never use `export const config = {}` — deprecated in Next.js 14 App Router
- Always use `git add -A` — never individual paths (zsh glob-expands `[slug]`)
- `str_replace` tool fails on `app/find/[id]/page.tsx` due to zsh bracket glob — always use `filesystem:write_file` for full rewrites on that file
- `uploadPostImage` is non-fatal — post goes through even without image
- vendor_id only carried over in LocalVendorProfile if mall_id unchanged
- Supabase client uses placeholder URL at build time to avoid prerender crash
- `createVendor` handles 23505 duplicate key by fetching existing row — do not revert this
- Always use `safeStorage` (not raw `localStorage`) in ecosystem client components
- ShelfSection uses raw `getVendorPosts` (no safeStorage needed — it's a Supabase fetch, not localStorage)

---

## WORKING ✅
- Discovery feed — gallery masonry, no price badges, no filter pills, unified feed
- Mall dropdown in feed header — filters feed client-side by mall_id
- Clean image tiles — sold items grayed + "Found a home" badge; no price on any tile
- Skeleton loading matches masonry layout
- Find detail: journal layout — image, title, metadata, caption, Mark the Spot, location, vendor/booth
- "More on the shelf" — horizontal scroll, full-bleed, vendor's other items, hides if empty
- Address-as-map-link in location section (Apple Maps deep link)
- Mark the Spot pill below caption — wired for owners, decorative for visitors
- Share icon overlaid on image (bottom-right, dark circle)
- "Keep exploring →" soft bottom nav
- Vendor actions on own posts: mark sold toggle, delete with confirmation
- Vendor profile: Facebook link, light theme, available/sold grid
- Mall profile: grid, directions, available/sold split
- Vendor post flow on desktop AND iPhone: capture → AI title+caption → preview → publish → confirmation
- Post confirmation: "Back to feed" (primary green), "Visit us on Facebook" (secondary), "Post another find" (camera icon, ghost)
- Image upload to Supabase Storage
- safeStorage fallback for Safari private/ITP
- All reseller intel routes (untouched)

## KNOWN GAPS ⚠️
- "Mark the Spot" for visitors is unwired (future shelf/saved feature)
- /enhance-text is mock (not real Claude)
- No Supabase RLS / auth yet
- No pull-to-refresh on feed
- No PWA support
- Facebook page URL (`FACEBOOK_PAGE_URL` in preview/page.tsx) should be verified — currently `https://www.facebook.com/KentuckyTreehouse`

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
