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
git add CLAUDE.md CONTEXT.md && git commit -m "docs: update session context" && git push
```

---

## CURRENT ISSUE
> Last updated: 2026-04-07

**Status:** ✅ Full UI sprint complete. No known active bugs.

**What was done (this session):**

### Feed (`app/page.tsx`)
- Price badges removed from all tiles — items feel like discoveries, not listings
- Filter bar removed entirely (no "All finds / Available / Just in" pills) — unified feed
- Grid gap: `8px → 14px`. Tile border radius: `12 → 14px`
- **Tree offset masonry** — right column offset is now dynamic: `50% of first tile's rendered height` via `ResizeObserver` on the first tile ref. Stays live on screen rotation, font scale changes, image load. Skeleton uses `Math.round(SKELETON_HEIGHTS[0] * 0.5)` = 65px to avoid layout jump on load.

### Detail page (`app/find/[id]/page.tsx`)
- **Sticky nav header removed** — replaced with floating back button (top-left, over image, frosted cream bg + blur)
- **Full-bleed hero image** — no rounded container, no shadow, bleeds to page edges
- **Availability status** — price + timestamp replaced with pulsing green dot + "Available" / "Found a home"
- **"View the shelf"** (was "More on the shelf") — renamed, layout unchanged
- **"Find this here" card** — location + vendor condensed into a single surface card, below the shelf section:
  - Section label "Find this here" above the card
  - Mall row: name + address link (tighter padding)
  - Vendor row: reduced weight (fontWeight 400, textMid color)
  - **Booth number on its own line** — pill style (monospace, `surfaceDeep` bg, rounded-20), right-aligned, between vendor name and Mark the Spot button
  - **Mark the Spot moved inside the card** — at the bottom, spatially tied to location/vendor context
- **Delete button** — moved to very bottom of page, ghost style (no background, no border, tiny trash icon + 11px faint text)
- "Keep exploring →" sits above delete

### Post confirmation (`app/post/preview/page.tsx`)
- "Back to feed" is primary green CTA (top)
- "Visit us on Facebook" is secondary surface button (middle) — links to `FACEBOOK_PAGE_URL` constant, `target="_blank"`, honest label (not "View your post")
- "Post another find" is ghost with Camera icon (bottom)

### AI caption (`app/api/post-caption/route.ts`)
- Captions: 1–2 sentences max (was 2–3)
- Prompt bans: leading with "This" or item name, filler phrases, condition assessments
- `max_tokens`: 300 → 200

**Next session starting point:**
No active issues. Good candidates for next work:
- Wire up "Mark the Spot" for visitors (save to local list, future shelf/saved feature)
- Pull-to-refresh on feed
- PWA support
- Supabase RLS / auth
- `/enhance-text` real Claude integration
- Verify Facebook page URL — currently `https://www.facebook.com/KentuckyTreehouse`

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
/                   Discovery feed — tree masonry, mall dropdown, no filters, no prices
/find/[id]          Find detail — full-bleed image, floating back btn, availability status,
                    "View the shelf" scroll, "Find this here" card, Mark the Spot inside card,
                    booth pill, delete at bottom
/mall/[slug]        Mall profile
/vendor/[slug]      Vendor profile — Facebook link, available/sold grid
/post               Vendor capture — camera/gallery, profile setup, Reset button
/post/preview       Edit title/caption/price → publish → "Back to feed" primary,
                    "Visit us on Facebook" secondary, "Post another find" camera ghost
```

### Reseller intel (dark theme — do not touch)
```
/scan → /discover → /refine → /decide → /intent → /enhance-text → /share
/finds, /finds/[id]
```

### API
```
POST /api/post-caption    Claude → { title, caption } 1-2 sentences, poetic, no filler (mock fallback)
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

### Ecosystem pages (light cream)
```
bg: #f0ede6  surface: #e8e4db  surfaceDeep: #dedad0  border: rgba(26,26,24,0.1)
text: #1a1a18 / #4a4a42 / #8a8478 / #b0aa9e
green (CTAs): #1e4d2b   greenLight: rgba(30,77,43,0.09)   greenBorder: rgba(30,77,43,0.18)
header blur: rgba(240,237,230,0.94)
```

### Reseller pages (dark — do not change)
```
bg: #050f05  text: #f5f0e8  gold: #c8b47e  green: #6dbc6d
```

### Shared
```
Font: Georgia serif (headings/captions/italic labels), monospace (booth/prices), system (body)
Max-width: 430px per page
Safe area: env(safe-area-inset-bottom) on all fixed bars
Animations: opacity 0→1, y 8-16→0, ease [0.25,0.1,0.25,1]
```

### Feed grid
```
2-column masonry. Gap: 14px. Tile border-radius: 14px.
Right column offset: 50% of first tile's rendered height (ResizeObserver, live).
Skeleton uses SKELETON_OFFSET = Math.round(SKELETON_HEIGHTS[0] * 0.5) = 65px.
No price badges. Sold items: 0.62 opacity + grayscale + "Found a home" badge.
```

### Detail page layout order
```
1. Full-bleed image (floating back btn top-left, share btn bottom-right)
2. Title (Georgia 26px bold)
3. Availability (pulsing dot + "Available" green, or "Found a home" muted)
4. Caption (italic Georgia) + description
5. [hairline] + "View the shelf" horizontal scroll (full-bleed)
6. "Find this here" label + card:
     Mall name + address link
     [divider]
     Vendor name (fontWeight 400, textMid)
     Booth pill (monospace, surfaceDeep bg, border-radius 20)
     Mark the Spot button
7. "Keep exploring →"
8. Delete post (ghost, owner only, very bottom)
```

---

## RULES & GOTCHAS
- All ecosystem pages need `export const dynamic = "force-dynamic"` (import supabase at module scope)
- Never use `export const config = {}` — deprecated in Next.js 14 App Router
- Always use `git add -A` — never individual paths (zsh glob-expands `[slug]`)
- `str_replace` tool fails on `app/find/[id]/page.tsx` due to zsh bracket glob — **always use `filesystem:write_file` for full rewrites on that file**
- `uploadPostImage` is non-fatal — post goes through even without image
- vendor_id only carried over in LocalVendorProfile if mall_id unchanged
- Supabase client uses placeholder URL at build time to avoid prerender crash
- `createVendor` handles 23505 duplicate key by fetching existing row — do not revert this
- Always use `safeStorage` (not raw `localStorage`) in ecosystem client components
- `ShelfSection` uses `getVendorPosts` directly — that's a Supabase fetch, not localStorage, so safeStorage is not needed there
- Tree offset: wrap only the first tile in a plain `div` with the `ref` — do NOT put the ref on `MasonryTile` itself (it renders a `motion.div` and would need forwardRef)
- `FACEBOOK_PAGE_URL` constant lives at the top of `app/post/preview/page.tsx` — update it there when the real page URL is confirmed

---

## WORKING ✅
- Discovery feed — tree masonry (50% dynamic offset), no prices, no filter pills, mall dropdown
- Skeleton loading matches live grid proportions (65px right-column offset)
- Sold items in feed: 0.62 opacity + grayscale + "Found a home" badge
- Find detail: full-bleed image, floating back btn, availability pulse, "View the shelf", "Find this here" card, booth pill, Mark the Spot inside card, delete at bottom
- "View the shelf" — horizontal scroll, full-bleed, vendor's other items (lazy loaded), hides if empty
- Mark the Spot — wired for owners (toggle sold/available), decorative for visitors
- Share icon on image overlay — native share sheet or clipboard copy
- "Keep exploring →" soft bottom nav
- Vendor actions: mark sold toggle, delete with confirmation
- Vendor profile: Facebook link, light theme, available/sold grid
- Mall profile: grid, directions, available/sold split
- Post flow: capture → AI title + caption (1-2 sentences, poetic) → preview → publish
- Post confirmation: "Back to feed" primary, "Visit us on Facebook" secondary, "Post another find" + camera icon
- Image upload to Supabase Storage
- safeStorage fallback for Safari private/ITP
- All reseller intel routes (untouched, dark theme)

## KNOWN GAPS ⚠️
- "Mark the Spot" for visitors is unwired (future saved/shelf feature)
- `/enhance-text` is mock (not real Claude)
- No Supabase RLS / auth yet
- No pull-to-refresh on feed
- No PWA support
- `FACEBOOK_PAGE_URL` in `app/post/preview/page.tsx` needs verification — currently `https://www.facebook.com/KentuckyTreehouse`

---

## DEBUGGING
```bash
# Live Supabase test
curl -s https://treehouse-treasure-search.vercel.app/api/debug | python3 -m json.tool

# Build check before pushing
npm run build 2>&1 | tail -30

# Always stage everything
git add -A && git commit -m "..." && git push
```
