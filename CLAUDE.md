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
> Last updated: 2026-04-11

**Status:** ✅ Admin PIN login shipped. Build fix applied.

**What was done (this session):**

### Bug fixes
- `app/page.tsx` — "Vendor? Sign in" → "Curator Sign in"; added `onAuthChange` subscription so label reactively disappears after sign-in
- `app/login/page.tsx` — Added `BroadcastChannel("treehouse_auth")` so already-open tab detects magic link click from another tab; updated instruction copy accordingly
- `app/post/page.tsx` — Removed hard auth redirect on `/post`; auth is now soft (attaches user_id if session exists, but doesn't block unauthenticated use)
- `lib/postStore.ts` — Added `sessionStorage` persistence so iPhone camera reload doesn't wipe in-memory image draft

### Admin PIN login (`app/api/auth/admin-pin/route.ts`)
- New API route: POST `{ pin }` → verifies against server-only `ADMIN_PIN` env var → uses Supabase service role to generate a magic link token → returns `{ token, email }` → client calls `supabase.auth.verifyOtp()` → instant session, no email required
- Rate limited: 5 attempts per IP per minute
- `app/login/page.tsx` — Added "Admin PIN" tab alongside "Email link" tab; PIN input → signs in as admin instantly
- `.env.local` — Added `ADMIN_PIN` and `SUPABASE_SERVICE_ROLE_KEY` placeholders
- Build fix: removed invalid `shouldCreateUser` option from `generateLink` call (type error)

### Required setup (not yet done by David)
- Add real `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` and Vercel env vars (get from Supabase → Settings → API → service_role)
- Set `ADMIN_PIN` to desired value in both `.env.local` and Vercel

**Previous sessions:**
- Auth sprint — magic link login, auth-gated pages, admin gate wired
- Hero image upload bug fix (heroKey counter)
- My Shelf redesign — cinematic hero card, tab switcher, Maps link, booth finder
- Anonymous Auth Sprint — full chain /post → Supabase → owner detection
- Demo-ready sprint — feed filter, mode system, Your Finds fixes, My Shelf vendor picker
- Day 3/2 UI/UX sprints — PiLeaf icons, badge sync, hero copy, iOS nav padding
- Branded Experience Sprint, Mall Identity Layer, safeStorage iPhone Safari bug fix

**Next session starting point:**
1. Confirm PIN login works on device — go to `/login`, tap "Admin PIN" tab, enter PIN, verify you land on `/my-shelf` as admin
2. Confirm image upload displays after posting from phone (sessionStorage fix)
3. Wire `vendor.user_id` on first publish — `post/preview` page needs to pass auth `user_id` to `createVendor()` (highest priority functional gap)
4. QA magic link BroadcastChannel UX — does the already-open tab auto-navigate after clicking link in email?
5. Consider Supabase RLS — now feasible with real auth in place
6. UI/UX refinement: Home feed, Your Finds, Find detail pages

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
```

---

## SUPABASE
- **Tables:** malls, vendors, posts — RLS DISABLED on all three
- **Storage bucket:** post-images — PUBLIC
- **Auth:** Magic link (OTP) via email — `supabase.auth.signInWithOtp()`
- **Only mall:** America's Antique Mall, id: `19a8ff7e-cb45-491f-9451-878e2dde5bf4`
- **Known vendor:** ZenForged Finds, booth 369, id: `65a879f1-c43c-481b-974f-379792a36db8`
- **Extra columns:** vendors table has `facebook_url text`, `user_id uuid`, `hero_image_url text`
- **Unique constraint:** `vendors_mall_booth_unique` on `(mall_id, booth_number)`

---

## AUTH SYSTEM

### Three tiers
| Tier | How | Can do |
|---|---|---|
| Unauth | No session | Browse feed, find detail, save to Your Finds |
| Vendor | Magic link email | Post finds (one booth), My Shelf, mark sold, delete own posts |
| Admin | Magic link, email = NEXT_PUBLIC_ADMIN_EMAIL | Everything + /admin |

### Key files
- `lib/auth.ts` — `sendMagicLink`, `getSession`, `getUser`, `signOut`, `isAdmin(user)`, `onAuthChange`, `getCachedUserId`
- `app/login/page.tsx` — enter email → check email → confirming (polls for session after ?confirmed=1)
- `components/DevAuthPanel.tsx` — localhost-only floating panel for auth tier switching
- `ensureAnonSession()` kept as no-op stub for backwards compat

### Session persistence
- Supabase Auth sessions persist across browser restarts (pkce flow default)
- `treehouse_auth_uid` localStorage key caches user.id for sync owner detection

### Vendor rules
- One booth per vendor auth account
- Booth identity locked after first publish — cannot be edited by vendor
- Admin can manage booth identity via /admin

---

## ROUTE MAP

### Ecosystem (warm parchment theme)
```
/                   Discovery feed — ModeToggle hidden for unauth, "Vendor? Sign in" for unauth
/login              Magic link login — enter email → check email → confirming
/find/[id]          Find detail — owner controls (mark sold + delete) inside "Find this here" card
/flagged            Your Finds (Explorer) — no auth required
/my-shelf           My Shelf (Curator) — auth-gated, redirects to /login
/mall/[slug]        Mall profile
/vendor/[slug]      Vendor profile
/post               Vendor capture — auth-gated, redirects to /login, profile locked after setup
/post/preview       Edit title/caption/price → publish
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
lib/auth.ts               Magic link auth — sendMagicLink, getSession, signOut, isAdmin, getCachedUserId
lib/supabase.ts           Client with placeholder fallback for build time
lib/posts.ts              Data access layer — getFeedPosts, getPost, getVendorPosts, createPost,
                          createVendor, uploadPostImage, uploadVendorHeroImage, updateVendorHeroImage, etc.
lib/mode.ts               Explorer/Curator mode — getMode(), setMode()
lib/safeStorage.ts        localStorage wrapper with sessionStorage + memory fallback
lib/postStore.ts          In-memory image store for /post → /post/preview
types/treehouse.ts        Post, Vendor (+ hero_image_url), Mall, LocalVendorProfile
components/BottomNav.tsx  Auth-driven: unauth→Home+YourFinds, authed→Home+MyShelf
components/ModeToggle.tsx Hidden when unauth, shown to logged-in users only
components/DevAuthPanel.tsx  Localhost-only floating auth tier switcher
components/PiLeafIcon.tsx PiLeaf from react-icons/pi wrapper
components/MallHeroCard.tsx MallHeroCard + GenericMallHero exports
app/login/page.tsx        Magic link login, Suspense wrapper for useSearchParams
app/layout.tsx            No max-width wrapper, DevAuthPanel mounted here
app/page.tsx              Discovery feed — ModeToggle + "Vendor? Sign in" (auth-aware)
app/flagged/page.tsx      Your Finds — no auth required
app/my-shelf/page.tsx     My Shelf — auth-gated, heroKey for image remount fix, sign-out, admin link
app/find/[id]/page.tsx    Find detail — owner controls inside location card
app/post/page.tsx         Capture — auth-gated, profile locked, no reset
app/post/preview/page.tsx Preview + publish — needs user_id wired to createVendor (next session)
app/admin/page.tsx        Admin UI — isAdmin() gate, sign-out, post management
app/api/admin/posts/route.ts Admin API
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
Edit button: zIndex 10, top-right of hero
heroKey state: bumped on every upload to force <img> remount (cache bust fix)
No price on tiles
```

### Explorer / Curator mode
```
Mode toggle only shown to authenticated users
BottomNav: unauth → Home+YourFinds, authed → Home+MyShelf
```

---

## RULES & GOTCHAS
- All ecosystem pages need `export const dynamic = "force-dynamic"`
- Never use `export const config = {}` — deprecated in Next.js 14 App Router
- Always use `git add -A` — never individual paths (zsh glob-expands `[slug]`)
- `filesystem:write_file` is the ONLY reliable way to write files
- `str_replace` fails on bracket-path files — always full rewrite for `app/find/[id]/page.tsx`
- `useSearchParams()` requires Suspense wrapper — export default wraps inner component
- `getPostsByIds` has NO status filter — saved finds shown regardless of status
- `getFeedPosts` and `getMallPosts` filter `.eq("status","available")`
- safeStorage in all ecosystem client components EXCEPT raw localStorage for bookmark iteration
- Badge count = raw localStorage key iteration, NOT posts.length
- Supabase anonymous auth replaced by magic link — `signInAnonymously()` no longer used
- `ensureAnonSession()` is now a no-op stub — don't rely on it for new code
- Vercel project: `david-6613s-projects` scope (NOT zen-forged)
- Vercel webhook unreliable → `npx vercel --prod` if push doesn't deploy
- framer-motion: never two `transition` props on same motion.div
- MINIMUM font size: 10px
- Post type uses `price_asking` (not `price`) — `number | null`
- DevAuthPanel only renders on localhost — checked via `window.location.hostname`

---

## WORKING ✅
- Discovery feed — available-only, masonry, ModeToggle (auth-aware), PiLeaf saved indicator
- Feed header — "Vendor? Sign in" pill for unauth users, hides when logged in
- Magic link auth — login page, session persistence, isAdmin check
- Dev auth panel — localhost-only, tier switcher (guest/vendor/admin), magic link send, sign-out
- BottomNav — auth-driven tabs, iOS padding, badge
- ModeToggle — hidden for unauth users
- My Shelf — auth-gated, cinematic hero (L→R gradient), heroKey remount fix, Available/Found tabs, no price on tiles, Add tile, booth finder → Maps, Explore CTA, sign-out
- Find detail — owner controls inside location card (mark sold + delete), Curator-only gate
- Post flow — auth-gated, profile locked after setup, ensureAnonSession stub
- Admin — isAdmin() gate, access-denied screen, post management, sign-out
- Your Finds — no auth required, instant unsave, stale pruning
- vendors.hero_image_url — column exists, upload/update functions in lib/posts.ts
- safeStorage Safari fallback
- All reseller intel routes (untouched)

## KNOWN GAPS ⚠️
- post/preview page does NOT yet pass auth user_id to createVendor() — next session priority
- Owner detection may break for newly published posts until user_id wiring is fixed
- Hero image upload for location card (mall image) not yet wired
- No Supabase RLS (now feasible — auth is real)
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

# Auth debug — after visiting /login and completing magic link:
# Check Supabase Auth dashboard for new user row
# Check localStorage for treehouse_auth_uid
# Check vendors table for user_id populated after first publish

# Dev auth panel — localhost only
# Bottom-right pill shows current tier
# Expand → send magic link → check email → click → session persists
```
