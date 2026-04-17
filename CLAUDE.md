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
> Last updated: 2026-04-17 evening (session 6 — Sprint 4 T1 + T2 shipped: custom domain live, OTP auth in PWA, clipboard paste, agent roster formalized)

**Status:** ✅ **T1 and T2 of Sprint 4 both shipped in one session.** `https://app.kentuckytreehouse.com` is now live (Vercel, HTTP/2, cert issued). OTP 6-digit code entry replaces the magic-link-as-primary auth flow; magic link still works as fallback. Clipboard paste button with auto-submit added. Supabase Auth URLs, email templates (Magic Link + Confirm Signup), and OTP Length (8→6) all updated. Verified end-to-end on iPhone PWA. Agent roster formally activated: Dev + Product + Docs agents. Notion Roadmap fully resynced.

---

## What was done (this session — 2026-04-17 evening, session 6)
> Biggest session 4 unlock so far — two major Sprint 4 items shipped plus meta-agent activation work

### T1 — Custom domain live

`app.kentuckytreehouse.com` now points at Vercel. Configuration:
- CNAME added in Shopify DNS (authoritative): `app` → `d21d0d632a8983e0.vercel-dns-017.com.` (Vercel's new unique per-project IP-range-expansion record, not the old shared `cname.vercel-dns.com`)
- Nameservers stay Shopify — ignored the "Vercel DNS" tab's nameserver-transfer path (would have broken Shopify storefront + email)
- Supabase Auth Site URL updated to `https://app.kentuckytreehouse.com` (lowercase)
- Supabase Redirect URLs list: added `https://app.kentuckytreehouse.com/**`; kept `https://treehouse-treasure-search.vercel.app/**` as safety net for ~1 week; `http://localhost:3000/**` for dev

The old `.vercel.app` URL still resolves — can stay in place indefinitely as a secondary. For all new vendor-facing comms, investor updates, social sharing, etc., use `app.kentuckytreehouse.com`.

### T2 — OTP 6-digit code entry

Rewrote `app/login/page.tsx` to make code entry the primary path. Magic link still works as fallback (email includes both, same `signInWithOtp` call).

**Code changes (2 commits):**
- `83f1f6f` feat(auth): OTP 6-digit code entry — primary path, magic link as fallback
- `55a9bb7` feat(auth): clipboard paste button for OTP code entry

**New Screen state:** `enter-code` between `enter-email` and `confirming`. After email send, user lands on code entry screen with: email-echo card, monospace 6-digit input (auto-advance, auto-submit on 6th digit, paste-friendly, `autocomplete="one-time-code"` for iOS keyboard-bar autofill), clipboard paste button (hides gracefully if Clipboard API unavailable, regex-extracts first 6 digits from clipboard text), 30-second resend cooldown with live countdown, fallback line *"Or tap the link we emailed you — either works"*, inline error handling for invalid/expired codes, and smart back-button (code screen → email entry, not out of `/login`).

**Admin PIN flow:** untouched. Already used `verifyOtp` under the hood.

**Redirect preservation from session 5:** intact. OTP path reads `searchParams.get("redirect")` on verifyOtp success and calls `safeRedirect()`. Magic link path still uses the `?next=` round-trip mechanism.

### Supabase configuration updates (dashboard-only, no code)

- **OTP Length:** changed `8` → `6` (Auth → Providers → Email → OTP Length). Default was 8; app UI is designed around 6.
- **Magic Link email template:** replaced stock template ("Follow this link to log in") with Treehouse-branded HTML including `{{ .Token }}` in a selectable `<code>` element. Subject: "Your Treehouse sign-in code".
- **Confirm Signup email template:** same HTML, subject "Welcome to Treehouse — your sign-in code". Caught mid-session that the first save didn't stick — second save verified with Preview tab.

**Known iOS Mail quirk (not a bug):** Code in email is selectable via tap-and-hold (iOS native pattern), not one-tap-copy. This is an OS security boundary; nothing we can do from the email template. The paste button in the app is the counterweight.

### Meta-agent work

**Agent roster formalized** (was unlabeled "planned" across several agents since DECISION_GATE.md creation on 2026-04-15):
- ✅ Active: Dev agent, Product agent (always ran de-facto at standup), Docs agent (now owns session close + Notion sync + Risk Register maintenance)
- 🔲 Sprint 5: Security agent (activation trigger = RLS-for-posts work)
- 🔲 Phase 2: Finance, Brand agents

**Standup now includes Agent Roster preamble** — one line confirming who's active: `**Active agents:** Dev · Product · Docs`. Added to DECISION_GATE.md as a standing standup requirement.

### Notion Roadmap fully resynced

Before T1 work began, the Notion Roadmap was still on Sprint 3 shape (missing session-5 re-scope). Full rewrite:
- Sprint 3 retired (all items Done or carried into Sprint 4)
- Sprint 4 Active: T1–T4 + 8 Sprint 3 carryovers
- Sprint 5 Planned: Curator Sign In rename, /welcome, PWA install onboarding, vendor Loom, bookmarks persistence, RLS, Find Map
- Sprint 6+ Parked: QR approval, Universal Links, native app eval, admin-cleanup, pagination, search, ToS
- Icebox: /enhance-text real Claude, testing, pull-to-refresh, Upstash, anon auth, Facebook Graph, Poshmark/Mercari, etc.
- Done: added session 3/4/5/6 ship items

At session close: T1 and T2 flipped to ✅ Done 2026-04-17.

### Files modified this session
- `app/login/page.tsx` — full rewrite: OTP code entry screen, paste button, `handleVerify`, `handleResend`, `handlePasteCode`, cooldown timer
- `docs/DECISION_GATE.md` — agent roster activation, standup agent check section, Risk Register updates
- `CLAUDE.md` (this file)
- Notion Roadmap (external — fully resynced)
- Supabase dashboard: Site URL, Redirect URLs, OTP Length, both email templates (external, no code)
- Shopify DNS: added `app` CNAME (external, no code)
- Vercel: added `app.kentuckytreehouse.com` domain (external, no code)

---

## Next session starting point — Sprint 4 continuation

**T1 and T2 are done.** Remaining Sprint 4 items, in recommended order:

**🟡 T3 — `/admin` mobile-first approval polish.** Remove dead copy-paste email template workflow (obsolete since Resend SMTP + branded templates shipped). Tighten thumb-reach on approve button. Post-approval toast with vendor details, long enough to verbally confirm with in-person person. Optional: prominent "N pending" banner at top when pending > 0. Est. 2 hours.

**🟡 T4 — `/vendor-request` in-person magic moment.** Design decision point: real-time approval poll OR dedicated in-person success variant that auto-redirects to `/setup` once approved. Recommend poll against a new ungated `/api/vendor-request/status?id=...` endpoint keyed on request ID — single-digit beta volume means poll cost is negligible. Est. 2–3 hours.

**🟢 Sprint 3 carryover cleanup (small items):**
- Admin PIN production QA (curl test, ~5 min)
- Hero image upload size guard (12MB client check)
- Vendor bio field UI (tap-to-edit + public display)
- Error monitoring (Sentry or structured logs)
- Feed content seeding (10–15 real posts) — required before beta invite
- Beta feedback mechanism (Tally.so link)

**🟢 Cleanup items:**
- Session 5 test vendor cleanup-or-document (if real email → add to Known vendors; if throwaway → SQL cleanup)
- Optional: remove `.vercel.app` safety-net entry from Supabase Redirect URLs after ~1 week
- Optional: add "Tap and hold the code to copy it" hint line to both email templates (small onboarding friction reducer)

### Things to validate next session
- iOS keyboard-bar OTP autofill suggestion — untested. If it fires, Treehouse auth becomes a 2-tap flow (tap input → tap suggested code). Paste button is the fallback regardless.
- Confirm Signup OTP flow works with `type: "email"` for brand-new users (confirmed in session 6 end-to-end, but watch for Supabase quirks at scale).

---

## ARCHIVE — What was done earlier (2026-04-17 late PM, session 5)
> emailRedirectTo fix + strategic Sprint 4+ scoping

**Status at session 5 close:** ✅ Magic link `redirect` param preserved across round trip. Full vendor onboarding verified end-to-end.

### Code change — `emailRedirectTo` no longer loses `/setup` across the magic-link round trip

Small surgical patch across two files. The bug: `sendMagicLink()` hardcoded `emailRedirectTo` to `/login?confirmed=1`, so any user arriving at `/login?redirect=/setup` would authenticate but lose the `/setup` destination. Workaround had been: navigate to `/setup` manually post-auth.

**Fix:**
- `lib/auth.ts` — `sendMagicLink(email, redirectTo?)` now accepts optional second arg. When provided, it's URL-encoded and appended as `&next=...` to the confirmation URL.
- `app/login/page.tsx` — new `safeRedirect(next, fallback)` helper validates same-origin relative paths only (rejects absolute URLs, rejects protocol-relative `//evil.com`, falls back to `/my-shelf`). The confirmed-loop, already-signed-in shortcut, `onAuthChange` callback, and BroadcastChannel handler all honor `?next=` when present. PIN flow untouched.
- `handleSend()` reads `searchParams.get("redirect")` and passes through to `sendMagicLink`.

**Verified end-to-end:** new test email → `/setup` → waiting state → admin approval → `/my-shelf` → correct booth context.

### Strategic scoping — Sprint 4/5/6 roadmap reshape (session 5)

Two product conversations produced concrete sprint items: (A) "Sign In" button mislabeled for audience → Sprint 5 rename + `/welcome` landing. (B) PWA + magic link break illusion → Sprint 4 OTP code entry (now shipped in session 6). Custom domain filed Sprint 4 (now shipped in session 6). PWA install onboarding, vendor onboarding Loom → Sprint 5. Native app eval → Sprint 6+.

### Files modified this session (session 5)
- `lib/auth.ts` — `sendMagicLink` accepts optional `redirectTo` param
- `app/login/page.tsx` — `safeRedirect` helper + forwards `?redirect=` to `sendMagicLink` + honors `?next=` post-auth
- `CLAUDE.md`
- `docs/DECISION_GATE.md` — Risk Register updates + Sprint Context update

---

## ARCHIVE — Session 4 (2026-04-17 early AM)
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

### Working ✅ additions (session 6 — 2026-04-17)
- Custom domain `app.kentuckytreehouse.com` — live, HTTP/2, cert issued
- Supabase Auth Site URL + Redirect URLs aligned to custom domain
- OTP 6-digit code entry as primary auth path — verified end-to-end on iPhone PWA (`83f1f6f`, `55a9bb7`)
- Clipboard paste button on OTP input — regex-extracts first 6 digits from clipboard text, auto-submits, hides gracefully if Clipboard API unavailable
- Supabase OTP Length = 6 (was 8); app UI matches
- Branded email templates for both Magic Link and Confirm Signup flows — `{{ .Token }}` in selectable `<code>` element
- Agent roster formalized: Dev · Product · Docs active; standup now includes Agent Roster preamble line

## KNOWN GAPS ⚠️

### 🔴 Pre-beta blockers (must resolve before any real vendor onboarding)
None open. ✅

### 🟡 Sprint 4 (beta-readiness — in progress)
- ✅ Custom domain `app.kentuckytreehouse.com` → Vercel. Shipped 2026-04-17 session 6.
- ✅ OTP 6-digit code entry (primary flow) + clipboard paste button. Shipped 2026-04-17 session 6.
- `/admin` mobile-first approval polish — remove dead copy-paste email template flow, tighten thumb-reach, post-approval toast. Est. 2 hours.
- `/vendor-request` → post-submission real-time approval state. "Magic moment" of in-person onboarding. Est. 2–3 hours.
- Sprint 3 leftovers to clean up before beta invites:
  - Error monitoring (P1)
  - Vendor bio UI (P2)
  - Admin PIN production QA (P3 — quick curl)
  - Hero image upload size guard (12MB client check)
  - Feed content seeding (10–15 real posts) before beta invite
  - Beta feedback mechanism (Tally.so link)

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
