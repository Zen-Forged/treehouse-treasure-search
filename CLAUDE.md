## HOW TO START A NEW SESSION

1. Start a new chat at claude.ai
2. Run in Terminal: `cat /Users/davidbutler/Projects/treehouse-treasure-search/CLAUDE.md`
3. Paste this into the new chat:

```
PROJECT: Treehouse — Zen-Forged/treehouse-treasure-search — treehouse-treasure-search.vercel.app
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

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
> Last updated: 2026-04-15

**Status:** Animation polish pass complete. Spring-tap + detail page drift-in shipped.

---

## What was done (this session)

### Animation vocabulary added — two pages

**Feed (`app/page.tsx`) — spring-tap image selection**
- `onPointerDown` on each tile triggers a brief spring-pop scale (`1.045`) with overshoot curve (`cubic-bezier(0.34,1.56,0.64,1)`) before navigation
- Green tint overlay (`rgba(30,77,43,0.09)`) fades in on tap over the image
- Settles back via slower ease (`0.32s cubic-bezier(0.22,1,0.36,1)`)
- Existing hover/scroll-reveal behavior unchanged

**Detail page (`app/find/[id]/page.tsx`) — layered drift-in**
- `pageVariants`: hero image enters `y:14→0, opacity:0→1` over 340ms
- `sectionVariants(delay)`: each content section staggers — mall row 60ms, title 100ms, price 150ms, caption 200ms, CTA 240ms, manage panel 280ms
- Heart button on hero uses `motion.button` with `whileTap={{ scale:1.22 }}` spring
- Easing throughout: `[0.25,0.46,0.45,0.94] as const` — required `as const` for TypeScript/Framer Motion type compat (see gotcha below)
- `EASE` constant defined at module level, reused in both `pageVariants` and `sectionVariants`

**Scroll-anchor fix (`app/page.tsx`) — `skipEntrance` prop**
- Spring-tap entrance animation broke back-nav scroll anchor: tiles starting at `opacity:0, translateY:16px` caused unstable layout geometry when `window.scrollTo` fired
- Fix: `skipEntrance` boolean prop threads from page → `MasonryGrid` → `MasonryTile`
- `skipEntrance = true` when `pendingScrollY.current !== null && !scrollRestored.current` (i.e. returning user with saved scroll position)
- When `skipEntrance`: `transition:"none"`, `willChange:"auto"`, `useScrollReveal` initializes `visible=true` immediately
- Fresh visits still get full stagger entrance; returning visits render instantly for stable layout

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
- Bottom sheet polish — two candidates identified:
  - Delete confirmation on `/find/[id]` — convert inline expand to bottom sheet (destructive actions feel more intentional on mobile)
  - Mall picker on `/post` — 29-location list is cramped as an inline accordion; a sheet with a scrollable list would be cleaner

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
/                   Discovery feed — masonry, scroll-triggered reveals, spring-tap selection, back-nav anchor
/login              Magic link login + Admin PIN tab
/find/[id]          Find detail — layered drift-in, floating back button, spring heart, "Explore the Booth" CTA, owner controls
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
app/page.tsx                Feed — spring-tap tiles, skipEntrance scroll anchor fix, stagger entrance
app/flagged/page.tsx        Find Map — grouped by mall (Sprint 3 overhaul pending)
app/shelves/page.tsx        Booths — Add Booth sheet centering fixed (wrapper div pattern) ✅
app/my-shelf/page.tsx       My Booth — Send icon on banner; standard header; edit icon top-left
app/shelf/[slug]/page.tsx   Public Booth — read-only
app/find/[id]/page.tsx      Find detail — layered drift-in, inline mall+booth row, spring heart ✅
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

### Animation system (current)

**Animation vocabulary — two durations, one spring:**
```
Micro-interactions (tap, hover):  0.14–0.18s
Page/section transitions:         0.28–0.44s
Spring (anything that "pops"):    type:"spring", stiffness:260, damping:20
Ease (everything else):           [0.25,0.46,0.45,0.94] as const  ← MUST use as const
```

**⚠️ TypeScript gotcha — Framer Motion ease arrays:**
```ts
// ❌ BROKEN — TypeScript infers number[], Framer Motion rejects it
const pageVariants = {
  visible: { transition: { ease: [0.25, 0.46, 0.45, 0.94] } }
};

// ✅ CORRECT — as const narrows to readonly tuple, satisfies BezierDefinition
const EASE = [0.25, 0.46, 0.45, 0.94] as const;
const pageVariants = {
  visible: { transition: { ease: EASE } }
};
```

**Feed tile entrance (`app/page.tsx`):**
```ts
// Scroll-triggered stagger — fresh visits only
// skipEntrance=true on back-navigation (pendingScrollY set, not yet restored)
// When skipEntrance: transition:"none", willChange:"auto", visible initializes true immediately
// This keeps layout geometry stable for window.scrollTo to land correctly

const staggerDelay = skipEntrance ? 0 : Math.min(index * 0.04, 0.28);
// outer div style:
{
  opacity: visible ? 1 : 0,
  transform: visible ? "translateY(0px)" : "translateY(16px)",
  transition: skipEntrance ? "none"
    : `opacity 0.38s ease ${staggerDelay}s, transform 0.44s cubic-bezier(0.22,1,0.36,1) ${staggerDelay}s`,
  willChange: skipEntrance ? "auto" : "opacity, transform",
}
```

**Spring-tap on feed tiles:**
```ts
// onPointerDown → setTapped(true) → setTimeout 320ms → setTapped(false)
// card style:
transform: tapped ? "scale(1.045)" : "scale(1)",
transition: tapped
  ? "transform 0.14s cubic-bezier(0.34,1.56,0.64,1), ..."  // spring overshoot in
  : "transform 0.32s cubic-bezier(0.22,1,0.36,1), ..."     // ease out
// + green tint overlay: opacity: tapped ? 1 : 0
```

**Detail page layered drift-in (`app/find/[id]/page.tsx`):**
```ts
const EASE = [0.25, 0.46, 0.45, 0.94] as const;
const pageVariants = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.34, ease: EASE } },
};
const sectionVariants = (delay: number) => ({
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, delay, ease: EASE } },
});
// Delays: hero 0, mall row 0.06, title 0.10, price 0.15, content 0.20, CTA 0.24, manage 0.28
// Heart button: motion.button whileTap={{ scale:1.22 }} spring stiffness:400 damping:17
```

**Image warmth hover (feed tiles):**
```ts
filter: hovered ? "brightness(1.04) saturate(1.10)" : "brightness(0.99) saturate(0.96)"
transform: hovered ? "scale(1.018)" : "scale(1)"
// Scale on img NOT on card — overflow:hidden clips it cleanly
```

### Deferred scroll restore pattern
```ts
// Keys: SCROLL_KEY = "treehouse_feed_scroll", LAST_VIEWED_KEY = "treehouse_last_viewed_post"
// Mount: read keys into refs — do NOT scrollTo (no DOM height yet)
// Post-render: fire scrollTo in useEffect([loading]) when loading flips false
// CRITICAL: skipEntrance must be true during restoration or tile translateY offsets break layout
```

### Bottom sheet pattern (use for overlays, confirmations, pickers)
```
// Animation: spring-driven upward slide — "bottom sheet" or "action sheet"
// initial={{ y: "100%" }} animate={{ y: 0 }}
// transition={{ type: "spring", damping: 28, stiffness: 280 }}
//
// CRITICAL: Never put centering transform on the motion.div — see FRAMER MOTION TRANSFORM RULES
// Always use a static wrapper div for positioning/centering:

<div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:300,
              display:"flex", justifyContent:"center", pointerEvents:"none" }}>
  <motion.div
    initial={{ y:"100%" }} animate={{ y:0 }} exit={{ y:"100%" }}
    transition={{ type:"spring", damping:28, stiffness:280 }}
    style={{ width:"100%", maxWidth:430, pointerEvents:"auto",
             maxHeight:"92dvh", display:"flex", flexDirection:"column",
             background:colors.bg, borderRadius:"20px 20px 0 0" }}
  >
    {/* drag handle */}
    {/* scrollable content with paddingBottom safe-area */}
  </motion.div>
</div>

// Identified Sprint 4 candidates for this pattern:
// - Delete confirmation on /find/[id] (currently inline expand)
// - Mall picker on /post (29-location list, cramped as inline accordion)
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
- **Framer ease arrays must use `as const` — see Animation system section above**
- **skipEntrance prop MUST be true during scroll restoration — see Deferred scroll restore pattern**
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
- Entrance animations that start at opacity:0/translateY must be bypassed during scroll restoration — unstable layout geometry will cause scrollTo to land at wrong position

---

## WORKING ✅
- Discovery feed — available-only, masonry, scroll-triggered tile reveals, spring-tap selection, warmth hover, back-nav anchor with highlight ring
- Feed scroll restore — deferred until loading → false; skipEntrance prevents geometry drift
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
- Find detail — layered drift-in, inline mall+booth row, spring heart, no floating BoothBox ✅
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
- Bottom sheet polish (Sprint 4) — two candidates identified:
  - Delete confirmation on `/find/[id]` — convert inline expand to bottom sheet (destructive actions feel more intentional on mobile)
  - Mall picker on `/post` — 29-location list is cramped as an inline accordion; a sheet with scrollable list would be cleaner

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
