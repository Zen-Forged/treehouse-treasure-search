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

**Status:** 🚧 MVP launch sprint complete — 7 issues shipped, pending deploy + QA.

**What was done (this session):**

### MVP launch sprint — all 7 issues shipped

**Issue 1 — Admin save bug (banner + items)**
- `app/my-shelf/page.tsx` — `AddFindTile` now accepts `vendorId` prop and passes `?vendor=[id]` to `/post`. This ensures admin posting from any booth's My Shelf goes to that vendor, not their own linked vendor.
- `app/post/page.tsx` — Added `?vendor=[id]` query param resolution as step 1 of identity chain. Admin with param → `getVendorById(vendorParam)` → post to that booth. Wrapped in `Suspense` for `useSearchParams`.
- Banner image upload was already correct (uses `activeVendor.id` throughout). No change needed.

**Issue 2 — Save confirmation position + redirect**
- `app/post/page.tsx` — Toast moved from bottom-right to screen center (`position: fixed, top: 50%, left: 50%, transform: translate(-50%, -50%)`). Redesigned as a larger vertical card. After successful save, auto-redirects to `/my-shelf` after 1.8s with "Taking you to your shelf…" subtitle.

**Issue 3 — Back button on product photo**
- `app/find/[id]/page.tsx` — Floating frosted back button added top-left of hero image. Frosted cream circle (`rgba(240,237,230,0.82)` + `blur(12px)`), safe-area-aware top position, `ArrowLeft` icon.

**Issue 4 — Share icon → paper airplane**
- `app/find/[id]/page.tsx` — Share icon changed from `Share2` to `Send` (lucide paper airplane). Same position (bottom-right of hero image).

**Issue 5 — Leaf icon: top-right of feed tiles, larger**
- `app/page.tsx` — Leaf button moved from bottom-right to top-right of image. Size increased to 17px. Always visible (not conditional on saved state). Frosted dark background when unsaved, green solid when saved.

**Issue 6 — Leaf toggleable from feed + detail**
- `app/page.tsx` — Tapping leaf in feed now toggles save/unsave immediately. Badge count updates reactively.
- `app/find/[id]/page.tsx` — Leaf button in location card now reads "Remove from My Finds" when saved and removes on tap. Full two-way toggle.

**"Add to path" button**
- `app/find/[id]/page.tsx` — New centered "Add to path" button under description/caption text. Saves to My Finds and redirects to `/flagged` after 320ms. Shows "Added to My Finds" state. Hidden in Curator mode.

**Issue 7 — My Finds always in nav**
- `components/BottomNav.tsx` — "Your Finds" renamed to "My Finds". Always present for ALL users. Auth users: Home · My Finds · My Shelf (3 tabs). Unauth users: Home · My Finds (2 tabs). Removed Shelves from nav.

**Previous sessions:**
- Shelves page + 3-tab nav
- Admin vendor switcher dropdown in My Shelf
- Admin PIN email_otp flow
- Hero image persistence fix (heroLockedRef)
- safeStorage Safari fallback
- Auth sprint — magic link login

**Next session starting point:**
1. Deploy: `git add -A && git commit -m "feat: MVP launch sprint" && git push` then `npx vercel --prod` if webhook doesn't fire
2. QA checklist:
   - Admin: switch to non-linked booth → tap Add tile → confirm posting to that booth
   - Admin: upload banner image for any booth → confirm saves + persists on reload
   - Feed: tap leaf → confirm adds/removes from My Finds badge
   - Find detail: "Add to path" → redirects to My Finds
   - Find detail: back button top-left visible and working
   - Find detail: share icon is paper airplane
   - Nav: My Finds tab always visible (unauth and auth)
   - Post page: save toast centered, auto-redirects to My Shelf
3. Consider: Supabase RLS now feasible (auth is solid)
4. Consider: feed refresh after posting (pull-to-refresh or navigate)
5. Consider: restore Shelves tab if desired (was removed this session)

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
| Unauth | No session | Browse feed, find detail, save to My Finds |
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
1. Admin with `?vendor=[id]` param → `getVendorById(vendorParam)` — admin override
2. `getVendorByUserId(user.id)` — Supabase wins if auth
3. localStorage `th_vendor_profile` — cache only
4. Setup form — first-time or unauth

### Session persistence
- Supabase Auth sessions persist across browser restarts (pkce flow default)
- `treehouse_auth_uid` localStorage key caches user.id for sync owner detection

---

## ROUTE MAP

### Ecosystem (warm parchment theme)
```
/                   Discovery feed — ModeToggle hidden for unauth, "Curator Sign in" for unauth
/login              Magic link login — enter email → check email → confirming; + Admin PIN tab
/find/[id]          Find detail — back button, share (paper airplane), "Add to path" CTA, leaf toggle
/flagged            My Finds (Explorer) — no auth required, always in nav
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
lib/posts.ts              Data access — getVendorByUserId, getVendorById, getFeedPosts, getPost,
                          getVendorPosts, createPost, createVendor,
                          uploadPostImage, uploadVendorHeroImage, updateVendorHeroImage, etc.
lib/mode.ts               Explorer/Curator mode — getMode(), setMode()
lib/safeStorage.ts        localStorage wrapper with sessionStorage + memory fallback
lib/postStore.ts          In-memory image store for /post/preview (legacy, still used by preview page)
types/treehouse.ts        Post, Vendor (+ hero_image_url), Mall, LocalVendorProfile
components/BottomNav.tsx  2-tab (unauth: Home · My Finds) / 3-tab (auth: Home · My Finds · My Shelf)
components/ModeToggle.tsx Hidden when unauth, shown to logged-in users only
components/DevAuthPanel.tsx  Localhost-only floating auth tier switcher
components/PiLeafIcon.tsx PiLeaf from react-icons/pi wrapper
components/MallHeroCard.tsx MallHeroCard + GenericMallHero exports
app/login/page.tsx        Magic link login + Admin PIN tab; Suspense wrapper for useSearchParams
app/layout.tsx            No max-width wrapper, DevAuthPanel mounted here
app/page.tsx              Discovery feed — leaf icon top-right of tiles, toggleable save/unsave
app/flagged/page.tsx      My Finds — no auth required
app/shelves/page.tsx      Shelves — all vendor booths; admin taps → /my-shelf?vendor=[id]
app/my-shelf/page.tsx     My Shelf — admin vendor switcher, AddFindTile passes ?vendor=[id] to /post
app/shelf/[slug]/page.tsx Public Saved Shelf — read-only, no editing, cinematic hero, booth finder
app/find/[id]/page.tsx    Find detail — back btn top-left, Send icon share, "Add to path" CTA, leaf toggle
app/post/page.tsx         Capture — admin ?vendor param → correct booth; centered toast → redirects to /my-shelf
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

### Find detail page — key UI elements
```
Back button: top-left of hero image, frosted cream circle, ArrowLeft icon
Share button: bottom-right of hero image, Send icon (paper airplane)
Add to path: centered pill button under description, PiLeaf icon, redirects to /flagged
Leaf in location card: toggleable — "Save to My Finds" / "Remove from My Finds"
```

### BottomNav — tabs
```
Unauth:  Home · My Finds  (2 tabs)
Auth:    Home · My Finds · My Shelf  (3 tabs)
Icons:   Home (lucide Home) · My Finds (PiLeaf) · My Shelf (lucide Store)
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
- AddFindTile passes `?vendor=[id]` to /post — critical for admin to post to correct booth
- Post page uses Suspense wrapper for useSearchParams (admin vendor param)

---

## WORKING ✅
- Discovery feed — available-only, masonry, ModeToggle (auth-aware), PiLeaf top-right toggleable
- Feed header — "Curator Sign in" pill for unauth users, hides when logged in
- Magic link auth — login page, session persistence, isAdmin check
- Admin PIN login — email_otp flow, rate limited (needs Vercel env vars to work in prod)
- Dev auth panel — localhost-only, tier switcher (guest/vendor/admin), magic link send, sign-out
- BottomNav — My Finds always visible; 2-tab unauth, 3-tab auth; iOS padding; badge
- ModeToggle — hidden for unauth users
- Shelves page — all vendor booths at America's Antique Mall; admin manages from here
- My Shelf — auth-gated; admin gets Zen booth by default + vendor switcher dropdown
- My Shelf AddFindTile — passes ?vendor=[id] so admin posts to correct booth
- Public Saved Shelf (/shelf/[slug]) — read-only cinematic view, no edit controls
- Find detail — back button, paper airplane share, "Add to path" CTA, leaf toggle (add/remove)
- Post flow — centered toast, auto-redirects to /my-shelf after save; admin posts to correct vendor
- post/preview — "Save to Shelf" button, "Saved to shelf." done state
- Admin — isAdmin() gate, access-denied screen, post management, sign-out
- My Finds — no auth required, instant unsave, stale pruning
- vendors.hero_image_url — column exists, upload/update functions in lib/posts.ts
- safeStorage Safari fallback
- All reseller intel routes (untouched)

## KNOWN GAPS ⚠️
- Admin PIN needs QA in production (SUPABASE_SERVICE_ROLE_KEY + ADMIN_PIN must be set in Vercel)
- Feed doesn't refresh after adding item from /post (auto-redirects to /my-shelf now, but feed is stale)
- No Supabase RLS (now feasible — auth is real and identity is solid)
- No pull-to-refresh on feed
- No PWA support
- `/enhance-text` is mock
- Shelves tab removed from BottomNav this session — accessible via /shelves URL directly

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
```
