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
> Last updated: 2026-04-14

**Status:** ✅ Sprint 1 complete. Ready to start Sprint 2.

---

## What was done (this session)

### Feed animations
- `app/page.tsx`: scroll-triggered tile reveal via `useScrollReveal` hook (IntersectionObserver) — replaces mount-only Framer Motion animation; tiles below fold animate in as they scroll into view
- `app/page.tsx`: image warmth hover — `brightness(1.04) saturate(1.10) scale(1.018)` on img inside overflow:hidden card shell; card shadow lifts on hover
- `app/page.tsx`: above-fold tiles get stagger delay; below-fold tiles get none (scroll itself provides timing)

### Back-nav scroll anchor
- `app/page.tsx`: on tile tap, writes `post.id` to `sessionStorage` under `LAST_VIEWED_KEY = "treehouse_last_viewed_post"`
- `app/page.tsx`: on return, reads both `SCROLL_KEY` and `LAST_VIEWED_KEY`; scroll restore deferred until after feed loads (loading → false), so full page height exists before `scrollTo` fires
- `app/page.tsx`: `isLastViewed` prop on `MasonryTile` — shows warm green ring (border + box-shadow halo) that fades after 1.6s; uses `pendingScrollY` ref + `scrollRestored` ref to fire only once
- **Root cause of original bug:** scroll restore fired on mount via `rAF` but feed had no DOM height yet (skeleton state). Fix: read keys into refs on mount, fire `scrollTo` in a separate `useEffect` that depends on `loading`

### Sprint 1 shipped
- `app/layout.tsx`: `DevAuthPanel` gated to `NODE_ENV === "development"` only — never renders in production
- `app/post/page.tsx`: AI caption failure fallback — `generateCaption` returns `aiSucceeded` boolean; if false, amber notice shown in editing form: "Couldn't read this image automatically — fill in the title and details below"; `aiCapFailed` state resets on back/retake
- `app/post/page.tsx`: price validation — rejects negative or non-numeric values before save; inline error clears on edit
- `app/post/edit/[id]/page.tsx`: price validation — same guard added to edit flow; `priceError` state with inline red error message
- `types/treehouse.ts`: `Mall` type updated with 7 new columns: `phone`, `website`, `google_maps_url`, `latitude`, `longitude`, `category`, `zip_code`
- Supabase: 29 mall locations seeded from CSV via SQL (confirmed ✅)
- `SPRINT_PLAN.md`: full MVP beta sprint plan written to project root

### Mall seed
- All 29 KY/IN antique mall/flea market locations loaded into Supabase `malls` table
- Schema: added `phone`, `website`, `google_maps_url`, `latitude numeric(10,7)`, `longitude numeric(10,7)`, `category`, `zip_code` columns
- America's Antique Mall row updated in place (matched by slug `americas-antique-mall`)
- `ON CONFLICT (slug) DO UPDATE` — safe to re-run

---

## Next session starting point — Sprint 2

1. **Vendor bio field** — `bio` column exists in DB + is fetched, but no UI to set or display it. Add tap-to-edit on My Shelf hero section; display on public `/shelf/[slug]`
2. **PWA manifest.json** — create `public/manifest.json`, reference in `layout.tsx`. Enables "Add to Home Screen" on iOS/Android
3. **Scroll restore QA** — test deferred scroll restore on iPhone Safari + Chrome Android. Edge case: returning from detail page when mall filter is active
4. **Hero image upload size guard** — add `file.size > 12MB` check before upload attempt in `app/my-shelf/page.tsx`
5. **Feed content seeding** — post 10–15 real items with quality photos across 2–3 vendors before beta invite
6. **Feedback mechanism** — add Tally.so "Send feedback" link somewhere accessible (bottom of My Shelf or admin page)

### Sprint 3 (after Sprint 2)
- Vendor bio edit via admin (`/vendor/[slug]` page)
- Error monitoring (Vercel logs or Sentry free tier)
- Rate limiting on `/api/post-caption`
- Admin PIN production QA (confirm `ADMIN_PIN` + `SUPABASE_SERVICE_ROLE_KEY` in Vercel env vars)

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
lucide-react (Heart replaces PiLeaf everywhere in ecosystem UI)
```

---

## ENV VARS
```
NEXT_PUBLIC_SUPABASE_URL         https://zogxkarpwlaqmamfzceb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY    eyJhbGci... (full JWT — in .env.local and Vercel)
NEXT_PUBLIC_ADMIN_EMAIL          david@zenforged.com
NEXT_PUBLIC_DEV_VENDOR_EMAIL     vendor@test.com (optional — dev panel vendor test email)
ANTHROPIC_API_KEY                Claude Vision + caption generation
SERPAPI_KEY                      eBay sold comps
ADMIN_PIN                        Server-only PIN for admin login (set in .env.local + Vercel)
SUPABASE_SERVICE_ROLE_KEY        Server-only service role key (set in .env.local + Vercel)
```

---

## SUPABASE
- **Tables:** malls, vendors, posts — RLS DISABLED on all three
- **Storage bucket:** post-images — PUBLIC
- **Auth:** Magic link (OTP) via email — `supabase.auth.signInWithOtp()`
- **Malls:** 29 locations seeded (KY + Clarksville IN) — slug unique constraint: `malls_slug_key`
- **Primary mall:** America's Antique Mall, id: `19a8ff7e-cb45-491f-9451-878e2dde5bf4`, slug: `americas-antique-mall`
- **Known vendors:**
  - ZenForged Finds, booth 369, id: `65a879f1-c43c-481b-974f-379792a36db8` — user_id SET ✅
  - Zen booth (admin default), id: `5619b4bf-3d05-4843-8ee1-e8b747fc2d81` — no user_id (admin loads by ID)
- **Extra columns vendors:** `facebook_url text`, `user_id uuid`, `hero_image_url text`, `bio text`
- **Extra columns malls:** `phone text`, `website text`, `google_maps_url text`, `latitude numeric(10,7)`, `longitude numeric(10,7)`, `category text`, `zip_code text`
- **Unique constraint vendors:** `vendors_mall_booth_unique` on `(mall_id, booth_number)`
- **Unique constraint malls:** `malls_slug_key` on `(slug)`

---

## AUTH SYSTEM

### Three tiers
| Tier | How | Can do |
|---|---|---|
| Unauth | No session | Browse feed, find detail, save to My Finds, view Booths → /shelf/[slug] |
| Vendor | Magic link email | Post finds (one booth), My Shelf, mark sold, delete own posts |
| Admin | Magic link OR Admin PIN | Everything + /admin + vendor switcher in My Shelf + Add Booth |

### Key files
- `lib/auth.ts` — `sendMagicLink`, `getSession`, `getUser`, `signOut`, `isAdmin(user)`, `onAuthChange`, `getCachedUserId`, `ensureAnonSession`
- `lib/posts.ts` — `getVendorByUserId(userId)`, `getVendorById(id)` — identity lookups
- `app/login/page.tsx` — Email link tab + Admin PIN tab; BroadcastChannel for cross-tab auth
- `app/api/auth/admin-pin/route.ts` — POST { pin } → generateLink → returns { otp, email }; client calls verifyOtp({ type: "email" })
- `components/DevAuthPanel.tsx` — dev-only floating panel (gated to NODE_ENV === "development" in layout.tsx ✅)

### Identity resolution — My Shelf (authoritative order)
1. `?vendor=[id]` query param — admin override from Shelves page
2. `getVendorByUserId(user.id)` — Supabase source of truth
3. Admin fallback: `getVendorById(ADMIN_DEFAULT_VENDOR_ID)` — Zen booth
4. NoBooth — shown only if all above fail

### Identity resolution — Post page
1. Admin with `?vendor=[id]` param → `getVendorById(vendorParam)` — admin override
2. `getVendorByUserId(user.id)` — Supabase wins if auth
3. localStorage `th_vendor_profile` — cache only
4. Setup form — first-time or unauth

---

## ROUTE MAP

### Ecosystem (warm parchment theme)
```
/                   Discovery feed — masonry, scroll-triggered reveals, warmth hover, back-nav anchor
/login              Magic link login + Admin PIN tab
/find/[id]          Find detail — floating back button, heart+share on image, Save CTA, "Find it here" card, owner controls card (separate)
/flagged            My Finds — no auth required, always in nav
/shelves            Booths — all vendor booths; guest → /shelf/[slug]; admin → manage; Add Booth sheet
/my-shelf           My Shelf (Curator/Admin) — auth-gated; admin gets vendor switcher
/shelf/[slug]       Public Saved Shelf — read-only
/mall/[slug]        Mall profile
/post               Vendor capture — AI caption with fallback notice; price validation; server-route image upload
/post/edit/[id]     Edit listing — price validation; image replacement
/admin              Admin — auth-gated, isAdmin() check, bulk delete
```

### API routes (ecosystem)
```
/api/vendor-hero    POST — server-side banner upload, service role key, bypasses RLS
/api/post-image     POST — server-side post image upload, service role key, bypasses RLS
/api/post-caption   POST — Claude Vision title + caption generation
/api/auth/admin-pin POST — PIN login
/api/debug          GET  — env var status + live Supabase test
```

### Reseller intel (dark theme — do not touch)
```
/scan → /discover → /refine → /decide → /intent → /enhance-text → /share
/finds, /finds/[id]
```

---

## KEY FILES
```
lib/tokens.ts               Single source of truth for all ecosystem colors/spacing/radius
lib/utils.ts                flagKey, BOOKMARK_PREFIX, loadFollowedIds, loadBookmarkCount, vendorHueBg, mapsUrl
lib/auth.ts                 Magic link auth
lib/supabase.ts             Client with placeholder fallback for build time
lib/posts.ts                Data access — all Supabase queries
lib/safeStorage.ts          localStorage wrapper with sessionStorage + memory fallback
types/treehouse.ts          Post, Vendor, Mall (with extended columns), LocalVendorProfile
components/AdminOnly.tsx    Wraps any admin-only UI
components/BottomNav.tsx    4-tab auth / 3-tab guest; Heart icon for My Finds
components/TabSwitcher.tsx  Shared Available/Found a home tab switcher
components/BoothFinderCard.tsx  Shared maps CTA card
components/ExploreBanner.tsx    Shared "View more booths" banner
components/ShelfGrid.tsx    ThreeColGrid, SkeletonGrid, AvailableTile, FoundTile, ShelfGridStyles
components/MallHeroCard.tsx MallHeroCard + GenericMallHero — used in feed header
components/DevAuthPanel.tsx Dev-only floating auth panel (gated in layout.tsx)
app/layout.tsx              DevAuthPanel gated to dev only ✅
app/page.tsx                Feed — scroll-triggered reveals, warmth hover, deferred scroll restore, back-nav anchor
app/flagged/page.tsx        My Finds — timeline grouped by booth
app/shelves/page.tsx        Booths directory
app/my-shelf/page.tsx       My Shelf — hero upload, shared ShelfGrid
app/shelf/[slug]/page.tsx   Public Saved Shelf
app/find/[id]/page.tsx      Find detail — owner controls in separate card
app/post/page.tsx           Capture — AI fallback notice, price validation, scroll cache cleared on publish
app/post/edit/[id]/page.tsx Edit listing — price validation
app/admin/page.tsx          Admin UI
SPRINT_PLAN.md              Full MVP beta sprint plan (4 sprints)
supabase/seeds/             001_mall_locations.sql (reference — already run)
```

---

## DESIGN SYSTEM

### Token import pattern (use everywhere, never redefine locally)
```ts
import { colors } from "@/lib/tokens";
import { flagKey, BOOKMARK_PREFIX, loadBookmarkCount, vendorHueBg, mapsUrl } from "@/lib/utils";
```

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
bannerFrom:   #1e3d24
bannerTo:     #2d5435
```

### Post page — intentional exception
```
app/post/page.tsx uses a local C object with bg: #f0ede6 (not #f5f2eb).
This is intentional — distinct form feel. Also adds amber palette for AI failure notice:
  amber: #7a5c1e / amberBg: rgba(122,92,30,0.08) / amberBorder: rgba(122,92,30,0.22)
```

### Reseller pages (dark — do not change)
```
bg: #050f05  text: #f5f0e8  gold: #c8b47e  green: #6dbc6d
```

### Animation patterns (feed)
```
// Scroll-triggered reveal hook
function useScrollReveal(threshold = 0.1) {
  // IntersectionObserver — visible flips true once, stays true, observer disconnects
  // Above-fold check on mount: rect.top < window.innerHeight → setVisible(true) immediately
}

// Tile reveal CSS (not Framer — fires on visible state change, not mount)
opacity: visible ? 1 : 0
transform: visible ? "translateY(0)" : "translateY(16px)"
transition: `opacity 0.38s ease ${staggerDelay}s, transform 0.44s cubic-bezier(0.22,1,0.36,1) ${staggerDelay}s`

// Image warmth hover (on <img> inside overflow:hidden container)
filter: hovered ? "brightness(1.04) saturate(1.10)" : "brightness(0.99) saturate(0.96)"
transform: hovered ? "scale(1.018)" : "scale(1)"
transition: "filter 0.42s ease, transform 0.52s cubic-bezier(0.22,1,0.36,1)"
// Scale on img NOT on card — overflow:hidden clips it cleanly
```

### Deferred scroll restore pattern
```ts
// Keys: SCROLL_KEY = "treehouse_feed_scroll", LAST_VIEWED_KEY = "treehouse_last_viewed_post"

// Mount effect — read into refs, DO NOT scrollTo yet (page has no height)
const pendingScrollY = useRef<number | null>(null);
const scrollRestored = useRef(false);
// read sessionStorage into refs here

// Post-render effect — fires when loading flips false (feed has DOM height)
useEffect(() => {
  if (loading) return;
  if (scrollRestored.current) return;
  if (pendingScrollY.current === null) return;
  scrollRestored.current = true;
  requestAnimationFrame(() => window.scrollTo({ top: pendingScrollY.current!, behavior: "instant" }));
}, [loading]);

// On tile tap — write last viewed ID
function handleTileClick() {
  try { sessionStorage.setItem(LAST_VIEWED_KEY, post.id); } catch {}
}

// Highlight ring on return — isLastViewed prop on MasonryTile
// border: 1.5px solid rgba(30,77,43,0.55) + box-shadow halo
// fades after 1.6s via setTimeout + CSS transition on border-color / box-shadow
```

### Toast centering pattern
```
// NEVER use position:fixed + translate(-50%,-50%) on a motion.div — Framer overwrites transform
<div style={{ position:"fixed", inset:0, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
  <motion.div style={{ pointerEvents:"auto", width:"min(300px, calc(100vw - 48px))", ... }}>
    ...
  </motion.div>
</div>
```

### Feed scroll cache — post publish pattern
```ts
const FEED_SCROLL_KEY = "treehouse_feed_scroll"; // must match SCROLL_KEY in app/page.tsx
try { sessionStorage.removeItem(FEED_SCROLL_KEY); } catch {}
router.refresh();
router.push(dest);
```

### AI caption failure pattern (post page)
```ts
// generateCaption returns { title, caption, aiSucceeded: boolean }
// aiSucceeded = false when both fields are empty
// Sets aiCapFailed state → shows amber AlertCircle notice in editing form
// Resets aiCapFailed on back button / retake
```

### Price validation pattern (post + edit)
```ts
if (editPrice.trim()) {
  const priceVal = parseFloat(editPrice.trim());
  if (isNaN(priceVal) || priceVal < 0) {
    // show inline error, return early — do NOT enter saving state
    return;
  }
}
```

### Committed terminology (do not deviate)
```
Sold status:        "Found a home" — everywhere
Save action:        "Save" (button) / "My Finds" (nav)
Location section:   "Find it here"
Related items:      "More from this shelf"
Booth label:        "Booth 369" — always with word "Booth"
Admin hint:         "Manage"
Hero eyebrow:       "A curated shelf from"
Flagged banner:     "All found a home"
```

### BottomNav — tabs
```
Guest: Home · My Finds · Booths            (3 tabs)
Auth:  Home · My Finds · Booths · My Shelf (4 tabs)
Icons: Home (lucide Home) · My Finds (lucide Heart) · Booths (lucide LayoutGrid) · My Shelf (lucide Store)
flaggedCount passed to BottomNav on ALL ecosystem pages
```

### AdminOnly pattern
```tsx
import AdminOnly from "@/components/AdminOnly";
<AdminOnly user={user}>
  <button>Admin action</button>
</AdminOnly>
```

---

## RULES & GOTCHAS
- All ecosystem pages need `export const dynamic = "force-dynamic"`
- Never use `export const config = {}` — deprecated in Next.js 14 App Router
- Always use `git add -A` — never individual paths (zsh glob-expands `[slug]`)
- `filesystem:write_file` is the ONLY reliable way to write files to Mac disk
- `bash_tool` writes to sandbox only — NOT the Mac filesystem
- `str_replace` fails on bracket-path files — always full rewrite for `app/find/[id]/page.tsx`, `app/post/edit/[id]/page.tsx`, `app/shelf/[slug]/page.tsx`
- `str_replace` also unreliable on regular paths — prefer `filesystem:write_file` for all rewrites
- `useSearchParams()` requires Suspense wrapper
- Image uploads MUST go through server routes (`/api/post-image`, `/api/vendor-hero`) — client-side Supabase upload hits RLS wall
- Toast centering: use fixed inset-0 flex shell — NOT `position:fixed` on `motion.div` (Framer overrides transform)
- New API route directories must be created in Terminal with `mkdir -p` before MCP can write into them
- New subdirectories (e.g. `supabase/seeds/`) must exist before `filesystem:write_file` — MCP can't create parent dirs
- `getPostsByIds` has NO status filter — saved finds shown regardless of status
- `getFeedPosts` and `getMallPosts` filter `.eq("status","available")`
- safeStorage in all ecosystem client components EXCEPT raw localStorage for bookmark iteration
- Badge count = raw localStorage key iteration, NOT posts.length
- Vercel project: `david-6613s-projects` scope (NOT zen-forged)
- Vercel webhook unreliable → `npx vercel --prod` if push doesn't deploy
- framer-motion: never two `transition` props on same motion.div
- MINIMUM font size: 10px
- Post type uses `price_asking` (not `price`) — `number | null`
- Admin default vendor: `5619b4bf-3d05-4843-8ee1-e8b747fc2d81` (Zen booth, no user_id)
- Owner controls: `showOwnerControls = isMyPost` only — no `isCurator` / `getMode()` dependency
- NEVER redefine a local `C = {...}` object — always import from `lib/tokens.ts` (exception: app/post/page.tsx — intentional)
- NEVER copy-paste TabSwitcher, BoothFinderCard, ExploreBanner, ShelfGrid — always import from components
- Feed re-fetch: visibilitychange hidden→visible fires on SPA back-navigation in mobile browsers
- Scroll restore MUST be deferred until after feed renders — firing on mount causes silent scroll to 0 (page has no height yet)

---

## WORKING ✅
- Discovery feed — available-only, masonry, scroll-triggered tile reveals, warmth hover, back-nav anchor with highlight ring
- Feed scroll restore — deferred until loading → false; correct for tiles anywhere in the list
- Feed re-fetches on return from other routes (visibilitychange pattern)
- Feed scroll cache cleared on publish → lands at top showing new post
- Magic link auth — login page, session persistence, isAdmin check
- Admin PIN login — email_otp flow
- DevAuthPanel — dev-only (gated in layout.tsx) ✅
- BottomNav — 4-tab auth, 3-tab guest; Heart for My Finds; flaggedCount on all pages
- Booths page — guest→/shelf/[slug], admin→manage; Add Booth sheet; AdminOnly wrapper ✅
- My Shelf — auth-gated; admin vendor switcher; hero upload via server route; shared ShelfGrid ✅
- Post flow — AI caption with fallback notice ✅; price validation ✅; toast, server-route image upload ✅
- Edit listing — price validation ✅; image replacement
- Find detail — back button, heart+share on image, Save CTA, owner controls (separate card) ✅
- Public Saved Shelf — read-only, shared ShelfGrid ✅
- My Finds — no auth required, Heart icon, instant unsave; "Found a home" terminology ✅
- Mall locations — 29 locations in Supabase with full address, phone, coordinates, website ✅
- Shared design tokens — no local C objects except post page (intentional) ✅
- AdminOnly component — all admin UI wrapped ✅
- All reseller intel routes (untouched)

## KNOWN GAPS / SPRINT 2 ⚠️
- Vendor bio field — exists in DB, no UI to set or display
- No PWA manifest.json — can't prompt "Add to Home Screen"
- Scroll restore QA needed on iPhone Safari + Chrome Android
- Hero image upload: no client-side size guard (12MB limit)
- Feed needs content seeding before beta invite (10–15 real posts)
- No feedback mechanism for beta users
- No error monitoring (Sentry / Vercel logs)
- No rate limiting on `/api/post-caption`
- Admin PIN not QA'd in production (verify `ADMIN_PIN` + `SUPABASE_SERVICE_ROLE_KEY` in Vercel)
- No Supabase RLS (Sprint 4)
- No PWA support (Sprint 2)
- Bookmarks localStorage-only — no cross-device sync (Sprint 4)
- No pagination/infinite scroll — flat 80-post fetch (Sprint 4)
- No search (Sprint 4)
- No terms of service / privacy policy (Sprint 4)

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

# New API route directories — must do in Terminal before MCP write
mkdir -p app/api/your-route-name

# New subdirectories — must exist before filesystem:write_file
mkdir -p supabase/seeds
```
