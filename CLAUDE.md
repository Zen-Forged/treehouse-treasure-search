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

**Status:** 🚧 QA sprint — UI fixes applied, mark-as-sold/delete controls restored.

---

## What was done (this session)

### UI Polish — Feed
- Removed booth label from masonry feed tiles
- Removed item count from feed header
- Changed feed body text to "Recently added" (was "What will you find today?")

### UI Polish — Shelf / Booth pages
- Removed "Explore →" link from top-right of public shelf (`/shelf/[slug]`) app bar
- "Enter the Treehouse" button → "View more booths" (navigates to `/shelves`) in both `my-shelf` and `shelf/[slug]` ExploreBanner
- LayoutGrid icon added to "View more booths" button

### My Finds counter — Shelf page
- `/shelf/[slug]` now reads localStorage bookmark count and passes `flaggedCount` to `BottomNav`
- `BottomNav active` corrected to `"shelves"` on shelf page

### Add Booth sheet — Keyboard clip fix
- Sheet now has `maxHeight: "85dvh"` + `flexDirection: column`
- Form content is in a scrollable inner div — no longer clipped when iOS keyboard slides up
- Handle stays pinned at top, outside the scroll area

### Toast centering — Post page
- Root cause: Framer Motion's `animate` prop overwrites `transform` in `style`, breaking `translate(-50%, -50%)`
- Fix: centering shell is a plain `div` with `position: fixed; inset: 0; display: flex; align-items: center; justify-content: center`
- `motion.div` inside only animates `opacity`, `y`, `scale` — does not own positioning transform

### Mark as sold / Delete restored — Find detail page
- Root cause: `showOwnerControls` required `isMyPost && isCurator`, but `isCurator` was gated on the old `getMode()` system (no longer set after auth migration)
- Fix: replaced `detectOwnership` (sync) + `isCurator` check with async `detectOwnershipAsync` that checks: (a) isAdmin via session, (b) `user.id === vendor.user_id`, (c) localStorage vendor_id match
- `showOwnerControls` is now just `isMyPost` — no mode dependency

### Known Gaps ⚠️
- Feed doesn't refresh after posting
- No Supabase RLS
- No pull-to-refresh on feed
- No PWA support
- `/enhance-text` is mock
- Admin PIN needs QA in production (SUPABASE_SERVICE_ROLE_KEY + ADMIN_PIN must be set in Vercel)
- Mall location thumbnail (BoothFinderCard green gradient) — making this image-editable requires `image_url` column on `malls` table + new API route (deferred)
- `/vendor/[slug]` route now unused for guests — may be deprecated

---

## Next session starting point
1. QA: mark-as-sold and delete controls visible when logged in as vendor/admin on find detail page
2. QA: toast centered on post save
3. QA: Add Booth sheet scrollable when keyboard is up
4. Consider: mall thumbnail image upload (requires schema change — `malls.image_url` column + `/api/mall-image` route)
5. Consider: feed refresh after posting (pull-to-refresh or cache bust on navigate-back)
6. Consider: Supabase RLS now that auth + server routes are solid

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

---

## ROUTE MAP

### Ecosystem (warm parchment theme)
```
/                   Discovery feed — "Recently added" label, no item count, no booth label on tiles
/login              Magic link login + Admin PIN tab
/find/[id]          Find detail — back button, heart+share on image, Save CTA (all users), price, owner controls
/flagged            My Finds — no auth required, always in nav
/shelves            Booths — all vendor booths; guest → /shelf/[slug]; admin → manage; Add Booth sheet (scrollable)
/my-shelf           My Shelf (Curator/Admin) — auth-gated; admin gets vendor switcher; "View more booths" banner
/shelf/[slug]       Public Saved Shelf — read-only; no explore link; "View more booths" banner; bookmark count in nav
/mall/[slug]        Mall profile
/vendor/[slug]      Vendor profile (legacy — guests now routed to /shelf/[slug] from Booths)
/post               Vendor capture — server-route image upload; centered toast (fixed inset-0 shell); correct redirect
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
lib/auth.ts               Magic link auth
lib/supabase.ts           Client with placeholder fallback for build time
lib/posts.ts              Data access — all Supabase queries
lib/mode.ts               Explorer/Curator mode (legacy — no longer used for owner controls)
lib/safeStorage.ts        localStorage wrapper with sessionStorage + memory fallback
types/treehouse.ts        Post, Vendor, Mall, LocalVendorProfile
components/BottomNav.tsx  4-tab auth / 3-tab guest; Heart icon for My Finds; flaggedCount propagated to all pages
components/ModeToggle.tsx Hidden when unauth
components/DevAuthPanel.tsx  Localhost-only floating auth tier switcher
app/login/page.tsx        Magic link login + Admin PIN tab
app/layout.tsx            No max-width wrapper, DevAuthPanel mounted here
app/page.tsx              Discovery feed — "Recently added", no item count, no booth label on tiles
app/flagged/page.tsx      My Finds — Heart icon throughout
app/shelves/page.tsx      Booths page — Add Booth sheet scrollable (maxHeight 85dvh + inner scroll div)
app/my-shelf/page.tsx     My Shelf — hero upload, "View more booths" banner → /shelves
app/shelf/[slug]/page.tsx Public Saved Shelf — no explore link, "View more booths" banner, bookmark count in nav
app/find/[id]/page.tsx    Find detail — async owner detection, showOwnerControls = isMyPost
app/post/page.tsx         Capture — toast centered via fixed inset-0 shell (not Framer transform)
app/post/preview/page.tsx Preview + "Save to Shelf"
app/admin/page.tsx        Admin UI
app/api/vendor-hero/route.ts  Server-side banner upload (service role)
app/api/post-image/route.ts   Server-side post image upload (service role)
app/api/auth/admin-pin/route.ts  PIN login
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

### Feed tile — current spec
```
No booth label — title only below image
No item count in feed header
Body label: "Recently added" (or "Finds from [Mall]" when filtered)
Heart button: top-right of image, filled green when saved
```

### Find detail page — key UI elements
```
Back button:   top-left of hero image, frosted cream circle, ArrowLeft icon
Heart button:  bottom-right of hero image (left of share), fills green when saved
Share button:  bottom-right of hero image, Send icon (paper airplane)
Price:         right-aligned next to availability dot, monospace, only when available
Save CTA:      centered pill button under description, Heart icon, ALL users
Owner controls: mark sold + delete — shown when isMyPost (auth OR admin OR localStorage match)
```

### BottomNav — tabs
```
Guest: Home · My Finds · Booths           (3 tabs)
Auth:  Home · My Finds · Booths · My Shelf (4 tabs)
Icons: Home (lucide Home) · My Finds (lucide Heart) · Booths (lucide LayoutGrid) · My Shelf (lucide Store)
flaggedCount passed to BottomNav on ALL ecosystem pages
```

### Toast centering pattern (post page)
```
// NEVER use position:fixed + translate(-50%,-50%) on a motion.div — Framer overwrites transform
// Correct pattern:
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

---

## WORKING ✅
- Discovery feed — available-only, masonry, no booth label, no item count, "Recently added" label
- Feed header — "Sign in" pill for unauth users
- Magic link auth — login page, session persistence, isAdmin check
- Admin PIN login — email_otp flow
- Dev auth panel — localhost-only, tier switcher
- BottomNav — 4-tab auth, 3-tab guest; Heart for My Finds; flaggedCount on all pages
- Booths page — guest→/shelf/[slug], admin→manage; Add Booth sheet (keyboard-safe, scrollable)
- My Shelf — auth-gated; admin vendor switcher; hero upload via server route ✅; "View more booths" banner
- Post flow — toast centered (fixed inset-0 shell), server-route image upload, correct booth redirect ✅
- Find detail — back button, heart+share on image, Save CTA all users, price, owner controls (async auth-based)
- Public Saved Shelf (/shelf/[slug]) — read-only, no explore link, "View more booths" banner, bookmark count ✅
- My Finds — no auth required, Heart icon, instant unsave
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
