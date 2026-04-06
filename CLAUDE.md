# Treehouse — Claude Working Instructions
> Repo: Zen-Forged/treehouse-treasure-search | Live: treehouse-treasure-search.vercel.app
> Full architecture: CONTEXT.md

---

## HOW TO START A NEW SESSION

Paste this at the top of every new conversation:

```
PROJECT: Treehouse — Zen-Forged/treehouse-treasure-search
Read CLAUDE.md and CONTEXT.md before doing anything.
Current issue: [paste the CURRENT ISSUE section below]
```

Then paste the **CURRENT ISSUE** section verbatim. That gives Claude everything needed without re-explaining the whole project.

---

## CURRENT ISSUE
> Update this section every time you finish a session or hit a blocker.

**Status:** iPhone publish flow fails — "vendor creation failed" error on device, works fine on desktop Chrome.

**What we know:**
- Desktop Chrome: full publish flow works (status 201, confirmed via live browser debug)
- Supabase RLS: disabled on posts, vendors, malls — confirmed not the issue
- localStorage on desktop has correct data: `{ display_name, booth_number, mall_id: "19a8ff7e-...", vendor_id: "65a879f1-...", slug }`
- Direct Supabase insert via debug API: vendor insert ✅, post insert ✅
- Browser fetch intercept on desktop: post inserts with 201 ✅
- iPhone-specific: unknown — likely Safari localStorage, HEIC image format, or body size issue

**Hypotheses not yet tested on iPhone:**
1. Safari private browsing mode blocks localStorage → profile is null → vendor creation attempted with empty mall_id
2. iPhone camera outputs HEIC format → FileReader fails → imageDataUrl is malformed → postStore.set() gets bad data → preview page bounces back to /post
3. The image compression on iPhone is producing a payload too large for the API route

**What to try next:**
- Have user open `/post` on iPhone and confirm vendor profile card shows name/mall (not blank)
- If blank → localStorage is the issue (private browsing or Safari ITP)
- If populated → take photo, on preview page check if title/caption generated (confirms image was read correctly)
- If title/caption missing → image format issue
- If title/caption present but publish fails → Supabase insert issue specific to iPhone network

**Files relevant to this issue:**
- `app/post/page.tsx` — capture + profile validation
- `app/post/preview/page.tsx` — title/caption generation + publish flow
- `lib/posts.ts` — createVendor, createPost, uploadPostImage
- `app/api/debug/route.ts` — live diagnostics endpoint

---

## PROJECT OVERVIEW

**What it is:** Local discovery ecosystem for vintage/antique/thrift finds.
- Buyers browse feed → Vendors post finds → Mall operators get foot traffic
- Reseller intel tool (/scan → /decide) exists as a secondary feature

**Two independent layers:**
1. **Ecosystem** (front door): feed, vendor profiles, mall pages, post flow → Supabase
2. **Reseller intel**: scan → identify → comps → decide → localStorage only

---

## STACK
```
Next.js 14 App Router · TypeScript · Tailwind CSS · Framer Motion
Anthropic SDK (claude-opus-4-5) · Supabase (Postgres + Storage) · SerpAPI · Vercel
```

---

## ENV VARS
```
NEXT_PUBLIC_SUPABASE_URL         https://zogxkarpwlaqmamfzceb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY    eyJhbGci... (JWT, set in Vercel + .env.local)
ANTHROPIC_API_KEY                Claude Vision + caption generation
SERPAPI_KEY                      eBay sold comps
```

---

## SUPABASE
- **Tables:** malls, vendors, posts (RLS disabled on all three)
- **Storage bucket:** post-images (public)
- **Only mall:** America's Antique Mall, id: `19a8ff7e-cb45-491f-9451-878e2dde5bf4`
- **Known vendor:** ZenForged Finds, booth 369, id: `65a879f1-c43c-481b-974f-379792a36db8`
- **Schema note:** vendors table has `facebook_url text` column (added manually)

---

## ROUTE MAP

### Ecosystem routes (cream/light theme)
```
/                   Discovery feed — front door
/find/[id]          Find detail — full image, vendor info, vendor actions (mark sold/delete)
/mall/[slug]        Mall profile
/vendor/[slug]      Vendor profile — Facebook link, available/sold grid
/post               Vendor capture — camera/gallery, profile setup
/post/preview       Edit title/caption/price → publish to Supabase
```

### Reseller intel routes (dark forest theme — untouched)
```
/scan → /discover → /refine → /decide → /intent → /enhance-text → /share
/finds, /finds/[id]
```

### API routes
```
POST /api/post-caption    Claude → { title, caption } from image (mock fallback included)
POST /api/identify        Claude Vision → { title, description, confidence, searchQuery }
GET  /api/sold-comps      SerpAPI eBay comps, 48h in-memory cache
GET  /api/debug           Live Supabase connectivity + insert test
```

---

## KEY FILES
```
lib/supabase.ts           Supabase client (placeholder fallback for build time)
lib/posts.ts              All data functions: getFeedPosts, getPost, createPost,
                          createVendor, uploadPostImage, updatePostStatus, deletePost,
                          getAllMalls, getMallBySlug, getVendorBySlug, slugify
lib/postStore.ts          In-memory image store for post flow (avoids sessionStorage)
types/treehouse.ts        Post, Vendor, Mall, LocalVendorProfile, PostStatus
app/layout.tsx            No max-width wrapper — each page owns its own width
```

---

## DESIGN SYSTEM

### Ecosystem pages (light theme)
```
bg:           #f0ede6  warm cream
surface:      #e8e4db
border:       rgba(26,26,24,0.1)
textPrimary:  #1a1a18
textMid:      #4a4a42
textMuted:    #8a8478
textFaint:    #b0aa9e
green:        #1e4d2b  (CTAs, active states)
```

### Reseller pages (dark theme — do not change)
```
bg:    #050f05
text:  #f5f0e8
gold:  #c8b47e
green: #6dbc6d
```

### Shared rules
```
Font:        Georgia serif (headings), monospace (prices), system (body)
Max-width:   430px per page
Safe area:   env(safe-area-inset-bottom) on all fixed bars
Animations:  opacity 0→1, y 8-16→0, ease [0.25,0.1,0.25,1], whileTap scale 0.97
```

---

## KNOWN ARCHITECTURAL RULES
- `export const dynamic = "force-dynamic"` on all pages that import from lib/supabase.ts
- Supabase client uses placeholder URL/key at build time to avoid prerender crash
- zsh: always use `git add -A` not individual paths (brackets cause glob expansion)
- `export const config = {}` is deprecated in Next.js 14 App Router — never use it
- Image upload: `uploadPostImage` is non-fatal — post goes through even if image fails
- vendor_id only carried over in LocalVendorProfile if mall hasn't changed

---

## WORKING ✅
- Discovery feed loads from Supabase, skeleton loading, filters
- Find detail: full-image display (contain, no crop), vendor/mall card, directions
- Vendor actions on own posts: mark sold/available, delete with confirmation
- Facebook share button (sharer.php popup)
- Vendor profile page: Facebook link, light theme, available/sold grid
- Mall profile page: grid, directions, available/sold split
- Vendor post flow (desktop): capture → AI title+caption → preview → publish → live
- Image upload to Supabase Storage
- All reseller intel routes (untouched from original build)

## KNOWN GAPS ⚠️
- iPhone publish flow broken (see CURRENT ISSUE above)
- /enhance-text caption refinement is mock (not real Claude call)
- No Supabase RLS (auth not implemented yet — planned future sprint)
- No pull-to-refresh on feed
- No mark-as-sold from vendor profile page (only from find detail)
- Facebook share is sharer.php popup, not native iOS share sheet
- No PWA/offline support

---

## DEBUGGING PATTERNS
```bash
# Check live env vars and Supabase connectivity
curl -s https://treehouse-treasure-search.vercel.app/api/debug | python3 -m json.tool

# Vercel logs
npx vercel logs --prod | grep -i "error"

# Build test before pushing
npm run build 2>&1 | tail -30

# Git — always use -A to avoid zsh glob issues with [slug] paths
git add -A && git commit -m "..." && git push
```

---

## SESSION WORKFLOW (recommended)
1. Start session by pasting the CURRENT ISSUE section
2. Fix the issue
3. Before ending session, update CURRENT ISSUE with new status
4. Commit CLAUDE.md with the update: `git add CLAUDE.md && git commit -m "docs: update current issue"`

This keeps the next session from wasting turns re-diagnosing.
