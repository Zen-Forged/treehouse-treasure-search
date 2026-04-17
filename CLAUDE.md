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
> Last updated: 2026-04-17 late-night (session 12 — Design agent's first full direction pass shipped; docs/design-system.md v0.2 committed)

**Status:** 🪴 **Session 12 was the Design agent's first real pass.** No production code changed. One doc updated: `docs/design-system.md` moved from v0.1 scaffold to v0.2 with committed direction for cross-cutting primitives (typography, headers, buttons, cards, Location Statement) and four priority screens (Booth page both states, Find Detail, Feed header + mall sheet, Find Map). Two mockups generated for Booth page public + owner states. Session 13 can open with a crisp Dev sprint brief against v0.2.

### What shipped (1 commit, 1 file)
1. **`docs/design-system.md`** — v0.1 scaffold → v0.2 direction pass. Six unresolved sections resolved: Booth page direction, Find Detail direction, Feed header + mall selector, Find Map emotional redesign, Header pattern system, Button system, Card pattern system, Location statement pattern. One deferred section explicitly marked PENDING with triggers: featured tiles, 2-column editorial grid, portrait-aspect variety, mall page, vendor directory, onboarding visual pass, `/admin` visual pass, dark mode, cleanup pass.
2. **`CLAUDE.md`** (this file) — session 12 close note.

### Key commitments for Dev agent to execute against

**Cross-cutting primitives (all committed):**
- **Typography:** Georgia reserved for emotional beats only (hero vendor names, find titles, curator's statements, pull-quote captions, empty-state headlines). system-ui carries ~90% of the chrome (eyebrows, meta, tabs, buttons, body, labels). Mono for booth numbers and data.
- **Header modes:** A (cinematic, over hero image — Booth, Find Detail), B (editorial, sticky blur with logo — Feed, Find Map, admin), C (minimal, back + title — forms and onboarding).
- **Buttons:** 4 variants — Primary (filled green), Secondary (green-tinted bg), Ghost (transparent + border), Link (inline green). Destructive variant = Ghost with red.
- **Cards:** 1 canonical base (surface + border + radius.md + no shadow) with 4 composition variants (Plain, Thumbnail, Metric, CTA).
- **`<LocationStatement>` component:** single-line format `⌂ Booth 369 · Mall name · City` with optional address + Directions link. Compact variant (white, over images) and full variant (inside cards).
- **Terminology:** "Mall" everywhere in UI (Treehouse Spot retired entirely). "On Display" / "Found homes" for tabs. Georgia italic "Found a home" caption for sold tiles.

**Booth page direction (both states):**
- Header Mode A (cinematic hero, no sticky bar)
- 3-column 1:1 square grid preserved — no titles or meta on/under tiles (tap through for the story) — supports future 9-item free-tier limit and matches older-vendor familiar mental model
- Curator's statement (Georgia italic 16px pull-quote) directly under hero
- Tabs "On Display" / "Found homes" (existing TabSwitcher, relabeled)
- Owner "Add" tile as first square in On Display grid (emptyTile bg, dashed green border)
- Sold tiles: 0.5 opacity + grayscale + small italic "Found a home" caption in bottom-left (one exception to no-text-on-tiles rule)
- Location CTA card at bottom: full Location Statement + "Explore the full mall" Secondary button with vendor-hue swatch
- Owner-only: edit-banner pencil top-left of hero, "Edit your story" Link below curator's statement, "Add" tile, Home · My Booth nav

**Find Detail fixes:**
- Title: 28px Georgia 700 (dominant)
- Caption: 17px Georgia italic (pull-quote)
- Availability: floating pill bottom-left on hero image, out of content flow
- Location card: single `<LocationStatement>` full-form + full-width Secondary "Explore {vendor}'s shelf →" with hue swatch

**Feed header + mall sheet:**
- Mode B header: logo + wordmark left, quiet user-circle icon top-right (32×32 ghost)
- Sign-in icon opens bottom sheet (Curator Sign In / Request booth access / browse copy)
- Mall selector becomes `<MallSheet>` — search + scrollable list + "All Malls" default. Canonical bottom-sheet pattern — reused on Find Map filter, /post, /vendor-request.

**Find Map emotional pass:**
- Opening italic Georgia pull-quote ("A Saturday made of stops")
- Dotted green spine at 0.30 alpha, `PiLeaf` icons at each stop, mono "~ 8 min drive" between stops
- Stop cards as canonical CTA card variant
- Bottom "Open all N stops in Maps →" Secondary button (multi-waypoint Apple Maps URL)

### Context for the next session

Session 12 produced direction. Session 13 produces code. The recommended first implementation session is the Booth page redesign, because:
- It consolidates the most new primitives in one place (`<LocationStatement>`, CTA card variant, Curator's Statement block, terminology commitments)
- It's the highest-leverage page for vendor pride — what they'll text friends
- It's bounded (both states already exist in `app/my-shelf/page.tsx` and `app/shelf/[slug]/page.tsx` — this is a redesign of existing surfaces, not new routes)

Estimated session 13 scope (~3–4 hours):
1. Build `<LocationStatement>` component (~30 min)
2. Update `/my-shelf` and `/shelf/[slug]` to new Booth direction (~90 min)
3. Add Curator's Statement block with read-only/ghost states (~45 min)
4. Update BoothFinderCard → CTA card variant at bottom of Booth page (~30 min)
5. Terminology pass: "Sold" / "Available" → "Found homes" / "On Display" on affected surfaces (~15 min)
6. QA + deploy (~30 min)

**NOT in session 13 scope (explicitly deferred):**
- Find Detail redesign (separate session — depends on Location Statement component from session 13)
- Feed header + mall bottom sheet (separate session — bottom sheet is its own bounded piece)
- Find Map redesign (separate session — emotional pass, needs dedicated energy)
- Typography cleanup pass across all pages (separate dedicated session post-Booth)
- Any PENDING items

### Review calls settled this session
- **Typography split** → Georgia emotional beats only. System-ui for chrome. ✅
- **Booth grid** → 3-column 1:1 square preserved (not 2-column editorial). Preserves 9-item free-tier narrative, matches older-vendor mental model. ✅
- **Title treatment on Booth grid** → No titles or meta on/under tiles. Pure images, tap through for the story. ✅
- **Featured tiles** → Deferred to PENDING. All tiles same 1:1 square at launch. ✅
- **"Treehouse Spot" terminology** → Retired from product entirely. "Mall" everywhere. ✅

### Files modified this session
- `docs/design-system.md` — v0.1 → v0.2 (full rewrite, direction committed)
- `CLAUDE.md` (this file) — session 12 close

---

## 🌿 Next session opener — Session 13 Booth page redesign (READ FIRST)

**Session 12 produced unambiguous direction for the Booth page. Session 13 executes.**

Recommended session 13 opener:

```
CURRENT ISSUE:
Booth page redesign against docs/design-system.md v0.2. Scope: /my-shelf and /shelf/[slug]. Build <LocationStatement> component, add Curator's Statement block (Georgia italic pull-quote), convert BoothFinderCard to CTA card variant at bottom with full-form Location Statement + "Explore the full mall" Secondary button, terminology pass to "On Display" / "Found homes" / "Found a home". 3-col 1:1 grid preserved with no titles on tiles. Owner "Add" tile as first square. Mode A cinematic header unchanged. Do NOT touch Find Detail, Feed header, or Find Map — those are separate sessions. Start with a Sprint Brief, get approval, then execute.
```

**Before that session begins, David should:**
- Re-read the Booth page section of `docs/design-system.md` on his phone to see if the direction still reads well after a night's sleep
- Flag anything to revisit before code starts

---

## ARCHIVE — What was done earlier (2026-04-17 late-night, session 11)
> Design agent activated, design system scaffolded, agent orchestration tightened

**Status:** 🪴 **Session 11 was a system-infrastructure session, not a feature session.** No production code changed. Four docs updated to activate the Design agent and establish `docs/design-system.md` as canonical source of truth for all multi-screen UI work.

### What shipped (1 commit, 4 files)
1. **`docs/DECISION_GATE.md`** — Agent Roster expanded to include Design agent with full system prompt draft; new Tech Rule added ("Multi-screen UI work… must scope against `docs/design-system.md` before code" — mirrors the onboarding-journey rule pattern); standup preamble updated; Related Documents table updated.
2. **`MASTER_PROMPT.md`** — Session opening standup now includes a Design agent standup (step 3, conditional on UI work being in scope). Standup report template updated with `Active agents` and `Design check` lines. New DESIGN AGENT section added after SESSION OPENING STANDUP explaining the agent's scope, what it does at session open, what it never does, and how the design system gets updated.
3. **`docs/design-system.md`** — Scaffolded. Contains: purpose, brand metaphor, currently-committed tokens/typography/terminology/motion/interaction commitments (pulled from `lib/tokens.ts` and DECISION_GATE Brand Rules), and a set of **unresolved sections** (Booth page direction, Find Detail direction, Feed header / mall selector direction, Find Map emotional redesign, Header pattern system, Button system, Card pattern system, Location statement pattern) that the Design agent's first real pass will fill in. Explicitly labeled v0.1 (scaffold, not yet authoritative) so no one mistakes the doc for complete direction.
4. **`CLAUDE.md`** — session 11 close note.

### Context

Session 11 was triggered by a strategic conversation about why per-screen design work across sessions 1–10 produced drift — three themes, inconsistent sold terminology, four button styles, a Booth page that doesn't inspire vendor pride. David named the orchestration problem directly: we need an agent that holds the whole visual system in its head, not just better mockups per page. This session activated that agent and put its scope document in place; session 12 did the actual design direction work.

---

## ARCHIVE — What was done earlier (2026-04-17 late-night, session 10)
> /setup 401 race polish shipped; T4c orphan cleanup A/B/E shipped; onboarding journey is now both working AND clean end-to-end

**Status:** ✅✅ **Session 10 polished the onboarding journey that Session 9 unblocked.** Two commits shipped.

### What shipped (2 commits)
1. **Orphan cleanup (T4c partial — A + B + E)** — `app/page.tsx` EmptyFeed "Add a Booth" button removed; `app/my-shelf/page.tsx` NoBooth "Post a find" button removed; `app/api/debug-vendor-requests/route.ts` deleted.
2. **`/setup` 401 race polish** — `setupVendorAccount()` in `app/setup/page.tsx` now retries once with 800ms backoff on 401 response. Absorbs the ~500ms Supabase token-replication window that was flashing "Setup Incomplete" before `/my-shelf` self-heal caught it.

### Orientation lock check (no-op discovery)
Verified `public/manifest.json` already has `"orientation": "portrait"` on line 8 — locks installed PWA.

### Supabase cleanup (pre-session)
Three-orphan cleanup SQL ran before coding: `John Doe / 1234`, `Claude Code / 123`, `David Butler / 123 at AAM` deleted. KI-004 collision hazards cleared.

---

## ARCHIVE — What was done earlier (2026-04-17, session 9)

### Phase 1 — Warm-up commit: KI-001 + KI-002
**KI-001** — `app/login/page.tsx` `handlePin()` final `router.replace("/my-shelf")` → `router.replace("/admin")`.
**KI-002** — `app/admin/page.tsx` approval toast rewrapped in the known-good centering pattern (outer non-animated div does `position:fixed; left:0; right:0; flex justifyContent:center`, inner motion.div animates only opacity+y).

### Phase 2 — KI-003 diagnosis
Clean-slate Flow 2 repro revealed two cascading bugs: `/login` mount useEffect read `searchParams.get("next")` but approval email uses `?redirect=/setup`; approve endpoint's 23505 duplicate-key handler silently reuses existing vendors row on booth collision (deferred as KI-004).

### Phase 3 — KI-003 three-part fix
Fix 1: `app/login/page.tsx` — mount useEffect + `onAuthChange` callback now read `searchParams.get("redirect") ?? searchParams.get("next")`.
Fix 2: `app/post/page.tsx` — identity resolution useEffect no longer falls through to `safeStorage.getItem(LOCAL_VENDOR_KEY)` when `uid` is truthy.
Fix 3: `app/my-shelf/page.tsx` — non-admin signed-in users with no linked vendor now call `/api/setup/lookup-vendor` as self-heal before falling through to NoBooth.

### Phase 4 — `/setup` 401 diagnosis → diagnostic logging
Added three targeted `console.error` log lines to `lib/adminAuth.ts` `requireAuth()` for 401 branch observability. Retry-with-backoff deferred to session 10.

### Phase 5 — End-to-end verification
Flow 2 onboarding end-to-end verified working on iPhone.

---

## ARCHIVE — What was done earlier (2026-04-17 late-late evening, session 8)
> Onboarding scope-out + T4a email infrastructure shipped end-to-end

### Phase 1 — Onboarding scope-out (Product Agent, no code)
- **`docs/onboarding-journey.md`** created as canonical spec. Three flows committed: Pre-Seeded, Demo, Vendor-Initiated.

### Phase 2 — T4a email infrastructure
- **New file: `lib/email.ts`** (~260 lines) — Resend REST API wrapper
- **Wired into:** `app/api/vendor-request/route.ts` + `app/api/admin/vendor-requests/route.ts`
- **End-to-end QA verified:** Email #1 (receipt) and Email #2 (approval) both arriving in production

### Phase 3 — QA issues logged
KI-001, KI-002, KI-003 logged to `docs/known-issues.md`.

---

## ARCHIVE — What was done earlier (2026-04-17 late evening, session 7)
> Sprint 4 T3 shipped, onboarding fragility exposed, scope-out flagged

### T3 — `/admin` mobile-first approval polish ✅
Rewrote `app/admin/page.tsx` to polish the in-person approval moment. Removed obsolete copy-paste email template flow.

### Database reset — full clean slate
Executed 7-block SQL cleanup. Plus storage pass deleting 25 orphaned image files.

### QA pass findings — three onboarding failures from one clean slate
1. Approve endpoint sent no email
2. No organic path to `/setup` from `/login`
3. `/my-shelf` showed stale localStorage identity after device cache survived DB reset

---

## ARCHIVE — Earlier sessions (1–6)
> Condensed for brevity — full history available in git log

- **Session 6** — Custom domain `app.kentuckytreehouse.com` live; OTP 6-digit code entry primary auth path; meta-agent work (Dev · Product · Docs active)
- **Session 5** — `emailRedirectTo` fix + strategic Sprint 4+ scoping; `safeRedirect(next, fallback)` helper
- **Session 4** — DNS pivot Path B → Path A (Shopify authoritative); Resend → Supabase SMTP; Yahoo magic link verified
- **Session 3** — Resend account setup; DNS migration decision (later reversed in session 4)
- **Session 2** — Setup flow status-filter bug fix: `lookup-vendor` `.eq("status", "pending")` → `.neq("status", "rejected")`
- **Session 1** — RLS-blocked vendor-request flow fix; admin API hardening with `requireAdmin` + service role

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

**Onboarding canonical spec:** See `docs/onboarding-journey.md` for the three committed flows (Pre-Seeded, Demo, Vendor-Initiated).

**Design canonical spec:** See `docs/design-system.md` v0.2 for the visual + interaction system. All multi-screen UI work scopes against it before code.

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

**SMTP note:** Resend SMTP credentials live in Supabase Auth → SMTP Settings (for OTP emails). Resend API key in Vercel env (for `lib/email.ts` transactional emails).

---

## DNS STATE (as of 2026-04-17)

**Registrar:** Squarespace Domains
**Authoritative nameservers:** Shopify's default nameservers
**DNSSEC:** Off

**Live records (via Shopify DNS):**
- A `kentuckytreehouse.com` → `23.227.38.65` (Shopify)
- AAAA `kentuckytreehouse.com` → `2620:0127:f00f:5::`
- CNAME `www` → `shops.myshopify.com`
- CNAME `account` → `shops.myshopify.com`
- CNAME `app` → `d21d0d632a8983e0.vercel-dns-017.com.` (Vercel)
- CNAME DKIM records for Shopify email
- MX `@` → `mx.kentuckytreehouse.com.cust.b.hostedemail.com` priority 1
- TXT `_provider` → `shopify`
- TXT `_dmarc` → `v=DMARC1; p=none`
- TXT `@` → `v=spf1 include:_spf.hostedemail.com ~all`
- TXT `resend._domainkey` → `v=DKIM1; k=rsa; p=MIGfMA0G...` (Resend DKIM)
- TXT `send` → `v=spf1 include:amazonses.com ~all` (Resend SPF)
- MX `send` → `feedback-smtp.us-east-1.amazonses.com` priority 10

**Dormant:** Cloudflare account has nameservers assigned but is not authoritative. Leftover from session 3's Path B plan.

---

## SUPABASE
- **Tables:** malls, vendors, posts, vendor_requests — RLS ENABLED ✅
- **vendor_requests RLS:** service-role-only (`USING (false) WITH CHECK (false)`) — must be accessed via `/api/*` routes
- **Storage bucket:** post-images — PUBLIC
- **Auth:** Magic link (OTP) via email, 6-digit code entry is primary path since session 6.
- **Malls:** 29 locations seeded (KY + Clarksville IN)
- **Primary mall:** America's Antique Mall, id: `19a8ff7e-cb45-491f-9451-878e2dde5bf4`, slug: `americas-antique-mall`
- **Extra columns vendors:** `facebook_url text`, `user_id uuid`, `hero_image_url text`, `bio text`
- **Unique constraint vendors:** `vendors_mall_booth_unique` on `(mall_id, booth_number)`
- **Unique constraint malls:** `malls_slug_key` on `(slug)`

---

## AUTH & SERVER API PATTERN

**Client → Server auth bridge (Option B — bearer header):**
- Client: import `authFetch` from `@/lib/authFetch`
- Server: first line of every `/api/admin/*` handler: `const auth = await requireAdmin(req); if (!auth.ok) return auth.response;`
- For auth-required-but-not-admin routes: `requireAuth()`

**Redirect-preservation pattern (session 5):**
- `lib/auth.ts → sendMagicLink(email, redirectTo?)` appends path as `&next=`
- `app/login/page.tsx → safeRedirect(next, fallback)` validates same-origin relative paths only

**Email pattern (session 8 — T4a):**
- `lib/email.ts` — Resend REST API wrapper, two functions: `sendRequestReceived`, `sendApprovalInstructions`
- Best-effort delivery — callers never fail HTTP response on email error

---

## HOW TO CLEAR AN EMAIL FROM SUPABASE (for QA iterations)
> ⚠️ CAUTION: In session 4 the `vendor_requests` row was accidentally deleted during cleanup. Use the SQL diagnostic pattern below.

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

**Step 3 — Unlink a vendor row without deleting it**
```sql
UPDATE public.vendors SET user_id = NULL WHERE display_name = 'TARGET_NAME' RETURNING id, display_name, user_id;
```

---

## WORKING ✅
- Discovery feed — masonry, scroll restore, spring-tap, warmth hover, back-nav anchor
- Feed footer — vendor CTA "Request booth access →" → `/vendor-request`
- Magic link auth + Admin PIN login
- Magic link delivery via Resend SMTP — verified end-to-end for Yahoo
- Magic link `?redirect=` param preserved across round trip
- My Booth — hero upload, vendor switcher, Send icon
- Post flow — AI caption, price validation, image upload
- Post preview — full image (no crop), edit pill buttons on title/caption/price
- Find detail — layered drift-in, booth LEFT / mall RIGHT, no address underline
- Public shelf — share button always visible (no auth required)
- Vendor request flow — `/vendor-request` form + success screen + API route
- Vendor account setup — admin approval workflow, setup page
- RLS — 12 policies + vendor_requests (service role only)
- Rate limiting — `/api/post-caption` 10 req/60s, `/api/vendor-request` 3 req/10min
- PWA manifest
- MASTER_PROMPT.md — HITL standard + Product Agent + Blocker Protocol
- Notion Roadmap — seeded
- Investor update system — Drive folder + first PDF + Notion process doc
- Custom domain `app.kentuckytreehouse.com` (session 6)
- OTP 6-digit code entry as primary auth path (session 6)
- Branded email templates for Magic Link and Confirm Signup (session 6)
- Agent roster: Dev · Product · Docs · Design active (session 11)
- KI-001, KI-002, KI-003 all resolved (session 9)
- Flow 2 onboarding end-to-end verified working on iPhone (session 9)
- `/setup` 401 race absorbed with retry+backoff (session 10)
- Shopper path de-orphaned (session 10)
- `/api/debug-vendor-requests` retired (session 10)
- PWA orientation lock verified (session 10)
- Design agent activated, `docs/design-system.md` v0.1 scaffolded (session 11)
- `docs/design-system.md` v0.2 — full direction pass for Booth, Find Detail, Feed header, Find Map, plus cross-cutting primitives (session 12)

## KNOWN GAPS ⚠️

### 🔴 Pre-beta blockers
_None as of session 10 close._ No blockers remain; Sprint 4 is in polish-and-consolidation territory.

### 🟡 Sprint 4 remainder
- 🟡 T4c remainder (copy polish) — orphans C + D: `/api/setup/lookup-vendor` error copy + `/vendor-request` success screen copy. Focused copy session.
- 🟡 T4b — admin surface consolidation (Add Booth tab in /admin, Add Vendor in-person flow, remove Admin PIN from /login, remove Booths from BottomNav, retire `AddBoothSheet` from /shelves) — ~4 hours.
- 🟡 T4d — pre-beta QA pass walking all three flows end-to-end against `docs/onboarding-journey.md`.
- **KI-004** — approve-endpoint 23505 silent-reuse. Needs a dedicated scoping session per David's call (pre-seeding → claim-booth flow model). Not urgent.

### 🟡 Design execution (new as of session 12)
- **Session 13 candidate (recommended next):** Booth page redesign against `docs/design-system.md` v0.2. Build `<LocationStatement>`, add Curator's Statement block, convert BoothFinderCard to CTA card variant, terminology pass.
- **Session 14 candidate:** Find Detail polish (hierarchy fix + single Location Statement + weighted "Explore the Booth" button).
- **Session 15 candidate:** Feed header + mall bottom sheet (`<MallSheet>` as canonical bottom-sheet pattern).
- **Session 16 candidate:** Find Map emotional redesign.

Sprint 3 leftovers still pending beta invites:
- Error monitoring (Sentry or structured logs)
- Vendor bio UI — partly superseded by Curator's Statement design direction, but the tap-to-edit + public display still needs to ship
- Hero image upload size guard (12MB client check) — verify coverage
- Feed content seeding (10–15 real posts) — required before beta invite
- Beta feedback mechanism (Tally.so link)

### 🟡 Sprint 5 (guest-user UX + onboarding polish — parked)
- Rename "Sign In" → "Curator Sign In" everywhere + `/welcome` guest-friendly landing for signed-in non-vendors
- PWA install onboarding experience
- Vendor onboarding Loom/doc
- Bookmarks persistence (localStorage → DB-backed, ITP wipe mitigation)

### 🟢 Sprint 6+ (parked)
- "Claim this booth" flow for Flow 1 pre-seeded vendors
- QR-code approval handshake
- Universal Links setup (iOS `apple-app-site-association`)
- Native app evaluation (Capacitor/Expo/React Native wrapper)
- `admin-cleanup` tool (collapse the 3-table SQL reset to one click)
- Feed pagination, search, ToS/privacy
- Mall page vendor CTA, Find Map overhaul

### 🟢 Cleanup (not urgent)
- Deprecated vendor-request functions still in `lib/posts.ts`
- Cloudflare nameservers for `kentuckytreehouse.com` — dormant, no cost
- `/shelves` AddBoothSheet — orphan after T4b ships, remove then
- `docs/VENDOR_SETUP_EMAIL_TEMPLATE.md` — obsolete since T4a
- Design cleanup pass: inline Georgia → system-ui on chrome; inline `C` color objects → `colors` import; magic-number spacing → spacing tokens — bundled as a single dedicated session post-Booth redesign

---

## DEBUGGING

Run one at a time:

```bash
curl -s https://treehouse-treasure-search.vercel.app/api/debug | python3 -m json.tool
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

Check Vercel function logs:

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

---
