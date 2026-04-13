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
> Last updated: 2026-04-13

**Status:** ✅ Design system refactor complete — shared tokens, components, and unified terminology shipped.

---

## What was done (this session)

### Phase 1 — UI Audit
Full systems-level audit across all major pages. Identified:
- Design tokens copy-pasted into 5+ pages (no source of truth)
- TabSwitcher, BoothFinderCard, ExploreBanner, ThreeColGrid, SkeletonGrid, vendorHueBg all duplicated
- "Found" / "Found a home" / "Sold" — three terms for same state
- "View the shelf" / "Find this here" — inconsistent section labels
- Admin controls mixed into guest card layouts
- Owner controls and location info in same card (different user intents)

### Phase 2-6 — Design System + Refactor Sprint
**New files created:**
- `lib/tokens.ts` — single `colors`, `radius`, `spacing` exports. All `C = {...}` objects eliminated.
- `lib/utils.ts` — `flagKey`, `loadFollowedIds`, `loadBookmarkCount`, `vendorHueBg`, `mapsUrl`
- `components/TabSwitcher.tsx` — shared, "Found a home" tab label
- `components/BoothFinderCard.tsx` — shared, "Find it here in person" CTA
- `components/ExploreBanner.tsx` — shared, `onPress` prop for button vs Link
- `components/ShelfGrid.tsx` — `ThreeColGrid`, `SkeletonGrid`, `AvailableTile`, `FoundTile`, `ShelfGridStyles`
- `components/AdminOnly.tsx` — wrapper for all admin-only UI elements

**Pages updated:**
- `app/page.tsx` — imports tokens + utils
- `app/find/[id]/page.tsx` — tokens + utils; owner controls moved to separate card below location; "Find it here"; "More from this shelf"; "Found a home" on shelf cards
- `app/shelves/page.tsx` — tokens + utils + AdminOnly; admin controls wrapped; "Admin mode" text stripped
- `app/my-shelf/page.tsx` — tokens + all 5 shared components; AddFindTile contrast improved
- `app/shelf/[slug]/page.tsx` — tokens + all 5 shared components; back button standardized

**Terminology standardized:**
- Sold item: **"Found a home"** everywhere (was "Found", "Found a home", "Sold")
- Section label: **"Find it here"** (was "Find this here")
- Section label: **"More from this shelf"** (was "View the shelf")
- BoothBox label: **"Booth"** (was "Found In-Booth")
- Admin hint on vendor cards: **"Manage"** (was "Tap to manage shelf")

### Known Gaps ⚠️
- Feed doesn't refresh after posting
- No Supabase RLS
- No pull-to-refresh on feed
- No PWA support
- `/enhance-text` is mock
- Admin PIN needs QA in production (SUPABASE_SERVICE_ROLE_KEY + ADMIN_PIN must be set in Vercel)
- Mall location thumbnail (BoothFinderCard green gradient) — not image-editable (needs `malls.image_url` column)
- `/vendor/[slug]` route now unused for guests — may be deprecated

---

## Next session starting point
1. QA on prod: verify "Found a home" shows correctly on shelf pages and find detail
2. QA on prod: verify AdminOnly wrapper hides controls from guest view
3. Consider: feed refresh after posting (router.refresh() or timestamp param on navigate-back)
4. Consider: pull-to-refresh on feed
5. Consider: Supabase RLS (auth + server routes are solid — good time)
6. Consider: mall thumbnail image upload (requires `malls.image_url` column + `/api/mall-image` route)
7. Continue design system work: PageShell wrapper, Admin Context Bar, flagged page audit

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
- **Only mall:** America's Antique Mall, id: `19a8ff7e-cb45-491f-9451-878e2dde5bf4`
- **Known vendors:**
  - ZenForged Finds, booth 369, id: `65a879f1-c43c-481b-974f-379792a36db8` — user_id SET ✅
  - Zen booth (admin default), id: `5619b4bf-3d05-4843-8ee1-e8b747fc2d81` — no user_id (admin loads by ID)
- **Extra columns:** vendors table has `facebook_url text`, `user_id uuid`, `hero_image_url text`
- **Unique constraint:** `vendors_mall_booth_unique` on `(mall_id, booth_number)`
- **Storage policies:** vendor-hero INSERT/UPDATE policies exist (now redundant — server route used instead)

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
- `components/DevAuthPanel.tsx` — localhost-only floating panel for auth tier switching

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

### Owner controls on Find Detail (`app/find/[id]/page.tsx`)
`showOwnerControls = isMyPost` — resolved via async `detectOwnershipAsync`:
1. isAdmin(session.user) → true
2. session.user.id === post.vendor.user_id → true
3. localStorage vendor_id === post.vendor_id → true
No dependency on `getMode()` / curator mode.
Owner controls now render in a **separate card** below the location card (not inside it).

---

## ROUTE MAP

### Ecosystem (warm parchment theme)
```
/                   Discovery feed — "Recently added" label, masonry grid
/login              Magic link login + Admin PIN tab
/find/[id]          Find detail — floating back button, heart+share on image, Save CTA, "Find it here" location card, owner controls card (separate)
/flagged            My Finds — no auth required, always in nav
/shelves            Booths — all vendor booths; guest → /shelf/[slug]; admin → manage; Add Booth sheet
/my-shelf           My Shelf (Curator/Admin) — auth-gated; admin gets vendor switcher; "View more booths" banner
/shelf/[slug]       Public Saved Shelf — read-only; "View more booths" banner; bookmark count in nav
/mall/[slug]        Mall profile
/vendor/[slug]      Vendor profile (legacy — guests now routed to /shelf/[slug] from Booths)
/post               Vendor capture — server-route image upload; centered toast; correct redirect
/post/preview       Edit title/caption/price → "Save to Shelf" → confirmation (optional flow)
/admin              Admin — auth-gated, isAdmin() check
```

### API routes (ecosystem)
```
/api/vendor-hero    POST — server-side banner upload, service role key, bypasses RLS
/api/post-image     POST — server-side post image upload, service role key, bypasses RLS
/api/post-caption   POST — Claude Vision title + caption generation
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
lib/tokens.ts             ← NEW: single source of truth for all ecosystem colors/spacing/radius
lib/utils.ts              ← NEW: flagKey, loadFollowedIds, loadBookmarkCount, vendorHueBg, mapsUrl
lib/auth.ts               Magic link auth
lib/supabase.ts           Client with placeholder fallback for build time
lib/posts.ts              Data access — all Supabase queries
lib/mode.ts               Explorer/Curator mode (legacy — no longer used for owner controls)
lib/safeStorage.ts        localStorage wrapper with sessionStorage + memory fallback
types/treehouse.ts        Post, Vendor, Mall, LocalVendorProfile
components/AdminOnly.tsx  ← NEW: wraps any admin-only UI — import + use everywhere
components/BottomNav.tsx  4-tab auth / 3-tab guest; Heart icon for My Finds; flaggedCount propagated
components/TabSwitcher.tsx         ← NEW: shared Available/Found a home tab switcher
components/BoothFinderCard.tsx     ← NEW: shared maps CTA card ("Find it here in person")
components/ExploreBanner.tsx       ← NEW: shared "View more booths" banner
components/ShelfGrid.tsx           ← NEW: ThreeColGrid, SkeletonGrid, AvailableTile, FoundTile, ShelfGridStyles
components/ModeToggle.tsx Hidden when unauth
components/DevAuthPanel.tsx  Localhost-only floating auth tier switcher
app/login/page.tsx        Magic link login + Admin PIN tab
app/layout.tsx            No max-width wrapper, DevAuthPanel mounted here
app/page.tsx              Discovery feed
app/flagged/page.tsx      My Finds — Heart icon throughout
app/shelves/page.tsx      Booths page — AdminOnly wrapper on all admin controls
app/my-shelf/page.tsx     My Shelf — hero upload, shared ShelfGrid components
app/shelf/[slug]/page.tsx Public Saved Shelf — shared ShelfGrid components
app/find/[id]/page.tsx    Find detail — owner controls in separate card below location
app/post/page.tsx         Capture — toast centered via fixed inset-0 shell
app/post/preview/page.tsx Preview + "Save to Shelf"
app/admin/page.tsx        Admin UI
app/api/vendor-hero/route.ts  Server-side banner upload (service role)
app/api/post-image/route.ts   Server-side post image upload (service role)
app/api/auth/admin-pin/route.ts  PIN login
```

---

## DESIGN SYSTEM

### Token import pattern (use everywhere, never redefine locally)
```ts
import { colors } from "@/lib/tokens";
import { flagKey, loadBookmarkCount, vendorHueBg, mapsUrl } from "@/lib/utils";
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

### Reseller pages (dark — do not change)
```
bg: #050f05  text: #f5f0e8  gold: #c8b47e  green: #6dbc6d
```

### Typography scale
```
MINIMUM font size: 10px everywhere
Section headers / page titles: 22px Georgia 700
Body / tile titles: Georgia 12–14px
Captions: 15px italic Georgia, lineHeight 1.85
Georgia for: all headers, titles, captions, italic labels, CTA buttons
System UI for: BottomNav labels, dropdown options, monospace data
```

### Committed terminology (do not deviate)
```
Sold status:        "Found a home" — everywhere (feed badge, shelf tiles, detail page, tab label)
Save action:        "Save" (button) / "My Finds" (nav)
Location section:   "Find it here" (was "Find this here")
Related items:      "More from this shelf" (was "View the shelf")
Booth label:        "Booth 369" — always with word "Booth" (BoothBox label: "Booth")
Admin hint:         "Manage" (was "Tap to manage shelf")
Hero eyebrow:       "A curated shelf from" — keep
```

### Find detail page — key UI elements
```
Back button:    top-left of hero image, frosted cream circle, ArrowLeft 15px
Heart button:   bottom-right of hero image (left of share), fills green when saved
Share button:   bottom-right of hero image, Send icon
Price:          right-aligned next to availability dot, monospace, only when available
Save CTA:       centered pill button under description, Heart icon, ALL users
Location card:  "Find it here" label → surface card with mall + vendor + booth
Owner controls: SEPARATE surface card below location card — "Manage" label, mark sold + delete
```

### BottomNav — tabs
```
Guest: Home · My Finds · Booths           (3 tabs)
Auth:  Home · My Finds · Booths · My Shelf (4 tabs)
Icons: Home (lucide Home) · My Finds (lucide Heart) · Booths (lucide LayoutGrid) · My Shelf (lucide Store)
flaggedCount passed to BottomNav on ALL ecosystem pages
```

### AdminOnly pattern
```tsx
import AdminOnly from "@/components/AdminOnly";
// Wrap every admin-only UI element:
<AdminOnly user={user}>
  <button>Admin action</button>
</AdminOnly>
```

### Toast centering pattern (post page)
```
// NEVER use position:fixed + translate(-50%,-50%) on a motion.div — Framer overwrites transform
<div style={{ position:"fixed", inset:0, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
  <motion.div style={{ pointerEvents:"auto", width:"min(300px, calc(100vw - 48px))", ... }}>
    ...
  </motion.div>
</div>
```

---

## RULES & GOTCHAS
- All ecosystem pages need `export const dynamic = "force-dynamic"`
- Never use `export const config = {}` — deprecated in Next.js 14 App Router
- Always use `git add -A` — never individual paths (zsh glob-expands `[slug]`)
- `filesystem:write_file` is the ONLY reliable way to write files
- `str_replace` fails on bracket-path files — always full rewrite for `app/find/[id]/page.tsx`, `app/shelf/[slug]/page.tsx`
- `useSearchParams()` requires Suspense wrapper
- Image uploads MUST go through server routes (`/api/post-image`, `/api/vendor-hero`) — client-side Supabase upload hits RLS wall
- Toast centering: use fixed inset-0 flex shell — NOT `position:fixed` on `motion.div` (Framer overrides transform)
- New API route directories must be created in Terminal with `mkdir -p` before MCP can write into them
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
- Admin vendor switching: updates `?vendor=[id]` URL param via `window.history.replaceState`
- Owner controls: `showOwnerControls = isMyPost` only — no `isCurator` / `getMode()` dependency
- NEVER redefine a local `C = {...}` object — always import from `lib/tokens.ts`
- NEVER copy-paste TabSwitcher, BoothFinderCard, ExploreBanner, ShelfGrid — always import from components

---

## WORKING ✅
- Discovery feed — available-only, masonry, no booth label, no item count, "Recently added" label
- Feed header — "Sign in" pill for unauth users
- Magic link auth — login page, session persistence, isAdmin check
- Admin PIN login — email_otp flow
- Dev auth panel — localhost-only, tier switcher
- BottomNav — 4-tab auth, 3-tab guest; Heart for My Finds; flaggedCount on all pages
- Booths page — guest→/shelf/[slug], admin→manage; Add Booth sheet (keyboard-safe, scrollable); AdminOnly wrapper on all admin controls ✅
- My Shelf — auth-gated; admin vendor switcher; hero upload via server route ✅; shared ShelfGrid components ✅
- Post flow — toast centered (fixed inset-0 shell), server-route image upload, correct booth redirect ✅
- Find detail — back button, heart+share on image, Save CTA all users, price, owner controls (async auth-based, separate card) ✅
- Public Saved Shelf (/shelf/[slug]) — read-only, "View more booths" banner, bookmark count, shared ShelfGrid ✅
- My Finds — no auth required, Heart icon, instant unsave
- Shared design tokens (lib/tokens.ts) — no more local C objects ✅
- Shared utilities (lib/utils.ts) — flagKey, vendorHueBg, mapsUrl, bookmark helpers ✅
- Unified sold terminology — "Found a home" everywhere ✅
- AdminOnly component — all admin UI wrapped ✅
- All reseller intel routes (untouched)

## KNOWN GAPS ⚠️
- Feed doesn't refresh after posting
- No Supabase RLS
- No pull-to-refresh on feed
- No PWA support
- `/enhance-text` is mock
- Admin PIN needs prod QA (env vars in Vercel)
- `/vendor/[slug]` route now unused for guests — may be deprecated
- Mall thumbnail image (BoothFinderCard green gradient) not editable — needs `malls.image_url` column + API route
- PageShell wrapper not yet created (structural boilerplate still repeated per page)
- Admin Context Bar not yet created (persistent admin mode indicator)
- `/flagged` page not yet audited against new design system

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
```
