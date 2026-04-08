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
> Last updated: 2026-04-08

**Status:** ✅ Clean. No known active bugs.

**What was done (this session):**

### Detail page improvements (`app/find/[id]/page.tsx`)

**Persistent back navigation:**
- Removed floating back button from hero image overlay
- Added `<BackTab>` component: fixed left-edge pill (28×72px, rounded right corners), centered vertically, frosted glass bg, arrow icon — always visible while scrolling
- "Unavailable" badge moved from `left: 60` → `left: 16` now that the overlay back btn is gone

**Mark as sold at bottom (owner):**
- Added owner actions section below "Find this here" card with hairline separator above it
- `Tag` icon + "Mark as sold" / "Mark as available" ghost button — same ghost style as Delete post
- Both sold toggle + delete are now grouped together with separator, improving discoverability
- Sold toggle also remains in "Find this here" vendor card as "Mark the Spot" (unchanged)

**Delete post fix:**
- Improved owner detection: checks `data.vendor_id ?? data.vendor?.id` against profile (was only checking `data.vendor_id`, causing missing delete on some posts)
- Delete and mark-sold always shown when `isMyPost` is true, regardless of vendor card presence

**Previous sessions:**
- "Follow the Find" rename, feed followed indicators, "Unavailable" status labels
- Orphaned shelf hairline fixed, vendor name + booth inline, scroll restoration

**Next session starting point:**
No active issues. Good candidates for next work:
- Directions affordance: "→ Directions" label under mall address in "Find this here" card
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
                    Followed items show green BookmarkCheck circle on tile image
/find/[id]          Find detail — full-bleed image, persistent left BackTab, availability status,
                    follow + share buttons on image (visitors), share only (owners),
                    "View the shelf" scroll, "Find this here" card,
                    "Follow the Find" button (visitors) / "Mark the Spot" toggle (owners),
                    booth pill inline, owner section at bottom (mark sold + delete)
/mall/[slug]        Mall profile
/vendor/[slug]      Vendor profile — Facebook link, available/sold grid, "Unavailable" label
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
                          API: getItem, setItem, removeItem
types/treehouse.ts        Post, Vendor, Mall, LocalVendorProfile, PostStatus
app/layout.tsx            No max-width wrapper — each page owns its own width
```

---

## DESIGN SYSTEM

### Ecosystem pages (light cream)
```
bg: #f0ede6  surface: #e8e4db  surfaceDeep: #dedad0  border: rgba(26,26,24,0.1)
text: #1a1a18 / #4a4a42 / #8a8478 / #b0aa9e
green (CTAs): #1e4d2b   greenLight: rgba(30,77,43,0.09)   greenBorder: rgba(30,77,43,0.22)
greenSolid: rgba(30,77,43,0.92)  ← filled/active state (Follow the Find confirmed, feed indicator)
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
No price badges. Sold items: 0.62 opacity + grayscale + "Unavailable" badge.
Followed items: 22px solid green circle (BookmarkCheck icon) at bottom-right of tile image.
Scroll position saved to sessionStorage ("treehouse_feed_scroll"), restored on mount.
Followed IDs loaded once on mount via loadFollowedIds() — scans localStorage for treehouse_bookmark_* keys.
```

### Detail page layout order
```
1. Full-bleed image (no floating back button — replaced by persistent BackTab)
   - "Unavailable" badge (top-left: 16px) — only when status=sold
   - Follow icon btn + Share icon btn (bottom-right row) — visitors only
   - Share icon btn only (bottom-right) — owners only
2. Title (Georgia 26px bold)
3. Availability (pulsing dot + "Available" green, or "Unavailable" muted)
4. Caption (italic Georgia) + description
5. [hairline — only if shelf has items] + "View the shelf" horizontal scroll (full-bleed)
6. "Find this here" label + card:
     Mall name + address link
     [divider]
     Vendor name + booth pill (inline, same row, right-aligned)
     Facebook link (below vendor name, if present)
     Visitors: "Follow the Find" / "Following" toggle (local only, no DB)
     Owners: "Mark the Spot" / "Mark available" toggle (Supabase write)
7. [hairline separator] Owner actions section (owner only):
     "Mark as sold" / "Mark as available" ghost button (Tag icon)
     "Delete post" ghost button (Trash2 icon) → confirmation panel
BackTab: fixed left-edge pill, always visible, routes to router.back()
```

---

## RULES & GOTCHAS
- All ecosystem pages need `export const dynamic = "force-dynamic"` (import supabase at module scope)
- Never use `export const config = {}` — deprecated in Next.js 14 App Router
- Always use `git add -A` — never individual paths (zsh glob-expands `[slug]`)
- `str_replace` tool fails on bracket-path files (`app/find/[id]/page.tsx`, `app/vendor/[slug]/page.tsx`) — **always use `filesystem:write_file` for full rewrites on these files**
- `uploadPostImage` is non-fatal — post goes through even without image
- vendor_id only carried over in LocalVendorProfile if mall_id unchanged
- Supabase client uses placeholder URL at build time to avoid prerender crash
- `createVendor` handles 23505 duplicate key by fetching existing row — do not revert this
- Always use `safeStorage` (not raw `localStorage`) in ecosystem client components, EXCEPT:
  - Feed's `loadFollowedIds()` reads raw `localStorage` directly (needs key iteration, safeStorage doesn't expose that)
  - Feed scroll restoration uses raw `sessionStorage` (ephemeral tab state)
- `ShelfSection` accepts `onReady(hasItems: boolean)` callback — parent uses this to conditionally render the hairline separator. Do not remove this prop.
- Follow state uses `safeStorage` with key `treehouse_bookmark_${postId}`. Value "1" = following, absent = not following. Never touches Supabase.
- Tree offset: wrap only the first tile in a plain `div` with the `ref` — do NOT put the ref on `MasonryTile` itself (it renders a `motion.div` and would need forwardRef)
- `FACEBOOK_PAGE_URL` constant lives at the top of `app/post/preview/page.tsx` — update it there when the real page URL is confirmed
- Owner detection: checks `data.vendor_id ?? data.vendor?.id` against `profile.vendor_id` — do not simplify to just `data.vendor_id`
- `BackTab` is `position: fixed` — it overlays all page content. Keep page content left-padding in mind if needed

---

## WORKING ✅
- Discovery feed — tree masonry (50% dynamic offset), no prices, no filter pills, mall dropdown
- Feed scroll position saved/restored via sessionStorage on back navigation
- Skeleton loading matches live grid proportions (65px right-column offset)
- Sold items in feed: 0.62 opacity + grayscale + "Unavailable" badge
- Followed items in feed: green BookmarkCheck circle at bottom-right of tile image
- Find detail: full-bleed image, persistent BackTab (fixed left pill), availability pulse
- "View the shelf" — horizontal scroll, full-bleed, hides if empty, hairline conditional
- Vendor name + booth number inline on same row in "Find this here" card
- Hairline above shelf only shown when shelf has items (no orphaned separator)
- "Follow the Find" / "Following" — local-only toggle, persisted to safeStorage, no DB write
- Follow + share icon buttons on hero image (bottom-right) — visitors only
- Share icon on image overlay — native share sheet or clipboard copy
- Owner: "Mark the Spot" / "Mark available" toggle in vendor card (Supabase write, full-width)
- Owner bottom section: hairline separator + "Mark as sold" ghost btn + "Delete post" ghost btn
- Delete confirmation panel: red styled, two-button confirm/cancel
- Vendor actions: mark sold toggle, delete with confirmation
- Vendor profile: Facebook link, light theme, available/Unavailable grid + section labels
- Mall profile: grid, directions, available/sold split
- Post flow: capture → AI title + caption (1-2 sentences, poetic) → preview → publish
- Post confirmation: "Back to feed" primary, "Visit us on Facebook" secondary, "Post another find" + camera icon
- Image upload to Supabase Storage
- safeStorage fallback for Safari private/ITP
- All reseller intel routes (untouched, dark theme)

## KNOWN GAPS ⚠️
- Followed items have no consolidated "saved" list yet (future feature)
- Directions affordance missing from "Find this here" mall address (link works, no visual cue)
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
