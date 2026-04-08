# Treehouse — Master Context Document
> Last updated: 2026-04-07 | Repo: Zen-Forged/treehouse-treasure-search | Live: treehouse-treasure-search.vercel.app

---

## 1. Product Overview

Treehouse is a **local discovery ecosystem for vintage, antique, and thrift finds.**

- **Buyers** browse a real-time feed before making the trip.
- **Vendors** post finds for visibility without needing a full e-commerce stack.
- **Mall operators** get organic foot traffic through their vendors' content.
- **Resellers** (future premium) get comp and profit analysis via the `/scan → /decide` flow.

The front door is the **Discovery Feed** (`/`). The reseller intel tool (`/scan`) is a secondary feature, not the entry point. No auth required — vendor identity is persisted to localStorage.

### Design philosophy

The ecosystem layer is intentionally **not a marketplace**. It is a calm, story-driven discovery experience:
- No prices in the feed grid — items feel like finds, not listings
- No filter pills or status toggles — unified feed only
- Sold items remain visible ("Found a home") for social proof and storytelling
- Copy is warm and observational, never transactional
- Layout breathing room over density

### Two independent layers

| Layer | Front door | Data store | Auth |
|---|---|---|---|
| **Ecosystem** (vendors, malls, posts) | `/` Discovery Feed | Supabase (Postgres + Storage) | None — localStorage profile |
| **Reseller intel** (identify, comps, decide) | `/scan` | sessionStorage + localStorage | None |

---

## 2. Tech Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + inline styles |
| Animations | framer-motion |
| Icons | lucide-react |
| AI | @anthropic-ai/sdk — `claude-opus-4-5` |
| Database | Supabase (Postgres) |
| Storage | Supabase Storage — bucket: `post-images` |
| Comp data | SerpAPI (eBay) |
| Deployment | Vercel |

**package.json dependencies**
```
@anthropic-ai/sdk ^0.80.0
@supabase/supabase-js
clsx ^2.1.1
framer-motion ^12.38.0
lucide-react ^0.383.0
next 14.2.5
react ^18
react-dom ^18
```

---

## 3. Environment Variables

```
# AI
ANTHROPIC_API_KEY              Claude Vision + caption generation. Falls back to mocks if absent.

# Comp data
SERPAPI_KEY                    eBay sold comps via SerpAPI.
COMP_SOURCE                    "serpapi" (default) or "apify"
APIFY_TOKEN                    Required if COMP_SOURCE=apify

# Supabase
NEXT_PUBLIC_SUPABASE_URL       Supabase project URL (public)
NEXT_PUBLIC_SUPABASE_ANON_KEY  Full JWT anon key from Supabase dashboard (NOT publishable key format)
```

---

## 4. Supabase Schema

### `malls`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | text | |
| city | text | |
| state | text | |
| slug | text | URL-safe, unique |
| address | text | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `vendors`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| mall_id | uuid | FK → malls |
| user_id | uuid | nullable — future auth hook |
| display_name | text | |
| booth_number | text | nullable |
| bio | text | nullable |
| avatar_url | text | nullable |
| slug | text | URL-safe, unique |
| facebook_url | text | nullable — added via SQL |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Unique constraint:** `vendors_mall_booth_unique` on `(mall_id, booth_number)`

### `posts`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| vendor_id | uuid | FK → vendors |
| mall_id | uuid | FK → malls |
| title | text | |
| description | text | nullable |
| caption | text | AI-generated in Treehouse tone |
| image_url | text | nullable — public Supabase Storage URL |
| price_asking | numeric | nullable — stored but NOT shown in feed or detail page |
| status | text | `available` \| `sold` \| `pending` |
| location_label | text | nullable — e.g. "Booth 14" |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Joined shapes** (returned by data functions):
- `Post` includes `vendor?: Vendor` and `mall?: Mall`
- `Vendor` includes `mall?: Mall`

**Only mall in production:** America's Antique Mall, id: `19a8ff7e-cb45-491f-9451-878e2dde5bf4`
**Known vendor:** ZenForged Finds, booth 369, id: `65a879f1-c43c-481b-974f-379792a36db8`

---

## 5. Complete Route Map

### Ecosystem routes

| Route | Purpose |
|---|---|
| `/` | Discovery feed — tree masonry grid, mall dropdown filter, no status filters, no prices |
| `/find/[id]` | Find detail — full-bleed image, floating nav, availability status, shelf scroll, location card |
| `/mall/[slug]` | Mall profile — all finds from that location, available/sold split, directions CTA |
| `/vendor/[slug]` | Vendor profile — their finds, booth info, Facebook link |
| `/post` | Vendor capture — camera/gallery pick, profile setup (display name, booth, mall) |
| `/post/preview` | Edit title/caption/price → AI caption → publish → confirmation screen |

### Reseller intel routes (existing layer — untouched)

| Route | Purpose |
|---|---|
| `/scan` | Camera capture entry point for reseller flow |
| `/discover` | Claude Vision identification (POST `/api/identify` fires on mount) |
| `/refine` | Low-confidence correction — user edits item name |
| `/decide` | Comp data + profit analysis + verdict |
| `/intent` | Caption + intent chips (sharing flow) |
| `/enhance-text` | Before/after caption slider (mock refinement) |
| `/share` | Copy/download/Facebook stub + save to My Finds |
| `/finds` | Buyer's saved finds (localStorage — reseller tool side) |

### API routes

| Route | Purpose |
|---|---|
| `POST /api/identify` | Claude Vision identification for reseller flow |
| `GET /api/sold-comps` | SerpAPI or Apify comp fetch with 48h in-memory cache |
| `POST /api/post-caption` | Treehouse-tone title + caption for vendor post flow. Claude or mock fallback. |
| `GET /api/debug` | Returns env var status + live Supabase insert test |

---

## 6. Key Files

### Types

**`types/treehouse.ts`**
- `PostStatus` — `"available" | "sold" | "pending"`
- `Mall` — id, name, city, state, slug, address
- `Vendor` — id, mall_id, display_name, booth_number, bio, avatar_url, slug, facebook_url; optional joined `mall`
- `Post` — id, vendor_id, mall_id, title, description, caption, image_url, price_asking, status, location_label; optional joined `vendor` and `mall`
- `LocalVendorProfile` — localStorage profile (display_name, booth_number, mall_id, mall_name, mall_city, vendor_id?, slug?)
- `LOCAL_VENDOR_KEY = "th_vendor_profile"` — localStorage key

### Lib

**`lib/supabase.ts`**
Supabase browser client. Uses placeholder URL at build time to avoid prerender crash. Single export: `supabase`.

**`lib/posts.ts`**
Data access layer — all functions return typed results and never throw.

| Export | Description |
|---|---|
| `getFeedPosts(limit?)` | All posts newest-first, with joined vendor + mall. Used by `/`. |
| `getPost(id)` | Single post with full vendor + mall detail. Used by `/find/[id]`. |
| `getMallPosts(mallId, limit?)` | All posts from a mall. Used by `/mall/[slug]`. |
| `getVendorPosts(vendorId, limit?)` | All posts from a vendor. Used by `/vendor/[slug]` and shelf section on `/find/[id]`. |
| `createPost(input)` | Insert post row with `status: "available"`. Returns `{ data, error }`. |
| `updatePostStatus(id, status)` | Toggle available/sold. Returns boolean. |
| `deletePost(id)` | Hard delete. Returns boolean. |
| `getVendorBySlug(slug)` | Fetch vendor + joined mall for profile page. |
| `createVendor(input)` | Insert vendor row. Handles 23505 duplicate key by fetching existing row (Safari localStorage loss recovery). Returns `{ data, error }`. |
| `slugify(name)` | URL-safe slug. Strips non-alphanumeric, max 50 chars. |
| `getAllMalls()` | All malls alphabetically — used by post-flow mall selector and feed dropdown. |
| `getMallBySlug(slug)` | Single mall for profile page. |
| `uploadPostImage(base64DataUrl, vendorId)` | Uploads to `post-images` bucket. Returns public URL or null. Non-fatal — post proceeds without image. |

**`lib/postStore.ts`**
In-memory store for `/post → /post/preview` image handoff. Avoids sessionStorage size limits and Safari quirks. Cleared after publish.

**`lib/safeStorage.ts`**
localStorage wrapper with sessionStorage + memory fallback. Use this instead of raw `localStorage` in all ecosystem client components.

---

## 7. Vendor Post Flow

1. **`/post`** — capture photo → fill profile (name, booth, mall) → stored to localStorage + postStore
2. **`/post/preview`** — edit title/caption/price → AI caption via `POST /api/post-caption` → review
3. **Publish** — `uploadPostImage()` → `createPost()` → clears postStore → confirmation screen
4. **Confirmation** — "Back to feed" (primary), "Visit us on Facebook" (secondary, external link), "Post another find" (camera icon, ghost)

### API: `POST /api/post-caption`

Model: `claude-opus-4-5`, max_tokens: 200. Accepts `{ imageDataUrl }`. Returns `{ title, caption }`. Mock fallback if no `ANTHROPIC_API_KEY`.

**Caption tone rules:**
- 1–2 sentences maximum
- Warm and observational — never salesy or hype
- Notice: material, age, form, character, patina
- Do NOT start with "This" or the item name
- Do NOT use filler phrases ("a wonderful find", "a must-have")
- Do NOT mention price, resale value, condition assessments, eBay, or flipping
- Write like a thoughtful friend who just noticed something worth sharing

---

## 8. Discovery Feed (`/`)

- Fetches up to 80 posts via `getFeedPosts()` on mount
- Mall dropdown filter in header — filters client-side by mall_id; "All malls" default
- No status filter pills — all finds shown in a single unified feed
- **Tree masonry grid** — 2 columns, 14px gap, 14px border-radius tiles
  - Right column drops by exactly 50% of the first left tile's rendered height
  - Offset is live via `ResizeObserver` on the first tile ref — recalculates on image load, orientation change, resize
  - Skeleton uses 65px offset (Math.round(130 × 0.5)) to prevent layout jump
- **No price badges** on tiles — items feel like discoveries
- Sold items: 0.62 opacity + grayscale filter + "Found a home" badge (top-left)
- Tiles link to `/find/[id]`; no text overlay on images
- Empty state CTA routes to `/post`

---

## 9. Find Detail Page (`/find/[id]`)

### Layout order (top to bottom)
1. **Full-bleed hero image** — `width: 100%`, no container, no rounded corners, no shadow
   - Floating back button: top-left, `position: absolute`, frosted cream circle (blur + `rgba(240,237,230,0.82)`)
   - Share button: bottom-right of image, dark circle overlay
   - "Found a home" badge on image if sold (offset left to avoid back button)
2. **Title** — Georgia 26px bold, `-0.4px` letter-spacing
3. **Availability status** — pulsing green dot + "Available" (green) or "Found a home" (muted). No price. No timestamp.
4. **Caption** — italic Georgia 15px, lineHeight 1.82
5. **Description** — 13px muted (if present)
6. **Hairline divider**
7. **"View the shelf"** — horizontal scroll strip, full-bleed, vendor's other items
   - Section label (uppercase, faint) + item count (italic Georgia, right)
   - Cards: 42vw wide (max 170px), 3:4 aspect ratio, lazy loaded
   - Sold cards: grayscale + "Found a home" badge
   - Hides entirely if vendor has no other items
8. **"Find this here"** section label (uppercase, faint)
9. **Location + vendor card** (single surface card, `background: surface, borderRadius: 12`)
   - Mall name + address link (tighter padding, right-aligned)
   - [inset divider]
   - Vendor name (fontWeight 400, textMid — reduced weight)
   - **Booth pill** — own line, right-aligned, `background: surfaceDeep`, `borderRadius: 20`, monospace 13px
   - **Mark the Spot button** — inside card at bottom. Owner: toggles sold/available. Visitor: decorative disabled.
10. **"Keep exploring →"** — soft italic Georgia link, routes to `/`
11. **Delete post** — owner only, very bottom, ghost style (no bg, no border, tiny trash icon + 11px faint text). Expands to full confirmation on tap.

---

## 10. Design System

### Ecosystem palette
```
bg:           #f0ede6
surface:      #e8e4db
surfaceDeep:  #dedad0
border:       rgba(26,26,24,0.1)
textPrimary:  #1a1a18
textMid:      #4a4a42
textMuted:    #8a8478
textFaint:    #b0aa9e
green:        #1e4d2b
greenLight:   rgba(30,77,43,0.09)
greenBorder:  rgba(30,77,43,0.18)
header:       rgba(240,237,230,0.94–0.96)
red:          #8b2020
redBg:        rgba(139,32,32,0.07)
redBorder:    rgba(139,32,32,0.18)
```

### Reseller palette (dark — do not change)
```
bg: #050f05  text: #f5f0e8  gold: #c8b47e  green: #6dbc6d
```

### Typography
| Use | Font |
|---|---|
| Headings, titles, captions, italic labels | Georgia, serif |
| Prices, booth numbers, monospace data | monospace |
| Body, UI labels | system default |

### Animations (framer-motion)
```js
initial={{ opacity: 0, y: 8–16 }}
animate={{ opacity: 1, y: 0 }}
transition={{ ease: [0.25, 0.1, 0.25, 1] }}
```

### Mobile layout rules
- Max width: 430px per page
- Safe area: `env(safe-area-inset-bottom)` on all fixed bottom bars
- Sticky/floating headers: `backdropFilter: blur(20px)`, `WebkitBackdropFilter: blur(20px)`
- No `position: fixed` headers on detail page — use floating buttons over image instead

---

## 11. Reseller Layer — Data Model

### FindSession (sessionStorage key: `tts_active_session`)
```
id, createdAt, imageOriginal, imageEnhanced?, identification?, refinedQuery?,
intentText?, intentChips?, captionRefined?, pricePaid?, comps?, pricing?, decision?
```

### SavedFind (localStorage key: `tts_finds_v2`)
Subset of FindSession fields plus decision + pricing summary.

---

## 12. Reseller Layer — Comp Data Pipeline

1. `/discover` fires `POST /api/identify` → stores `session.identification.searchQuery`
2. (optional) `/refine` → stores `session.refinedQuery`
3. `/decide` → `GET /api/sold-comps?q={searchQuery}`
4. `normalizeQuery` → cache check (48h) → SerpAPI fetch → cache set → return
5. If `comps.length === 0` → fall back to `generateMockEvaluation()`

**SerpAPI lot filter regex:**
```
/(lot|set|pair|collection|bundle|group)s+(ofs+)?d+|d+s*(x|pc|pcs|piece|pieces)|.../i
```

---

## 13. Reseller Layer — Pricing Logic

```
medianSoldPrice  = trimmed median (remove < 0.3x or > 2.5x raw median)
estimatedFees    = medianSoldPrice × 0.13
estimatedProfitHigh = medianSoldPrice - cost - fees

strong-buy  profitHigh >= $20 AND (profit/cost) >= 1.5
maybe       profitHigh >= $8  AND (profit/cost) >= 0.6
pass        everything else
```

---

## 14. Reseller Layer — Identification API

`POST /api/identify` — model `claude-opus-4-5`, max_tokens: 400. Returns `{ title, description, confidence, searchQuery }`.

Mock fallback: 8 deterministic items seeded by `imageDataUrl.length % 8`.

---

## 15. User Flows

### Flow A — Vendor Posts a Find
1. `/post` — capture photo → fill profile → stored to localStorage + postStore
2. `/post/preview` — edit title/caption/price → AI caption → review → publish
3. Publish: image → Supabase Storage → post row → clears postStore → confirmation screen
4. Confirmation: "Back to feed" / "Visit us on Facebook" / "Post another find"
5. Find is live in discovery feed immediately

### Flow B — Buyer Browses
1. `/` — scroll feed (tree masonry, no prices, no filters)
2. Tap a tile → `/find/[id]` — full-bleed image, title, availability, caption, shelf scroll, location card
3. Tap address → Apple Maps deep link
4. Scroll shelf → tap item → navigate to that find's detail page

### Flow C — Reseller Intel
1. `/scan` → camera capture
2. `/discover` — AI identification fires on mount
3. [low confidence] `/refine` — user edits item name
4. `/decide` — enter price paid → comp analysis runs → profit/verdict
5. Save as purchased or passed → `/finds`

### Flow D — Social Sharing (reseller)
1. `/discover` → "Share the story" → `/intent`
2. `/intent` → select chips + optional text
3. `/enhance-text` → before/after caption slider (mock)
4. `/share` → copy/download/Facebook stub → save to My Finds

---

## 16. Current Development State (2026-04-07)

### Working — Ecosystem layer
- Discovery feed: tree masonry (50% dynamic right-column offset), no prices, no filter pills, mall dropdown
- Skeleton loading matches live grid proportions
- Find detail: full-bleed image, floating nav, availability pulse, "View the shelf", "Find this here" card, booth pill, Mark the Spot inside card, delete at bottom
- "View the shelf" — lazy-loaded horizontal scroll, vendor's other posts, hides if empty
- Mark the Spot — owner toggle (sold/available), visitor decorative
- Post flow — capture → AI caption (1-2 sentences) → preview → publish → confirmation
- Post confirmation — "Back to feed" primary, "Visit us on Facebook" (external), "Post another find" + camera icon
- Vendor profile: Facebook link, available/sold grid
- Mall profile: grid, directions, available/sold split
- Image upload to Supabase Storage
- safeStorage fallback for Safari private/ITP

### Working — Reseller layer
- Full Claude Vision identification with mock fallback
- Real eBay comp data via SerpAPI with 48h cache
- Lot filtering, confidence gate, full sharing flow
- Finds persistence (`tts_finds_v2`)
- All mobile animations and layout

### Known Gaps / Next Sprint Options
- "Mark the Spot" for visitors — unwired (future saved/shelf feature)
- Pull-to-refresh on discovery feed
- `/enhance-text` caption refinement is mock — not real Claude call yet
- Supabase RLS — row-level security so vendors can only edit their own posts
- No PWA / offline support
- `FACEBOOK_PAGE_URL` constant in `app/post/preview/page.tsx` needs verification

---

## 17. Roadmap

| Item | Status |
|---|---|
| Discovery feed + vendor post flow | ✅ Done |
| Real eBay comps (SerpAPI) | ✅ Done |
| Mall + vendor profile pages | ✅ Done |
| Tree masonry feed | ✅ Done |
| Story-driven detail page (availability, shelf, location card) | ✅ Done |
| Mark the Spot for vendors | ✅ Done |
| Mark the Spot for visitors (saved shelf) | Planned |
| Pull-to-refresh on feed | Planned |
| Native share sheet on find detail | Planned |
| Supabase RLS | Planned |
| Real `/enhance-text` caption (Claude) | Planned |
| PWA / offline mode | Planned |
| Facebook auto-post via Graph API | Future |
| Vendor auth (Supabase Auth) | Future |
| Poshmark / Mercari comps | Future |
| Reverse image search | Future |
| Kanban sourcing board | Future |
| Analytics dashboard | Future |

---

## 18. How to Use This Document

Paste as the opening message to give Claude full codebase context. It covers:
- Both product layers (ecosystem + reseller intel)
- Complete Supabase schema
- Every route and its purpose
- All API endpoints and their logic
- Data access functions in `lib/posts.ts`
- The vendor post flow end-to-end
- Discovery feed grid system
- Find detail page layout order (authoritative)
- Design tokens, typography, animation conventions
- Mobile layout rules
- All four user flows
- Current state and known gaps

**Production debugging:**
```bash
curl https://treehouse-treasure-search.vercel.app/api/debug
npx vercel logs --prod | grep -i "[error-keyword]"
npm run build 2>&1 | tail -30
git add -A && git commit -m "..." && git push
```
