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

Tell Claude: "close out the session" then run:
```bash
cd /Users/davidbutler/Projects/treehouse-treasure-search
git add CLAUDE.md CONTEXT.md && git commit -m "docs: update session context" && git push
```

---

## CURRENT ISSUE
> Last updated: 2026-04-10

**Status:** ✅ Demo-ready sprint complete. Feed filter, mode system, Your Finds fixes, My Shelf vendor picker, owner controls gated to Curator mode.

**What was done (this session):**

### Sprint — demo-ready
- **Feed filter**: `getFeedPosts` + `getMallPosts` now filter `.eq("status", "available")` — sold posts never appear in the discovery feed. Removed all sold-state display logic from `MasonryTile` (grayscale, "Found" badge, opacity).
- **My Shelf Found tiles**: now tappable — `FoundTile` wraps content in `<Link href=/find/${post.id}>`. Badge gets `pointerEvents: "none"` so it doesn't block the tap. Vendor can see sold items and re-mark as available.
- **Vendor profile save fix**: `saveProfile()` in `/post` now clears `vendor_id`/`slug` when `display_name` OR `booth_number` changes (not just when mall changes). Previously, editing name/booth kept the old vendor row — new posts published under stale identity.
- **`lib/posts.ts`**: Added `user_id?: string` to `CreateVendorInput`. Duplicate recovery path now updates `user_id` on existing row if null. Added `getVendorsByMall(mallId)` for My Shelf vendor picker.

### Sprint — Your Finds overhaul
- **Instant unsave**: removed `UnsaveButton` confirm state entirely. Single tap removes immediately. `e.preventDefault()` + `e.stopPropagation()` on the button prevents navigation.
- **Removed `ChevronRight`** from each row — redundant since the whole row is a link.
- **Sorting**: `groupByBooth` now sorts groups by: available-first, then numeric booth order, then vendor name alpha. Within each group: available items first, sold last. All-found groups go to bottom.
- **All-found banner state**: desaturated grey gradient, 0.72 opacity, "All found" sublabel.
- **Subtitle**: shows `"X finds still available · N booths"` or `"X finds · all found"`.
- **Stale bookmark pruning**: `pruneStaleBookmarks()` runs after `getPostsByIds` — auto-removes localStorage keys whose post IDs no longer exist in Supabase. Fixes "7 count, 0 items" bug caused by bookmarks pointing to deleted posts.
- **Grouping key fix**: orphaned posts (missing vendor join) now get unique key `__orphan__${post.id}` instead of all collapsing into `__no_vendor__`. No post silently dropped.
- **`location_label` fallback**: `groupByBooth` checks `post.location_label` when `vendor?.booth_number` is null.

### Sprint — Explorer / Curator mode system
- **`lib/mode.ts`**: `getMode()`, `setMode()`, `toggleMode()` — persisted in localStorage as `treehouse_mode = "explorer" | "curator"`.
- **`components/ModeToggle.tsx`**: Animated pill toggle — "Explorer" / "Curator". Used in feed header.
- **`components/BottomNav.tsx`**: Reads mode on mount + focus + storage event. Explorer shows Home + Your Finds. Curator shows Home + My Shelf. Re-syncs on tab switch.
- **`app/page.tsx`**: ModeToggle in header. `handleModeChange` navigates to correct second tab on switch.
- **`app/find/[id]/page.tsx`**: Owner controls (mark sold, delete) now gated to `isMyPost && isCurator`. Explorer mode sees zero owner controls even on their own posts. "Save to Your Finds" button hidden in Curator mode — that's a buyer action.
- **`app/my-shelf/page.tsx`**: Vendor picker in VendorBanner — fetches all vendors at the stored `mall_id` via `getVendorsByMall`, shows compact dropdown when mall has >1 vendor. Defaults to own vendor. Switching reloads posts for selected vendor.

**Previous sessions:**
- Day 3 UI/UX sprint — Found badge centering, leaf unsave, My Shelf sections, header font unification
- Day 2 UI/UX sprint — PiLeaf icons, badge sync, hero copy, "Your Finds" rename, iOS nav padding
- Branded Experience Sprint — 3-page overhaul (warmer parchment, Georgia, layered shadows)
- Mall Identity Layer — MallHeroCard shipped
- safeStorage iPhone Safari bug fix
- Admin page + bulk delete

**Next session starting point:**
1. QA on device — verify stale bookmark pruning works (open Your Finds, check console for `[flagged]` logs)
2. Verify mode toggle works on device — Explorer hides My Shelf tab, Curator hides Your Finds tab
3. Verify owner controls invisible in Explorer mode on find detail
4. Wire "Share my shelf" — native Web Share API, URL = `/vendor/${profile.slug}`, ghost button in My Shelf header. Falls back to clipboard copy + "Copied!" flash.
5. Auth sprint (Task 2 from demo-ready plan) — Supabase anonymous sessions, link `user_id` to vendor row, replace localStorage vendor_id comparison with session check
6. Pull-to-refresh on feed (deferred)
7. Optional Supabase hero columns (hero works without them):
   ```sql
   ALTER TABLE malls ADD COLUMN IF NOT EXISTS hero_title text;
   ALTER TABLE malls ADD COLUMN IF NOT EXISTS hero_subtitle text;
   ALTER TABLE malls ADD COLUMN IF NOT EXISTS hero_style text;
   ALTER TABLE malls ADD COLUMN IF NOT EXISTS hero_image_url text;
   ```

---

## PROJECT OVERVIEW

**Two independent layers:**
1. **Ecosystem** (front door, warm parchment theme): feed, vendor profiles, mall pages, post flow → Supabase
2. **Reseller intel** (dark forest theme, untouched): scan → identify → comps → decide → localStorage only

---

## STACK
```
Next.js 14 App Router · TypeScript · Tailwind CSS · Framer Motion
Anthropic SDK (claude-opus-4-5) · Supabase (Postgres + Storage) · SerpAPI · Vercel
react-icons (PiLeaf from react-icons/pi)
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
- **Extra columns:** vendors table has `facebook_url text`, `user_id uuid` (nullable — future auth)
- **Unique constraint:** `vendors_mall_booth_unique` on `(mall_id, booth_number)`

---

## ROUTE MAP

### Ecosystem (warm parchment theme)
```
/                   Discovery feed — masonry, Mall Hero Card at top, mall dropdown (hidden if ≤1 mall),
                    tile text bands (Georgia title + booth attribution), PiLeaf saved indicators on tiles,
                    ModeToggle (Explorer/Curator) in header top-right.
                    ONLY available posts shown — sold filtered at query level.
/find/[id]          Find detail — full-bleed image, centered "Found" badge on hero (sold),
                    BoothBox bottom-left (booth number, no price),
                    PiLeaf save + share buttons bottom-right of photo, BottomNav (no active tab),
                    price inline below title, "View the shelf" horizontal scroll,
                    "Find this here" card.
                    "Save to Your Finds" button — Explorer mode only (hidden in Curator).
                    Owner controls (mark sold, delete) — Curator mode only AND isMyPost.
/flagged            Your Finds (Explorer mode) — logo + 22px Georgia header, subtitle shows
                    available count + booth count, grouped by vendor/booth (VendorBanner),
                    sorted by: available groups first, numeric booth order, vendor alpha.
                    Within group: available items first, sold last.
                    All-found groups: grey banner, "All found" sublabel, sorted to bottom.
                    Leaf unsave button (instant, no confirm). Stale bookmarks auto-pruned.
/my-shelf           My Shelf (Curator mode) — logo + 22px Georgia header, VendorBanner in header
                    with vendor picker dropdown (when >1 vendor at mall), scrollable (all posts shown),
                    Available grid + Found grid (labeled, separated, Found tiles linked),
                    Add tile after last available, no trailing hairline/Share CTA.
/mall/[slug]        Mall profile
/vendor/[slug]      Vendor profile — Facebook link, available/sold grid
/post               Vendor capture — camera/gallery, profile setup. Clears vendor_id when
                    display_name or booth_number changes (forces new vendor row on publish).
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
lib/supabase.ts               Client with placeholder fallback for build time
lib/mode.ts                   Explorer/Curator mode — getMode(), setMode(), toggleMode()
                              localStorage key: treehouse_mode = "explorer" | "curator"
lib/posts.ts                  getFeedPosts (available only), getPost, getPostsByIds (no status filter),
                              getVendorPosts, getMallPosts (available only),
                              getVendorsByMall (for My Shelf picker),
                              createPost, createVendor (+ user_id param + duplicate recovery),
                              uploadPostImage, updatePostStatus, deletePost,
                              getAllMalls, getMallBySlug, getVendorBySlug, slugify
lib/postStore.ts              In-memory image store for /post → /post/preview flow
lib/safeStorage.ts            localStorage wrapper with sessionStorage + memory fallback
types/treehouse.ts            Post, Vendor, Mall (+ hero fields), LocalVendorProfile, PostStatus
components/BottomNav.tsx      Mode-aware nav — Explorer: Home + Your Finds; Curator: Home + My Shelf
                              Reads mode on mount + focus + storage event. Badge on Your Finds tab.
components/ModeToggle.tsx     Animated pill toggle in feed header — "Explorer" / "Curator"
                              onChange prop navigates to correct second tab on switch
components/PiLeafIcon.tsx     Thin wrapper: import { PiLeaf } from "react-icons/pi"
components/MallHeroCard.tsx   Mall Identity Hero — MallHeroCard + GenericMallHero exports
app/layout.tsx                No max-width wrapper — each page owns its own width
app/page.tsx                  Discovery feed — available-only posts, ModeToggle in header,
                              MallHeroCard, tile text bands, PiLeaf saved dot, hasFetched guard
app/flagged/page.tsx          Your Finds — instant unsave, stale bookmark pruning, sorted groups,
                              all-found banner state, location_label fallback, orphan key fix
app/my-shelf/page.tsx         My Shelf — vendor picker (getVendorsByMall), Available + Found grids,
                              Found tiles linked to detail, Add tile
app/find/[id]/page.tsx        Find detail — owner controls gated to `isMyPost && isCurator`,
                              "Save to Your Finds" hidden in Curator mode
app/post/page.tsx             Capture + profile — clears vendor_id on name/booth change
app/admin/page.tsx            Admin UI — profile inspector + bulk delete
app/api/admin/posts/route.ts  Admin API — GET all posts, DELETE by id or all
```

---

## DESIGN SYSTEM

### Ecosystem pages (warm parchment)
```
bg:           #f5f2eb
surface:      #edeae1
surfaceDeep:  #e4e0d6
border:       rgba(26,24,16,0.09)
textPrimary:  #1c1a14
textMid:      #4a4840
textMuted:    #8a8476
textFaint:    #b4ae9e
green (CTAs): #1e4d2b
greenLight:   rgba(30,77,43,0.08)
greenBorder:  rgba(30,77,43,0.20)
greenSolid:   rgba(30,77,43,0.90)
header blur:  rgba(245,242,235,0.96), backdropFilter blur(24px)
emptyTile:    #dedad2
tag:          #faf8f2
tagBorder:    #ccc6b4
bannerFrom:   #1e3d24
bannerTo:     #2d5435
```

### Reseller pages (dark — do not change)
```
bg: #050f05  text: #f5f0e8  gold: #c8b47e  green: #6dbc6d
```

### Typography scale (enforced minimums)
```
MINIMUM font size anywhere in the app: 10px
Page labels: 9–10px uppercase muted
Count/subtext lines: 10–11px italic Georgia
Section headers / page titles: 22px Georgia 700 — ALL three tab pages (home, flagged, my-shelf)
  - Home wordmark:       "Treehouse Finds" — 22px Georgia 700
  - Your Finds header:   "Your Finds"      — 22px Georgia 700
  - My Shelf wordmark:   "My Shelf"        — 22px Georgia 700
Body / tile titles: Georgia 12–14px
Captions: 15px italic Georgia, lineHeight 1.85
Empty state headers: Georgia 20px 700
Empty state body: italic Georgia 14px
```

### Georgia serif usage — ecosystem pages
```
Georgia is the brand font. Use it for:
- All page headers and section titles
- Item titles in feed tiles, rows, shelf cards
- Italic subtitles, count lines, metadata
- Caption / description copy
- CTA buttons
- Empty state copy (both header and body)
- Loading states ("Loading…")
System UI is reserved for: BottomNav labels, dropdown options, monospace data
```

### Icon system
```
lucide-react: Home, Store, Share2, Trash2, Facebook, Tag, MapPin, Compass, ChevronDown,
              ChevronRight, Plus, ImagePlus, Share2
react-icons/pi: PiLeaf — used as the "Your Finds" / save / unsave icon throughout ecosystem
  - BottomNav "Your Finds" tab
  - Feed tile saved indicator (green circle, bottom-right of image)
  - Find detail: photo save button (circle, dark/green bg)
  - Find detail: "Save to Your Finds" / "Saved to Your Finds" button in card (Explorer only)
  - Your Finds page: empty state icon, thumbnail fallback icon, inline unsave button (filled green circle)
```

### Shadow system
```
Cards: "0 2px 10px rgba(26,24,16,0.07), 0 1px 3px rgba(26,24,16,0.04)"
CTA buttons: "0 2px 12px rgba(30,77,43,0.20–0.25)"
Hero card: "0 4px 24px rgba(0,0,0,0.22), 0 1px 4px rgba(0,0,0,0.12)"
VendorBanner: "0 2px 14px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.10)"
```

### Shared layout
```
Max-width: 430px per page
Safe area: env(safe-area-inset-bottom) on all fixed bars
Bottom nav padding: calc(env(safe-area-inset-bottom, 0px) + 10px) — 10px extra above iPhone home bar
Bottom padding formula: max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))
Animations: opacity 0→1, y 8-16→0, ease [0.25,0.1,0.25,1]
Border radius: 16px cards, 14px inner cards, 10–11px shelf tiles, 24px pill buttons
```

### Mall Hero Card
```
Component: components/MallHeroCard.tsx
Exports: MallHeroCard (mall-specific) + GenericMallHero (all-malls fallback)
GenericMallHero copy:
  eyebrow: "Treehouse Finds"
  title:   "What will you find today?"
  subtitle: "Found across Kentucky's antique malls. A closer look at what's worth the trip."
Gradient styles: default | golden | forest | terracotta | slate (5 total)
Style assignment: deterministic hash of mall.name → always same style per mall
whileTap: scale 0.985 — single transition prop (duration 0.4) — DO NOT split into two transition props
AnimatePresence mode="wait" in page — hero cross-fades on mall change
KNOWN BUG PATTERN: framer-motion motion.div cannot have two `transition` props — merge always
```

### Feed grid
```
2-column masonry. Gap: 12px. Tile border-radius: 16px.
Right column offset: 50% of first tile's rendered height (ResizeObserver, live).
Skeleton uses SKELETON_OFFSET = Math.round(SKELETON_HEIGHTS[0] * 0.5) = 65px.
No price badges on tiles. No sold items in feed (filtered at query level).
Saved items: 22px green circle, PiLeafIcon size=12 white, bottom-right of tile image.
Tile text band: Georgia 12px 600 title (2-line clamp) + monospace 10px booth attribution.
Section label: italic Georgia 15px "What will you find today?" + count right.
hasFetched guard: posts only fetched once per React mount — no re-fetch on back-navigate.
Bookmark sync: loadFollowedIds() on mount + window "focus" event.
```

### Explorer / Curator mode system
```
Storage key: treehouse_mode = "explorer" | "curator"  (localStorage)
Default: "explorer"
lib/mode.ts: getMode(), setMode(), toggleMode()
components/ModeToggle.tsx: animated pill in feed header, onChange navigates to correct tab

Explorer mode (buyer):
  - BottomNav: Home · Your Finds
  - /find/[id]: "Save to Your Finds" button visible, owner controls hidden
  - /flagged: accessible
  - /my-shelf: accessible but BottomNav doesn't show it

Curator mode (vendor):
  - BottomNav: Home · My Shelf
  - /find/[id]: owner controls visible (isMyPost && isCurator), "Save to Your Finds" hidden
  - /my-shelf: accessible with vendor picker
  - /flagged: accessible but BottomNav doesn't show it
```

### Bottom navigation
```
Component: components/BottomNav.tsx
Props: active ("home" | "flagged" | "my-shelf" | null), flaggedCount (number, optional)
Mode-aware tabs:
  Explorer: Home (/) · Your Finds (/flagged)
  Curator:  Home (/) · My Shelf (/my-shelf)
Icons: Home (lucide) · PiLeafIcon · Store (lucide) — size 21
Active state: green pill behind icon + bold label (600)
Badge: green rounded pill on Your Finds tab only (Explorer mode), minWidth 16, cap 99+
Bottom padding: calc(env(safe-area-inset-bottom, 0px) + 10px) — icons lifted off iPhone home bar
Re-syncs mode on: mount, window focus, storage event
```

### Save / "Your Finds" system
```
Storage key: treehouse_bookmark_{postId} = "1"  ← key name unchanged, do not rename
Storage layer: safeStorage (localStorage → sessionStorage → memory)
Raw localStorage iteration used in: feed loadFollowedIds(), Your Finds loadFlaggedIds()
Badge count source: raw localStorage key iteration — same function on all pages
Terminology: "Save to Your Finds" / "Saved to Your Finds"
Icon: PiLeafIcon everywhere (not Bookmark)
Unsave: instant on Your Finds rows — single tap removes, optimistic state update
Stale pruning: after getPostsByIds, any saved ID not returned by Supabase is auto-removed
```

### Your Finds page layout
```
Header: logo + 22px Georgia 700 "Your Finds" | italic Georgia 13px subtitle below
  Subtitle: "X finds still available · N booths" or "X finds · all found" or "Nothing saved yet"
  Loading/mismatch state: "Syncing your finds…"
Group layout: VendorBanner per vendor → rows of FindRow items
VendorBanner: dark gradient (bannerFrom → bannerTo), vendor name Georgia 15px 700,
  booth pill right (monospace 13px). All-found: grey gradient, opacity 0.72, "All found" sublabel.
Sort order (groups): available groups first (numeric booth), all-found groups last.
Sort order (within group): available items first, sold last.
Item rows: 64×64 thumbnail (PiLeaf fallback), Georgia 14px 600 title, price or "Found" label,
  green leaf circle unsave button (instant, no confirm, e.stopPropagation())
No ChevronRight. No Share CTA.
```

### My Shelf page layout
```
Header:
  Top row: logo + "My Shelf" Georgia 22px 700 left | "Post a find" green pill right
  VendorBanner: dark gradient, vendor name + booth pill.
    VendorPicker dropdown inside banner — only shows when mall has >1 vendor.
    Picker: frosted white pill button, ChevronDown, dropdown list with Georgia vendor names.
    Switching vendor: reloads posts for selected vendor.id.
  Count row: "X available · Y found" italic Georgia 11px faint
Layout: scrollable flex column — all posts shown, no cap
Available section: 3-col grid, linked tiles, Add tile after last available
Found section: 3-col grid, linked tiles (to detail page), grayscale + opacity 0.62 + "Found" badge
No trailing hairline. No Share CTA (deferred).
```

### Detail page layout order
```
1. Full-bleed image
   - Centered "Found" badge when sold
   - PiLeaf save + Share2 buttons bottom-right (36px circles, blur backdrop)
   - BoothBox bottom-left — "Found In-Booth" + booth number
2. Title (Georgia 26px 700)
3. Price + availability dot or "Found" text
4. Caption + description
5. [hairline if shelf has items] + "View the shelf" horizontal scroll
6. "Find this here" card:
     Mall name + address link
     Vendor name + booth pill
     Facebook link (if present)
     "Save to Your Finds" button — EXPLORER MODE ONLY
7. Owner actions — CURATOR MODE + isMyPost ONLY:
     "Mark as sold" / "Mark as available" toggle
     "Delete post" → confirmation
8. BottomNav (active={null})
```

### "Found" terminology rules
```
UI-facing (buyers see): "Found" — used for sold/unavailable status everywhere
Admin/owner-facing: "Sold" — preserved in owner controls only
  - Owner action toggle: "Mark as sold" / "Mark as available"
  - Supabase status column value: still "sold" (unchanged in DB)
Never use "Unavailable" — fully retired
```

---

## RULES & GOTCHAS
- All ecosystem pages need `export const dynamic = "force-dynamic"` (import supabase at module scope)
- Never use `export const config = {}` — deprecated in Next.js 14 App Router
- Always use `git add -A` — never individual paths (zsh glob-expands `[slug]`)
- `filesystem:write_file` is the ONLY reliable way to write files to disk
- `str_replace` tool fails on bracket-path files (`app/find/[id]/page.tsx`) — always use `filesystem:write_file` for full rewrites
- New directories must be created with `filesystem:create_directory` before `filesystem:write_file`
- `uploadPostImage` is non-fatal — post goes through even without image
- vendor_id cleared from LocalVendorProfile when display_name OR booth_number changes — forces new vendor row on next publish
- vendor_id only carried over unchanged when mall + name + booth are ALL identical to saved profile
- Supabase client uses placeholder URL at build time to avoid prerender crash
- `createVendor` handles 23505 duplicate key by fetching existing row — do not revert this
- `createVendor` accepts optional `user_id` — updates existing row's user_id if currently null
- `getPostsByIds` has NO status filter — saved finds shown regardless of sold/available
- `getFeedPosts` and `getMallPosts` filter `.eq("status","available")` — sold never reaches feed
- Always use `safeStorage` (not raw `localStorage`) in ecosystem client components, EXCEPT:
  - Feed's `loadFollowedIds()` reads raw `localStorage` directly (needs key iteration)
  - Your Finds' `loadFlaggedIds()` reads raw `localStorage` directly (same reason)
  - Feed scroll restoration uses raw `sessionStorage` (ephemeral tab state)
- Badge count must always use raw localStorage key iteration — NOT `posts.length`
- Unsave in Your Finds: optimistic removal — filter from state + decrement count, no re-fetch needed
- `groupByBooth` orphan key: posts with no vendor join get unique key `__orphan__${post.id}` — never `__no_vendor__` (would collapse multiple orphans)
- Owner controls in find detail: `showOwnerControls = isMyPost && isCurator` — both conditions required
- Mode toggle in feed header: `onChange` navigates to the correct second tab for the new mode
- BottomNav re-reads mode on mount + focus + storage event — always in sync
- Vercel project is under `david-6613s-projects` scope, NOT `zen-forged`
- Vercel GitHub webhook has been unreliable — if push doesn't deploy, use `npx vercel --prod`
- Always provide a git commit/push bash command after every code change
- MINIMUM font size: 10px everywhere. Never ship 9px or smaller as readable UI labels.
- **framer-motion**: `motion.div` cannot have two `transition` props — TypeScript error at build time. Merge always.
- **Duplicate borderRadius on same style object** = TypeScript build error — happened in my-shelf VendorBanner div
- **react-icons**: `PiLeaf` from `react-icons/pi` — use via `components/PiLeafIcon.tsx` wrapper everywhere.

---

## WORKING ✅
- Discovery feed — masonry, available-only posts, no prices, PiLeaf saved indicator, mall dropdown, ModeToggle
- MallHeroCard / GenericMallHero — Kentucky copy, deterministic gradient, AnimatePresence
- Feed scroll position saved/restored via sessionStorage, hasFetched guard
- Bookmark badge: raw localStorage count, synced on focus across all pages
- **Your Finds** — instant unsave, stale pruning, sorted groups, all-found banner state
- **My Shelf** — vendor picker, scrollable, Available + Found grids, Found tiles linked
- **BottomNav** — mode-aware (Explorer vs Curator), iOS padding, badge
- **ModeToggle** — animated pill, feed header, navigates on switch
- **Find detail** — owner controls Curator-only, Save button Explorer-only
- **Post flow** — vendor_id cleared on identity change, AI caption, price field, publish
- safeStorage fallback for Safari private/ITP
- Admin page: profile inspector, bulk delete
- All reseller intel routes (untouched, dark theme)

## KNOWN GAPS ⚠️
- "Share my shelf" CTA unwired (deferred — next sprint)
- Auth sprint deferred — Supabase anonymous sessions not yet linked to vendor rows
- No pull-to-refresh on feed
- No PWA support
- `/enhance-text` is mock (not real Claude)
- No Supabase RLS
- Delete button missing on posts created before vendor_id was stored in local profile
- Optional hero columns not yet added to malls table in Supabase

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

# Your Finds diagnostic — check console on device for:
# [flagged] localStorage bookmark IDs: N  →  [flagged] Supabase returned: M posts
# If N > M, stale bookmarks will be auto-pruned

# Add hero columns to malls table (optional — hero works without them)
# Run in Supabase SQL editor:
# ALTER TABLE malls ADD COLUMN IF NOT EXISTS hero_title text;
# ALTER TABLE malls ADD COLUMN IF NOT EXISTS hero_subtitle text;
# ALTER TABLE malls ADD COLUMN IF NOT EXISTS hero_style text;
# ALTER TABLE malls ADD COLUMN IF NOT EXISTS hero_image_url text;
```
