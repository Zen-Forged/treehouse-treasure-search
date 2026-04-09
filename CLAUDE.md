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

**Status:** ✅ Day 2 UI/UX sprint complete. Naming, icons, badge sync, hero copy, nav padding, and "Your Finds" rename all shipped and deployed.

**What was done (this session):**

### Sprint A — Home page
- Wordmark: "Treehouse Local Finds" → **"Treehouse Finds"** (single line, same Georgia 16px 700, no subtext)
- Removed "Post a find" button from home header
- Badge: `minWidth: 16` + auto-width — "9+" fits cleanly, capped at "9+" display
- Badge source fixed: now reads raw `localStorage` key count — same source of truth across all tabs
- Feed no-reload on back-navigate: `hasFetched = useRef(false)` guard — posts only fetched once per session
- Section label: "What did you find today?" → **"What will you find today?"**
- Added `window.addEventListener("focus")` to reload bookmark counts when returning from other pages

### Sprint B — Visit List → "Your Finds"
- Renamed everywhere: BottomNav tab, page header, empty state, CTA, aria-labels
- URL stays `/flagged` — storage keys unchanged
- Booth section header redesigned as slim **VendorBanner** — full-width dark forest gradient, vendor name left, booth pill right. No image. Matches MallHeroCard aesthetic.
- CTA: "Share your Shelf" → **"Share your finds"**
- Badge and row count now both use raw `localStorage` count (consistent with home)
- `window.addEventListener("focus")` re-fetches on tab return

### Sprint C — My Shelf
- Removed mall text watermark from hairline divider (now clean hairline only)
- Added "Post a find" button to header (top-right, green pill, enabled for testing)
- Header redesigned to match home page pattern: logo + "My Shelf" wordmark left, button right
- Vendor name becomes italic Georgia 13px subtitle; booth is inline green pill

### Sprint D — Bottom nav iOS padding
- `paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)"` — adds 10px above safe area, icons lift off home indicator

### Sprint E — MallHeroCard / GenericMallHero
- Eyebrow: "Welcome to" → **"Treehouse Finds"**
- Title: **"What will you find today?"**
- Subtitle: **"Found across Kentucky's antique malls. A closer look at what's worth the trip."**

### Sprint F — PiLeaf icon (`react-icons`)
- Installed `react-icons` package
- Created `components/PiLeafIcon.tsx` — thin wrapper around `import { PiLeaf } from "react-icons/pi"`
- Replaced `Bookmark` icon with `PiLeafIcon` in: BottomNav, flagged page (empty state + thumbnail fallback), find detail page (photo button + "Save to Your Finds" button)
- Feed tile saved indicator: replaced inline SVG bookmark path with `<PiLeafIcon size={12} />` in the green pill
- "Save to Visit List" / "Saved to Visit List" → **"Save to Your Finds"** / **"Saved to Your Finds"**

**Previous sessions:**
- Branded Experience Sprint — 3-page overhaul (warmer parchment, Georgia, layered shadows)
- Mall Identity Layer (Sprint 1) — MallHeroCard shipped
- Design audit 9 findings — Day 1–2 typography/hierarchy fixes
- My Shelf concept C alternating layout (reverted to 3×3)
- Flagged page grouped by booth with "Booth N" headers
- 3-tab BottomNav
- BoothTag price → BoothBox (clean rectangle, "Found In-Booth" + booth number, no price/string)
- Admin page + bulk delete
- safeStorage iPhone Safari bug fix

**Next session starting point:**
1. QA on device — PiLeaf icon across all surfaces, badge sync, hero copy, "Your Finds" rename
2. Wire "Share your finds" / "Share my shelf" CTAs (native share sheet or URL copy)
3. Inline unsave from Your Finds rows (swipe or tap affordance)
4. Price field missing from post creation flow (`/post` + `/post/preview`)
5. Optional Supabase hero columns (hero works without them):
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
- **Extra column:** vendors table has `facebook_url text` (added via SQL)
- **Unique constraint:** `vendors_mall_booth_unique` on `(mall_id, booth_number)`

---

## ROUTE MAP

### Ecosystem (warm parchment theme)
```
/                   Discovery feed — masonry, Mall Hero Card at top, mall dropdown (hidden if ≤1 mall),
                    tile text bands (Georgia title + booth attribution), PiLeaf saved indicators on tiles
/find/[id]          Find detail — full-bleed image, BoothBox bottom-left (booth number, no price),
                    PiLeaf save + share buttons bottom-right of photo, BottomNav (no active tab),
                    price inline below title, "View the shelf" scroll, "Find this here" card,
                    "Save to Your Finds" button, owner actions (mark sold + delete)
/flagged            Your Finds — grouped by booth (VendorBanner: gradient, vendor name + booth pill),
                    ChevronRight affordance, "Share your finds" CTA at bottom
/my-shelf           My Shelf — 3×3 uniform 9-tile grid, logo + "My Shelf" wordmark header,
                    "Post a find" button top-right, vendor italic subtitle + booth pill,
                    hairline divider, "Share my shelf" CTA
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
components/BottomNav.tsx      Fixed bottom nav — Home · Your Finds · My Shelf tabs, active state, badge
                              Icons: Home (lucide), PiLeafIcon, Store (lucide)
components/PiLeafIcon.tsx     Thin wrapper: import { PiLeaf } from "react-icons/pi"
                              Props: size, strokeWidth, style, className — matches lucide API
components/MallHeroCard.tsx   Mall Identity Hero — MallHeroCard + GenericMallHero exports
                              GenericMallHero: eyebrow "Treehouse Finds", Kentucky copy
app/layout.tsx                No max-width wrapper — each page owns its own width
app/page.tsx                  Discovery feed — MallHeroCard, tile text bands, PiLeaf saved dot,
                              hasFetched guard (no re-fetch on back-nav), focus bookmark sync
app/flagged/page.tsx          Your Finds — VendorBanner grouped by booth, PiLeaf icon,
                              "Share your finds" CTA, raw localStorage badge count
app/my-shelf/page.tsx         My Shelf — 3×3 grid, home-style header, "Post a find" btn, hairline
app/find/[id]/page.tsx        Find detail — BoothBox, PiLeaf save button, "Save to Your Finds"
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
Section headers / page titles: 16–22px Georgia 700
  - Feed section label: italic Georgia 15px
  - Your Finds header: Georgia 22px 700
  - My Shelf wordmark: 16px Georgia 700 (matches home)
  - My Shelf vendor subtitle: italic Georgia 13px
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
react-icons/pi: PiLeaf — used as the "Your Finds" / save icon throughout ecosystem
  - BottomNav "Your Finds" tab
  - Feed tile saved indicator (green pill, bottom-right of image)
  - Find detail: photo save button (circle, dark/green bg)
  - Find detail: "Save to Your Finds" / "Saved to Your Finds" button in card
  - Your Finds page: empty state icon, thumbnail fallback icon
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
Bottom nav padding: calc(env(safe-area-inset-bottom, 0px) + 10px) — 10px extra above safe area
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
No price badges on tiles. Sold items: 0.60 opacity + grayscale + "Unavailable" badge.
Saved items: 22px green circle, PiLeafIcon size=12 white, bottom-right of tile image.
Tile text band: Georgia 12px 600 title (2-line clamp) + monospace 10px booth attribution.
Section label: italic Georgia 15px "What will you find today?" + count right.
hasFetched guard: posts only fetched once per React mount — no re-fetch on back-navigate.
Bookmark sync: loadFollowedIds() on mount + window "focus" event.
```

### Bottom navigation
```
Component: components/BottomNav.tsx
Props: active ("home" | "flagged" | "my-shelf" | null), flaggedCount (number, optional)
Tabs: Home (/) · Your Finds (/flagged) · My Shelf (/my-shelf)
Icons: Home (lucide) · PiLeafIcon · Store (lucide) — size 21
Active state: green pill behind icon + bold label (600)
Badge: green rounded pill on Your Finds tab, minWidth 16, auto-width for "9+", cap 99+
Bottom padding: calc(env(safe-area-inset-bottom, 0px) + 10px) — icons lifted off iPhone home bar
```

### Save / "Your Finds" system
```
Storage key: treehouse_bookmark_{postId} = "1"  ← key name unchanged, do not rename
Storage layer: safeStorage (localStorage → sessionStorage → memory)
Raw localStorage iteration used in: feed loadFollowedIds(), Your Finds loadFlaggedIds()
Badge count source: raw localStorage key iteration — same function on all pages
Terminology: "Save to Your Finds" / "Saved to Your Finds"
Icon: PiLeafIcon everywhere (not Bookmark)
```

### Your Finds page layout
```
Header: Georgia 22px 700 "Your Finds" + italic Georgia 13px subtitle
VendorBanner: full-width gradient (bannerFrom #1e3d24 → bannerTo #2d5435), borderRadius 14,
  noise texture overlay (opacity 0.04), vendor name Georgia 15px 700 left,
  booth label+pill right (rgba white 0.12 bg, monospace 13px 700)
Item rows: 64×64 thumbnail (PiLeaf fallback), Georgia 14px 600 title, monospace price, ChevronRight
  borderRadius 14, layered shadow
"Share your finds" CTA: fixed above BottomNav, green, disabled (unwired), Georgia 15px 600
```

### My Shelf header (updated)
```
Matches home page pattern:
  Top row: logo (24px) + "My Shelf" Georgia 16px 700 left | "Post a find" green pill right
  Subtitle row: vendor name italic Georgia 13px left | "Booth N" green pill right
  Count row (if posts): "X available · Y sold" italic Georgia 11px | "N / 9" uppercase faint
```

### Detail page layout order
```
1. Full-bleed image
   - "Unavailable" badge top-left — only when status=sold
   - PiLeaf save + Share2 buttons bottom-right (36px circles, blur backdrop)
     PiLeaf: strokeWidth 1.8 unsaved / 2.2 saved, greenSolid bg when saved
   - BoothBox bottom-left — clean rectangle, "Found In-Booth" 8px label + booth number 16px mono
     marginBottom on wrapper: hasBoothBox ? 34 : 0
2. Title (Georgia 26px 700)
3. Price + availability: "$325 · ● Available" (monospace price, green pulsing dot)
4. Caption (italic Georgia 15px, lineHeight 1.85) + description (13px)
5. [hairline if shelf has items] + "View the shelf" horizontal scroll
6. "Find this here" label + card:
     Mall name (Georgia 14px 700) + address link
     Vendor name + booth pill
     Facebook link (if present)
     "Save to Your Finds" / "Saved to Your Finds" Georgia button with PiLeafIcon
7. Owner actions: "Mark as sold/available" + "Delete post" → confirmation
8. BottomNav (active={null})
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
  - Your Finds' `loadFlaggedIds()` reads raw `localStorage` directly (same reason)
  - Feed scroll restoration uses raw `sessionStorage` (ephemeral tab state)
- Badge count must always use raw localStorage key iteration — NOT `posts.length` (Supabase count diverges if a post is deleted)
- `ShelfSection` accepts `onReady(hasItems: boolean)` callback — parent uses this to conditionally render the hairline separator
- Bookmarking uses `safeStorage` with key `treehouse_bookmark_${postId}`. Value "1" = saved. DO NOT rename keys.
- Owner detection checks `data.vendor_id ?? data.vendor?.id` against `profile.vendor_id` — do not simplify
- Vercel project is under `david-6613s-projects` scope, NOT `zen-forged`
- Vercel GitHub webhook has been unreliable — if push doesn't deploy, use `npx vercel --prod`
- Always provide a git commit/push bash command after every code change
- MINIMUM font size: 10px everywhere. Never ship 9px or smaller as readable UI labels.
- Sold state label is "Unavailable" everywhere — never "Sold" in the ecosystem layer
- **framer-motion**: `motion.div` cannot have two `transition` props — TypeScript error at build time. Always merge `whileTap` transition into the single `transition` prop.
- **react-icons**: `PiLeaf` from `react-icons/pi` — use via `components/PiLeafIcon.tsx` wrapper everywhere. Do not import directly in pages (keeps swap easy).

---

## WORKING ✅
- Discovery feed — masonry, no prices, PiLeaf saved indicator, mall dropdown, no re-fetch on back-nav
- **Feed section label**: italic Georgia "What will you find today?"
- **MallHeroCard / GenericMallHero**: Kentucky copy, "Treehouse Finds" eyebrow, updated title
- Feed scroll position saved/restored via sessionStorage
- Bookmark badge: raw localStorage count, synced on focus across all pages
- **Your Finds** (`/flagged`) — "Your Finds" header, VendorBanner sections, PiLeaf icon,
  "Share your finds" CTA, badge from raw localStorage
- **My Shelf** — 3×3 grid, home-style header (logo + wordmark + "Post a find" btn), hairline, Share CTA
- **BottomNav**: Home · Your Finds · My Shelf, PiLeafIcon tab, iOS bottom padding fixed
- Find detail: BoothBox (clean rect, "Found In-Booth" + booth number), PiLeaf save button,
  "Save to Your Finds" / "Saved to Your Finds"
- Price surfaced inline below title on detail page
- "View the shelf" — horizontal scroll, hides if empty
- Owner: mark sold/available toggle, delete with confirmation
- Post flow: capture → AI title + caption → preview → publish
- Image upload to Supabase Storage
- safeStorage fallback for Safari private/ITP
- Admin page: local profile inspector, bulk delete
- All reseller intel routes (untouched, dark theme)

## KNOWN GAPS ⚠️
- "Share your finds" / "Share my shelf" CTAs are unwired (disabled buttons) — next sprint
- Inline unsave from Your Finds rows not yet implemented
- Price field missing from post creation flow (`/post` + `/post/preview`)
- `/enhance-text` is mock (not real Claude)
- No Supabase RLS / auth yet
- No pull-to-refresh on feed
- No PWA support
- Delete button missing on posts created before `vendor_id` was stored in local profile
- Optional hero columns not yet added to malls table in Supabase (hero works without them)

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
