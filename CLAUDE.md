# Treehouse — Claude Working Instructions
> Repo: Zen-Forged/treehouse-treasure-search | Live: treehouse-treasure-search.vercel.app
> Full architecture: CONTEXT.md | Working protocol: MASTER_PROMPT.md

---

## HOW TO START A NEW SESSION

1. Start a new chat at claude.ai
2. Run in Terminal: `cat /Users/davidbutler/Projects/treehouse-treasure-search/CLAUDE.md`
3. Paste this into the new chat:

```
PROJECT: Treehouse — Zen-Forged/treehouse-treasure-search — treehouse-treasure-search.vercel.app
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md and CONTEXT.md. Then run the session opening standup from MASTER_PROMPT.md.

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

**Status:** ✅ Full session complete. MASTER_PROMPT.md created, Share my shelf wired, anonymous auth sprint done end-to-end.

**What was done (this session):**

### MASTER_PROMPT.md
- Created `/MASTER_PROMPT.md` — session standup format, working conventions, sprint brief format, sub-agent dispatch, architecture quick reference, platform gotchas, session close protocol.

### Share My Shelf
- `app/my-shelf/page.tsx` — "Share shelf" ghost button in the count row (right side).
- Triggers `navigator.share()` with vendor URL `/vendor/${slug}`, vendor name, and mall name.
- Clipboard fallback: copies URL and shows animated "Copied!" pill for 2.2s.
- Button hidden if vendor has no slug (older profiles without slug stored).
- Uses `AnimatePresence` to transition between share button and copied state.
- Added `BASE_URL` constant, `Share2` + `Check` icons imported.

### Anonymous Auth Sprint (complete end-to-end)
- **`lib/auth.ts`** — new file. `ensureAnonSession()`: calls `supabase.auth.signInAnonymously()` if no session exists, caches uid in `localStorage("treehouse_auth_uid")`. `getCachedUserId()`: synchronous read from cache. `isSessionOwner()`: async session check (unused in current flow but available).
- **`types/treehouse.ts`** — `LocalVendorProfile` now has `user_id?: string` field.
- **`app/post/page.tsx`** — calls `ensureAnonSession()` on mount, stores `user_id` in profile. `saveProfile()` always carries `user_id` forward (not tied to identity — session-based).
- **`app/post/preview/page.tsx`** — `handlePublish` gets/establishes `user_id` before `createVendor`, passes `user_id` to `createVendor()` so it gets written to `vendors.user_id` in Supabase.
- **`app/find/[id]/page.tsx`** — replaced raw localStorage comparison with `detectOwnership()` function. Priority: (1) session uid matches `post.vendor.user_id`, (2) localStorage `vendor_id` matches `post.vendor_id` (backwards compat for older posts). Cleaner, harder to spoof.

**Auth flow summary (full chain):**
```
/post mounts → ensureAnonSession() → uid cached in localStorage
↓
saveProfile() → uid stored in LocalVendorProfile
↓
/post/preview handlePublish → createVendor({ user_id: uid }) → vendors.user_id = uid in Supabase
↓
/find/[id] loads → detectOwnership() checks session uid vs post.vendor.user_id → isMyPost = true
↓
showOwnerControls = isMyPost && isCurator (mode gate still applies)
```

**Previous sessions:**
- Demo-ready sprint — feed filter, mode system, Your Finds fixes, My Shelf vendor picker, owner controls gated to Curator mode
- Day 3 UI/UX sprint — Found badge centering, leaf unsave, My Shelf sections, header font unification
- Day 2 UI/UX sprint — PiLeaf icons, badge sync, hero copy, "Your Finds" rename, iOS nav padding
- Branded Experience Sprint — 3-page overhaul (warmer parchment, Georgia, layered shadows)
- Mall Identity Layer — MallHeroCard shipped
- safeStorage iPhone Safari bug fix
- Admin page + bulk delete

**Next session starting point:**
1. QA on device — open `/post`, complete a post flow, check Supabase `vendors.user_id` is populated
2. Check `detectOwnership` works: in Curator mode, owner controls should appear on your own posts
3. Check Share shelf works on device (native share sheet should trigger)
4. Verify stale bookmark pruning on Your Finds — console log should show ID counts
5. Pull-to-refresh on feed (deferred — next sprint candidate)
6. Supabase RLS policies — now that `user_id` is on vendor rows, RLS is feasible (future sprint)
7. Optional Supabase hero columns (hero works without them)

---

## PROJECT OVERVIEW

**Two independent layers:**
1. **Ecosystem** (front door, warm parchment theme): feed, vendor profiles, mall pages, post flow → Supabase
2. **Reseller intel** (dark forest theme, untouched): scan → identify → comps → decide → localStorage only

---

## STACK
```
Next.js 14 App Router · TypeScript · Tailwind CSS · Framer Motion
Anthropic SDK (claude-opus-4-5) · Supabase (Postgres + Storage + Auth) · SerpAPI · Vercel
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
- **Auth:** Anonymous sessions enabled — `supabase.auth.signInAnonymously()`
- **Only mall:** America's Antique Mall, id: `19a8ff7e-cb45-491f-9451-878e2dde5bf4`
- **Known vendor:** ZenForged Finds, booth 369, id: `65a879f1-c43c-481b-974f-379792a36db8`
- **Extra columns:** vendors table has `facebook_url text`, `user_id uuid` (nullable — linked to anon auth)
- **Unique constraint:** `vendors_mall_booth_unique` on `(mall_id, booth_number)`

---

## ROUTE MAP

### Ecosystem (warm parchment theme)
```
/                   Discovery feed — masonry, Mall Hero Card at top, mall dropdown (hidden if ≤1 mall),
                    tile text bands, PiLeaf saved indicators, ModeToggle (Explorer/Curator) in header.
                    ONLY available posts shown — sold filtered at query level.
/find/[id]          Find detail — full-bleed image, centered "Found" badge on hero (sold),
                    BoothBox bottom-left, PiLeaf save + share buttons bottom-right,
                    "View the shelf" horizontal scroll, "Find this here" card.
                    "Save to Your Finds" — Explorer mode only.
                    Owner controls (mark sold, delete) — Curator mode + session ownership only.
/flagged            Your Finds (Explorer) — grouped by booth, sorted by availability then booth number,
                    instant unsave, stale bookmark pruning, all-found banner state.
/my-shelf           My Shelf (Curator) — vendor picker for multi-vendor malls, Available + Found grids,
                    Found tiles linked, Add tile, "Share shelf" button in count row.
/mall/[slug]        Mall profile
/vendor/[slug]      Vendor profile — Facebook link, available/sold grid
/post               Vendor capture — camera/gallery, profile setup.
                    ensureAnonSession() on mount. Clears vendor_id when name/booth changes.
/post/preview       Edit title/caption/price → publish.
                    Passes user_id to createVendor() to link session to vendor row.
/admin              Admin: local profile inspector + bulk post/image delete
```

### Reseller intel (dark theme — do not touch)
```
/scan → /discover → /refine → /decide → /intent → /enhance-text → /share
/finds, /finds/[id]
```

### API
```
POST /api/post-caption      Claude → { title, caption }
POST /api/identify          Claude Vision → { title, description, confidence, searchQuery }
GET  /api/sold-comps        SerpAPI eBay comps, 48h cache
GET  /api/debug             Supabase connectivity test
GET  /api/admin/posts       All posts with vendor info
DELETE /api/admin/posts     Bulk delete posts + storage images
```

---

## KEY FILES
```
lib/supabase.ts               Client with placeholder fallback for build time
lib/auth.ts                   Anonymous session management:
                                ensureAnonSession() → signInAnonymously, caches uid
                                getCachedUserId() → sync read from localStorage cache
                              localStorage key: treehouse_auth_uid
lib/mode.ts                   Explorer/Curator mode — getMode(), setMode(), toggleMode()
                              localStorage key: treehouse_mode = "explorer" | "curator"
lib/posts.ts                  getFeedPosts (available only), getPost, getPostsByIds (no filter),
                              getVendorPosts, getMallPosts (available only),
                              getVendorsByMall, createPost, createVendor (+ user_id),
                              uploadPostImage, updatePostStatus, deletePost,
                              getAllMalls, getMallBySlug, getVendorBySlug, slugify
lib/postStore.ts              In-memory image store for /post → /post/preview
lib/safeStorage.ts            localStorage wrapper with sessionStorage + memory fallback
types/treehouse.ts            Post, Vendor, Mall, LocalVendorProfile (+ user_id field), PostStatus
components/BottomNav.tsx      Mode-aware: Explorer→Home+YourFinds, Curator→Home+MyShelf
components/ModeToggle.tsx     Animated pill in feed header — "Explorer" / "Curator"
components/PiLeafIcon.tsx     PiLeaf from react-icons/pi wrapper
components/MallHeroCard.tsx   MallHeroCard + GenericMallHero exports
app/layout.tsx                No max-width wrapper
app/page.tsx                  Discovery feed — available-only, ModeToggle in header
app/flagged/page.tsx          Your Finds — instant unsave, stale pruning, sorted groups
app/my-shelf/page.tsx         My Shelf — vendor picker, Share shelf button, Available+Found grids
app/find/[id]/page.tsx        Find detail — detectOwnership() (session uid + vendor_id fallback)
app/post/page.tsx             Capture — ensureAnonSession() on mount, user_id in profile
app/post/preview/page.tsx     Preview + publish — user_id → createVendor() → vendors.user_id
app/admin/page.tsx            Admin UI
app/api/admin/posts/route.ts  Admin API
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

### Typography scale
```
MINIMUM font size: 10px everywhere
Section headers / page titles: 22px Georgia 700 — home, flagged, my-shelf
Body / tile titles: Georgia 12–14px
Captions: 15px italic Georgia, lineHeight 1.85
Empty state headers: Georgia 20px 700
Georgia for: all headers, titles, captions, italic labels, CTA buttons, empty states
System UI for: BottomNav labels, dropdown options, monospace data
```

### Explorer / Curator mode system
```
treehouse_mode = "explorer" | "curator"  (localStorage, default: "explorer")
lib/mode.ts: getMode(), setMode(), toggleMode()
ModeToggle pill in feed header → navigates to correct second tab on switch
BottomNav re-reads on mount + focus + storage event

Explorer: Home · Your Finds | Save button on find detail | owner controls hidden
Curator:  Home · My Shelf   | Save button hidden | owner controls if isMyPost
```

### Auth system
```
treehouse_auth_uid  (localStorage cache of Supabase anon session uid)
lib/auth.ts: ensureAnonSession(), getCachedUserId()
Supabase Auth: anonymous sign-in on first /post visit
vendors.user_id: populated on createVendor(), used for ownership detection

Owner detection in find/[id]:
  detectOwnership(post) checks:
  1. getCachedUserId() === post.vendor.user_id  (session-based, primary)
  2. profile.vendor_id === post.vendor_id        (localStorage fallback, legacy)
```

### Bottom navigation
```
Mode-aware tabs (re-syncs on mount + focus + storage event):
  Explorer: Home (/) · Your Finds (/flagged) — badge on Your Finds
  Curator:  Home (/) · My Shelf (/my-shelf)  — no badge
Icons: Home (lucide) · PiLeafIcon · Store (lucide) — size 21
Active: green pill + bold label. Badge: green pill, cap 99+.
Bottom padding: calc(env(safe-area-inset-bottom, 0px) + 10px)
```

### Save / "Your Finds" system
```
Storage key: treehouse_bookmark_{postId} = "1"  ← never rename
Storage layer: safeStorage (localStorage → sessionStorage → memory)
Raw localStorage iteration for: feed bookmark sync, Your Finds loadFlaggedIds()
Stale pruning: pruneStaleBookmarks() runs after getPostsByIds — auto-removes dead IDs
Unsave: instant on Your Finds rows (e.stopPropagation())
```

### My Shelf — Share shelf
```
Button: ghost pill in count row (right side) — Share2 icon + "Share shelf" label
URL: https://treehouse-treasure-search.vercel.app/vendor/${activeVendor.slug ?? profile.slug}
Payload: navigator.share({ title: "${name} on Treehouse", text: "...", url })
Fallback: clipboard copy → animated "Copied!" pill (2.2s)
Hidden: if no slug available (older profile without slug)
```

### Detail page — owner controls gate
```
showOwnerControls = isMyPost && isCurator
isMyPost = detectOwnership(post) — session uid check + vendor_id fallback
isCurator = getMode() === "curator" — read on mount
Explorer mode: NEVER shows owner controls regardless of isMyPost
```

---

## RULES & GOTCHAS
- All ecosystem pages need `export const dynamic = "force-dynamic"`
- Never use `export const config = {}` — deprecated in Next.js 14 App Router
- Always use `git add -A` — never individual paths (zsh glob-expands `[slug]`)
- `filesystem:write_file` is the ONLY reliable way to write files
- `str_replace` fails on bracket-path files — always full rewrite for `app/find/[id]/page.tsx`
- `getPostsByIds` has NO status filter — saved finds shown regardless of status
- `getFeedPosts` and `getMallPosts` filter `.eq("status","available")`
- `vendor_id` cleared from LocalVendorProfile when display_name OR booth_number changes
- `user_id` is ALWAYS carried forward in saveProfile() — session-based, not identity-based
- `createVendor` handles 23505 duplicate key, updates user_id if row exists and field is null
- safeStorage in all ecosystem client components EXCEPT raw localStorage for bookmark iteration
- Badge count = raw localStorage key iteration, NOT posts.length
- `groupByBooth` orphan key: `__orphan__${post.id}` (never `__no_vendor__`)
- Supabase anonymous auth must be enabled in project settings for `signInAnonymously()` to work
- Vercel project: `david-6613s-projects` scope (NOT zen-forged)
- Vercel webhook unreliable → `npx vercel --prod` if push doesn't deploy
- framer-motion: never two `transition` props on same motion.div
- Duplicate keys in style objects = TypeScript build error
- MINIMUM font size: 10px

---

## WORKING ✅
- Discovery feed — available-only, masonry, ModeToggle, PiLeaf saved indicator
- MallHeroCard / GenericMallHero — deterministic gradient, AnimatePresence
- Feed scroll save/restore, hasFetched guard
- Your Finds — instant unsave, stale pruning, sorted groups, all-found banner
- My Shelf — vendor picker, Available+Found grids, Found tiles linked, Share shelf
- BottomNav — mode-aware (Explorer/Curator), iOS padding, badge
- ModeToggle — animated pill, navigates on switch
- Find detail — detectOwnership() (session + legacy fallback), Curator-only owner controls
- Post flow — ensureAnonSession() on mount, user_id → vendors.user_id in Supabase
- Share shelf — native share sheet + clipboard fallback
- Anonymous auth — full chain from /post → Supabase → owner detection
- safeStorage Safari fallback
- Admin page, bulk delete
- All reseller intel routes (untouched)

## KNOWN GAPS ⚠️
- Auth QA needed on device — verify vendors.user_id populates and owner detection works
- No Supabase RLS (user_id is now on vendor rows — RLS is now feasible)
- No pull-to-refresh on feed
- No PWA support
- `/enhance-text` is mock
- Delete button missing on posts created before vendor_id was stored in local profile
- Optional hero columns not yet added to malls table

---

## DEBUGGING
```bash
# Live Supabase test
curl -s https://treehouse-treasure-search.vercel.app/api/debug | python3 -m json.tool

# Force deploy
npx vercel --prod

# Build check
npm run build 2>&1 | tail -30

# Always stage everything
git add -A && git commit -m "..." && git push

# Auth debug — check in browser console after visiting /post:
# Should see treehouse_auth_uid in localStorage after mount
# After publishing: check Supabase vendors table for user_id populated

# Your Finds debug — console on device:
# [flagged] localStorage bookmark IDs: N
# [flagged] Supabase returned: M posts
```
