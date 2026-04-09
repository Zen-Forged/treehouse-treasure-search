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
> Last updated: 2026-04-09

**Status:** ✅ Branded experience sprint complete. Three-page UI overhaul + premium refinement pass shipped and deployed.

**What was done (this session):**

### Branded Experience Sprint — 3-page overhaul

**Design decisions locked:**
- No prices in feed tiles (discovery-first, gallery model preserved)
- "Flagged" → "Visit List" (label only; URL stays `/flagged`)
- Price shown on detail page when `price_asking != null`
- My Shelf reverted to 3×3 uniform 9-tile grid
- Booth attribution (`Booth 300`) added to feed tiles — no price
- `Flag` icon → `Bookmark` icon throughout

**BottomNav (`components/BottomNav.tsx`):**
- `Flag` → `Bookmark` icon
- "Flagged" → "Visit List" label
- Warmer parchment token: `rgba(245,242,235,0.97)` bg
- Icon size 20→21px, padding increased, blur 20→24px

**Discovery Feed (`app/page.tsx`):**
- Feed tile text band added below image: Georgia 12px title + monospace booth attribution
- Section label changed to italic Georgia 15px question copy ("What did you find today?")
- Tile border-radius 14→16px, shadow upgraded to layered depth
- Skeleton updated to include text band shimmer
- Warmer palette tokens throughout

**Visit List (`app/flagged/page.tsx`):**
- Full rename: "Your Visit List" header (Georgia 22px 700), italic subtitle
- "N finds waiting for you" — italic Georgia, warm and human
- Item rows: Georgia title, price shown when available, `ChevronRight` affordance (replaces Eye)
- Booth section header: green pill + italic Georgia vendor name, more breathing room
- "Share your Shelf" CTA fixed above BottomNav — disabled, green, unwired
- Card border-radius 14→16px, layered shadow

**My Shelf (`app/my-shelf/page.tsx`):**
- 3×3 uniform grid (9 slots) — replaces alternating 7-slot layout
- Empty slots: `#dedad2` greyed tiles, `ImagePlus` icon + "Add" label → `/post`
- Vendor name 17→19px Georgia, booth pill refined
- Count line italic Georgia
- Watermark rule between grid and CTA
- "Share my shelf" CTA — same green style as Visit List

**Detail page (`app/find/[id]/page.tsx`):**
- Price surfaced inline: `$325 · ● Available` below title
- `Flag` → `Bookmark` icon on photo buttons
- "Flag Booth" → "Save to Visit List" / "Saved to Visit List"
- "Find this here" card: 14px Georgia 700 mall name, 14px border-radius, layered shadow
- "Save to Visit List" button uses Georgia serif
- All warmer palette tokens

**Refinement pass (premium styling):**
- Background `#f0ede6` → `#f5f2eb` across all pages (warmer parchment)
- Surface `#e8e4db` → `#edeae1` (higher contrast vs bg, cards lift off page)
- All text tokens shifted warm: `#1c1a14` primary, `#8a8476` muted, `#b4ae9e` faint
- Georgia serif applied to: empty states, subtitles, metadata lines, CTA buttons, shelf card titles, loading states
- Backdrop blur 20→24px on all headers and nav
- Layered box-shadow system on all cards and CTAs
- Spacing increased: header padding, card gaps, section margins

**Previous sessions:**
- Mall Identity Layer (Sprint 1) — MallHeroCard shipped
- Design audit 9 findings — Day 1–2 typography/hierarchy fixes
- My Shelf concept C alternating layout (now reverted to 3×3)
- Flagged page grouped by booth with "Booth N" headers
- 3-tab BottomNav (Home · Visit List · My Shelf)
- BoothTag price hanging from photo on detail page
- Admin page + bulk delete
- safeStorage iPhone Safari bug fix

**Next session starting point:**
1. QA on device: warmer palette, tile text bands, 3×3 shelf, Visit List rename
2. Remaining Day 3 audit items:
   - Wire "Share your Shelf" to native share / URL copy (both Visit List + My Shelf CTAs)
   - Add inline unsave from Visit List rows (swipe or tap affordance)
3. Price field missing from post creation flow (`/post` + `/post/preview`)
4. Optional Supabase hero columns (hero works without them):
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

### Ecosystem (warm parchment theme)
```
/                   Discovery feed — masonry, Mall Hero Card at top, mall dropdown (hidden if ≤1 mall),
                    tile text bands (Georgia title + booth attribution), bookmarked indicators on tiles
/find/[id]          Find detail — full-bleed image, booth tag price (bottom-left of photo),
                    bookmark + share buttons bottom-right of photo, BottomNav (no active tab),
                    price inline below title, "View the shelf" scroll, "Find this here" card,
                    "Save to Visit List" button, owner actions (mark sold + delete)
/flagged            Visit List — grouped by booth ("Booth N" header + italic vendor name),
                    ChevronRight affordance, "Share your Shelf" CTA at bottom
/my-shelf           My Shelf — 3×3 uniform 9-tile grid, identity header (vendor name 19px dominant,
                    booth box 12px mono), watermark rule, "Share my shelf" CTA
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
types/treehouse.ts            Post, Vendor, Mall (+ hero fields), LocalVendorProfile, PostStatus
components/BottomNav.tsx      Fixed bottom nav — Home + Visit List + My Shelf tabs, active state, badge
                              Icons: Home, Bookmark, Store (lucide-react)
components/MallHeroCard.tsx   Mall Identity Hero — MallHeroCard + GenericMallHero exports
app/layout.tsx                No max-width wrapper — each page owns its own width
app/page.tsx                  Discovery feed — MallHeroCard, tile text bands, BottomNav active="home"
app/flagged/page.tsx          Visit List — grouped by booth, ChevronRight rows, Share CTA
app/my-shelf/page.tsx         My Shelf — 3×3 grid, identity header, Share CTA
app/find/[id]/page.tsx        Find detail — BoothTag, bookmark/share, price inline, Save to Visit List
app/admin/page.tsx            Admin UI — profile inspector + bulk delete
app/api/admin/posts/route.ts  Admin API — GET all posts, DELETE by id or all
```

---

## DESIGN SYSTEM

### Ecosystem pages (warm parchment)
```
bg:           #f5f2eb          ← warmer parchment (updated from #f0ede6)
surface:      #edeae1          ← card surface, higher contrast vs bg (updated from #e8e4db)
surfaceDeep:  #e4e0d6
border:       rgba(26,24,16,0.09)
textPrimary:  #1c1a14          ← warm near-black
textMid:      #4a4840
textMuted:    #8a8476
textFaint:    #b4ae9e
green (CTAs): #1e4d2b
greenLight:   rgba(30,77,43,0.08)
greenBorder:  rgba(30,77,43,0.20)
greenSolid:   rgba(30,77,43,0.90)   ← filled/active state
header blur:  rgba(245,242,235,0.96), backdropFilter blur(24px)
emptyTile:    #dedad2               ← warmed up from #d8d4cc
tag:          #faf8f2
tagBorder:    #ccc6b4
tagString:    #b4ae9e
```

### Reseller pages (dark — do not change)
```
bg: #050f05  text: #f5f0e8  gold: #c8b47e  green: #6dbc6d
```

### Typography scale (enforced minimums)
```
MINIMUM font size anywhere in the app: 10px
Page labels ("My Shelf", "Local finds"): 9–10px uppercase muted
Count/subtext lines: 10–11px italic Georgia
Section headers / page titles: 16–22px Georgia 700
  - Feed section label: italic Georgia 15px (question copy, not uppercase label)
  - Visit List header: Georgia 22px 700
  - My Shelf vendor name: Georgia 19px 700 — identity hero
  - App wordmark (Home): 16px Georgia 700
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
- CTA buttons (Save to Visit List, Share your Shelf, Share my shelf)
- Empty state copy (both header and body)
- Loading states ("Loading…")
- Error / not-found states
System UI is reserved for: BottomNav labels, dropdown options, monospace data
```

### Shadow system
```
Cards (feed tiles, Visit List rows, Find this here card):
  box-shadow: "0 2px 10px rgba(26,24,16,0.07), 0 1px 3px rgba(26,24,16,0.04)"
CTA buttons:
  box-shadow: "0 2px 12px rgba(30,77,43,0.20–0.25)"
Hero card:
  box-shadow: "0 4px 24px rgba(0,0,0,0.22), 0 1px 4px rgba(0,0,0,0.12)"
```

### Shared
```
Font: Georgia serif (all content), monospace (booth/prices), system UI (nav labels only)
Max-width: 430px per page
Safe area: env(safe-area-inset-bottom) on all fixed bars
Bottom padding formula: max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))
Animations: opacity 0→1, y 8-16→0, ease [0.25,0.1,0.25,1]
Border radius: 16px cards, 14px inner cards, 10–11px shelf tiles, 24px pill buttons
```

### Mall Hero Card
```
Component: components/MallHeroCard.tsx
Exports: MallHeroCard (mall-specific) + GenericMallHero (all-malls fallback)
Gradient styles: default | golden | forest | terracotta | slate (5 total)
Style assignment: deterministic hash of mall.name → always same style per mall
Layers (bottom to top):
  1. CSS gradient (always present)
  2. Photo (optional hero_image_url — 35% opacity)
  3. SVG noise texture (data URI, repeat, 200×200)
  4. Radial vignette (edges darken for depth)
  5. Content: eyebrow 10px / title 26px Georgia / location pill / subtitle italic / CTA button
CTA: greenSolid pill, ArrowRight icon, scrolls feedRef into view on tap
whileTap: scale 0.985 — single transition prop (duration 0.4) — DO NOT split into two transition props
AnimatePresence mode="wait" in page — hero cross-fades on mall change
KNOWN BUG PATTERN: framer-motion motion.div cannot have two `transition` props — merge always
```

### Feed grid
```
2-column masonry. Gap: 12px. Tile border-radius: 16px.
Right column offset: 50% of first tile's rendered height (ResizeObserver, live).
Skeleton uses SKELETON_OFFSET = Math.round(SKELETON_HEIGHTS[0] * 0.5) = 65px.
Skeleton includes text band shimmer below image area.
No price badges on tiles. Sold items: 0.60 opacity + grayscale + "Unavailable" badge.
Bookmarked items: 20px solid green circle (Bookmark SVG, filled) at bottom-right of tile image.
Tile text band (always shown below image):
  - Title: Georgia 12px 600, 2-line clamp
  - Booth attribution: monospace 10px textFaint (e.g. "Booth 300")
  - Padding: 10px 11px 13px
Scroll position saved to sessionStorage ("treehouse_feed_scroll"), restored on mount.
Bookmarked IDs loaded once on mount via loadFollowedIds() — scans localStorage for treehouse_bookmark_* keys.
Section label above grid: italic Georgia 15px question copy (left) + count italic Georgia (right).
```

### Bottom navigation
```
Component: components/BottomNav.tsx
Props: active ("home" | "flagged" | "my-shelf" | null), flaggedCount (number, optional)
Tabs: Home (/) · Visit List (/flagged) · My Shelf (/my-shelf)
Icons: Home, Bookmark, Store (lucide-react) — size 21, strokeWidth 1.7
Active state: green pill (rgba(30,77,43,0.10)) behind icon + bold label (600)
Badge: green dot on Visit List tab, shown only when flaggedCount > 0, capped at 9+
Active tab key: "home" · "flagged" · "my-shelf" · null (sub-pages e.g. /find/[id])
```

### Bookmarking / Visit List system
```
Storage key: treehouse_bookmark_{postId} = "1"
Storage layer: safeStorage (localStorage → sessionStorage → memory)
Raw localStorage iteration used in: feed loadFollowedIds(), Visit List loadFlaggedIds()
BottomNav badge on feed: followedIds.size (loaded on mount)
BottomNav badge on Visit List: posts.length (after Supabase fetch)
Unbookmarking: safeStorage.removeItem(key) — removes from all layers
Icon: Bookmark (lucide-react) — filled when saved, outline when not
Terminology: "Save to Visit List" / "Saved to Visit List" (not "Flag" anywhere in ecosystem)
```

### My Shelf grid layout
```
Uniform 3×3 grid — 9 slots total:
  gridTemplateColumns: repeat(3, 1fr)
  gridTemplateRows: repeat(3, 1fr)
  Gap: 6px. Border-radius: 10px per tile.
Empty slots: #dedad2 bg, ImagePlus icon (18px, 22% opacity), "Add" 9px uppercase → /post
Sold tiles: "Unavailable" frosted overlay badge
Page uses height:100dvh + overflow:hidden — everything fits one screen, no scroll.
Watermark rule: hairline + mall name + hairline between grid and Share CTA.
```

### Visit List page layout
```
Header: Georgia 22px 700 "Your Visit List" + italic Georgia 13px subtitle
Booth section headers: green pill (monospace 11px 700) + italic Georgia 13px vendor name
Item rows: 64×64 thumbnail, Georgia 14px 600 title, monospace price, ChevronRight
  - Padding: 13px 14px, borderRadius 16, layered shadow
"Share your Shelf" CTA: fixed above BottomNav, green, disabled (unwired), Georgia 15px 600
```

### Detail page layout order
```
1. Full-bleed image (overflow: visible on wrapper when hasPrice)
   - "Unavailable" badge top-left — only when status=sold
   - Bookmark + Share buttons bottom-right (36px circles, blur backdrop)
   - BoothTag bottom-left — hangs on string from photo edge (only when price_asking != null)
   - Hero wrapper: marginBottom: hasPrice ? 36 : 0
2. Title (Georgia 26px 700, letterSpacing -0.5px)
3. Price + availability inline: "$325 · ● Available" (monospace price, green dot + label)
4. Caption (italic Georgia 15px, lineHeight 1.85) + description (13px)
5. [hairline — only if shelf has items] + "View the shelf" horizontal scroll
6. "Find this here" label + card (borderRadius 14, layered shadow):
     Mall name (Georgia 14px 700) + address link
     [divider]
     Vendor name (Georgia 13px 600) + booth pill (monospace, inline)
     Facebook link (below vendor name, if present)
     "Save to Visit List" / "Saved to Visit List" Georgia button (everyone)
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
  - Hole punch: 8px circle, absolute top: -1.5px left: 13px
  - "In-Booth" label: 8px uppercase, 1.8px letter-spacing, textMuted
  - Price: 20px bold monospace, textPrimary
Placement: position absolute, bottom: -28, left: 20 inside hero div
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
- vendor_id only carried over in LocalVendorProfile if mall_id unchanged
- Supabase client uses placeholder URL at build time to avoid prerender crash
- `createVendor` handles 23505 duplicate key by fetching existing row — do not revert this
- Always use `safeStorage` (not raw `localStorage`) in ecosystem client components, EXCEPT:
  - Feed's `loadFollowedIds()` reads raw `localStorage` directly (needs key iteration)
  - Visit List's `loadFlaggedIds()` reads raw `localStorage` directly (same reason)
  - Feed scroll restoration uses raw `sessionStorage` (ephemeral tab state)
- `ShelfSection` accepts `onReady(hasItems: boolean)` callback — parent uses this to conditionally render the hairline separator
- Bookmarking uses `safeStorage` with key `treehouse_bookmark_${postId}`. Value "1" = saved
- Owner detection checks `data.vendor_id ?? data.vendor?.id` against `profile.vendor_id` — do not simplify
- Vercel project is under `david-6613s-projects` scope, NOT `zen-forged`
- Vercel GitHub webhook has been unreliable — if push doesn't deploy, use `npx vercel --prod`
- Always provide a git commit/push bash command after every code change
- MINIMUM font size: 10px everywhere. Never ship 9px or smaller as readable UI labels.
- Sold state label is "Unavailable" everywhere — never "Sold" in the ecosystem layer
- **framer-motion**: `motion.div` cannot have two `transition` props — TypeScript error at build time. Always merge `whileTap` transition into the single `transition` prop.
- **Terminology**: "Save/Saved" not "Flag/Flagged" in all ecosystem-facing copy. Storage key stays `treehouse_bookmark_*` — do not rename keys (would break existing saves).

---

## WORKING ✅
- Discovery feed — masonry (50% dynamic offset), mall dropdown (hidden ≤1 mall), no prices on tiles
- **Feed tile text bands** — Georgia title + monospace booth attribution below every image
- **Mall Hero Card** — full-width hero at top of feed, 5 gradient styles, AnimatePresence cross-fade
- Feed section label: italic Georgia question copy ("What did you find today?")
- Feed scroll position saved/restored via sessionStorage on back navigation
- Skeleton loading matches live grid including text band
- Sold items in feed: 0.60 opacity + grayscale + "Unavailable" badge
- Bookmarked items in feed: green Bookmark circle at bottom-right of tile image
- Fixed bottom nav — Home + Visit List + My Shelf tabs, Bookmark icon, active state, count badge
- **Visit List** (`/flagged`) — "Your Visit List" header (Georgia 22px), italic subtitle, grouped by booth,
  ChevronRight rows, price shown, "Share your Shelf" CTA fixed above BottomNav
- **My Shelf** — 3×3 uniform 9-tile grid, identity header (19px vendor name, 12px mono booth),
  empty Add Find tiles → /post, "Unavailable" sold overlay, watermark rule, "Share my shelf" CTA
- `getPostsByIds` batch query in lib/posts.ts
- Find detail: full-bleed image, booth tag price hanging from photo, bookmark/share bottom-right
- **Price surfaced on detail page**: `$325 · ● Available` inline below title
- **"Save to Visit List"** / "Saved to Visit List" — Georgia button in "Find this here" card
- BoothTag: string + hole punch + "In-Booth" label + formatted price
- "View the shelf" — horizontal scroll, hides if empty, hairline conditional
- Vendor name + booth number inline in "Find this here" card (Georgia 14px 700 mall name)
- Owner: "Mark as sold" / "Mark as available" toggle (Supabase write)
- Owner bottom section: "Mark as sold" ghost btn + "Delete post" ghost btn + confirmation
- Vendor profile: Facebook link, light theme, available/Unavailable grid
- Mall profile: grid, directions, available/sold split
- Post flow: capture → AI title + caption → preview → publish
- Image upload to Supabase Storage
- safeStorage fallback for Safari private/ITP
- Admin page: local profile inspector, bulk delete, nuke all
- **Premium design system**: warmer `#f5f2eb` parchment bg, Georgia throughout, layered shadows,
  blur(24px) headers, 16px border-radius cards, consistent warm token set
- All reseller intel routes (untouched, dark theme)

## KNOWN GAPS ⚠️
- "Share your Shelf" / "Share my shelf" CTAs are unwired (disabled buttons) — next sprint
- Inline unsave from Visit List rows not yet implemented
- Price field missing from post creation flow (`/post` + `/post/preview`)
- Directions affordance missing from "Find this here" mall address (tap address → Maps works; dedicated button not added)
- `/enhance-text` is mock (not real Claude)
- No Supabase RLS / auth yet
- No pull-to-refresh on feed
- No PWA support
- Delete button missing on posts created before `vendor_id` was stored in local profile
- Optional hero columns not yet added to malls table in Supabase (hero works without them)

---

## DESIGN AUDIT FINDINGS (for reference)
Completed audit 2026-04-08. 9 findings across 4 categories.

### Typography (Day 1–2 — DONE ✅)
- 6px text was unreadable — restored all labels to 10px+
- Inconsistent title scale — fixed across all pages

### Hierarchy (Day 1–2 — DONE ✅)
- Home header wordmark now dominates at 16px Georgia
- My Shelf vendor name 19px dominates 12px booth box
- Visit List (Flagged) icon circle removed, title is sole anchor

### UX / Clarity (Day 3–4 — PARTIAL)
- "Flag" → "Save/Visit List" terminology — DONE ✅
- Mall dropdown hidden when ≤1 mall — DONE ✅
- "Share my shelf" / "Share your Shelf" — unwired CTA placed ✅, wiring PENDING
- Inline unsave from Visit List — PENDING

### Consistency (Day 5 — PARTIAL)
- Sold label unified to "Unavailable" everywhere — DONE ✅
- Georgia serif applied consistently across ecosystem — DONE ✅
- Warmer palette unified across all pages — DONE ✅
- Bottom padding formula documented — DONE ✅

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

# Add hero columns to malls table (optional — hero works without them)
# Run in Supabase SQL editor:
# ALTER TABLE malls ADD COLUMN IF NOT EXISTS hero_title text;
# ALTER TABLE malls ADD COLUMN IF NOT EXISTS hero_subtitle text;
# ALTER TABLE malls ADD COLUMN IF NOT EXISTS hero_style text;
# ALTER TABLE malls ADD COLUMN IF NOT EXISTS hero_image_url text;
```
