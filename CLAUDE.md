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
> Last updated: 2026-04-17 late PM (session 5 — emailRedirectTo hardcode FIXED, end-to-end vendor onboarding verified, Sprint 4+ roadmap scoped)

**Status:** ✅ **Magic link `redirect` param now preserved across the round trip.** Full vendor onboarding was verified end-to-end this session: new email → magic link → `/setup` → waits for admin approval → admin approves in `/admin` → vendor redirected to `/my-shelf` → post flow shows correct booth/vendor context. Additionally, major strategic scoping work completed for Sprint 4 (beta-readiness), Sprint 5 (guest-user UX + onboarding polish), and Sprint 6+ (distribution / native). No remaining pre-beta blockers.

---

## What was done (this session — 2026-04-17 late PM)
> One code fix + two strategic conversations that reshape the Sprint 4+ roadmap

### Code change — `emailRedirectTo` no longer loses `/setup` across the magic-link round trip

Small surgical patch across two files. The bug: `sendMagicLink()` hardcoded `emailRedirectTo` to `/login?confirmed=1`, so any user arriving at `/login?redirect=/setup` would authenticate but lose the `/setup` destination. Workaround had been: navigate to `/setup` manually post-auth.

**Fix:**
- `lib/auth.ts` — `sendMagicLink(email, redirectTo?)` now accepts optional second arg. When provided, it's URL-encoded and appended as `&next=...` to the confirmation URL.
- `app/login/page.tsx` — new `safeRedirect(next, fallback)` helper validates same-origin relative paths only (rejects absolute URLs, rejects protocol-relative `//evil.com`, falls back to `/my-shelf`). The confirmed-loop, already-signed-in shortcut, `onAuthChange` callback, and BroadcastChannel handler all honor `?next=` when present. PIN flow untouched — still goes straight to `/my-shelf`.
- `handleSend()` reads `searchParams.get("redirect")` and passes through to `sendMagicLink`.

**Verified end-to-end:** David used a new test email, landed on `/setup`, saw "waiting for admin approval" state (expected — new email, not yet approved), approved the request from `/admin`, watched the vendor's screen flip to approved, got redirected to `/my-shelf`, confirmed post flow rendered correct booth/vendor context. Full first-time vendor onboarding journey now works without any manual nav step.

### Strategic scoping — Sprint 4/5/6 roadmap reshape

Two product conversations produced concrete sprint items:

#### Topic A — The "Sign In" button is mislabeled for its audience

Any shopper can click "Sign In" today, get a magic link, authenticate, and land on `/my-shelf` with no vendor profile — dead end, confusing. Treehouse's vision explicitly treats buyers as unauthenticated ("Follow the Find" is localStorage-only). **Decision: Option B — add a friendly guest-facing redirect** (`/welcome` landing for signed-in non-vendors with warm "still curator-only" copy + "Request a booth" CTA). Rename "Sign In" → "Curator Sign In" everywhere. **Filed: Sprint 5.**

Rationale: Option A (rename + rely on copy) leaks confusion. Option C (real guest accounts) crosses a 🔴 STOP Decision Gate threshold — contradicts "not a marketplace" vision. Option B converts the accidental sign-in into a brand moment.

#### Topic B — PWA install + magic link both break the "feels like an app" illusion

The Vercel PWA loses its session every time a user taps a magic link (email opens in Safari → sign-in happens in Safari → PWA has no shared session). This is a platform constraint, not a bug.

**Decision: switch to OTP 6-digit code entry** for auth (magic link stays as fallback). User reads code from Mail, switches back to PWA, types code — entire flow stays in home-screen app. **Filed: Sprint 4.** This is the single biggest UX unlock for PWA usage.

Related decisions:
- **Custom domain — `kentuckytreehouse.com` → Vercel.** Filed: Sprint 4. Quick 15-min perception win; should happen before any beta invites.
- **PWA install onboarding experience** (iOS/Android-aware install prompts, animated walkthrough). Filed: Sprint 5.
- **Native app evaluation.** Filed: Sprint 6+ (post-product-market-fit decision).

#### Topic C — In-person vendor onboarding flow

David will onboard the first ~5 vendors in person, meeting them at the mall to walk through install + first post. David is a reseller (online, not mall booth) — meeting vendors in person is a deliberate scheduled onboarding session, not incidental.

**Decision: admin approval stays on `/admin`, not `/my-shelf`.** Keeps admin-vs-vendor role separation clean (Decision Gate flags this: "Zen Forged LLC is the operator — conflicts of interest between owner and user views should be flagged").

**Sprint 4 scope for `/admin` mobile-first approval view:**
- Existing bones are solid: tab-switcher with pending-count badge, per-row Approve button, refresh. Work is tightening for the in-person mobile moment.
- Remove the "copy email template" workflow — obsolete once Resend-based magic link delivery ships and OTP entry lands. Current flow has admin copy-pasting a template manually; that's vestigial from pre-SMTP days.
- Add explicit "just approved — vendor has been emailed" confirmation toast. Long enough to verbally confirm with the person standing in front of you.
- Poll or manual-refresh for new pending requests (beta volume is single-digits/day — no WebSocket needed).

**Sprint 4 scope for `/vendor-request` + post-submission experience:**
- The current `/vendor-request` success screen says "We'll review your request and be in touch soon." For in-person moment, want real-time status flip when admin approves — or at minimum an alternative success screen variant that says "David is approving this now — hold tight."
- Consider a `/vendor-request/pending` state that auto-redirects to `/setup` (or `/my-shelf`) once the request is approved. Could poll a new ungated `/api/vendor-request/status?id=...` endpoint that returns `{ status: "pending" | "approved" }` keyed on request ID.

**Sprint 5 scope (non-in-person fallback):**
- Vendor onboarding Loom/doc — for when David isn't physically there. Not code, but a deliverable.

### Files modified this session
- `lib/auth.ts` — `sendMagicLink` accepts optional `redirectTo` param
- `app/login/page.tsx` — `safeRedirect` helper + forwards `?redirect=` to `sendMagicLink` + honors `?next=` post-auth
- `CLAUDE.md` (this file)
- `docs/DECISION_GATE.md` — Risk Register updates + Sprint Context update

---

## Next session starting point — Sprint 4 kickoff

**Sprint 4 theme: "beta-readiness."** The goal is: end of Sprint 4, David can confidently onboard the first ~5 vendors in person at the mall in under 10 minutes each, and the app feels real (custom domain, OTP in-PWA auth, polished admin approval moment).

### Sprint 4 items (in recommended execution order)

**🟢 T1 — Custom domain.** Point `kentuckytreehouse.com` (or `app.kentuckytreehouse.com` — tbd) to the Vercel deployment. Decide subdomain vs root based on whether root is serving any Shopify storefront content. Est. 15 min.

**🟡 T2 — Switch magic link flow to OTP code entry.** New screen after "enter email": "Enter the 6-digit code we sent to [email]." `supabase.auth.verifyOtp({ email, token, type: "email" })` — same primitive as PIN flow uses. Keep the magic link clickable as a fallback. Honor `?redirect=` param end-to-end. Est. 3–4 hours including design + test.

**🟡 T3 — `/admin` mobile-first approval polish.** Remove copy-paste email template workflow (dead code). Tighten approve button for thumb-reach. Post-approval toast with vendor details long enough to verbally confirm with in-person person. Consider prominent top-of-page "N pending" banner when pending > 0. Est. 2 hours.

**🟡 T4 — `/vendor-request` → in-person pending state.** Success screen: new variant OR real-time poll for approval. If approved, auto-redirect to `/setup` (which then links vendor and redirects to `/my-shelf`). This is the "magic moment" of in-person onboarding — design it as a product moment. Est. 2–3 hours.

**🟢 T5 — Finish Sprint 3 leftovers before beta invites:**
- Error monitoring (P1)
- Vendor bio UI (P2)
- Admin PIN production QA (P3 — quick curl)
- Branded Supabase email template (reputation polish)

**Out of scope for Sprint 4** (deferred to Sprint 5):
- Rename "Sign In" → "Curator Sign In" everywhere
- `/welcome` landing for signed-in non-vendors
- PWA install onboarding experience (animated walkthrough)
- Vendor onboarding Loom/doc
- Mall page vendor CTA, Find Map overhaul

### Skipped this session (explicit)
- "No-redirect baseline" sanity test (sign out → `/login` → Yahoo → lands `/my-shelf`). Low risk, skipped by decision. If future behavior seems off on base-case sign-in, this is the first thing to re-verify.

### Sprint 5 (parked, ordered for posterity)
1. 🟡 Rename "Sign In" → "Curator Sign In" + `/welcome` guest-friendly landing (Option B)
2. 🟡 PWA install onboarding (iOS/Android-aware prompts, animated walkthrough)
3. 🟡 Vendor onboarding Loom/doc (non-in-person fallback)
4. 🟡 Bookmarks persistence (Sprint 4 from old planning — moved; localStorage-only still fine for in-person beta)

### Sprint 6+ (parked)
- QR-code approval handshake (vendor shows admin a QR on `/vendor-request` success → admin scans → one-tap approve)
- Universal Links setup (iOS `apple-app-site-association`)
- Native app evaluation
- Feed pagination, search, ToS/privacy, `admin-cleanup` tool

---

## ARCHIVE — What was done earlier (2026-04-17 early AM, session 4)
> DNS pivot + Resend SMTP + Yahoo magic link verification

Session 4 opened assuming DNS was split Google Cloud DNS / Cloudflare pending swap. Discovery: Shopify was actually authoritative. Pivoted from Path B (Cloudflare migration) to Path A (add Resend DNS records directly in Shopify DNS UI — 3 records, resolved in ~2 min). Resend→Supabase native SMTP integration configured. End-to-end Yahoo magic link test passed (email delivered to junk folder, acceptable for new sending domain). Small data recovery mid-session after accidentally deleting a `vendor_requests` row — recovered via subquery-based re-insert.

---

## ARCHIVE — Session 3 (2026-04-16 late PM)
> Resend account setup + DNS migration decision (later reversed in session 4)

Created Resend account, added domain, generated DNS records, chose Path B (Cloudflare migration) based on the incorrect premise that DNS lived at Google Cloud DNS. Session 4 corrected this. Cloudflare nameservers remain assigned but not authoritative — dormant at no cost.

---

## ARCHIVE — Session 2 (2026-04-16 PM)
> Setup flow status-filter bug fix — verified end-to-end in session 4

`/setup` rejected approved vendors because `lookup-vendor` filtered `vendor_requests` with `.eq("status", "pending")`. Rewrote to `.neq("status", "rejected")`; vendor row existence (with `user_id IS NULL`) is the real gate. Verified end-to-end in session 4.

---

## ARCHIVE — Session 1 (2026-04-16 AM)
> RLS-blocked vendor-request flow fix + admin API hardening

`vendor_requests` has service-role-only RLS; three functions in `lib/posts.ts` were using browser anon client which RLS silently blocked. Pre-existing companion bug: `/api/admin/posts` had no server-side auth check. Moved ecosystem-tables-with-service-role-only-RLS access to server API routes using service role + `requireAdmin`. Captured in `docs/DECISION_GATE.md` Tech Rules.

Files created: `lib/adminAuth.ts`, `lib/authFetch.ts`, `app/api/admin/vendor-requests/route.ts`, `app/api/setup/lookup-vendor/route.ts`. Files hardened: `app/api/admin/posts/route.ts`. Files migrated: `app/admin/page.tsx`, `app/setup/page.tsx`. `lib/posts.ts` — five functions marked `@deprecated`.

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

**Operator note:** David Butler is an **online reseller** (Zen Forged LLC, ZenForged Finds online sales). He is not a physical storefront operator at any mall. In-person vendor onboarding sessions are deliberate scheduled meetups, not incidental. This matters for scoping — "in person" is a product choice, not a default.

---

## STACK
```
Next.js 14 App Router · TypeScript · Tailwind CSS · Framer Motion
Anthropic SDK (claude-opus-4-5) · Supabase (Postgres + Storage + Auth) · SerpAPI · Vercel
lucide-react (Heart, Send, Store, Home, LayoutGrid icons in ecosystem UI)
Resend (SMTP provider for Supabase Auth magic links, via native Resend→Supabase integration)
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

**SMTP note:** Resend SMTP credentials are NOT stored as Vercel env vars. They live in Supabase Auth → SMTP Settings (configured via Resend's native integration 2026-04-17). The Vercel app itself does not send mail — Supabase does.

---

## DNS STATE (as of 2026-04-17)

**Registrar:** Squarespace Domains (inherited from Google Domains acquisition in 2023)
**Authoritative nameservers:** Shopify's default nameservers (Shopify manages DNS)
**DNSSEC:** Off

**Live records (via Shopify DNS):**
- A `kentuckytreehouse.com` → `23.227.38.65` (Shopify)
- AAAA `kentuckytreehouse.com` → `2620:0127:f00f:5::` (Shopify IPv6)
- CNAME `www` → `shops.myshopify.com`
- CNAME `account` → `shops.myshopify.com`
- CNAME `h3f._domainkey` → `dkim1.fa0cb6bc6910.p371.email.myshopify.com` (Shopify DKIM 1)
- CNAME `h3f2._domainkey` → `dkim2.fa0cb6bc6910.p371.email.myshopify.com` (Shopify DKIM 2)
- CNAME `h3f3._domainkey` → `dkim3.fa0cb6bc6910.p371.email.myshopify.com` (Shopify DKIM 3)
- CNAME `mailerh3f` → `fa0cb6bc6910.p371.email.myshopify.com` (Shopify mail routing)
- MX `@` → `mx.kentuckytreehouse.com.cust.b.hostedemail.com` priority 1 (inbound via HostedEmail)
- TXT `_provider` → `shopify`
- TXT `_dmarc` → `v=DMARC1; p=none`
- TXT `@` → `v=spf1 include:_spf.hostedemail.com ~all` (root SPF for inbound)
- TXT `resend._domainkey` → `v=DKIM1; k=rsa; p=MIGfMA0G...` (Resend DKIM, added 2026-04-17)
- TXT `send` → `v=spf1 include:amazonses.com ~all` (Resend SPF for `send` subdomain, added 2026-04-17)
- MX `send` → `feedback-smtp.us-east-1.amazonses.com` priority 10 (Resend MX for `send` subdomain, added 2026-04-17)

**Sprint 4 — custom domain for Vercel:** Needs decision — root `kentuckytreehouse.com` (conflicts with Shopify storefront if one exists) vs subdomain `app.kentuckytreehouse.com` (clean, no conflict). Likely subdomain.

**Dormant:** Cloudflare account has nameservers assigned (`marissa.ns.cloudflare.com`, `vin.ns.cloudflare.com`) but is not authoritative. Leftover from session 3's Path B plan. No cost to leaving it in place. Delete or reuse at your discretion.

---

## SUPABASE
- **Tables:** malls, vendors, posts, vendor_requests — RLS ENABLED ✅
- **vendor_requests:** id, name, email, booth_number, mall_id, mall_name, status, created_at ✅
- **vendor_requests RLS:** service-role-only (`USING (false) WITH CHECK (false)`) — must be accessed via `/api/*` routes
- **Storage bucket:** post-images — PUBLIC
- **Auth:** Magic link (OTP) via email — `supabase.auth.signInWithOtp()`, now routed through Resend SMTP (2026-04-17). **Sprint 4: switching to OTP 6-digit code entry as primary flow, magic link as fallback.**
- **Malls:** 29 locations seeded (KY + Clarksville IN)
- **Primary mall:** America's Antique Mall, id: `19a8ff7e-cb45-491f-9451-878e2dde5bf4`, slug: `americas-antique-mall`
- **Known vendors:**
  - ZenForged Finds, booth 369, id: `65a879f1-c43c-481b-974f-379792a36db8` — user_id SET ✅
  - Zen booth (admin default), id: `5619b4bf-3d05-4843-8ee1-e8b747fc2d81`
  - David Butler, All Peddlers booth 963, id: `225ea786-adf4-480f-be39-fc78b392a5bb` — user_id SET ✅ (linked to dbutlerproductions@yahoo.com, 2026-04-17)
  - **New test vendor from session 5 end-to-end test — linked via admin approval 2026-04-17. Details TBD — cleanup item below.**
- **Pending vendor_requests (as of 2026-04-17):**
  - `Do Well`, `dbutler80020@yahoo.com`, Crestwood booth 456 — pending
  - `David Johnson`, `dbutler80020@yahoo.com`, Shepherdsville booth 254 — pending
- **Extra columns vendors:** `facebook_url text`, `user_id uuid`, `hero_image_url text`, `bio text`
- **Unique constraint vendors:** `vendors_mall_booth_unique` on `(mall_id, booth_number)`
- **Unique constraint malls:** `malls_slug_key` on `(slug)`

---

## AUTH & SERVER API PATTERN

**Client → Server auth bridge (Option B — bearer header):**
- Client: import `authFetch` from `@/lib/authFetch` instead of calling `fetch()` directly to any gated route
- Server: first line of every `/api/admin/*` handler must be `const auth = await requireAdmin(req); if (!auth.ok) return auth.response;`
- For auth-required-but-not-admin routes (like `/api/setup/*`), use `requireAuth()` instead

**Redirect-preservation pattern (as of session 5):**
- Clients navigating to `/login?redirect=/some-path` will have that path preserved across the magic-link round trip via a `next` query param
- `lib/auth.ts → sendMagicLink(email, redirectTo?)` accepts the path; appends as `&next=<encoded>` to the confirm URL
- `app/login/page.tsx → safeRedirect(next, fallback)` validates same-origin relative paths only — rejects absolute URLs and protocol-relative (`//evil.com`). Use this helper for any future post-auth redirect sites.

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

## HOW TO CLEAR AN EMAIL FROM SUPABASE (for QA iterations)
> Captured from 2026-04-16 session — use when you want to reset a test email's state.
> ⚠️ CAUTION: In session 4 the `vendor_requests` row was accidentally deleted during this cleanup. The SQL pattern below (from diagnostic query) is safer than clicking rows in the dashboard.

Touches up to 3 tables: `auth.users`, `public.vendor_requests`, `public.vendors`.

**Preferred: SQL diagnostic + surgical delete**

```sql
-- Diagnostic: see current state across all 3 tables
SELECT 'vendor_requests' AS tbl, id::text, name AS name_or_display, email, booth_number, status, created_at
FROM public.vendor_requests WHERE email = 'TARGET@example.com'
UNION ALL
SELECT 'vendors', id::text, display_name, NULL, booth_number,
  CASE WHEN user_id IS NULL THEN 'unlinked' ELSE 'linked' END, created_at
FROM public.vendors WHERE display_name = 'TARGET_NAME'
UNION ALL
SELECT 'auth.users', id::text, raw_user_meta_data->>'full_name', email, NULL, 'auth', created_at
FROM auth.users WHERE email = 'TARGET@example.com';
```

**Step 1 — Delete auth user only (safest for re-test)**
```sql
DELETE FROM auth.users WHERE email = 'TARGET@example.com' RETURNING id, email;
```

**Step 2 — Delete vendor_request only if testing a full re-request flow**
```sql
DELETE FROM public.vendor_requests WHERE email = 'TARGET@example.com' RETURNING id, name, status;
```

**Step 3 — Unlink a vendor row without deleting it (for re-testing /setup flow)**
```sql
UPDATE public.vendors SET user_id = NULL WHERE display_name = 'TARGET_NAME' RETURNING id, display_name, user_id;
```

Note: the `admin-cleanup` Sprint 6+ item will collapse this to one click.

---

## WORKING ✅
- Discovery feed — masonry, scroll restore, spring-tap, warmth hover, back-nav anchor
- Feed footer — vendor CTA "Request booth access →" → `/vendor-request`
- Magic link auth + Admin PIN login
- **Magic link delivery via Resend SMTP — verified end-to-end 2026-04-17 for Yahoo ✅**
- **Magic link `?redirect=` param preserved across round trip — verified end-to-end 2026-04-17 session 5 ✅**
- My Booth — hero upload, vendor switcher, Send icon
- Post flow — AI caption, price validation, image upload
- Post preview — full image (no crop), edit pill buttons on title/caption/price
- Find detail — layered drift-in, booth LEFT / mall RIGHT, no address underline
- Public shelf — share button always visible (no auth required)
- Vendor request flow — `/vendor-request` form + success screen + API route
- Vendor account setup — admin approval workflow, setup page, email templates ✅
- Vendor-request admin + setup routed through server API with admin gating ✅ (2026-04-16 AM)
- `/api/admin/*` server-side admin check via `requireAdmin` ✅ (2026-04-16 AM)
- Setup lookup status-filter fix — verified end-to-end 2026-04-17 (approved vendor → magic link → setup → /my-shelf renders correct booth)
- **Full first-time vendor onboarding journey — verified end-to-end 2026-04-17 session 5** (new email → magic link → `/setup` waiting state → admin approve → redirected to `/my-shelf` → post flow shows correct booth)
- RLS — 12 policies + vendor_requests (service role only) ✅
- Rate limiting — `/api/post-caption` 10 req/60s, `/api/vendor-request` 3 req/10min ✅
- PWA manifest ✅
- `.env.example` — all required vars documented ✅
- Session Control Panel (Notion) ✅
- Shell aliases `th` / `thc` ✅
- MASTER_PROMPT.md — HITL standard + Product Agent + Blocker Protocol ✅
- Notion Roadmap — seeded ✅
- Investor update system — Drive folder + first PDF + Notion process doc ✅

## KNOWN GAPS ⚠️

### 🔴 Pre-beta blockers (must resolve before any real vendor onboarding)
None open. ✅

### 🟡 Sprint 4 (beta-readiness — next session)
- Custom domain — `app.kentuckytreehouse.com` → Vercel. Est. 15 min. **NEW 2026-04-17 session 5.**
- Switch magic link flow to OTP 6-digit code entry primary, magic link fallback. Biggest PWA UX unlock. Est. 3–4 hours. **NEW 2026-04-17 session 5.**
- `/admin` mobile-first approval polish — remove dead copy-paste email template flow, tighten thumb-reach, post-approval toast. Est. 2 hours. **NEW 2026-04-17 session 5.**
- `/vendor-request` → post-submission real-time approval state. "Magic moment" of in-person onboarding. Est. 2–3 hours. **NEW 2026-04-17 session 5.**
- Sprint 3 leftovers to clean up before beta invites:
  - Error monitoring (P1)
  - Vendor bio UI (P2)
  - Admin PIN production QA (P3 — quick curl)
  - Branded Supabase email template (reputation polish)

### 🟡 Sprint 5 (guest-user UX + onboarding polish — parked)
- Rename "Sign In" → "Curator Sign In" everywhere + `/welcome` guest-friendly landing for signed-in non-vendors (Option B from session 5 scoping). **NEW 2026-04-17 session 5.**
- PWA install onboarding experience — iOS/Android-aware install prompts, dismissal memory, animated walkthrough. **NEW 2026-04-17 session 5.**
- Vendor onboarding Loom/doc — for non-in-person onboarding. Not code. **NEW 2026-04-17 session 5.**
- Bookmarks persistence (localStorage → DB-backed, ITP wipe mitigation)

### 🟢 Sprint 6+ (parked)
- QR-code approval handshake (scan vendor's request ID from `/vendor-request` success → admin one-tap approve)
- Universal Links setup (iOS `apple-app-site-association`)
- Native app evaluation (Capacitor/Expo/React Native wrapper)
- `admin-cleanup` tool (collapse the 3-table SQL reset to one click)
- Feed pagination, search, ToS/privacy
- Mall page vendor CTA, Find Map overhaul

### 🟢 Cleanup (not urgent)
- Deprecated vendor-request functions still in `lib/posts.ts` — remove once confirmed no other callers
- `/api/debug-vendor-requests` still in production — retire after QA settles
- Cloudflare nameservers for `kentuckytreehouse.com` are assigned but not active (dormant from session 3). No cost to keeping; delete if preferred.
- **Test vendor created during session 5 end-to-end test** — if it was a throwaway email, clean up the `vendor_requests` row, `vendors` row, and `auth.users` row per the SQL pattern above. If it's a real email you want to keep, add to "Known vendors" section with full details.
- Feed content seeding before beta invite (Sprint 4/5)
- No automated testing (Sprint 6+)
- No terms of service / privacy policy (needed before public launch beyond in-person beta)

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

Source `.env.local` into the current shell for a one-off curl with auth:

```bash
cd ~/Projects/treehouse-treasure-search && set -a && source .env.local && set +a
```

Check Supabase auth logs (magic link dispatch status):

```
https://supabase.com/dashboard/project/zogxkarpwlaqmamfzceb/logs/auth-logs
```

Check Resend delivery logs:

```
https://resend.com/emails
```

Check DNS state for `kentuckytreehouse.com`:

```bash
dig kentuckytreehouse.com NS +short
```

```bash
dig kentuckytreehouse.com +short
```

```bash
dig resend._domainkey.kentuckytreehouse.com TXT +short
```

```bash
dig send.kentuckytreehouse.com TXT +short
```

```bash
dig send.kentuckytreehouse.com MX +short
```

---
