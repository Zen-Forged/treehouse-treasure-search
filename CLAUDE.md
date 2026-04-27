## HOW TO START A NEW SESSION

1. Run `th` in Terminal — reads CLAUDE.md and copies to clipboard
2. Open claude.ai → New conversation
3. Paste the opener below, fill in CURRENT ISSUE from clipboard

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE:
[paste here]
```

## HOW TO END A SESSION

Run `/session-close` — replaces the old `thc` alias with the full close protocol (tombstoning, memory updates, commit + push, PR creation).

---

## DOCUMENT MAP

This file is the **live whiteboard** — only the current session's starting point. Everything else is elsewhere:

| Need | Read |
|---|---|
| Architecture, schema, routes, API table, lib + component catalog, auth pattern, DNS state, known gotchas, debugging commands | `CONTEXT.md` |
| Operating constitution: brand rules, tech rules, risk register, decision gate, agent roster | `docs/DECISION_GATE.md` |
| Session structure, HITL indicator standard, Docs agent + Design agent operating principles, blocker protocol | `MASTER_PROMPT.md` |
| Historical session close summaries (sessions 1–30, growing) | `docs/session-archive.md` |
| Canonical design system v1.1l + v1.2 build spec | `docs/design-system.md` + `docs/design-system-v1.2-build-spec.md` + `docs/mockups/` |
| Canonical vendor onboarding (3 flows) | `docs/onboarding-journey.md` |
| Supabase OTP email templates (HITL paste target) | `docs/supabase-otp-email-templates.md` |
| In-mall SQL triage recipes | `docs/admin-runbook.md` |
| Active bugs + deferred items + resolved history | `docs/known-issues.md` |
| Pre-beta QA walk runbook (T4d) | `docs/pre-beta-qa-walk.md` |
| Window share QA walk runbook (Q-007 session 41) | `docs/share-booth-qa-walk.md` |
| Queued sessions (scoped work sequenced behind something else) + operational backlog | `docs/queued-sessions.md` |
| Roadmap (Beta+) — epic-level captured items not yet scoped | `docs/roadmap-beta-plus.md` |
| Tech Rule candidates queue (firing counts + promotion status) | `docs/tech-rules-queue.md` |

---

## TERMINAL COMMAND FORMATTING CONVENTION
> When Claude surfaces multiple terminal commands to run in sequence, each goes in its own fenced block. This lets David copy one at a time and verify each before running the next.

**Do this:**

```bash
npm run build 2>&1 | tail -30
```

```bash
git add -A && git commit -m "..." && git push
```

**Not this** (chained separate commands in one block that invite blind paste):

```bash
npm run build 2>&1 | tail -30
git add -A && git commit -m "..." && git push
```

Exception: a single chained command with `&&` stays in one block — that's one atomic action by design.

---

## ✅ Session 75 (2026-04-27) — 7-item redirect bundle, all addressed end-to-end (six runtime/docs commits)

David approved /session-open's recommended move (feed content seeding) but redirected to a 7-item polish + system-rule bundle: admin login redirect, BoothHero lightbox, /vendor-request rewrite (4 items collapse into one redesign), and the booth-numeral font system swap. Session triaged into three tracks (A surgical, B + C mockup-first), shipped all seven end-to-end across six runtime/docs commits + close. Pattern: triage on first message → ship Track A immediately → mockup-first for B + C with explicit decisions tables → David approved both mockups in a single message each → design-to-Ready commits for both → implement C first (smaller scope) then B → push.

**Beat 1 — Triage of David's 7-item redirect.** Items grouped into three tracks: A = quick fixes (item 1 admin redirect + item 6 BoothHero lightbox, no decisions needed); B = /vendor-request redesign (items 2 + 3 + 4 + 5 collapse into one feature — required fields, photo copy, checkbox, layout cuts); C = booth-numeral font system (item 7 — IM Fell `1` reads as serifed `I`, especially on mixed booth IDs like D19 from the Gemba walk). Per `feedback_ask_which_state_first.md`, surfaced two state-first questions on Track A (1.1 admin redirect destination; 6.1 lightbox surface scope), pre-mockup decisions on Tracks B + C. David answered "1.1 (a) 6.1 (both, yes) then mockup."

**Beat 2 — Track A shipped (`60a7a11` + `eef1746`, +55/-12 across 2 files).** Two surgical commits, no decisions pending:
- [`app/login/page.tsx`](app/login/page.tsx) — new `pickDest(user)` helper closes over `searchParams` + checks `isAdmin(user)`. Five post-auth redirect sites updated (confirming bridge, already-logged-in, onAuthChange, BroadcastChannel, OTP verifyData). Admins now land on `/` by default; explicit `redirect`/`next` query params still win. Resolves the "No Booth linked to this account" first-screen experience David flagged.
- [`components/BoothPage.tsx`](components/BoothPage.tsx) — BoothHero gains transparent button overlay at z-5 covering photo area; opens [`PhotoLightbox`](components/PhotoLightbox.tsx) on tap. Pencil bubble (z-10) + post-it (z-12) preserve their existing tap targets via z-index sandwich. Lightbox only mounts when `heroImageUrl` is present (vendorHueBg fallback has nothing to enlarge). Stacking pattern documented in carry-forward.

**Beat 3 — Track C mockup → design-to-Ready → feat (`d747b71` + `01a6b44`, 7 files runtime + 2 design artifacts).** Per Design agent + same-session design-record-commit rule, mockup first then design record then implementation:
- Mockup [`docs/mockups/booth-numeral-font-v1.html`](docs/mockups/booth-numeral-font-v1.html) — 5-decision table (C1 rule, C2 font choice, C3 scope, C4 token name, C5 italic posture) + stress-test card (1, I, 11, II, 139, D19, A1 across IM Fell vs Times New Roman vs Playfair Display at 36px and 20px) + 3 phone frames showing same /shelves Booths grid + find-detail card + 36px post-it. David approved all 4 questions in one message: "1. Approve. 2. (B) Times New Roman. 3. (A). 4. Approve."
- Design record [`docs/booth-numeral-font-design.md`](docs/booth-numeral-font-design.md) — D1–D5 frozen, acceptance criteria, project-wide carry-forwards ("letters → IM Fell or sans; numbers → FONT_NUMERAL").
- Feat: rename `FONT_POSTIT_NUMERAL` → `FONT_NUMERAL` in [`lib/tokens.ts`](lib/tokens.ts) (value unchanged, Times New Roman, no webfont). Re-export from [`components/BoothPage.tsx`](components/BoothPage.tsx). Apply across 6 surfaces: BoothPage post-it 36px (already TNR — rename only), [`components/PhotographPreview.tsx`](components/PhotographPreview.tsx) (build error caught a 7th surface I missed in the initial grep — fixed in same commit), [`app/find/[id]/page.tsx`](app/find/[id]/page.tsx) Variant B 26px, [`app/shelves/page.tsx`](app/shelves/page.tsx) Variant B 20px, [`app/flagged/page.tsx`](app/flagged/page.tsx) Variant B 26px, [`components/MallScopeHeader.tsx`](components/MallScopeHeader.tsx) count prefix wrapped in span (FONT_NUMERAL 500 + non-italic + ink-primary). The 1-vs-I confusion on mixed booth IDs is gone from user-facing chrome.

**Beat 4 — Track B mockup → design-to-Ready → feat (`a427ee7` + `fbbba21`, 3 files runtime + 2 design artifacts + migration 013).**
- Mockup [`docs/mockups/request-booth-redesign-v1.html`](docs/mockups/request-booth-redesign-v1.html) — 7-decision table + 3-frame compare (current with 5 pain points circled + iPhone 13 viewport ruler / recommended 3:2 photo / compact-pill alternative). David approved 1 (3:2 photo Frame B), 2 (red asterisk indicator), 3 (server-side audit), 4 (no other changes).
- Design record [`docs/booth-request-redesign-design.md`](docs/booth-request-redesign-design.md) — D1–D7 frozen, acceptance criteria, carry-forwards (Frame C compact-pill alternative parked).
- Feat: [`app/vendor-request/page.tsx`](app/vendor-request/page.tsx) rewrite — title "Request your digital booth" 22px IM Fell only (intro h1 + paragraph dropped); First/Last side-by-side preserved + Mall + Booth # paired in new side-by-side row (both hard-required, red `*`); Booth name keeps "(optional)" italic-faint tag, helper line dropped; photo dropzone 4:3 → 3:2 with FONT_SYS sans copy ("Take a photo of your booth" 14px 600 inkPrimary + "This will be the main image on your digital booth." 12px inkMid) — was the legibility issue David flagged; "confirm it's really yours" framing entirely removed. New owner-acknowledgement checkbox card above CTA — required to submit, gates `disabled` state. handleSubmit validation order: First → Last → Email → Mall → Booth → Photo → ownerAck. Server payload includes `owner_acknowledged: true`.
- API: [`app/api/vendor-request/route.ts`](app/api/vendor-request/route.ts) — three new server-side validations (mall_id non-empty, booth_number trim non-empty, owner_acknowledged === true); 400 with field-specific error message if any are missing. Insert payload includes `owner_acknowledged: true`.
- Migration: [`supabase/migrations/013_owner_acknowledged.sql`](supabase/migrations/013_owner_acknowledged.sql) — adds `owner_acknowledged BOOLEAN NOT NULL DEFAULT FALSE`. **🔴 HITL pending — David must paste into Supabase dashboard SQL editor before testing the form.**

**Final state in production (as of `fbbba21`):**

- Admin login → `/` (was `/my-shelf` → "No Booth linked to this account" empty state). Explicit `?redirect=/foo` still wins for both roles.
- BoothHero photo on `/my-shelf` and `/shelf/[slug]` opens PhotoLightbox on tap — pinch/double-tap/X-button close. Pencil + post-it tap targets preserved.
- Booth numerals across `/shelves` Booths grid (20px), `/find/[id]` Variant B card (26px), `/flagged` inkWash header (26px), 36px post-it on BoothPage + find detail, and MallScopeHeader count chips (22px) all render in Times New Roman. Headers, vendor names, eyebrows, ViewToggle, BoothCloser unchanged (IM Fell).
- `/vendor-request` fits one screen on iPhone 13 — title 22px tight, no intro paragraph, Mall + Booth # side-by-side, photo 3:2 with high-contrast sans copy, checkbox card above CTA.
- `/api/vendor-request` requires mall_id + booth_number + owner_acknowledged. Pre-existing rows in vendor_requests backfill to `owner_acknowledged = FALSE` (no admin disruption — admins act on rows by status, not by ack).

**Commits this session (6 runtime/docs + 1 close):**

| Commit | Message |
|---|---|
| `60a7a11` | fix(login): admin lands on / not /my-shelf |
| `eef1746` | feat(booth-hero): lightbox on tap |
| `d747b71` | docs(numeral-font): design-to-Ready |
| `a427ee7` | docs(vendor-request): design-to-Ready |
| `01a6b44` | feat(numeral-font): FONT_NUMERAL across booth numerals + counts |
| `fbbba21` | feat(vendor-request): one-screen redesign with owner-ack gate |
| (session close) | docs: session 75 close — 7-item redirect bundle, all addressed |

**What's broken / carried (delta from session 74):**

- 🟢 **Item 1 — admin login redirect** ✅ — resolved session 75 in `60a7a11`.
- 🟢 **Item 6 — BoothHero lightbox** ✅ — resolved session 75 in `eef1746`.
- 🟢 **Item 7 — booth-numeral font system** ✅ — resolved session 75 across `d747b71` + `01a6b44`.
- 🟢 **Items 2 + 3 + 4 + 5 — /vendor-request redesign** ✅ — resolved session 75 across `a427ee7` + `fbbba21`.
- 🔴 **NEW HITL: migration 013_owner_acknowledged.sql awaiting paste into Supabase dashboard.** Until applied, the new `/vendor-request` POST will fail at the insert step with "column owner_acknowledged does not exist." Form-side gating still works (CTA disabled correctly); only the network layer fails. Once pasted, no further action needed. Single line: `ALTER TABLE vendor_requests ADD COLUMN owner_acknowledged BOOLEAN NOT NULL DEFAULT FALSE;`
- 🟡 **NEW: Frame C compact-photo alternative parked.** [`docs/mockups/request-booth-redesign-v1.html`](docs/mockups/request-booth-redesign-v1.html) Frame C ready as a second pass if iPhone QA reveals the 3:2 dropzone still feels overwhelming. Code path identical — only the dropzone CSS changes.
- 🟡 **NEW: Project-wide rule freeze "letters → IM Fell or sans; numbers → FONT_NUMERAL".** Captured in [`docs/booth-numeral-font-design.md`](docs/booth-numeral-font-design.md) carry-forwards. Applies to any future surface introducing a numeric component. Promote to design-system.md on next consolidation.
- 🟡 **NEW: BoothHero lightbox z-index stacking pattern.** Transparent overlay button at z-5, sibling to existing pencil (z-10) + post-it (z-12) — a reusable pattern when adding a new tap target to an already-affordance-rich surface. Single-firing on this surface; watch for repeat.
- 🟡 **NEW: Long-form helper copy on paper-wash → FONT_SYS, not IM Fell italic.** Photo dropzone copy was the trigger. Captured in [`docs/booth-request-redesign-design.md`](docs/booth-request-redesign-design.md) carry-forwards. Single firing — Tech Rule on second firing.
- 🟡 **NEW: Narrow-named tokens should be audited for generalization.** `FONT_POSTIT_NUMERAL` discovery — the narrow name kept the fix scoped to one surface for ~25 sessions until session 75 surfaced the broader rule. Single firing.
- 🟡 **Feed content seeding still pending** — bumped from sessions 55, 60–74, **75**. Now **18× bumped**. Session 75 closed seven additional items orthogonal to seeding but increases the value of seeding by closing the /vendor-request form gap David's first beta vendors will hit + the booth-numeral legibility gap on real Gemba-walk-style booth IDs. **Top recommended next session.** New judgment moments to fold into the seeding walk: (a) admin sign-in lands on `/`, not `/my-shelf` empty state; (b) tap booth photo on `/my-shelf` → PhotoLightbox pinch/zoom works; (c) booth numerals on real vendor photos in Times New Roman read clearly across Booths grid + find detail + 36px post-it; (d) MallScopeHeader count chip in Times New Roman; (e) walk the new `/vendor-request` flow (after running migration 013) with mock entries to validate one-screen layout + checkbox gate + new copy contrast + required-field asterisks + side-by-side Mall+Booth#; (f) any drift between approved 3:2 photo dropzone and live render.
- 🟡 All session 74 carry items not touched this session remain unchanged: showPlaceholders dormant infrastructure, hero-photo Add/Edit asymmetry, AddBoothInline /admin Vendors duplicate, slug-collision shares BOOTH_CONFLICT path, third oscillation captured in design record, iPhone QA pending on Gemba items.
- 🟢 **R3 admin Events stale-data mystery** ✅ — already resolved session 73, unchanged.
- 🟢 **`/find/[id]` `navigator.share()` instrumentation gap** ✅ — already resolved session 73, unchanged.
- 🟢 **Tag-extraction analytics events** ✅ — already resolved session 73, unchanged.
- 🟢 **Booth-bookmark analytics events** ✅ — already resolved session 73, unchanged.
- 🟢 **Mall-filter analytics events on Booths + Find Map** ✅ — already resolved session 73, unchanged.
- 🟡 **Q-014 — Metabase analytics surface** — unchanged; queued in [`docs/queued-sessions.md`](docs/queued-sessions.md).
- 🟡 **Strip verbose console.logs from `/api/admin/events`** — unchanged.
- 🟡 **Audit other supabase-js call sites for cache:no-store gap** — unchanged.
- 🟡 **Item 3 — animation consistency review** — unchanged carry from session 71.
- 🟡 **Item 5 follow-up B + A parked** — unchanged carry from session 71.
- 🟡 **Item 6 — shareable filtered-mall link** — unchanged carry from session 71.
- 🟡 **`/mall/[slug]` v1.x migration STILL deferred** — unchanged carry from session 71.
- 🟡 **All-malls scope mall-subtitle weak separator on `/flagged`** — unchanged carry from session 70.
- 🟡 **Booth-page scroll flatten (D17) regression watch** — unchanged carry from session 70.
- 🟡 **`/post/preview` masthead title-below-masthead pending iPhone QA** — unchanged carry from session 70.
- 🟡 **Booths grid lockup numeral size deviates from spec** — unchanged carry from session 70 (now numeral font rule supersedes; size deviation independent of font choice).
- 🟡 **BoothHero post-it `minHeight: 96`** — unchanged carry from session 69.
- 🟡 **D4b session-46 reversal needs real-photo validation** — unchanged carry from session 69.
- 🟡 **Sign-in icon discoverability** — unchanged watch-item from session 63.
- 🟡 **Q-012 — Treehouse opener** — parked, unchanged.
- 🟡 **Existing /api/* routes unwrapped re Sentry** — unchanged.
- 🟡 **Q-013 candidate — Next.js 15 upgrade** — unchanged.
- 🟡 **Treehouse Lens constant is provisional** — unchanged.
- 🟡 **Multi-affordance retirement → single-surface promotion** — unchanged carry from session 72.

**Memory updates:** ZERO new memories.

Existing memories that load-bore the session:
- `feedback_ask_which_state_first.md` (session 63) — fired on Track A (state-first questions 1.1 + 6.1) and on Tracks B + C as decisions tables in mockups. 9th firing. Pattern fully default; not worth tracking firing counts beyond noting it landed three times this session.
- `feedback_treehouse_no_coauthored_footer.md` (session 63) — applied to all 6 runtime/docs commits ✅.
- Same-session design-record-commit rule (session 56) — fired twice this session (`d747b71` numeral-font + `a427ee7` vendor-request). 9th + 10th firings total.

**Live discoveries:**

- **Code archaeology saved a feature.** Track C's "Times New Roman recommended" choice was load-bearingly cheap because `FONT_POSTIT_NUMERAL` already lived in `lib/tokens.ts` since v1.1l. The narrow naming was the trap that kept the fix scoped to one surface — but the value was already in production, battle-tested at 36px. Renaming + extending was a 7-file sweep, not a new-font introduction. Pattern: when a token has a narrow name suggesting "exception" (postit, mobile, header), audit whether the underlying value should generalize before reaching for a new abstraction.
- **Frame C as parking lot.** Mockup carried a "more aggressive" alternative (compact photo pill) that David didn't pick — Frame B (3:2) won. Frame C stays in the mockup file ready as second pass if iPhone QA reveals the 3:2 still overflows. Pattern: producing a "next-step alternative" frame in a mockup costs almost nothing and creates a cheap pivot path post-QA.
- **Build-validation caught a missing surface (PhotographPreview).** Initial Track C grep found 6 surfaces; the build error revealed a 7th (`PhotographPreview.tsx`). Corollary to "trust the type system" — never trust a manual grep across a typed codebase; the compiler will tell you. Caught and fixed in the same feat commit (no separate commit needed).

**Operational follow-ups:**
- Archive-drift accounting: rotated session 74 to tombstone. Session 69 falls off the bottom of last-5 visible tombstones. Archive-drift backfill to session-archive.md (sessions 54 + 55 + 57–74) still on the operational backlog.
- Operational backlog (one new entry): **NEW: David must paste migration 013_owner_acknowledged.sql into Supabase dashboard** before any /vendor-request testing.

**Tech Rule candidates:**

- "Audit existing affordances when adding a new one to an affordance-rich surface" — second firing (session 74 was first with Pencil semantic drift; session 75 fired on BoothHero z-index stacking). Promote on third firing.
- "Long-form helper copy on paper-wash → FONT_SYS, not IM Fell italic" — first firing (vendor-request photo dropzone). Tech Rule on second firing.
- "Narrow-named tokens should be audited for generalization" — first firing (FONT_POSTIT_NUMERAL → FONT_NUMERAL). Single firing.
- "Trust the build, not your grep" — first firing (PhotographPreview catch via TypeScript error after rename sweep). Single firing.

**Notable artifacts shipped this session:**
- [`docs/booth-numeral-font-design.md`](docs/booth-numeral-font-design.md) + [`docs/mockups/booth-numeral-font-v1.html`](docs/mockups/booth-numeral-font-v1.html) — D1–D5 frozen, project-wide rule capture.
- [`docs/booth-request-redesign-design.md`](docs/booth-request-redesign-design.md) + [`docs/mockups/request-booth-redesign-v1.html`](docs/mockups/request-booth-redesign-v1.html) — D1–D7 frozen, acceptance criteria, Frame C parked.
- `FONT_NUMERAL` token in [`lib/tokens.ts`](lib/tokens.ts) — supersedes `FONT_POSTIT_NUMERAL`. Project-wide numeral font.
- 7 surfaces converted to `FONT_NUMERAL`: BoothPage, PhotographPreview, find/[id], shelves, flagged, MallScopeHeader.
- `pickDest(user)` helper in [`app/login/page.tsx`](app/login/page.tsx) — admin redirect logic centralized at 5 post-auth call sites.
- BoothHero lightbox z-index sandwich pattern — transparent overlay at z-5 between photo container and pencil/post-it.
- `owner_acknowledged` column on `vendor_requests` (migration 013) — admin audit trail for new ownership claim.
- Owner-acknowledgement checkbox card primitive on /vendor-request — new component pattern reusable for future consent gates.

---

## Recent session tombstones (last 5)

> Older tombstones live in [`docs/session-archive.md`](docs/session-archive.md). Sessions 28–43 still awaiting archive-drift backfill (one-liner only); sessions 44–53 + 56 in archive (54 + 55 + 57–74 still missing — operational backlog growing).

- **Session 74** (2026-04-27) — Gemba walk follow-up at America's Antique Mall surfaced 7 items; six beats, four runtime/docs commits + close shipping all 7 end-to-end. **Polish quartet (`30b9922`):** AddBoothInline alphanumeric `booth_number`, /post/preview FB CTA retired, AddFindTile to grid tail, my-shelf 9-cell placeholder grid dropped. **Item 4 (`d52b149`):** /post/preview's three router.push call sites preserve `?vendor=<id>` through publish flow. **Booth management (`6d32c9c` design-to-Ready + `c5437df` feat):** D1–D7 frozen for Edit + Add sheets (Pencil bubble repurpose, slug auto-update, no `user_id` safety gate, mall-change conflict path, no hero in Edit, Add tile tail position, hero retained for mall-walk capture). 4 new components (BoothFormFields, EditBoothSheet, AddBoothSheet, AddBoothTile) + PATCH `/api/admin/vendors` with BOOTH_CONFLICT 409. Third oscillation of AddBoothInline-on-/shelves (sessions 37 + 67 retired; 74 restored intentionally per demo-authenticity reasoning). Optimistic `setVendors` on success — no full reload. Same-session design-record-commit rule 8th firing. ZERO new memories. ZERO new Tech Rule firings; one single-firing candidate ("audit existing affordances for semantic drift").
- **Session 73** (2026-04-27) — R3 closed end-to-end in a single-track session. Eight runtime/docs commits + close resolving both halves of the analytics arc. **Write side:** 5 new event types via migration 012 (`booth_bookmarked`, `booth_unbookmarked`, `find_shared`, `tag_extracted`, `tag_skipped`) + `filter_applied` `page` field on Home/Booths/Find Map for per-tab attribution. Closes 4 deferred carries (sessions 59 + 62 + 67 + 68). Decisions D1–D4 frozen in design record §Amendment v1.1. **Read side:** parked-since-session-58 admin Events stale-data mystery resolved at root — Next.js HTTP-level data cache was intercepting `@supabase/supabase-js`'s internal `fetch()` calls; `force-dynamic` only disables route-response caching, doesn't propagate `cache: "no-store"` to inner fetches; two-line fix in [`lib/adminAuth.ts`](lib/adminAuth.ts) via `global.fetch` wrapper benefits every admin route + every `recordEvent` call. Diagnosed in one session via side-by-side probe pattern (built `/api/admin/events-raw` parked since session 60 + inline diag strip in admin Events tab → smoking-gun diff appeared on first reading, 78-min stale snapshot vs fresh raw). **Strategic conversation:** David flagged in-app admin tab is wrong shape for analytics long-term → Q-014 queued (Metabase + read-only Postgres role + 3 starter dashboards + retire admin tab post-Metabase). Diag strip + raw probe stay as durable visibility tooling per David's session-73 decision until Q-014 lands. Polish: chip wiring for v1.1 types (Bookmarks primary; Find shares + Tag flow overflow). ONE new memory (`feedback_side_by_side_probe_for_divergence.md`). ONE new Tech Rule candidate (TR-q: `force-dynamic` doesn't propagate `cache: "no-store"` to inner fetches; compounds with TR-l).
- **Session 72** (2026-04-26) — Small surgical session. One runtime commit (`27a0439`) rationalizing admin entry: BottomNav 4th slot for admins now carries a dedicated **Admin** tab (Lucide `Shield` 21px → `/admin`) replacing My Booth (admins have no booth assigned). Two redundant affordances retired in same commit: `/shelves` masthead `ADMIN` pill + green `Manage` eyebrow under each booth tile (Pencil + Trash bubbles already signal edit/delete intent). Vendor + Guest BottomNav layouts unchanged. ZERO new memories. ZERO new Tech Rule firings. Live discovery: "multi-affordance retirement → single-surface promotion" pattern echoed session 71's cartographic collapse on `/find/[id]` (parallel two cards → one inkWash card). Single-firing in admin context, single-firing in shopper context, watching for third instance.
- **Session 71** (2026-04-26) — Three independent decision arcs in three runtime commits + close (`54fa370` `/find/[id]` cartographic collapse / `30c2c0c` 3-item polish bundle / `704ff7a` caption min-height). Parallel two-card pattern on `/find/[id]` collapsed into ONE inkWash card with italic IM Fell "Find this item at" eyebrow above + vendor name + mall · city/state Apple Maps subtitle + Variant B booth numeral; cartographic spine (PinGlyph + tick + XGlyph) FULLY RETIRED across the v1.x ecosystem; link to `/mall/[slug]` retired from this surface. MallScopeHeader API extended with `count` prop rendering count alone at IM Fell italic 22px on Booths + Find Map (Home unchanged). FindTile/WindowTile/ShelfTile gain caption `minHeight: 76` + ShelfCard rail tile `minHeight: 56` — find tiles bottom-out at uniform heights regardless of caption-length variance. **Diagnosis-pivot mid-session:** Item 5 was scoped to E+B+A bundle pre-screenshot; David's screenshot of `/flagged` revealed actual cause was caption-variance not photo-cropping; shipped E only with B+A parked in mockup ready for second pass. Same-session design-record-commit rule 6th + 7th firings. `feedback_ask_which_state_first.md` 8th firing. ZERO new memories. Two new Tech Rule candidates: "verify sub-agent claims that contradict known semantic rules" (Explore agent's letterboxing claim contradicting `objectFit: cover`) + "ask for a screenshot before scoping multi-change visual fixes." Three carry items into session 72: animation consistency review (item 3, deferred), shareable filtered-mall link (item 6, deferred), B+A second pass parked.
- **Session 70** (2026-04-26) — Largest layout-redesign sweep in recent memory. Six runtime/docs commits + close (`3432338` 3 records design-to-Ready / `d6b5a75` find-detail mall card + post-it / `198560f` finds-map cartographic retirement / `cc322e9` masthead lock + scroll flatten / `48aa93a` round-2 polish / `ce5eb0c` Variant B booth lockup). Three primary records frozen + one mid-session lockup-revision (D1–D18 across [`docs/finds-map-redesign-design.md`](docs/finds-map-redesign-design.md) + [`docs/find-detail-cartographic-refinement-design.md`](docs/find-detail-cartographic-refinement-design.md) + [`docs/masthead-lock-design.md`](docs/masthead-lock-design.md) + L1–L9 in [`docs/booth-lockup-revision-design.md`](docs/booth-lockup-revision-design.md)). `/flagged` cartographic spine fully retired in favor of flat sectioned-list with inkWash card headers; `/find/[id]` mall block lifted to parallel inkWash card; `StickyMasthead` rewritten with locked-grid slot API + booth-page scroll flatten + `/post/preview` unification; round-2 iPhone-QA polish (Home logo retired, wordmark `translateY(-1px)` for ascender bias, address geoLine on Booths + Find Map, count merged into eyebrow); Variant B booth lockup shipped across three surfaces (vendor LEFT + "Booth" small-caps eyebrow + IM Fell numeral RIGHT). Same-session design-record-commit rule 5th firing. ZERO new memories.
---

## CURRENT ISSUE
> Last updated: 2026-04-27 (session 75 close — David's 7-item redirect bundle: admin login fix, BoothHero lightbox, /vendor-request rewrite, booth-numeral font system swap. All 7 items addressed across six runtime/docs commits + close. **Migration 013 pending HITL paste into Supabase dashboard before /vendor-request testing.** Feed content seeding still pending — now 18× bumped.)

**Working tree:** clean. **Build:** green. **Beta gate:** technically unblocked since session 50; no code-level regressions. **NEW this session (six runtime/docs commits, 7-item redirect single-day cycle):** David approved /session-open's recommended move (feed content seeding) but redirected to a 7-item bundle that surfaced during pre-seeding review. Triaged into three tracks. **Track A — Quick fixes (`60a7a11` + `eef1746`):** admin login lands on `/` (was hitting "No Booth linked to this account" empty state via `/my-shelf`); BoothHero photo opens PhotoLightbox on tap across both `/my-shelf` and `/shelf/[slug]` — pinch/zoom/double-tap free from existing PhotoLightbox component. **Track C — Booth-numeral font system (`d747b71` design-to-Ready + `01a6b44` feat):** D1–D5 frozen via mockup. Rule "letters → IM Fell or sans; numbers → FONT_NUMERAL" project-wide. `FONT_POSTIT_NUMERAL` renamed `FONT_NUMERAL` in `lib/tokens.ts` (Times New Roman, no webfont load — already in codebase since v1.1l). 7 surfaces converted (BoothPage, PhotographPreview, find/[id], shelves, flagged, MallScopeHeader; the 7th caught by build error after initial 6-surface grep). 1-vs-I confusion on mixed booth IDs (D19, A1) gone from user-facing chrome. **Track B — /vendor-request redesign (`a427ee7` design-to-Ready + `fbbba21` feat):** D1–D7 frozen. Title "Request your digital booth" 22px IM Fell, intro paragraph dropped. Mall + Booth # side-by-side, both hard-required (red `*`). Booth name keeps "(optional)" tag, helper line dropped. Photo dropzone 4:3 → 3:2 with FONT_SYS high-contrast copy ("Take a photo of your booth" / "This will be the main image on your digital booth"). New owner-acknowledgement checkbox card gates CTA. Server payload includes `owner_acknowledged: true`. Migration 013 adds the column. ZERO new memories. ZERO new Tech Rule promotions; four single-firing candidates ("audit existing affordances" 2nd firing, "long-form helper copy on paper-wash → sans" 1st firing, "narrow-named tokens audited for generalization" 1st firing, "trust the build, not your grep" 1st firing). `feedback_ask_which_state_first.md` 9th firing. **Same-session design-record-commit rule** fired twice (Track B + Track C, 9th + 10th firings). **Gate to V1:** feed content seeding + one quiet week → first beta vendor invite per [`docs/beta-plan.md`](docs/beta-plan.md). Session 75 closes the /vendor-request form gap David's first beta vendors will hit + the booth-numeral legibility gap on real Gemba-walk-style booth IDs.

### 🔴 HITL — must run before /vendor-request testing

Paste [`supabase/migrations/013_owner_acknowledged.sql`](supabase/migrations/013_owner_acknowledged.sql) into the Supabase dashboard SQL editor:

```sql
ALTER TABLE vendor_requests
  ADD COLUMN owner_acknowledged BOOLEAN NOT NULL DEFAULT FALSE;
```

Until applied, the new `/vendor-request` POST will fail at the insert step with `column owner_acknowledged does not exist`. Pre-existing rows backfill to FALSE — no admin disruption.

### 🚧 Recommended next session — Feed content seeding (~30–60 min)

Bumped from sessions 55, 60–74, **75**. **Top priority** — the actual V1 unblocker, now **18× bumped**. Session 75 closed seven Gemba-walk + system-rule items end-to-end. Real content remains the actual unblocker — every closed gap has been infrastructure, observability, polish, admin capability, or system rule; none has been "we lack content." **Eighteen sessions** of polish + observability + brand + navigation + persistence + terminology + caption-typography + cartographic-redesign + masthead-lock + booth-lockup + image-stabilization + admin-chrome rationalization + R3-closure + booth-management + vendor-request-redesign + numeral-font-system; zero new reasons not to seed content. **NEW judgment moments** (in addition to all sessions 70–74 carry-forwards): (a) admin sign-in lands on `/`, not `/my-shelf` empty state; (b) tap booth photo on `/my-shelf` → PhotoLightbox pinch/zoom works; (c) booth numerals on real vendor photos in Times New Roman read clearly across Booths grid + find detail + 36px post-it; (d) MallScopeHeader count chip in Times New Roman; (e) walk the new `/vendor-request` flow (after running migration 013) with mock entries to validate one-screen layout + checkbox gate + new copy contrast + required-field asterisks + side-by-side Mall+Booth#; (f) any drift between approved 3:2 photo dropzone and live render — Frame C compact-pill is parked in the mockup as second pass if 3:2 still feels overwhelming.

**Shape:**
- 🖐️ HITL — **Run migration 013 first** before any /vendor-request testing.
- 🖐️ HITL (~30–60 min) — Source 10–15 real posts across 2–3 vendors. Photos + tags. With the tag-capture flow, the vendor takes 2 photos per post (item + tag) and the title + price prefill from the tag.
- 🟢 AUTO — Walk the Add Find → /post/tag → /post/preview flow for each, confirm tag prefill works on real-world content, confirm each lands on the right shelf and renders cleanly in the feed. **Use the /shelves "Add a booth" tile (session 74) to set up any new vendors during the walk.** Test the new /vendor-request flow with at least one mock submission to validate the owner-ack column writes correctly.
- 🟢 AUTO — Walk Booths grid + find detail + /flagged + 36px post-it on iPhone to verify booth numerals are clearly Times New Roman, not IM Fell.
- 🟢 AUTO — Run a partial T4d walk on the seeded surfaces.
- 🟢 AUTO — Once content lands, the V1 beta-invite gate is the "one quiet week" of monitoring rather than a code/content gap.

### Alternative next moves (top 3)

1. **Q-014 — Metabase analytics surface** (David surfaced session 73, queued in [`docs/queued-sessions.md`](docs/queued-sessions.md)) — strategic next step on the analytics arc. 60–90 min initial session: provision read-only Postgres role + Metabase Cloud or self-hosted on Fly hobby + build 3 starter dashboards (vendor adoption, find engagement, tag-flow funnel). Becomes more valuable AFTER feed seeding lands. If investor touchpoint is imminent, Q-014 first then seeding produces visible-charts-immediately. Size M.
2. **Item 6 — shareable filtered-mall link** (David flagged session 71) — likely path: deep-link to a primary tab (Home / Booths / Find Map) with mall pre-selected via URL param, persistent via existing `treehouse_saved_mall_id` (session 68 infra). Avoids `/mall/[slug]` since that page is still v0.2 dark and deferred. Size M; needs design + URL-param scoping + mockup pass per `mockup-first` rule.
3. **Item 3 — animation consistency review** (David flagged session 71) — Find Map animates the location up; Booths doesn't animate at all. Multi-surface survey across primary tabs + scope headers + tile entry animations + sheet open/close. Size M; needs survey pass first via Explore agent.

Full alternatives + operational backlog in [`docs/queued-sessions.md`](docs/queued-sessions.md).

### Session 76 opener (pre-filled — feed content seeding)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Sentry · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Feed content seeding. The long-deferred V1 unblocker — 10–15 real posts across 2–3 vendors so the app has actual content for beta invites. Session 75 closed seven items: admin login redirect to /, BoothHero lightbox on tap across /my-shelf and /shelf/[slug], booth-numeral font system swap (FONT_NUMERAL = Times New Roman across Booths grid + find detail + /flagged + 36px post-it + MallScopeHeader count), and /vendor-request redesign (one-screen layout, owner-ack checkbox, hard-required Mall+Booth#, FONT_SYS photo dropzone copy, intro paragraph dropped). PRE-FLIGHT: confirm migration 013_owner_acknowledged.sql has been pasted into Supabase (otherwise /vendor-request submit will fail with "column does not exist"). Then walk the Add Find flow on iPhone for ~10–15 real posts. JUDGMENT MOMENTS for session 75 deltas: (a) admin sign-in → home, not No-Booth empty state; (b) booth-photo lightbox pinch/zoom on /my-shelf and /shelf/[slug]; (c) booth-numeral legibility on real photos (D19, A1, mixed IDs) across Booths grid + find detail + 36px post-it; (d) MallScopeHeader count chip in Times New Roman; (e) /vendor-request one-screen fit on iPhone 13 + checkbox gate + required asterisks + side-by-side Mall+Booth# + sans photo copy; (f) Frame C compact-photo alternative — pivot to it if 3:2 still feels overwhelming. PLUS all sessions 70–74 carry-forwards (cartographic card, count-in-eyebrow, find-tile bottom-out, photo cropping, Variant B lockup, sectioned-list /flagged, masthead wordmark, scroll-flatten, /post/preview title, IM Fell tile titles, mall-subtitle weak separator, admin BottomNav vs My Booth, diag strip green under traffic, Bookmarks chip real adoption, tag-extraction payload accuracy, EditBoothSheet pre-fill, conflict pill copy, yellow "changed" flag, AddBoothTile placement). Once content lands, V1 beta-invite gate becomes "one quiet week" of monitoring rather than a code/content gap. Q-014 (Metabase) becomes more valuable AFTER seeding (real data to chart); if an investor touchpoint is imminent, consider running Q-014 BEFORE seeding so dashboards populate live during the walk. Note: /mall/[slug] is intentionally lensless on v0.2 dark theme pending its v1.x migration. Existing /api/* routes are not yet wrapped with Sentry.wrapRouteHandlerWithSentry (Next.js 14 limitation). Item 3 (animation consistency) + Item 6 (shareable filtered-mall link) parked. Q-012 (Treehouse opener) and Q-013 candidate (Next.js 15 upgrade) parked. R3 diag strip + raw probe stay as durable visibility tooling until admin tab retires post-Q-014.
```

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

*(Empty. T4d pre-beta QA walk re-passed session 46 end-to-end — all five exit criteria clean. Q-007 Window Sprint also remains passed per sessions 40–41. Featured banner reads restored session 48. Q-008 shopper share shipped session 50 (QA walk deferred to session 51, but non-gating — code is landed and the walk is verification not revision). No code-level regressions. Beta invites remain technically unblocked after session 50.)*

### 🟡 Remaining pre-beta polish (operational, not code-gating)

- **R3 admin-Events stale-data mystery** ✅ — **resolved session 73**. Root cause: Next.js HTTP-level data cache intercepting `@supabase/supabase-js`'s internal `fetch()` calls. Two-line fix in [`lib/adminAuth.ts`](lib/adminAuth.ts) (`global.fetch` wrapper). Diag strip + raw probe stay as durable visibility tooling per David's session-73 decision until admin tab retires post-Q-014. Verbose console.logs in `/api/admin/events/route.ts` are now duplicative; cleanup deferred.
- **`/find/[id]` `navigator.share()` instrumentation gap** ✅ — **resolved session 73**. `find_shared` event with `share_method` payload, intent-capture semantic.
- **Items 1 + 5 + 6 + 7 (Gemba polish quartet)** ✅ — **resolved session 74** in `30b9922`. Alphanumeric booth keyboard, FB CTA retired, AddFindTile to grid tail, my-shelf 9-cell placeholder grid dropped.
- **Item 4 (post-publish vendor-param preservation)** ✅ — **resolved session 74** in `d52b149`. Three router.push call sites in /post/preview preserve `?vendor=<id>` so admin lands on booth-of-origin.
- **Items 2 + 3 (booth name + mall edit)** ✅ — **resolved session 74** in `c5437df`. EditBoothSheet + PATCH `/api/admin/vendors` + Pencil bubble rewire on `/shelves`.
- **"Add a booth" affordance restored on /shelves** ✅ — **resolved session 74** in `c5437df`. AddBoothTile + AddBoothSheet (third oscillation, intentional this pass per [`docs/booth-management-design.md`](docs/booth-management-design.md)).
- **Item 1 (session 75) — admin login redirect** ✅ — **resolved session 75** in `60a7a11`. `pickDest(user)` helper routes admins to `/` by default; explicit `?redirect=/foo` still wins.
- **Item 6 (session 75) — BoothHero lightbox on tap** ✅ — **resolved session 75** in `eef1746`. Transparent overlay button at z-5 sandwiched between photo container and pencil/post-it. Mounts only when heroImageUrl present.
- **Item 7 (session 75) — booth-numeral font system** ✅ — **resolved session 75** across `d747b71` + `01a6b44`. `FONT_NUMERAL` (Times New Roman) replaces `FONT_IM_FELL` on Variant B booth lockup numerals + MallScopeHeader count chips. Project-wide rule frozen.
- **Items 2 + 3 + 4 + 5 (session 75) — /vendor-request redesign** ✅ — **resolved session 75** across `a427ee7` + `fbbba21`. One-screen layout, owner-ack checkbox, hard-required Mall+Booth#, FONT_SYS photo dropzone copy, intro paragraph dropped.
- **🔴 NEW HITL: paste migration 013_owner_acknowledged.sql into Supabase dashboard** — required before /vendor-request testing. Single line: `ALTER TABLE vendor_requests ADD COLUMN owner_acknowledged BOOLEAN NOT NULL DEFAULT FALSE;`. File: [`supabase/migrations/013_owner_acknowledged.sql`](supabase/migrations/013_owner_acknowledged.sql).
- **NEW: Frame C compact-photo alternative parked** (session 75) — [`docs/mockups/request-booth-redesign-v1.html`](docs/mockups/request-booth-redesign-v1.html) Frame C ready as a second pass if iPhone QA reveals 3:2 dropzone still feels overwhelming. CSS-only change.
- **NEW: Project-wide rule "letters → IM Fell or sans; numbers → FONT_NUMERAL"** (session 75) — captured in [`docs/booth-numeral-font-design.md`](docs/booth-numeral-font-design.md) carry-forwards. Promote to design-system.md on next consolidation.
- **NEW: BoothHero lightbox z-index sandwich pattern** (session 75) — transparent overlay at z-5 between photo container and pencil/post-it. Reusable when adding tap targets to affordance-rich surfaces. Single firing.
- **NEW: Long-form helper copy on paper-wash → FONT_SYS, not IM Fell italic** (session 75) — photo dropzone copy was the trigger. Single firing. Tech Rule on second firing.
- **NEW: Narrow-named tokens audited for generalization** (session 75) — `FONT_POSTIT_NUMERAL` discovery. Single firing.
- **Feed content seeding** — rolled forward from sessions 55–74, **75**. 10–15 real posts across 2–3 vendors. **Top-of-stack** as recommended next session, now **18× bumped**. Sessions 61–74 each strengthened the case; session 75 closed the /vendor-request form gap + booth-numeral legibility gap. Real content remains the actual unblocker.
- **Hero image upload size guard** — verify coverage across upload surfaces. Note: session 61 added DELETE coverage at `/api/admin/featured-image`; size guard remains a separate concern on the upload path.
- **Tech Rule promotion batch** — 19+ candidates queued; **TR-l + TR-m both 🟢 promotion-ready**. Recent additions: session 61 (TR-n), session 62 (TR-p testbed-first for AI/LLM call unknowns + `feedback_testbed_first_for_ai_unknowns.md` memory), session 64 (`feedback_still_frame_before_animation_port.md`), session 65 (`feedback_verify_third_party_software_exists.md` + "platform-managed env > manual paste"), session 68 (`feedback_state_controls_above_hero_chrome.md`), session 69 ("when wrapping one part of a parallel structure in a card, decide for the whole structure or none of it" — arguably second-firing in session 71). Session 70 surfaced two single-firings ("smallest→largest commit sequencing" + "italic-ascender 1px lift"). Session 71 surfaced two ("verify sub-agent claims that contradict known semantic rules" + "ask for a screenshot before scoping multi-change visual fixes"). Session 73 surfaced **TR-q** ("`force-dynamic` does NOT propagate `cache: "no-store"` to inner fetches" — first firing; compounds with TR-l). Session 74 surfaced "audit existing affordances for semantic drift when adding new ones" (Pencil discovery, single firing). Session 75 surfaced four single-firings: "audit existing affordances" (2nd firing — BoothHero z-index stacking), "long-form helper copy on paper-wash → sans" (1st firing — vendor-request), "narrow-named tokens audited for generalization" (1st firing — FONT_POSTIT_NUMERAL), "trust the build, not your grep" (1st firing — PhotographPreview catch). Full register: [`docs/tech-rules-queue.md`](docs/tech-rules-queue.md).
- **`/shelf/[slug]` 404 NotFound icon still a `<Heart>`** — session 61 swap intentionally left this one alone (semantically unrelated to "save"). Flip to a different icon if a separate visual sweep happens.
- **Tag-extraction analytics events** ✅ — **resolved session 73**. `tag_extracted` (with `has_price` + `has_title`) + `tag_skipped` shipped.
- **Sign-in icon discoverability** (session 63 watch-item) — first-time guests see a 22px CircleUser glyph in the masthead right slot. Worth checking during beta-feedback.
- **Q-012 — Treehouse opener animation** (session 64, parked) — full Design redesign needed. Captured in [`docs/queued-sessions.md`](docs/queued-sessions.md) §Q-012.
- **Existing `/api/*` routes are unwrapped re Sentry** (session 65) — ~25 routes silently swallow errors at the framework level. Acceptable for now; auto-fixed by Q-013.
- **Q-013 candidate — Next.js 15 upgrade** (session 65, parked) — would auto-fix the Sentry wrap-route requirement and unlock Cache Components.
- **Sentry MCP not yet wired to Claude Code** (session 65 follow-up) — one-time fix: add a `.mcp.json` block.
- **`/mall/[slug]` lensless on v0.2 dark theme** (session 66) — known deviation; lens applies cleanly when mall page does its v1.x ecosystem migration.
- **Treehouse Lens constant is provisional** (session 66) — `contrast(1.08) saturate(1.05) sepia(0.05)`; real vendor content this week may reveal it needs tuning.
- **Booth-bookmark analytics events** ✅ — **resolved session 73**. `booth_bookmarked` + `booth_unbookmarked` with `{vendor_slug}` payload.
- **Spec deviation: admin /shelves tiles don't carry the bookmark bubble** (session 67) — Pencil + Trash already in top-right; admin can bookmark via `/shelf/[slug]` masthead. Reconsider only if admins want it.
- **Mall-filter analytics events on Booths + Find Map** ✅ — **resolved session 73**. `filter_applied` fires on all three primary tabs with `page` field for per-tab attribution.
- **`/find/[id]` cartographic visual asymmetry** ✅ — **resolved session 70 + 71** via cartographic collapse.
- **`/find/[id]` → `/mall/[slug]` link bridging warm-→-dark cliff** ✅ — **resolved session 71** via collapse.
- **Card-height variance on find tiles** ✅ — **resolved session 71** via caption `minHeight`.
- **BoothHero post-it `minHeight: 96`** (carry from session 69) — eyebrow now single-line "Booth"; post-it may look slightly tall. If iPhone QA flags it, the parameter at [`components/BoothPage.tsx:216`](components/BoothPage.tsx) can come down (~76 likely tighter).
- **D4b session-46 reversal needs real-photo validation** (carry from session 69) — IM Fell 14px on ~170px-wide booth-detail/find-detail tiles tested against synthetic seed photos; real vendor content during the seeding walk is the actual judgment moment.
- **Design-record price-color token deviation** (carry from session 69) — design record specified `v1.inkMid`; implementation kept `v1.priceInk` (established semantic token).
- **`v1.pillBg` / `v1.pillBorder` / `v1.pillInk` tokens** ✅ — **resolved session 70**.
- **All-malls scope mall-subtitle is a weak separator on `/flagged`** (session 70) — captured in Record 1 design record as known-limitation. Likely fix: mall-grouped section breaks with small all-caps mall eyebrow.
- **Booth-page scroll flatten (D17) regression watch** (session 70) — highest-risk decision in Record 3. Watch on iPhone QA.
- **`/post/preview` masthead unification — title-below-masthead pending iPhone QA** (session 70) — page may lose the "reviewing" feel against vendors stepping through Add Find. (Note: session 74 touched /post/preview for item 4 but didn't change title placement.)
- **Booths grid lockup numeral size deviates from spec** (session 70) — design record specified 26px; Booths grid implements at 20px to preserve tile proportions. Design-record L3 amended.
- **Item 3 — animation consistency review across pages** (session 71) — David flagged: Find Map animates location up; Booths doesn't animate at all. Probably its own session; needs Explore-agent inventory pass first.
- **Item 5 follow-up: B + A parked** (session 71) — `object-position: center top` (B) + slot-ratio flip 4/5 → 1/1 (A) stay parked unless real-content seeding reveals residual photo-cropping issues. Mockup at [`docs/mockups/image-standardization-v1.html`](docs/mockups/image-standardization-v1.html) ready as second pass.
- **Item 6 — shareable filtered-mall link** (session 71) — needs product + URL-param scoping + share UX + mockup pass.
- **Sub-agent claim verification gap** (session 71) — single firing; Tech Rule candidate on second firing.
- **Screenshot-before-scoping discipline for visual fixes** (session 71) — single firing; Tech Rule candidate on second firing.
- **Multi-affordance retirement → single-surface promotion** (session 72) — single firing in admin context, single firing in shopper context — Tech Rule candidate on a third firing.
- **Spec deviation: admin /shelves masthead right slot is now empty** (session 72) — empty-on-purpose is a valid state.
- **Q-014 — Metabase analytics surface + retire admin Events tab** (David surfaced session 73) — strategic next step on the analytics arc. Captured in [`docs/queued-sessions.md`](docs/queued-sessions.md) §Q-014.
- **Diag strip + raw probe stay as durable visibility tooling** (session 73 decision) — retire automatically when Q-014 lands and admin tab retires.
- **Other supabase-js call sites might have the same latent bug** (session 73) — audit candidates: any inline `createClient` outside `getServiceClient()`. Quick grep: `grep -rn "createClient" lib/ app/`. Not urgent.
- **NEW: Hero photo asymmetry between Add and Edit sheets** (session 74) — Add sheet has hero photo upload; Edit sheet doesn't (per D5, /my-shelf?vendor=<id> is canonical hero-edit surface). Easy expand if asked.
- **NEW: AddBoothInline retained on /admin Vendors tab** (session 74) — duplicate Add UI exists (AddBoothSheet on /shelves + AddBoothInline on /admin). Field shapes match; future cleanup may unify if drift surfaces.
- **NEW: /vendor/[slug] no longer reachable from /shelves Pencil** (session 74) — intentional per D1. Reachable from `/shelf/[slug]` and direct nav. Add a "View profile" eyebrow on EditBoothSheet if surfaced.
- **NEW: Slug-collision shares the BOOTH_CONFLICT path** (session 74) — generic error message says "booth number" but actual cause might be slug uniqueness. Add slug-specific path if surfaced.
- **NEW: Third oscillation of AddBoothInline-on-/shelves** (session 74) — captured in [`docs/booth-management-design.md`](docs/booth-management-design.md) Carry-forward so future sessions don't reflexively retire.
- **NEW: `showPlaceholders` prop infrastructure dormant in BoothPage** (session 74) — unreachable after item 6 dropped the only `showPlaceholders={true}` callsite. ~10 min cleanup pass to reap; deferred.
- **Archive-drift backfill** — tombstones for sessions 54 + 55 + 57–73 missing from `docs/session-archive.md`. Pure docs-housekeeping. Worth a single ~15min ops pass at some point.
- **Operational backlog** — staging migration paste, OTP template paste, debug-toast cleanup, doc-only updates (Design agent principle, KNOWN PLATFORM GOTCHAS), `/admin` `auth.users` delete spike, `/api/suggest` SDK migration, archive-drift backfill, strip verbose diag logs from `/api/admin/events/route.ts`, audit other `createClient` callsites, **NEW: reap dormant showPlaceholders prop infrastructure in BoothPage.tsx**. → [`docs/queued-sessions.md`](docs/queued-sessions.md) §Operational backlog.
- **Error monitoring (R12)** ✅ — **shipped session 65** end-to-end. Sentry SDK + Vercel-Sentry integration + source-map upload + PII scrubbing + email alerts. Dashboard: https://zen-forged.sentry.io/issues/?project=4511286908878848.
- **Beta feedback mechanism** — absorbed into R7 (contact us) as a sub-task.

### 🟡 Q-007 Window Sprint expansion (post-MVP)

All captured in `docs/queued-sessions.md`:
- **Q-008** ✅ — Open share to unauthenticated shoppers. **Shipped session 50; QA walk PASSED session 51.**
- **Q-009** ✅ — Admin can share any booth (ownership bypass). **Shipped session 45.**
- **Q-010** ✅ — Window email CTA URL fix (`/vendor/` → `/shelf/`). Shipped session 41.
- **Q-011** ✅ — Window email redesign. Shipped session 52 over four iterations; v4 on-device QA walk **PASSED 4/4 clients session 53**. Loop fully closed.
- **Q-006** 🟡 — Deep-link CTA. Parked on Sprint 6+ Universal Links.

### 🟡 Session 35 non-gating follow-up

- **Q-002** ✅ — Picker affordance placement revision. Shipped session 57.

### 🟡 Sprint 5 + design follow-ons

- **`/admin` v0.2 → v1.2 redesign pass** (session 37) — Posts tab, Banners tab, tab switcher, header, approval toast, diagnosis panel. Size L. Needs design scoping first (mockup-first per session-28 rule). ~2–3 sessions.
- **KI-005** — Pre-approval sign-in signaling gap. Batch with guest-user UX.
- **Typography reassessment** (session-32 deferral — IM Fell readability).
- **Post-approval booth-name edit surface** (session-32 deferral). **Note: session 74 partially addressed this for admin** via the new EditBoothSheet, which any admin can use to edit any booth's name. Vendor-self-edit is still parked (vendors can't edit their own booth name yet; only admins can).
- `<MallSheet>` migration to `/vendor-request` (still deferred per v1.1k (h)).
- Nav Shelf decision + BottomNav full chrome rework.
- Guest-user UX parked items: login page now reads "Vendor Sign in" (session-49); `/welcome` guest landing, PWA install onboarding, vendor onboarding Loom, bookmarks persistence still parked.
- **PWA pull-to-refresh** — confirmed missing in session 41 Q-007 walk. Sprint 5 polish.

### 🟢 Sprint 6+ (parked)

**Primary roadmap now lives in [`docs/roadmap-beta-plus.md`](docs/roadmap-beta-plus.md)** (session 55 capture — 15 epic-level items R1–R15 including guest profiles, Stripe subscriptions, analytics, admin tooling, feed caps, legal, onboarding, push/SMS, map nav, mall heros, error monitoring, mall-operator accounts, vendor profile enrichment, **app store launch**). Roadmap doc also carries the 8-cluster grouping + 3-horizon shipping plan.

**Still Sprint 6+ only (not in roadmap-beta-plus.md):**

QR-code approval, admin-cleanup tool (session 45 materially reduces the need; session 74 closes the booth-name + mall-edit gap; the 80% case is now covered by /shelves), mall vendor CTA, **Option B `vendor_memberships` migration**, **Direction A (link-share via native share sheet)** and **Direction C (PNG export / story-ready image)** share variants. Post-MVP: 3A sold landing state, Find Map saved-but-sold tile signal.

### 🟢 Cleanup (not urgent)

- Deprecated functions in `lib/posts.ts` including session-35 `getVendorByUserId` shim.
- Cloudflare nameservers dormant (no cost).
- `docs/VENDOR_SETUP_EMAIL_TEMPLATE.md` (obsolete since T4a).
- `docs/design-system-v1.2-draft.md` (tombstone).
- `docs/mockups/add-find-sheet-v1-2.html`, `review-page-v1-2.html`, `edit-listing-v1-2.html` — partial retirement pending post-beta.
- `docs/mockups/email-v1-2.html` — updated session 39 rename sweep; keep as reference.
- `docs/mockups/share-booth-email-v1.html` through `v4.html` — design-history reference for Q-011 arc.
- `docs/mockups/my-shelf-multi-booth-v1.html` — Frames 2 + 3 updated session 57 (Q-002).
- `docs/multi-booth-build-spec.md` — archived reference.
- `docs/share-booth-build-spec.md` — Q-011 addendums stacked. Post-QA, candidate for consolidation.
- `components/ShelfGrid.tsx` (parked; zero callers).
- `/post` redirect shim — can delete post-beta.
- `.env.prod-dump.local` (session-54 one-shot artifact, gitignored, safe to delete anytime).
- Orphaned `dbutler80020@gmail.com` staging auth user (non-admin, non-blocking).
- **NEW: showPlaceholders prop infrastructure in BoothPage.tsx** (session 74) — unreachable after `/my-shelf` dropped the only `showPlaceholders={true}` callsite. ~10 min cleanup.

---

## INVESTOR UPDATE SYSTEM

- Google Drive folder: `1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW`
- Cadence: end of each sprint (weekly once beta launches)
- Trigger: say "generate investor update" at session close
- Process doc: Notion → Agent System Operating Manual → 📋 Investor Update — Process & Cadence

> **Sprint 4 fully closed sessions 40–41; sessions 42–53 ran the pre-beta polish arc; sessions 54–69 carried the polish + observability + brand + navigation + persistence + terminology + caption-typography + Option B booth-identity sweep; session 70 was the largest layout-redesign sweep in recent memory; session 71 closed three independent decision arcs in three runtime commits; session 72 was a small surgical session rationalizing admin entry; session 73 closed R3 end-to-end; session 74 closed the Gemba-walk admin-management gap with booth Add/Edit sheets + PATCH endpoint. **Session 75 closed a 7-item David-redirect bundle end-to-end across six runtime/docs commits**: admin login fix (lands on `/`, not no-booth empty state), BoothHero photo lightbox on `/my-shelf` and `/shelf/[slug]`, project-wide booth-numeral font system (FONT_NUMERAL = Times New Roman across Variant B lockup + count chips, resolving the 1-vs-I confusion on mixed booth IDs), and a /vendor-request one-screen redesign with owner-acknowledgement gate + migration 013 for audit trail. Feed content seeding still pending, now **18× bumped** — eighteen sessions of polish + observability + brand + navigation + persistence + terminology + caption-typography + cartographic-redesign + masthead-lock + booth-lockup + image-stabilization + admin-chrome rationalization + R3-closure + booth-management + vendor-request-redesign + numeral-font-system. **Next natural investor-update trigger point** is now after feed content seeding lands — the update would report eighteen+ shipped capability items including R4c + R3 (write + read root-fixed) + tag-capture + R12 + the lens port + Booths public + booth bookmarks + cross-tab mall filter + terminology consistency + caption unification + cartographic redesign + masthead lock + Variant B booth lockup + cartographic collapse + count-in-eyebrow typography + caption stabilization + admin nav rationalization + R3 v1.1+v1.2 closure + booth management on /shelves + /vendor-request redesign with owner-ack + project-wide numeral font rule, with Q-014 (Metabase) as the next-session-or-two strategic shipment that turns "data flowing" into "investor-ready dashboards."
