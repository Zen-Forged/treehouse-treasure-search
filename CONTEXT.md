# Treehouse Finds — Master Context Document
> Last updated: 2026-04-21 (session 39 — Q-004 rename sweep + Q-005 email tagline shortening)
> Repo: Zen-Forged/treehouse-treasure-search
> Live: `app.kentuckytreehouse.com` (custom domain) + `treehouse-treasure-search.vercel.app` (Vercel default)

This document is the architecture reference. It is intentionally separate from `CLAUDE.md` (live session whiteboard) and `docs/DECISION_GATE.md` (operating constitution). New sessions read all three at the opener, in that order.

---

## 1. Product Overview

Treehouse Finds is a **calm, story-driven local discovery experience** for vintage, antique, and thrift finds in Kentucky and Southern Indiana.

- **Shoppers** browse a real-time feed before making the trip to a mall or booth.
- **Vendors** post finds for visibility without running a full e-commerce stack.
- **Mall operators** get organic foot traffic through their vendors' content.
- **Resellers** (secondary, not the front door) get comp + profit analysis via `/scan → /decide`.

The front door is the **Discovery Feed** (`/`). Shoppers browse without an account. Vendors sign in via magic-link OTP. Admin signs in via PIN.

**Tagline (committed session 15, first surfacing in-product session 24 — Find Map closer):**
**Embrace the Search. Treasure the Find. Share the Story.**

### What Treehouse Finds is NOT

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
| AI | `@anthropic-ai/sdk` — `claude-sonnet-4-6` (post-caption, extract-tag, story), `claude-opus-4-7` (identify) |
| Database | Supabase (Postgres) |
| Storage | Supabase Storage — buckets: `post-images`, `site-assets` |
| Auth | Supabase Auth (magic-link OTP, 6-digit code primary path) |
| Email | Resend — dual use: (1) SMTP provider for Supabase Auth OTP emails, (2) REST API for our own transactional emails via `lib/email.ts` |
| Comp data | SerpAPI (eBay) |
| Deployment | Vercel |
| Error monitoring | Sentry (`@sentry/nextjs`) — session 65, R12. Dashboard: https://zen-forged.sentry.io/issues/?project=4511286908878848 |

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
NEXT_PUBLIC_SUPABASE_ANON_KEY    sb_publishable_...  (new publishable-key format, session 29 rotation)
SUPABASE_SERVICE_ROLE_KEY        sb_secret_...  (new secret-key format, session 29 rotation)
                                 Server-only. Required for /api/admin/*, /api/setup/*,
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

# Sentry — auto-managed by the Vercel Marketplace Sentry integration
# (zen-forged Sentry org → javascript-nextjs project ↔ treehouse-treasure-search Vercel project).
# Do NOT set these manually in Vercel — the integration syncs and rotates them.
SENTRY_AUTH_TOKEN                Server-only. Used by Vercel build to upload source maps.
SENTRY_ORG                       "zen-forged"
SENTRY_PROJECT                   "javascript-nextjs"
NEXT_PUBLIC_SENTRY_DSN           Public/write-only. Hardcoded in sentry.{client,server,edge}.config.ts
                                 as a fallback; the env var is harmless duplication.
SENTRY_PUBLIC_KEY                Sentry CDN key. Set by the integration; not consumed by our code.
SENTRY_OTLP_TRACES_URL           OTLP trace ingest URL. Not consumed yet.
SENTRY_VERCEL_LOG_DRAIN_URL      Log-drain endpoint. Not consumed yet.
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
| user_id | uuid | nullable — FK → auth.users. Set at `/setup` link step (or `/my-shelf` self-heal, session 35). Left NULL for pre-seeded Flow-1 booths. **No longer UNIQUE** as of migration 006 — session 35 multi-booth. |
| display_name | text | Public-facing booth name. Priority at approval (session 32): `booth_name → first_name+last_name → legacy name`. |
| booth_number | text | nullable |
| bio | text | nullable |
| avatar_url | text | nullable |
| hero_image_url | text | nullable — banner photo on My Shelf / Public Shelf |
| slug | text | URL-safe. UNIQUE (`vendors_slug_key`) globally. Collisions auto-resolve via suffix loop (`-2`, `-3`, …) at admin approval time — see `docs/admin-runbook.md` and session-13 KI-004 fix. |
| facebook_url | text | nullable |

**Three unique constraints (session 35 — `vendors_user_id_key` dropped in migration 006):**

1. `vendors_pkey` PRIMARY KEY (id)
2. `vendors_slug_key` UNIQUE (slug) — globally unique; auto-suffix on collision
3. `vendors_mall_booth_unique` UNIQUE (mall_id, booth_number) — pre-flight checked on approve. Canonical natural key for vendor identity, used by `/api/setup/lookup-vendor` composite-key lookup.

One auth user may now own N vendor rows (one per booth owned). The active booth at runtime is resolved via `lib/activeBooth.ts` using `safeStorage` key `treehouse_active_vendor_id` — see §6.

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
| name | text | Legacy — populated as `first_name + ' ' + last_name` for backwards compat with any reader that still reads this column. |
| first_name | text | Session 32 v1.2 split. |
| last_name | text | Session 32 v1.2 split. |
| booth_name | text | nullable — Session 32 v1.2 addition. Optional display name for the booth. First priority in the approval display_name cascade. |
| proof_image_url | text | Session 32 v1.2 addition. Public URL of the uploaded booth-proof photo stored in `site-assets/booth-proof/`. |
| email | text | Vendor's auth identity. Exact-match join at `/setup` (now composite-key via `mall_id + booth_number`, session 35 — see KI-006 Resolved). |
| booth_number | text | nullable |
| mall_id | uuid | FK → malls |
| mall_name | text | Denormalized for email copy. |
| status | text | `pending` \| `approved` \| `rejected` |

**Partial unique index (session 35, migration 007):** `vendor_requests_email_booth_pending_idx` on `(lower(email), mall_id, booth_number) WHERE status = 'pending'`. Rekeyed from the session-32 email-only version so multi-booth add-on requests aren't falsely dedup'd.

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
- **`site-assets`** — PUBLIC (v1.1l, session 24). Admin-uploaded hero banners for Home + Find Map. Also holds `booth-proof/` path prefix (session 32 v1.2 — vendor-request verification photos).

### Migrations on disk (`supabase/migrations/`)

- `002_enable_rls.sql` — enables RLS + seeds the 12 policies
- `002_enable_rls_verify.sql` — verification queries
- `003_cleanup_old_rls_policies.sql` — removes stale pre-v2 policies
- `004_site_settings.sql` — v1.1l `site_settings` table + `site-assets` bucket + seed rows. 🖐️ HITL — applied session 25.
- `005_vendor_request_onboarding_refresh.sql` — session 32 v1.2 columns + email dedup index (email-only, pending).
- `006_multi_booth.sql` — session 35. Drops `vendors_user_id_key`. 🖐️ HITL — applied session 35.
- `007_multi_booth_vendor_request_dedup.sql` — session 35. Rekeys dedup index to composite `(lower(email), mall_id, booth_number) WHERE status = 'pending'`. 🖐️ HITL — applied session 35.

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
| `/setup` | Post-approval link step. Calls `POST /api/setup/lookup-vendor` (retries once on 401 with 800ms backoff — session 10 fix). Consumes the array response shape (session 35): `{ ok, vendors: Vendor[], alreadyLinked? }`. Writes `LOCAL_VENDOR_KEY` for `vendors[0]`, writes active-booth id to `safeStorage.treehouse_active_vendor_id`, auto-redirects to `/my-shelf` after 3s. Copy adapts to singular ("your shelf") vs plural ("your shelves"). |
| `/my-shelf` | Signed-in vendor's own shelf. Uses `<BoothPage>` primitive. List-aware via `getVendorsByUserId` + `resolveActiveBooth` (session 35). When a vendor owns > 1 booth, masthead renders the picker variant and `<BoothPickerSheet>` is instantiated. Self-heals via `/api/setup/lookup-vendor` on every non-admin load — merges its results with the direct `getVendorsByUserId` read to pick up newly-approved unlinked booths without requiring sign-out/in. |
| `/post` | Shim route. Redirects to `/my-shelf?openAdd=1` for AddFindSheet entry. |
| `/post/tag` | Tag-capture step (session 62). Sits between `/my-shelf` AddFindSheet and `/post/preview`. Vendor takes a photo of the booth's inventory tag → `/api/extract-tag` (Claude vision) extracts `{ title, price }` → `/post/preview` lands prefilled with green "from tag" pills. Skip option falls back to today's flow. Per-API failure absorbed into `postStore` and surfaced on preview via `<AmberNotice>` rather than stranding the vendor here. Uses `router.replace` to preview so back-from-preview lands on `/my-shelf`, not here. |
| `/post/preview` | Edit title / caption / price → publish. Branches on `postStore.extractionRan` (session 62): tag flow reads pre-fetched extracted fields from postStore and renders fully populated on first paint with no network call; skip flow keeps today's behavior (fire `/api/post-caption` on mount). Identity resolves via `getVendorsByUserId` + `resolveActiveBooth` (session 35). The post flow itself has no booth picker — single-path for 99% case. Vendors who want to post to a different booth switch on `/my-shelf` first. |
| `/vendor-request` | Public vendor-initiated onboarding form. Mode C chrome (v1.1k). Email + booth info + uploaded booth-proof photo (v1.2). Composite-key dedup (session 35). |

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
| `POST /api/vendor-request` | Insert vendor_requests row + upload booth-proof photo + fire receipt email. Rate-limited 3/10min per IP. Composite-key dedup on `(email, mall_id, booth_number)` (session 35 widening). | Public |
| `GET /api/admin/vendor-requests` | List pending/approved requests. | `requireAdmin` |
| `POST /api/admin/vendor-requests` | `{ action: "approve", requestId }` — constraint-aware vendor creation + fire approval email. Handles slug and booth collisions with diagnosis payload (session-13 KI-004 fix). | `requireAdmin` |
| `POST /api/admin/diagnose-request` | Full collision diagnosis for a `requestId`. Returns structured `diagnosis` code + `conflict` object for admin UI rendering. (Session 13, NEW.) | `requireAdmin` |
| `GET/POST /api/admin/posts` | Admin post list + moderation actions. | `requireAdmin` |
| `POST /api/admin/featured-image` | Upload image to `site-assets` bucket + upsert `site_settings` row (v1.1l). | `requireAdmin` |
| `POST /api/setup/lookup-vendor` | Session 35 rewrite. Composite-key lookup across all of the authenticated user's `vendor_requests`, matched against `(mall_id, booth_number, user_id IS NULL)`. Links every unlinked match in one UPDATE + returns the full linked set. Response shape: `{ ok, vendors: Vendor[], alreadyLinked? }`. Idempotent — safe to call every `/my-shelf` load. Killed KI-006. | `requireAuth` |
| `POST /api/post-image` | Upload base64 data URL to Supabase Storage (service role — bypasses the anon-client bucket visibility issue). | Public (called from authed client) |
| `POST /api/post-caption` | Treehouse-tone title + caption. `claude-sonnet-4-6`. Rate-limited 10/60s per IP. Returns `source: "claude" \| "mock"` observability field (session 27). | Public |
| `POST /api/extract-tag` | Tag extraction — Claude Sonnet 4.6 vision reads a printed/handwritten retail tag and returns `{ title: string, price: number \| null, source, reason? }`. Mirrors `/api/post-caption` line-by-line — rate limit 10/60s, mock fallback structure, logError helper, base64 input. Tag-specific system prompt instructs Claude to read verbatim, normalize ALL CAPS, return null price for unreadable rather than invent. (Session 62.) | Public |
| `GET /api/identify` | Claude Vision identification (reseller layer). `claude-opus-4-7`. | Public |
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
- **`lib/activeBooth.ts`** (session 35, NEW) — Active-booth resolver for multi-booth vendors. Exports `getActiveBoothId()`, `setActiveBoothId(id)`, `clearActiveBoothId()`, `resolveActiveBooth(vendors: Vendor[])`. Storage key: `treehouse_active_vendor_id` via `safeStorage`. Deterministic fallback when the stored id doesn't match any current row → returns `vendors[0]` (oldest by `created_at ASC`, per the `getVendorsByUserId` contract) and rewrites storage to match.

### Data access

- **`lib/posts.ts`** — Canonical data-access layer. Key exports:
  - **Posts:** `getFeedPosts(limit?)` (filters `status="available"`), `getPost(id)`, `getPostsByIds(ids)` (NO status filter — preserves three-part v1.1i sold contract for Find Map), `getMallPosts(mallId, limit?)`, `getVendorPosts(vendorId, limit?)`, `createPost(input)`, `updatePost(id, input)`, `updatePostStatus(id, status)`, `deletePost(id)`.
  - **Vendors:** `getVendorBySlug(slug)`, **`getVendorsByUserId(userId)`** (session 35 — **array return**, ordered by `created_at ASC`, authoritative auth-linked lookup for multi-booth), `getVendorById(id)`, `getVendorsByMall(mallId)`, `createVendor(input)` (handles 23505 via `mall_id + booth_number` fallback lookup — iPhone localStorage-loss recovery), `updateVendorBio(vendorId, bio)`, `slugify(name)`.
  - **Malls:** `getAllMalls()`, `getMallBySlug(slug)`.
  - **Hero images:** `uploadVendorHeroImage(dataUrl, vendorId)` (upsert with cache-bust), `updateVendorHeroImage(vendorId, url)`.
  - **⚠️ Deprecated** (loud `console.warn`, no callers): `getVendorByUserId` (session 35 shim that returns `rows[0] ?? null` with a console.warn; use `getVendorsByUserId + resolveActiveBooth`), `getVendorByEmail`, `linkVendorToUser`, `getVendorRequests`, `createVendorFromRequest`, `markVendorRequestApproved`, `uploadPostImage`. All blocked by browser anon client RLS; use the `/api/*` equivalents instead.
- **`lib/siteSettings.ts`** (v1.1l) — `getSiteSettingUrl(key)`, `getAllBannerUrls()`. Both return null on any failure path so `<FeaturedBanner>` can graceful-collapse when the migration hasn't run or the admin hasn't uploaded an image yet.
- **`lib/imageUpload.ts`** — Canonical image-upload helpers: `compressImage(dataUrl, maxWidth?, quality?)` (client-side canvas resize + JPEG re-encode, defaults 1400px / 0.82), `uploadPostImageViaServer(dataUrl, vendorId)` (THROWS on failure — callers MUST try/catch and abort the post write).

### Comms + storage

- **`lib/email.ts`** — `sendRequestReceived(payload)`, `sendApprovalInstructions(payload)`. Resend REST API wrapper via native fetch (no SDK dependency). Best-effort — functions catch and log rather than throw. From address `Treehouse <hello@kentuckytreehouse.com>`. No-ops with a console warning when `RESEND_API_KEY` is unset.
- **`lib/postStore.ts`** — In-memory store + sessionStorage backup for the `/my-shelf → /post/tag → /post/preview` post flow. Cleared after publish. Session-62 expanded `PostDraft` shape with optional tag-flow fields (`extractionRan`, `extractedTitle`, `extractedPrice`, `captionTitle`, `captionText`, `captionFailed`); `setImage()` is the image-only convenience used at `/my-shelf` entry, `set(PostDraft)` is the full-shape write used by `/post/tag` after the parallel extract-tag + post-caption calls settle. Read-side migration handles pre-session-62 entries (bare data: URL strings) silently.
- **`lib/safeStorage.ts`** — localStorage wrapper with sessionStorage + in-memory fallback. Use instead of raw `localStorage` in ecosystem client components (Safari ITP-safe). Known keys: `treehouse_auth_uid`, `treehouse_mode`, `treehouse_feed_scroll`, `treehouse_bookmark_<postId>`, `treehouse_last_viewed_post`, **`treehouse_active_vendor_id`** (session 35).
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

### v1.1+ primitives (current)

- **`<StickyMasthead>`** (v1.1l, session 24) — shared scroll-linked masthead chrome. Scroll-linked bottom hairline: transparent at rest, fades in past `scrollY > 4`. Accepts a `scrollTarget` ref for overflow-auto containers (Booth pages).
- **`<FeaturedBanner>`** (v1.1l, session 24) — admin-editable hero banner primitive. Two variants: **eyebrow** (Home "Featured Find") and **overlay** (Find Map "Find Map" title). Graceful collapse when `imageUrl` is null.
- **`<MallSheet>`** (v1.1i, session 21A) — bottom-sheet mall selector. Transform-free centering per session-21A fix. First consumer: Home feed. Pending migration to `/post`, `/post/preview`, `/vendor-request` (deferred as v1.1k (h)).
- **`<BoothPage>`** (v1.1h, session 18) — shared Booth primitive for `/my-shelf` and `/shelf/[slug]`. Banner as pure photograph with booth post-it pinned; vendor name as IM Fell 32px page title; pin-prefixed mall + address; Window View (3-col 4:5 grid) + Shelf View (horizontal 52vw/210px tiles with 22px first-tile left padding). Exports the `v1` + `fonts` symbols so Booth-consuming pages don't need to re-import from `lib/tokens.ts`.
- **`<BoothPickerSheet>`** (session 35, NEW) — bottom-sheet booth picker for multi-booth vendors. Inherits motion + chrome from `<MallSheet>`: backdrop fade 220ms, sheet y-slide 340ms, transform-free centering, handle pill, 22px horizontal padding, body-scroll lock while open. Booth name leads (IM Fell 17px), mall + booth number subtitle (FONT_SYS 13px). X-glyph per locked hierarchy (pin = mall, X = booth). Active row: paper-wash bg + green ✓. Dashed "+ Add another booth" CTA inside the sheet routes to `/vendor-request?email=<encoded>` so the vendor doesn't re-type. Only rendered when `vendorList.length > 1`; single-booth users never see it. **Placement note (Q-002 open):** the session-34 approved mockup put the masthead "Viewing · Name ▾" affordance in the center slot, but David's on-device session-35 walk called for moving it inline next to the IM Fell 28px booth name under the hero banner. Captured in `docs/queued-sessions.md`. This component itself stays — only its tap-target surface moves.
- **`<PostingAsBlock>`** (v1.2, session 29) — vendor attribution row on `/post/preview`.
- **`<PhotographPreview>`** (v1.2, session 29) — photo-truth renderer on `/post/preview` (no crop, paper fills letterbox).
- **`<AddFindSheet>`** (v1.2, session 29) — bottom sheet from `/my-shelf` for capture/library photo selection.
- **`<AmberNotice>`** (v1.2, session 29) — graceful-collapse amber inline notice for AI failures. Session 62 added two new contexts: "Couldn't read this tag…" (tag-extraction full failure) + "Couldn't read the price on the tag…" (soft notice when only price missing).
- **`<TagBadge>`** (session 62) — green-on-green inline pill (Lucide `Tag` glyph + italic IM Fell "from tag") used on `/post/preview` next to Title and Price field labels when those came from tag extraction. Variant α from `docs/mockups/add-find-with-tag-v1.html`. Could generalize for other "field source signal" cases (e.g. "from photo" / "from import") if future flows need them.
- **`<BottomNav>`** (v1.1l idle-color update) — minimal chrome: paperCream translucent bg + inkHairline border. Idle-tab color is `v1.inkMuted` (`#6b5538`). Takes an optional `flaggedCount?: number` prop that renders a saved-items badge on the Find Map heart icon. **Known gap (Q-003 open):** only `app/page.tsx` (Home) currently passes a real `flaggedCount` — `/my-shelf`, `/flagged`, and `/shelves` all render BottomNav with no count, so the badge defaults to 0 and is invisible on those pages. Two-line fix per page when Q-003 runs. Full Nav Shelf rework still deferred (Sprint 5).

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

### Multi-booth identity pattern (session 35)

For any surface that needs "which vendor is the signed-in user operating as right now":

1. Read list: `const vendors = await getVendorsByUserId(user.id);` — may return 0, 1, or N rows, ordered by `created_at ASC`.
2. Resolve active: `const active = resolveActiveBooth(vendors);` — reads `safeStorage.treehouse_active_vendor_id`, returns matching vendor or falls back to `vendors[0]` and rewrites storage.
3. Render against `active`. If `vendors.length > 1`, render the picker affordance alongside.

`/my-shelf` is the ONLY surface that renders the picker. `/post/preview` silently follows the active-booth selection — no picker mid-post-flow (single-path for the 99% case; minority vendors switch on `/my-shelf` first).

`/api/setup/lookup-vendor` is the server-side self-heal. On every `/my-shelf` load for non-admin users, both the direct DB read AND the lookup-vendor call run in parallel via `Promise.allSettled` and merge by vendor id — so newly-approved add-on booths get linked automatically on the vendor's next visit, with no sign-out/in cycle.

### Redirect-preservation pattern (session 5 + session-9 KI-003 unification)

- `lib/auth.ts:sendMagicLink(email, redirectTo?)` appends `redirectTo` as `&next=<encoded>`.
- `/login` reads BOTH `?redirect=` (approval email CTA) AND `?next=` (magic-link round trip) — `searchParams.get("redirect") ?? searchParams.get("next")`.
- `safeRedirect(next, fallback)` validates same-origin relative paths only. Rejects absolute URLs and protocol-relative (`//`) paths.

### Email pattern (session 8)

- `lib/email.ts` — Resend REST API wrapper. Best-effort delivery.
- `sendRequestReceived` — fires from `POST /api/vendor-request` after insert.
- `sendApprovalInstructions` — fires from `POST /api/admin/vendor-requests` after successful approve + vendor row creation.
- Functions return `{ ok, error? }` and NEVER throw. Callers log on `!ok` but return HTTP success if the underlying transaction succeeded.

### Vendor approval pattern (session 13 — KI-004; display_name priority session 32)

The `POST /api/admin/vendor-requests { action: "approve" }` handler performs pre-flight booth collision check before insert. Four branches:

- **Booth collision + unlinked + matching name** → safe claim (reuse existing row; link `user_id` later at `/setup` or `/my-shelf` self-heal)
- **Booth collision + unlinked + different name** → reject with named details (admin renames or cleans up)
- **Booth collision + already linked** → hard reject with named details
- **No booth collision** → insert normally

`display_name` is computed at approval time as the first non-empty of: `booth_name`, `first_name + ' ' + last_name`, legacy `name` (session 32). Slug collisions auto-resolve via suffix loop (`-2`, `-3`, … up to 20 attempts). All error responses include `diagnosis` code + `conflict` object for admin UI rendering. All recovery paths use `.maybeSingle()` (not `.single()`) so zero-row results return null rather than throwing "Cannot coerce...".

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

- **Paper as surface.** No card chrome. Paper *is* the container.
- **Cartographic pin + X.** Pin = mall (page-level anchor, appears once). X = booth (content-level, one per booth stop). Never swap or substitute. Locked session 17.
- **Booth post-it.** One skeuomorphic material gesture per find. Pinned with push pin, rotated `+6deg`, stacked "Booth Location" eyebrow. Cross-page primitive shared between Find Detail and Booth banner.
- **Captions as reflections.** Always in typographic quotation marks (“ ”), centered, italic IM Fell.
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
iconBubble    rgba(42,26,10,0.06)
green         #1e4d2b
red           #8b2020
redBg         rgba(139,32,32,0.07)
redBorder     rgba(139,32,32,0.18)
imageRadius   6px
bannerRadius  16px
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

---

## 10. User Flows

### Flow A — Shopper Browses (no auth)

1. `/` — scroll paper masonry, no prices
2. Tap tile → `/find/[id]` — full-bleed photo, title, availability, caption, shelf scroll, location card
3. Tap address → Apple Maps deep link
4. Tap saved heart → Find Map journal grows

### Flow B — Shopper Saves to Find Map

1. Saved finds accumulate via `localStorage.treehouse_bookmark_<postId>`
2. `/flagged` renders as a journal itinerary — overlay banner, pin + mall anchor, X-glyph spine, terminal closer
3. Saved-but-sold tiles render identically to available (three-part v1.1i sold contract)

### Flow C — Vendor Onboards (three committed sub-flows)

Full spec: `docs/onboarding-journey.md`.

- **Flow 1 — Pre-Seeded:** admin creates `vendors` row with `user_id=NULL`, no `vendor_requests`, no emails.
- **Flow 2 — Demo (in-person):** admin captures vendor on `/admin` → `vendor_requests` insert → Email #1 → admin approves same session → vendor row created `user_id=NULL` → Email #2 approval → vendor signs in → `/setup` or `/my-shelf` self-heal links → `/my-shelf`.
- **Flow 3 — Vendor-Initiated (remote, async):** vendor submits `/vendor-request` with booth-proof photo → Email #1 → admin approves later → Email #2 → same convergence as Flow 2 step 5 onward.

**Multi-booth onboarding (session 35):** A vendor who already owns one linked booth can submit additional `/vendor-request`s for different booths (same mall or different mall). Composite-key dedup blocks same-email+same-mall+same-booth+pending; anything else proceeds. Admin approves the new request(s); the second visit to `/my-shelf` links the new vendor row automatically via the self-heal. Picker appears when the count reaches > 1.

### Flow D — Vendor Posts a Find (session-62 shape)

1. `/my-shelf` — tap "Add a find" tile → `<AddFindSheet>` opens
2. Choose camera or library → `compressImage` → `postStore.setImage()` → router.push `/post/tag`
3. `/post/tag` — Frame 1 ready state shows the item photo + "Now the tag" / italic subhead "Capture the title and price in one shot." Two CTAs:
   - **"Take photo of tag"** (green primary) → camera input → tag photo captured → Frame 2 extracting state (both photos shown, "Pulling title and price…" pulse) → `Promise.all([POST /api/extract-tag (tag photo), POST /api/post-caption (item photo)])` fires in parallel → `postStore.set({ ...full PostDraft })` → router.replace `/post/preview`
   - **"Skip — I'll add title and price manually"** (italic underlined link) → `postStore.set({ ...draft, extractionRan: "skip" })` → router.replace `/post/preview`
4. `/post/preview` — branches on `postStore.extractionRan`. Tag flow reads pre-fetched fields and renders fully populated on first paint with `<TagBadge>` next to Title + Price labels (when populated from tag); skip flow keeps today's behavior (`POST /api/post-caption` on mount). `<AmberNotice>` surfaces for tag-fail (full or price-only) or caption-fail (skip flow). Identity resolves via `getVendorsByUserId + resolveActiveBooth` (session 35).
5. Publish — `uploadPostImageViaServer` (throws on failure; callers abort) → `createPost` → clear postStore → confirmation screen
6. Confirmation — "View my shelf" / "Visit us on Facebook" / "Add another find"

### Flow E — Reseller Intel (dark layer)

1. `/scan` → camera capture
2. `/discover` — `POST /api/identify` fires on mount
3. [optional] `/refine` — edit item name
4. `/decide` — enter cost → `GET /api/sold-comps` → pricing logic → verdict
5. Save → `/finds`

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

`POST /api/identify` — model `claude-opus-4-7`, max_tokens 400. Returns `{ title, description, confidence, searchQuery }`. Mock fallback: 8 deterministic items seeded by `imageDataUrl.length % 8`.

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
- **Dormant:** Cloudflare nameservers assigned but not authoritative. No cost, retire at leisure.

---

## 13. Known Constraints + Gotchas

### zsh / git

- `git add app/find/[id]/page.tsx` breaks (zsh glob-expands `[id]`). Always `git add -A`.
- `str_replace` container tool fails on bracket-path files. Use `filesystem:edit_file` or full `filesystem:write_file` rewrites.

### Next.js 14 App Router

- `export const dynamic = "force-dynamic"` required on every ecosystem page that imports `supabase` at module scope.
- `useSearchParams()` requires a `<Suspense>` boundary.
- Never `export const config = {}` — deprecated.
- **New `/api/*` route handlers MUST be wrapped with `Sentry.wrapRouteHandlerWithSentry` (session 65, R12)** — the `onRequestError` hook in `instrumentation.ts` is a Next.js 15 feature. On 14.x, framework-level error handling swallows route-handler throws before Sentry's auto-capture sees them. Pattern: `export const GET = Sentry.wrapRouteHandlerWithSentry(async () => {...}, { method: "GET", parameterizedRoute: "/api/your-route" });`. Existing routes are not yet wrapped (acceptable until Next.js 15 upgrade — Q-013 candidate).

### framer-motion

- Never two `transition` props on the same motion.div — merge them.
- `ease` arrays need `as const` — e.g. `[0.25, 0.46, 0.45, 0.94] as const`.
- Never apply centering transforms inline on a motion.div that animates `y` — use a non-animated wrapper (session-9 KI-002 pattern).

### Supabase

- RLS on `malls` / `vendors` / `posts` — 12 policies. Service-role bypasses for admin paths.
- RLS on `vendor_requests` — service-role only. Browser anon client returns empty silently.
- `site_settings` — RLS intentionally disabled (anon read, service-role write).
- Supabase access token needs ~500ms to be validatable after issue. `/setup` absorbs this with a one-retry + 800ms backoff.
- Supabase OTP Length (Auth → Providers → Email) must match the app's 6-digit input.
- Supabase's Magic Link + Confirm Signup email templates must BOTH include `{{ .Token }}` in a selectable `<code>` element.

### Safari / iPhone

- localStorage can be cleared between sessions (ITP). Use `safeStorage` wrapper.
- PWA magic-link return breaks session continuity — OTP 6-digit code is the primary path.

### Vercel

- Project scope: `david-6613s-projects` (NOT `zen-forged`).
- GitHub webhook unreliable → use `npx vercel --prod` if a push doesn't deploy.
- Env vars must be read inside function bodies in serverless routes.

### Tool environment

- **`filesystem:write_file`** is the only reliable way to write files from an MCP session.
- **`filesystem:edit_file`** is atomic per batch: if one `oldText` anchor misses, the whole batch rolls back. Box-drawing characters fail intermittently.
- **Half-migration audit (session 35 lesson):** when migrating a function's return from `T | null` to `T[]`, audit every caller's early-return for the assumption `result != null` equates to "fully resolved." Two short-circuit bugs in session 35 were this exact class; both got fixed in same-day follow-up commits. Tech Rule candidate queued in `docs/DECISION_GATE.md`.

---

## 14. Current Development State (2026-04-20, session 35)

### Working ✅

- Discovery feed (paper masonry + `<MallSheet>` + `<FeaturedBanner>` eyebrow + `<StickyMasthead>`)
- Magic link auth (6-digit OTP primary path)
- Admin PIN sign-in at `/admin/login`
- Magic link `?redirect=` + `?next=` preserved across round trip
- My Shelf (multi-booth aware, session 35), Public Shelf, Post flow v1.2, Find detail (v1.1d + 3B sold state), Public shelf
- Find Map (`/flagged`) v1.1g + v1.1l polish
- Vendor request flow v1.2 (session 32), vendor account setup, admin approval workflow (constraint-aware, session 13; display_name priority session 32)
- **Multi-booth vendor ownership (session 35)** — one auth user can own N vendor rows; `<BoothPickerSheet>` on `/my-shelf` when N > 1; post flow inherits active booth; self-heal via `/api/setup/lookup-vendor` picks up newly-approved booths on every visit
- **KI-006 resolved (session 35)** — Flow 3 vendors with `booth_name` set now link cleanly
- RLS — 12 policies + vendor_requests locked to service-role + site_settings intentionally public-read
- Rate limiting — `/api/post-caption` 10/60s, `/api/vendor-request` 3/10min, `/api/auth/admin-pin` 5/min
- Custom domain `app.kentuckytreehouse.com`
- Branded email templates (Magic Link + Confirm Signup)
- Transactional email receipt + approval via `lib/email.ts`
- Admin diagnostic UI (inline DiagnosisPanel, session 13)
- Admin-editable hero banners on Home + Find Map (v1.1l)
- Design system v1.1l
- Four active agents: Dev · Product · Docs · Design

### Resolved known issues

- KI-001 (admin PIN redirect) — session 9
- KI-002 (Framer Motion toast centering on `/admin`) — session 9
- KI-003 (stale identity post-approval) — session 9
- KI-004 (approve endpoint 23505 silent-reuse) — session 13
- KI-006 (`/api/setup/lookup-vendor` stale name join) — **session 35** (killed via multi-booth rework composite-key lookup)
- Session-23 `/admin/login` file orphan — session 25
- v1.1l `site_settings` migration applied — session 25

### Open — pre-beta tech work

- **Sprint 4 tail batch** (longest-parked pre-beta item):
  - T4c remainder — copy polish on `/api/setup/lookup-vendor` error + `/vendor-request` success screen
  - T4b — admin surface consolidation
  - T4d — pre-beta QA walk of all three onboarding flows end-to-end
- Test data cleanup — multiple "David Butler" variants in DB from testing
- Error monitoring (Sentry or structured logs)
- Feed content seeding (10–15 real posts before beta invite)
- Beta feedback mechanism (Tally.so link)

### Open — session 35 non-gating follow-ups (`docs/queued-sessions.md`)

- **Q-002** 🟢 — picker affordance placement revision. Move "Viewing · Name ▾" from masthead center slot to inline with the IM Fell 28px booth name under the hero banner. Also update the mockup (`docs/mockups/my-shelf-multi-booth-v1.html`). Non-gating.
- **Q-003** 🟢 — `<BottomNav>` `flaggedCount` prop missing on `/my-shelf`, `/flagged`, `/shelves`. Two-line fix per page, reference implementation in `app/page.tsx`. Non-gating. Natural batch-mate with Q-002.

### Open — Sprint 5 + design follow-ons

- `<MallSheet>` migration to `/post/preview`, `/vendor-request` (mechanical work against committed primitive)
- Nav Shelf decision + BottomNav full chrome rework
- Guest-user UX: "Sign in" → "Curator Sign In" rename, `/welcome` guest landing, PWA install onboarding, bookmarks persistence (localStorage → DB-backed), vendor onboarding Loom, KI-005 pre-approval sign-in signaling
- Tech Rule promotion batch: (a) session-33 "dependent-surface audit when changing a field's semantic source" candidate, (b) session-35 "half-migration audit when changing return-shape cardinality" candidate. Both queued in `docs/DECISION_GATE.md`.

### Parked (Sprint 6+)

- "Claim this booth" for Flow 1 pre-seeded vendors
- QR-code approval handshake
- Universal Links
- Native app evaluation
- Feed pagination, search, ToS/privacy
- Option B `vendor_memberships` migration (if/when co-ownership becomes a real roadmap item — multi-vendor-per-booth rather than multi-booth-per-vendor)

### Cleanup (not urgent)

- Deprecated functions in `lib/posts.ts` (including session-35 `getVendorByUserId` shim — remove after one full session passes with no `console.warn` hits during QA)
- Cloudflare nameservers (dormant)
- `/shelves` `AddBoothSheet` (orphan after T4b)
- `docs/VENDOR_SETUP_EMAIL_TEMPLATE.md` (obsolete since T4a)
- Retired v0.2 components (grep for stale imports)
- `components/ShelfGrid.tsx` (parked; zero current callers)
- Historical mockup HTML files in `docs/mockups/` — retire once on-device QA confirms their versions

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
| Multi-booth vendor ownership | ✅ session 35 |
| Supabase Auth magic link + OTP | ✅ 6-digit code primary |
| Custom domain | ✅ `app.kentuckytreehouse.com` |
| Transactional emails (receipt + approval) | ✅ via Resend REST |
| Admin-editable hero banners | ✅ v1.1l |
| Dedicated `/admin/login` | ✅ v1.1k |
| Supabase RLS | ✅ 12 policies |
| v1.2 post-flow trilogy (AddFindSheet + Review + Edit Listing) | ✅ session 29 |
| `<MallSheet>` migration to remaining consumers | 🔄 Sprint 5 |
| "Curator Sign In" rename + `/welcome` | 🔲 Sprint 5 |
| PWA / offline mode | 🔲 Sprint 5 |
| Error monitoring | 🔲 Sprint 4 tail / 5 |
| "Claim this booth" flow | 🔲 Sprint 6+ |
| Option B `vendor_memberships` (co-ownership) | 🔲 Sprint 6+ |
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
- `docs/DECISION_GATE.md` is the operating constitution.

**Related canonical docs:**

| File | Purpose |
|---|---|
| `docs/design-system.md` | Canonical visual + interaction system — v1.1l. Owned by Design agent. |
| `docs/onboarding-journey.md` | Canonical vendor onboarding spec — three flows. |
| `docs/admin-runbook.md` | 9-recipe SQL triage guide for in-mall use. |
| `docs/known-issues.md` | Active bugs + deferred items + resolved history. |
| `docs/queued-sessions.md` | Scoped-but-sequenced work awaiting promotion. |
| `docs/multi-booth-build-spec.md` | Dev handoff for session 35. Archived reference after shipping. |
| `docs/decision-log.md` | Architectural decisions + rationale (create when first decision is logged). |
| `MASTER_PROMPT.md` | Session structure + phase gating + HITL indicator standard. |
| `SPRINT_PLAN.md` | Sprint-level feature roadmap. |

**Production debugging:**

```bash
curl -s https://app.kentuckytreehouse.com/api/debug | python3 -m json.tool
npm run build 2>&1 | tail -30
npx vercel --prod
git add -A && git commit -m "..." && git push
```

---
> This document is the architecture reference for the Treehouse Finds system.
> It is maintained by the Docs agent and reviewed by David at each sprint boundary.
> Last updated: 2026-04-21 (session 39 — Q-004 rename sweep + Q-005 email tagline shortening).
