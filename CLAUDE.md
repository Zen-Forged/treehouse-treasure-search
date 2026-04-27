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

## ✅ Session 74 (2026-04-27) — Gemba walk follow-up: 7 items surfaced, all addressed (four runtime/docs commits)

David performed a pre-seeding Gemba walk at America's Antique Mall (real-world admin flow test) and surfaced seven items spanning bug fixes, UX polish, and a meaningful new admin capability. The session ran in six beats and shipped all seven items end-to-end across four runtime/docs commits — quick polish bundle (4 items) → routing fix (1 item) → design-to-Ready commit → single feat commit (2 items + the post-mockup admin-add restoration).

**Beat 1 — Triage (David's 7 items + my reading).** Items 1 (alphanumeric booth keyboard), 5 (FB CTA on /post/preview), 7 (AddFindTile to grid tail), 6 (drop my-shelf 9-cell placeholders) batched as small + decoupled + no decisions pending. Item 4 needed a route-semantics clarification. Items 2 (edit booth name) + 3 (edit mall) needed investigation: Pencil + Trash bubbles already exist on /shelves admin tiles per session 72, but the actual capability behind them was unclear.

**Beat 2 — Quick polish bundle (`30b9922`, +6/-31 across 4 files).** Four items shipped in one commit, no decisions pending:
- AddBoothInline booth_number drops `inputMode="numeric"`, gains `autoCapitalize="characters"`, placeholder updated to "e.g. 369 or D19" — admins can now type alphanumeric booth IDs (the Gemba photo: "D19").
- /post/preview: "Visit us on Facebook" CTA + FACEBOOK_PAGE_URL retired from post-publish success screen.
- BoothPage WindowView + ShelfView: AddFindTile / ShelfAddFindTile move from head to tail of grid. ShelfTile.isFirst no longer needs to defer to AddTile presence; ShelfAddFindTile.isFirst fires only when posts.length === 0.
- /my-shelf: showPlaceholders={true} dropped (default false). 9-cell empty grid no longer renders for vendors.

**Beat 3 — Investigation for items 2/3 + David clarification on item 4.** Reading /shelves admin tiles found the Pencil bubble currently links to `/vendor/[slug]` (read-only public profile, v0.2 dark theme — misleading icon match). Trash already deletes via DELETE /api/admin/vendors but is gated on `!user_id` (unclaimed booths only). NO existing edit endpoint or UI. David confirmed item 4 reading: "View booth" success-screen button should route back to booth-of-origin (preserve `?vendor=<id>` query param through publish flow), and approved investigation + mockup for items 2/3.

**Beat 4 — Item 4 ship (`d52b149`, +12/-3 in app/post/preview/page.tsx).** Two helper consts at top of PostPreviewInner derive a vendor-preserving href (`myShelfHref` + `myShelfAddHref`); the three `router.push` call sites (success-screen "View my shelf", "Add another find", error-state back-button) use them. Non-admin vendors with no `?vendor=` param continue to land on plain `/my-shelf` unchanged. Pure routing fix.

**Beat 5 — Per `feedback_ask_which_state_first.md`, surfaced D1–D5 before mockup, then David added an unanticipated requirement.** Decisions D1–D5 covered the Edit sheet shape:
- **D1 (repurpose Pencil):** Pencil = edit is the universal mental model; current `/vendor/[slug]` link is a weak match.
- **D2 (auto-update slug on rename):** Bookmarks and finds reference vendor_id, not slug.
- **D3 (allow edit on claimed booths, no `user_id` safety gate):** Editing labels doesn't strand the auth user. DELETE keeps its gate; PATCH doesn't.
- **D4 (allow mall change, surface conflicts):** Per item 3. Conflicts (vendors_mall_booth_unique) caught as 23505 → BOOTH_CONFLICT 409 with conflict pill UI.
- **D5 (no hero photo in Edit):** /my-shelf?vendor=<id> stays canonical hero-edit surface.

David approved D1–D5 and added: **bring back an "Add a booth" affordance to /shelves**. Important context: this is the third oscillation of AddBoothInline-on-/shelves (sessions 37 + 67 retired it; session 74 restores it intentionally per demo-authenticity reasoning — `/admin` is meaningfully "backend" not vendor-presentable). Captured in design record's carry-forward so future sessions don't reflexively retire again. Two new decisions D6 + D7 surfaced:
- **D6 (where does Add tile sit):** Single tile at very end of whole grid (not per-mall-section). Mirrors AddFindTile's tail position from item 7. Pre-fills active mall when filtered.
- **D7 (Add sheet pattern):** Bottom sheet matching Edit + Delete ergonomics. Coherent admin-management trio. Hero photo retained (unlike Edit per D5) since mall-walk creation is the natural moment to capture it.

Mockup updated through three rounds of streaming edits (decisions table extended D1→D7, two new frames added for Add flow, implementation block split into Edit/Add tracks, ask block extended). All approved.

**Beat 6 — Design-to-Ready commit + single feat commit (`6d32c9c` + `c5437df`, 8 files, +1969 across both).** Per the same-session design-record-commit rule (8th firing — fully transcended "rule" status), the design record (`docs/booth-management-design.md`) + mockup (`docs/mockups/booth-edit-sheet-v1.html`) committed BEFORE the implementation work began. Then single feat commit covered all implementation:
- [`components/BoothFormFields.tsx`](components/BoothFormFields.tsx) — shared 3-field markup (mall + booth_number + display_name) used by both sheets so they don't drift. Uses `initialValues` for change-detection in Edit; undefined in Add for fresh-start UX.
- [`components/EditBoothSheet.tsx`](components/EditBoothSheet.tsx) — bottom sheet, pre-fills from vendor, yellow "changed" flag on diffed inputs, PATCH submit, conflict pill on 409.
- [`components/AddBoothSheet.tsx`](components/AddBoothSheet.tsx) — bottom sheet mirroring Edit shell + adds optional hero photo (reuses uploadHero pattern from AddBoothInline, calls `/api/vendor-hero`), mall pre-selects `savedMallId` when active, reuses `createVendor`.
- [`components/AddBoothTile.tsx`](components/AddBoothTile.tsx) — dashed admin-only tile in own grid row after all mall sections.
- [`app/api/admin/vendors/route.ts`](app/api/admin/vendors/route.ts) PATCH method — auto-derives slug, catches 23505 → `BOOTH_CONFLICT` 409, no `user_id` safety gate (D3), returns hydrated vendor with mall side-table.
- `app/shelves/page.tsx` rewire — Pencil bubble swapped `<Link href="/vendor/[slug]">` → `<button onClick={setEditTarget}>`, two new state slots (`editTarget`, `addSheetOpen`), `onRequestEdit` prop threaded through both VendorCard call sites, `AddBoothTile` mounted post-listings (gated on `isAdmin`), both sheets joined existing AnimatePresence with DeleteBoothSheet. Optimistic `setVendors` on success: in-place update for edit, append + mall-hydration for add. No full reload.

**Final state in production (as of `c5437df`):**

- `/shelves` admin tiles carry Pencil + Trash bubbles unchanged. **Pencil now opens EditBoothSheet** (bottom sheet) instead of linking to /vendor/[slug].
- New admin-only **"Add a booth" tile** sits in its own grid row at the end of /shelves (after all mall sections). Tap → AddBoothSheet bottom sheet.
- Both sheets pre-fill (Edit from vendor) or pre-select (Add from `savedMallId` filter) intelligently. Yellow "changed" tint on Edit's diffed fields. Conflict pill above Save on 23505.
- **PATCH `/api/admin/vendors`** live as the canonical edit endpoint. Reuses requireAdmin gate. Auto-derives slug. Conflict path returns 409 + `BOOTH_CONFLICT` code.
- `/post/preview` success-screen "View my shelf" + "Add another find" + error-back routes preserve `?vendor=<id>` through publish flow. Admin lands back on booth-of-origin, not own (empty) `/my-shelf`.
- AddBoothInline `booth_number` accepts alphanumeric (e.g. D19), placeholder updated, autoCapitalize on.
- `/post/preview` no longer surfaces "Visit us on Facebook" CTA on success screen.
- AddFindTile + ShelfAddFindTile sit at tail of grid on `/my-shelf` (real posts first, append CTA last).
- `/my-shelf` WindowView no longer renders 9-cell placeholder grid.
- AddBoothInline retained on `/admin` Vendors tab unchanged (admins have two paths to add a booth: `/shelves` quick-tile or `/admin` Vendors tab; field shapes match).

**Commits this session (4 runtime/docs + 1 close):**

| Commit | Message |
|---|---|
| `30b9922` | feat(polish): booth keyboard, FB CTA, AddFindTile to tail, my-shelf placeholders |
| `d52b149` | fix(post-preview): preserve ?vendor=<id> through publish flow |
| `6d32c9c` | docs(shelves): booth management — design-to-Ready |
| `c5437df` | feat(shelves): booth management — Add + Edit sheets, PATCH endpoint |
| (session close) | docs: session 74 close — Gemba walk follow-up, 7 items addressed |

**What's broken / carried (delta from session 73):**

- 🟢 **Items 1, 5, 6, 7 (polish quartet)** ✅ — resolved session 74 in `30b9922`.
- 🟢 **Item 4 — `?vendor=<id>` preservation through publish flow** ✅ — resolved session 74 in `d52b149`.
- 🟢 **Items 2 + 3 — booth name + mall edit** ✅ — resolved session 74 via EditBoothSheet + PATCH endpoint.
- 🟢 **Pencil bubble misleading link to /vendor/[slug]** ✅ — Pencil now opens EditBoothSheet rather than the read-only public profile.
- 🟢 **"Add a booth" affordance restored to /shelves** ✅ — admin-only tile + AddBoothSheet (third oscillation, intentional this pass per design record).
- 🟡 **Feed content seeding still pending** — bumped from sessions 55, 60–73, **74**. Now **17× bumped**. Session 74 closed seven Gemba-walk items orthogonal to seeding but increases the value of seeding by closing the booth-management gap David hit on the Gemba walk itself. **Top recommended next session.** New judgment moments to fold into the seeding walk: (a) does the EditBoothSheet pre-fill correctly on a real claimed booth, (b) does the conflict pill copy read clearly when intentionally provoked (try editing a booth's mall to one where the booth_number already exists), (c) does the yellow "changed" flag aid or distract from the Edit experience, (d) does the new AddBoothTile feel native at the end of the grid, (e) does the AddBoothSheet's mall pre-select when filtered match expectation, (f) all four polish items (alphanumeric keyboard, FB CTA absent, AddFindTile at tail, my-shelf placeholders absent) verified in-flow, (g) item 4 fix verified — admin completes Add Find from a booth, success-screen "View my shelf" lands back on booth-of-origin not empty /my-shelf.
- 🟡 **NEW: Hero photo in Add but not Edit asymmetry** — captured in design record per D5/D7. If David asks "why can I edit hero in Add but not Edit?" easy expand: add hero field + handler to EditBoothSheet, `/api/vendor-hero` already supports the path. Not blocking.
- 🟡 **NEW: AddBoothInline retained on /admin Vendors tab** — duplicate Add UI (one on /admin, one on /shelves). Field shapes match. Future cleanup may unify if drift surfaces; not in scope.
- 🟡 **NEW: /vendor/[slug] no longer reachable from /shelves Pencil** — intentional per D1. Public profile remains served at the URL, reachable from `/shelf/[slug]` and direct nav. If beta surfacing reveals admins want it back, add a separate "View profile" eyebrow on EditBoothSheet (cheap follow-up).
- 🟡 **NEW: Slug-collision shares the BOOTH_CONFLICT path** — generic "booth number already exists" error message says "booth number" but the actual cause might be slug uniqueness (rare with slugify). If surfaced in the wild, add a slug-specific error path to PATCH.
- 🟡 **NEW: Third oscillation of AddBoothInline-on-/shelves** — sessions 37 + 67 retired it; session 74 restores intentionally per demo-authenticity argument. Captured in design record's "Carry-forward" so future sessions don't reflexively retire again.
- 🟡 **NEW: showPlaceholders prop infrastructure dormant in BoothPage** — after item 6 dropped `showPlaceholders={true}` on `/my-shelf`, the prop, the placeholderCount calc, the `Array.from` render loop, and the `PlaceholderTile` export are all unreachable. Cheap cleanup pass to reap (~10 min); deferred to keep the polish bundle tight.
- 🟡 **NEW: iPhone QA pending on six Gemba items** — David's QA walk hasn't happened yet for the day's shipments. None blocking; verify during the seeding walk.
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
- 🟡 **`/post/preview` masthead title-below-masthead pending iPhone QA** — unchanged carry from session 70 (note: this session touched /post/preview for item 4 but didn't change title placement).
- 🟡 **Booths grid lockup numeral size deviates from spec** — unchanged carry from session 70.
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
- `feedback_ask_which_state_first.md` (session 63) — applied to D1–D5 surfacing for the Edit sheet, then again to D6 + D7 after David added the Add affordance. Pattern is fully default; not worth tracking firing counts beyond noting it landed twice.
- `feedback_treehouse_no_coauthored_footer.md` (session 63) — applied to all 4 runtime/docs commits ✅.
- Same-session design-record-commit rule (session 56) — fired this session via `6d32c9c` (design-to-Ready) committed before `c5437df` (feat). 8th firing total. Beyond beyond default.

**Live discoveries:**

- **The "scope addition mid-mockup" pattern lands clean when the addition mirrors an established affordance.** David's "actually, also bring back Add a booth" landed AFTER D1–D5 were approved. The fact that the Add affordance mirrored AddFindTile (already shipped in same session as item 7) made the conceptual integration cheap. Worth noting for future sessions: if the addition mid-mockup parallels an existing pattern in the codebase, the marginal cost is low; if it requires a new visual primitive, the addition is a redirect not an addition.
- **Three-time oscillation pattern surfaces a meta-question.** AddBoothInline on `/shelves` has been added (orig) → removed (37) → added (44) → removed (67) → added (74). David acknowledged the oscillation explicitly. When a feature oscillates this many times, the operational tension behind the indecision (here: admin demo authenticity vs. /admin tidiness) is the actual design constraint, not the feature itself.
- **The Pencil bubble's prior `/vendor/[slug]` link was a "weakly aligned icon" hidden in plain sight.** Pencil universally means edit; linking to a read-only profile was wrong UX. Caught only because the booth management feature forced a careful look at affordance semantics on `/shelves`. Pattern: when adding a new affordance, audit existing affordances on the same surface — they may have semantic drift.

**Operational follow-ups:**
- Archive-drift accounting: rotated session 73 to tombstone. Session 68 falls off the bottom of last-5 visible tombstones. **Sessions 71 + 72 + 73 full blocks pruned** from CLAUDE.md (drift cleanup; tombstones already exist for sessions 71 + 72, session 73 tombstone added in this close). Archive-drift backfill to session-archive.md (sessions 54 + 55 + 57–73) still on the operational backlog — each session close adds one more name to the list without doing the backfill.
- Operational backlog (one new entry): unchanged from session 73 plus **NEW: reap dormant showPlaceholders prop infrastructure in BoothPage.tsx** (~10 min cleanup pass).

**Tech Rule candidates:** No new firings worth promotion. Single-firing pattern observed: "When proposing a UI rewire, audit existing affordances on the same surface for semantic drift" (the Pencil discovery). First firing — Tech Rule on second firing. Carry-forward unchanged from session 73.

**Notable artifacts shipped this session:**
- [`docs/booth-management-design.md`](docs/booth-management-design.md) — design record D1–D7 + acceptance criteria + carry-forwards. Captures the "third oscillation, intentional this pass" reasoning.
- [`docs/mockups/booth-edit-sheet-v1.html`](docs/mockups/booth-edit-sheet-v1.html) — 5-frame mockup (3 Edit + 2 Add) + decisions table + implementation block.
- [`components/BoothFormFields.tsx`](components/BoothFormFields.tsx) — reusable 3-field shared markup. Anti-drift abstraction for Add + Edit. Could extend to a third surface (admin import flow, future) without rework.
- [`components/EditBoothSheet.tsx`](components/EditBoothSheet.tsx) + [`components/AddBoothSheet.tsx`](components/AddBoothSheet.tsx) + [`components/AddBoothTile.tsx`](components/AddBoothTile.tsx) — three new components closing the booth-management capability gap.
- PATCH method on [`app/api/admin/vendors/route.ts`](app/api/admin/vendors/route.ts) — closes the missing edit endpoint that caused David's Gemba problem.

---

## Recent session tombstones (last 5)

> Older tombstones live in [`docs/session-archive.md`](docs/session-archive.md). Sessions 28–43 still awaiting archive-drift backfill (one-liner only); sessions 44–53 + 56 in archive (54 + 55 + 57–73 still missing — operational backlog growing).

- **Session 73** (2026-04-27) — R3 closed end-to-end in a single-track session. Eight runtime/docs commits + close resolving both halves of the analytics arc. **Write side:** 5 new event types via migration 012 (`booth_bookmarked`, `booth_unbookmarked`, `find_shared`, `tag_extracted`, `tag_skipped`) + `filter_applied` `page` field on Home/Booths/Find Map for per-tab attribution. Closes 4 deferred carries (sessions 59 + 62 + 67 + 68). Decisions D1–D4 frozen in design record §Amendment v1.1. **Read side:** parked-since-session-58 admin Events stale-data mystery resolved at root — Next.js HTTP-level data cache was intercepting `@supabase/supabase-js`'s internal `fetch()` calls; `force-dynamic` only disables route-response caching, doesn't propagate `cache: "no-store"` to inner fetches; two-line fix in [`lib/adminAuth.ts`](lib/adminAuth.ts) via `global.fetch` wrapper benefits every admin route + every `recordEvent` call. Diagnosed in one session via side-by-side probe pattern (built `/api/admin/events-raw` parked since session 60 + inline diag strip in admin Events tab → smoking-gun diff appeared on first reading, 78-min stale snapshot vs fresh raw). **Strategic conversation:** David flagged in-app admin tab is wrong shape for analytics long-term → Q-014 queued (Metabase + read-only Postgres role + 3 starter dashboards + retire admin tab post-Metabase). Diag strip + raw probe stay as durable visibility tooling per David's session-73 decision until Q-014 lands. Polish: chip wiring for v1.1 types (Bookmarks primary; Find shares + Tag flow overflow). ONE new memory (`feedback_side_by_side_probe_for_divergence.md`). ONE new Tech Rule candidate (TR-q: `force-dynamic` doesn't propagate `cache: "no-store"` to inner fetches; compounds with TR-l).
- **Session 72** (2026-04-26) — Small surgical session. One runtime commit (`27a0439`) rationalizing admin entry: BottomNav 4th slot for admins now carries a dedicated **Admin** tab (Lucide `Shield` 21px → `/admin`) replacing My Booth (admins have no booth assigned). Two redundant affordances retired in same commit: `/shelves` masthead `ADMIN` pill + green `Manage` eyebrow under each booth tile (Pencil + Trash bubbles already signal edit/delete intent). Vendor + Guest BottomNav layouts unchanged. ZERO new memories. ZERO new Tech Rule firings. Live discovery: "multi-affordance retirement → single-surface promotion" pattern echoed session 71's cartographic collapse on `/find/[id]` (parallel two cards → one inkWash card). Single-firing in admin context, single-firing in shopper context, watching for third instance.
- **Session 71** (2026-04-26) — Three independent decision arcs in three runtime commits + close (`54fa370` `/find/[id]` cartographic collapse / `30c2c0c` 3-item polish bundle / `704ff7a` caption min-height). Parallel two-card pattern on `/find/[id]` collapsed into ONE inkWash card with italic IM Fell "Find this item at" eyebrow above + vendor name + mall · city/state Apple Maps subtitle + Variant B booth numeral; cartographic spine (PinGlyph + tick + XGlyph) FULLY RETIRED across the v1.x ecosystem; link to `/mall/[slug]` retired from this surface. MallScopeHeader API extended with `count` prop rendering count alone at IM Fell italic 22px on Booths + Find Map (Home unchanged). FindTile/WindowTile/ShelfTile gain caption `minHeight: 76` + ShelfCard rail tile `minHeight: 56` — find tiles bottom-out at uniform heights regardless of caption-length variance. **Diagnosis-pivot mid-session:** Item 5 was scoped to E+B+A bundle pre-screenshot; David's screenshot of `/flagged` revealed actual cause was caption-variance not photo-cropping; shipped E only with B+A parked in mockup ready for second pass. Same-session design-record-commit rule 6th + 7th firings. `feedback_ask_which_state_first.md` 8th firing. ZERO new memories. Two new Tech Rule candidates: "verify sub-agent claims that contradict known semantic rules" (Explore agent's letterboxing claim contradicting `objectFit: cover`) + "ask for a screenshot before scoping multi-change visual fixes." Three carry items into session 72: animation consistency review (item 3, deferred), shareable filtered-mall link (item 6, deferred), B+A second pass parked.
- **Session 70** (2026-04-26) — Largest layout-redesign sweep in recent memory. Six runtime/docs commits + close (`3432338` 3 records design-to-Ready / `d6b5a75` find-detail mall card + post-it / `198560f` finds-map cartographic retirement / `cc322e9` masthead lock + scroll flatten / `48aa93a` round-2 polish / `ce5eb0c` Variant B booth lockup). Three primary records frozen + one mid-session lockup-revision (D1–D18 across [`docs/finds-map-redesign-design.md`](docs/finds-map-redesign-design.md) + [`docs/find-detail-cartographic-refinement-design.md`](docs/find-detail-cartographic-refinement-design.md) + [`docs/masthead-lock-design.md`](docs/masthead-lock-design.md) + L1–L9 in [`docs/booth-lockup-revision-design.md`](docs/booth-lockup-revision-design.md)). `/flagged` cartographic spine fully retired in favor of flat sectioned-list with inkWash card headers; `/find/[id]` mall block lifted to parallel inkWash card; `StickyMasthead` rewritten with locked-grid slot API + booth-page scroll flatten + `/post/preview` unification; round-2 iPhone-QA polish (Home logo retired, wordmark `translateY(-1px)` for ascender bias, address geoLine on Booths + Find Map, count merged into eyebrow); Variant B booth lockup shipped across three surfaces (vendor LEFT + "Booth" small-caps eyebrow + IM Fell numeral RIGHT). Same-session design-record-commit rule 5th firing. ZERO new memories.
- **Session 69** (2026-04-26) — Caption consistency + booth label unification + flag terminology sweep shipped end-to-end. Three runtime/docs commits + close (`935c065` terminology / `ab0a641` design-to-Ready / `3f1b4e5` implementation). 12 frozen decisions (D1–D12) at [`docs/caption-and-booth-label-design.md`](docs/caption-and-booth-label-design.md). Five tile-caption surfaces unified to Booths VendorCard treatment (warm `inkWash` card + IM Fell 14px regular non-italic title + sans 12px price + 9/10/11 padding). Booth label Option B (small-caps `BOOTH NN` eyebrow above vendor name) shipped on Booths grid + Find Detail; BoothHero post-it eyebrow collapsed two-line "Booth / Location" → single-line "Booth". User-visible "Save"/"Saved" UI strings flipped to "Flag"/"Flagged" terminology (5 hits across 4 files); internal naming intentionally unchanged. Pill component deleted from `/find/[id]`. Home feed timestamp italicized. Same-session design-record commit rule 4th firing.
---

## CURRENT ISSUE
> Last updated: 2026-04-27 (session 74 close — Gemba walk follow-up at America's Antique Mall: 7 items surfaced, all addressed across four runtime/docs commits; booth management Add + Edit sheets + PATCH endpoint shipped; feed content seeding still pending — now 17× bumped)

**Working tree:** clean. **Build:** green. **Beta gate:** technically unblocked since session 50; no code-level regressions. **NEW this session (four commits, Gemba-walk single-day cycle):** David's pre-seeding Gemba walk at America's Antique Mall surfaced seven items spanning bug fixes, UX polish, and a meaningful new admin capability — all closed end-to-end. **Polish quartet (`30b9922`, items 1+5+6+7):** AddBoothInline `booth_number` accepts alphanumeric (autoCapitalize="characters"); /post/preview "Visit us on Facebook" CTA + FACEBOOK_PAGE_URL retired; AddFindTile / ShelfAddFindTile move from head to tail of grid in WindowView + ShelfView; /my-shelf showPlaceholders={true} dropped (default false). **Item 4 (`d52b149`):** /post/preview's three router.push call sites preserve `?vendor=<id>` through publish flow via two helper consts at top of `PostPreviewInner` — admin lands back on booth-of-origin, not own (empty) /my-shelf. **Items 2 + 3 + Add restoration (`6d32c9c` design-to-Ready + `c5437df` single feat commit):** Per `feedback_ask_which_state_first.md`, surfaced D1–D5 for Edit sheet shape (Pencil bubble repurpose, slug auto-update, no `user_id` safety gate, mall-change conflict path, no hero in Edit). David approved + asked for "Add a booth" affordance restoration on /shelves (third oscillation — sessions 37 + 67 retired it; restored this pass per demo-authenticity reasoning). D6 + D7 added (tail position, bottom-sheet pattern matching Edit, hero retained for mall-walk capture). 4 new components (BoothFormFields, EditBoothSheet, AddBoothSheet, AddBoothTile) + PATCH `/api/admin/vendors` with BOOTH_CONFLICT 409 path + /shelves rewire (Pencil swapped from `<Link href="/vendor/[slug]">` to `<button onClick={setEditTarget}>`, AddBoothTile mounted post-listings gated on `isAdmin`, both sheets joined existing AnimatePresence). Optimistic `setVendors` on success — no full reload. ZERO new memories. ZERO Tech Rule promotions; one single-firing candidate ("audit existing affordances for semantic drift when adding new ones"). **`feedback_ask_which_state_first.md`** applied as default opening (D1–D5 → D6/D7). **Same-session design-record-commit rule** fired (8th firing total). **Gate to V1:** feed content seeding + one quiet week → first beta vendor invite per [`docs/beta-plan.md`](docs/beta-plan.md). With booth management closed, real-content seeding can now also exercise the new edit/add flows on real vendors.

### 🚧 Recommended next session — Feed content seeding (~30–60 min)

Bumped from sessions 55, 60–73, **74**. **Top priority** — the actual V1 unblocker, now **17× bumped**. Session 74 closed seven Gemba-walk items end-to-end. Real content remains the actual unblocker — every closed gap has been infrastructure, observability, polish, or admin-management capability; none has been "we lack content." **Seventeen sessions** of polish + observability + brand + navigation + persistence + terminology + caption-typography + cartographic-redesign + masthead-lock + booth-lockup + image-stabilization + admin-chrome rationalization + R3-closure + booth-management; zero new reasons not to seed content. **NEW judgment moments to fold into the seeding walk** (in addition to all sessions 70–73 carry-forwards): (a) does the EditBoothSheet pre-fill correctly on a real claimed booth, (b) does the conflict pill copy read clearly when intentionally provoked (try editing a booth's mall to one where the booth_number already exists), (c) does the yellow "changed" flag aid or distract from the Edit experience, (d) does the new AddBoothTile feel native at the end of the grid, (e) does the AddBoothSheet's mall pre-select when filtered match expectation, (f) the four polish items (alphanumeric keyboard during admin-add, FB CTA absent on success screen, AddFindTile at tail of grid, my-shelf placeholders absent) verified in-flow, (g) item 4 fix verified — admin completes Add Find from a booth, success-screen "View my shelf" lands back on booth-of-origin not empty /my-shelf.

**Shape:**
- 🖐️ HITL (~30–60 min) — Source 10–15 real posts across 2–3 vendors. Photos + tags. With the tag-capture flow, the vendor takes 2 photos per post (item + tag) and the title + price prefill from the tag.
- 🟢 AUTO — Walk the Add Find → /post/tag → /post/preview flow for each, confirm tag prefill works on real-world content, confirm each lands on the right shelf and renders cleanly in the feed. **Use the new "Add a booth" tile to set up any new vendors during the walk** (items 2/3/Add restoration validate here).
- 🟢 AUTO — Run a partial T4d walk on the seeded surfaces. **Test the EditBoothSheet on at least one real vendor** (rename or move malls); intentionally provoke a (mall_id, booth_number) conflict to see the BOOTH_CONFLICT 409 conflict pill. Watch the admin Events tab + diag strip during the walk.
- 🟢 AUTO — Once content lands, the V1 beta-invite gate is the "one quiet week" of monitoring rather than a code/content gap.

### Alternative next moves (top 3)

1. **Q-014 — Metabase analytics surface** (David surfaced session 73, queued in [`docs/queued-sessions.md`](docs/queued-sessions.md)) — strategic next step on the analytics arc. 60–90 min initial session: provision read-only Postgres role + Metabase Cloud or self-hosted on Fly hobby + build 3 starter dashboards (vendor adoption, find engagement, tag-flow funnel). Becomes more valuable AFTER feed seeding lands. If investor touchpoint is imminent, Q-014 first then seeding produces visible-charts-immediately. Size M.
2. **Item 6 — shareable filtered-mall link** (David flagged session 71) — likely path: deep-link to a primary tab (Home / Booths / Find Map) with mall pre-selected via URL param, persistent via existing `treehouse_saved_mall_id` (session 68 infra). Avoids `/mall/[slug]` since that page is still v0.2 dark and deferred. Size M; needs design + URL-param scoping + mockup pass per `mockup-first` rule.
3. **Item 3 — animation consistency review** (David flagged session 71) — Find Map animates the location up; Booths doesn't animate at all. Multi-surface survey across primary tabs + scope headers + tile entry animations + sheet open/close. Size M; needs survey pass first via Explore agent.

Full alternatives + operational backlog in [`docs/queued-sessions.md`](docs/queued-sessions.md).

### Session 75 opener (pre-filled — feed content seeding)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Sentry · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Feed content seeding. The long-deferred V1 unblocker — 10–15 real posts across 2–3 vendors so the app has actual content for beta invites. Session 74 closed seven Gemba-walk items including the booth-management capability gap (EditBoothSheet + AddBoothSheet + AddBoothTile + PATCH /api/admin/vendors) — admins can now Add/Edit/Delete booths from /shelves without leaving for /admin. Walk the Add Find flow on iPhone for ~10–15 real posts. Use the new "Add a booth" tile during the walk to set up any new vendors. Try the EditBoothSheet on at least one existing booth (rename or move malls); intentionally provoke a (mall_id, booth_number) conflict to see the BOOTH_CONFLICT 409 conflict pill. Verify item 4 fix: admin completes Add Find from a booth, success-screen "View my shelf" lands back on booth-of-origin not empty /my-shelf. Keep the admin Events tab open during the walk to watch v1.1 events populate in real time + verify the diag strip stays green under seeding traffic. Run a partial T4d walk on the seeded surfaces. JUDGMENT MOMENTS: (a) EditBoothSheet pre-fill on real booth; (b) conflict pill copy clarity; (c) yellow "changed" flag — aid or noise; (d) AddBoothTile feels native at grid end; (e) AddBoothSheet mall pre-select; (f) polish quartet verified in-flow; (g) Item 4 fix — vendor preservation through publish flow; (h) all sessions 70–73 carry-forwards (cartographic card, count-in-eyebrow, find-tile bottom-out, photo cropping, Variant B lockup, sectioned-list /flagged, masthead wordmark, scroll-flatten, /post/preview title, IM Fell tile titles, mall-subtitle weak separator, admin BottomNav vs My Booth, diag strip green under traffic, Bookmarks chip real adoption, tag-extraction payload accuracy). Once content lands, V1 beta-invite gate becomes "one quiet week" of monitoring rather than a code/content gap. Q-014 (Metabase) becomes more valuable AFTER seeding (real data to chart); if an investor touchpoint is imminent, consider running Q-014 BEFORE seeding so dashboards populate live during the walk. Note: /mall/[slug] is intentionally lensless on v0.2 dark theme pending its v1.x migration. Existing /api/* routes are not yet wrapped with Sentry.wrapRouteHandlerWithSentry (Next.js 14 limitation). Item 3 (animation consistency review) + Item 6 (shareable filtered-mall link) parked for own sessions. Q-012 (Treehouse opener) and Q-013 candidate (Next.js 15 upgrade) parked. R3 diag strip + raw probe stay as durable visibility tooling until admin tab retires post-Q-014.
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
- **Feed content seeding** — rolled forward from sessions 55–73, **74**. 10–15 real posts across 2–3 vendors. **Top-of-stack** as recommended next session, now **17× bumped**. Sessions 61–73 each strengthened the case; session 74 closed Gemba-walk admin-management gaps. Real content remains the actual unblocker — every closed gap has been infrastructure, observability, polish, or admin capability; none has been "we lack content."
- **Hero image upload size guard** — verify coverage across upload surfaces. Note: session 61 added DELETE coverage at `/api/admin/featured-image`; size guard remains a separate concern on the upload path.
- **Tech Rule promotion batch** — 19+ candidates queued; **TR-l + TR-m both 🟢 promotion-ready**. Recent additions: session 61 (TR-n), session 62 (TR-p testbed-first for AI/LLM call unknowns + `feedback_testbed_first_for_ai_unknowns.md` memory), session 64 (`feedback_still_frame_before_animation_port.md`), session 65 (`feedback_verify_third_party_software_exists.md` + "platform-managed env > manual paste"), session 68 (`feedback_state_controls_above_hero_chrome.md`), session 69 ("when wrapping one part of a parallel structure in a card, decide for the whole structure or none of it" — arguably second-firing in session 71). Session 70 surfaced two single-firings ("smallest→largest commit sequencing" + "italic-ascender 1px lift"). Session 71 surfaced two ("verify sub-agent claims that contradict known semantic rules" + "ask for a screenshot before scoping multi-change visual fixes"). Session 73 surfaced **TR-q** ("`force-dynamic` does NOT propagate `cache: "no-store"` to inner fetches" — first firing; compounds with TR-l). Session 74 surfaced "audit existing affordances for semantic drift when adding new ones" (Pencil discovery, single firing). Full register: [`docs/tech-rules-queue.md`](docs/tech-rules-queue.md).
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

> **Sprint 4 fully closed sessions 40–41; sessions 42–53 ran the pre-beta polish arc; sessions 54–69 carried the polish + observability + brand + navigation + persistence + terminology + caption-typography + Option B booth-identity sweep; session 70 was the largest layout-redesign sweep in recent memory; session 71 closed three independent decision arcs in three runtime commits; session 72 was a small surgical session rationalizing admin entry; session 73 closed R3 end-to-end. **Session 74 closed seven Gemba-walk items end-to-end across four runtime/docs commits**: a quick polish quartet (alphanumeric booth keyboard, FB CTA retired, AddFindTile to grid tail, my-shelf placeholder grid dropped), a routing fix preserving `?vendor=<id>` through the post-publish flow for admin, and a meaningful new admin capability — booth management on `/shelves` with Add/Edit/Delete sheet ergonomics, a new `BoothFormFields` shared abstraction, `EditBoothSheet` + `AddBoothSheet` + `AddBoothTile` components, and a new PATCH `/api/admin/vendors` endpoint with conflict pill UX. Feed content seeding still pending, now **17× bumped** — seventeen sessions of polish + observability + brand + navigation + persistence + terminology + caption-typography + cartographic-redesign + masthead-lock + booth-lockup + image-stabilization + admin-chrome rationalization + R3-closure + booth-management. **Next natural investor-update trigger point** is now after feed content seeding lands — the update would report seventeen+ shipped capability items including R4c + R3 (write side fully wired + read side root-fixed) + tag-capture + R12 + the lens port + Booths public + booth bookmarks + cross-tab mall filter + terminology consistency + caption unification + cartographic redesign + masthead lock + Variant B booth lockup + cartographic collapse + count-in-eyebrow typography + caption stabilization + admin nav rationalization + R3 v1.1+v1.2 closure + booth management on /shelves, with Q-014 (Metabase) as the next-session-or-two strategic shipment that turns "data flowing" into "investor-ready dashboards."
