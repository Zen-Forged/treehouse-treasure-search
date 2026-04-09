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

**Status:** ✅ Day 1–2 design audit changes implemented. Typography scale corrected across all three tab pages.

**What was done (this session):**

### Design audit — 9 findings identified
A full UX/hierarchy/consistency audit was conducted across Home, Flagged, My Shelf, and Find Detail pages. Findings were categorised as: Typography, Hierarchy, UX/Clarity, and Consistency.

### Day 1–2 changes implemented

**Home (`app/page.tsx`)**
- "Treehouse" wordmark: `13px → 15px` Georgia 700
- Logo: `20px → 22px`
- "Local finds" subtext: `6px → 9px` uppercase muted
- "Post a find" button: padding restored to `7px 13px`, font `12px`

**Flagged (`app/flagged/page.tsx`)**
- Green icon circle removed entirely — BottomNav tab provides the icon association
- "Flagged" title: `13px → 16px` Georgia 700 — now the sole header anchor
- Count subtext: `6px → 10px`
- "Unavailable" badge in rows: `9px → 10px`

**My Shelf (`app/my-shelf/page.tsx`)**
- "My Shelf" page label: `6px → 10px`
- Mall name: `7px → 10px`
- Vendor name: `13px → 17px` Georgia 700 — now clearly dominates the booth box
- "Booth" label: `6px → 10px`
- Booth number box: `12px → 11px` mono (smaller than vendor name — correct hierarchy)
- Count lines: `6px → 10px`
- Shelf rule: `6px → 10px`
- "Coming soon": `6px → 10px`
- "Add Find" empty tile label: `9px → 10px`
- Sold overlay in grid now says "Unavailable" (was "Sold") — consistency fix

**Previous sessions:**
- My Shelf concept C alternating layout (2/3 + 1/3, thirds, 1/3 + 2/3)
- Flagged page grouped by booth with "Booth N" headers + Eye icon
- 3-tab BottomNav (Home · Flagged · My Shelf)
- BoothTag price hanging from photo on detail page
- Admin page + bulk delete

**Next session starting point:**
1. Deploy: `git push` or `npx vercel --prod`
2. QA all three headers on device — confirm no text below 10px
3. Day 3–4 audit items (good candidates for next sprint):
   - Rename "Flag/Flagged" → "Save/Saved" throughout (tab, button, state, storage key)
   - Wire "Share my shelf" to native share / URL copy (vendor profile URL)
   - Hide mall dropdown when only 1 mall exists
   - Unify sold label to "Unavailable" everywhere (My Shelf grid overlay still says "Sold" — FIXED this session)
   - Add inline unsave on Flagged rows

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
/flagged            Flagged finds — grouped by booth ("Booth N" header + italic vendor name),
                    Eye icon row affordance, no icon circle in header
/my-shelf           Vendor's alternating-row shelf — identity header (vendor name 17px dominant,
                    booth box 11px mono), 7-slot grid, "Share my shelf" CTA
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
lib/supabase.ts               Client with placeholder fallback for build time
lib/posts.ts                  getFeedPosts, getPost, getPostsByIds, getVendorPosts,
                              createPost, createVendor, uploadPostImage,
                              updatePostStatus, deletePost,
                              getAllMalls, getMallBySlug, getVendorBySlug, slugify
lib/postStore.ts              In-memory image store for /post → /post/preview flow
lib/safeStorage.ts            localStorage wrapper with sessionStorage + memory fallback
types/treehouse.ts            Post, Vendor, Mall, LocalVendorProfile, PostStatus
components/BottomNav.tsx      Fixed bottom nav — Home + Flagged + My Shelf tabs, active state, badge
app/layout.tsx                No max-width wrapper — each page owns its own width
app/page.tsx                  Discovery feed — BottomNav active="home"
app/flagged/page.tsx          Flagged screen — grouped by booth, no icon circle, BottomNav active="flagged"
app/my-shelf/page.tsx         My Shelf — alternating grid, identity header, BottomNav active="my-shelf"
app/find/[id]/page.tsx        Find detail — BoothTag, flag/share bottom-right, BottomNav null
app/admin/page.tsx            Admin UI — profile inspector + bulk delete
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
emptyTile: #d8d4cc  ← Add Find tile background
```

### Reseller pages (dark — do not change)
```
bg: #050f05  text: #f5f0e8  gold: #c8b47e  green: #6dbc6d
```

### Typography scale (enforced minimums)
```
MINIMUM font size anywhere in the app: 10px
Page labels ("My Shelf", "Local finds"): 9–10px uppercase muted
Count/subtext lines: 10px
Section headers / page titles: 16–17px Georgia 700
App wordmark (Home): 15px Georgia 700
Vendor name (My Shelf): 17px Georgia 700 — identity hero
Body / tile titles: 13–14px
Captions: 15px italic Georgia
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
Active tab: "home" · "flagged" · "my-shelf" · null (sub-pages e.g. /find/[id])
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

### My Shelf header hierarchy
```
Row label:    "My Shelf" — 10px uppercase faint (page context)
Mall name:    10px muted (location context)
Vendor name:  17px Georgia 700 textPrimary — DOMINANT identity element
Booth label:  "Booth" — 10px uppercase faint
Booth box:    11px monospace green, greenLight bg, greenBorder border, 6px radius
              Padding: 3px 9px — compact, does not compete with vendor name
Count line:   10px italic Georgia muted (available · sold) | 10px faint uppercase (N / 7)
```

### My Shelf grid layout
```
Alternating rows — 7 real slots + 2 implicit (grid only holds 7):
  Row 1: [0] flex:2  |  [1] flex:1
  Row 2: [2] flex:1  |  [3] flex:1  |  [4] flex:1
  Row 3: [5] flex:1  |  [6] flex:2
Gap: 4px. Border-radius: 9px per tile.
Empty slots: #d8d4cc bg, ImagePlus icon (20px, 28% opacity), "Add Find" 10px uppercase → /post
Sold tiles: "Unavailable" frosted overlay badge (NOT "Sold")
Page uses height:100dvh + overflow:hidden — everything fits one screen, no scroll.
```

### Flagged page header
```
No icon circle — title is the sole anchor (icon context comes from BottomNav tab)
"Flagged": 16px Georgia 700
Count: 10px muted — "N finds · N booths"
Booth section headers: "Booth N" green monospace pill (11px) + italic vendor name (12px Georgia)
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
- MINIMUM font size: 10px everywhere. Never ship 6px, 7px, 8px text as readable UI labels.
- Sold state label is "Unavailable" everywhere — never "Sold" in the ecosystem layer

---

## WORKING ✅
- Discovery feed — masonry (50% dynamic offset), mall dropdown, no prices on tiles
- Feed scroll position saved/restored via sessionStorage on back navigation
- Skeleton loading matches live grid proportions
- Sold items in feed: 0.62 opacity + grayscale + "Unavailable" badge
- Flagged items in feed: green Flag circle at bottom-right of tile image
- Fixed bottom nav — Home + Flagged + My Shelf tabs, active state, count badge
- Flagged screen — grouped by booth ("Booth N" header), Eye icon, no icon circle in header
- My Shelf — alternating 3-row grid, identity header (17px vendor name dominates 11px booth box),
  empty Add Find tiles → /post, "Unavailable" sold overlay, single-screen layout
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
- Typography scale corrected: 10px minimum, correct title hierarchy across all tabs
- All reseller intel routes (untouched, dark theme)

## KNOWN GAPS ⚠️
- "Flag/Flagged" terminology should become "Save/Saved" (audit finding — Day 3)
- "Share my shelf" is unwired (disabled button, "Coming soon") — Day 3 target
- Mall dropdown visible even with only 1 mall — Day 3 target
- Inline unsave from Flagged screen not yet implemented — Day 5 target
- Price field missing from post creation flow (`/post` + `/post/preview`)
- Directions affordance missing from "Find this here" mall address
- `/enhance-text` is mock (not real Claude)
- No Supabase RLS / auth yet
- No pull-to-refresh on feed
- No PWA support
- Delete button missing on posts created before `vendor_id` was stored in local profile

---

## DESIGN AUDIT FINDINGS (for reference)
Completed audit 2026-04-08. 9 findings across 4 categories.

### Typography (Day 1–2 — DONE ✅)
- 6px text was unreadable — restored all labels to 10px+
- Inconsistent title scale — fixed: Home 15px, Flagged 16px, My Shelf vendor 17px

### Hierarchy (Day 1–2 — DONE ✅)
- Home header lacked a primary focus — wordmark now dominates at 15px
- My Shelf booth box outweighed vendor name — vendor name now 17px, booth box 11px
- Flagged icon circle competed with title — removed, title is now sole anchor

### UX / Clarity (Day 3–4 — PENDING)
- "Flag Booth" terminology confusing → rename to Save/Saved
- No way to unsave from Flagged screen → add inline toggle
- "Share my shelf" is a dead end → wire to native share
- Mall dropdown shows with only 1 mall → hide conditionally

### Consistency (Day 5 — PENDING)
- Three different header structures → align vertical rhythm
- Sold label varies "Unavailable" vs "Sold" → FIXED this session (all "Unavailable")
- Bottom padding formula not unified → document two patterns

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
