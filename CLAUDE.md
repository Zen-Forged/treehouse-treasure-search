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
> Last updated: 2026-04-17 (session 4 — Yahoo magic link delivery RESOLVED, full end-to-end verified)

**Status:** ✅ **Pre-beta blocker is DEAD.** Resend SMTP live, Yahoo delivery confirmed, end-to-end magic link + vendor linking flow verified from a logged-out browser through to `/my-shelf` rendering as the correct vendor. Email landed in Yahoo junk on first send (expected for new sending domain) — reputation will season passively as usage grows. No code changes this session — all work was infrastructure (DNS + SMTP + Supabase auth) plus a small data recovery.

---

## What was done (this session — 2026-04-17 early AM)
> DNS discovery pivot + Resend verification + Supabase SMTP integration + end-to-end Yahoo test passed

### The DNS pivot — Path A instead of Path B

Session 3 ended mid-Cloudflare-migration (Path B), assuming DNS was split between Google Cloud DNS and a pending Cloudflare swap. This session opened with the plan to complete that migration.

**Discovery that collapsed the plan:** David logged into the domain settings to find the Tucows reseller and found that **Shopify was managing DNS** for `kentuckytreehouse.com`, not Google Cloud DNS. The `dig ns-cloud-d1...d4.googledomains.com` result from session 3 appears to have been stale or misread. The actual live records were clearly Shopify-managed (A → `23.227.38.65`, AAAA → `2620:0127:f00f:5::`, CNAMEs to `shops.myshopify.com`, plus Shopify-issued DKIM records `h3f._domainkey` etc.).

**Resolution:** Pivoted from Path B (Cloudflare migration) to Path A (add Resend records in the existing DNS UI — Shopify). This collapsed a 24–48h migration into a ~10-minute task.

**Also resolved:** The Tucows reseller mystery. Resend detected the domain's provider as **Squarespace** — so the registrar is Squarespace (likely inherited from Google Domains → Squarespace acquisition in 2023). The "Tucows reseller" framing from session 3 was incorrect.

### DNS records added in Shopify DNS

Three records, all resolved within 2 minutes:

| Type | Name | Value |
|------|------|-------|
| TXT | `resend._domainkey` | `v=DKIM1; k=rsa; p=MIGfMA0G...` (full key) |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` |
| MX | `send` | `feedback-smtp.us-east-1.amazonses.com` (priority 10) |

Verified via `dig` from local machine — all three resolved cleanly. Resend verified the domain ~2 minutes after the records were added.

### Resend → Supabase SMTP integration (native OAuth flow)

Used Resend's native Supabase integration (Settings → Integrations → Connect to Supabase) rather than manually copying SMTP credentials. Integration configured with:

- **Sender name:** `Kentucky Treehouse`
- **Sender email:** `hello@kentuckytreehouse.com`
- **Host:** `smtp.resend.com` (port 465)
- **User:** `resend`
- **Password:** auto-generated Resend API key named "Supabase Integration"

The integration pushed the config directly into Supabase Auth → SMTP Settings. No env vars in Vercel needed — Supabase sends the mail, not the Vercel app.

### End-to-end magic link test — PASSED ✅

Tested with `dbutlerproductions@yahoo.com` (previously blocked by Supabase default SMTP in session 2). Results:

- ✅ Supabase dispatched magic link via Resend
- ✅ Email arrived in Yahoo **junk folder** (expected for first-ever send from new domain — reputation will season)
- ✅ Clicked magic link → authenticated, landed on `/login?confirmed=1` → auto-redirected to `/my-shelf`
- ⚠️ `/setup` linking flow was **skipped** (routing bug — see below)
- ✅ Manually navigated to `/setup` → linking completed → `vendors.user_id` set for David Butler / Booth 963 / All Peddlers
- ✅ `/my-shelf` correctly renders David Butler's booth with correct mall + booth number
- ✅ "Post a find" shows correct vendor context ("Posting As David Butler")

### Data recovery mid-session

During QA setup, accidentally deleted the `vendor_requests` row for `dbutlerproductions@yahoo.com` (was attempting to clear the `auth.users` row for a clean test). Diagnosed via a 3-table `UNION ALL` query and recovered by re-inserting the `vendor_requests` row with `status = 'approved'`, pulling `mall_id` and `mall_name` from the existing `vendors` row via subquery to guarantee referential integrity. `vendors` row was untouched — only the historical request record was deleted and recreated.

### Files modified this session
- `CLAUDE.md` (this file)
- `docs/DECISION_GATE.md` (Risk Register — Yahoo magic link blocker → Resolved)

No application code changes this session.

---

## NEW BUG discovered — `emailRedirectTo` hardcoded in `lib/auth.ts`

Surfaced during the end-to-end test. `sendMagicLink()` hardcodes the redirect URL to `/login?confirmed=1`, which means anyone routed to `/login?redirect=/setup` loses the `/setup` destination across the magic-link round trip. Result: users complete sign-in but never trigger the `/setup` vendor-linking flow unless they manually navigate there.

**Current workaround:** Post-authentication, user manually navigates to `/setup` once. The `lookup-vendor` route short-circuits if already linked, so re-triggering is idempotent. But this should be a no-touch flow.

**Fix (next session):** Update `sendMagicLink(email, redirectTo?)` to accept an optional override, and update `/login` to pass the `redirect` query param through. ~5 line change in `lib/auth.ts` + `app/login/page.tsx`.

---

## Next session starting point — 2026-04-17+

### 🟢 First item: Fix `emailRedirectTo` hardcode bug

Small surgical change. Makes the magic link flow complete without manual navigation. Est. 10 min including build/deploy.

**Files:**
- `lib/auth.ts` — add optional `redirectTo` param to `sendMagicLink`
- `app/login/page.tsx` — read `searchParams.get("redirect")` and pass through to `sendMagicLink`

### 🟢 Second item: Quick Gmail delivery test

5 min sanity check. Same flow as tonight's Yahoo test but with a Gmail address. If Yahoo works, Gmail should work, but belt-and-suspenders is cheap.

### 🟡 Third item: Branded Supabase email template

Replace the default Supabase "Magic Link" template with a branded Treehouse version. Value: deliverability (less phishing-like) + brand consistency + incremental reputation boost. Est. 30–45 min for HTML + copy + test send.

**Deliverable components:**
- Subject line: "Sign in to Kentucky Treehouse" (or similar warm phrasing)
- Body: warm/observational Treehouse tone, simple HTML with color palette (`#f5f2eb` bg, `#1e4d2b` green)
- Footer: "You're receiving this because you requested a sign-in link. If this wasn't you, you can safely ignore this email."
- Test: send to both a Yahoo + Gmail address, mark as not-spam where needed

### 🟡 Fourth item: Mark-as-not-junk reputation seasoning

Not technical work — habit-forming. For every real magic link that lands in junk over the next 2–4 weeks, mark as "not junk" / add to contacts. Add a note for beta vendors in onboarding copy to do the same.

### 🟡 Fifth item: `qa-agent` sub-agent build

Deferred again. Still valid, still S effort + High value + 🟢 Proceed. Good fit for a session where all P0/P1 infrastructure work is settled.

### Sprint 3 items (remaining — unchanged)
Error monitoring (P1), vendor bio UI (P2), admin PIN production QA (P3), mall page vendor CTA (P4), find map overhaul (P5).

### Sprint 4 (not started)
Feed pagination, search, ToS/privacy, bookmarks persistence, `admin-cleanup` tool.

---

## ARCHIVE — What was done earlier (2026-04-16 late PM, session 3)
> Resend account setup + DNS migration decision (later reversed in session 4)

Session 3 created the Resend account, added the domain, generated DNS records, and chose Path B (Cloudflare migration) based on the incorrect premise that DNS lived at Google Cloud DNS. Session 4 discovered DNS actually lived at Shopify, pivoted to Path A, and completed the setup. Cloudflare nameservers (`marissa.ns.cloudflare.com`, `vin.ns.cloudflare.com`) remain assigned but **not active** — Shopify nameservers still authoritative. No action needed; Cloudflare side is dormant at no cost.

---

## ARCHIVE — Session 2 (2026-04-16 PM)
> Setup flow status-filter bug fix — now verified end-to-end in session 4

### The bug
After the migration to `/api/setup/lookup-vendor`, the approved test vendor hit `/setup` and got a generic "No vendor account found for this email" error despite the vendor_request row being in `approved` state and the matching `vendors` row existing with `user_id IS NULL`.

Root cause: the handler filtered vendor_requests with `.eq("status", "pending")`. That filter is inverted for the setup flow — `approved` is exactly the state where a vendor *should* be able to link.

### Implementation
- Rewrote `/app/api/setup/lookup-vendor/route.ts`: `.eq("status", "pending")` → `.neq("status", "rejected")`. The vendor row's existence (with `user_id IS NULL`) is the real gate — not the request status. Only `rejected` should actively block.
- Moved the already-linked short-circuit to the top of the handler.
- Tightened error copy to distinguish three failure modes.

### Verification (completed in session 4)
End-to-end verified via the Yahoo magic link test. `/setup` correctly locates approved vendor, links `user_id`, redirects to `/my-shelf` which now renders the correct vendor context.

---

## ARCHIVE — Session 1 (2026-04-16 AM)
> RLS-blocked vendor-request flow fix + admin API hardening

### Bug
Admin "Vendor Requests" tab rendered empty. Root cause: `vendor_requests` has service-role-only RLS policy. Three functions in `lib/posts.ts` used browser anon client, which RLS silently blocked. `/setup` flow broken same way.

Pre-existing companion bug: `/api/admin/posts` had NO server-side auth check — UI gating was the only gate.

### Architectural decision committed
Ecosystem tables with service-role-only RLS (`vendor_requests`, any future equivalent) accessed ONLY via server API routes using service role key. Browser anon client is read-only for ecosystem data. All admin writes go through `/api/admin/*` with `requireAdmin`. Captured in `docs/DECISION_GATE.md` Tech Rules.

### Files created / modified
- `lib/adminAuth.ts` (new) — `getServiceClient`, `requireAuth`, `requireAdmin` helpers
- `lib/authFetch.ts` (new) — client bearer-token fetch wrapper
- `app/api/admin/vendor-requests/route.ts` (new) — GET list + POST approve, both requireAdmin-gated
- `app/api/setup/lookup-vendor/route.ts` (new — patched in session 2, verified in session 4)
- `app/api/admin/posts/route.ts` (hardened)
- `app/admin/page.tsx` (migrated)
- `app/setup/page.tsx` (migrated)
- `lib/posts.ts` — five functions marked @deprecated
- `docs/DECISION_GATE.md`

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
- **TXT `resend._domainkey` → `v=DKIM1; k=rsa; p=MIGfMA0G...` (Resend DKIM, added 2026-04-17)**
- **TXT `send` → `v=spf1 include:amazonses.com ~all` (Resend SPF for `send` subdomain, added 2026-04-17)**
- **MX `send` → `feedback-smtp.us-east-1.amazonses.com` priority 10 (Resend MX for `send` subdomain, added 2026-04-17)**

**Dormant:** Cloudflare account has nameservers assigned (`marissa.ns.cloudflare.com`, `vin.ns.cloudflare.com`) but is not authoritative. Leftover from session 3's Path B plan. No cost to leaving it in place. Delete or reuse at your discretion.

---

## SUPABASE
- **Tables:** malls, vendors, posts, vendor_requests — RLS ENABLED ✅
- **vendor_requests:** id, name, email, booth_number, mall_id, mall_name, status, created_at ✅
- **vendor_requests RLS:** service-role-only (`USING (false) WITH CHECK (false)`) — must be accessed via `/api/*` routes
- **Storage bucket:** post-images — PUBLIC
- **Auth:** Magic link (OTP) via email — `supabase.auth.signInWithOtp()`, now routed through Resend SMTP (2026-04-17)
- **Malls:** 29 locations seeded (KY + Clarksville IN)
- **Primary mall:** America's Antique Mall, id: `19a8ff7e-cb45-491f-9451-878e2dde5bf4`, slug: `americas-antique-mall`
- **Known vendors:**
  - ZenForged Finds, booth 369, id: `65a879f1-c43c-481b-974f-379792a36db8` — user_id SET ✅
  - Zen booth (admin default), id: `5619b4bf-3d05-4843-8ee1-e8b747fc2d81`
  - **David Butler, All Peddlers booth 963, id: `225ea786-adf4-480f-be39-fc78b392a5bb` — user_id SET ✅ (linked to dbutlerproductions@yahoo.com, 2026-04-17)**
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

Note: the `admin-cleanup` Sprint 4 item will collapse this to one click.

---

## WORKING ✅
- Discovery feed — masonry, scroll restore, spring-tap, warmth hover, back-nav anchor
- Feed footer — vendor CTA "Request booth access →" → `/vendor-request`
- Magic link auth + Admin PIN login
- **Magic link delivery via Resend SMTP — verified end-to-end 2026-04-17 for Yahoo ✅**
- My Booth — hero upload, vendor switcher, Send icon
- Post flow — AI caption, price validation, image upload
- Post preview — full image (no crop), edit pill buttons on title/caption/price
- Find detail — layered drift-in, booth LEFT / mall RIGHT, no address underline
- Public shelf — share button always visible (no auth required)
- Vendor request flow — `/vendor-request` form + success screen + API route
- Vendor account setup — admin approval workflow, setup page, email templates ✅
- Vendor-request admin + setup routed through server API with admin gating ✅ (2026-04-16 AM)
- `/api/admin/*` server-side admin check via `requireAdmin` ✅ (2026-04-16 AM)
- Setup lookup status-filter fix — **verified end-to-end 2026-04-17** (approved vendor → magic link → setup → /my-shelf renders correct booth)
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
None open. ✅ Yahoo magic link delivery was the last open 🔴 and is now resolved.

### 🟡 Sprint 3 (in progress)
- `emailRedirectTo` hardcoded in `lib/auth.ts` — magic link redirect param not preserved across round trip. Workaround: manual navigation to `/setup` post-auth. Fix: small surgical change in next session. **NEW — surfaced 2026-04-17.**
- Magic link emails landing in Yahoo junk on first send. Expected for new sending domain. Reputation will season with use; no technical fix required. Branded email template (next session) will help marginally. **NEW — noted 2026-04-17.**
- No error monitoring — Priority 1
- Vendor bio field — no UI — Priority 2
- Admin PIN not QA'd in production — Priority 3
- Mall page vendor CTA — deferred (dark theme) — Priority 4
- Find Map overhaul — needs plan — Priority 5
- Branded Supabase email template — currently using default, unbranded template. Low-risk polish item. **NEW — noted 2026-04-17.**

### 🟢 Cleanup (not urgent)
- Deprecated vendor-request functions still in `lib/posts.ts` — remove once confirmed no other callers
- `/api/debug-vendor-requests` still in production — retire after QA settles
- Cloudflare nameservers for `kentuckytreehouse.com` are assigned but not active (dormant from session 3's Path B plan). No cost to keeping; delete if preferred. **UPDATED 2026-04-17.**
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
