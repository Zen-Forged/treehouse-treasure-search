# Treehouse — Master Context Document
> Last updated: 2026-04-19 (session 26 — full refresh to v1.1l)
> Repo: Zen-Forged/treehouse-treasure-search
> Live: `app.kentuckytreehouse.com` (custom domain) + `treehouse-treasure-search.vercel.app` (Vercel default)

This document is the architecture reference. It is intentionally separate from `CLAUDE.md` (live session whiteboard) and `docs/DECISION_GATE.md` (operating constitution). New sessions read all three at the opener, in that order.

---

## 1. Product Overview

Treehouse is a **calm, story-driven local discovery experience** for vintage, antique, and thrift finds in Kentucky and Southern Indiana.

- **Shoppers** browse a real-time feed before making the trip to a mall or booth.
- **Vendors** post finds for visibility without running a full e-commerce stack.
- **Mall operators** get organic foot traffic through their vendors' content.
- **Resellers** (secondary, not the front door) get comp + profit analysis via `/scan → /decide`.

The front door is the **Discovery Feed** (`/`). Shoppers browse without an account. Vendors sign in via magic-link OTP. Admin signs in via PIN.

**Tagline (committed session 15, first surfacing in-product session 24 — Find Map closer):**
**Embrace the Search. Treasure the Find. Share the Story.**

### What Treehouse is NOT

- Not a marketplace (no on-platform buying/selling)
- Not a filter-heavy listings site
- Not a social network
- Not a fast-fashion / urgency-driven shopping experience

### Two independent layers

| Layer | Front door | Theme | Data | Auth |
|---|---|---|---|---|
| **Ecosystem** (vendors, malls, posts) | `/` Discovery Feed | Warm parchment (`#e8ddc7`) | Supabase Postgres + Storage | Supabase Auth (magic-link OTP + admin PIN) |
| **Reseller intel** (identify, comps, decide) | `/scan` | Dark forest (`#050f05`) | sessionStorage + localStorage | None |

**Operator note:** David Butler (Zen Forged LLC) is an **online reseller**, not a physical mall booth operator. ZenForged Finds (Booth 369 at America's Antique Mall) exists in the data model as a test vendor / operator persona. In-person vendor onboarding is a deliberate scheduled activity, not incidental. This matters for scoping.

---

## 2. Tech Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + inline styles |
| Animations | framer-motion |
| Icons | lucide-react |
| AI | `@anthropic-ai/sdk` — `claude-opus-4-5` |
| Database | Supabase (Postgres) |
| Storage | Supabase Storage — buckets: `post-images`, `site-assets` |
| Auth | Supabase Auth (magic-link OTP, 6-digit code primary path) |
| Email | Resend — dual use: (1) SMTP provider for Supabase Auth OTP emails, (2) REST API for our own transactional emails via `lib/email.ts` |
| Comp data | SerpAPI (eBay) |
| Deployment | Vercel |

### Fonts (sessions 16+, v1.1l)

- **IM Fell English** (Google Fonts) — editorial voice: titles, subheads, captions, eyebrow labels, vendor names
- **system-ui** — precise voice: form inputs, timers, addresses, OTP codes, pill numerals
- **Caveat** (Google Fonts) — reserved for rare handwritten beats; not currently active on any shipping surface
- **Times New Roman** (narrow v1.1l exception) — 36px booth post-it numeral ONLY (`FONT_POSTIT_NUMERAL` token). Inline pills on vendor rows stay on system-ui.
- Georgia is retired from the ecosystem layer (session 15). It still appears in email HTML templates and is acceptable there.

---

## 3. Environment Variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL         https://zogxkarpwlaqmamfzceb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY    eyJhbGci...  (full JWT — not publishable-key format)
SUPABASE_SERVICE_ROLE_KEY        Server-only. Required for /api/admin/*, /api/setup/*,
                                 /api/vendor-request, /api/admin/featured-image.

# Identity / admin
NEXT_PUBLIC_ADMIN_EMAIL          david@zenforged.com
ADMIN_PIN                        Server-only. Used by /api/auth/admin-pin.

# Site
NEXT_PUBLIC_SITE_URL             https://app.kentuckytreehouse.com
                                 Used by lib/email.ts to build absolute sign-in URLs.

# AI + comps
ANTHROPIC_API_KEY                Claude Vision (reseller) + post-caption generation
SERPAPI_KEY                      eBay sold comps via SerpAPI
COMP_SOURCE                      "serpapi" (default) or "apify"
APIFY_TOKEN                      Required if COMP_SOURCE=apify
EBAY_CLIENT_ID                   eBay direct API (scaffolded, not yet wired)
EBAY_CLIENT_SECRET               eBay direct API (scaffolded, not yet wired)

# Email
RESEND_API_KEY                   Server-only. Used by lib/email.ts for transactional
                                 emails (receipt + approval). Resend SMTP credentials
                                 for Supabase Auth OTP emails are configured separately
                                 in Supabase Dashboard → Auth → SMTP Settings.

# Dev
NEXT_PUBLIC_DEV_VENDOR_EMAIL     vendor@test.com (optional, dev convenience)
```

---

## 4. Supabase Schema

### `malls`

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| name | text | |
| city | text | |
| state | text | |
| slug | text | URL-safe, unique |
| address | text | nullable |
| phone | text | nullable |
| website | text | nullable |
| google_maps_url | text | nullable |
| latitude | numeric | nullable |
| longitude | numeric | nullable |
| category | text | nullable — `peddlers_mall` \| `antique_mall` \| `flea_market` \| `antique_store` \| `antique_market` |
| zip_code | text | nullable |
| hero_title | text | nullable — Mall Identity Layer |
| hero_subtitle | text | nullable |
| hero_style | text | nullable |
| hero_image_url | text | nullable |

**Seeded:** 29 malls across KY + Clarksville IN.
**Primary mall in production:** America's Antique Mall · id `19a8ff7e-cb45-491f-9451-878e2dde5bf4` · slug `americas-antique-mall`.

### `vendors`

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK (`vendors_pkey`) |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| mall_id | uuid | FK → malls |
| user_id | uuid | nullable — FK → auth.users. Set at `/setup` link step, or left NULL for pre-seeded Flow-1 booths. UNIQUE (`vendors_user_id_key`) — one vendor row per auth user. |
| display_name | text | Public-facing booth name (e.g. "John's Jewelry" or vendor's own name). |
| booth_number | text | nullable |
| bio | text | nullable |
| avatar_url | text | nullable |
| hero_image_url | text | nullable — banner photo on My Shelf / Public Shelf |
| slug | text | URL-safe. UNIQUE (`vendors_slug_key`) globally. Collisions auto-resolve via suffix loop (`-2`, `-3`, …) at admin approval time — see `docs/admin-runbook.md` and session-13 KI-004 fix. |
| facebook_url | text | nullable |

**Four unique constraints (all four matter — see session-13 KI-004 resolution):**

1. `vendors_pkey` PRIMARY KEY (id)
2. `vendors_slug_key` UNIQUE (slug) — globally unique; auto-suffix on collision
3. `vendors_mall_booth_unique` UNIQUE (mall_id, booth_number) — pre-flight checked on approve
4. `vendors_user_id_key` UNIQUE (user_id) — one vendor row per auth user

### `posts`

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| vendor_id | uuid | FK → vendors |
| mall_id | uuid | FK → malls |
| title | text | |
| description | text | nullable |
| caption | text | nullable — AI-generated in Treehouse tone |
| image_url | text | nullable — public Supabase Storage URL (bucket `post-images`) |
| price_asking | numeric | nullable — stored but NEVER shown in feed. Surfaced on Find Detail and Find Map tiles. |
| status | text | `available` \| `sold` \| `pending` |
| location_label | text | nullable — e.g. "Booth 14" |

### `vendor_requests`

Drives the two remote/in-person onboarding flows. Service-role-only (RLS `USING (false) WITH CHECK (false)`) — must be accessed via `/api/*` routes using `requireAdmin()` or `requireAuth()`.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| created_at | timestamptz | |
| name | text | Person's real name — used for email salutations. |
| email | text | Becomes the vendor's auth identity. Exact-match join to `auth.users.email` at `/setup`. |
| booth_number | text | nullable |
| mall_id | uuid | FK → malls |
| mall_name | text | Denormalized for email copy. |
| status | text | `pending` \| `approved` \| `rejected` |

### `site_settings` (v1.1l — session 24)

Keyed-row table with jsonb values. Holds admin-editable hero banner image URLs.

| Column | Type | Notes |
|---|---|---|
| key | text | PK. v1.1l keys: `featured_find_image_url`, `find_map_banner_image_url`. |
| value | jsonb | Shape: `{ "url": string \| null }`. Seed rows insert `{ "url": null }`. |
| updated_at | timestamptz | |
| updated_by | uuid | nullable — FK → auth.users (admin who last set it). |

**Intentionally no RLS** — anon read is safe (values are public image URLs); writes go through `/api/admin/featured-image` which uses the service-role client after `requireAdmin()`. See `lib/siteSettings.ts` for the read helpers and the graceful-collapse contract.

### Row-Level Security (RLS)

- **Enabled on:** `malls`, `vendors`, `posts` — 12 policies live. Service-role writes bypass RLS by design for admin paths.
- **Enabled on:** `vendor_requests` — locked to service-role (`USING (false) WITH CHECK (false)`).
- **Intentionally disabled on:** `site_settings` (public-read, service-role-write).

### Storage buckets

- **`post-images`** — PUBLIC. Vendor post images + vendor hero banners (path prefix `vendor-hero/`).
- **`site-assets`** — PUBLIC (v1.1l, session 24). Admin-uploaded hero banners for Home + Find Map.

### Migrations on disk (`supabase/migrations/`)

- `002_enable_rls.sql` — enables RLS + seeds the 12 policies
- `002_enable_rls_verify.sql` — verification queries
- `003_cleanup_old_rls_policies.sql` — removes stale pre-v2 policies
- `004_site_settings.sql` — v1.1l `site_settings` table + `site-assets` bucket + seed rows. 🖐️ HITL — applied session 25 via Supabase SQL editor.

---

## 5. Complete Route Map

### Ecosystem — public / shopper

| Route | Purpose |
|---|---|
| `/` | Discovery feed — paper masonry grid (v1.1i), mall selector via `<MallSheet>`, `<FeaturedBanner>` eyebrow variant above the grid, sticky masthead via `<StickyMasthead>`. |
| `/find/[id]` | Find detail — full-bleed photograph, floating frosted back/share bubbles, availability, caption, "View the shelf" scroll, location card with post-it, 3B sold landing state (v1.1i) when `status === "sold"`. |
| `/flagged` | **Find Map** — saved finds organized as a journal itinerary. Pin = mall, X = booth (glyph hierarchy locked session 17). Overlay-variant `<FeaturedBanner>` at top. Spine connects to terminal closer circle (v1.1l). Tagline fragment as closer copy. |
| `/mall/[slug]` | Mall profile — grid of all finds from that mall, directions CTA. |
| `/vendor/[slug]` | Public vendor shelf — `<BoothPage>` primitive shared with `/my-shelf`. |
| `/shelf/[slug]` | Same as `/vendor/[slug]` — alternate URL scheme, same primitive. |
| `/shelves` | Public booth directory. Admin `AddBoothSheet` inside this page is orphaned pending T4b (Sprint 4 tail). |

### Ecosystem — authenticated

| Route | Purpose |
|---|---|
| `/login` | Curator sign-in. Email → OTP 6-digit code → `safeRedirect(next)`. Accepts both `?redirect=` (approval email CTA) and `?next=` (magic-link round trip) — unified in session-9 KI-003 fix. Admin PIN tab retired v1.1k. |
| `/setup` | Post-approval link step. Calls `POST /api/setup/lookup-vendor` (retries once on 401 with 800ms backoff — session 10 fix). On success: writes `LOCAL_VENDOR_KEY`, auto-redirects to `/my-shelf` after 3s. |
| `/my-shelf` | Signed-in vendor's own shelf. Uses `<BoothPage>` primitive. Self-heals via `/api/setup/lookup-vendor` if `user_id` is authenticated but no linked vendor row exists (session-9 KI-003 fix). |
| `/post` | Vendor capture — photo + profile lookup. Identity resolves via `getVendorByUserId(user.id)` first; falls back to localStorage ONLY for unauth users (session-9 guard against "posting as Zen · booth 300"). |
| `/post/preview` | Edit title / caption / price → AI caption → publish. |
| `/vendor-request` | Public vendor-initiated onboarding form. Mode C chrome (v1.1k). |

### Ecosystem — admin

| Route | Purpose |
|---|---|
| `/admin/login` | Dedicated PIN entry (v1.1k, session 23; file orphan resolved session 25). POST `/api/auth/admin-pin` → OTP verify → `/admin`. Shield glyph differentiates audience from curator `/login`. |
| `/admin` | Three tabs: Requests · Posts · Banners (Banners added v1.1l session 24). Approval UX includes inline Diagnose links for collision triage (session 13). Unauth gate redirects to `/admin/login`. |

### Reseller intel (dark theme — untouched)

| Route | Purpose |
|---|---|
| `/scan` | Camera capture entry |
| `/discover` | Claude Vision identification fires on mount |
| `/refine` | Low-confidence correction — user edits item name |
| `/decide` | Comps + profit + verdict |
| `/intent` | Caption + intent chips |
| `/enhance-text` | Before/after caption slider (mock) |
| `/share` | Copy/download/Facebook stub |
| `/finds` | Saved finds (localStorage `tts_finds_v2`) |

### API routes

| Route | Purpose | Auth |
|---|---|---|
| `POST /api/auth/admin-pin` | PIN → server verify → returns `{ otp, email }` for client `verifyOtp`. Rate-limited 5/min per IP. | Public (PIN-gated) |
| `POST /api/vendor-request` | Insert vendor_requests row + fire receipt email. Rate-limited 3/10min per IP. | Public |
| `GET /api/admin/vendor-requests` | List pending/approved requests. | `requireAdmin` |
| `POST /api/admin/vendor-requests` | `{ action: "approve", requestId }` — constraint-aware vendor creation + fire approval email. Handles slug and booth collisions with diagnosis payload (session-13 KI-004 fix). | `requireAdmin` |
| `POST /api/admin/diagnose-request` | Full collision diagnosis for a `requestId`. Returns structured `diagnosis` code + `conflict` object for admin UI rendering. (Session 13, NEW.) | `requireAdmin` |
| `GET/POST /api/admin/posts` | Admin post list + moderation actions. | `requireAdmin` |
| `POST /api/admin/featured-image` | Upload image to `site-assets` bucket + upsert `site_settings` row (v1.1l). | `requireAdmin` |
| `POST /api/setup/lookup-vendor` | Links `vendors.user_id = auth.user.id` by joining `vendor_requests.email` to the authenticated user's email. Idempotent. | `requireAuth` |
| `POST /api/post-image` | Upload base64 data URL to Supabase Storage (service role — bypasses the anon-client bucket visibility issue that makes `lib/posts.ts:uploadPostImage` silently fail). | Public (called from authed client) |
| `POST /api/post-caption` | Treehouse-tone title + caption. Claude or mock fallback. Rate-limited 10/60s per IP. | Public |
| `GET /api/identify` | Claude Vision identification (reseller layer). | Public |
| `GET /api/sold-comps` | SerpAPI or Apify comp fetch with 48h in-memory cache. | Public |
| `GET /api/debug` | Env var status + live Supabase insert test. | Public — consider retiring post-beta. |

---

## 6. Key Libraries (`lib/`)

### Auth + identity

- **`lib/supabase.ts`** — Supabase browser client. Uses placeholder URL at build time to avoid prerender crash.
- **`lib/auth.ts`** — `sendMagicLink(email, redirectTo?)` (appends `next=` for post-auth redirect), `getSession()`, `getUser()`, `signOut()`, `onAuthChange()`, `isAdmin(user)`, `getCachedUserId()`. Session-user-id cached to `localStorage.treehouse_auth_uid` for sync owner detection.
- **`lib/adminAuth.ts`** — Server helpers: `getServiceClient()`, `requireAuth(req)`, `requireAdmin(req)`. Bearer-token pattern (Option B — no cookie bridge). Logs 401 causes distinctly (missing header vs rejected token — session-9 observability addition).
- **`lib/authFetch.ts`** — Client helper that attaches `Authorization: Bearer <access_token>` to outbound fetch. Use for every gated API call from the browser.
- **`lib/mode.ts`** — Explorer / Curator mode toggle. `localStorage.treehouse_mode`. Defaults to `"explorer"`.

### Data access

- **`lib/posts.ts`** — Canonical data-access layer. Key exports:
  - **Posts:** `getFeedPosts(limit?)` (filters `status="available"`), `getPost(id)`, `getPostsByIds(ids)` (NO status filter — preserves three-part v1.1i sold contract for Find Map), `getMallPosts(mallId, limit?)`, `getVendorPosts(vendorId, limit?)`, `createPost(input)`, `updatePost(id, input)`, `updatePostStatus(id, status)`, `deletePost(id)`.
  - **Vendors:** `getVendorBySlug(slug)`, `getVendorByUserId(userId)` (authoritative auth-linked lookup), `getVendorById(id)`, `getVendorsByMall(mallId)`, `createVendor(input)` (handles 23505 via `mall_id + booth_number` fallback lookup — iPhone localStorage-loss recovery), `updateVendorBio(vendorId, bio)`, `slugify(name)`.
  - **Malls:** `getAllMalls()`, `getMallBySlug(slug)`.
  - **Hero images:** `uploadVendorHeroImage(dataUrl, vendorId)` (upsert with cache-bust), `updateVendorHeroImage(vendorId, url)`.
  - **⚠️ Deprecated** (loud `console.warn`, no callers): `getVendorByEmail`, `linkVendorToUser`, `getVendorRequests`, `createVendorFromRequest`, `markVendorRequestApproved`, `uploadPostImage`. All blocked by browser anon client RLS; use the `/api/*` equivalents instead.
- **`lib/siteSettings.ts`** (v1.1l) — `getSiteSettingUrl(key)`, `getAllBannerUrls()`. Both return null on any failure path so `<FeaturedBanner>` can graceful-collapse when the migration hasn't run or the admin hasn't uploaded an image yet.
- **`lib/imageUpload.ts`** — Canonical image-upload helpers: `compressImage(dataUrl, maxWidth?, quality?)` (client-side canvas resize + JPEG re-encode, defaults 1400px / 0.82), `uploadPostImageViaServer(dataUrl, vendorId)` (THROWS on failure — callers MUST try/catch and abort the post write).

### Comms + storage

- **`lib/email.ts`** — `sendRequestReceived(payload)`, `sendApprovalInstructions(payload)`. Resend REST API wrapper via native fetch (no SDK dependency). Best-effort — functions catch and log rather than throw. From address `Treehouse <hello@kentuckytreehouse.com>`. No-ops with a console warning when `RESEND_API_KEY` is unset.
- **`lib/postStore.ts`** — In-memory store for `/post → /post/preview` image handoff. Avoids sessionStorage size limits. Cleared after publish.
- **`lib/safeStorage.ts`** — localStorage wrapper with sessionStorage + in-memory fallback. Use instead of raw `localStorage` in ecosystem client components (Safari ITP-safe).
- **`lib/cache.ts` / `lib/searchCache.ts`** — 48h in-memory cache for SerpAPI comp fetches.

### Reseller intel (dark layer — untouched)

- **`lib/queryBuilder.ts`** — P1–P9 priority hierarchy, deterministic query builder.
- **`lib/scoring/`** — comp scoring engine.
- **`lib/pricingLogic.ts`, `lib/opportunityScore.ts`, `lib/mockIntelligence.ts`, `lib/serpApiClient.ts`, `lib/apifyClient.ts`, `lib/ebayClient.ts`** — reseller-layer support.

### Design tokens

- **`lib/tokens.ts`** — Two token sets, intentionally coexisting during migration:
  - **v0.2 legacy:** `colors`, `radius`, `spacing` — used by feed (legacy call sites), post flow, admin, BottomNav, mall/vendor profile pages that have not yet migrated.
  - **v1 / fonts (v1.1h–v1.1l):** `v1` palette (paperCream, post-it, ink scale, price ink, pill, iconBubble, green, red, image radius 6px, banner radius 16px), `fonts` (imFell, sys, postitNumeral). Named exports `FONT_IM_FELL`, `FONT_SYS`, `FONT_POSTIT_NUMERAL` match what Find Detail / Find Map / BoothPage previously declared as local constants.
- **`lib/utils.ts`** — Shared utilities: bookmark helpers (`BOOKMARK_PREFIX`, `flagKey`, `loadBookmarkCount`, `loadFollowedIds`), `vendorHueBg(name)` (deterministic pastel fallback), `mapsUrl(query)` (Apple Maps deep link), **`boothNumeralSize(boothNumber)`** (v1.1l — auto-scales the 36px post-it numeral by digit count: 36px ≤4, 28px @ 5, 22px @ 6+).

---

## 7. Key Components (`components/`)

### v1.1 primitives (current)

- **`<StickyMasthead>`** (v1.1l, session 24) — shared scroll-linked masthead chrome. Scroll-linked bottom hairline: transparent at rest, fades in past `scrollY > 4`. Accepts a `scrollTarget` ref for overflow-auto containers (Booth pages). Migrated six mastheads: Home, Find Map, Find Detail normal, Find Detail 3B, My Shelf, Public Shelf.
- **`<FeaturedBanner>`** (v1.1l, session 24) — admin-editable hero banner primitive. Two variants: **eyebrow** (title above image as separate text block — Home "Featured Find") and **overlay** (title in IM Fell 30px white with text-shadow, top-down scrim — Find Map "Find Map" title). 16px radius, 10px horizontal inset. Graceful collapse when `imageUrl` is null.
- **`<MallSheet>`** (v1.1i, session 21A) — bottom-sheet mall selector. Transform-free centering (`left:0; right:0; margin:0 auto`) per session-21A fix. First consumer: Home feed. Pending migration to `/post`, `/post/preview`, `/vendor-request` (deferred as v1.1k (h)).
- **`<BoothPage>`** (v1.1h, session 18) — shared Booth primitive for `/my-shelf` and `/shelf/[slug]`. Banner as pure photograph with booth post-it pinned; vendor name as IM Fell 32px page title; pin-prefixed mall + address; Window View (3-col 4:5 grid) + Shelf View (horizontal 52vw/210px tiles with 22px first-tile left padding). Exports the `v1` + `fonts` symbols so Booth-consuming pages don't need to re-import from `lib/tokens.ts`.
- **`<BottomNav>`** (v1.1l idle-color update) — minimal chrome: paperCream translucent bg + inkHairline border. Idle-tab color is `v1.inkMuted` (`#6b5538`). Full Nav Shelf rework still deferred (Sprint 5 decision sprint — 4 mockups in `docs/mockups/nav-shelf-exploration.html`).

### v0.2 legacy (still in use on unmigrated surfaces)

- `AppHeader`, `Buttons`, `ShelfGrid` (parked with retention comments; zero current callers), `AdminOnly`, `ModeToggle`, `PiLeafIcon`, `DevAuthPanel`.

### Reseller layer (dark theme — untouched)

- `AnalysisFeed`, `AnalysisSheet`, `CompCard`, `DecisionDial`, `FlowDiagram`, `OpportunityMeter`, `PriceInput`, `PricingBreakdown`, `RecommendationMeter`, `SavedItemCard`.

### Retired (sessions 17–21A)

- `<LocationStatement>` — replaced by pin+X block (session 18)
- `<BoothLocationCTA>` — replaced by banner post-it (session 18)
- `<ExploreBanner>` — replaced by Find Map v1.1g (session 17)
- `<TabSwitcher>` — Window/Shelf toggle replaced by inline label (session 18)
- `<MallHeroCard>`, `<GenericMallHero>`, inline `ChevronDown` dropdown — replaced by `<MallSheet>` + paper masonry (session 21A)
- `<BoothFinderCard>` — retired earlier in v0.2

---

## 8. Auth + Server API Pattern

### Client → Server bearer-token pattern (Option B)

1. Client imports `authFetch` from `@/lib/authFetch`.
2. `authFetch` reads the current Supabase access token via `supabase.auth.getSession()` and attaches it as `Authorization: Bearer <token>`.
3. Server route's first line: `const auth = await requireAdmin(req); if (!auth.ok) return auth.response;` (or `requireAuth` for routes that need any signed-in user).
4. `requireAuth` validates the token with the service role client (`service.auth.getUser(token)`), returns the user + service client on success or a ready-to-return `NextResponse` on failure.
5. `requireAdmin` calls `requireAuth` and additionally checks `user.email.toLowerCase() === NEXT_PUBLIC_ADMIN_EMAIL.toLowerCase()`.

This keeps `/api/admin/*` and `/api/setup/*` honestly gated server-side. Service-role-only tables (`vendor_requests`) must be accessed via these routes — the browser anon client silently returns empty results on a `USING (false)` policy.

### Redirect-preservation pattern (session 5 + session-9 KI-003 unification)

- `lib/auth.ts:sendMagicLink(email, redirectTo?)` appends `redirectTo` as `&next=<encoded>`.
- `/login` reads BOTH `?redirect=` (approval email CTA) AND `?next=` (magic-link round trip) — `searchParams.get("redirect") ?? searchParams.get("next")`.
- `safeRedirect(next, fallback)` validates same-origin relative paths only. Rejects absolute URLs and protocol-relative (`//`) paths.

### Email pattern (session 8)

- `lib/email.ts` — Resend REST API wrapper. Best-effort delivery.
- `sendRequestReceived` — fires from `POST /api/vendor-request` after insert.
- `sendApprovalInstructions` — fires from `POST /api/admin/vendor-requests` after successful approve + vendor row creation.
- Functions return `{ ok, error? }` and NEVER throw. Callers log on `!ok` but return HTTP success if the underlying transaction succeeded.

### Vendor approval pattern (session 13 — KI-004)

The `POST /api/admin/vendor-requests { action: "approve" }` handler performs pre-flight booth collision check before insert. Four branches:

- **Booth collision + unlinked + matching name** → safe claim (reuse existing row; link `user_id` later at `/setup`)
- **Booth collision + unlinked + different name** → reject with named details (admin renames or cleans up)
- **Booth collision + already linked** → hard reject with named details
- **No booth collision** → insert normally

Slug collisions auto-resolve via suffix loop (`-2`, `-3`, … up to 20 attempts). All error responses include `diagnosis` code + `conflict` object for admin UI rendering. All recovery paths use `.maybeSingle()` (not `.single()`) so zero-row results return null rather than throwing "Cannot coerce...".

### Admin sign-in pattern (v1.1k session 23 + orphan fix session 25)

- `/admin/login` dedicated route, PIN entry UI.
- `POST /api/auth/admin-pin { pin }` → server checks PIN, generates OTP, sends email, returns `{ otp, email }`.
- Client calls `supabase.auth.verifyOtp({ email, token, type: "email" })` → `router.replace("/admin")`.
- `/admin` unauth gate redirects to `/admin/login` (one-line session-23 edit; target finally on disk session 25).

### Featured banner pattern (v1.1l session 24)

- Read: `lib/siteSettings.ts:getSiteSettingUrl(key)` — anon read, returns `string | null`. Graceful-collapse on any failure.
- Write: `POST /api/admin/featured-image { base64DataUrl, settingKey }` — admin-only upload to `site-assets` bucket + upsert `site_settings` row.
- Render: `<FeaturedBanner>` returns null when `imageUrl` is absent — no broken UI.

---

## 9. Design System — v1.1l summary

Full canonical spec lives in `docs/design-system.md`. This is a pointer with the essentials.

### Vocabulary

- **Paper as surface.** No card chrome. Paper *is* the container. Section divisions use whitespace, hairline rules, and the diamond ornament (retired in v1.1j — `FONT_SYS` now carries booth numeral disambiguation).
- **Cartographic pin + X.** Pin = mall (page-level anchor, appears once). X = booth (content-level, one per booth stop). Never swap or substitute. Locked session 17.
- **Booth post-it.** One skeuomorphic material gesture per find. Pinned with push pin, rotated `+6deg`, stacked "Booth Location" eyebrow. Cross-page primitive shared between Find Detail and Booth banner.
- **Captions as reflections.** Always in typographic quotation marks (“ ”), centered, italic IM Fell. About how it feels, never what it's made of.
- **"Found a home" not "Sold."** Vocabulary is committed.

### Palette (v1 / paperCream)

```
paperCream    #e8ddc7  — globally committed bg (session 17)
postit        #fffaea
inkPrimary    #2a1a0a
inkMid        #4a3520
inkMuted      #6b5538
inkFaint      rgba(42,26,10,0.28)
inkHairline   rgba(42,26,10,0.18)
priceInk      #6a4a30
pillBg        rgba(247,239,217,0.88)
pillBorder    rgba(42,26,10,0.72)
pillInk       #1c1208
iconBubble    rgba(42,26,10,0.06)  — paper-variant icon bubble + paper-wash success bubble (v1.1k)
green         #1e4d2b              — active / commit CTA
red           #8b2020              — destructive / error
redBg         rgba(139,32,32,0.07)
redBorder     rgba(139,32,32,0.18)
imageRadius   6px
bannerRadius  16px                 — photo cards / banner exception
```

### Typography

- IM Fell English — titles, subheads, eyebrows, captions, vendor names, mall names
- system-ui (`FONT_SYS`) — form inputs, OTP codes, pill numerals, addresses, timers, error copy, booth numerals (v1.1j)
- Times New Roman (`FONT_POSTIT_NUMERAL`) — 36px post-it numeral ONLY (v1.1l exception)
- Caveat — reserved, not currently active

### Animation defaults (framer-motion)

```js
initial={{ opacity: 0, y: 8–16 }}
animate={{ opacity: 1, y: 0 }}
transition={{ ease: [0.25, 0.1, 0.25, 1] as const }}
```

Never two `transition` props on the same motion.div. Never apply centering transforms inline on a motion.div that animates `y` (session-7 KI-002 pattern — use wrapper-div).

### Mobile layout rules

- Max width: 430px per page
- Safe-area insets: `env(safe-area-inset-bottom)` on all fixed bottom bars
- Floating headers: `backdropFilter: blur(20px) / -webkit-backdrop-filter: blur(20px)`
- No `position: fixed` chrome on detail page — use floating buttons over image

---

## 10. User Flows

### Flow A — Shopper Browses (no auth)

1. `/` — scroll paper masonry, no prices, `<FeaturedBanner>` eyebrow on top, mall filter via `<MallSheet>`
2. Tap tile → `/find/[id]` — full-bleed photo, title, availability, caption, shelf scroll, location card with post-it
3. Tap address → Apple Maps deep link
4. Tap saved heart on any tile or detail → Find Map journal grows

### Flow B — Shopper Saves to Find Map

1. Saved finds accumulate via `localStorage.treehouse_bookmark_<postId> = "1"`
2. `/flagged` renders as a journal itinerary — overlay `<FeaturedBanner>`, pin + mall anchor, X-glyph spine between booth stops, terminal closer circle with tagline fragment
3. Saved-but-sold tiles render identically to available (three-part v1.1i sold contract — bookmark kept, tile identical, Find Detail 3B is the reveal)

### Flow C — Vendor Onboards (three committed sub-flows)

Full spec: `docs/onboarding-journey.md`.

- **Flow 1 — Pre-Seeded (admin alone):** admin creates `vendors` row with `user_id=NULL`, no `vendor_requests`, no emails. Future hook: "Claim this booth" via vendor_request with `claim: true` flag (Sprint 6+, not built).
- **Flow 2 — Demo (admin + vendor in-person):** admin captures vendor on `/admin` → `vendor_requests` insert → Email #1 receipt → admin approves same session → vendor row created, `user_id=NULL` → Email #2 approval → vendor signs in → `/setup` links `user_id` → `/my-shelf`.
- **Flow 3 — Vendor-Initiated (remote, async):** vendor submits `/vendor-request` → Email #1 receipt → admin approves later → Email #2 approval → same convergence as Flow 2 step 5 onward.

### Flow D — Vendor Posts a Find

1. `/post` — `getVendorByUserId(user.id)` resolves identity (unauth falls back to localStorage; authed never does — session-9 guard)
2. Camera capture → `compressImage` → profile form if unauth → `/post/preview`
3. `/post/preview` — edit title/caption/price → `POST /api/post-caption` → review
4. Publish — `uploadPostImageViaServer` (throws on failure; callers abort) → `createPost` → clear postStore → confirmation screen
5. Confirmation — "Back to feed" / "Visit us on Facebook" / "Post another find"

### Flow E — Reseller Intel (dark layer)

1. `/scan` → camera capture
2. `/discover` — `POST /api/identify` fires on mount
3. [optional] `/refine` — edit item name
4. `/decide` — enter cost → `GET /api/sold-comps` → pricing logic → verdict
5. Save → `/finds` (localStorage `tts_finds_v2`)

---

## 11. Reseller Layer — Data Model + Logic

### FindSession (sessionStorage key `tts_active_session`)

```
id, createdAt, imageOriginal, imageEnhanced?, identification?, refinedQuery?,
intentText?, intentChips?, captionRefined?, pricePaid?, comps?, pricing?, decision?
```

### SavedFind (localStorage key `tts_finds_v2`)

Subset of FindSession + decision + pricing summary.

### Comp pipeline

1. `/discover` → `POST /api/identify` → `session.identification.searchQuery`
2. [optional] `/refine` → `session.refinedQuery`
3. `/decide` → `GET /api/sold-comps?q={searchQuery}`
4. `normalizeQuery` → 48h cache check → SerpAPI fetch → cache set → return
5. If `comps.length === 0` → `generateMockEvaluation()` fallback

### Pricing logic

```
medianSoldPrice      = trimmed median (remove <0.3x or >2.5x raw median)
estimatedFees        = medianSoldPrice × 0.13
estimatedProfitHigh  = medianSoldPrice − cost − fees

strong-buy  profitHigh >= $20 AND (profit/cost) >= 1.5
maybe       profitHigh >=  $8 AND (profit/cost) >= 0.6
pass        everything else
```

### Identification

`POST /api/identify` — model `claude-opus-4-5`, max_tokens 400. Returns `{ title, description, confidence, searchQuery }`. Mock fallback: 8 deterministic items seeded by `imageDataUrl.length % 8`.

---

## 12. DNS State

- **Registrar:** Squarespace Domains
- **Authoritative nameservers:** Shopify (zone `kentuckytreehouse.com`)
- **DNSSEC:** Off
- **Key records (all in Shopify DNS):**
  - `A @ → 23.227.38.65` (Shopify)
  - `CNAME app → cname.vercel-dns.com` (Vercel custom domain)
  - `TXT resend._domainkey → <DKIM>` (Resend)
  - `TXT send → v=spf1 include:amazonses.com ~all` (Resend SPF via SES)
  - `MX send → feedback-smtp.us-east-1.amazonses.com` (Resend bounce handling)
- **Dual email channels:**
  - Supabase Auth OTP emails → Resend SMTP (configured in Supabase Dashboard → Auth → SMTP Settings)
  - Our transactional emails (receipt + approval) → Resend REST API via `lib/email.ts`
- **Dormant:** Cloudflare nameservers assigned but not authoritative. Leftover from a session-3 migration plan. No cost, retire at leisure.

---

## 13. Known Constraints + Gotchas

### zsh / git

- `git add app/find/[id]/page.tsx` breaks (zsh glob-expands `[id]`). Always `git add -A`.
- `str_replace` container tool fails on bracket-path files. Use `filesystem:edit_file` or full `filesystem:write_file` rewrites.

### Next.js 14 App Router

- `export const dynamic = "force-dynamic"` required on every ecosystem page that imports `supabase` at module scope.
- `useSearchParams()` requires a `<Suspense>` boundary.
- Never `export const config = {}` — deprecated.

### framer-motion

- Never two `transition` props on the same motion.div — merge them.
- `ease` arrays need `as const` — e.g. `[0.25, 0.46, 0.45, 0.94] as const`.
- Never apply centering transforms inline on a motion.div that animates `y` — use a non-animated wrapper for `position: fixed; left: 0; right: 0; margin: 0 auto` and let the inner motion.div animate only `opacity + y + scale` (session-9 KI-002 pattern).

### Supabase

- RLS on `malls` / `vendors` / `posts` — 12 policies. Service-role bypasses for admin paths.
- RLS on `vendor_requests` — service-role only (`USING (false)`). Browser anon client returns empty silently.
- `site_settings` — RLS intentionally disabled (anon read, service-role write via `/api/admin/featured-image`).
- Supabase access token needs ~500ms to be validatable via `service.auth.getUser(token)` after issue. `/setup` absorbs this with a one-retry + 800ms backoff in `callLookupVendor` (session-10 polish).
- Supabase OTP Length (Auth → Providers → Email) must match the app's 6-digit input. Default is 8 — change it.
- Supabase's Magic Link + Confirm Signup email templates must BOTH include `{{ .Token }}` in a `<code>` element with `user-select: all; -webkit-user-select: all`. Default templates only render the link.

### Safari / iPhone

- localStorage can be cleared between sessions (ITP). Use `safeStorage` wrapper.
- Raw localStorage iteration is still needed for bookmark key scanning (`BOOKMARK_PREFIX`).
- PWA magic-link return breaks session continuity — OTP 6-digit code is the primary path (session 6).

### Vercel

- Project scope: `david-6613s-projects` (NOT `zen-forged`).
- GitHub webhook unreliable → use `npx vercel --prod` if a push doesn't deploy.
- Env vars must be read inside function bodies in serverless routes (not module scope).

### Tool environment

- **`filesystem:write_file`** is the only reliable way to write files from an MCP session — `create_file` in the container does NOT touch the Mac filesystem.
- **`filesystem:edit_file`** is atomic per batch: if one `oldText` anchor in a multi-edit batch misses, the whole batch rolls back. Box-drawing characters in rule lines (`───`, `═══`) fail intermittently; anchor on unique code content instead.

---

## 14. Current Development State (2026-04-19, session 26)

### Working ✅

- Discovery feed (paper masonry + `<MallSheet>` + `<FeaturedBanner>` eyebrow + `<StickyMasthead>`)
- Magic link auth (6-digit OTP primary path)
- Admin PIN sign-in at `/admin/login`
- Magic link `?redirect=` + `?next=` preserved across round trip (unified session 9)
- My Shelf, Public Shelf, Post flow, Post preview, Find detail (v1.1d + 3B sold state), Public shelf
- Find Map (`/flagged`) v1.1g + v1.1l polish (spine-to-closer, tagline fragment, X strokeWidth 2.2, vendor-name italic retired)
- Vendor request flow, vendor account setup, admin approval workflow (constraint-aware, session 13)
- RLS — 12 policies + vendor_requests locked to service-role + site_settings intentionally public-read
- Rate limiting — `/api/post-caption` 10/60s, `/api/vendor-request` 3/10min, `/api/auth/admin-pin` 5/min
- Custom domain `app.kentuckytreehouse.com`
- Branded email templates (Magic Link + Confirm Signup)
- Transactional email receipt + approval via `lib/email.ts`
- Admin diagnostic UI (inline DiagnosisPanel, session 13)
- Admin-editable hero banners on Home + Find Map (v1.1l, session 24 — migration applied session 25)
- Design system v1.1l
- Four active agents: Dev · Product · Docs · Design

### Resolved known issues

- KI-001 (admin PIN redirect) — session 9
- KI-002 (Framer Motion toast centering on `/admin`) — session 9
- KI-003 (vendors posting under stale identity after approval) — session 9, three-part fix, Flow 2 verified on device
- KI-004 (approve endpoint 23505 silent-reuse) — session 13
- Session-23 `/admin/login` file orphan — resolved session 25
- v1.1l `site_settings` migration applied — session 25

### Open — pre-beta tech work

- **Sprint 4 tail batch** (longest-parked pre-beta item as of session 26):
  - T4c remainder — copy polish on `/api/setup/lookup-vendor` error + `/vendor-request` success screen
  - T4b — admin surface consolidation
  - T4d — pre-beta QA walk of all three onboarding flows end-to-end
- Test data cleanup — 5+ "David Butler" variants in DB from sessions 7–13 testing; clean via admin-runbook Recipe 4
- Error monitoring (Sentry or structured logs)
- Feed content seeding (10–15 real posts before beta invite)
- Beta feedback mechanism (Tally.so link)

### Open — Sprint 5 + design follow-ons

- `<MallSheet>` migration to `/post`, `/post/preview`, `/vendor-request` (deferred as v1.1k (h); mechanical work against committed primitive)
- Nav Shelf decision + BottomNav full chrome rework (4 mockups in `docs/mockups/nav-shelf-exploration.html`)
- Guest-user UX: Home masthead + BottomNav "Sign in" → "Curator Sign In" rename, `/welcome` guest landing, PWA install onboarding, bookmarks persistence (localStorage → DB-backed), vendor onboarding Loom
- Hero image upload size guard — verify coverage beyond admin banner editor

### Parked (Sprint 6+)

- "Claim this booth" for Flow 1 pre-seeded vendors
- QR-code approval handshake
- Universal Links (iOS `apple-app-site-association`)
- Native app evaluation
- `admin-cleanup` tool (collapse 3-table SQL reset to one click)
- Feed pagination, search, ToS/privacy
- Mall page vendor CTA, vendor directory
- Post-MVP: 3A Find Detail sold landing state (photograph-still-visible treatment); Find Map saved-but-sold tile signal

### Cleanup (not urgent)

- Deprecated vendor-request functions + `uploadPostImage` in `lib/posts.ts`
- Cloudflare nameservers (dormant, no cost)
- `/shelves` `AddBoothSheet` (orphan after T4b ships)
- `docs/VENDOR_SETUP_EMAIL_TEMPLATE.md` (obsolete since T4a)
- Retired v0.2 components (already deleted; grep for stale imports)
- `components/ShelfGrid.tsx` (parked with retention comments; zero current callers)
- Mockup HTML files in `docs/mockups/` — many historical records can retire once on-device QA confirms their respective versions

---

## 15. Roadmap

| Item | Status |
|---|---|
| Discovery feed + vendor post flow | ✅ |
| Real eBay comps (SerpAPI) | ✅ |
| Mall + vendor profile pages | ✅ |
| Tree masonry feed | ✅ Superseded by paper masonry (v1.1i) |
| Story-driven Find Detail | ✅ v1.1d + 3B sold state |
| Find Map (`/flagged`) | ✅ v1.1g + v1.1l polish |
| Booth page redesign | ✅ v1.1h cross-page primitive |
| Supabase Auth magic link + OTP | ✅ 6-digit code primary |
| Custom domain | ✅ `app.kentuckytreehouse.com` |
| Transactional emails (receipt + approval) | ✅ via Resend REST |
| Admin-editable hero banners | ✅ v1.1l |
| Dedicated `/admin/login` | ✅ v1.1k (orphan fix session 25) |
| Supabase RLS | ✅ 12 policies |
| `<MallSheet>` migration to remaining consumers | 🔄 Sprint 5 |
| "Curator Sign In" rename + `/welcome` | 🔲 Sprint 5 |
| PWA / offline mode | 🔲 Sprint 5 |
| Native share sheet on Find Detail | 🔲 Planned |
| Pull-to-refresh on feed | 🔲 Planned |
| Real `/enhance-text` caption (Claude) | 🔲 Planned |
| Error monitoring | 🔲 Sprint 4 tail / 5 |
| "Claim this booth" flow | 🔲 Sprint 6+ |
| Facebook auto-post via Graph API | 🔲 Future |
| Poshmark / Mercari comps | 🔲 Future |
| Reverse image search | 🔲 Future |
| Kanban sourcing board | 🔲 Future |
| Analytics dashboard | 🔲 Future |

---

## 16. How to Use This Document

**Every Claude session:** Read `CLAUDE.md` → `CONTEXT.md` → `docs/DECISION_GATE.md` at the opener.

- `CLAUDE.md` is the live whiteboard — current issue, what just shipped, what's next.
- `CONTEXT.md` (this file) is the architecture reference — schema, routes, data flow, design system pointer.
- `docs/DECISION_GATE.md` is the operating constitution — brand rules, tech rules, risk register, three-level decision gate.

**Related canonical docs:**

| File | Purpose |
|---|---|
| `docs/design-system.md` | Canonical visual + interaction system — v1.1l. All multi-screen UI work scopes here first. Owned by Design agent. |
| `docs/onboarding-journey.md` | Canonical vendor onboarding spec — three flows. All onboarding-adjacent work scopes here first. |
| `docs/admin-runbook.md` | 9-recipe SQL triage guide for in-mall use (session 13). |
| `docs/known-issues.md` | Active bugs + deferred items + resolved history. |
| `docs/decision-log.md` | Architectural decisions + rationale (create when first decision is logged). |
| `MASTER_PROMPT.md` | Session structure + phase gating + HITL indicator standard. |
| `SPRINT_PLAN.md` | Sprint-level feature roadmap. |

**Production debugging:**

```bash
curl -s https://app.kentuckytreehouse.com/api/debug | python3 -m json.tool
```

```bash
npm run build 2>&1 | tail -30
```

```bash
npx vercel --prod
```

```bash
git add -A && git commit -m "..." && git push
```

---
> This document is the architecture reference for the Treehouse system.
> It is maintained by the Docs agent and reviewed by David at each sprint boundary.
> Last updated: 2026-04-19 (session 26 — full refresh, 18 sessions of drift reconciled against on-disk state).
