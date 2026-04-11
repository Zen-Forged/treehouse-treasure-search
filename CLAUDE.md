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

**Status:** 🚧 Identity fix complete — needs deploy + one-time Supabase backfill.

**What was done (this session):**

### Vendor identity architecture fix — root cause resolved

**Problem:** Two disconnected identity systems. `/post` read from localStorage (device-local, stale) while `/my-shelf` showed data from Supabase. If localStorage had a different vendor name than the authenticated user's Supabase row, posting went to the wrong vendor account and images uploaded to the wrong storage path.

**Fix — new function `getVendorByUserId(userId)` in `lib/posts.ts`:**
- Queries `vendors` table by `user_id` using `.maybeSingle()` (returns null, not error, when no row found)
- Returns full vendor with joined mall

**Fix — `app/my-shelf/page.tsx` rewritten:**
- Identity resolution now: `getVendorByUserId(user.id)` → confirmed Supabase vendor → write back to localStorage as cache
- Removed all dependency on `localStorage.vendor_id` as lookup key
- `getVendorsByMall` no longer used for identity — only `getVendorByUserId`
- After Supabase lookup completes, localStorage is updated so `/post` stays in sync
- `vendorReady` flag prevents skeleton from flashing before lookup completes

**Fix — `app/post/page.tsx` rewritten:**
- On load: checks auth session → if auth, calls `getVendorByUserId(user.id)` first
- If Supabase vendor found: `resolvedVendor` state locked — localStorage is ignored for identity
- If not found: falls back to localStorage as pending identity (for unauth or first-time users)
- `handleFile` now derives `vendorId`, `mallId`, `boothNumber` from `resolvedVendor` (if present) before falling back to `localProfile`
- localStorage is synced from Supabase result immediately, so future loads are consistent
- Setup form only shown when neither source has a valid identity

**What this means in practice:**
- Log in with magic link on any device → My Shelf and Add to Shelf both show ZenForged Finds booth 369
- Post an item → image uploads to `{correct_vendor_id}/timestamp.jpg`
- No more "posting as Kentucky Treehouse" when logged in as ZenForged Finds

### ⚠️ One-time Supabase action required
The existing ZenForged Finds vendor row (id: `65a879f1-c43c-481b-974f-379792a36db8`) needs `user_id` set to David's auth UID for `getVendorByUserId` to work. Check:

```sql
-- Run in Supabase SQL editor
SELECT id, display_name, user_id FROM vendors;
```

If `user_id` is null on the ZenForged Finds row, update it:
```sql
-- Replace <david_uid> with your actual Supabase auth user ID
-- (find it in Supabase → Authentication → Users → david@zenforged.com)
UPDATE vendors SET user_id = '<david_uid>' WHERE id = '65a879f1-c43c-481b-974f-379792a36db8';
```

After that update, `getVendorByUserId` will find the correct row on every device and login.

**Previous sessions:**
- Admin PIN shipped + fixed (action_link token extraction)
- Hero image persistence fix (heroLockedRef)
- Save to Shelf flow (inline toast, no preview redirect)
- Public Saved Shelf at /shelf/[slug]
- Auth sprint — magic link login, auth-gated pages, admin gate wired
- My Shelf redesign — cinematic hero card, tab switcher, Maps link
- safeStorage iPhone Safari bug fix, Anonymous Auth Sprint

**Next session starting point:**
1. Run the SQL above to backfill `user_id` on ZenForged Finds vendor row
2. Deploy: `git add -A && git commit -m "fix: auth-first vendor identity resolution" && git push`
3. QA on device: log in → `/post` should show ZenForged Finds → add item → appears on correct shelf
4. QA hero image upload: should persist now
5. Confirm Admin PIN works once `SUPABASE_SERVICE_ROLE_KEY` + `ADMIN_PIN` are set in Vercel
6. Consider Supabase RLS — now unblocked

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
- **Known vendor:** ZenForged Finds, booth 369, id: `65a879f1-c43c-481b-974f-379792a36db8`
- **Extra columns:** vendors table has `facebook_url text`, `user_id uuid`, `hero_image_url text`
- **Unique constraint:** `vendors_mall_booth_unique` on `(mall_id, booth_number)`
- **⚠️ Action needed:** Set `user_id` on ZenForged Finds row to David's auth UID (see CURRENT ISSUE)

---

## AUTH SYSTEM

### Three tiers
| Tier | How | Can do |
|---|---|---|
| Unauth | No session | Browse feed, find detail, save to Your Finds |
| Vendor | Magic link email | Post finds (one booth), My Shelf, mark sold, delete own posts |
| Admin | Magic link OR Admin PIN | Everything + /admin |

### Key files
- `lib/auth.ts` — `sendMagicLink`, `getSession`, `getUser`, `signOut`, `isAdmin(user)`, `onAuthChange`, `getCachedUserId`, `ensureAnonSession`
- `lib/posts.ts` — `getVendorByUserId(userId)` — authoritative identity lookup for logged-in users
- `app/login/page.tsx` — Email link tab + Admin PIN tab; BroadcastChannel for cross-tab auth
- `app/api/auth/admin-pin/route.ts` — POST { pin } → extracts token from action_link URL → returns { token, email }
- `components/DevAuthPanel.tsx` — localhost-only floating panel for auth tier switching

### Identity resolution (authoritative order)
1. `getVendorByUserId(user.id)` — Supabase is source of truth for logged-in users
2. localStorage `th_vendor_profile` — cache only, written after Supabase confirms
3. Setup form — shown only when no Supabase vendor and no localStorage

### Session persistence
- Supabase Auth sessions persist across browser restarts (pkce flow default)
- `treehouse_auth_uid` localStorage key caches user.id for sync owner detection

### Vendor rules
- One booth per vendor auth account (enforced by `vendors_mall_booth_unique` constraint)
- Booth identity locked after first publish — cannot be edited by vendor
- Admin can manage booth identity via /admin

---

## ROUTE MAP

### Ecosystem (warm parchment theme)
```
/                   Discovery feed — ModeToggle hidden for unauth, "Curator Sign in" for unauth
/login              Magic link login — enter email → check email → confirming; + Admin PIN tab
/find/[id]          Find detail — owner controls (mark sold + delete) inside "Find this here" card
/flagged            Your Finds (Explorer) — no auth required
/my-shelf           My Shelf (Curator) — auth-gated, identity from Supabase user_id lookup
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
lib/posts.ts              Data access — getVendorByUserId (NEW, authoritative identity lookup),
                          getFeedPosts, getPost, getVendorPosts, createPost, createVendor,
                          uploadPostImage, uploadVendorHeroImage, updateVendorHeroImage, etc.
lib/mode.ts               Explorer/Curator mode — getMode(), setMode()
lib/safeStorage.ts        localStorage wrapper with sessionStorage + memory fallback
lib/postStore.ts          In-memory image store for /post/preview (legacy, still used by preview page)
types/treehouse.ts        Post, Vendor (+ hero_image_url), Mall, LocalVendorProfile
components/BottomNav.tsx  Auth-driven: unauth→Home+YourFinds, authed→Home+MyShelf
components/ModeToggle.tsx Hidden when unauth, shown to logged-in users only
components/DevAuthPanel.tsx  Localhost-only floating auth tier switcher
components/PiLeafIcon.tsx PiLeaf from react-icons/pi wrapper
components/MallHeroCard.tsx MallHeroCard + GenericMallHero exports
app/login/page.tsx        Magic link login + Admin PIN tab; Suspense wrapper for useSearchParams
app/layout.tsx            No max-width wrapper, DevAuthPanel mounted here
app/page.tsx              Discovery feed — ModeToggle + "Curator Sign in" (auth-aware)
app/flagged/page.tsx      Your Finds — no auth required
app/my-shelf/page.tsx     My Shelf — getVendorByUserId for identity, heroLockedRef, share → /shelf/[slug]
app/shelf/[slug]/page.tsx Public Saved Shelf — read-only, no editing, cinematic hero, booth finder
app/find/[id]/page.tsx    Find detail — owner controls inside location card
app/post/page.tsx         Capture — resolvedVendor (Supabase) > localProfile (localStorage) > setup form
app/post/preview/page.tsx Preview + "Save to Shelf" button — optional edit step
app/admin/page.tsx        Admin UI — isAdmin() gate, sign-out, post management
app/api/admin/posts/route.ts Admin API
app/api/auth/admin-pin/route.ts PIN login — extracts token from action_link URL
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
- `str_replace` fails on bracket-path files — always full rewrite for `app/find/[id]/page.tsx`, `app/shelf/[slug]/page.tsx`
- `useSearchParams()` requires Suspense wrapper — export default wraps inner component
- `getPostsByIds` has NO status filter — saved finds shown regardless of status
- `getFeedPosts` and `getMallPosts` filter `.eq("status","available")`
- safeStorage in all ecosystem client components EXCEPT raw localStorage for bookmark iteration
- Badge count = raw localStorage key iteration, NOT posts.length
- Identity resolution: Supabase (`getVendorByUserId`) > localStorage cache > setup form
- localStorage is a CACHE of Supabase identity — never the source of truth for logged-in users
- Vercel project: `david-6613s-projects` scope (NOT zen-forged)
- Vercel webhook unreliable → `npx vercel --prod` if push doesn't deploy
- framer-motion: never two `transition` props on same motion.div
- MINIMUM font size: 10px
- Post type uses `price_asking` (not `price`) — `number | null`
- DevAuthPanel only renders on localhost — checked via `window.location.hostname`
- Admin PIN: `generateLink` action_link URL contains the raw token in `?token=` param — NOT `hashed_token`
- heroLockedRef in My Shelf: set to true during upload, released after 3s

---

## WORKING ✅
- Discovery feed — available-only, masonry, ModeToggle (auth-aware), PiLeaf saved indicator
- Feed header — "Curator Sign in" pill for unauth users, hides when logged in
- Magic link auth — login page, session persistence, isAdmin check
- Admin PIN login — extracts token from action_link URL, rate limited, instant session
- Dev auth panel — localhost-only, tier switcher (guest/vendor/admin), magic link send, sign-out
- BottomNav — auth-driven tabs, iOS padding, badge
- ModeToggle — hidden for unauth users
- My Shelf — auth-gated, identity from getVendorByUserId, cinematic hero, heroLockedRef, tabs, share → /shelf/[slug]
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
- **ZenForged Finds `user_id` not set in DB** — must run SQL backfill before identity fix takes effect
- Admin PIN: needs SUPABASE_SERVICE_ROLE_KEY + ADMIN_PIN set in Vercel env vars before it works
- Feed doesn't refresh after adding item from /post toast (need navigate or pull-to-refresh)
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

# Identity debug — after logging in on device:
# Check Supabase → Table Editor → vendors → ZenForged Finds row → user_id column
# Should match Supabase → Authentication → Users → david@zenforged.com → user UID
# If null: run the UPDATE SQL in the CURRENT ISSUE section above

# Admin PIN debug
# Check Vercel function logs for "[admin-pin]" entries
# Supabase dashboard → Auth → Users — admin email should appear after successful PIN login
```
