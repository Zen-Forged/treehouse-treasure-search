# Treehouse — Master Context Document
> Last updated: 2026-04-06 | Repo: Zen-Forged/treehouse-treasure-search | Live: treehouse-treasure-search.vercel.app

---

## 1. Product Overview

Treehouse is a **local discovery ecosystem for vintage, antique, and thrift finds.**

- **Buyers** browse a real-time feed before making the trip.
- **Vendors** post finds for visibility without needing a full e-commerce stack.
- **Mall operators** get organic foot traffic through their vendors' content.
- **Resellers** (future premium) get comp and profit analysis via the `/scan → /decide` flow.

The front door is the **Discovery Feed** (`/`). The reseller intel tool (`/scan`) is a secondary feature, not the entry point. No auth required — vendor identity is persisted to localStorage.

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
NEXT_PUBLIC_SUPABASE_ANON_KEY  Publishable/anon key from Supabase dashboard (public)
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
| created_at | timestamptz | |
| updated_at | timestamptz | |

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
| price_asking | numeric | nullable |
| status | text | `available` \| `sold` \| `pending` |
| location_label | text | nullable — e.g. "Booth 14" |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Joined shapes** (returned by data functions):
- `Post` includes `vendor?: Vendor` and `mall?: Mall`
- `Vendor` includes `mall?: Mall`

---

## 5. Complete Route Map

### Ecosystem routes (new layer)

| Route | Purpose |
|---|---|
| `/` | Discovery feed — front door. Buyers browse all posted finds. Filter bar: All / Available / Just In. Vendor + mall names are tappable links. |
| `/find/[id]` | Find detail — hero image, caption, vendor info, mall address, directions CTA (Google Maps deep link). |
| `/mall/[slug]` | Mall profile — all finds from that location, available/sold split, directions CTA. |
| `/vendor/[slug]` | Vendor profile — their finds, booth info, link to their mall. |
| `/post` | Vendor capture — camera/gallery pick, profile setup (display name, booth, mall). Profile persists to localStorage. |
| `/post/preview` | Edit title / caption / price → AI caption generation → publish to Supabase → live in feed. |
| `/finds` | Buyer's saved finds (localStorage — reseller tool side). |

### Reseller intel routes (existing layer — untouched)

| Route | Purpose |
|---|---|
| `/scan` | Camera capture entry point for reseller flow. |
| `/discover` | Claude Vision identification (POST `/api/identify` fires on mount). |
| `/refine` | Low-confidence correction — user edits item name. |
| `/decide` | Comp data + profit analysis + verdict. |
| `/intent` | Caption + intent chips (sharing flow). |
| `/enhance-text` | Before/after caption slider (mock refinement). |
| `/share` | Copy/download/Facebook stub + save to My Finds. |

### API routes

| Route | Purpose |
|---|---|
| `POST /api/identify` | Claude Vision identification for reseller flow. |
| `GET /api/sold-comps` | SerpAPI or Apify comp fetch with 48h in-memory cache. |
| `POST /api/post-caption` | Treehouse-tone caption for vendor post flow. Claude or mock fallback. |
| `GET /api/debug` | Returns env var status — `curl [url]/api/debug` for prod debugging. |

---

## 6. Key Files

### Types

**`types/treehouse.ts`**
Shared types for the ecosystem layer.
- `PostStatus` — `"available" | "sold" | "pending"`
- `Mall` — id, name, city, state, slug, address
- `Vendor` — id, mall_id, display_name, booth_number, bio, avatar_url, slug; optional joined `mall`
- `Post` — id, vendor_id, mall_id, title, description, caption, image_url, price_asking, status, location_label; optional joined `vendor` and `mall`
- `LocalVendorProfile` — lightweight localStorage profile (display_name, booth_number, mall_id, mall_name, mall_city, vendor_id?, slug?)
- `LOCAL_VENDOR_KEY = "th_vendor_profile"` — localStorage key for vendor profile
- `POST_IMAGE_KEY = "th_post_image"` — localStorage key (legacy; postStore now preferred)

### Lib

**`lib/supabase.ts`**
Supabase browser client. Reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Single export: `supabase`.

**`lib/posts.ts`**
Data access layer — all functions return typed results and never throw (return `null` / `[]` on error for graceful UI degradation).

| Export | Description |
|---|---|
| `getFeedPosts(limit?)` | All posts newest-first, with joined vendor + mall. Used by `/`. |
| `getPost(id)` | Single post with full vendor + mall detail. Used by `/find/[id]`. |
| `getMallPosts(mallId, limit?)` | All posts from a mall. Used by `/mall/[slug]`. |
| `getVendorPosts(vendorId, limit?)` | All posts from a vendor. Used by `/vendor/[slug]`. |
| `createPost(input)` | Insert a new post row with `status: "available"`. |
| `getVendorBySlug(slug)` | Fetch vendor + joined mall for profile page. |
| `createVendor(input)` | Insert vendor row — called on first post from an unregistered vendor. |
| `slugify(name)` | URL-safe slug from display name. Strips non-alphanumeric, max 50 chars. |
| `getAllMalls()` | All malls alphabetically — used by post-flow mall selector. |
| `getMallBySlug(slug)` | Single mall for profile page. |
| `uploadPostImage(base64DataUrl, vendorId)` | Uploads base64 image to `post-images` Supabase Storage bucket. Returns public URL or null. Filename pattern: `{vendorId}/{timestamp}.{ext}`. |

**`lib/postStore.ts`**
In-memory store for the vendor post flow (`/post` → `/post/preview`). Avoids sessionStorage size limits and Safari quirks. Cleared after publish.
- `postStore.set(imageDataUrl)` — store draft
- `postStore.get()` — retrieve draft
- `postStore.clear()` — clear after publish

**`lib/serpApiClient.ts`**
SerpAPI eBay engine integration. Filters lot listings via regex. Builds comp summary: `recommendedPrice`, `priceRangeLow`, `priceRangeHigh`, `marketVelocity`, `demandLevel`, `quickTake`, `confidence`, `avgDaysToSell`.

**`lib/cache.ts`**
In-memory Map cache with 48h TTL for comp data. Keys are normalized query strings. `cacheGet`, `cacheSet`, `cacheDelete`, `cacheSize`, `cachePurgeExpired`.

**`lib/pricingLogic.ts`**
`calculatePricing(comps, enteredCost)` — trims outliers, calculates fees/profit/recommendation.

**`lib/mockIntelligence.ts`**
`generateMockEvaluation(cost, imageDataUrl)` — seeded mock comp data for dev/no-API fallback. Also exports `formatCurrency`, `getRecommendationLabel`, `getRecommendationCopy`.

### Hooks (reseller layer)

**`hooks/useSession.tsx`**
`FindSessionContext` + `FindSessionProvider` + `useFindSession()`. Single source of truth for the active reseller scan. Persists to sessionStorage. `clearSession()` removes it.

**`hooks/useFinds.ts`**
`useFinds()` — loads/saves/deletes saved finds from localStorage (`tts_finds_v2`). `sessionToFind(session, decision)` converts active session to `SavedFind`.

**`hooks/useAnalysisFlow.ts`**
State machine for the animated analysis feed on `/decide`. Steps: `uploading → searching_comps → analyzing_market → finalizing`. Calls `GET /api/sold-comps`. Falls back to mock if no comps returned.

### Components

**`components/AnalysisFeed.tsx`** — Animated analysis step timeline on `/decide`.
**`components/RecommendationMeter.tsx`** — Visual strong-buy/maybe/pass meter.
**`components/PricingBreakdown.tsx`** — Collapsible fee breakdown.
**`components/CompCard.tsx`** — Individual sold comp listing card.
**`components/SavedItemCard.tsx`** — Card for `/finds` grid.
**`components/AppHeader.tsx`** — Shared sticky header with logo.
**`components/PriceInput.tsx`** — Number input + range slider combo.
**`components/Buttons.tsx`** — Shared button primitives.

---

## 7. Vendor Post Flow

The post flow creates both a vendor row and a post row in Supabase with no auth.

### Step-by-step

1. **`/post`** — vendor captures photo (camera or gallery). Profile form: display name, booth number, mall selector (pulls from `getAllMalls()`). Profile written to localStorage (`th_vendor_profile`). Image written to `postStore`.

2. **`/post/preview`** — vendor edits title, caption, price. On load:
   - Reads profile from localStorage; reads image from `postStore`.
   - If no `vendor_id` in profile: calls `createVendor()` → writes `vendor_id` + `slug` back to localStorage.
   - Caption generation: `POST /api/post-caption` with image + title.

3. **Publish** — `uploadPostImage()` → `createPost()` → clears `postStore` → navigates to `/`.

### API: `POST /api/post-caption`

Model: `claude-opus-4-5`, max_tokens: 160. Accepts `{ imageDataUrl, title, description }`. Returns `{ caption }`. Mock fallback (5 rotating captions) if no `ANTHROPIC_API_KEY`.

**Caption tone rules:**
- 2–3 sentences. Warm and observational — never salesy or hype.
- Notice what is genuinely interesting: material, age, form, character, patina.
- Help the reader imagine the object in a real space.
- Never mention price, resale value, eBay, or flipping.
- Write like a thoughtful friend who just noticed something worth sharing.

---

## 8. Discovery Feed (`/`)

- Fetches up to 80 posts via `getFeedPosts()` on mount.
- Skeleton loading (3 cards, shimmer animation) while fetching.
- Filter bar: **All finds** / **Available** / **Just in** (< 7 days).
- Each `PostCard` links to `/find/[id]`.
- Sold items render at 72% opacity with "Found a home" badge and desaturated image.
- `VendorMallTag` — vendor name links to `/vendor/[slug]`, mall name links to `/mall/[slug]`. Wrapped in `onClick preventDefault` so tapping the tag doesn't also navigate to find detail.
- Price badge (monospace gold) overlaid on image, top-right. Hidden when sold.
- Empty state CTA routes to `/post`.
- "Post a find" button in header routes to `/post`.

---

## 9. Design System

### Colors

| Token | Value |
|---|---|
| Background | `#050f05` |
| Surface | `rgba(13,31,13,0.5–0.6)` |
| Border green | `rgba(109,188,109,0.08–0.16)` |
| Text primary | `#f5f0e8` warm white |
| Text mid | `#d4c9b0` warm gray |
| Text dim | `#7a6535`, `#6a5528` bark tones |
| Text muted | `rgba(46,36,16,0.55)` |
| Accent gold | `#c8b47e`, `#a8904e` antique gold |
| Accent green | `#6dbc6d` success / strong-buy |
| CTA button | `linear-gradient(175deg, rgba(46,110,46,0.96), rgba(33,82,33,1))` |

### Typography

| Use | Font |
|---|---|
| Headings, titles, quotes, logo | Georgia, serif |
| All prices and numbers | monospace |
| Body | Tailwind system default |

### Animations (framer-motion)

```js
// Standard entry
initial={{ opacity: 0, y: 8–16 }}
animate={{ opacity: 1, y: 0 }}
transition={{ ease: [0.25, 0.1, 0.25, 1] }}

// Tap feedback
whileTap={{ scale: 0.97 }}
```

### Mobile Layout Rules

- Max width: `430px` (feed), `max-w-md` (layout wrapper)
- Safe area: `env(safe-area-inset-bottom)` on all fixed bottom bars
- Sticky header: `backdrop-filter: blur(20px)`, `bg rgba(5,15,5,0.92)`, `border rgba(200,180,126,0.06)`
- Page pattern: `flex flex-col min-h-screen bg-[#050f05]`
- Fixed CTAs: `position fixed`, `bottom-0`, `left-0`, `right-0`, `max-w-md mx-auto`

---

## 10. Reseller Layer — Data Model

### FindSession (sessionStorage key: `tts_active_session`)

```
id: string                     "find_{timestamp}_{random}"
createdAt: string
imageOriginal: string          base64 data URL
imageEnhanced?: string
identification?: {
  title, description, confidence: "high"|"medium"|"low", searchQuery
}
refinedQuery?: string          user-confirmed from /refine
intentText?: string
intentChips?: string[]         "curious"|"selling"|"sharing"|"offers"
captionRefined?: string
pricePaid?: number
comps?: MockComp[]
pricing?: {
  medianSoldPrice, estimatedFees, estimatedProfitHigh,
  recommendation: "strong-buy"|"maybe"|"pass"
}
decision?: "purchased"|"passed"|"shared"
```

### SavedFind (localStorage key: `tts_finds_v2`)

Subset of FindSession fields plus decision + pricing summary.

### MockComp

```
title, platform, price, condition, daysAgo, url?, imageUrl?
```

---

## 11. Reseller Layer — Comp Data Pipeline

1. `/discover` fires `POST /api/identify` on mount → stores `session.identification.searchQuery`
2. (optional) `/refine` lets user confirm/edit → stores `session.refinedQuery`
3. `/decide` price entry → user hits "Look it up" → `useAnalysisFlow.run({ searchQuery: refinedQuery ?? identification.searchQuery })`
4. `useAnalysisFlow` → `GET /api/sold-comps?q={searchQuery}`
5. sold-comps route: `normalizeQuery` → cache check (48h) → SerpAPI/Apify fetch → cache set → return
6. If `comps.length === 0` → fall back to `generateMockEvaluation()`

**SerpAPI lot filter regex:**
```
/(lot|set|pair|collection|bundle|group)s+(ofs+)?d+|d+s*(x|pc|pcs|piece|pieces)|d{1,2}s*-?s*(goblets?|glasses?|...)/i
```

---

## 12. Reseller Layer — Pricing Logic

```
medianSoldPrice  = trimmed median (remove prices < 0.3x or > 2.5x raw median)
estimatedFees    = medianSoldPrice × 0.13   (eBay ~13%)
estimatedShipping = 0                        (buyer pays)
estimatedProfitHigh = medianSoldPrice - cost - fees
estimatedProfitLow  = compLow - cost - fees

Recommendation:
  strong-buy  profitHigh >= $20 AND (profit/cost) >= 1.5
  maybe       profitHigh >= $8  AND (profit/cost) >= 0.6
  pass        everything else
```

---

## 13. Reseller Layer — Identification API

`POST /api/identify` — model `claude-opus-4-5`, max_tokens: 400. Returns raw JSON (no markdown): `{ title, description, confidence, searchQuery }`.

Mock fallback: 8 deterministic items seeded by `imageDataUrl.length % 8`.

**searchQuery prompt rules:**
- Be specific: brand, model, material, type, form
- Include "single" if clearly one item
- Include full brand+model if present (e.g. `"canon eos r50 camera"`)
- Never use generic terms like "item" or "object"
- Examples: `"carnival glass iridescent goblet single"`, `"benjamin franklin brass bookend bank"`, `"mid century ceramic vase single"`

Query runs through `normalizeQuery()` (strips filler, max 8 words) before comp lookup.

---

## 14. User Flows

### Flow A — Vendor Posts a Find

1. `/post` — capture photo → fill profile (name, booth, mall) → stored to localStorage + postStore
2. `/post/preview` — edit title/caption/price → AI caption generated → review → publish
3. Publish: image → Supabase Storage → post row → clears postStore → redirects to `/`
4. Find is live in the discovery feed immediately

### Flow B — Buyer Browses

1. `/` — scroll feed, filter (All / Available / Just In)
2. Tap a card → `/find/[id]` — hero image, full caption, vendor info, mall, directions CTA
3. Tap vendor name → `/vendor/[slug]`
4. Tap mall name → `/mall/[slug]`

### Flow C — Reseller Intel

1. `/scan` → camera capture
2. `/discover` — AI identification fires on mount
3. [low confidence] `/refine` — user edits item name
4. `/decide` — enter price paid → comp analysis runs → profit/verdict
5. Save as purchased or passed → `/finds`

### Flow D — Social Sharing (reseller)

1. `/discover` → tap "Share the story" → `/intent`
2. `/intent` → select chips + optional text
3. `/enhance-text` → before/after image slider + mock-refined caption
4. `/share` → copy/download/Facebook stub → save to My Finds

---

## 15. Current Development State (2026-04-06)

### Working — Ecosystem layer
- Discovery feed loads from Supabase with skeleton loading + filter bar
- Feed cards link to `/find/[id]`, `/vendor/[slug]`, `/mall/[slug]`
- Find detail page — hero image, caption, vendor info, directions CTA
- Mall profile page — grid, available/sold split, directions
- Vendor profile page — their finds, booth info, mall link
- Vendor post flow — capture → preview → AI caption → publish → live in feed
- Vendor profile persists to localStorage (no auth required)
- Image upload to Supabase Storage (bucket: `post-images`)
- `POST /api/post-caption` — Claude or mock fallback

### Working — Reseller layer
- Full Claude Vision identification with mock fallback
- Real eBay comp data via SerpAPI
- In-memory comp caching (48h TTL)
- Lot filtering from SerpAPI results
- Confidence gate: `/refine` for low-confidence IDs
- Full sharing flow: intent → enhance-text → share
- Finds persistence (`tts_finds_v2`)
- All mobile animations and layout

### Known Gaps / Next Sprint Options
- **Poll-to-refresh** on discovery feed
- **Mark as sold** button on `/find/[id]` for vendors (matches their localStorage profile)
- **Native share sheet** on find detail + copyable vendor profile URL
- **Supabase RLS** — row-level security so vendors can only edit their own posts
- `/enhance-text` caption refinement is mock — not real Claude call yet
- Facebook share on `/share` is a UI stub
- No PWA/offline support
- `lib/ebayClient.ts`, `lib/searchCache.ts` — legacy files, not in active flow
- `/app/enhance/`, `/app/flow-test/` — likely unused/experimental

---

## 16. Roadmap

| Item | Status |
|---|---|
| Discovery feed + vendor post flow | ✅ Done |
| Real eBay comps (SerpAPI) | ✅ Done |
| Mall + vendor profile pages | ✅ Done |
| Pull-to-refresh on feed | Planned |
| Mark as sold (vendor action) | Planned |
| Native share sheet | Planned |
| Supabase RLS | Planned |
| Real `/enhance-text` caption (Claude) | Planned |
| Poshmark / Mercari comps | Planned |
| Reverse image search | Planned |
| Label / brand detection via ML | Planned |
| Vendor auth (Supabase Auth) | Future |
| Kanban sourcing board | Future |
| Listing generator | Future |
| Analytics dashboard | Future |
| PWA / offline mode | Future |

---

## 17. How to Use This Document

Paste as the opening message to give an AI full codebase context. It covers:
- Both product layers (ecosystem + reseller intel)
- Complete Supabase schema
- Every route and its purpose
- All API endpoints and their logic
- Data access functions in `lib/posts.ts`
- The vendor post flow end-to-end
- Comp data pipeline
- Pricing formulas and recommendation thresholds
- Design tokens, typography, animation conventions
- Mobile layout rules
- All four user flows
- Current state and known gaps

For file-level questions, paste the raw source alongside this document.
For new feature work, reference section 15 (gaps) and section 16 (roadmap).

**Production debugging patterns:**
```bash
curl https://treehouse-treasure-search.vercel.app/api/debug
npx vercel logs --prod | grep -i "[error-keyword]"
```
