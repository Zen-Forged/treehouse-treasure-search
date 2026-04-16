## HOW TO START A NEW SESSION

1. Run `th` in Terminal — reads CLAUDE.md and copies to clipboard
2. Open claude.ai → New conversation
3. Paste the opener below, fill in CURRENT ISSUE from clipboard

```
PROJECT: Treehouse — Zen-Forged/treehouse-treasure-search — treehouse-treasure-search.vercel.app
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE:
[paste here]
```

## HOW TO END A SESSION

Tell Claude: "close out the session" then run `thc`

---

## TERMINAL COMMAND FORMATTING CONVENTION
> Whenever Claude surfaces multiple terminal commands that must be run in sequence, they MUST be broken out into separate code blocks — one command per block. This lets David copy each command individually without accidentally running the next one before verifying the previous succeeded. Applies to deploy checklists, QA sequences, debug scripts, and HITL steps.

**Do this:**

```bash
npm run build 2>&1 | tail -30
```

```bash
git add -A && git commit -m "..." && git push
```

```bash
npx vercel --prod
```

**Not this:**

```bash
npm run build 2>&1 | tail -30
git add -A && git commit -m "..." && git push
npx vercel --prod
```

Exception: A single chained command with `&&` stays in one block (that's one atomic action by design).

---

## CURRENT ISSUE
> Last updated: 2026-04-16

**Status:** Vendor-request admin + setup flows fully routed through server API with admin gating. Ready to deploy and QA on device.

---

## What was done (this session)
> 2026-04-16 — RLS-blocked vendor-request flow fix + admin API hardening

### **THE BUG**
Admin "Vendor Requests" tab rendered but showed zero rows from Supabase. Root cause: `vendor_requests` has a service-role-only RLS policy (`USING (false) WITH CHECK (false)`). The three new functions in `lib/posts.ts` (`getVendorRequests`, `markVendorRequestApproved`, `getVendorByEmail`) all used the browser anon client, which RLS silently blocked — returning empty arrays with no error. The `/setup` flow was broken the same way.

Pre-existing companion bug surfaced during triage: `/api/admin/posts` had NO server-side auth check — UI gating was the only gate, meaning any authenticated user could hit it and wipe production.

### **ARCHITECTURAL DECISION COMMITTED**
**[DECISION]** Ecosystem tables with service-role-only RLS (like `vendor_requests`) are accessed via server API routes using the service role key. The browser anon client is read-only for ecosystem data. All admin writes go through `/api/admin/*` with `requireAdmin`. Captured in `docs/DECISION_GATE.md` Tech Rules.

### **IMPLEMENTATION COMPLETED**

**Task 1 — Server auth helper** ✅
**[CODE]** Created `/lib/adminAuth.ts`:
- `getServiceClient()`: returns service-role Supabase client or null
- `requireAuth(req)`: validates `Authorization: Bearer <token>` header via `service.auth.getUser(token)`
- `requireAdmin(req)`: `requireAuth` + email match against `NEXT_PUBLIC_ADMIN_EMAIL`
- Returns `{ ok: true, user, service }` or `{ ok: false, response }` — caller returns the response directly

**Task 1b — Client auth-fetch wrapper** ✅
**[CODE]** Created `/lib/authFetch.ts`:
- Reads current Supabase session, attaches `Authorization: Bearer <access_token>`
- Auto-sets `Content-Type: application/json` when body is present
- Drop-in replacement for `fetch()` in admin/setup components

**Task 2 — Admin vendor-requests API** ✅
**[DOCUMENT]** Created `/app/api/admin/vendor-requests/route.ts`:
- `GET` → lists all vendor_requests (newest first, limit 50)
- `POST { action: "approve", requestId }` → fetches request, creates vendor (with 23505 dup recovery), marks request approved — all in one call
- Both gated by `requireAdmin(req)`
- Returns `{ ok, vendor, warning? }` on approve

**Task 3 — Setup lookup-vendor API** ✅
**[DOCUMENT]** Created `/app/api/setup/lookup-vendor/route.ts`:
- Gated by `requireAuth(req)` (any signed-in user)
- Looks up pending vendor_request by user's email
- Finds matching unlinked vendor row (display_name + mall_id, user_id IS NULL)
- Links `user_id` with race-safe `.is("user_id", null)` guard
- Fallback: if already linked, returns existing vendor with `alreadyLinked: true`

**Task 4 — Admin page migration** ✅
**[DOCUMENT]** Rewrote `/app/admin/page.tsx`:
- Dropped imports from `lib/posts.ts` for vendor-request functions
- All data access via `authFetch()` to `/api/admin/*`
- Approve flow collapsed from 3 calls (create + mark + refresh) to 1 call (POST action=approve)
- Posts tab also migrated to `authFetch`

**Task 5 — Setup page migration** ✅
**[DOCUMENT]** Rewrote `/app/setup/page.tsx`:
- Dropped imports of `getVendorByEmail` + `linkVendorToUser`
- Single `authFetch("/api/setup/lookup-vendor", POST)` call replaces the two-step anon-client flow
- All UI states preserved (loading / linking / success / error)

**Task 6 — Admin posts route hardening** ✅
**[CODE]** Rewrote `/app/api/admin/posts/route.ts`:
- Added `requireAdmin(req)` as first line of both GET and DELETE
- Switched from anon client to service role via `auth.service` (RLS-proof for future schema tightening)
- Closes pre-existing direct-API hole

**Task 7 — Library deprecations** ✅
**[CODE]** Updated `/lib/posts.ts`:
- Five functions marked `@deprecated` with JSDoc pointing to replacement API routes:
  - `getVendorByEmail` → `POST /api/setup/lookup-vendor`
  - `linkVendorToUser` → `POST /api/setup/lookup-vendor`
  - `getVendorRequests` → `GET /api/admin/vendor-requests`
  - `createVendorFromRequest` → `POST /api/admin/vendor-requests { action: "approve" }`
  - `markVendorRequestApproved` → `POST /api/admin/vendor-requests { action: "approve" }`
- Left functions in place for now — scheduled for removal in a future sprint once confirmed no third callers

**Task 8 — DECISION_GATE updates** ✅
**[DOCUMENT]** Updated `docs/DECISION_GATE.md`:
- Two new entries in Tech Rules block: service-role-only tables must use server API; admin routes must call `requireAdmin` server-side
- Two new 🔴 High risks marked Resolved 2026-04-16 in Risk Register
- Two new 🟢 Low open items tracked (deprecated lib functions, `/api/debug-vendor-requests`)
- Register "Updated" and footer "Last updated" bumped to 2026-04-16

### **FILES MODIFIED / CREATED**
- `lib/adminAuth.ts` (new)
- `lib/authFetch.ts` (new)
- `lib/posts.ts` (deprecation annotations)
- `app/api/admin/vendor-requests/route.ts` (new)
- `app/api/setup/lookup-vendor/route.ts` (new)
- `app/api/admin/posts/route.ts` (hardened)
- `app/admin/page.tsx` (migrated to authFetch)
- `app/setup/page.tsx` (migrated to authFetch)
- `docs/DECISION_GATE.md` (Tech Rules + Risk Register)

### **AUTH PATTERN LOCKED IN (Option B)**
- Client: `lib/authFetch.ts` reads Supabase session, adds `Authorization: Bearer <access_token>`
- Server: `lib/adminAuth.ts` extracts bearer, validates with `service.auth.getUser(token)`, checks admin email
- No `@supabase/ssr`, no cookie bridge — zero new deps

### **PENDING ACTIONS**
🖐️ **HITL** — Run build check:

```bash
cd ~/Projects/treehouse-treasure-search && npm run build 2>&1 | tail -30
```

🖐️ **HITL** — Commit and push:

```bash
git add -A && git commit -m "fix: route vendor-request admin + setup flows through server API with admin gating" && git push
```

🖐️ **HITL** — If Vercel webhook doesn't fire within ~60s:

```bash
npx vercel --prod
```

🖐️ **HITL** — Confirm Vercel env vars are set (should both already be set per STACK docs):
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_ADMIN_EMAIL`

🖐️ **HITL** — On-device QA:
1. `/admin` → Vendor Requests tab should show real pending requests from Supabase
2. Approve a test request → one call should create vendor + flip status to `approved` + copy email template to clipboard
3. Sign in as the approved vendor → `/setup` → auto-links → redirects to `/my-shelf`
4. Incognito window, not signed in, hit `https://treehouse-treasure-search.vercel.app/api/admin/posts` → expect **401**
5. Sign in as non-admin user, hit same URL → expect **403**

---

## Next session starting point — Sprint 3 (continued)

### Priority 1 — Error monitoring (S effort, High value, 🟢 Proceed)
- Add structured `console.error` wrapping to all API routes (pattern already exists in `/api/vendor-request/route.ts` — generalize)
- Evaluate Sentry free tier vs Vercel function logs
- Now more valuable than ever with the new API surface area

### Priority 2 — Vendor bio field UI (M effort, High value, 🟢 Proceed)
- `bio` column exists in DB + is fetched, no UI to set or display
- Inline tap-to-edit on My Booth hero; display on public `/shelf/[slug]`
- `updateVendorBio()` already exists in `lib/posts.ts`

### Priority 3 — Admin PIN production QA (S effort, Medium value, 🟢 Proceed)
- Confirm `ADMIN_PIN` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel env
- Test full admin PIN flow on production URL
- Also verify QA from this sprint's deploy (vendor-request end-to-end)

### Priority 4 — Mall page vendor CTA (S effort, deferred from last sprint)
- `app/mall/[slug]/page.tsx` uses dark reseller palette — CTA needs dark theme styling
- Pass `?mall_id=&mall_name=` to pre-fill the vendor request form

### Priority 5 — Find Map overhaul (L effort, High value, 🖐️ REVIEW before starting)
- Group saved finds by mall, per-mall route segments
- Plan required before any code

### Cleanup items surfaced this session
- Remove deprecated vendor-request functions from `lib/posts.ts` once confirmed no other callers
- Remove `/api/debug-vendor-requests` route (useful for QA right now, retire after)

### Sprint 4 (not started)
- Resend email for vendor request notifications
- Feed pagination / infinite scroll
- Search
- Terms of service / privacy policy
- Bookmarks persistence (Supabase)

---

## INVESTOR UPDATE SYSTEM
- **Google Drive folder:** https://drive.google.com/drive/folders/1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW
- **Folder ID:** `1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW`
- **Cadence:** End of each sprint (weekly once beta launches)
- **Trigger:** Say "generate investor update" at session close
- **Process doc:** Notion → Agent System Operating Manual → 📋 Investor Update — Process & Cadence

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
NEXT_PUBLIC_DEV_VENDOR_EMAIL     vendor@test.com (optional)
ANTHROPIC_API_KEY                Claude Vision + caption generation
SERPAPI_KEY                      eBay sold comps
ADMIN_PIN                        Server-only PIN for admin login
SUPABASE_SERVICE_ROLE_KEY        Server-only service role key (REQUIRED for /api/admin/* + /api/setup/* + /api/vendor-request)
EBAY_CLIENT_ID                   eBay direct API (not yet wired)
EBAY_CLIENT_SECRET               eBay direct API (not yet wired)
```

---

## SUPABASE
- **Tables:** malls, vendors, posts, vendor_requests — RLS ENABLED ✅
- **vendor_requests:** id, name, email, booth_number, mall_id, mall_name, status, created_at ✅
- **vendor_requests RLS:** service-role-only (`USING (false) WITH CHECK (false)`) — must be accessed via `/api/*` routes
- **Storage bucket:** post-images — PUBLIC
- **Auth:** Magic link (OTP) via email — `supabase.auth.signInWithOtp()`
- **Malls:** 29 locations seeded (KY + Clarksville IN)
- **Primary mall:** America's Antique Mall, id: `19a8ff7e-cb45-491f-9451-878e2dde5bf4`, slug: `americas-antique-mall`
- **Known vendors:**
  - ZenForged Finds, booth 369, id: `65a879f1-c43c-481b-974f-379792a36db8` — user_id SET ✅
  - Zen booth (admin default), id: `5619b4bf-3d05-4843-8ee1-e8b747fc2d81`
- **Extra columns vendors:** `facebook_url text`, `user_id uuid`, `hero_image_url text`, `bio text`
- **Unique constraint vendors:** `vendors_mall_booth_unique` on `(mall_id, booth_number)`
- **Unique constraint malls:** `malls_slug_key` on `(slug)`

---

## AUTH & SERVER API PATTERN

**Client → Server auth bridge (Option B — bearer header):**
- Client: import `authFetch` from `@/lib/authFetch` instead of calling `fetch()` directly to any gated route
- Server: first line of every `/api/admin/*` handler must be `const auth = await requireAdmin(req); if (!auth.ok) return auth.response;`
- For auth-required-but-not-admin routes (like `/api/setup/*`), use `requireAuth()` instead

**Gated routes:**
- `GET /api/admin/posts` — requireAdmin
- `DELETE /api/admin/posts` — requireAdmin
- `GET /api/admin/vendor-requests` — requireAdmin
- `POST /api/admin/vendor-requests` — requireAdmin (action="approve")
- `POST /api/setup/lookup-vendor` — requireAuth

**Ungated routes (by design):**
- `POST /api/vendor-request` — public submission (rate-limited 3/10min per IP)
- `POST /api/post-caption` — rate-limited 10/60s per IP
- `GET /api/debug`, `GET /api/debug-vendor-requests` — diagnostic (remove later)

---

## WORKING ✅
- Discovery feed — masonry, scroll restore, spring-tap, warmth hover, back-nav anchor
- Feed footer — vendor CTA "Request booth access →" → `/vendor-request`
- Magic link auth + Admin PIN login
- My Booth — hero upload, vendor switcher, Send icon
- Post flow — AI caption, price validation, image upload
- Post preview — full image (no crop), edit pill buttons on title/caption/price
- Find detail — layered drift-in, booth LEFT / mall RIGHT, no address underline
- Public shelf — share button always visible (no auth required)
- Vendor request flow — `/vendor-request` form + success screen + API route
- **Vendor account setup** — admin approval workflow, setup page, email templates ✅
- **Vendor-request admin + setup now routed through server API with admin gating** ✅ (2026-04-16)
- **`/api/admin/*` server-side admin check via `requireAdmin`** ✅ (2026-04-16)
- RLS — 12 policies + vendor_requests (service role only) ✅
- Rate limiting — `/api/post-caption` 10 req/60s, `/api/vendor-request` 3 req/10min ✅
- PWA manifest ✅
- `.env.example` — all required vars documented ✅
- Session Control Panel (Notion) ✅
- Shell aliases `th` / `thc` ✅
- MASTER_PROMPT.md — HITL standard + Product Agent + Blocker Protocol ✅
- Notion Roadmap — seeded ✅
- Investor update system — Drive folder + first PDF + Notion process doc ✅

## KNOWN GAPS / SPRINT 3 ⚠️
- No error monitoring — Priority 1
- Vendor bio field — no UI — Priority 2
- Admin PIN not QA'd in production — Priority 3
- Mall page vendor CTA — deferred (dark theme) — Priority 4
- Find Map overhaul — needs plan — Priority 5
- Deprecated vendor-request functions still in `lib/posts.ts` — cleanup later
- `/api/debug-vendor-requests` still in production — useful for QA now, retire later
- Feed content seeding before beta invite (Sprint 4)
- No pagination/infinite scroll (Sprint 4)
- No search (Sprint 4)
- No terms of service / privacy policy (Sprint 4)

---

## DEBUGGING

Run one at a time:

```bash
curl -s https://treehouse-treasure-search.vercel.app/api/debug | python3 -m json.tool
```

```bash
curl -s https://treehouse-treasure-search.vercel.app/api/debug-vendor-requests | python3 -m json.tool
```

```bash
npm run build 2>&1 | tail -30
```

```bash
npx vercel --prod
```

```bash
mkdir -p app/api/your-route-name
```

Commit and push (atomic, keep chained):

```bash
git add -A && git commit -m "..." && git push
```
