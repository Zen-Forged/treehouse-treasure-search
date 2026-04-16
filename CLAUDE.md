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
> Last updated: 2026-04-16 (session 2 of the day)

**Status:** Setup flow status-filter bug fixed in code and ready to deploy. End-to-end QA was blocked by Yahoo magic link deliverability failure; deploy has been made but the fix has not yet been verified on device. Gmail-based QA is the intended next step. Pre-beta SMTP migration (Resend + kentuckytreehouse.com) is now the top-of-queue task for next session.

---

## What was done (this session — 2026-04-16 PM)
> Bug fix: `/setup` returning "No vendor account found" for approved vendors + Sprint 4 candidates captured

### **THE BUG**
After last session's migration to `/api/setup/lookup-vendor`, the approved test vendor (`dbutlerproductions@yahoo.com` → David Butler, All Peddlers booth 963) hit `/setup` and got a generic "No vendor account found for this email" error despite the vendor_request row being in `approved` state and the matching `vendors` row existing with `user_id IS NULL`.

Root cause: the handler filtered vendor_requests with `.eq("status", "pending")`. That filter is inverted for the setup flow — `approved` is exactly the state where a vendor *should* be able to link. The query returned zero rows, fell through to the empty-state 404, surfaced as "No vendor account found."

### **IMPLEMENTATION COMPLETED**

**Task 1 — Status filter fix** ✅
**[CODE]** Rewrote `/app/api/setup/lookup-vendor/route.ts`:
- `.eq("status", "pending")` → `.neq("status", "rejected")`. Rationale: the vendor row's existence (with `user_id IS NULL`) is the real gate — not the request status. Only `rejected` should actively block. Pending requests with no vendor row yet fall through to the "not ready" 404, which is correct behavior.
- Moved the already-linked short-circuit to the top of the handler (was a fallback inside the 404 branch). Cheaper and clearer for the "signed in again after setup" case.
- Tightened error copy to distinguish three failure modes: "No vendor request found for this email" (no request row) vs "Your vendor account isn't ready yet. An admin needs to approve your request first." (request exists, vendor row doesn't) vs generic 500 (link failed).

**Task 2 — Sprint 4 candidates captured** ✅
Three items added to Next-session block below. See that section for full descriptions.

### **FILES MODIFIED**
- `app/api/setup/lookup-vendor/route.ts` (status filter fix + error copy tightening + already-linked short-circuit moved to top)
- `CLAUDE.md` (this file — session history + Sprint 4 candidates)

### **DIAGNOSIS LOOP THAT PRODUCED THE FIX**
1. David hit `/setup` after clicking approval email magic link → saw "Setup incomplete" screen
2. Pulled `/api/debug-vendor-requests` → confirmed request row existed and was status=`approved`
3. Read `/api/setup/lookup-vendor/route.ts` → spotted the `.eq("status", "pending")` filter
4. David queried `vendors` table in Supabase dashboard → confirmed matching row existed with `user_id = null`
5. Three-point confirmation (request exists, row exists, filter inverted) → one-line fix + copy cleanup

### **BLOCKED: End-to-end QA**
🚧 Magic link delivery to `dbutlerproductions@yahoo.com` failed silently. Supabase auth logs showed `event: mail.send`, `level: info`, no error — email dispatched successfully but never arrived at Yahoo (not in inbox, not in spam). Not a code bug — this is the Supabase default SMTP's known poor deliverability to Yahoo/AOL due to shared sender reputation.

**Decision:** Do not attempt to unblock Yahoo delivery this session. Path forward is Gmail-based QA (next session or end of this one) + Resend + custom SMTP setup at start of next session.

### **PENDING ACTIONS FROM THIS SESSION**
🖐️ **HITL** — Build check:

```bash
cd ~/Projects/treehouse-treasure-search && npm run build 2>&1 | tail -30
```

🖐️ **HITL** — Commit and push (includes last session's migration work AND today's fix AND this doc update):

```bash
git add -A && git commit -m "fix(setup): accept approved vendor requests in lookup, tighten error copy" && git push
```

🖐️ **HITL** — If Vercel webhook doesn't fire in ~60s:

```bash
npx vercel --prod
```

🖐️ **HITL** — Gmail-based QA (can be done this session if David wants, or at start of next):
1. `/vendor-request` → submit as QA Test, `<gmail address>`, booth 999, any mall
2. Sign in as admin → `/admin` → Vendor Requests tab → verify list populated (3+ rows) → approve QA Test → verify row flips + email template copied to clipboard
3. Sign out → sign in with Gmail → tap magic link → verify lands on `/my-shelf` as QA Test vendor
4. From Mac Terminal: `curl -i https://treehouse-treasure-search.vercel.app/api/admin/posts` → expect `HTTP/2 401` on first line

If anything fails, triage before starting next session's Resend work.

---

## Next session starting point — 2026-04-17

### 🔴 First item: Wire Resend + `kentuckytreehouse.com` for transactional email (S-M effort, High value, 🟢 Proceed — pre-beta blocker)

**Why first:** magic link delivery is broken for Yahoo (confirmed by auth log dispatch + non-delivery on 2026-04-16). Any vendor onboarding attempt that hits a Yahoo/AOL address right now will silently fail. This is the single biggest gap between current state and something shippable to a real vendor.

**Approach:**
1. Confirm David owns `kentuckytreehouse.com` + has DNS access (Namecheap / Cloudflare / GoDaddy / etc.)
2. Sign up for Resend (free tier = 3K emails/month — well above projected beta volume)
3. Add `kentuckytreehouse.com` as Resend sending domain
4. Paste 3 DNS records (SPF, DKIM, DMARC) into DNS provider — wait for verification (usually <5 min)
5. Generate Resend SMTP credentials
6. Supabase dashboard → Authentication → SMTP Settings → enable custom SMTP → paste Resend creds → set sender `info@kentuckytreehouse.com`
7. Test magic link delivery to Yahoo and Gmail — both should arrive in <30s

**Why kentuckytreehouse.com not zenforged.com:** brand alignment. Vendor sees a branded sender matching the product they signed up for, not the operator entity. Keeps Zen Forged as operator brand, Kentucky Treehouse as consumer-facing product brand. No downside.

**Estimate:** 20–30 min if DNS is straightforward.

### 🟡 Second item: `qa-agent` sub-agent build (S effort, High value, 🟢 Proceed)

**Why second:** every deploy now has more API surface area than the last. QA is becoming a recurring bottleneck. Per MASTER_PROMPT.md sub-agent criteria, this is the right trigger to formalize it.

**Scope (from 2026-04-16 draft brief, not yet committed to repo):**
- Pre-deploy triage: given a diff summary, return what MUST be tested vs what can be skipped
- Automated verification scripts in `scripts/qa/` — curl-based server-side checks that replace manual HITL steps wherever possible
- Device checklist generator — max 5 items per deploy, grouped by flow, plain-English instructions (learned from 2026-04-16 — David explicitly needs "how to do it" not just "what to test")
- Diagnosis loop — when a step fails, pull relevant logs + DB state + produce a root-cause hypothesis before suggesting a fix (this is what we did manually today for the setup bug and for the magic link failure — worth automating)
- Post-QA disposition: update Risk Register "Resolved" → "Verified in production"

**Explicitly out of scope:** tapping buttons on a physical device. The agent reduces HITL steps; it cannot eliminate them.

**Deliverables for the build session:**
- `docs/agents/qa-agent.md` (system prompt + scope doc)
- `scripts/qa/vendor-request.sh` (first automated check suite — covers all `/api/admin/*` + `/api/setup/*` auth gating)
- `docs/qa-playbook.md` (living doc of test patterns)

**Estimate:** 30–45 min.

### 🟡 Third: Complete the vendor-request + setup QA under qa-agent (S effort)

Once qa-agent exists, re-run QA for the 2026-04-16 deploy using its trimmed format. Verifies both the last-session migration AND today's filter fix in one pass. Should be ~5 device steps + automated curl suite. If QA was already completed manually via Gmail before next session, this step collapses to "update Risk Register."

### Sprint 3 items (remaining)

#### Priority 1 — Error monitoring (S effort, High value, 🟢 Proceed)
- Structured `console.error` wrapping pattern exists in `/api/vendor-request/route.ts` — generalize to all API routes
- Evaluate Sentry free tier vs Vercel function logs + Supabase logs (we learned this session that Supabase auth logs are rich and free — maybe sufficient for now)
- More valuable than ever with 3 new API routes shipped in last two sessions

#### Priority 2 — Vendor bio field UI (M effort, High value, 🟢 Proceed)
- `bio` column exists in DB + is fetched, no UI to set or display
- Inline tap-to-edit on My Booth hero; display on public `/shelf/[slug]`
- `updateVendorBio()` already exists in `lib/posts.ts`

#### Priority 3 — Admin PIN production QA (S effort, Medium value, 🟢 Proceed)
- Confirm `ADMIN_PIN` + `SUPABASE_SERVICE_ROLE_KEY` in Vercel env
- Test full admin PIN flow on production URL

#### Priority 4 — Mall page vendor CTA (S effort, deferred from earlier sprint)
- `app/mall/[slug]/page.tsx` uses dark reseller palette — CTA needs dark theme styling
- Pass `?mall_id=&mall_name=` to pre-fill the vendor request form

#### Priority 5 — Find Map overhaul (L effort, High value, 🖐️ REVIEW before starting)
- Group saved finds by mall, per-mall route segments
- Plan required before any code

### Cleanup items (carry over)
- Remove deprecated vendor-request functions from `lib/posts.ts` once confirmed no other callers
- Remove `/api/debug-vendor-requests` route (still useful for QA right now — retire after Resend + QA pass lands)

### Sprint 4 (not started)
- Feed pagination / infinite scroll
- Search
- Terms of service / privacy policy
- Bookmarks persistence (Supabase)
- **`admin-cleanup` tool** — single-button cascade delete across `auth.users` + `vendor_requests` + `vendors` for a given email. Currently 3 manual Supabase dashboard steps per test iteration — friction for QA, demos, and future "delete my account" requests. Queue before public beta.

---

## ARCHIVE — What was done previous session (2026-04-16 AM)
> RLS-blocked vendor-request flow fix + admin API hardening — shipped, deployed, partially verified

### Bug
Admin "Vendor Requests" tab rendered empty. Root cause: `vendor_requests` has service-role-only RLS policy (`USING (false) WITH CHECK (false)`). Three functions in `lib/posts.ts` (`getVendorRequests`, `markVendorRequestApproved`, `getVendorByEmail`) used browser anon client, which RLS silently blocked — empty arrays, no error. `/setup` flow broken same way.

Pre-existing companion bug: `/api/admin/posts` had NO server-side auth check — UI gating was the only gate. Any authenticated user could hit it and wipe production.

### Architectural decision committed
Ecosystem tables with service-role-only RLS (`vendor_requests`, any future equivalent) accessed ONLY via server API routes using service role key. Browser anon client is read-only for ecosystem data. All admin writes go through `/api/admin/*` with `requireAdmin`. Captured in `docs/DECISION_GATE.md` Tech Rules.

### Files created / modified
- `lib/adminAuth.ts` (new) — `getServiceClient`, `requireAuth`, `requireAdmin` helpers
- `lib/authFetch.ts` (new) — client bearer-token fetch wrapper
- `app/api/admin/vendor-requests/route.ts` (new) — GET list + POST approve, both requireAdmin-gated
- `app/api/setup/lookup-vendor/route.ts` (new — patched today) — requireAuth, lookup + link in one call
- `app/api/admin/posts/route.ts` (hardened) — requireAdmin added to GET + DELETE; switched anon → service role
- `app/admin/page.tsx` (migrated) — all data access via authFetch to `/api/admin/*`
- `app/setup/page.tsx` (migrated) — single authFetch call to lookup-vendor
- `lib/posts.ts` — five functions marked @deprecated with JSDoc pointing to replacement routes
- `docs/DECISION_GATE.md` — Tech Rules + Risk Register updated

### Auth pattern (Option B — bearer header)
- Client: `lib/authFetch.ts` reads Supabase session, adds `Authorization: Bearer <access_token>`
- Server: `lib/adminAuth.ts` extracts bearer, validates via `service.auth.getUser(token)`, checks admin email
- No `@supabase/ssr`, no cookie bridge — zero new deps

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

Planned additions (next session — Resend):
```
RESEND_SMTP_HOST                 (from Resend dashboard)
RESEND_SMTP_PORT                 (from Resend dashboard)
RESEND_SMTP_USER                 (from Resend dashboard)
RESEND_SMTP_PASS                 (from Resend dashboard)
```
Note: these live in Supabase Auth → SMTP Settings, not Vercel env. The Vercel app itself does not send mail — Supabase does.

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
  - **David Butler, All Peddlers booth 963, id: `225ea786-adf4-480f-be39-fc78b392a5bb` — user_id NULL (approved, awaiting first /setup link)**
- **Pending vendor_requests (as of 2026-04-16 PM):**
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
> Captured from 2026-04-16 session — use when you want to reset a test email's state

Touches up to 3 tables: `auth.users`, `public.vendor_requests`, `public.vendors`.

**Step 1 — Delete auth user**
1. https://supabase.com/dashboard/project/zogxkarpwlaqmamfzceb/auth/users
2. Search for email → three-dot menu → Delete user

**Step 2 — Delete vendor_request row(s)**
1. https://supabase.com/dashboard/project/zogxkarpwlaqmamfzceb/editor → `vendor_requests` table
2. Filter `email = <target>` → select rows → trash icon

**Step 3 — Delete vendor row (only if request was already approved)**
1. `vendors` table → filter `display_name = <name>` + verify `mall_id` matches before deleting
2. Watch for multi-match by display_name — always confirm `mall_id` first

For most QA iterations, Steps 1 + 2 are enough. Do Step 3 only if admin already approved.

Note: the `admin-cleanup` Sprint 4 item will collapse this to one click.

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
- Vendor account setup — admin approval workflow, setup page, email templates ✅
- Vendor-request admin + setup routed through server API with admin gating ✅ (2026-04-16 AM)
- `/api/admin/*` server-side admin check via `requireAdmin` ✅ (2026-04-16 AM)
- Setup lookup status-filter fix — approved vendors can now link ✅ (2026-04-16 PM, code shipped, not yet end-to-end verified)
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
- **Magic link delivery broken for Yahoo/AOL addresses** — Supabase default SMTP dispatches successfully (confirmed in auth logs) but Yahoo silently drops or spam-bins. Fix = Resend + custom SMTP + `kentuckytreehouse.com` sending domain. **First item next session.**

### 🟡 Sprint 3 (in progress)
- No error monitoring — Priority 1
- Vendor bio field — no UI — Priority 2
- Admin PIN not QA'd in production — Priority 3
- Mall page vendor CTA — deferred (dark theme) — Priority 4
- Find Map overhaul — needs plan — Priority 5
- 2026-04-16 deploy not yet end-to-end verified on device — Gmail-based QA pending

### 🟢 Cleanup (not urgent)
- Deprecated vendor-request functions still in `lib/posts.ts` — remove once confirmed no other callers
- `/api/debug-vendor-requests` still in production — retire after QA settles
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
