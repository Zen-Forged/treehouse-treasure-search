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

**Status:** Sprint 3 in progress. Find detail layout overhauled, sheet centering fixed.

---

## What was done (this session)

### Find detail page (`app/find/[id]/page.tsx`) — layout overhaul
- **Floating BoothBox removed** — no more `position:absolute` badge overlapping image bottom; eliminated the `marginBottom: 34` gap it required
- **Mall + Booth inline row** — replaces right-justified block AND removed "Find it here" card entirely
  - Left: `MapPin` icon + mall name + address (wraps to 2 lines) + "· Directions" as tappable green link
  - Right: compact booth badge (label + number), `flexShrink: 0`
  - Layout: `space-between` flex row, `padding: "10px 20px 0"` — tight against image
- **"Find it here" card removed** — mall info is now only in the inline row above the title (no duplication)
- **Price + status on same row** — reduces vertical stacking
- Hero wrapper `marginBottom` removed (was `hasBoothBox ? 34 : 0`)

### Home page (`app/page.tsx`)
- `EmptyFeed` button: "Post a find" → **"Add a Booth"**, routes to `/shelves`

### Add Booth sheet (`app/shelves/page.tsx`) — centering fix
- **Root cause:** `left: "50%", transform: "translateX(-50%)"` on a `motion.div` was being overwritten by Framer's animation transform, shifting sheet to right half of screen
- **Fix:** Static positioning wrapper `div` (`left:0, right:0, display:flex, justifyContent:center`) wraps the `motion.div`; `motion.div` handles only `y` slide animation — no centering transform on it
- See **FRAMER MOTION TRANSFORM RULES** section below — this is a recurring issue

---

## Next session starting point — Sprint 3 (continued)

### Priority 1 — Vendor bio field
- `bio` column exists in DB + is fetched, but no UI to set or display it
- Add inline tap-to-edit on My Booth hero section (below vendor name)
- Display bio on public `/shelf/[slug]`

### Priority 2 — Find Map overhaul (`/flagged`)
- Group saved finds by mall location
- Per-mall route segments with car icon (driving between malls) and walk icon (within a mall)
- Show find-to-find navigation within each mall group
- Likely needs a lightweight map rendering approach (Mapbox static tiles or Google Maps embed)
- This is the largest Sprint 3 feature — plan before building

### Priority 3 — Hero image upload size guard
- Add `file.size > 12_000_000` check before upload in `app/my-shelf/page.tsx`
- Show inline error: "Image too large — please use a photo under 12MB"

### Priority 4 — Admin PIN production QA
- Confirm `ADMIN_PIN` and `SUPABASE_SERVICE_ROLE_KEY` are set in Vercel environment
- Test full admin PIN flow on production URL

### Priority 5 — Error monitoring
- Add Sentry free tier OR lean on Vercel function logs
- At minimum: wrap API routes in try/catch with structured `console.error`

### Priority 6 — Rate limiting on `/api/post-caption`
- Simple in-memory or Upstash Redis rate limiter (e.g. 10 req/min per IP)

### Sprint 4 (after Sprint 3)
- Feed content seeding — 10–15 real posts with quality photos before beta invite
- Feedback mechanism — Tally.so "Send feedback" link on My Booth or admin page
- Scroll restore QA on iPhone Safari + Chrome Android (edge case: mall filter active on return)
- Supabase RLS — row-level security so vendors can only edit their own posts
- Bookmarks cross-device sync (currently localStorage-only)
- Pagination / infinite scroll (currently flat 80-post fetch)
- Search
- Terms of service / privacy policy

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
lucide-react (Heart, Send, Store, Home, LayoutGrid icons in ecosystem UI)
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
| Unauth | No session | Browse feed, find detail, save to My Finds |
| Vendor | Magic link email | Post finds (one booth), My Booth, mark sold, delete own posts |
| Admin | Magic link OR Admin PIN | Everything + /admin + vendor switcher in My Booth + Add Booth + Booths page |

### Key files
- `lib/auth.ts` — `sendMagicLink`, `getSession`, `getUser`, `signOut`, `isAdmin(user)`, `onAuthChange`, `getCachedUserId`, `ensureAnonSession`
- `lib/posts.ts` — `getVendorByUserId(userId)`, `getVendorById(id)` — identity lookups
- `app/login/page.tsx` — Email link tab + Admin PIN tab; BroadcastChannel for cross-tab auth
- `app/api/auth/admin-pin/route.ts` — POST { pin } → generateLink → returns { otp, email }; client calls verifyOtp({ type: "email" })
- `components/DevAuthPanel.tsx` — dev-only floating panel (gated to NODE_ENV === "development" in layout.tsx ✅)

### Identity resolution — My Booth (authoritative order)
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
/find/[id]          Find detail — floating back button, heart+share on image, "Explore the Booth" CTA, owner controls card
/flagged            Find Map — saved finds grouped by mall location (overhaul Sprint 3)
/shelves            Booths — ADMIN ONLY in nav; Add Booth sheet (Mall → Booth # → Booth Name order)
/my-shelf           My Booth — auth-gated; admin gets vendor switcher; Send icon on banner
/shelf/[slug]       Public Booth — read-only
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
components/BottomNav.tsx    Role-based tabs: Guest(2) / Vendor(3) / Admin(4); isAdmin import
components/TabSwitcher.tsx  "On Display" / "Found a home" tab switcher
components/BoothFinderCard.tsx  Shared maps CTA card
components/ExploreBanner.tsx    "Discover more finds" → routes to /
components/ShelfGrid.tsx    ThreeColGrid, SkeletonGrid, AvailableTile, FoundTile, ShelfGridStyles
components/MallHeroCard.tsx MallHeroCard (no CTA) + GenericMallHero (with CTA) — showCta prop
components/DevAuthPanel.tsx Dev-only floating auth panel (gated in layout.tsx)
app/layout.tsx              PWA manifest, apple-touch-icon, meta tags ✅
app/page.tsx                Feed — "All Treehouse Spots" dropdown; "Recently added" always; sign-in inline; EmptyFeed → "Add a Booth" → /shelves
app/flagged/page.tsx        Find Map — grouped by mall (Sprint 3 overhaul pending)
app/shelves/page.tsx        Booths — Add Booth sheet centering fixed (wrapper div pattern) ✅
app/my-shelf/page.tsx       My Booth — Send icon on banner; standard header; edit icon top-left
app/shelf/[slug]/page.tsx   Public Booth — read-only
app/find/[id]/page.tsx      Find detail — inline mall+booth row, no floating BoothBox, no "Find it here" card ✅
app/post/page.tsx           Capture — AI fallback notice, price validation, scroll cache cleared on publish
app/post/edit/[id]/page.tsx Edit listing — price validation
app/admin/page.tsx          Admin UI
public/manifest.json        PWA manifest ✅
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

### MallHeroCard pattern
```tsx
// Mall-specific hero: eyebrow = "Treehouse Finds from", title = mall.name, NO CTA button
// Generic hero: eyebrow = "Treehouse Finds", title = "What will you find today?", HAS CTA button
// showCta prop controls button visibility
// Address shown as <a href={mapLink}> below title on mall heroes
```

### BottomNav tab logic
```
Guest (no user):   Home · Find Map                      (2 tabs)
Vendor (authed):   Home · Find Map · My Booth           (3 tabs)
Admin:             Home · Find Map · Booths · My Booth  (4 tabs)
// isAdmin(user) from lib/auth — Booths tab only renders for admin
```

### Find detail page layout order (current)
```
1. Hero image (full-bleed, back button top-left, heart+send bottom-right)
2. Mall + Booth inline row (space-between, 10px top pad, tight against image)
   LEFT:  MapPin + "Mall Name · Address · Directions" (green link, wraps 2 lines)
   RIGHT: Booth badge (label "BOOTH" + number, flexShrink:0)
3. Item title (Georgia 26px bold)
4. Price + status dot + "On Display" / "Found a home" — same row
5. Caption (italic Georgia 15px)
6. Description (13px muted)
7. "Explore the Booth" CTA → /shelf/[vendor-slug]
8. Hairline divider
9. "More from this shelf" horizontal scroll
10. Owner controls card (edit, mark sold, delete) — isMyPost only
NOTE: "Find it here" card removed — mall info lives only in row #2 above
```

### Animation patterns (feed)
```
// Scroll-triggered reveal hook
function useScrollReveal(threshold = 0.1) {
  // IntersectionObserver — visible flips true once, stays true, observer disconnects
  // Above-fold check on mount: rect.top < window.innerHeight → setVisible(true) immediately
}

// Image warmth hover (on <img> inside overflow:hidden container)
filter: hovered ? "brightness(1.04) saturate(1.10)" : "brightness(0.99) saturate(0.96)"
transform: hovered ? "scale(1.018)" : "scale(1)"
// Scale on img NOT on card — overflow:hidden clips it cleanly
```

### Deferred scroll restore pattern
```ts
// Keys: SCROLL_KEY = "treehouse_feed_scroll", LAST_VIEWED_KEY = "treehouse_last_viewed_post"
// Mount: read keys into refs — do NOT scrollTo (no DOM height yet)
// Post-render: fire scrollTo in useEffect([loading]) when loading flips false
```

### Committed terminology
```
Sold status:          "Found a home" — everywhere
Availability status:  "On Display" (was "Available")
Save action:          heart icon only (no text CTA on find detail)
Booth CTA:            "Explore the Booth" → /shelf/[slug]
Related items:        "More from this shelf"
Booth label:          "Booth 369" — always with word "Booth"
Admin hint:           "Manage"
Hero eyebrow:         "A curated shelf from"
Explore banner btn:   "Discover more finds" → /
Nav tab (vendor):     "My Booth" (was "My Shelf")
On Display tab:       "On Display" (was "Available")
Empty feed CTA:       "Add a Booth" → /shelves
```

### AdminOnly pattern
```tsx
import AdminOnly from "@/components/AdminOnly";
<AdminOnly user={user}>
  <button>Admin action</button>
</AdminOnly>
```

---

## ⚠️ FRAMER MOTION TRANSFORM RULES — READ BEFORE WRITING ANY motion.div

**Framer Motion owns the `transform` CSS property on every `motion.div`.** It uses `transform` to drive animations (slide, scale, rotate, fade-position). Any `transform` value you set in `style={}` on a `motion.div` will be silently overwritten at runtime by Framer's animation engine.

### The two recurring failures in this repo:

**1. Bottom sheet centering (FIXED in app/shelves/page.tsx)**
```tsx
// ❌ BROKEN — Framer overwrites translateX(-50%), sheet shifts to right half of screen
<motion.div
  initial={{ y: "100%" }} animate={{ y: 0 }}
  style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)" }}
/>

// ✅ CORRECT — wrapper div handles centering, motion.div handles only y slide
<div style={{ position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
  <motion.div
    initial={{ y: "100%" }} animate={{ y: 0 }}
    style={{ width: "100%", maxWidth: 430, pointerEvents: "auto" }}
  />
</div>
```

**2. Toast / modal centering (established pattern)**
```tsx
// ❌ BROKEN — Framer overwrites translate(-50%, -50%)
<motion.div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />

// ✅ CORRECT — inset-0 flex shell centers it, motion.div has no transform
<div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
  <motion.div style={{ pointerEvents: "auto" }} />
</div>
```

### The rule, stated plainly:
> **Never put centering `transform` on a `motion.div`.** If you need to center a `motion.div`, wrap it in a static `div` that handles all positioning and centering. The `motion.div` gets only width, background, border-radius, and animation props.

### Pre-flight checklist — before writing any animated overlay/sheet/modal/toast:
- [ ] Does this element need `transform: translate(...)` for centering? → Put it on a wrapper `div`, not the `motion.div`
- [ ] Does the `motion.div` have both `initial`/`animate` AND a `style.transform`? → That transform will be overwritten. Restructure.
- [ ] Never two `transition` props on the same `motion.div` — Framer silently ignores the second one

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
- **Framer transform conflicts — see FRAMER MOTION TRANSFORM RULES section above**
- New API route directories must be created in Terminal with `mkdir -p` before MCP can write into them
- New subdirectories must exist before `filesystem:write_file` — MCP can't create parent dirs
- `getPostsByIds` has NO status filter — saved finds shown regardless of status
- `getFeedPosts` and `getMallPosts` filter `.eq("status","available")`
- safeStorage in all ecosystem client components EXCEPT raw localStorage for bookmark iteration
- Badge count = raw localStorage key iteration, NOT posts.length
- Vercel project: `david-6613s-projects` scope (NOT zen-forged)
- Vercel webhook unreliable → `npx vercel --prod` if push doesn't deploy
- MINIMUM font size: 10px
- Post type uses `price_asking` (not `price`) — `number | null`
- Admin default vendor: `5619b4bf-3d05-4843-8ee1-e8b747fc2d81` (Zen booth, no user_id)
- Owner controls: `showOwnerControls = isMyPost` only — no `isCurator` / `getMode()` dependency
- NEVER redefine a local `C = {...}` object — always import from `lib/tokens.ts` (exception: app/post/page.tsx — intentional)
- NEVER copy-paste TabSwitcher, BoothFinderCard, ExploreBanner, ShelfGrid — always import from components
- Feed re-fetch: visibilitychange hidden→visible fires on SPA back-navigation in mobile browsers
- Scroll restore MUST be deferred until after feed renders — firing on mount causes silent scroll to 0

---

## WORKING ✅
- Discovery feed — available-only, masonry, scroll-triggered tile reveals, warmth hover, back-nav anchor with highlight ring
- Feed scroll restore — deferred until loading → false
- Feed re-fetches on return from other routes (visibilitychange pattern)
- Feed scroll cache cleared on publish → lands at top showing new post
- Magic link auth — login page, session persistence, isAdmin check
- Admin PIN login — email_otp flow
- DevAuthPanel — dev-only (gated in layout.tsx) ✅
- BottomNav — role-based tabs (Guest 2 / Vendor 3 / Admin 4); Booths admin-only ✅
- Booths page — Add Booth sheet centering fixed (wrapper div pattern) ✅
- My Booth — auth-gated; admin vendor switcher; hero upload; Send icon on banner ✅
- Post flow — AI caption with fallback notice ✅; price validation ✅
- Edit listing — price validation ✅; image replacement
- Find detail — inline mall+booth row, no floating BoothBox, no duplicate "Find it here" card ✅
- Public Booth — read-only, shared ShelfGrid ✅
- Find Map (`/flagged`) — saved finds; "Found a home" terminology ✅ (overhaul Sprint 3)
- Mall locations — 29 locations in Supabase ✅
- PWA manifest — Add to Home Screen enabled ✅
- TabSwitcher — "On Display" / "Found a home" ✅
- MallHeroCard — "Treehouse Finds from [name]", address hyperlink, no CTA button ✅
- All reseller intel routes (untouched)

## KNOWN GAPS / SPRINT 3 ⚠️
- Vendor bio field — DB column exists, no UI to set or display
- Find Map overhaul — grouped by mall, car/walk icons, route segments (largest Sprint 3 feature)
- Hero image upload: no client-side size guard (12MB limit)
- Admin PIN not QA'd in production
- No error monitoring (Sentry / Vercel logs)
- No rate limiting on `/api/post-caption`
- Feed needs content seeding before beta invite (10–15 real posts)
- Feedback mechanism for beta users (Tally.so)
- Scroll restore QA on iPhone Safari + Chrome Android
- No Supabase RLS (Sprint 4)
- Bookmarks localStorage-only (Sprint 4)
- No pagination/infinite scroll (Sprint 4)
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
