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
> Last updated: 2026-04-12

**Status:** 🚧 Shelves + nav sprint complete — pending deploy verification and admin PIN QA.

**What was done (this session):**

### TypeScript build fixes
- `app/post/page.tsx` — fixed `hasValidIdentity` TS error: was referencing `activeIdentity?.mall_id` on a display-only object that lacked the field. Rewrote to use `resolvedVendor?.mall_id || localProfile?.mall_id` directly.
- `app/api/auth/admin-pin/route.ts` — TS error from nonexistent `admin.auth.admin.createSession`. Replaced with `generateLink` + `email_otp` approach. Client now calls `verifyOtp({ type: "email" })` instead of `"magiclink"`.
- `app/my-shelf/page.tsx` — TS error `user is possibly null` inside async closure. Fixed by capturing `const authedUser = user` as a non-null local before the async `resolve()` function, and passing `authedUser.id` explicitly. Added `userRef` for `handleVendorSwitch`.

### Shelves page + 3-tab nav
- `app/shelves/page.tsx` (new) — Public vendor directory for America's Antique Mall. Shows all booths with hero image/color band, booth pill, vendor name, bio. Admin sees "Tap to manage shelf" hint; tapping routes to `/my-shelf?vendor=[id]`. Non-admin routes to `/vendor/[slug]`.
- `components/BottomNav.tsx` — 3-tab layout: Home · Shelves (BookOpen icon, middle) · Your Finds (unauth) or My Shelf (auth). Session resolves before render to prevent flicker.

### Admin My Shelf — vendor identity fix
- `lib/posts.ts` — Added `getVendorById(id)` for direct lookup without `user_id` linkage.
- `app/my-shelf/page.tsx` — New identity resolution order for admin:
  1. `?vendor=[id]` query param (from Shelves page tap)
  2. `getVendorByUserId(user.id)` — standard lookup
  3. Admin fallback: auto-loads Zen booth (`5619b4bf-3d05-4843-8ee1-e8b747fc2d81`)
  4. NoBooth only if all fail
- Admin gets a **booth switcher dropdown** in the app bar (shows all mall vendors, checkmark on active, updates URL param on switch).

### Supabase backfill
- ZenForged Finds `user_id` was set to David's auth UID this session (done in Supabase SQL editor).

### Admin PIN (still needs QA)
- Flow changed: server returns `email_otp` from `generateLink`, client calls `verifyOtp({ type: "email" })`.
- Still requires `SUPABASE_SERVICE_ROLE_KEY` + `ADMIN_PIN` set in Vercel env vars.

**Previous sessions:**
- Vendor identity architecture fix — auth-first resolution in `/post` and `/my-shelf`
- Admin PIN shipped + fixed (action_link token extraction → now email_otp)
- Hero image persistence fix (heroLockedRef)
- Save to Shelf flow (inline toast, no preview redirect)
- Public Saved Shelf at /shelf/[slug]
- Auth sprint — magic link login, auth-gated pages, admin gate wired
- My Shelf redesign — cinematic hero card, tab switcher, Maps link
- safeStorage iPhone Safari bug fix, Anonymous Auth Sprint

**Next session starting point:**
1. Verify latest deploy built clean on Vercel
2. QA Admin PIN login — should now work with `email_otp` flow
3. QA Shelves page — all booths visible, admin "Tap to manage shelf" works
4. QA My Shelf as admin — Zen booth loads by default, vendor switcher dropdown works
5. Consider: Supabase RLS — now unblocked (auth is real, identity is solid)
6. Consider: feed refresh after posting (pull-to-refresh or navigate)

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

---

## AUTH SYSTEM

### Three tiers
| Tier | How | Can do |
|---|---|---|
| Unauth | No session | Browse feed, find detail, save to Your Finds |
| Vendor | Magic link email | Post finds (one booth), My Shelf, mark sold, delete own posts |
| Admin | Magic link OR Admin PIN | Everything + /admin + vendor switcher in My Shelf |

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
1. `getVendorByUserId(user.id)` — Supabase wins if auth
2. localStorage `th_vendor_profile` — cache only
3. Setup form — first-time or unauth

### Session persistence
- Supabase Auth sessions persist across browser restarts (pkce flow default)
- `treehouse_auth_uid` localStorage key caches user.id for sync owner detection

---

## ROUTE MAP

### Ecosystem (warm parchment theme)
```
/                   Discovery feed — ModeToggle hidden for unauth, "Curator Sign in" for unauth
/login              Magic link login — enter email → check email → confirming; + Admin PIN tab
/find/[id]          Find detail — owner controls (mark sold + delete) inside "Find this here" card
/flagged            Your Finds (Explorer) — no auth required
/shelves            Shelves — all vendor booths at America's Antique Mall; admin: tap to manage
/my-shelf           My Shelf (Curator/Admin) — auth-gated; admin gets vendor switcher
/shelf/[slug]       Public Saved Shelf — read-only cinematic view, no editing, shareable link
/mall/[slug]        Mall profile
/vendor/[slug]      Vendor profile
/post               Vendor capture — resolves identity from Supabase first, falls back to localStorage
/post/preview       Edit title/caption/price → "Save to Shelf" → confirmation (optional flow)
/admin              Admin — auth-gated, isAdmin() check, access-denied for non-admins
```

### Reseller intel (dark theme — do not touch)
```
/scan → /discover → /refine → /decide → /intent → /enhance-text → /share
/finds, /finds/[id]
```

---

## KEY FILES
```
lib/auth.ts               Magic link auth — sendMagicLink, getSession, signOut, isAdmin, getCachedUserId, ensureAnonSession
lib/supabase.ts           Client with placeholder fallback for build time
lib/posts.ts              Data access — getVendorByUserId, getVendorById (NEW), getFeedPosts,
                          getPost, getVendorPosts, createPost, createVendor,
                          uploadPostImage, uploadVendorHeroImage, updateVendorHeroImage, etc.
lib/mode.ts               Explorer/Curator mode — getMode(), setMode()
lib/safeStorage.ts        localStorage wrapper with sessionStorage + memory fallback
lib/postStore.ts          In-memory image store for /post/preview (legacy, still used by preview page)
types/treehouse.ts        Post, Vendor (+ hero_image_url), Mall, LocalVendorProfile
components/BottomNav.tsx  3-tab: Home · Shelves · Your Finds (unauth) / My Shelf (auth)
components/ModeToggle.tsx Hidden when unauth, shown to logged-in users only
components/DevAuthPanel.tsx  Localhost-only floating auth tier switcher
components/PiLeafIcon.tsx PiLeaf from react-icons/pi wrapper
components/MallHeroCard.tsx MallHeroCard + GenericMallHero exports
app/login/page.tsx        Magic link login + Admin PIN tab; Suspense wrapper for useSearchParams
app/layout.tsx            No max-width wrapper, DevAuthPanel mounted here
app/page.tsx              Discovery feed — ModeToggle + "Curator Sign in" (auth-aware)
app/flagged/page.tsx      Your Finds — no auth required
app/shelves/page.tsx      Shelves — all vendor booths; admin taps → /my-shelf?vendor=[id]
app/my-shelf/page.tsx     My Shelf — admin vendor switcher, Zen booth default, heroLockedRef
app/shelf/[slug]/page.tsx Public Saved Shelf — read-only, no editing, cinematic hero, booth finder
app/find/[id]/page.tsx    Find detail — owner controls inside location card
app/post/page.tsx         Capture — resolvedVendor (Supabase) > localProfile (localStorage) > setup form
app/post/preview/page.tsx Preview + "Save to Shelf" button — optional edit step
app/admin/page.tsx        Admin UI — isAdmin() gate, sign-out, post management
app/api/admin/posts/route.ts Admin API
app/api/auth/admin-pin/route.ts PIN login — generateLink → email_otp → client verifyOtp type:"email"
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

### My Shelf — hero card
```
Contained: margin 10px sides, border-radius 16px
Gradient: L→R linear-gradient(to right, rgba(18,34,20,0.82) 0%, rgba(18,34,20,0.40) 55%, transparent 100%) zIndex 1
Text: zIndex 2 (above gradient)
Edit button: zIndex 10, top-right of hero (owner only — hidden on public /shelf/[slug])
heroLockedRef: prevents effects from overwriting freshly-uploaded hero image
No price on tiles
```

### BottomNav — 3 tabs
```
Unauth:  Home · Shelves · Your Finds
Auth:    Home · Shelves · My Shelf
Icons:   Home (lucide Home) · Shelves (lucide BookOpen) · Finds/Shelf (PiLeaf / lucide Store)
```

---

## RULES & GOTCHAS
- All ecosystem pages need `export const dynamic = "force-dynamic"`
- Never use `export const config = {}` — deprecated in Next.js 14 App Router
- Always use `git add -A` — never individual paths (zsh glob-expands `[slug]`)
- `filesystem:write_file` is the ONLY reliable way to write files
- `str_replace` fails on bracket-path files — always full rewrite for `app/find/[id]/page.tsx`, `app/shelf/[slug]/page.tsx`
- `useSearchParams()` requires Suspense wrapper — export default wraps inner component
- `getPostsByIds` has NO status filter — saved finds shown regardless of status
- `getFeedPosts` and `getMallPosts` filter `.eq("status","available")`
- safeStorage in all ecosystem client components EXCEPT raw localStorage for bookmark iteration
- Badge count = raw localStorage key iteration, NOT posts.length
- Identity resolution: Supabase (`getVendorByUserId`) > localStorage cache > setup form
- localStorage is a CACHE of Supabase identity — never the source of truth for logged-in users
- TypeScript + async closures: always capture state variables as non-null locals before async functions
- Vercel project: `david-6613s-projects` scope (NOT zen-forged)
- Vercel webhook unreliable → `npx vercel --prod` if push doesn't deploy
- framer-motion: never two `transition` props on same motion.div
- MINIMUM font size: 10px
- Post type uses `price_asking` (not `price`) — `number | null`
- DevAuthPanel only renders on localhost — checked via `window.location.hostname`
- Admin PIN: server returns `email_otp` from generateLink; client calls verifyOtp({ type: "email" })
- heroLockedRef in My Shelf: set to true during upload, released after 3s
- Admin default vendor: `5619b4bf-3d05-4843-8ee1-e8b747fc2d81` (Zen booth, no user_id)
- Admin vendor switching: updates `?vendor=[id]` URL param via `window.history.replaceState`

---

## WORKING ✅
- Discovery feed — available-only, masonry, ModeToggle (auth-aware), PiLeaf saved indicator
- Feed header — "Curator Sign in" pill for unauth users, hides when logged in
- Magic link auth — login page, session persistence, isAdmin check
- Admin PIN login — email_otp flow, rate limited (needs Vercel env vars to work in prod)
- Dev auth panel — localhost-only, tier switcher (guest/vendor/admin), magic link send, sign-out
- BottomNav — 3-tab: Home · Shelves · Your Finds/My Shelf; auth-driven right tab; iOS padding; badge
- ModeToggle — hidden for unauth users
- Shelves page — all vendor booths at America's Antique Mall; admin manages from here
- My Shelf — auth-gated; admin gets Zen booth by default + vendor switcher dropdown
- Public Saved Shelf (/shelf/[slug]) — read-only cinematic view, no edit controls
- Find detail — owner controls inside location card (mark sold + delete), Curator-only gate
- Post flow — resolvedVendor (Supabase) wins over localStorage, inline save-to-shelf toast
- post/preview — "Save to Shelf" button, "Saved to shelf." done state
- Admin — isAdmin() gate, access-denied screen, post management, sign-out
- Your Finds — no auth required, instant unsave, stale pruning
- vendors.hero_image_url — column exists, upload/update functions in lib/posts.ts
- safeStorage Safari fallback
- All reseller intel routes (untouched)

## KNOWN GAPS ⚠️
- Admin PIN needs QA in production (SUPABASE_SERVICE_ROLE_KEY + ADMIN_PIN must be set in Vercel)
- Feed doesn't refresh after adding item from /post toast (need navigate or pull-to-refresh)
- No Supabase RLS (now feasible — auth is real and identity is solid)
- No pull-to-refresh on feed
- No PWA support
- `/enhance-text` is mock

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

# Admin PIN debug
# Check Vercel function logs for "[admin-pin]" entries
# Verify ADMIN_PIN and SUPABASE_SERVICE_ROLE_KEY are set in Vercel → Settings → Env Vars

# Shelves / My Shelf admin debug
# Log in as admin → /shelves → tap a booth → should load /my-shelf?vendor=[id]
# In-page vendor switcher dropdown should show all booths in the mall
```
