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

**Status:** ✅ Bottom nav + flagged screen + booth tag price all implemented. MCP timed out on final write — verify `app/find/[id]/page.tsx` has `BoothTag` component and updated hero section.

**What was done (this session):**

### Bottom navigation bar (`components/BottomNav.tsx`)
- Fixed bottom bar with two tabs: Home and Flagged
- Active state: soft green pill behind icon, bold label
- Optional count badge on Flagged tab (green dot, capped at 9+)
- Safe area inset handled via `env(safe-area-inset-bottom)`
- Centered/capped at 430px to match page max-width
- `active` prop accepts `"home" | "flagged" | null` — null = sub-page (no tab highlighted)

### Flagged screen (`app/flagged/page.tsx`)
- Reads all `treehouse_bookmark_*` keys from localStorage in one pass
- Fetches matching posts via `getPostsByIds()` — single Supabase `.in("id", ids)` query
- Row layout: 62×62 thumbnail · title (2-line clamp, Georgia) · booth number pill · "Unavailable" badge if sold
- Skeleton loading (3 rows) while fetching
- Empty state: Flag icon + "No flagged finds yet" + supporting copy
- Header shows find count when items are present
- Tapping a row routes to `/find/[id]`
- `BottomNav active="flagged"` with live count from loaded posts

### `lib/posts.ts` — `getPostsByIds(ids: string[])`
- New batch fetch: `.select(* + vendor + mall).in("id", ids).order("created_at")`
- Returns `Post[]`, empty array on error or empty input
- Used exclusively by the Flagged screen

### Navigation redesign
- Removed back button from all pages — Home tab in bottom nav serves as feed navigation
- Back button (`ArrowLeft`) removed from `app/find/[id]/page.tsx` entirely
- `app/page.tsx`: `BottomNav active="home"` added, bottom padding updated to `max(100px, calc(env(safe-area-inset-bottom) + 90px))`
- `app/find/[id]/page.tsx`: `BottomNav active={null}` added, same bottom padding formula

### Price — booth tag design (`app/find/[id]/page.tsx`)
- Replaced flat green price line with `<BoothTag>` component
- Tag hangs from bottom-left of hero photo via a 1.5px string + hole-punch detail
- Tag body: `#faf7f0` background, `#c8c2b4` border, `border-radius: 6px 6px 6px 2px`
- Label: "In-Booth" (8px, uppercase, muted) above price (20px, bold, `#1a1a18`)
- Hero `<div>` gets `marginBottom: hasPrice ? 36 : 0` to make room for the hanging tag
- Only renders when `post.price_asking != null`
- New C tokens: `tag`, `tagBorder`, `tagString`

### Flag + share icon repositioning (`app/find/[id]/page.tsx`)
- Moved from top-right of photo to **bottom-right** (`bottom: 12, right: 14`)
- Same frosted pill buttons (`rgba(0,0,0,0.32)` backdrop), same 8px gap
- Flag active state: `greenSolid` background + filled icon

**⚠️ MCP timeout note:**
The final `filesystem:write_file` for `app/find/[id]/page.tsx` timed out. Verify the file on disk contains:
- `BoothTag` component (above `ShelfCard`)
- `tag`, `tagBorder`, `tagString` in the `C` token object
- Hero `<div>` with `marginBottom: hasPrice ? 36 : 0`
- `{hasPrice && <BoothTag price={post.price_asking!} />}` inside the hero div
- Flag/share at `bottom: 12, right: 14` (not top)
- No old flat price `motion.div` in the content section

If the file is stale, apply the diffs from the previous Claude response or re-request the full file write.

**Previous sessions:**
- Admin page + bulk delete (pending Vercel deploy)
- Back button removal, flagging system, "Follow the Find" → "Flag Booth" rename
- Feed masonry, scroll restoration, sold state, vendor profile

**Next session starting point:**
1. Verify `app/find/[id]/page.tsx` has the BoothTag component (MCP timed out)
2. Run `npx vercel --prod` if needed to deploy
3. QA: flag items on feed → badge shows on Flagged tab → Flagged screen lists them → tap routes to detail
4. QA: price shows as booth tag on detail page, absent when `price_asking` is null
5. Add price field to `/post` and `/post/preview` so vendors can actually set it

Good candidates after that:
- Price field in post creation flow (`/post` + `/post/preview`)
- Directions affordance under mall address in "Find this here" card
- Pull-to-refresh on feed
- PWA support
- Supabase RLS / auth

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
/                   Discovery feed — masonry, mall dropdown, flagged indicators on tiles
/find/[id]          Find detail — full-bleed image, booth tag price (bottom-left of photo),
                    flag + share icons bottom-right of photo, BottomNav (no active tab),
                    "View the shelf" scroll, "Find this here" card,
                    "Flag Booth" button (visitors + owners), owner actions (mark sold + delete)
/flagged            Flagged finds — list of bookmarked posts (image + title + booth#)
/mall/[slug]        Mall profile
/vendor/[slug]      Vendor profile — Facebook link, available/sold grid
/post               Vendor capture — camera/gallery, profile setup
/post/preview       Edit title/caption/price → publish
/admin              Admin: local profile inspector + bulk post/image delete
```

### Reseller intel (dark theme — do not touch)
```
/scan → /discover → /refine → /decide → /intent → /enhance-text → /share
/finds, /finds/[id]
```

### API
```
POST /api/post-caption      Claude → { title, caption } 1-2 sentences, poetic, no filler
POST /api/identify          Claude Vision → { title, description, confidence, searchQuery }
GET  /api/sold-comps        SerpAPI eBay comps, 48h cache
GET  /api/debug             Supabase connectivity + real vendor/post insert test
GET  /api/admin/posts       All posts with vendor info (admin)
DELETE /api/admin/posts     Bulk delete posts + storage images ({ ids } or { deleteAll })
```

---

## KEY FILES
```
lib/supabase.ts           Client with placeholder fallback for build time
lib/posts.ts              getFeedPosts, getPost, getPostsByIds, getVendorPosts,
                          createPost, createVendor, uploadPostImage,
                          updatePostStatus, deletePost,
                          getAllMalls, getMallBySlug, getVendorBySlug, slugify
lib/postStore.ts          In-memory image store for /post → /post/preview flow
lib/safeStorage.ts        localStorage wrapper with sessionStorage + memory fallback
types/treehouse.ts        Post, Vendor, Mall, LocalVendorProfile, PostStatus
components/BottomNav.tsx  Fixed bottom nav — Home + Flagged tabs, active state, badge
app/layout.tsx            No max-width wrapper — each page owns its own width
app/page.tsx              Discovery feed — BottomNav active="home"
app/flagged/page.tsx      Flagged screen — BottomNav active="flagged"
app/find/[id]/page.tsx    Find detail — BoothTag, flag/share bottom-right, BottomNav null
app/admin/page.tsx        Admin UI — profile inspector + bulk delete
app/api/admin/posts/route.ts  Admin API — GET all posts, DELETE by id or all
```

---

## DESIGN SYSTEM

### Ecosystem pages (light cream)
```
bg: #f0ede6  surface: #e8e4db  surfaceDeep: #dedad0  border: rgba(26,26,24,0.1)
text: #1a1a18 / #4a4a42 / #8a8478 / #b0aa9e
green (CTAs): #1e4d2b   greenLight: rgba(30,77,43,0.09)   greenBorder: rgba(30,77,43,0.22)
greenSolid: rgba(30,77,43,0.92)  ← filled/active state
header blur: rgba(240,237,230,0.94)
tag: #faf7f0   tagBorder: #c8c2b4   tagString: #b0aa9e   ← booth tag tokens
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
Bottom padding formula: max(100px, calc(env(safe-area-inset-bottom, 0px) + 90px))
Animations: opacity 0→1, y 8-16→0, ease [0.25,0.1,0.25,1]
```

### Feed grid
```
2-column masonry. Gap: 14px. Tile border-radius: 14px.
Right column offset: 50% of first tile's rendered height (ResizeObserver, live).
Skeleton uses SKELETON_OFFSET = Math.round(SKELETON_HEIGHTS[0] * 0.5) = 65px.
No price badges on tiles. Sold items: 0.62 opacity + grayscale + "Unavailable" badge.
Flagged items: 22px solid green circle (Flag icon, filled) at bottom-right of tile image.
Scroll position saved to sessionStorage ("treehouse_feed_scroll"), restored on mount.
Flagged IDs loaded once on mount via loadFollowedIds() — scans localStorage for treehouse_bookmark_* keys.
```

### Bottom navigation
```
Component: components/BottomNav.tsx
Props: active ("home" | "flagged" | null), flaggedCount (number, optional)
Tabs: Home (/) · Flagged (/flagged)
Active state: green pill (rgba(30,77,43,0.10)) behind icon + bold label
Badge: green dot on Flagged tab, shown only when flaggedCount > 0, capped at 9+
Pages that show it: /, /flagged, /find/[id]
Active tab: "home" on feed · "flagged" on flagged screen · null on detail (sub-page)
```

### Flagging system
```
Storage key: treehouse_bookmark_{postId} = "1"
Storage layer: safeStorage (localStorage → sessionStorage → memory)
Raw localStorage iteration used in: feed loadFollowedIds(), flagged loadFlaggedIds()
BottomNav badge on feed: followedIds.size (loaded on mount)
BottomNav badge on flagged screen: posts.length (after Supabase fetch)
Unflagging: safeStorage.removeItem(key) — removes from all layers
```

### Detail page layout order
```
1. Full-bleed image (overflow: visible on wrapper when hasPrice)
   - "Unavailable" badge top-left (left: 14px) — only when status=sold
   - Flag + Share buttons bottom-right (bottom: 12, right: 14) — frosted pills
   - BoothTag bottom-left — hangs on string from photo edge (only when price_asking != null)
   - Hero wrapper: marginBottom: hasPrice ? 36 : 0
2. Title (Georgia 26px bold)
3. Availability (pulsing dot + "Available" green, or "Unavailable" muted)
4. Caption (italic Georgia) + description
5. [hairline — only if shelf has items] + "View the shelf" horizontal scroll
6. "Find this here" label + card:
     Mall name + address link
     [divider]
     Vendor name + booth pill (inline, same row, right-aligned)
     Facebook link (below vendor name, if present)
     "Flag Booth" / "Booth Flagged" toggle (everyone, local only)
7. [hairline separator] Owner actions (owner only):
     "Mark as sold" / "Mark as available" ghost button (Tag icon)
     "Delete post" ghost button (Trash2 icon) → confirmation panel
8. BottomNav (active={null})
```

### BoothTag component
```
Location: top of app/find/[id]/page.tsx (above ShelfCard)
Props: price (number)
Structure:
  - 1.5px × 20px vertical string (tagString color), marginLeft: 17px
  - Tag body: tagBorder border, borderRadius "6px 6px 6px 2px"
  - Hole punch: 8px circle, absolute top: -1.5px left: 13px, bg color fills
  - "In-Booth" label: 8px uppercase, 1.8px letter-spacing, textMuted
  - Price: 20px bold, textPrimary, price.toLocaleString()
Placement: position absolute, bottom: -28, left: 20 inside hero div
```

---

## RULES & GOTCHAS
- All ecosystem pages need `export const dynamic = "force-dynamic"` (import supabase at module scope)
- Never use `export const config = {}` — deprecated in Next.js 14 App Router
- Always use `git add -A` — never individual paths (zsh glob-expands `[slug]`)
- `filesystem:write_file` is the ONLY reliable way to write files to disk — bash heredoc writes only to the sandbox container, NOT the real filesystem
- `str_replace` tool fails on bracket-path files (`app/find/[id]/page.tsx`, `app/vendor/[slug]/page.tsx`) — always use `filesystem:write_file` for full rewrites
- New directories must be created with `filesystem:create_directory` before `filesystem:write_file` — it cannot create missing parents
- `uploadPostImage` is non-fatal — post goes through even without image
- vendor_id only carried over in LocalVendorProfile if mall_id unchanged
- Supabase client uses placeholder URL at build time to avoid prerender crash
- `createVendor` handles 23505 duplicate key by fetching existing row — do not revert this
- Always use `safeStorage` (not raw `localStorage`) in ecosystem client components, EXCEPT:
  - Feed's `loadFollowedIds()` reads raw `localStorage` directly (needs key iteration)
  - Flagged screen's `loadFlaggedIds()` reads raw `localStorage` directly (same reason)
  - Feed scroll restoration uses raw `sessionStorage` (ephemeral tab state)
- `ShelfSection` accepts `onReady(hasItems: boolean)` callback — parent uses this to conditionally render the hairline separator
- Flagging uses `safeStorage` with key `treehouse_bookmark_${postId}`. Value "1" = flagged
- Owner detection checks `data.vendor_id ?? data.vendor?.id` against `profile.vendor_id` — do not simplify
- Vercel project is under `david-6613s-projects` scope, NOT `zen-forged` — use correct dashboard URL
- Vercel GitHub webhook has been unreliable — if push doesn't deploy, use `npx vercel --prod`
- Always provide a git commit/push bash command after every code change
- MCP filesystem tool can time out on large files — if it does, provide manual diffs clearly

---

## WORKING ✅
- Discovery feed — masonry (50% dynamic offset), mall dropdown, no prices on tiles
- Feed scroll position saved/restored via sessionStorage on back navigation
- Skeleton loading matches live grid proportions
- Sold items in feed: 0.62 opacity + grayscale + "Unavailable" badge
- Flagged items in feed: green Flag circle at bottom-right of tile image
- Fixed bottom nav — Home + Flagged tabs, active state, count badge
- Flagged screen — list view (image + title + booth#), skeleton, empty state, live count
- `getPostsByIds` batch query in lib/posts.ts
- Find detail: full-bleed image, booth tag price hanging from photo, flag/share bottom-right
- BoothTag: string + hole punch + "In-Booth" label + formatted price
- "View the shelf" — horizontal scroll, hides if empty, hairline conditional
- Vendor name + booth number inline in "Find this here" card
- "Flag Booth" / "Booth Flagged" — local-only toggle, persisted to safeStorage
- Owner: "Mark as sold" / "Mark as available" toggle (Supabase write)
- Owner bottom section: "Mark as sold" ghost btn + "Delete post" ghost btn + confirmation
- Vendor profile: Facebook link, light theme, available/Unavailable grid
- Mall profile: grid, directions, available/sold split
- Post flow: capture → AI title + caption → preview → publish
- Image upload to Supabase Storage
- safeStorage fallback for Safari private/ITP
- Admin page: local profile inspector, bulk delete, nuke all
- All reseller intel routes (untouched, dark theme)

## KNOWN GAPS ⚠️
- `app/find/[id]/page.tsx` BoothTag write may have failed (MCP timeout) — verify on disk
- Price field missing from post creation flow (`/post` + `/post/preview`)
- Flagged items have no unflag affordance from the Flagged screen (must go to detail page)
- Directions affordance missing from "Find this here" mall address
- `/enhance-text` is mock (not real Claude)
- No Supabase RLS / auth yet
- No pull-to-refresh on feed
- No PWA support
- Delete button missing on posts created before `vendor_id` was stored in local profile

---

## DEBUGGING
```bash
# Live Supabase test
curl -s https://treehouse-treasure-search.vercel.app/api/debug | python3 -m json.tool

# Force deploy when webhook fails
npx vercel --prod

# Build check before pushing
npm run build 2>&1 | tail -30

# Always stage everything
git add -A && git commit -m "..." && git push

# Create new directories before filesystem:write_file
filesystem:create_directory path/to/new/dir
```
