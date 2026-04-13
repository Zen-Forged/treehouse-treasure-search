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

**Status:** 🚧 QA sprint — most issues resolved, a few open items remain.

---

## What was done (this session)

### Terminology + Icon Unification
- Leaf icon → Heart icon (`lucide Heart`) everywhere (feed tiles, detail page, My Finds nav, empty states)
- "Add to path" → "Save" / "Saved" (no navigation on tap)
- "Save to My Finds" / "Remove from My Finds" → "Save" / "Saved" toggle
- Save CTA button on detail page now visible to ALL users (not just Explorer mode)
- Heart icon added to detail page hero image overlay (next to share/airplane icon)
- Heart icon on feed tiles: filled when saved, outline when not

### Price on Detail Page
- `price_asking` now displayed right-aligned next to availability status
- Only shown when item is available (not sold) and price is not null

### BottomNav — 4 tabs
- Guest: Home · My Finds · Booths (3 tabs)
- Auth: Home · My Finds · Booths · My Shelf (4 tabs)
- Heart icon replaces leaf on My Finds tab

### Booths Page (renamed from Shelves)
- Page title/header: "Booths"
- Guest taps booth card → `/shelf/[slug]` (public read-only view) ✅
- Admin taps booth card → `/my-shelf?vendor=[id]` (manage mode) ✅
- Admin "Add Booth" button in header → inline bottom sheet
- Add Booth sheet: display name, booth number, mall dropdown (all malls from Supabase)
- Uses existing `createVendor()` + `slugify()`, refreshes list on success

### Image Upload — Server Routes (bypasses RLS)
- `/api/vendor-hero/route.ts` — banner image upload via service role key
- `/api/post-image/route.ts` — post image upload via service role key
- Both `my-shelf/page.tsx` and `post/page.tsx` now call server routes instead of client-side Supabase upload
- Hero upload error surfacing: explicit error state shown below hero card

### Post Flow Fixes
- Toast re-centered using `createPortal(toastEl, document.body)` — renders outside constrained ancestor
- After save: admin with `?vendor=[id]` redirects to `/my-shelf?vendor=[id]` (correct booth)
- Regular vendors redirect to `/my-shelf`

### Known Gaps ⚠️
- Feed doesn't refresh after posting (auto-redirects to /my-shelf, feed is stale)
- No Supabase RLS (now feasible — auth is solid)
- No pull-to-refresh on feed
- No PWA support
- `/enhance-text` is mock
- Admin PIN needs QA in production (SUPABASE_SERVICE_ROLE_KEY + ADMIN_PIN must be set in Vercel)
- `vendor-hero` Supabase Storage policies exist but were redundant after server route fix (can be cleaned up)

---

## Next session starting point
1. QA remaining flows: post image saves correctly with image visible in shelf after upload
2. Consider: feed refresh after posting (pull-to-refresh or navigate-back cache bust)
3. Consider: Supabase RLS now that auth + server routes are solid
4. Consider: restore "Shelves" tab label vs "Booths" — confirm naming is final
5. Consider: `/vendor/[slug]` route — now unused for guests, may be deprecated or repurposed

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

---

## ROUTE MAP

### Ecosystem (warm parchment theme)
```
/                   Discovery feed
/login              Magic link login + Admin PIN tab
/find/[id]          Find detail — back button, heart+share on image, Save CTA (all users), price
/flagged            My Finds — no auth required, always in nav
/shelves            Booths — all vendor booths; guest → /shelf/[slug]; admin → manage
/my-shelf           My Shelf (Curator/Admin) — auth-gated; admin gets vendor switcher
/shelf/[slug]       Public Saved Shelf — read-only cinematic view (guest booth destination)
/mall/[slug]        Mall profile
/vendor/[slug]      Vendor profile (legacy — guests now routed to /shelf/[slug] from Booths)
/post               Vendor capture — server-route image upload; toast via portal; correct redirect
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
lib/mode.ts               Explorer/Curator mode
lib/safeStorage.ts        localStorage wrapper with sessionStorage + memory fallback
types/treehouse.ts        Post, Vendor, Mall, LocalVendorProfile
components/BottomNav.tsx  4-tab auth / 3-tab guest; Heart icon for My Finds
components/ModeToggle.tsx Hidden when unauth
components/DevAuthPanel.tsx  Localhost-only floating auth tier switcher
app/login/page.tsx        Magic link login + Admin PIN tab
app/layout.tsx            No max-width wrapper, DevAuthPanel mounted here
app/page.tsx              Discovery feed — Heart icon top-right of tiles
app/flagged/page.tsx      My Finds — Heart icon throughout
app/shelves/page.tsx      Booths page — guest→/shelf/slug, admin→/my-shelf?vendor=id, Add Booth sheet
app/my-shelf/page.tsx     My Shelf — admin vendor switcher, hero upload via /api/vendor-hero
app/shelf/[slug]/page.tsx Public Saved Shelf — read-only, guest booth destination
app/find/[id]/page.tsx    Find detail — Heart on image, Save CTA all users, price display
app/post/page.tsx         Capture — portal toast, /api/post-image upload, correct redirect
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

### Find detail page — key UI elements
```
Back button:  top-left of hero image, frosted cream circle, ArrowLeft icon
Heart button: bottom-right of hero image (left of share), fills green when saved
Share button: bottom-right of hero image, Send icon (paper airplane)
Price:        right-aligned next to availability dot, monospace, only when available
Save CTA:     centered pill button under description, Heart icon, ALL users, toggles save/unsave
```

### BottomNav — tabs
```
Guest: Home · My Finds · Booths           (3 tabs)
Auth:  Home · My Finds · Booths · My Shelf (4 tabs)
Icons: Home (lucide Home) · My Finds (lucide Heart) · Booths (lucide LayoutGrid) · My Shelf (lucide Store)
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
- Toast/modal overlays that need true viewport centering MUST use `createPortal(el, document.body)` — `position: fixed` inside a `maxWidth` constrained ancestor doesn't center on viewport
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

---

## WORKING ✅
- Discovery feed — available-only, masonry, ModeToggle (auth-aware), Heart top-right toggleable
- Feed header — "Curator Sign in" pill for unauth users
- Magic link auth — login page, session persistence, isAdmin check
- Admin PIN login — email_otp flow
- Dev auth panel — localhost-only, tier switcher
- BottomNav — 4-tab auth, 3-tab guest; Heart for My Finds; Booths always visible
- Booths page — guest→/shelf/[slug], admin→manage; Add Booth sheet
- My Shelf — auth-gated; admin vendor switcher; banner upload via server route ✅
- Post flow — portal toast centered, server-route image upload, correct booth redirect ✅
- Find detail — back button, heart+share on image, Save CTA all users, price display
- Public Saved Shelf (/shelf/[slug]) — read-only, guest booth destination ✅
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
