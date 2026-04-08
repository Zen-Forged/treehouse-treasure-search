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

**Status:** ✅ My Shelf page + 3-tab BottomNav built. Flagged page grouped by booth with Eye icon.

**What was done (this session):**

### Flagged page redesign (`app/flagged/page.tsx`)
- Posts now grouped by booth via `groupByBooth()` — keyed by vendor ID, sorted numerically
- Each group gets a section header: green monospace pill "Booth 300" + italic vendor name
- Booth pill removed from individual rows (redundant now header carries it)
- `›` chevron replaced with `Eye` icon (lucide-react, 15px, textFaint)
- Header subtitle: "4 finds · 2 booths"
- "No booth listed" fallback for vendors without a booth number

### My Shelf page (`app/my-shelf/page.tsx`)
- New route at `/my-shelf` — vendor's personal 3×3 grid, max 9 items
- Reads `LocalVendorProfile` from localStorage — no vendor_id = NoProfile state
- Available posts first, sold second, sliced to 9
- **Header identity block:**
  - "My Shelf" label (uppercase, faint, above)
  - Mall name (small, muted, below label)
  - Vendor name: Georgia 20px bold, left-justified, dominant
  - Booth number: monospace 18px bold, green, boxed (greenLight bg + greenBorder border + 8px radius), right-justified, "Booth" label below box in faint uppercase
  - All on one inline row — vendor name left, booth box right
- **3×3 square tile grid** — 1:1 aspect ratio, 6px gap, 10px border radius
  - Image tiles: objectFit cover, sold tiles get grayscale + "Sold" frosted overlay badge
  - No-image tiles: show title text bottom-left
  - Empty slots (when < 9 posts): dashed border placeholder tiles
- Item count line: "N available · N sold" italic Georgia left, "N / 9" faint uppercase right
- Shelf label: hairline rule with mall name centered between dashes
- "Share my shelf" CTA: full-width green button, disabled + 0.72 opacity, "Coming soon" label below
- Skeleton: 9-tile shimmer grid while loading
- Empty/no-profile states with "Post a find" CTA linking to /post

### BottomNav — 3rd tab (`components/BottomNav.tsx`)
- Added "My Shelf" tab with `Store` icon from lucide-react
- Tab type expanded: `"home" | "flagged" | "my-shelf" | null`
- `/my-shelf` passes `active="my-shelf"` to BottomNav

**Previous sessions:**
- BoothTag price hanging from photo on detail page
- Bottom nav + flagged screen initial build
- Feed masonry, scroll restoration, sold state, vendor profile

**Next session starting point:**
1. Deploy: `git push` or `npx vercel --prod`
2. QA My Shelf: visit `/my-shelf` — confirm identity header, 3×3 grid, empty tile placeholders
3. QA Flagged: confirm booth grouping headers show "Booth 300 · Vendor Name"
4. Good candidates after:
   - Price field in post creation flow (`/post` + `/post/preview`)
   - "Share my shelf" wiring (screenshot/native share)
   - Directions affordance in "Find this here" card
   - Pull-to-refresh on feed
   - PWA support

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
/flagged            Flagged finds — grouped by booth, section headers, Eye icon row affordance
/my-shelf           Vendor's 3×3 shelf — identity header, 9-slot grid, "Share my shelf" CTA
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
components/BottomNav.tsx  Fixed bottom nav — Home + Flagged + My Shelf tabs, active state, badge
app/layout.tsx            No max-width wrapper — each page owns its own width
app/page.tsx              Discovery feed — BottomNav active="home"
app/flagged/page.tsx      Flagged screen — grouped by booth, BottomNav active="flagged"
app/my-shelf/page.tsx     My Shelf — vendor 3×3 grid, identity header, BottomNav active="my-shelf"
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
Props: active ("home" | "flagged" | "my-shelf" | null), flaggedCount (number, optional)
Tabs: Home (/) · Flagged (/flagged) · My Shelf (/my-shelf)
Icons: Home, Flag, Store (lucide-react)
Active state: green pill (rgba(30,77,43,0.10)) behind icon + bold label
Badge: green dot on Flagged tab, shown only when flaggedCount > 0, capped at 9+
Pages that show it: /, /flagged, /my-shelf, /find/[id]
Active tab: "home" · "flagged" · "my-shelf" · null (sub-pages)
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

### My Shelf page layout
```
Header (sticky, blurred):
  - "My Shelf" label: 9px uppercase, faint, above identity row
  - Identity row: vendor name (Georgia 20px bold, left) | booth box (monospace 18px bold, green, right)
  - Booth box: greenLight bg, greenBorder border, 8px radius, padding 5px 12px
  - "Booth" label: 8px uppercase faint, below booth box
  - Mall name: 10px muted, above vendor name

Content:
  - Count line: "N available · N sold" italic Georgia left | "N / 9" faint right
  - 3×3 grid: repeat(3, 1fr), 6px gap, 1:1 aspect ratio tiles, 10px border radius
  - Sold tiles: grayscale + frosted "Sold" badge overlay
  - Empty slots: dashed border placeholder (no content)
  - Shelf label: hairline rules + mall name centered between them

Footer:
  - "Share my shelf" button: full-width green, disabled, 0.72 opacity
  - "Coming soon" label beneath
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
- My Shelf reads raw `localStorage` directly for LocalVendorProfile (same pattern as feed)

---

## WORKING ✅
- Discovery feed — masonry (50% dynamic offset), mall dropdown, no prices on tiles
- Feed scroll position saved/restored via sessionStorage on back navigation
- Skeleton loading matches live grid proportions
- Sold items in feed: 0.62 opacity + grayscale + "Unavailable" badge
- Flagged items in feed: green Flag circle at bottom-right of tile image
- Fixed bottom nav — Home + Flagged + My Shelf tabs, active state, count badge
- Flagged screen — grouped by booth (Booth N header + vendor name), Eye icon, skeleton, empty state
- My Shelf — 3×3 grid, identity header (vendor name + booth box), empty tile placeholders, "Share my shelf" stub
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
- "Share my shelf" is unwired (disabled button, "Coming soon")
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
