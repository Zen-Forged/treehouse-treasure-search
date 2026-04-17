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
> Last updated: 2026-04-17 late-late evening (session 8 — onboarding scope-out complete, T4a email infrastructure shipped end-to-end; three post-deploy QA issues logged to docs/known-issues.md)

**Status:** ✅✅ **Huge session.** Two major landings:
1. **Onboarding scope-out complete** — three flows mapped (Pre-Seeded, Demo, Vendor-Initiated), canonical spec written at `docs/onboarding-journey.md`, T4 re-scoped into T4a/T4b/T4c/T4d with dependency ordering
2. **T4a shipped end-to-end** — Resend email infrastructure via `lib/email.ts` + wired into `/api/vendor-request` (Email #1 receipt) and `/api/admin/vendor-requests` (Email #2 approval). **Both emails verified arriving in production.**

⚠️ **Three post-deploy QA issues surfaced and logged to `docs/known-issues.md`:** admin PIN redirect wrong destination (KI-001), toast not centered on /admin (KI-002), and critically — the "posting as Zen · booth 300" bug is **still happening post-T4a** (KI-003, 🔴 High). The session-7 hypothesis that `/post` was reading stale localStorage turned out to be partially wrong — `/post` already calls `getVendorByUserId` on mount. The real cause needs diagnosis.

---

## 🚨 Next session opener — T4c is now 🔴 blocking (READ FIRST)

**Session 8 confirmed T4a works (emails arrive) but revealed the end-to-end journey is still broken.** A vendor can now get Email #1 (receipt), get Email #2 (approval), sign in via OTP, land on the right page, and *still* post as a stale vendor ("Zen · booth 300"). This blocks beta — you cannot onboard a real vendor until KI-003 is resolved.

Per `docs/onboarding-journey.md` re-scoped sprint ordering, **T4c was positioned as an orphan-cleanup pass after T4b**. Session 8 discovered T4c needs to **run before T4b** because KI-003 is the actual journey-breaking bug.

### Recommended Session 9 execution order

1. **🔴 Diagnose KI-001/002/003** — start here, ship fixes as a batch
   - **KI-001** (admin PIN → wrong destination): one-line fix in `app/login/page.tsx` `handlePin()`. 🟢 S.
   - **KI-002** (toast not centered on /admin): wrapper-div pattern already used in `/post`. 🟢 S.
   - **KI-003** (stale vendor identity post-approval): **diagnosis first, then fix.** The Session 8 scope-out assumed the bug was in `/post`, but `/post` already reads from DB. Real cause is one of:
     - (A) `/setup`'s lookup-vendor link step silently failed → check Vercel logs for errors
     - (B) Session authed as wrong user at `/post` load → check `getSession()` return value on device
     - (C) Race in `/post`'s identity resolution → re-read `app/post/page.tsx` lines ~167–230
   - **Prep:** clear David's iPhone `th_vendor_profile` localStorage before reproducing, otherwise the repro fights the stale cache on every attempt
2. **Then T4b — admin surface consolidation** (Add Booth tab in /admin, Add Vendor in-person flow, remove Admin PIN tab from /login, remove Booths from BottomNav). ~4 hours.
3. **Then T4d — pre-beta QA pass** — walk all three flows end-to-end against the fixed journey.

### Stale-state callout for the fresh session

- **David's iPhone localStorage:** has `th_vendor_profile` for `Zen / booth 300`. Clear before any repro via Sign Out from `/admin` gate or browser data clear.
- **DB state:** `David Butler / booth 123 / America's Antique Mall` vendor row exists from session 8 QA. May or may not be linked to `dbutlerproductions@yahoo.com`'s `auth.users.id` — verify with the diagnostic SQL in "HOW TO CLEAR AN EMAIL FROM SUPABASE" section before deciding to clean it up vs. repro against it.

---

## What was done (this session — 2026-04-17, session 8)

### Phase 1 — Onboarding scope-out (Product Agent, no code)

Per session-7 flag from David: *"first thing in the standup we need to truly scope out the onboarding journey."* Ran the full Product Agent scope-out before any code.

**Outputs:**
- **`docs/onboarding-journey.md`** — new canonical spec. Three flows documented with state diagrams, email matrix, data shape decisions, orphan inventory, re-scoped T4. ~380 lines.
- **Three flows committed:**
  - **Flow 1 — Pre-Seeded (Admin alone):** David seeds booths at malls he has no relationship with. No vendor contact, no auth, no emails. Creates `vendors` rows with `user_id=NULL`. Future Sprint 6+ hook: "claim this booth."
  - **Flow 2 — Demo (Admin + vendor in-person):** admin captures vendor details + approves in same session. Vendor receives both emails (receipt + approval). OTP sign-in. Lands on /setup → /my-shelf.
  - **Flow 3 — Vendor-initiated (remote, async):** vendor submits `/vendor-request` → gets receipt email → admin approves async → vendor gets approval email → OTP sign-in. Same convergence point as Flow 2.
- **Data shape decisions:**
  - `display_name` = public booth name; `vendor_requests.name` = person's name (today's model stands, no migration)
  - Hero photo on `/vendor-request` = email/booth only, no photo upload on public form (admin captures during Flow 2)
  - "Email must match" enforcement pinned to `/api/setup/lookup-vendor` — if no approved request for signed-in user's email, clear error message
- **Orphan inventory (for T4c implementation):**
  - Remove EmptyFeed "Add a Booth" CTA (routes to /shelves — pure orphan)
  - Remove "Admin PIN" tab from `/login` (moves behind /admin)
  - Remove admin "Booths" BottomNav tab (Add-Booth surface lives inside /admin as third tab)
  - Gate `/my-shelf` NoBooth state "Post a find" button behind `activeVendor !== null`
  - Fix `/post` to prefer DB vendor over localStorage (SESSION 8 UPDATE: this one turned out to already be coded correctly — see KI-003 for what's actually wrong)
  - Revise error copy on `/api/setup/lookup-vendor` and `/vendor-request` success
- **Re-scoped T4** broken into:
  - **T4a** (email infra, 3h) — ✅ **shipped session 8**
  - **T4b** (admin surface consolidation, 4h)
  - **T4c** (orphan cleanup + self-heal, 2h) — **now 🔴 blocking, runs before T4b**
  - **T4d** (pre-beta QA pass against mapped journey, 1-2h)

### Phase 2 — T4a email infrastructure ✅ shipped

**New file: `lib/email.ts`** (~260 lines)
- Resend REST API wrapper (no SDK dependency — uses native `fetch`)
- Two exported functions: `sendRequestReceived(payload)`, `sendApprovalInstructions(payload)`
- Best-effort: returns `{ ok: false, error: string }` on failure but never throws — upstream callers log and continue
- No-ops with warning if `RESEND_API_KEY` unset (keeps local dev frictionless)
- From-address: `Treehouse <hello@kentuckytreehouse.com>` (verified via Shopify DNS from session 4)
- Reply-to set to `NEXT_PUBLIC_ADMIN_EMAIL` for vendor replies
- Inline-styled HTML email shell with brand-appropriate warm copy (Georgia serif, parchment bg, green CTA button)
- HTML-escape helper for user-provided name/mall values
- Email masking helper for log lines (redacts local part)

**Wired into: `app/api/vendor-request/route.ts`**
- Calls `sendRequestReceived()` after successful `vendor_requests` insert
- Best-effort: logs via existing `logError()` helper on email failure, still returns 200 OK (vendor_requests row saved, admin can still approve)
- Removed obsolete TODO comment about Sprint 4 Resend integration

**Wired into: `app/api/admin/vendor-requests/route.ts`**
- Calls `sendApprovalInstructions()` after successful vendor row creation + request status flip
- Surfaces email failures via `warning` field on response (existing admin UI toast already renders warnings)
- Collects multiple warnings if both the status update AND the email fail
- Admin approval never fails due to email — vendor exists, status is approved, admin can reach out manually

**Updated: `.env.example`**
- Added `RESEND_API_KEY=` with detailed comment
- Added `NEXT_PUBLIC_SITE_URL=` (previously undocumented, used by `lib/email.ts` for absolute sign-in URLs)

**HITL steps David completed:**
- Created Resend API key scoped to "Sending access" + `kentuckytreehouse.com` domain
- Added `RESEND_API_KEY` to `.env.local` and Vercel (all three environments)
- Verified `kentuckytreehouse.com` domain in Resend dashboard (SPF/DKIM/DMARC all green from session 4's DNS work)
- `npm run build` clean, committed, `git push` triggered Vercel deploy
- **End-to-end QA verified:** Email #1 (receipt) and Email #2 (approval) both arrived in vendor inbox ✅

### Phase 3 — QA issues logged (not fixed this session)

Three issues surfaced during T4a post-deploy QA. All logged to `docs/known-issues.md` with severity, repro, and recommended sprint.

- **KI-001 🟡** Admin PIN redirects to `/my-shelf` (should be `/admin`)
- **KI-002 🟡** Toast not centered on `/admin` (recurring Framer Motion transform-overwrite issue)
- **KI-003 🔴 High** "Posting as Zen · booth 300" still happens post-approval — original hypothesis was `/post` reading stale localStorage, but `/post` already does `getVendorByUserId()` on mount. Real cause unknown; diagnostic question deferred to next session

### Files modified this session
- `docs/onboarding-journey.md` — new (canonical spec)
- `docs/known-issues.md` — new (three issues logged)
- `lib/email.ts` — new (Resend wrapper)
- `app/api/vendor-request/route.ts` — +email call, removed TODO
- `app/api/admin/vendor-requests/route.ts` — +email call, +warnings array
- `.env.example` — +RESEND_API_KEY, +NEXT_PUBLIC_SITE_URL
- `CLAUDE.md` (this file) — session close update
- Vercel env vars: RESEND_API_KEY (external, no code)
- Resend dashboard: API key generated (external, no code)

---

## ARCHIVE — What was done earlier (2026-04-17 late evening, session 7)
> Sprint 4 T3 shipped, onboarding fragility exposed, scope-out flagged

### T3 — `/admin` mobile-first approval polish ✅
Rewrote `app/admin/page.tsx` to polish the in-person approval moment. Removed obsolete copy-paste email template flow (dead code: `generateEmailTemplate`, `copyEmailTemplate`, Copy button, Copy import, clipboard branch). Added structured `Toast` discriminated-union with success/error variants, 6s auto-dismiss, spring animation, eyebrow label, Georgia-serif vendor name. Tightened Approve button to 44px iOS thumb-reach minimum. Mid-session copy fix: toast eyebrow corrected from *"✓ Approved · emailed [name]"* (factually wrong — approve sent no email) to *"✓ Approved · ready to sign in"*. The corrected copy was accurate for session 7 but should be revisited post-session-8 T4a — the approve endpoint now DOES send an email, so *"✓ Approved · emailed [name]"* is again accurate. KI-002 (toast centering) was introduced in this session's toast work.

### Database reset — full clean slate
Executed 7-block SQL cleanup (diagnostic → delete posts → vendor_requests → vendors → auth.users except david@zenforged.com → verify counts → verify auth user). Plus storage pass deleting 25 orphaned image files. Post-reset: 1 auth user, 0 vendor_requests, 0 vendors, 0 posts, empty bucket. Corrected stale "Known vendors" entries in this file that had falsely claimed ZenForged Finds #369 and David Butler #963 were linked to auth.

### QA pass findings — three onboarding failures from one clean slate
1. Approve endpoint sent no email (vendor had no organic way to know they were approved)
2. No organic path to `/setup` from `/login`
3. `/my-shelf` showed stale localStorage identity after device cache survived DB reset

These findings drove the session 8 onboarding scope-out. Items 1 and 2 resolved by T4a (session 8). Item 3 re-diagnosed as KI-003 in session 8 — the bug is not where we thought.

---

## ARCHIVE — What was done earlier (2026-04-17 evening, session 6)
> Biggest session 4 unlock so far — two major Sprint 4 items shipped plus meta-agent activation work

### T1 — Custom domain live
`app.kentuckytreehouse.com` live via Shopify DNS CNAME → Vercel. Supabase Auth Site URL + Redirect URLs aligned. Old `.vercel.app` URL remains as secondary.

### T2 — OTP 6-digit code entry
Rewrote `app/login/page.tsx` to make 6-digit code entry the primary auth path. Magic link in same email still works as fallback. New `enter-code` screen: email echo, monospace input with auto-advance/auto-submit/paste-friendly/`autocomplete="one-time-code"`, clipboard paste button, 30s resend cooldown, smart back-button. Redirect preservation from session 5 intact. Admin PIN flow untouched.

### Supabase configuration updates (dashboard-only)
OTP Length: 8 → 6. Branded email templates for Magic Link + Confirm Signup with `{{ .Token }}` in selectable `<code>` element. Known iOS Mail quirk: code is tap-and-hold copyable, not one-tap — paste button counterweight.

### Meta-agent work
Agent roster formalized: ✅ Dev, Product, Docs active. 🔲 Security Sprint 5, Finance/Brand Phase 2. Standup preamble updated.

### Files modified (session 6)
- `app/login/page.tsx` — full rewrite (OTP code entry)
- `docs/DECISION_GATE.md` — agent roster + risk register
- `CLAUDE.md`
- Supabase dashboard, Shopify DNS, Vercel (external)

---

## ARCHIVE — What was done earlier (2026-04-17 late PM, session 5)
> emailRedirectTo fix + strategic Sprint 4+ scoping

`lib/auth.ts → sendMagicLink(email, redirectTo?)` now accepts optional redirect path, appended as `&next=` to confirm URL. `app/login/page.tsx → safeRedirect(next, fallback)` helper validates same-origin relative paths only (rejects absolute URLs, protocol-relative `//evil.com`). Full vendor onboarding verified end-to-end. Two product conversations produced concrete sprint items for 5/6+.

---

## ARCHIVE — Session 4 (2026-04-17 early AM)
> DNS pivot + Resend SMTP + Yahoo magic link verification

Pivoted from Cloudflare migration (Path B) to direct Shopify DNS Resend records (Path A) after discovering Shopify is actually authoritative. Resend → Supabase native SMTP integration. End-to-end Yahoo magic link test passed. Small mid-session data recovery after accidentally deleting a `vendor_requests` row.

---

## ARCHIVE — Session 3 (2026-04-16 late PM)
> Resend account setup + DNS migration decision (later reversed in session 4)

Created Resend account, chose Path B (Cloudflare) based on the incorrect premise that DNS lived at Google Cloud DNS. Session 4 corrected this. Cloudflare nameservers remain dormant at no cost.

---

## ARCHIVE — Session 2 (2026-04-16 PM)
> Setup flow status-filter bug fix — verified end-to-end in session 4

`/setup` rejected approved vendors because `lookup-vendor` filtered `vendor_requests` with `.eq("status", "pending")`. Rewrote to `.neq("status", "rejected")`.

---

## ARCHIVE — Session 1 (2026-04-16 AM)
> RLS-blocked vendor-request flow fix + admin API hardening

Moved `vendor_requests` access from browser anon client (RLS-blocked) to server API routes using service role + `requireAdmin`. Five functions in `lib/posts.ts` marked `@deprecated`.

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

**Onboarding canonical spec:** See `docs/onboarding-journey.md` for the three committed flows (Pre-Seeded, Demo, Vendor-Initiated). All onboarding-adjacent work scopes against that document before code.

---

## STACK
```
Next.js 14 App Router · TypeScript · Tailwind CSS · Framer Motion
Anthropic SDK (claude-opus-4-5) · Supabase (Postgres + Storage + Auth) · SerpAPI · Vercel
lucide-react (Heart, Send, Store, Home, LayoutGrid icons in ecosystem UI)
Resend (dual use: SMTP provider for Supabase Auth OTP emails,
         AND direct Resend REST API for transactional emails via lib/email.ts)
```

---

## ENV VARS
```
NEXT_PUBLIC_SUPABASE_URL         https://zogxkarpwlaqmamfzceb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY    eyJhbGci... (full JWT — in .env.local and Vercel)
NEXT_PUBLIC_ADMIN_EMAIL          david@zenforged.com
NEXT_PUBLIC_SITE_URL             https://app.kentuckytreehouse.com (for lib/email.ts absolute URLs)
NEXT_PUBLIC_DEV_VENDOR_EMAIL     vendor@test.com (optional)
ANTHROPIC_API_KEY                Claude Vision + caption generation
SERPAPI_KEY                      eBay sold comps
ADMIN_PIN                        Server-only PIN for admin login
SUPABASE_SERVICE_ROLE_KEY        Server-only service role key (REQUIRED for /api/admin/* + /api/setup/* + /api/vendor-request)
RESEND_API_KEY                   Server-only Resend API key for lib/email.ts transactional emails (session 8)
EBAY_CLIENT_ID                   eBay direct API (not yet wired)
EBAY_CLIENT_SECRET               eBay direct API (not yet wired)
```

**SMTP note:** Resend SMTP credentials live in Supabase Auth → SMTP Settings (for OTP emails). Resend API key in Vercel env (for `lib/email.ts` transactional emails). Two separate uses of Resend — one via SMTP (Supabase-managed), one via REST API (our code, session 8).

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
- CNAME `app` → `d21d0d632a8983e0.vercel-dns-017.com.` (Vercel — session 6)
- CNAME `h3f._domainkey` → `dkim1.fa0cb6bc6910.p371.email.myshopify.com` (Shopify DKIM 1)
- CNAME `h3f2._domainkey` → `dkim2.fa0cb6bc6910.p371.email.myshopify.com` (Shopify DKIM 2)
- CNAME `h3f3._domainkey` → `dkim3.fa0cb6bc6910.p371.email.myshopify.com` (Shopify DKIM 3)
- CNAME `mailerh3f` → `fa0cb6bc6910.p371.email.myshopify.com` (Shopify mail routing)
- MX `@` → `mx.kentuckytreehouse.com.cust.b.hostedemail.com` priority 1 (inbound via HostedEmail)
- TXT `_provider` → `shopify`
- TXT `_dmarc` → `v=DMARC1; p=none`
- TXT `@` → `v=spf1 include:_spf.hostedemail.com ~all` (root SPF for inbound)
- TXT `resend._domainkey` → `v=DKIM1; k=rsa; p=MIGfMA0G...` (Resend DKIM, session 4)
- TXT `send` → `v=spf1 include:amazonses.com ~all` (Resend SPF for `send` subdomain, session 4)
- MX `send` → `feedback-smtp.us-east-1.amazonses.com` priority 10 (Resend MX for `send` subdomain, session 4)

**Dormant:** Cloudflare account has nameservers assigned (`marissa.ns.cloudflare.com`, `vin.ns.cloudflare.com`) but is not authoritative. Leftover from session 3's Path B plan. No cost to leaving it in place.

---

## SUPABASE
- **Tables:** malls, vendors, posts, vendor_requests — RLS ENABLED ✅
- **vendor_requests:** id, name, email, booth_number, mall_id, mall_name, status, created_at ✅
- **vendor_requests RLS:** service-role-only (`USING (false) WITH CHECK (false)`) — must be accessed via `/api/*` routes
- **Storage bucket:** post-images — PUBLIC
- **Auth:** Magic link (OTP) via email — `supabase.auth.signInWithOtp()`, routed through Resend SMTP. 6-digit code entry is primary path since session 6.
- **Malls:** 29 locations seeded (KY + Clarksville IN)
- **Primary mall:** America's Antique Mall, id: `19a8ff7e-cb45-491f-9451-878e2dde5bf4`, slug: `americas-antique-mall`
- **Known vendors (as of session 8 close):**
  - `David Butler / booth 123 / America's Antique Mall` — created via T4a end-to-end QA. `user_id` link state unverified (see KI-003 — diagnostic needed). `dbutlerproductions@yahoo.com` is the auth email.
  - `Claude Code / booth 123 / All Peddlers, Louisville` — appears in session 8 screenshot, approved status. `dbutler80020@gmail.com` is the auth email. Link state also unverified pending KI-003 diagnosis.
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
- Clients navigating to `/login?redirect=/some-path` have that path preserved across the magic-link round trip via a `next` query param
- `lib/auth.ts → sendMagicLink(email, redirectTo?)` accepts the path; appends as `&next=<encoded>` to the confirm URL
- `app/login/page.tsx → safeRedirect(next, fallback)` validates same-origin relative paths only — rejects absolute URLs and protocol-relative (`//evil.com`)

**Email pattern (as of session 8 — T4a):**
- `lib/email.ts` — Resend REST API wrapper, two functions: `sendRequestReceived`, `sendApprovalInstructions`
- Best-effort delivery — callers never fail their HTTP response on email error, just log
- No-ops with warning if `RESEND_API_KEY` unset (local dev friendly)
- Called from `/api/vendor-request` (Email #1) and `/api/admin/vendor-requests` (Email #2)
- Sends from `hello@kentuckytreehouse.com` via verified Resend domain (session 4 DNS records)

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
- Magic link delivery via Resend SMTP — verified end-to-end for Yahoo (session 4)
- Magic link `?redirect=` param preserved across round trip (session 5)
- My Booth — hero upload, vendor switcher, Send icon
- Post flow — AI caption, price validation, image upload
- Post preview — full image (no crop), edit pill buttons on title/caption/price
- Find detail — layered drift-in, booth LEFT / mall RIGHT, no address underline
- Public shelf — share button always visible (no auth required)
- Vendor request flow — `/vendor-request` form + success screen + API route
- Vendor account setup — admin approval workflow, setup page
- Vendor-request admin + setup routed through server API with admin gating (session 1)
- `/api/admin/*` server-side admin check via `requireAdmin` (session 1)
- Setup lookup status-filter fix (session 2)
- RLS — 12 policies + vendor_requests (service role only)
- Rate limiting — `/api/post-caption` 10 req/60s, `/api/vendor-request` 3 req/10min
- PWA manifest
- `.env.example` — all required vars documented
- MASTER_PROMPT.md — HITL standard + Product Agent + Blocker Protocol
- Notion Roadmap — seeded
- Investor update system — Drive folder + first PDF + Notion process doc
- Custom domain `app.kentuckytreehouse.com` (session 6)
- OTP 6-digit code entry as primary auth path (session 6)
- Clipboard paste button on OTP input (session 6)
- Branded email templates for Magic Link and Confirm Signup (session 6)
- Agent roster formalized: Dev · Product · Docs active (session 6)

### Working ✅ additions (session 8 — 2026-04-17)
- **`docs/onboarding-journey.md` canonical spec** — three flows mapped, email matrix, data shape, orphan inventory, re-scoped T4a/b/c/d
- **`docs/known-issues.md`** — bug tracking alive (three issues logged: KI-001, KI-002, KI-003)
- **`lib/email.ts` Resend REST wrapper** — two transactional email functions, best-effort delivery, local-dev friendly no-op
- **Email #1 (receipt) wired into `/api/vendor-request`** — fires on successful `vendor_requests` insert, logs failures without blocking response
- **Email #2 (approval + sign-in) wired into `/api/admin/vendor-requests`** — fires on approve, surfaces failures via `warning` field in admin toast
- **End-to-end email delivery verified in production** — both emails arrived in vendor inbox ✅

## KNOWN GAPS ⚠️

### 🔴 Pre-beta blockers (must resolve before any real vendor onboarding)
- **KI-003** — "Posting as Zen · booth 300" persists post-T4a. Vendor can complete full approval flow but still post under stale identity. Root cause needs diagnosis (logged in `docs/known-issues.md`). Blocks all real vendor onboarding until fixed.

### 🟡 Sprint 4 remainder (in-progress — see docs/onboarding-journey.md for re-scoped ordering)
- ✅ Custom domain `app.kentuckytreehouse.com` → Vercel (session 6)
- ✅ OTP 6-digit code entry + clipboard paste (session 6)
- ✅ T3 `/admin` mobile-first approval polish (session 7)
- ✅ Onboarding scope-out + `docs/onboarding-journey.md` (session 8)
- ✅ T4a email infrastructure + Email #1 + Email #2 (session 8)
- 🔴 **T4c** — orphan cleanup + KI-003 fix. **Elevated to blocking, runs before T4b.**
- 🟡 T4b — admin surface consolidation (Add Booth tab in /admin, Add Vendor in-person flow, remove Admin PIN from /login, remove Booths from BottomNav)
- 🟡 T4d — pre-beta QA pass walking all three flows end-to-end
- **KI-001** — admin PIN redirects to `/my-shelf` (should be `/admin`). Bundled into T4b or shipped standalone.
- **KI-002** — toast not centered on `/admin`. Bundled into T4c.
- Sprint 3 leftovers still pending beta invites:
  - Error monitoring (Sentry or structured logs)
  - Vendor bio UI (tap-to-edit + public display)
  - Hero image upload size guard (12MB client check) — actually already present in my-shelf, verify coverage
  - Feed content seeding (10–15 real posts) — required before beta invite
  - Beta feedback mechanism (Tally.so link)

### 🟡 Sprint 5 (guest-user UX + onboarding polish — parked)
- Rename "Sign In" → "Curator Sign In" everywhere + `/welcome` guest-friendly landing for signed-in non-vendors
- PWA install onboarding experience
- Vendor onboarding Loom/doc
- Bookmarks persistence (localStorage → DB-backed, ITP wipe mitigation)

### 🟢 Sprint 6+ (parked)
- "Claim this booth" flow for Flow 1 pre-seeded vendors (Sprint 6+ hook from onboarding-journey.md)
- QR-code approval handshake
- Universal Links setup (iOS `apple-app-site-association`)
- Native app evaluation (Capacitor/Expo/React Native wrapper)
- `admin-cleanup` tool (collapse the 3-table SQL reset to one click)
- Feed pagination, search, ToS/privacy
- Mall page vendor CTA, Find Map overhaul

### 🟢 Cleanup (not urgent)
- Deprecated vendor-request functions still in `lib/posts.ts`
- `/api/debug-vendor-requests` still in production — flagged 🟡 security in session 8 Risk Register (unauthenticated, exposes vendor_requests data)
- Cloudflare nameservers for `kentuckytreehouse.com` — dormant, no cost
- `/shelves` AddBoothSheet — orphan after T4b ships, remove then
- `docs/VENDOR_SETUP_EMAIL_TEMPLATE.md` — obsolete since T4a; automated emails supersede the copy-paste template. Retire in a doc cleanup pass.

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

Check Vercel function logs (for lib/email.ts send errors):

```
https://vercel.com/david-6613s-projects/treehouse-treasure-search/logs
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
