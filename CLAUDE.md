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
> Last updated: 2026-04-17 (session 15 — design direction relocked; `docs/design-system.md` v1.0 committed; Find Detail spec locked in mockup; no production code changed)

**Status:** 🪴 **Session 15 was a design-direction session, not a feature session.** No production code changed. Two docs updated: `docs/design-system.md` rewritten v0.2 → v1.0 with full journal vocabulary committed; `docs/DECISION_GATE.md` updated with tagline anchor, refreshed Brand Rules, refreshed Design agent prompt, and updated Risk Register. Find Detail mockup landed after an extended iteration pass that redirected the entire design language.

### What shipped (2 doc updates, 0 code changes)

**`docs/design-system.md` — v0.2 → v1.0 full rewrite:**
- **Tagline anchor committed:** *Embrace the Search. Treasure the Find. Share the Story.* Operating voice: presence over pressure, story over speed, rooted in reality yet elevated for perspective. Threshold to the physical world, not a replacement for it.
- **Cartographic vocabulary committed:** the mall is a pin on the map, the booth is an X on the spot, connected by a thin vertical tick. Single reusable grammar for location across Find Detail, Booth page, Feed, Find Map.
- **Material vocabulary committed:** booth post-it as the one skeuomorphic signature per find (cream paper, slight rotation, soft shadow, placed top-left on photograph). Status pill as straight clarity marker (pill outline, near-primary ink, no rotation). Max two material objects per photograph.
- **Typography system rewritten:** IM Fell English is now the editorial voice (titles, captions, labels, booth numbers, mall names, status). Georgia retired from the ecosystem layer. Caveat reserved for rare handwritten beats — one per screen maximum. system-ui reserved for precise data (addresses, timestamps). Mono retired entirely.
- **Paper as surface:** no card chrome, no border halos around content. Section divisions via whitespace, hairline rules, and the diamond (`◆`) ornament. The cross (`✚`) divider was retired for religious connotations.
- **Find Detail spec locked:** masthead wordmark ("Treehouse *Finds*" centered), photograph with post-it top-left + status pill bottom-right, title + price (em-dash, softer ink on price), centered quoted caption, diamond divider, cartographic pin+X block with connecting tick, IM Fell English italic "Visit the shelf →" link with dotted underline, "more from this shelf…" thumbnails (no leading dash, trailing ellipsis).
- **v0.2 pattern retirement log:** `<LocationStatement>` deprecated. `<BoothLocationCTA>` deprecated. Four-button system retired. Georgia retired from ecosystem. Mono retired. Pulsing green status dot retired. Card pattern system retired. The word "Directions" as explicit link copy retired.
- **Copy commitments:** captions always in typographic quotation marks (“ ”), centered, italic — about *how it feels*, never *what it's made of*. Price named honestly after title in softer ink. No "might pair with" / "related items" language. No narrating the metaphor ("Turn back to the booth" was rejected for this reason; "Visit the shelf →" is the right voice).

**`docs/DECISION_GATE.md` — targeted updates:**
- Tagline inserted at the top of "The Vision" section as a committed brand anchor with operating voice
- Brand Rules table updated: Georgia rule replaced with IM Fell English / Caveat / system-ui commitments, paper-as-surface rule added, cartographic language rule added, material restraint rule added, captions-always-quoted rule added, no-narrating-the-metaphor rule added
- New STOP gate added: "UI change not scoped against `docs/design-system.md` v1.0" — mirrors the onboarding-journey drift-prevention rule
- Risk Register: added "Design direction drifted toward generic across sessions 12–14" as a resolved risk with session-15 context; added Booth page component deprecation as a tracked low-severity item; added `lib/tokens.ts` token additions as a tracked low-severity item pending Booth v1.0 sprint
- Design agent prompt rewritten to reflect v1.0 language — names the "canonical primitive trap" explicitly so the next Design agent doesn't fall back into v0.2 vocabulary
- Sprint Context: Design sprints now tracked as a parallel track to Sprint 4 tail
- Related Documents: updated to reflect design-system.md v1.0 status
- Tech Rules: "session close build check" rule (added session 14) is now documented here

### The design-direction redirection — narrative summary

Session 15 opened as a Find Detail polish sprint against v0.2 but evolved into a fundamental redirection of the entire design language. The trigger was David's pushback on the first mockup: the cards, buttons, and canonical primitives committed in v0.2 were producing "generic app" aesthetics regardless of small corrections. The session worked through extended iteration (6+ mockup passes on Find Detail alone) to find the real direction — a restrained field-journal voice rooted in:

1. **Material gestures, not UI components** — post-it note replacing a card-wrapped booth badge
2. **Cartographic language, not data display** — pin + X glyphs binding mall and booth as a zoom relationship, replacing the v0.2 `<LocationStatement>` icon+mono+separator grammar
3. **Editorial typography, not UI typography** — IM Fell English doing the work that v0.2 assigned 90% to system-ui
4. **Paper as surface, not cards on surface** — section dividers become typographic ornaments, not border halos
5. **Quoted captions as reflections** — captions are about *how it feels*, never specs
6. **One handwritten beat per screen** — Caveat reserved for margin notes that represent genuine human presence, not decoration
7. **Restraint is the discipline** — the journal metaphor fails when it becomes costume (paperclips, tape, brass fittings on every surface). It succeeds when a few load-bearing gestures carry the weight and everything else steps back.

The tagline **Embrace the Search. Treasure the Find. Share the Story.** emerged mid-session as the tiebreaker for every decision going forward.

### Implications for prior work

**Booth page (shipped session 14) needs a v1.0 second pass.** The components built and shipped in session 14 (`components/LocationStatement.tsx`, `components/BoothLocationCTA.tsx`, the updated `ShelfGrid.tsx` terminology pass, the `TabSwitcher` relabeling) remain functional in production but do not align with v1.0 language. The cartographic pin+X block replaces `<LocationStatement>`. The post-it + paper-as-surface treatment replaces `<BoothLocationCTA>`. Georgia → IM Fell English throughout. Tracked as a dedicated Design sprint after Find Detail code ships.

**No production breakage.** The deprecated components still render on `/my-shelf` and `/shelf/[slug]` exactly as they did at session-14 close. Users see no change. The deprecation is internal to the design system doc; code replacement is a separate sprint.

### Context for the next session

Two session-16 candidates, both independent of Sprint 4 tail:

**Session 16 candidate A — Find Detail code build against v1.0 spec.** The mockup is locked. `docs/design-system.md` v1.0 has the full spec. This session writes the `/find/[id]/page.tsx` rewrite: masthead wordmark, post-it, status pill, centered quoted caption, diamond divider, cartographic pin+X block, "Visit the shelf →" link, "more from this shelf…" thumbnails. Requires loading IM Fell English + Caveat fonts (Google Fonts), possibly inlining new token values that formalize later in the Booth sprint. Estimated ~3 hours including QA.

**Session 16 candidate B — Sprint 4 tail batch (T4c + T4b + T4d).** Copy polish, admin surface consolidation, pre-beta QA pass. ~5.5 hours of focused work. Boring-but-important; clears the pre-beta runway.

**Recommended:** 16A first. Momentum is on design after session 15's redirection, and Find Detail is the surface that proves the v1.0 language in production. Sprint 4 tail can batch afterward.

### Sprint 4 tail still queued

- 🟡 T4c remainder (copy polish): `/api/setup/lookup-vendor` error copy + `/vendor-request` success screen copy. ~30 min.
- 🟡 T4b admin surface consolidation: Add Booth tab in `/admin`, Add Vendor in-person flow, remove Admin PIN from `/login`, remove Booths from BottomNav, retire `AddBoothSheet` from `/shelves`. ~4 hours.
- 🟡 T4d pre-beta QA pass walking all three onboarding flows. ~1 hour.
- 🟢 Session 13 test data cleanup (5+ "David Butler" variants in DB). ~5 min SQL via `docs/admin-runbook.md` Recipe 4.

### Files touched this session
- `docs/design-system.md` — full rewrite v0.2 → v1.0
- `docs/DECISION_GATE.md` — tagline anchor added, Brand Rules updated, Design agent prompt refreshed, Risk Register updated, Tech Rule for session-close build check documented, STOP gate added for design-system drift
- `CLAUDE.md` (this file) — session 15 close

---

## ARCHIVE — What was done earlier (2026-04-17 late-night, session 14)
> Booth page v0.2 redesign shipped; `lib/imageUpload.ts` reconstructed

**Status:** 🌿 **Session 14 executed the Design agent's first Dev pass against `docs/design-system.md` v0.2.** Booth page redesign landed on both `/my-shelf` and `/shelf/[slug]`. Pre-existing build break on `@/lib/imageUpload` imports (orphaned from session 13's uncommitted image-upload migration) was diagnosed and fixed mid-session so everything ships together. Curator's Statement block was explicitly deferred pending vendor feedback — David's call, not a miss.

**Session-15 note on session 14 work:** The components shipped this session (`LocationStatement`, `BoothLocationCTA`, `ShelfGrid` rewrite, `TabSwitcher` relabeling) are still live in production and functional. As of session 15 they are *deprecated per `docs/design-system.md` v1.0* but remain in the repo. The Booth v1.0 second pass will replace them. Users see no change in the meantime.

### What shipped (one commit, multiple files)

**Session 14 design work:**
1. **`components/LocationStatement.tsx`** (NEW) — canonical location-pattern primitive per v0.2 spec. Deprecated in v1.0. 
2. **`components/BoothLocationCTA.tsx`** (NEW) — canonical CTA card variant. Deprecated in v1.0.
3. **`components/ShelfGrid.tsx`** (REWRITE) — three batched changes per v0.2: (a) grid gap 6 → `spacing.tileGap` (10), (b) `AvailableTile`: pure image, no title overlay, (c) `FoundTile`: 0.5 opacity + full grayscale + italic Georgia "Found a home" caption bottom-left on subtle gradient. Grid structure survives v1.0; Georgia caption will be swapped to IM Fell English in the Booth v1.0 pass.
4. **`components/TabSwitcher.tsx`** (EDIT) — inactive label "Found a home" → "Found homes" (plural) per v0.2 terminology table. Survives v1.0.
5. **`app/my-shelf/page.tsx`** (EDIT) — `BoothFinderCard` → `BoothLocationCTA`, address prop threaded from `mall?.address`, Found-homes empty-state copy removed.
6. **`app/shelf/[slug]/page.tsx`** (EDIT) — same treatment as `/my-shelf` for the public state.
7. **`components/BoothFinderCard.tsx`** (DELETED) — orphan after Task 6.

**Session 13 carry-ins (discovered mid-session, shipped together):**
8. **`lib/imageUpload.ts`** (NEW — reconstruction) — Session 13's CLAUDE.md documented this file as "single source of truth" but it was never actually committed. Reconstructed from the documented contract.
9. **`app/post/page.tsx`, `app/post/edit/[id]/page.tsx`, `app/post/preview/page.tsx`, `lib/posts.ts`** (pre-session mods) — session-13 image-upload migration work that was on disk but not committed.

### Task-4 ("titles on tiles") mockup-first protocol (session 14)
Before removing titles from `AvailableTile`, Claude generated a disposable side-by-side mockup showing current vs. v0.2. David approved the no-titles direction with eyes on the comparison. Worth keeping as a pattern: when a design-system change has a visible perceptual cost, mockup the change before code. This protocol continued in session 15 where the mockup-first approach caught the fundamental direction drift before any Find Detail code was written.

### `lib/imageUpload.ts` reconstruction — root cause + new tech rule
Session 13 closed without running `npm run build` before `thc`. CLAUDE.md was updated to describe the image-upload pattern as shipped, but the module itself was never created. New session-close tech rule (added to DECISION_GATE session 14, formalized session 15): *A session is not closed until `npm run build` has run green against the committed state of the repo.*

---

## ARCHIVE — What was done earlier (2026-04-17 late-night, session 13)
> KI-004 resolved, in-mall diagnostic tooling shipped, toast visual polish

**Status:** ✅✅✅ **Session 13 resolved a pre-beta blocker surfaced during live test.** KI-004 closed. In-mall diagnostic UI shipped. Admin runbook created. All 5 QA tests passed on device.

Key shipped: `app/api/admin/diagnose-request/route.ts` (NEW diagnostic endpoint), `app/api/admin/vendor-requests/route.ts` (REWRITE — constraint-aware approval), `app/admin/page.tsx` (REWRITE — Diagnose links, inline DiagnosisPanel, toast polish), `docs/admin-runbook.md` (NEW — 9 SQL recipes).

**Fix policy for vendor approval (still committed):**
- Booth collision + unlinked + name match → safe claim (reuse existing row)
- Booth collision + unlinked + name differs → reject with named details
- Booth collision + already linked → hard reject with named details
- Slug collision → auto-append `-2`, `-3`… up to 20 attempts
- All recovery paths use `.maybeSingle()` not `.single()`
- All error responses include `diagnosis` code + `conflict` object for admin UI rendering

**Toast visual polish — final state:** outer non-animated `<div>` does centering, inner `<motion.div>` animates opacity+y only with `pointer-events:auto`. zIndex 9999, solid opaque backgrounds, `boxShadow` opacity 0.18.

## Image uploads
- `lib/imageUpload.ts` is the single source of truth. Import `compressImage` and `uploadPostImageViaServer`. Never write another copy.
- `uploadPostImageViaServer` THROWS on failure. Callers MUST try/catch and abort the post/update on throw. Never write a post row with image_url: null.
- `lib/posts.ts:uploadPostImage` is deprecated (anon client, can't see bucket through RLS). Don't use.
- `lib/posts.ts:uploadVendorHeroImage` is orphaned. Safe to delete next sprint.

---

## ARCHIVE — What was done earlier (2026-04-17 late-night, session 12)
> Design agent's first full direction pass shipped; docs/design-system.md v0.2 committed

**Status:** 🪴 **Session 12 was the Design agent's first real pass.** No production code changed. One doc updated: `docs/design-system.md` moved from v0.1 scaffold to v0.2 with committed direction for cross-cutting primitives (typography, headers, buttons, cards, Location Statement) and four priority screens.

**Session-15 note on session 12 work:** v0.2 was rewritten in session 15 to v1.0. The v0.2 vocabulary (`<LocationStatement>`, `<BoothLocationCTA>`, four-button system, Georgia-as-primary-serif, mono for booth numbers) is retired per v1.0. The "Cards, Buttons, LocationStatement" framing of v0.2 produced generic marketplace aesthetics when actually composed — this was the core finding of session 15. v1.0 replaces the component-first framing with a language-first framing (cartographic pin+X, post-it material gesture, paper-as-surface, IM Fell English editorial voice).

---

## ARCHIVE — What was done earlier (2026-04-17 late-night, session 11)
> Design agent activated, design system scaffolded, agent orchestration tightened

**Status:** 🪴 **Session 11 was a system-infrastructure session, not a feature session.** Four docs updated to activate the Design agent and establish `docs/design-system.md` as canonical source of truth for all multi-screen UI work.

---

## ARCHIVE — What was done earlier (2026-04-17 late-night, session 10)
> /setup 401 race polish shipped; T4c orphan cleanup A/B/E shipped

**Status:** ✅✅ **Session 10 polished the onboarding journey that Session 9 unblocked.** Two commits shipped.

1. Orphan cleanup (T4c partial — A + B + E) — `app/page.tsx` EmptyFeed "Add a Booth" button removed; `app/my-shelf/page.tsx` NoBooth "Post a find" button removed; `app/api/debug-vendor-requests/route.ts` deleted.
2. `/setup` 401 race polish — `setupVendorAccount()` in `app/setup/page.tsx` now retries once with 800ms backoff on 401 response.

Verified `public/manifest.json` already has `"orientation": "portrait"`. Supabase cleanup pre-session: three-orphan cleanup SQL ran.

---

## ARCHIVE — What was done earlier (2026-04-17, session 9)

### Phase 1 — Warm-up commit: KI-001 + KI-002
**KI-001** — `app/login/page.tsx` `handlePin()` final `router.replace("/my-shelf")` → `router.replace("/admin")`.
**KI-002** — `app/admin/page.tsx` approval toast rewrapped in the known-good centering pattern.

### Phase 2 — KI-003 diagnosis
Clean-slate Flow 2 repro revealed two cascading bugs: `/login` mount useEffect read `searchParams.get("next")` but approval email uses `?redirect=/setup`; approve endpoint's 23505 duplicate-key handler silently reuses existing vendors row on booth collision (deferred as KI-004, now RESOLVED session 13).

### Phase 3 — KI-003 three-part fix
Fix 1: `app/login/page.tsx` — mount useEffect + `onAuthChange` callback now read `searchParams.get("redirect") ?? searchParams.get("next")`.
Fix 2: `app/post/page.tsx` — identity resolution useEffect no longer falls through to `safeStorage.getItem(LOCAL_VENDOR_KEY)` when `uid` is truthy.
Fix 3: `app/my-shelf/page.tsx` — non-admin signed-in users with no linked vendor now call `/api/setup/lookup-vendor` as self-heal before falling through to NoBooth.

### Phase 4 — `/setup` 401 diagnosis → diagnostic logging
Added three targeted `console.error` log lines to `lib/adminAuth.ts` `requireAuth()` for 401 branch observability.

### Phase 5 — End-to-end verification
Flow 2 onboarding end-to-end verified working on iPhone.

---

## ARCHIVE — What was done earlier (2026-04-17 late-late evening, session 8)
> Onboarding scope-out + T4a email infrastructure shipped end-to-end

### Phase 1 — Onboarding scope-out (Product Agent, no code)
`docs/onboarding-journey.md` created as canonical spec. Three flows committed: Pre-Seeded, Demo, Vendor-Initiated.

### Phase 2 — T4a email infrastructure
New file `lib/email.ts` (~260 lines) — Resend REST API wrapper. Wired into `app/api/vendor-request/route.ts` + `app/api/admin/vendor-requests/route.ts`. End-to-end QA verified in production.

### Phase 3 — QA issues logged
KI-001, KI-002, KI-003 logged to `docs/known-issues.md`.

---

## ARCHIVE — Earlier sessions (1–7)
> Condensed — full history available in git log

- **Session 7** — `/admin` mobile-first approval polish (T3); full database reset; QA pass exposed onboarding fragility
- **Session 6** — Custom domain `app.kentuckytreehouse.com` live; OTP 6-digit code entry primary auth path; meta-agent work (Dev · Product · Docs active)
- **Session 5** — `emailRedirectTo` fix + strategic Sprint 4+ scoping; `safeRedirect(next, fallback)` helper
- **Session 4** — DNS pivot Path B → Path A (Shopify authoritative); Resend → Supabase SMTP; Yahoo magic link verified
- **Session 3** — Resend account setup; DNS migration decision (later reversed in session 4)
- **Session 2** — Setup flow status-filter bug fix
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

**Tagline (committed session 15):** *Embrace the Search. Treasure the Find. Share the Story.* Anchored in `docs/DECISION_GATE.md`.

**Onboarding canonical spec:** See `docs/onboarding-journey.md` for the three committed flows (Pre-Seeded, Demo, Vendor-Initiated).

**Design canonical spec:** See `docs/design-system.md` v1.0 for the visual + interaction system. All multi-screen UI work scopes against it before code. v1.0 (session 15) committed journal vocabulary: cartographic pin+X, IM Fell English editorial voice, post-it material gesture, paper-as-surface.

**Admin runbook:** See `docs/admin-runbook.md` for in-mall SQL triage recipes.

---

## STACK
```
Next.js 14 App Router · TypeScript · Tailwind CSS · Framer Motion
Anthropic SDK (claude-opus-4-5) · Supabase (Postgres + Storage + Auth) · SerpAPI · Vercel
lucide-react (Heart, Send, Store, Home, LayoutGrid, Stethoscope icons in ecosystem UI)
Resend (dual use: SMTP provider for Supabase Auth OTP emails,
         AND direct Resend REST API for transactional emails via lib/email.ts)

Design v1.0 fonts (session 16+ code build):
  IM Fell English (editorial voice) · Caveat (rare handwritten beats) · system-ui (precise data)
  Loaded via Google Fonts.
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

Key records (via Shopify DNS): A `@` → `23.227.38.65`, CNAME `app` → Vercel, Resend DKIM + SPF + MX on `send`/`resend._domainkey`. Full record list in session-14 archive.

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
- **Unique constraints on vendors** (ALL FOUR):
  - `vendors_pkey` PRIMARY KEY (id)
  - `vendors_slug_key` UNIQUE (slug) — globally unique; auto-suffix on collision per session 13
  - `vendors_mall_booth_unique` UNIQUE (mall_id, booth_number) — pre-flight checked on approve
  - `vendors_user_id_key` UNIQUE (user_id) — one vendor row per auth user

---

## AUTH & SERVER API PATTERN

**Client → Server auth bridge (Option B — bearer header):**
- Client: import `authFetch` from `@/lib/authFetch`
- Server: first line of every `/api/admin/*` handler: `const auth = await requireAdmin(req); if (!auth.ok) return auth.response;`
- For auth-required-but-not-admin routes: `requireAuth()`

**Redirect-preservation pattern (session 5):**
- `lib/auth.ts → sendMagicLink(email, redirectTo?)` appends path as `&next=`
- `app/login/page.tsx → safeRedirect(next, fallback)` validates same-origin relative paths only

**Email pattern (session 8):**
- `lib/email.ts` — Resend REST API wrapper. Best-effort delivery.

**Vendor approval pattern (session 13 — KI-004):**
- `/api/admin/vendor-requests` POST performs pre-flight booth check before insert
- Slug collisions auto-resolve via suffix loop
- All collision errors return `{error, diagnosis, conflict}` for UI rendering

---

## WORKING ✅
- Discovery feed, magic link auth, Admin PIN login, OTP delivery
- Magic link `?redirect=` param preserved across round trip
- My Booth, Post flow, Post preview, Find detail, Public shelf
- Vendor request flow, Vendor account setup, admin approval workflow
- RLS — 12 policies + vendor_requests (service role only)
- Rate limiting — `/api/post-caption` 10 req/60s, `/api/vendor-request` 3 req/10min
- Custom domain `app.kentuckytreehouse.com`
- Branded email templates for Magic Link and Confirm Signup
- Agent roster: Dev · Product · Docs · Design active
- KI-001, KI-002, KI-003, KI-004 all resolved
- Flow 2 onboarding end-to-end verified working on iPhone
- `/setup` 401 race absorbed with retry+backoff
- Design agent activated, `docs/design-system.md` v1.0 committed (session 15)
- Admin diagnostic UI, `docs/admin-runbook.md` with 9 SQL recipes
- Booth page redesign (v0.2 language) — shipped session 14, functional in production, marked deprecated in v1.0 spec pending second pass

## KNOWN GAPS ⚠️

### 🔴 Pre-beta blockers
_None as of session 15 close._

### 🟡 Sprint 4 remainder
- 🟡 T4c remainder (copy polish) — `/api/setup/lookup-vendor` error copy + `/vendor-request` success screen copy. ~30 min.
- 🟡 T4b — admin surface consolidation. ~4 hours.
- 🟡 T4d — pre-beta QA pass walking all three flows end-to-end.
- 🟢 Session 13 test data cleanup — 5+ "David Butler" variants in DB. ~5 min SQL via admin-runbook Recipe 4.

### 🟡 Design v1.0 execution (sessions 16+)
- **Session 16 candidate A** — Find Detail code build against v1.0 spec. Mockup locked session 15.
- **Session 17 candidate** — Booth page v1.0 second pass (replaces `<LocationStatement>` + `<BoothLocationCTA>`, swaps Georgia → IM Fell English, applies cartographic pin+X, masthead wordmark).
- **Session 18 candidate** — Feed header + `<MallSheet>` bottom sheet pattern against v1.0.
- **Session 19 candidate** — Find Map emotional redesign against v1.0.
- **Session 20 candidate** — Cleanup pass: inline Georgia → IM Fell English on chrome; inline `C` objects → `colors` import; magic-number spacing → spacing tokens; `lib/tokens.ts` additions for post-it/ink scale.

### 🟡 Sprint 3 leftovers still pending beta invites
- Error monitoring (Sentry or structured logs)
- Hero image upload size guard — verify coverage
- Feed content seeding (10–15 real posts) — required before beta invite
- Beta feedback mechanism (Tally.so link)

### 🟡 Sprint 5 (guest-user UX + onboarding polish — parked)
- Rename "Sign In" → "Curator Sign In" + `/welcome` guest-friendly landing
- PWA install onboarding experience
- Vendor onboarding Loom/doc
- Bookmarks persistence (localStorage → DB-backed)

### 🟢 Sprint 6+ (parked)
- "Claim this booth" flow for Flow 1 pre-seeded vendors
- QR-code approval handshake
- Universal Links setup (iOS `apple-app-site-association`)
- Native app evaluation
- `admin-cleanup` tool (collapse the 3-table SQL reset to one click)
- Feed pagination, search, ToS/privacy
- Mall page vendor CTA, vendor directory, Find Map overhaul

### 🟢 Cleanup (not urgent)
- Deprecated vendor-request functions still in `lib/posts.ts`
- Cloudflare nameservers — dormant, no cost
- `/shelves` AddBoothSheet — orphan after T4b ships
- `docs/VENDOR_SETUP_EMAIL_TEMPLATE.md` — obsolete since T4a
- Design v0.2 components deprecated but still in code (`LocationStatement`, `BoothLocationCTA`) — replaced in Booth v1.0 sprint

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

Check Supabase auth logs:
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

Check DNS state:

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
