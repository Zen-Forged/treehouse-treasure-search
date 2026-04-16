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
> Last updated: 2026-04-16 (session 3 of the day — Resend SMTP setup, DNS migration in flight)

**Status:** Resend account created and domain added. DNS migration in flight — Path B chosen (move DNS from Google Cloud DNS to Cloudflare for cleaner long-term ops). Cloudflare has records pre-imported and assigned nameservers; Tucows nameservers NOT yet swapped. DNSSEC confirmed off. No code changes this session. Session closed mid-migration on fatigue — pick up next session with nameserver swap + propagation + Resend records.

---

## What was done (this session — 2026-04-16 late PM)
> Resend account setup + DNS migration decision made and staged (Cloudflare chosen over Google Cloud DNS)

### Context
Session opened to wire Resend + custom SMTP for `kentuckytreehouse.com` to fix the pre-beta Yahoo magic link deliverability blocker. Path was well-defined at session open. What wasn't defined: where DNS for `kentuckytreehouse.com` actually lives.

### The DNS archaeology
Hours of hunting revealed the split nobody had documented:
- **Registrar:** Tucows (through an unidentified reseller — see "Unknowns" below)
- **Nameservers (live):** `NS-CLOUD-D1` through `NS-CLOUD-D4.GOOGLEDOMAINS.COM` — Google Cloud DNS
- **Google Cloud project containing Shopify OAuth integration:** `kentuckytreehouse0001` (under `zenforged.com` org)
- **Google Cloud DNS zone for kentuckytreehouse.com:** NOT in the `kentuckytreehouse0001` project — zone list was empty. Presumably living in a different GCP project on a different Google account we didn't hunt down.
- **Cloudflare:** fully configured with records pre-imported (A, AAAA, CNAMEs for Shopify, MX, SPF, DMARC) but NOT active — nameservers at Tucows still point to Google Cloud DNS.

### The decision — Path B: Cloudflare migration
Two viable paths surfaced. Picked Path B.

**Path A (rejected):** Find the orphaned Google Cloud DNS zone (different GCP project or different Google account), add 3 Resend records there. Fast (~15–30 min) but leaves DNS on a UI we find less pleasant and doesn't solve the underlying "DNS is configured in two places" weirdness.

**Path B (chosen):** Complete the Cloudflare migration that was staged but never activated. Swap nameservers at Tucows from Google Cloud DNS → Cloudflare. Wait 24–48h for propagation. Add 3 Resend records in Cloudflare's UI. Verify. Cleaner long-term; slower today.

Rationale for Path B: (1) DNSSEC check cleared (`dig DNSKEY +short` empty — safe to migrate), (2) Cloudflare's UI is meaningfully better than Google Cloud DNS for ongoing DNS work, (3) Free CDN + DDoS + analytics come along for the ride, (4) all current records already imported into Cloudflare so the swap is low-risk.

### Progress made
- ✅ Resend account created
- ✅ Domain `kentuckytreehouse.com` added in Resend, region `us-east-1`
- ✅ Resend generated 3 DNS records (DKIM TXT, SPF TXT, MX — no DMARC since existing `p=none` record is fine as-is)
- ✅ Cloudflare activation page reached — nameservers assigned: `marissa.ns.cloudflare.com`, `vin.ns.cloudflare.com`
- ✅ DNSSEC confirmed off at registrar — safe to proceed with migration
- ✅ Existing DMARC verified acceptable (`v=DMARC1; p=none` — will add `rua=mailto:david@zenforged.com` later as a nicety)
- ✅ Existing SPF at root verified non-conflicting (`v=spf1 include:_spf.hostedemail.com ~all` — no overlap with Resend's `send` subdomain SPF)

### NOT done yet (top of queue next session)
- ❌ Tucows reseller login not identified — need to find via email receipt search
- ❌ Nameservers NOT yet swapped at registrar
- ❌ 3 Resend records NOT yet added in Cloudflare (wait until after propagation completes)
- ❌ Resend verification NOT attempted
- ❌ Supabase SMTP settings NOT updated
- ❌ End-to-end magic link delivery test NOT performed

### The 3 Resend records — documented here for next session

When Cloudflare is the live authority (i.e., `dig NS +short` returns Cloudflare nameservers), add these in Cloudflare → DNS → Records:

**Record 1 — DKIM TXT**
- Type: `TXT`
- Name: `resend._domainkey`
- Content: `v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCreHnVOPd1o636qlAvsUsxFF2vPN/h3EOMpfMdH0z2PpkvbS+Cyj0yBuHSNiLozS4Zvi+lgaZWP8JGR0q8a6rStIT7U4BP/H5HvoIp3+3bKfz929pW1WcDDjCBV4eXxADjLfpw2urNFB8jylwAmqDWh5a2aX2ulS27HKBEGkV9oQIDAQAB`
- TTL: Auto
- Proxy status: **DNS only** (grey cloud — critical)

**Record 2 — SPF TXT for send subdomain**
- Type: `TXT`
- Name: `send`
- Content: `v=spf1 include:amazonses.com ~all`
- TTL: Auto
- Proxy status: **DNS only**

**Record 3 — MX for send subdomain**
- Type: `MX`
- Name: `send`
- Mail server: `feedback-smtp.us-east-1.amazonses.com`
- Priority: `10`
- TTL: Auto
- (MX records are always DNS-only in Cloudflare — no toggle needed)

### Unknowns still open for next session

1. **Tucows reseller login.** Tucows is a wholesale registrar — they don't have a consumer login. The domain was registered through one of their resellers (Hover? OpenSRS? Domainbox? Something from Google Domains migration?). Resolution: search email inbox for `kentuckytreehouse.com` registration / renewal receipts. Whoever sent it is where you log in to change nameservers.

2. **The orphaned Google Cloud DNS zone.** Currently serving live DNS for the domain. After Cloudflare migration completes and is verified, this zone becomes dead weight. Whether to clean it up depends on finding it — which requires logging into whichever Google account originally owned Google Domains for this domain. Not urgent; not a blocker. Just hygiene.

### Files modified
- `CLAUDE.md` (this file)
- `docs/DECISION_GATE.md` (Risk Register — Yahoo magic link deliverability status updated)

No code changes this session.

---

## Next session starting point — 2026-04-17

### 🔴 First item (continued): Complete Cloudflare DNS migration + Resend setup

**Phase 1 — Find Tucows reseller + swap nameservers (15 min)**

1. 🖐️ HITL — Search Gmail/all email for `kentuckytreehouse.com` → find the registration or most recent renewal receipt → identify reseller (Hover, OpenSRS, etc.)
2. 🖐️ HITL — Log in to reseller admin panel → domains → `kentuckytreehouse.com` → Nameservers
3. 🖐️ HITL — Replace the 4 Google Cloud nameservers (`ns-cloud-d1` through `d4.googledomains.com`) with the 2 Cloudflare nameservers:
   - `marissa.ns.cloudflare.com`
   - `vin.ns.cloudflare.com`
4. 🖐️ HITL — Save

**Phase 2 — Wait for propagation (6–48h, usually 6–12h)**

Do not touch anything. Site continues to work throughout (records identical in both zones during transition).

**Phase 3 — Verify migration, then add Resend records (10 min)**

1. 🟢 AUTO — Run `dig kentuckytreehouse.com NS +short` → expect Cloudflare nameservers
2. 🖐️ HITL — In Cloudflare dashboard → DNS → add the 3 Resend records documented above (all DNS-only, not Proxied)
3. 🖐️ HITL — Optional: edit existing `_dmarc` record content to add reporting address (`v=DMARC1; p=none; rua=mailto:david@zenforged.com`)
4. 🖐️ HITL — Resend dashboard → Domains → `kentuckytreehouse.com` → click Verify DNS records → expect all green within 5 min

**Phase 4 — SMTP credentials + Supabase wiring (5 min)**

1. 🖐️ HITL — Resend dashboard → API Keys or SMTP section → generate SMTP credentials. Note: SMTP creds specifically, not API key — Supabase needs SMTP protocol.
2. 🖐️ HITL — Paste the 4 values (host, port, user, pass) in chat so next-session Claude can verify them
3. 🟢 AUTO — Walk through Supabase dashboard → Authentication → SMTP Settings → enable custom SMTP → paste Resend creds → sender email `info@kentuckytreehouse.com` → sender name `Kentucky Treehouse` → save

**Phase 5 — End-to-end delivery test (5 min)**

Clear test email from Supabase first (Steps 1+2 of the cleanup doc in this file). Then from a logged-out browser:
1. `/vendor-request` → submit with Yahoo address → sign in as admin → approve → click magic link → expect landing on `/setup` in <30s
2. Same flow with Gmail → same expectation
3. If both arrive: 🟢 ship it, update Risk Register (Yahoo blocker → Resolved)
4. If either fails: triage deliverability (usually DMARC policy or DKIM alignment)

**Phase 6 — Close out the open loops**

1. 🖐️ HITL — Gmail-based QA of 2026-04-16 AM deploys (migrations + status filter fix) that never got verified on device — can likely be folded into Phase 5's Gmail test if that vendor record is the one being used
2. 🟢 AUTO — Update CLAUDE.md working/gaps sections; update Risk Register

### 🟡 Second (deferred from last session): `qa-agent` sub-agent build (S effort, High value, 🟢 Proceed)

Full scope captured in session 2 archive below. Still valid, still the right next move after Resend lands.

### Sprint 3 items (remaining)
Unchanged from last session — error monitoring (P1), vendor bio UI (P2), admin PIN production QA (P3), mall page vendor CTA (P4), find map overhaul (P5).

### Sprint 4 (not started)
Feed pagination, search, ToS/privacy, bookmarks persistence, `admin-cleanup` tool.

---

## ARCHIVE — What was done earlier today (2026-04-16 PM, session 2)
> Setup flow status-filter bug fix + Sprint 4 candidates captured

### The bug
After last session's migration to `/api/setup/lookup-vendor`, the approved test vendor (`dbutlerproductions@yahoo.com` → David Butler, All Peddlers booth 963) hit `/setup` and got a generic "No vendor account found for this email" error despite the vendor_request row being in `approved` state and the matching `vendors` row existing with `user_id IS NULL`.

Root cause: the handler filtered vendor_requests with `.eq("status", "pending")`. That filter is inverted for the setup flow — `approved` is exactly the state where a vendor *should* be able to link. The query returned zero rows, fell through to the empty-state 404, surfaced as "No vendor account found."

### Implementation
- Rewrote `/app/api/setup/lookup-vendor/route.ts`: `.eq("status", "pending")` → `.neq("status", "rejected")`. The vendor row's existence (with `user_id IS NULL`) is the real gate — not the request status. Only `rejected` should actively block.
- Moved the already-linked short-circuit to the top of the handler.
- Tightened error copy to distinguish three failure modes: "No vendor request found for this email" vs "Your vendor account isn't ready yet..." vs generic 500.

### Files modified
- `app/api/setup/lookup-vendor/route.ts`
- `CLAUDE.md`

### Blocked — end-to-end QA
Magic link delivery to `dbutlerproductions@yahoo.com` failed silently. Supabase auth logs showed dispatch success; email never arrived. Known Supabase default SMTP deliverability issue with Yahoo/AOL. Triggered the Resend setup work in session 3 (this session).

---

## ARCHIVE — Session 1 this morning (2026-04-16 AM)
> RLS-blocked vendor-request flow fix + admin API hardening

### Bug
Admin "Vendor Requests" tab rendered empty. Root cause: `vendor_requests` has service-role-only RLS policy. Three functions in `lib/posts.ts` (`getVendorRequests`, `markVendorRequestApproved`, `getVendorByEmail`) used browser anon client, which RLS silently blocked. `/setup` flow broken same way.

Pre-existing companion bug: `/api/admin/posts` had NO server-side auth check — UI gating was the only gate.

### Architectural decision committed
Ecosystem tables with service-role-only RLS (`vendor_requests`, any future equivalent) accessed ONLY via server API routes using service role key. Browser anon client is read-only for ecosystem data. All admin writes go through `/api/admin/*` with `requireAdmin`. Captured in `docs/DECISION_GATE.md` Tech Rules.

### Files created / modified
- `lib/adminAuth.ts` (new) — `getServiceClient`, `requireAuth`, `requireAdmin` helpers
- `lib/authFetch.ts` (new) — client bearer-token fetch wrapper
- `app/api/admin/vendor-requests/route.ts` (new) — GET list + POST approve, both requireAdmin-gated
- `app/api/setup/lookup-vendor/route.ts` (new — patched in session 2) — requireAuth, lookup + link in one call
- `app/api/admin/posts/route.ts` (hardened) — requireAdmin added to GET + DELETE; switched anon → service role
- `app/admin/page.tsx` (migrated) — all data access via authFetch to `/api/admin/*`
- `app/setup/page.tsx` (migrated) — single authFetch call to lookup-vendor
- `lib/posts.ts` — five functions marked @deprecated
- `docs/DECISION_GATE.md` — Tech Rules + Risk Register updated

### Auth pattern (Option B — bearer header)
- Client: `lib/authFetch.ts` reads Supabase session, adds `Authorization: Bearer <access_token>`
- Server: `lib/adminAuth.ts` extracts bearer, validates via `service.auth.getUser(token)`, checks admin email

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

Planned additions (after Resend SMTP lands next session):
```
RESEND_SMTP_HOST                 (from Resend dashboard)
RESEND_SMTP_PORT                 (from Resend dashboard)
RESEND_SMTP_USER                 (from Resend dashboard)
RESEND_SMTP_PASS                 (from Resend dashboard)
```
Note: these live in Supabase Auth → SMTP Settings, not Vercel env. The Vercel app itself does not send mail — Supabase does.

---

## DNS STATE (as of 2026-04-16 late PM)

Captured here so next session doesn't re-do the archaeology.

**Registrar:** Tucows Domains Inc. (via unidentified reseller — resolve by email receipt search)
**Current live nameservers:** `ns-cloud-d1` through `ns-cloud-d4.googledomains.com` (Google Cloud DNS)
**Cloudflare assigned nameservers (pending activation):** `marissa.ns.cloudflare.com`, `vin.ns.cloudflare.com`
**DNSSEC status:** Off (confirmed `dig DNSKEY +short` returned empty — safe to migrate)

**Live records currently serving (via Google Cloud DNS, pre-imported into Cloudflare):**
- A `kentuckytreehouse.com` → `23.227.38.65` (Shopify)
- AAAA `kentuckytreehouse.com` → `2620:127:f00f:5::` (Shopify IPv6)
- CNAME `account` → `shops.myshopify.com` (Shopify proxy)
- CNAME `www` → `shops.myshopify.com`
- MX `kentuckytreehouse.com` → `mx.kentuckytreehouse.com` (inbound forwarding)
- TXT `_dmarc` → `v=DMARC1; p=none`
- TXT `kentuckytreehouse.com` → `v=spf1 include:_spf.hostedemail.com ~all` (root SPF for inbound)

**Live Google Cloud DNS zone location:** unknown — not in `kentuckytreehouse0001` GCP project (checked); likely in a different project on a different Google account. Not blocking — stays dormant after Cloudflare migration.

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
- **Pending vendor_requests (as of 2026-04-16):**
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
1. `vendors` table → filter `display_name = <n>` + verify `mall_id` matches before deleting
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
- **Magic link delivery broken for Yahoo/AOL addresses** — Supabase default SMTP dispatches but Yahoo drops/spam-bins. Fix in flight: Resend + Cloudflare-hosted DNS for `kentuckytreehouse.com`. DNS migration staged (Cloudflare ready, Tucows nameservers NOT yet swapped). Next session: complete nameserver swap, wait for propagation, add Resend records, verify, wire Supabase SMTP, end-to-end test.

### 🟡 Sprint 3 (in progress)
- No error monitoring — Priority 1
- Vendor bio field — no UI — Priority 2
- Admin PIN not QA'd in production — Priority 3
- Mall page vendor CTA — deferred (dark theme) — Priority 4
- Find Map overhaul — needs plan — Priority 5
- 2026-04-16 deploy not yet end-to-end verified on device — Gmail-based QA pending (fold into Resend verification flow next session)

### 🟢 Cleanup (not urgent)
- Deprecated vendor-request functions still in `lib/posts.ts` — remove once confirmed no other callers
- `/api/debug-vendor-requests` still in production — retire after QA settles
- Orphaned Google Cloud DNS zone for `kentuckytreehouse.com` — find and delete after Cloudflare migration completes and is verified
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

---
