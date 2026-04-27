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

## ✅ Session 72 (2026-04-26) — admin BottomNav tab + masthead pill / Manage eyebrow retirement (one runtime commit)

Standup recommended feed content seeding (now 14× bumped). David redirected: move admin entry from `/shelves` masthead pill into a dedicated BottomNav tab (replacing My Booth, since admins have no booth assigned). Retire the green "Manage" eyebrow under booth tiles too — Pencil + Trash bubbles already signal edit/delete intent. The whole arc was a small surgical change, no mockup needed (no new visual primitives — same flex slot, same icon spec, same label typography).

Per `feedback_ask_which_state_first.md` (9th firing — fully default opening, not a notable practice), surfaced D1–D4 before writing code:
- **D1 (icon):** Lucide `Shield` (21px stroke 1.7 to match Home / Store / LayoutGrid) over Settings/cog (could read as generic settings menu) or ShieldCheck (chrome noise).
- **D2 (label):** "Admin" — single-word convention parity with Home / Booths / My Booth; matches the masthead pill copy we're retiring.
- **D3 (active highlight):** add `"admin"` to NavTab union for completeness, but no surface uses it as `active` — `/admin/page.tsx` doesn't render BottomNav at all (it's a destination page with its own chrome). The union extension is forward-compat only.
- **D4 (`/my-shelf` for admins):** leave as-is. Admin nav no longer points there; existing "No booth linked" empty state is correct + harmless for direct-URL traffic. Redirect logic + tailored empty-state copy both rejected as over-design for an edge case admins shouldn't normally hit.

David approved all four. Shipped as one commit `27a0439` (+26/-27 across 2 files):
- [`components/BottomNav.tsx`](components/BottomNav.tsx) — `Shield` import + `isAdmin` import + `adminTab` def + conditional 4th-slot swap (`user && isAdmin(user) ? adminTab : myBoothTab`); `NavTab` union extended with `"admin"`; header comment updated to reflect the three-way layout (Guest 3 tabs / Vendor 4 / Admin 4 with Admin in the 4th slot).
- [`app/shelves/page.tsx`](app/shelves/page.tsx) — masthead `right={...}` AdminOnly pill removed; "Manage" eyebrow AdminOnly block under each booth tile removed. `Link` + `AdminOnly` imports retained (still used by the Pencil/Trash bubbles + the section-header mall-status pill).

Build green; pushed to prod. iPhone QA pending.

**Final state in production (as of `27a0439`):**

- Admin BottomNav: Home · Booths · Find Map · **Admin** (Shield 21px → `/admin`).
- Vendor BottomNav: Home · Booths · Find Map · My Booth (unchanged).
- Guest BottomNav: Home · Booths · Find Map (unchanged).
- `/shelves` masthead right slot is now empty for everyone — AdminOnly pill retired across all states.
- `/shelves` booth tiles for admins: Pencil + Trash bubbles top-right unchanged; "Manage" green eyebrow under the card body removed (no visual replacement — the bubbles carry the affordance).
- `/my-shelf` for direct-URL admin traffic: unchanged ("No booth linked" empty state preserved).
- No DB / RLS / API / migration changes — pure presentational + nav.

**Commits this session (1 runtime + 1 close):**

| Commit | Message |
|---|---|
| `27a0439` | feat(nav): admin gets dedicated bottom-nav tab; retire masthead pill + Manage eyebrow |
| (session close) | docs: session 72 close — admin BottomNav tab + masthead pill / Manage eyebrow retirement |

**What's broken / carried (delta from session 71):**

- 🟢 **Admin entry on `/shelves` is no longer cluttered with redundant chrome** — both the masthead pill AND the per-tile Manage eyebrow are retired. Admin lands on `/admin` via a single durable surface (BottomNav tab) reachable from every primary tab.
- 🟢 **`/my-shelf` no longer surfaces a dead-end "No booth linked" state for admins via nav** — admin nav now points at `/admin` directly. The empty state still exists for direct-URL traffic but isn't reachable through normal navigation.
- 🟡 **Feed content seeding still pending** — bumped from sessions 55, 60–71, **72**. Now **15× bumped**. Session 72 closed an admin-chrome gap orthogonal to seeding but the recommendation is unchanged. **Top recommended next session.** New judgment moments to fold in: (a) does the Admin BottomNav tab read distinguishably from the My Booth tab vendors see (Shield vs Store icon), (b) does the now-empty masthead right slot on `/shelves` look intentional (vs accidentally bare), (c) do admin-managed booth tiles read as manageable without the Manage eyebrow now that only the corner bubbles signal it.
- 🟡 **Item 3 — animation consistency review** — unchanged carry from session 71.
- 🟡 **Item 5 follow-up B + A parked** — unchanged carry from session 71.
- 🟡 **Item 6 — shareable filtered-mall link** — unchanged carry from session 71.
- 🟡 **`/mall/[slug]` v1.x migration STILL deferred** — unchanged carry from session 71.
- 🟡 **All-malls scope mall-subtitle weak separator on `/flagged`** — unchanged carry from session 70.
- 🟡 **Booth-page scroll flatten (D17) regression watch** — unchanged carry from session 70.
- 🟡 **`/post/preview` masthead unification — title-below-masthead pending iPhone QA** — unchanged carry from session 70.
- 🟡 **Booths grid lockup numeral size deviates from spec** — unchanged carry from session 70.
- 🟡 **BoothHero post-it `minHeight: 96`** — unchanged carry from session 69.
- 🟡 **D4b session-46 reversal needs real-photo validation** — unchanged carry from session 69.
- 🟡 **R3 admin Events stale-data mystery** — unchanged.
- 🟡 **Tag-extraction / booth-bookmark / mall-filter analytics events** — unchanged.
- 🟡 **Sign-in icon discoverability** — unchanged watch-item from session 63.
- 🟡 **Q-012 — Treehouse opener** — parked, unchanged.
- 🟡 **Existing `/api/*` routes unwrapped re Sentry** — unchanged.
- 🟡 **Q-013 candidate — Next.js 15 upgrade** — unchanged.
- 🟡 **Treehouse Lens constant is provisional** — unchanged.

**Memory updates:** ZERO new memories.

Existing memories that load-bore the session:
- `feedback_ask_which_state_first.md` (session 63) — applied to D1–D4 surfacing. **9th firing.** As noted in session 71's tombstone, this pattern has fully transcended "rule" status; future sessions should not flag firing counts. (Stopping the count here.)
- `feedback_treehouse_no_coauthored_footer.md` (session 63) — applied to runtime + close commits ✅.
- Same-session design-record-commit rule (session 56) — **did not fire this session**. The change was small surgical work without a frozen-design-record artifact (no mockup, no `-design.md`). The rule fires on sessions that *produce* design records; sessions that ship without them don't trigger it. Worth a quiet note for future-Claude: 7 prior firings make it look ubiquitous, but it is conditional on a design-record artifact existing in the first place.

**Live discoveries:**

- **D3's union-extension was for forward-compat only.** I proposed adding `"admin"` to `NavTab` and wiring `/admin/page.tsx` to pass `active="admin"` — but `/admin` doesn't render BottomNav. The union extension still landed (cheap, harmless, future-proof if `/admin` ever gains BottomNav), but the `active="admin"` wiring was moot. Worth flagging for any future admin-page redesign that adds BottomNav: the type union is already there.
- **Multi-affordance retirement → single-surface promotion is a clean pattern.** Three admin-entry affordances (`/shelves` masthead pill + per-tile Manage eyebrow + the implicit "no, there's no admin tab" of My Booth as the 4th slot) collapsed into ONE durable surface (BottomNav Admin tab). This is the same shape as session 71's cartographic collapse on `/find/[id]` (parallel two cards → single inkWash card). Both reduced UI surface area while strengthening the primary affordance. **Not yet a Tech Rule candidate** — single firing in admin context, single firing in shopper context — but worth watching for a third instance.

**Operational follow-ups:** Archive-drift accounting now includes session 71 (rotated off the visible tombstone list). Session 66 falls off the bottom of the last-5 list with this close; archive-drift backfill (sessions 54 + 55 + 57–71) still on the operational backlog.

**Tech Rule candidates:** No new firings this session.

Carry-forward unchanged from session 71. The "multi-affordance → single-surface promotion" observation above is a single-firing pattern in the admin context (session 72) but echoes session 71's cartographic collapse in the shopper context — could compound into a Tech Rule on a third firing.

**Notable artifacts shipped this session:** none beyond the runtime change. `components/BottomNav.tsx` header comment block now explicitly documents the three-way layout (Guest / Vendor / Admin) so future sessions don't have to grep auth.ts to understand what shows where.

---

## ✅ Session 71 (2026-04-26) — `/find/[id]` cartographic collapse + 3-item polish bundle + image-height standardization (E only) shipped end-to-end (three runtime commits)

Sequenced as three independent decision arcs, each with its own design record + iPhone-QA pause. Standup opened on feed content seeding (now 13× bumped). David redirected: "scope item 1" — `/mall/[slug]` v1.x ecosystem migration. Investigation revealed session 70's parallel mall card on `/find/[id]` had unintentionally turned `/mall/[slug]` (still v0.2 dark theme) into a hero-level destination. David: *"I didn't realize it actually linked anything"* — pivot from "fix `/mall/[slug]`" to "retire the link from `/find/[id]`" via cartographic collapse. After that shipped, David surfaced a 6-item list (1: remove XGlyph from `/find/[id]`; 2: "Find this item at" eyebrow; 3: animation consistency review; 4: bump count number font; 5: portrait/square image standardization; 6: shareable filtered-mall link). Triaged 1+2+4 as a polish bundle this session, scoped 5 next, deferred 3 + 6 to own sessions. **Three runtime commits + 1 mockup + 2 design records + 0 new memories.** Same-session design-record-commit rule fired TWICE more this session (6th + 7th total firings: cartographic-collapse-design.md committed with `54fa370`; image-standardization-design.md + mockup committed with `704ff7a`). `feedback_ask_which_state_first.md` fired again at the cartographic-collapse decision batch (D1–D3). Two new Tech Rule candidates surfaced.

The session ran in five beats:

1. **Standup → David redirect.** Recommended feed content seeding (13× bumped). David: *"Lets look at 1. as I'm not sure what we're trying to solve for on this or if its a non issue now."* Read `/mall/[slug]` directly: page is on v0.2 dark theme + Georgia serif + custom sticky header + dark photo gradient + no MallScopeHeader + no Variant B lockup + monospace count + lens-fighting darkening filter. Reachable from `/find/[id]` (session-70 parallel mall card) + `/vendor/[slug]`. Recommended **defer** until feed seeding shows whether shoppers actually traverse the warm-→-dark cliff. David accepted the defer but added a redirect: *"we should change the way those cards show up on that page"* — referencing the Variant C all-malls-scope frame from session-70 mockup. Wanted to collapse the two-card pattern on `/find/[id]` into ONE card with mall · city/state subtitle, drop the visit-the-booth text, retire the `/mall/[slug]` link from this surface.

2. **Cartographic collapse decision batch + ship (`54fa370`, +161/−138 across 2 files).** Per `feedback_ask_which_state_first.md` (8th firing now), surfaced D1–D3 with rationale before writing code: D1 mall street address fate (recommend (c) — keep mall · city/state line as tappable Apple Maps link, drop the visible address); D2 card link target (recommend `/shelf/[vendorSlug]`; retire `/mall/[slug]` link); D3 numeral typography (recommend keep IM Fell Variant B for parity with `/flagged` + Booths). David confirmed all three. Skipped a fresh mockup since session-70's "Variant C · all-malls scope" frame + the screenshot David sent already covered the structural pattern; existing mockup serves as the design source. Wrote [`docs/find-detail-cartographic-collapse-design.md`](docs/find-detail-cartographic-collapse-design.md) (D1–D6 + spine simplification: D5 retire PinGlyph + tick, keep XGlyph anchored to single card). Implemented: dropped `mallSlug` + `mallAddr` + `PinGlyph` as orphans; collapsed parallel mall card into the booth card; subtitle "Antique World · Lexington, KY" wraps in `<a href={mapLink}>` with dotted-underline + `e.stopPropagation()`. Build green; committed design record + implementation in one commit per the same-session rule (6th firing). David approved push: *"commit and push."*

3. **Six-item David list → triage → 1+2+4 polish bundle ship (`30c2c0c`, +33/−39 across 4 files).** David walked the deploy on iPhone, surfaced six items: (1) remove the XGlyph spine on `/find/[id]` since cartographic identity no longer earns its place there (no other page carries it after session 70 retired it on `/flagged`); (2) add "Find this item at" eyebrow above the card; (3) animation consistency review across pages (Find Map animates location up, Booths doesn't); (4) bump the count number font in MallScopeHeader eyebrow (felt small); (5) portrait images cropped + smaller than square images on Find Map carousel + my-shelf window/shelf views; (6) direct shareable filtered-mall link for malls to share. Triaged into table with size estimates: 1+2+4 small + decoupled = ship this session; 3 + 5 + 6 each warrant scoping pass. For 2 + 4 surfaced typography decisions: Item 2 picked (b) IM Fell italic 14px / `inkMid` over the card (vs small-caps eyebrow or plain sans); Item 4 picked (b) lift the count alone to IM Fell italic larger size while eyebrow prose stays sans-italic 11px. Implemented:
   - **Item 1** — XGlyph spine column dropped; grid wrapper `28px 1fr` simplified to flat container; `XGlyph` component deleted as orphan.
   - **Item 2** — italic IM Fell 14px "Find this item at" eyebrow added above the cartographic card with 8px margin-bottom + 2px paddingLeft.
   - **Item 4** — `MallScopeHeader` API extended with optional `count` prop. When provided, renders inline at IM Fell italic 22px before the 15px eyebrow text. `/shelves` (Booths) + `/flagged` (Find Map) call sites updated to pass `count={boothCount}` / `count={findCount}` and drop the count from the eyebrow string. Home unchanged (no count in eyebrow).
   - Build green; pushed to prod.

4. **Item 5 scoping → Explore agent inventory → diagnosis pivot → ship E only (`704ff7a`, 5 files +572/−4 with mockup + design record).** Per `feedback_visibility_tools_first.md`, spawned Explore agent up front to inventory every post-image render surface + the upload pipeline. **Explore agent's report had a critical error** — claimed square photos get "letterboxed" with `objectFit: cover`, which contradicts how cover works (cover always fills slot, cropping excess; never letterboxes). Pushed back, did own grep-driven inventory, confirmed all four called-out surfaces (FindTile, WindowTile, ShelfTile, ShelfCard rail) use `aspect-ratio: 4/5` + `objectFit: cover` uniformly. Surfaced 5 fix options (A: flip slot 4/5 → 1/1; B: `object-position: center top`; C: capture image dims at upload; D: enforce upload-time crop; E: caption `min-height` to fix card-height variance). Recommended **E + B + A bundle**. David approved bundle, asked for **mockup-first** per design system rule. Wrote [`docs/mockups/image-standardization-v1.html`](docs/mockups/image-standardization-v1.html) — 12 phone frames in BEFORE/AFTER bands across the four surfaces with deliberately-aspected SVG data-URI photos so cropping math renders truthfully in browser + 3:4 portrait + 1:1 square + 4:3 horizontal source variants + caption length variance + decisions block + comparison band + final judgment ask. **David sent a screenshot of `/flagged`** showing 2 visible tiles (Dog statue / Feuerhand kerosene lantern) + clarified: *"The photos taken that are longer are actually the square formatted images. and the shorter dog photo was a portrait image."*

   **The screenshot revealed the diagnosis was wrong.** Photos within tiles ARE uniform-height (the `aspect-ratio: 4/5` slot enforces it correctly). What differs is **total card height**, driven by caption-length variance (1-line title vs 2-line title; price present vs not). David's "longer / shorter" labels mapped to TOTAL CARDS, not photo slots. The actual visible problem is caption-height variance, not photo cropping. **E alone addresses the root cause.** Revised recommendation: ship E first, defer B + A pending iPhone QA. David: *"ship E only first."*

   Implemented: caption div on FindTile / WindowTile / ShelfTile gains `minHeight: 76` (math: 14px IM Fell × 1.2 line-height × 2 lines = 33.6px + 12px sans × 1.4 = 16.8px + 3px margin + 20px vertical padding = 73.4px natural max → 76 with cushion). ShelfCard rail tile (title-only, no price) gets `minHeight: 56` (53.4px max → 56 cushion). Wrote [`docs/image-standardization-design.md`](docs/image-standardization-design.md) capturing E-only scope + the parked B+A as ready-to-ship-on-second-pass. Build green; committed design record + mockup + implementation in one commit per the same-session rule (7th firing). David: *"issue resolved."*

5. **Items 3, 5(B+A), 6 deferred to next sessions.** Item 3 (animation consistency review) needs multi-surface survey + design pass. Item 5 follow-up (B + A — `object-position: top` + slot-ratio flip 4/5 → 1/1) parked since E alone resolved the visible issue; existing mockup carries D1+D2 ready to ship if real-content seeding reveals a residual photo-cropping issue. Item 6 (shareable filtered-mall link) needs product + URL-param + share UX + mockup pass.

**Final state in production (as of `704ff7a`):**

- `/find/[id]` cartographic block is now ONE inkWash card with italic "Find this item at" eyebrow above. Card carries: vendor name (IM Fell 18px) → mall · city/state subtitle (sans 11.5px, dotted-underline Apple Maps link) → "BOOTH" + IM Fell 26px numeral on right (Variant B unchanged). Whole card tappable to `/shelf/[vendorSlug]`.
- The cartographic spine is fully retired on this page. PinGlyph + hairline tick + XGlyph all deleted. The "X marks the spot" cartographic identity that was load-bearing in session 70's hybrid-call no longer survives anywhere in the v1.x ecosystem (retired on `/flagged` session 70; retired on `/find/[id]` session 71).
- Link to `/mall/[slug]` from `/find/[id]` is retired. `/vendor/[slug]` retains its `/mall/` link until that page's own redesign.
- MallScopeHeader on Booths + Find Map: count number renders inline at IM Fell italic 22px before the 15px sans eyebrow phrase. Home unchanged.
- Find tile surfaces (FindTile / WindowTile / ShelfTile) cards now bottom-out at the same row regardless of caption length. ShelfCard rail tile (title-only) similarly stabilized.
- `mallSlug` + `mallAddr` extracts removed from `/find/[id]`. `PinGlyph` + `XGlyph` components removed as orphans.
- No DB / RLS / API / migration changes — pure presentational.

**Commits this session (3 runtime/docs + 1 close):**

| Commit | Message |
|---|---|
| `54fa370` | feat(find-detail): cartographic collapse — single card with mall subtitle |
| `30c2c0c` | fix(find-detail+scope-header): XGlyph retired, eyebrow above card, count bumped |
| `704ff7a` | fix(tiles): caption min-height stabilizes card heights across find tiles |
| (session close) | docs: session 71 close — cartographic collapse + 3-item polish bundle + image-height standardization (E only) |

**What's broken / carried (delta from session 70 close):**

- 🟡 **Feed content seeding still pending** — bumped from sessions 55, 60–70, **71**. Now **14× bumped**. Session 71 closed the `/find/[id]` cartographic asymmetry that compounded into a real visual cliff (parallel mall card → `/mall/[slug]` v0.2 dark theme), retired the spine entirely, fixed card-height variance on find tiles, and bumped the eyebrow count typography. **Real content remains the actual unblocker. Top recommended next session.** New judgment moments to fold into the seeding walk: (a) does the collapsed `/find/[id]` cartographic card read as grounded with real mall + booth data + the new "Find this item at" italic eyebrow, (b) does the count-in-eyebrow at IM Fell italic 22px hold against real counts (1, 47, 200), (c) do find tiles bottom-out cleanly when real titles span 1, 2, or wraps with prices in mixed presence, (d) any portrait-vs-square photo cropping perception issues still surface on Find Map carousel after E landed (if yes, ship parked B + A from `image-standardization-design.md`).
- 🟡 **NEW: Item 3 — animation consistency review across pages** (David flagged session 71) — Find Map animates the location up; Booths doesn't animate at all. Multi-surface survey needed before scoping. Probably its own session. Hot path: framer-motion `motion.div` initial/animate/transition props across primary tabs + scope headers + tile entry animations + sheet open/close.
- 🟡 **NEW: Item 5 follow-up B + A parked** — `object-position: center top` + slot-ratio flip 4/5 → 1/1 stay parked unless real-content seeding reveals residual photo-cropping issues. Mockup at [`docs/mockups/image-standardization-v1.html`](docs/mockups/image-standardization-v1.html) ready to ship as a second pass.
- 🟡 **NEW: Item 6 — shareable filtered-mall link** (David flagged session 71) — for malls to share a direct URL to their mall view. Needs product + URL-param scheme + share UX + mockup pass. Two possible directions: (a) deep-link to a primary tab (Home / Booths / Find Map) with mall pre-selected via URL param, persistent via existing `treehouse_saved_mall_id` (session 68); (b) send to `/mall/[slug]` (which is still v0.2 dark and deferred). Direction (a) is the cleaner answer given session-68's persistence infra.
- 🟢 **`/find/[id]` cartographic visual asymmetry** ✅ — already RESOLVED session 70. Session 71 went further by collapsing both cards into one.
- 🟢 **`/mall/[slug]` link from `/find/[id]`** ✅ — RESOLVED session 71 (retired). The cliff to v0.2 dark theme on this surface is closed. `/mall/[slug]` is now reachable only from `/vendor/[slug]` until that page's own redesign.
- 🟡 **`/mall/[slug]` v1.x migration STILL deferred** — page itself still on v0.2 dark theme. Reachable from `/vendor/[slug]`. Migration is now lower-traffic (one fewer entry point) but still on the Sprint 5 follow-on list whenever real shoppers find it via vendor profiles.
- 🟡 **NEW: Sub-agent claim verification** — Explore agent's image-rendering inventory contained a fabricated "letterboxing" claim that contradicts how `objectFit: cover` works. Caught by my own verification grep. Single firing this session — could become Tech Rule on second firing: "Verify sub-agent claims that contradict known semantic rules of the underlying system."
- 🟡 **NEW: Screenshot-before-scoping for visual fixes** — Item 5 was scoped to E+B+A bundle pre-screenshot. David's screenshot revealed E alone solved the actual problem; B+A would have shipped aesthetic changes that weren't necessary. Single firing this session — could become Tech Rule on second firing: "When proposing a multi-change visual fix, ask for a screenshot first; the user's mental model of the cause may differ from the actual mechanism."
- 🟡 **All-malls scope mall-subtitle weak separator on `/flagged`** — unchanged from session 70.
- 🟡 **Booth-page scroll flatten (D17) regression watch** — unchanged from session 70.
- 🟡 **`/post/preview` masthead unification — title-below-masthead pending iPhone QA** — unchanged from session 70.
- 🟡 **Booths grid lockup numeral size deviates from spec** — unchanged from session 70.
- 🟡 **BoothHero post-it `minHeight: 96`** — unchanged from session 69.
- 🟡 **D4b session-46 reversal needs real-photo validation** — unchanged. (Note: session-71 `minHeight: 76` on caption may make this less acute since variable-caption-pinch on the photo is now decoupled from the card-height stabilization; still worth real-photo judgment.)
- 🟡 **R3 admin Events stale-data mystery** — unchanged.
- 🟡 **Tag-extraction analytics events** — unchanged.
- 🟡 **Booth-bookmark analytics events** — unchanged.
- 🟡 **Mall-filter analytics events not wired on Booths + Find Map** — unchanged.
- 🟡 **Sign-in icon discoverability** — unchanged watch-item from session 63.
- 🟡 **Q-012 — Treehouse opener** — parked, unchanged.
- 🟡 **Existing `/api/*` routes unwrapped re Sentry** — unchanged.
- 🟡 **Q-013 candidate — Next.js 15 upgrade** — unchanged.
- 🟡 **Treehouse Lens constant is provisional** — unchanged.

**Memory updates:** ZERO new memories.

Existing memories that load-bore the session:
- `feedback_ask_which_state_first.md` (session 63) — applied at the cartographic-collapse decision batch (D1–D3). **Eighth firing across recent sessions.** Pattern is so default that future sessions should drop the firing-count tracking — it's just how Claude opens visual decisions now.
- `feedback_visibility_tools_first.md` (session 60) — applied to item 5 scoping: spawned Explore agent up front to inventory image-render surfaces. Agent's report contained a fabricated letterboxing claim, but the inventory-first instinct + the verification step that caught it together saved the session from shipping a wrong-cause fix.
- `feedback_treehouse_no_coauthored_footer.md` (session 63) — applied to all 3 commits + this close ✅.
- Same-session design-record-commit rule (session 56) — fired TWICE this session: (1) `54fa370` carries `find-detail-cartographic-collapse-design.md` + implementation; (2) `704ff7a` carries `image-standardization-design.md` + mockup + implementation. **Sixth + seventh firings; 7 total firings since session 56.** Beyond beyond default.

**Live discoveries:**

- **Sub-agent claim that contradicts CSS semantics needs verification before trust.** The Explore agent's image-rendering inventory included: *"Square photos cropped (cover), causing visible letterboxing with black padding at bottom."* That's structurally impossible — `objectFit: cover` always fills the slot. Cover crops, never letterboxes. Caught by reading the actual `aspect-ratio` + `objectFit` code in 4 source files myself. Worth a Tech Rule candidate: "Verify sub-agent claims that contradict known semantic rules of the underlying system." First firing this session.
- **Asking for a screenshot before scoping a visual fix saves shipping unnecessary aesthetic changes.** Item 5 was scoped to E+B+A bundle pre-screenshot. The screenshot revealed E alone addressed the actual cause (caption-variance) — B+A would have flipped slot ratio to 1/1 (real aesthetic change) and added top-crop position (subjective improvement) without solving anything that wasn't already solved by E. First firing this session — Tech Rule candidate: "When proposing a multi-change visual fix, ask for a screenshot first; the user's mental model of the cause may differ from the actual mechanism."
- **Same-session design-record-commit rule firing for the SIXTH + SEVENTH times. SEVEN total firings since session 56. The rule has fully transcended "rule" status — it's just how decisions land in this codebase now.** Future sessions should not flag the firing count individually; just do it.
- **`feedback_ask_which_state_first.md` firing for the EIGHTH time** — pattern is the default opening, not a notable practice. Stop tracking firing counts.
- **Diagnosis-before-prescription on visual bugs.** When David surfaced "portrait images are smaller than square ones," my initial framing was photo-cropping math (objectFit subject scale, slot ratio mismatch). The screenshot revealed the actual cause was caption-variance in adjacent grid cells. Recovering from a wrong initial frame required: (a) swallowing the framing pivot rather than defending the bundle, (b) re-reading the screenshot as primary evidence over my mental model, (c) shipping the smaller scope (E only) rather than executing the pre-approved bundle. Worth tracking — could compound with the screenshot-first rule into a single Tech Rule about visual-fix scoping.

**Operational follow-ups:** Archive-drift accounting now includes session 70 (rotated off the visible tombstone list). No new entries beyond the carry list.

**Tech Rule candidates:** Two NEW candidates surfaced this session:
- **"Verify sub-agent claims that contradict known semantic rules of the underlying system"** — single firing. Tech Rule on second firing.
- **"When proposing a multi-change visual fix, ask for a screenshot first"** — single firing. Tech Rule on second firing.

Carry-forward candidates: session-69 "parallel-structure card consistency" (load-bearing again this session as the cartographic collapse extended the principle to a vendor+mall-subtitle composition; arguably second-firing). Session-70 "smallest→largest commit sequencing" + "italic-ascender 1px lift" both still single firings. Session-68 "filter as intent → empty-state needs inline clear-filter link" unchanged.

**Notable artifacts shipped this session:**
- [`docs/find-detail-cartographic-collapse-design.md`](docs/find-detail-cartographic-collapse-design.md) — design record (D1–D6) capturing the collapse decision + spine-simplification rationale + the rejected "fully retire spine" alternative + carry-forward notes.
- [`docs/image-standardization-design.md`](docs/image-standardization-design.md) — design record for the E-only ship + parked B+A second-pass + math justification for `minHeight` values + acceptance criteria.
- [`docs/mockups/image-standardization-v1.html`](docs/mockups/image-standardization-v1.html) — 12-frame mockup with deliberately-aspected SVG data-URI photos so cropping math renders truthfully in the browser. **Reusable** for any future "show me what happens to X-aspect photo in Y-aspect slot" review — the SVG-data-URI-photo primitive is a low-cost way to demonstrate `objectFit: cover` behavior accurately without depending on the network or pulling stock images.

---

## Recent session tombstones (last 5)

> Older tombstones live in [`docs/session-archive.md`](docs/session-archive.md). Sessions 28–43 still awaiting archive-drift backfill (one-liner only); sessions 44–53 + 56 in archive (54 + 55 + 57–71 still missing — operational backlog growing).

- **Session 71** (2026-04-26) — Three independent decision arcs in three runtime commits + close (`54fa370` `/find/[id]` cartographic collapse / `30c2c0c` 3-item polish bundle / `704ff7a` caption min-height). Parallel two-card pattern on `/find/[id]` collapsed into ONE inkWash card with italic IM Fell "Find this item at" eyebrow above + vendor name + mall · city/state Apple Maps subtitle + Variant B booth numeral; cartographic spine (PinGlyph + tick + XGlyph) FULLY RETIRED across the v1.x ecosystem; link to `/mall/[slug]` retired from this surface. MallScopeHeader API extended with `count` prop rendering count alone at IM Fell italic 22px on Booths + Find Map (Home unchanged). FindTile/WindowTile/ShelfTile gain caption `minHeight: 76` + ShelfCard rail tile `minHeight: 56` — find tiles bottom-out at uniform heights regardless of caption-length variance. **Diagnosis-pivot mid-session:** Item 5 was scoped to E+B+A bundle pre-screenshot; David's screenshot of `/flagged` revealed actual cause was caption-variance not photo-cropping; shipped E only with B+A parked in mockup ready for second pass. Same-session design-record-commit rule 6th + 7th firings. `feedback_ask_which_state_first.md` 8th firing. ZERO new memories. Two new Tech Rule candidates: "verify sub-agent claims that contradict known semantic rules" (Explore agent's letterboxing claim contradicting `objectFit: cover`) + "ask for a screenshot before scoping multi-change visual fixes." Three carry items into session 72: animation consistency review (item 3, deferred), shareable filtered-mall link (item 6, deferred), B+A second pass parked.
- **Session 70** (2026-04-26) — Largest layout-redesign sweep in recent memory. Six runtime/docs commits + close (`3432338` 3 records design-to-Ready / `d6b5a75` find-detail mall card + post-it / `198560f` finds-map cartographic retirement / `cc322e9` masthead lock + scroll flatten / `48aa93a` round-2 polish / `ce5eb0c` Variant B booth lockup). Three primary records frozen + one mid-session lockup-revision (D1–D18 across [`docs/finds-map-redesign-design.md`](docs/finds-map-redesign-design.md) + [`docs/find-detail-cartographic-refinement-design.md`](docs/find-detail-cartographic-refinement-design.md) + [`docs/masthead-lock-design.md`](docs/masthead-lock-design.md) + L1–L9 in [`docs/booth-lockup-revision-design.md`](docs/booth-lockup-revision-design.md)). `/flagged` cartographic spine fully retired in favor of flat sectioned-list with inkWash card headers; `/find/[id]` mall block lifted to parallel inkWash card; `StickyMasthead` rewritten with locked-grid slot API + booth-page scroll flatten + `/post/preview` unification; round-2 iPhone-QA polish (Home logo retired, wordmark `translateY(-1px)` for ascender bias, address geoLine on Booths + Find Map, count merged into eyebrow); Variant B booth lockup shipped across three surfaces (vendor LEFT + "Booth" small-caps eyebrow + IM Fell numeral RIGHT). Same-session design-record-commit rule 5th firing. ZERO new memories.
- **Session 69** (2026-04-26) — Caption consistency + booth label unification + flag terminology sweep shipped end-to-end. Three runtime/docs commits + close (`935c065` terminology / `ab0a641` design-to-Ready / `3f1b4e5` implementation). 12 frozen decisions (D1–D12) at [`docs/caption-and-booth-label-design.md`](docs/caption-and-booth-label-design.md). Five tile-caption surfaces unified to Booths VendorCard treatment (warm `inkWash` card + IM Fell 14px regular non-italic title + sans 12px price + 9/10/11 padding). Booth label Option B (small-caps `BOOTH NN` eyebrow above vendor name) shipped on Booths grid + Find Detail; BoothHero post-it eyebrow collapsed two-line "Booth / Location" → single-line "Booth". User-visible "Save"/"Saved" UI strings flipped to "Flag"/"Flagged" terminology (5 hits across 4 files); internal naming intentionally unchanged. Pill component deleted from `/find/[id]`. Home feed timestamp italicized. Same-session design-record commit rule 4th firing.
- **Session 68** (2026-04-26) — Cross-tab mall filter persistence shipped end-to-end on prod across Home / Booths / Find Map. Three runtime/docs commits + close (`991ac5f` design-to-Ready / `0af526b` implementation / `7357b9f` iPhone-QA polish). 10 frozen decisions (D1–D10) at [`docs/mall-filter-persistence-design.md`](docs/mall-filter-persistence-design.md). New [`components/MallScopeHeader.tsx`](components/MallScopeHeader.tsx) primitive (eyebrow + tappable bold name + chevron + optional geo line) + [`lib/useSavedMallId.ts`](lib/useSavedMallId.ts) hook (mount-time read; App Router unmount/remount IS the cross-tab sync) + `<MallSheet>` `countUnit` prop. Shared localStorage key `treehouse_saved_mall_id` (zero migration). iPhone QA verdict: "Such a huge improvement on the experience." Same-session design-record commit rule firing for the THIRD time = fully durable institutional practice (origin 56 → 67 → 68). New `feedback_state_controls_above_hero_chrome.md` memory.
- **Session 67** (2026-04-26) — Booths page (`/shelves`) opened to all users + booth-bookmark feature shipped end-to-end. Three runtime/docs commits + close (`dccc34c` design-to-Ready / `fe6c33f` runtime / `47fb1b4` font + subtitle polish). Twelve frozen decisions at [`docs/booths-public-design.md`](docs/booths-public-design.md). New [`components/BookmarkBoothBubble.tsx`](components/BookmarkBoothBubble.tsx) primitive (Lucide `Bookmark`, 28px tile / 38px masthead variants), new booth-bookmark helpers in [`lib/utils.ts`](lib/utils.ts) parallel to find-save flag pattern with disjoint localStorage prefix. Verbal split established: "flag a find / bookmark a booth." Same-session design-record commit rule firing for the SECOND time confirmed it as a real pattern, not a one-off (third firing this session = fully durable).
---

## CURRENT ISSUE
> Last updated: 2026-04-26 (session 72 close — admin BottomNav tab + `/shelves` masthead pill / Manage eyebrow retired; one runtime commit on prod; feed content seeding still pending — now 15× bumped)

**Working tree:** clean. **Build:** green. **Beta gate:** technically unblocked since session 50; no code-level regressions. **NEW this session (one runtime commit, small surgical scope):** Admin entry rationalized — admin users now get a dedicated **Admin** tab in the BottomNav 4th slot (Lucide `Shield` 21px → `/admin`) replacing **My Booth** (admins have no booth assigned, so My Booth was always a dead-end "No booth linked" state for them). Two redundant affordances on `/shelves` retired in the same commit: the green **ADMIN** masthead pill (right slot) and the green **Manage** eyebrow under each booth tile. Pencil + Trash bubbles top-right of each tile already signal the admin's edit/delete affordance, making the Manage eyebrow chrome noise. Vendor (Home · Booths · Find Map · My Booth) and Guest (Home · Booths · Find Map) BottomNav layouts are unchanged. `/my-shelf` direct-URL traffic for admins still hits the existing "No booth linked" empty state — admin nav no longer points there, so the dead-end is no longer reachable through normal navigation. Decisions D1–D4 surfaced before code per `feedback_ask_which_state_first.md` (9th firing — fully default). ZERO new memories. ZERO new Tech Rule firings. **Live discovery worth tracking:** "multi-affordance retirement → single-surface promotion" pattern echoed session 71's cartographic collapse on `/find/[id]` (parallel two cards → one); single-firing in admin context, single-firing in shopper context, watch for a third instance. **Gate to V1:** feed content seeding + one quiet week → first beta vendor invite per [`docs/beta-plan.md`](docs/beta-plan.md). R3 is NOT a V1 gate.

### 🚧 Recommended next session — Feed content seeding (~30–60 min)

Bumped from sessions 55, 60–71, **72**. **Top priority** — the actual V1 unblocker, now **15× bumped**. Session 72 closed an admin-chrome rationalization (admin BottomNav tab replaces My Booth; masthead pill + Manage eyebrow retired) — orthogonal to seeding but the recommendation is unchanged. **Fifteen sessions of polish + observability + brand + navigation + persistence + terminology + caption-typography + cartographic-redesign + masthead-lock + booth-lockup + image-standardization + admin-chrome rationalization**; zero new reasons not to seed content. **NEW judgment moments to fold into the seeding walk:** (a) does the Admin BottomNav tab read distinguishably from the My Booth tab vendors see (Shield vs Store icon), (b) does the now-empty masthead right slot on `/shelves` look intentional or accidentally bare, (c) do admin-managed booth tiles read as manageable without the Manage eyebrow now that only the corner bubbles signal it, (d) does the collapsed `/find/[id]` cartographic card with italic "Find this item at" eyebrow read as grounded with real mall + booth data (carry from 71), (e) does the count-in-eyebrow at IM Fell italic 22px hold against real counts (1, 47, 200) (carry from 71), (f) do find tiles bottom-out cleanly when real titles span 1, 2, or wrap with prices in mixed presence (carry from 71), (g) any portrait-vs-square photo cropping perception issues still surface on Find Map carousel after E landed — if yes, ship parked B + A from `image-standardization-design.md` (carry from 71), (h) carry-forward judgment moments from session 70 (Variant B lockup at 14/20px on Booths grid, sectioned-list `/flagged` with multiple real booths, masthead wordmark X-position rock-solid, booth-page scroll flatten regression check, `/post/preview` title-below-masthead, IM Fell 14px tile-title against real photos, all-malls scope mall-subtitle weak separator).

**Shape:**
- 🖐️ HITL (~30–60 min) — Source 10–15 real posts across 2–3 vendors. Photos + tags. With the tag-capture flow, the vendor takes 2 photos per post (item + tag) and the title + price prefill from the tag.
- 🟢 AUTO — Walk the Add Find → /post/tag → /post/preview flow for each, confirm tag prefill works on real-world content, confirm each lands on the right shelf and renders cleanly in the feed.
- 🟢 AUTO — Run a partial T4d walk on the seeded surfaces (feed render with italic timestamps + lens, find-detail with lightbox + lens + new collapsed cartographic card + italic "Find this item at" eyebrow, my-shelf with new caption min-height + flattened-scroll, public shelf, editorial vendor CTA at feed bottom, **Booths page with new Variant B lockup + count-in-eyebrow + caption min-height**, booth detail with single-line "Booth" post-it + caption min-height + masthead bookmark, **AND the new sectioned-list /flagged with Variant B card headers + count-in-eyebrow + caption min-height**, **AND the cross-tab mall picker**). Watch Sentry dashboard during the walk. **Image-height check:** do find tiles bottom-out cleanly with real photos + real caption variance? If portrait-vs-square cropping perception still feels off, ship B + A from the parked mockup. **Photo cropping check:** subject scale on portrait phone photos vs square sourced photos — judge against real content.
- 🟢 AUTO — Once content lands, the V1 beta-invite gate is the "one quiet week" of monitoring rather than a code/content gap.

### Alternative next moves (top 3)

1. **Item 6 — shareable filtered-mall link** (David flagged session 71) — for malls to share a direct URL to their mall view. Likely path: deep-link to a primary tab (Home / Booths / Find Map) with mall pre-selected via URL param, persistent via existing `treehouse_saved_mall_id` (session 68 infra). Avoids `/mall/[slug]` since that page is still v0.2 dark and deferred. Size M (~1 session); needs design + URL-param scoping + mockup pass per `mockup-first` rule.
2. **Item 3 — animation consistency review** (David flagged session 71) — Find Map animates the location up; Booths doesn't animate at all. Multi-surface survey across primary tabs + scope headers + tile entry animations + sheet open/close. Size M (~1 session); needs survey pass first via Explore agent.
3. **`/mall/[slug]` v1.x ecosystem migration** — session 66 deviation; with `/find/[id]` link retired session 71, this page is now lower-traffic (only reachable from `/vendor/[slug]`). Migration is more skippable now but still on the Sprint 5 follow-on list whenever real shoppers find it via vendor profiles. Size M-L (~1–2 sessions); needs design scoping first.

Full alternatives + operational backlog in [`docs/queued-sessions.md`](docs/queued-sessions.md).

### Session 73 opener (pre-filled — feed content seeding)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Sentry · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Feed content seeding. The long-deferred V1 unblocker — 10–15 real posts across 2–3 vendors so the app has actual content for beta invites. Session 72 was a small surgical change: admin BottomNav tab (Lucide Shield → /admin) replaces My Booth in the 4th slot for admin users; the green ADMIN masthead pill + Manage eyebrow under booth tiles on /shelves are retired since the BottomNav tab + existing Pencil/Trash bubbles already carry the affordances. Vendor and Guest BottomNav layouts unchanged. Walk the Add Find flow on iPhone for ~10–15 real posts, source photos + tags, verify each lands on the right shelf and renders cleanly in the feed. Run a partial T4d walk on the seeded surfaces — keep the Sentry dashboard open during the walk. JUDGMENT MOMENTS: (a) does the Admin BottomNav tab read distinguishably from the My Booth tab vendors see (Shield vs Store icon); (b) does the now-empty masthead right slot on /shelves look intentional or accidentally bare; (c) do admin-managed booth tiles read as manageable without the Manage eyebrow now that only the corner bubbles signal it; (d) does the collapsed /find/[id] cartographic card with "Find this item at" italic eyebrow read as grounded with real mall + booth data (carry from 71); (e) count-in-eyebrow at IM Fell italic 22px against real counts (1, 47, 200) (carry from 71); (f) find tiles bottom-out cleanly with real titles + real price presence variance (carry from 71); (g) any portrait-vs-square photo cropping perception still surfacing — if yes, ship B+A from the parked mockup at docs/mockups/image-standardization-v1.html (carry from 71); (h) Variant B lockup at 14/20px on Booths grid against real vendor content (carry from 70); (i) sectioned-list /flagged with multiple real booths (carry from 70); (j) masthead wordmark X-position rock-solid across primary tabs (carry from 70); (k) booth-page scroll flatten regression check (carry from 70); (l) /post/preview title-below-masthead (carry from 70); (m) IM Fell 14px tile-title against real photos (session-69 D4b reversal); (n) all-malls scope mall-subtitle weak-separator — gather concrete evidence vs accept as known limitation. Once content lands, V1 beta-invite gate becomes "one quiet week" of monitoring rather than a code/content gap. Note: R3 admin Events stale-data mystery still parked. Tag-extraction + booth-bookmark + mall-filter analytics events still deferred. Sign-in icon discoverability is a watch-item from session 63. /mall/[slug] is intentionally lensless on v0.2 dark theme pending its v1.x migration. Existing /api/* routes are not yet wrapped with Sentry.wrapRouteHandlerWithSentry (Next.js 14 limitation). Item 3 (animation consistency review) + Item 6 (shareable filtered-mall link) parked for own sessions. Q-012 (Treehouse opener) and Q-013 candidate (Next.js 15 upgrade) parked.
```

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

*(Empty. T4d pre-beta QA walk re-passed session 46 end-to-end — all five exit criteria clean. Q-007 Window Sprint also remains passed per sessions 40–41. Featured banner reads restored session 48. Q-008 shopper share shipped session 50 (QA walk deferred to session 51, but non-gating — code is landed and the walk is verification not revision). No code-level regressions. Beta invites remain technically unblocked after session 50.)*

### 🟡 Remaining pre-beta polish (operational, not code-gating)

- **R3 admin-Events stale-data mystery** — intermittent. Session 60 ruled out URL/key/code/query/fresh-deploy/instance-aging as causes. Next probe (only if freshly reproducing): raw `fetch()` to PostgREST via new `/api/admin/events-raw` endpoint (~10 min). Verbose diag logs stay in `/api/admin/events/route.ts` until this closes. R3 is investigable via Sentry breadcrumbs + distributed traces (session 65) — when it freshly fires, check the Sentry trace view + Seer Autofix panel BEFORE manual log-grepping.
- **`/find/[id]` `navigator.share()` instrumentation gap** — session 59 surface, untouched sessions 60–69. Decide whether to fire `find_shared` event at intent-capture or document the gap in R3 design record.
- **Feed content seeding** — rolled forward from sessions 55–70, **71**. 10–15 real posts across 2–3 vendors. **Top-of-stack** as recommended next session, now **14× bumped**. Sessions 61–70 each strengthened the case; session 71 added three more closures (cartographic collapse on `/find/[id]`, count-in-eyebrow typography, caption min-height stabilization). Cartographic identity now fully retired across the v1.x ecosystem; find tiles bottom-out at uniform heights; mall street address is reachable from every primary tab + Find Detail. Session 64 was a pivot pass with no net change. Sessions 66 + 69 added calibration imperatives — the lens constant + the IM Fell tile captions both need real-world-photo judgment. Sessions 67 + 68 + 69 closed the cross-mall navigation + cross-tab anchoring + terminology + caption-typography gaps. Sessions 70 + 71 closed cartographic-redesign + masthead-lock + booth-lockup + caption-stabilization. Seeded content will showcase a genuinely better experience end-to-end.
- **Hero image upload size guard** — verify coverage across upload surfaces. Note: session 61 added DELETE coverage at `/api/admin/featured-image`; size guard remains a separate concern on the upload path.
- **Tech Rule promotion batch** — 18+ candidates queued; **TR-l + TR-m both 🟢 promotion-ready** (TR-l promoted 🟡 → 🟢 session 60). Recent additions: session 61 (TR-n), session 62 (TR-p testbed-first for AI/LLM call unknowns + `feedback_testbed_first_for_ai_unknowns.md` memory), session 64 (`feedback_still_frame_before_animation_port.md` — could become TR-q on second firing), session 65 (`feedback_verify_third_party_software_exists.md` — could become TR-r on second firing + "platform-managed env > manual paste" candidate), session 68 (`feedback_state_controls_above_hero_chrome.md` — could become TR-s on second firing), session 69 ("when wrapping one part of a parallel structure in a card, decide for the whole structure or none of it" — could become TR-t; **arguably second-firing in session 71 since the cartographic-collapse extended the principle to a vendor+mall-subtitle composition**). Session 70 surfaced two single-firings: (a) "Sequence implementation commits smallest → largest in multi-record sessions" (could become TR-u on second firing); (b) "When centering text against icons in a flex/grid row, lift the text 1px to compensate for italic ascender bias" (could become TR-v on second firing). **Session 71 surfaced two NEW candidates:** (a) "Verify sub-agent claims that contradict known semantic rules of the underlying system" — single firing (Explore agent's letterboxing claim contradicting `objectFit: cover`); could become TR-w on second firing. (b) "When proposing a multi-change visual fix, ask for a screenshot first; the user's mental model of the cause may differ from the actual mechanism" — single firing (item 5 E+B+A bundle pre-screenshot vs E-only post-screenshot); could become TR-x on second firing. Full register: [`docs/tech-rules-queue.md`](docs/tech-rules-queue.md).
- **`/shelf/[slug]` 404 NotFound icon still a `<Heart>`** — session 61 swap intentionally left this one alone (semantically unrelated to "save"). Flip to a different icon (or to FlagGlyph for vocabulary consistency) if/when a separate visual sweep happens.
- **Tag-extraction analytics events** — session 62 deferred wiring `tag_extracted_success` / `tag_extracted_no_price` / `tag_skipped` events. Worth adding once R3 stale-data mystery resolves so we can measure tag-flow adoption + extraction reliability in production.
- **Sign-in icon discoverability** (session 63 watch-item) — first-time guests now see a 22px CircleUser glyph in the masthead right slot instead of "Sign in" text. Reasoning is sound (universal "tap to access account" affordance), but worth checking during beta-feedback whether new users find it. Cheap fix if it's a problem: tooltip / first-visit nudge, not a revert.
- **Q-012 — Treehouse opener animation** (session 64, parked) — full Design redesign needed. First-pass framer-motion port (commit `c9043c8`) was reverted (`1946ddd`) because the wood-frame + skeleton-preview combo didn't aesthetically land on iPhone QA. Captured in [`docs/queued-sessions.md`](docs/queued-sessions.md) §Q-012 with locked decisions D1–D4 and pre-filled session opener. Wood-frame metaphor is OFF the table; needs fresh visual direction, mockup-first.
- **Existing `/api/*` routes are unwrapped re Sentry** (NEW session 65) — Next.js 14.2 framework swallows route-handler throws before Sentry's auto-capture sees them. New routes need `Sentry.wrapRouteHandlerWithSentry` per [`CONTEXT.md`](CONTEXT.md) §13. Existing ~25 routes silently swallow errors at the framework level. Acceptable for now — most are Supabase passthroughs whose errors surface as generic 500s in Vercel logs anyway. Worth a separate retroactive-wrap pass if a real bug surfaces, OR auto-fixed by Q-013.
- **Q-013 candidate — Next.js 15 upgrade** (NEW session 65, parked) — would auto-fix the wrap-route requirement (`onRequestError` becomes native), eliminate manual wrapping across `/api/*`, and unlock Cache Components per Vercel knowledge update. Not urgent; Sentry works fine on 14.2 with the workaround. Backlog candidate for `docs/queued-sessions.md` if/when other Next.js 15 features become attractive.
- **Sentry MCP not yet wired to Claude Code** (session 65 follow-up) — David accidentally selected "none" during the Sentry wizard's editor-config step. One-time fix: add a `.mcp.json` block to make Sentry queryable from inside future Claude Code sessions (would have shortened R3 investigation similarly to what Sentry's Seer Autofix already does).
- **`/mall/[slug]` lensless on v0.2 dark theme** (NEW session 66) — known deviation from session 66's Treehouse Lens brief. Mall page is still on v0.2 dark theme (`background: "#050f05"`) with intentional `brightness(0.82) saturate(0.76) sepia(0.05)` darkening filter that fights the brightening lens. Replacing without coordinated redesign would degrade the page; the lens applies cleanly when mall page does its v1.x ecosystem migration (already on Sprint 5 follow-on list). Captured in commit `2367676` summary. Worth promoting if the page becomes more visible during beta.
- **Treehouse Lens constant is provisional** (NEW session 66) — `contrast(1.08) saturate(1.05) sepia(0.05)` was approved on iPhone walk against the synthetic seed photos available today. Real vendor content this week may reveal it needs tuning. Single-line edit at [`lib/treehouseLens.ts:6`](lib/treehouseLens.ts:6); cascades to every find-photo render surface on next deploy. Common adjustments captured in session 66's iPhone walk checklist (drop sepia → less warm; bump sepia → more warm; drop contrast → less punchy; bump contrast → more punchy).
- **Booth-bookmark analytics events** (session 67) — `booth_bookmarked` / `booth_unbookmarked` deliberately deferred. Same defer-until-R3-resolves rationale as the tag-extraction events. Worth adding when R3 resolves so we can measure adoption of the new feature in production. Hot path: `handleToggleBookmark` in [`app/shelves/page.tsx`](app/shelves/page.tsx) + `handleToggleBoothBookmark` in [`app/shelf/[slug]/page.tsx`](app/shelf/[slug]/page.tsx).
- **Spec deviation: admin /shelves tiles don't carry the bookmark bubble** (session 67) — production admin tiles already render Pencil + Trash bubbles in the top-right, and adding a fourth bubble overflows the corner. Admin can still bookmark via the `/shelf/[slug]` masthead like everyone else. Documented in commit `fe6c33f` summary + the design record. Reconsider only if admins explicitly want booth bookmarks on the management surface (unlikely; admin uses public booth detail like everyone else for personal bookmarks).
- **Mall-filter analytics events on Booths + Find Map** (NEW session 68) — Home fires `filter_applied` on mall pick (existing); Booths + Find Map don't yet. Worth adding when R3 resolves so we can compare per-tab pick rates (does the filter get used more on Home or on Booths? does Find Map's "filter narrows saves" pattern see real adoption?). Hot path: `handleMallSelect` in [`app/shelves/page.tsx`](app/shelves/page.tsx) + [`app/flagged/page.tsx`](app/flagged/page.tsx). Also rolls up the prior `filter_applied` count = 0 carry note — when this lands, verify the count is actually being captured across all three callsites.
- **`/find/[id]` cartographic visual asymmetry** ✅ — **resolved session 70** via Record 2 (`d6b5a75`). Mall block now in parallel inkWash card matching the booth card. **Session 71 went further** — collapsed both cards into ONE single inkWash card with italic "Find this item at" eyebrow above; cartographic spine fully retired (`30c2c0c`).
- **`/find/[id]` → `/mall/[slug]` link bridging warm-→-dark cliff** ✅ — **resolved session 71** via cartographic collapse (`54fa370`). Link from `/find/[id]` retired; `/mall/[slug]` now reachable only from `/vendor/[slug]`.
- **Card-height variance on find tiles** ✅ — **resolved session 71** via caption `minHeight: 76` on FindTile/WindowTile/ShelfTile + `minHeight: 56` on ShelfCard rail (`704ff7a`). David: "issue resolved." B+A (slot ratio flip + object-position: top) parked in mockup if real-content seeding reveals residual photo-cropping issues.
- **BoothHero post-it `minHeight: 96`** (carry from session 69) — was sized for two-line "Booth / Location" eyebrow; now eyebrow is single-line "Booth" per session-69 D10. Post-it may look slightly tall against the collapsed eyebrow. If iPhone QA flags it, the parameter at [`components/BoothPage.tsx:216`](components/BoothPage.tsx) can come down (~76 likely tighter).
- **D4b session-46 reversal needs real-photo validation** (carry from session 69) — IM Fell 14px on ~170px-wide booth-detail/find-detail tiles tested against synthetic seed photos in the mockup; real vendor content during the seeding walk is the actual judgment moment. Per-callsite revert if cramped without disturbing the Booths anchor. Hot path: `WindowTile` + `ShelfTile` in [`components/BoothPage.tsx`](components/BoothPage.tsx) + `ShelfCard` in [`app/find/[id]/page.tsx`](app/find/[id]/page.tsx).
- **Design-record price-color token deviation** (carry from session 69) — design record specified `v1.inkMid` (#4a3520) for prices in unified card treatment; implementation kept `v1.priceInk` (#6a4a30) since that's the established semantic token across the existing surfaces. Skip unless flagged.
- **`v1.pillBg` / `v1.pillBorder` / `v1.pillInk` tokens** ✅ — **resolved session 70** via Record 1 (`198560f`). Tokens removed from `lib/tokens.ts` after the last call site (BoothPill on `/flagged`) was retired.
- **All-malls scope mall-subtitle is a weak separator on `/flagged`** (NEW session 70) — David's iPhone QA: booths from different malls read as one sequence without close attention to the filter eyebrow. Captured in Record 1 design record as known-limitation + future-iteration carry-forward. Likely fix when revisited: mall-grouped section breaks with small all-caps mall eyebrow before the booth list resumes.
- **Booth-page scroll flatten (D17) regression watch** (NEW session 70) — highest-risk decision in Record 3. Watch on iPhone QA: BoothHero parallax behaviors, mall picker sheet anchoring on `/my-shelf` + `/shelf/[slug]`, any "scroll to top" behaviors that previously observed the inner scroll container directly. Cheap fix if anything regresses: revert the flatten on a per-page basis with a `scrollContainerRef` reintroduction.
- **`/post/preview` masthead unification — title-below-masthead pending iPhone QA** (NEW session 70) — title + subhead moved from inside sticky chrome to content block below per D18. Page may lose the "reviewing" feel against vendors stepping through Add Find. If David flags it: (a) restore stacked title inside masthead (custom sticky again), (b) bring title into a sticky band BELOW masthead, (c) keep as-is.
- **Booths grid lockup numeral size deviates from spec** (NEW session 70) — design record specified 26px IM Fell numeral; Booths grid implements at 20px to preserve existing 14px vendor name + bio + photo proportions on a ~170px-wide tile. Design-record L3 amended to capture this. If real photos surface a problem, can either bump Booths grid to 18/26 (changes tile heights) OR scale other surfaces down (weakens the right-side numeral anchor).
- **Item 3 — animation consistency review across pages** (NEW session 71) — David flagged: Find Map animates location up; Booths doesn't animate at all. Multi-surface survey needed across primary tabs + scope headers + tile entry animations + sheet open/close. Probably its own session; needs Explore-agent inventory pass first.
- **Item 5 follow-up: B + A parked** (NEW session 71) — `object-position: center top` (B) + slot-ratio flip 4/5 → 1/1 (A) stay parked unless real-content seeding reveals residual photo-cropping issues. Mockup at [`docs/mockups/image-standardization-v1.html`](docs/mockups/image-standardization-v1.html) carries D1+D2 ready to ship as second pass.
- **Item 6 — shareable filtered-mall link** (NEW session 71) — David flagged: malls need a way to share a direct URL to their mall view. Likely path: deep-link to a primary tab with mall pre-selected via URL param, persistent via existing `treehouse_saved_mall_id` (session 68 infra). Avoids `/mall/[slug]` since that page is still v0.2 dark and deferred. Needs product + URL-param scoping + share UX + mockup pass; size M (~1 session).
- **Sub-agent claim verification gap** (NEW session 71) — Explore agent's image-rendering inventory contained a fabricated "letterboxing" claim contradicting how `objectFit: cover` works. Caught by my own verification grep. Single firing — Tech Rule candidate on second firing. Reminder: when a sub-agent's claim contradicts a known semantic rule of the underlying system (CSS, JS, framework), verify directly before trusting the claim.
- **Screenshot-before-scoping discipline for visual fixes** (NEW session 71) — Item 5 was scoped to E+B+A bundle pre-screenshot. The screenshot revealed E alone resolved the visible problem. Single firing — Tech Rule candidate on second firing. Reminder: ask for a screenshot before scoping a multi-change visual fix; the user's mental model of the cause may differ from the actual mechanism.
- **Multi-affordance retirement → single-surface promotion** (NEW session 72) — three admin-entry affordances (`/shelves` masthead pill + per-tile Manage eyebrow + the implicit "no admin tab" of My Booth as the 4th slot) collapsed into ONE durable surface (BottomNav Admin tab). Echoes session 71's cartographic collapse on `/find/[id]` (parallel two cards → one inkWash card). Single firing in admin context, single firing in shopper context — Tech Rule candidate on a third firing.
- **Spec deviation: admin /shelves masthead right slot is now empty** (NEW session 72) — session 67 placed the Admin pill there as the entry; session 72 retired it in favor of the BottomNav tab. The right slot is now empty for everyone, including admins. If iPhone QA flags this as accidentally bare, consider populating it with something (per-tab utility action, account glyph, etc.) — but resist the temptation to "fill it because it's empty"; empty-on-purpose is also a valid state.
- **Archive-drift backfill** — tombstones for sessions 54 + 55 + 57–70 missing from `docs/session-archive.md`. Pure docs-housekeeping; no signal lost since git log + commit messages + CLAUDE.md tombstones preserve the actual state. Worth a single ~15min ops pass at some point to backfill the archive in one shot.
- **Operational backlog** — staging migration paste, OTP template paste, debug-toast cleanup, doc-only updates (R3 design-record retro, Design agent principle, KNOWN PLATFORM GOTCHAS), `/admin` `auth.users` delete spike, `/api/suggest` SDK migration, archive-drift backfill (sessions 54-55 + future), R3 raw-PostgREST probe (parked), strip verbose diag logs from `/api/admin/events/route.ts` post-R3-close. → [`docs/queued-sessions.md`](docs/queued-sessions.md) §Operational backlog.
- **Error monitoring (R12)** ✅ — **shipped session 65** end-to-end. Sentry SDK installed via wizard + tightened, Vercel-Sentry Marketplace integration active, source-map upload from Vercel build, PII scrubbing on, email alerts firing, smoke-tested both client + server capture on prod (frontend + wrapped API route). Dashboard: https://zen-forged.sentry.io/issues/?project=4511286908878848. Carries an unwrapped-`/api/*`-routes follow-up gap (above) and Q-013 candidate.
- **Beta feedback mechanism** — absorbed into R7 (contact us) as a sub-task.

### 🟡 Q-007 Window Sprint expansion (post-MVP)

All captured in `docs/queued-sessions.md`:
- **Q-008** ✅ — Open share to unauthenticated shoppers. **Shipped session 50; QA walk PASSED session 51.**
- **Q-009** ✅ — Admin can share any booth (ownership bypass). **Shipped session 45.**
- **Q-010** ✅ — Window email CTA URL fix (`/vendor/` → `/shelf/`). Shipped session 41.
- **Q-011** ✅ — Window email redesign. Shipped session 52 over four iterations (`5c21b90` → `efbf222` → `1abcba2` → `d9279e9`); v4 on-device QA walk **PASSED 4/4 clients session 53** (Gmail web, iOS Gmail, iOS Mail, Apple Mail). Loop fully closed. Final state (v4): shell masthead retired, opener line flowing into IM Fell 34px vendor name, banner + 2-cell info bar as one unified rounded frame, full-width "Explore the booth" green button directly under info bar, naked tile grid, footer. Subject + preheader + opener share the phrase "A personal invite to explore {vendor}". Word "Window" retired from user-facing copy.
- **Q-006** 🟡 — Deep-link CTA. Parked on Sprint 6+ Universal Links.

### 🟡 Session 35 non-gating follow-up

- **Q-002** ✅ — Picker affordance placement revision. Shipped session 57 (`Masthead` center reverted to brand lockup; `<BoothTitleBlock>` gained optional `onPickerOpen` that wraps the 32px booth name in a tap target with inline `▾` when `showPicker`; mockup Frames 2 + 3 revised in same commit).

### 🟡 Sprint 5 + design follow-ons

- **`/admin` v0.2 → v1.2 redesign pass** (session 37) — Posts tab, Banners tab, tab switcher, header, approval toast, diagnosis panel. Size L. Needs design scoping first (mockup-first per session-28 rule). ~2–3 sessions. (**Session 49 note:** `/shelves` chrome mismatch is now resolved — v1.2 migration shipped. `/admin` remains on v0.2.)
- **KI-005** — Pre-approval sign-in signaling gap. Batch with guest-user UX.
- **Typography reassessment** (session-32 deferral — IM Fell readability).
- **Post-approval booth-name edit surface** (session-32 deferral).
- `<MallSheet>` migration to `/vendor-request` (still deferred per v1.1k (h)).
- Nav Shelf decision + BottomNav full chrome rework.
- Guest-user UX parked items: login page now reads "Vendor Sign in" (session-49 change); `/welcome` guest landing, PWA install onboarding, vendor onboarding Loom, bookmarks persistence still parked.
- **PWA pull-to-refresh** — confirmed missing in session 41 Q-007 walk. Not a bug (browser default-gesture override in standalone PWA mode) — Sprint 5 polish, needs a `pulltorefreshjs`-class library or custom gesture handler tied to scroll position. Workaround is navigate-away-and-back.

### 🟢 Sprint 6+ (parked)

**Primary roadmap now lives in [`docs/roadmap-beta-plus.md`](docs/roadmap-beta-plus.md)** (session 55 capture — 15 epic-level items R1–R15 including guest profiles, Stripe subscriptions, analytics, admin tooling, feed caps, legal, onboarding, push/SMS, map nav, mall heros, error monitoring, mall-operator accounts, vendor profile enrichment, **app store launch**). Roadmap doc also carries the 8-cluster grouping + 3-horizon shipping plan added in same session. Items absorbed from this list: "Claim this booth" → R1; "ToS/privacy" → R6; "native app eval" → R9; "vendor directory" → R10; `/welcome` guest landing → R8; "feed pagination + search" → partial overlap with R5a; **"Universal Links (gating Q-006)" → R15**. Also absorbed from pre-beta polish list: Error monitoring → R12; Beta feedback mechanism → R7.

**Still Sprint 6+ only (not in roadmap-beta-plus.md):**

QR-code approval, admin-cleanup tool (session 45 materially reduces the need — `/shelves` now covers the 80% case), mall vendor CTA, **Option B `vendor_memberships` migration**, **Direction A (link-share via native share sheet)** and **Direction C (PNG export / story-ready image)** share variants. Post-MVP: 3A sold landing state, Find Map saved-but-sold tile signal.

**Session 45 note on Direction A:** the BoothHero URL link-share bubble that was retired this session was essentially Direction A. If/when a URL-share capability is reintroduced (e.g. native share sheet with OG preview), it should land as a deliberate Design pass, not a quiet restoration of the retired bubble. The masthead airplane is the sole share affordance on Booth pages; a future URL-share primitive is a separate glyph/location decision.

### 🟢 Cleanup (not urgent)

- Deprecated functions in `lib/posts.ts` including session-35 `getVendorByUserId` shim.
- Cloudflare nameservers dormant (no cost).
- `docs/VENDOR_SETUP_EMAIL_TEMPLATE.md` (obsolete since T4a).
- `docs/design-system-v1.2-draft.md` (tombstone).
- `docs/mockups/add-find-sheet-v1-2.html`, `review-page-v1-2.html`, `edit-listing-v1-2.html` — partial retirement pending post-beta.
- `docs/mockups/email-v1-2.html` — updated session 39 rename sweep; keep as reference.
- `docs/mockups/share-booth-email-v1.html` — design-history reference for Q-011 arc.
- `docs/mockups/share-booth-email-v2.html` — design-history reference (session 51 Variant B; superseded twice in session 52).
- `docs/mockups/share-booth-email-v3.html` — design-history reference (session 52 info bar pivot; superseded by v4).
- `docs/mockups/share-booth-email-v4.html` — design-history reference (session 52 v4 simplification; QA PASSED 4/4 clients session 53). Q-011 arc closed.
- `docs/mockups/my-shelf-multi-booth-v1.html` — Frames 2 + 3 updated session 57 (Q-002). Keep as design-history reference for multi-booth.
- `docs/multi-booth-build-spec.md` — archived reference.
- `docs/share-booth-build-spec.md` — now carries v2 + v3 + v4 addendums stacked. Post-QA (passed session 53), candidate for consolidation (the three addendums are easier to read merged than stacked). ~15 min docs-only pass.
- `components/ShelfGrid.tsx` (parked; zero callers).
- `/post` redirect shim — can delete post-beta.
- `.env.prod-dump.local` (session-54 one-shot `pg_dump` pipeline artifact, gitignored, safe to delete anytime; contains prod + staging DB URIs with passwords).
- Orphaned `dbutler80020@gmail.com` staging auth user (created by the first seed-staging run before David chose `david@zenforged.com` as staging admin; non-admin, non-blocking; leave or clean up manually via Supabase dashboard).

---

## INVESTOR UPDATE SYSTEM

- Google Drive folder: `1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW`
- Cadence: end of each sprint (weekly once beta launches)
- Trigger: say "generate investor update" at session close
- Process doc: Notion → Agent System Operating Manual → 📋 Investor Update — Process & Cadence

> **Sprint 4 fully closed sessions 40–41; sessions 42–53 ran the pre-beta polish arc; sessions 54–69 carried the polish + observability + brand + navigation + persistence + terminology + caption-typography + Option B booth-identity sweep; session 70 was the largest layout-redesign sweep in recent memory (six runtime commits across cartographic redesign + masthead lock + Variant B booth lockup); session 71 closed three independent decision arcs in three runtime commits (cartographic collapse on `/find/[id]` + 3-item polish bundle + caption min-height). **Session 72 was a small surgical session — one runtime commit (`27a0439`) rationalizing admin entry**: BottomNav 4th slot for admins now carries a dedicated **Admin** tab (Lucide `Shield` 21px → `/admin`) replacing My Booth (admins have no booth assigned, so My Booth was always a dead-end "No booth linked" state). Two redundant affordances on `/shelves` retired in the same commit: the green ADMIN masthead pill + the green Manage eyebrow under each booth tile (Pencil + Trash bubbles top-right of the tile already signal edit/delete intent). Vendor + Guest BottomNav layouts unchanged. ZERO new memories. ZERO new Tech Rule firings. **`feedback_ask_which_state_first.md` 9th firing — fully default opening; stopped tracking firing count.** **Live discovery worth tracking:** "multi-affordance retirement → single-surface promotion" pattern echoed session 71's cartographic collapse — single-firing in admin context, single-firing in shopper context, watch for a third instance. Feed content seeding still pending, now **15× bumped** — fifteen sessions of polish + observability + brand + navigation + persistence + terminology + caption-typography + cartographic-redesign + masthead-lock + booth-lockup + image-stabilization + admin-chrome rationalization. Next natural investor-update trigger point remains after feed content seeding lands — the update would now report R4c + R3 + tag-capture + R12 + the lens port + Booths public + booth bookmarks + cross-tab mall filter + terminology consistency + caption unification + cartographic redesign + masthead lock + Variant B booth lockup + cartographic collapse + count-in-eyebrow typography + caption stabilization + admin nav rationalization as fifteen shipped capability items.
