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

## ✅ Session 83 (2026-04-28) — Postcard PoC reverted + Polaroid evolved tile direction shipped end-to-end across 4 surfaces (10 runtime commits + 2 V1 mockups + multi-cycle iPhone QA via Vercel previews in-session)

Two arcs in one session — the first abandoned cleanly, the second shipped through 6 iterative iPhone QA refinements. **Smallest→largest commit sequencing's 7th clean firing — promotion-overdue.** ONE new memory captured (`feedback_revert_to_clean_baseline_before_pivot.md`).

**Arc 1 (commits 1–4) — Postcard PoC reverted.** David surfaced postcard/paper visual language as a session opener with a reference screenshot + paper.png asset. V1 mockup ([`docs/mockups/postcard-language-v1.html`](docs/mockups/postcard-language-v1.html)) explored 3 additive frames spanning structural axes: texture only / texture+frame / texture+frame+stamp. David picked Frame A (texture only) + supplied his own paper.png. Implementation rolled smallest→largest:

- `e876fba` Fixed-position texture overlay on Home only with paper.png (full opacity).
- `83cc684` David iPhone QA: too sharp. Texture opacity → 0.5 + masthead/footer bg paperCream → postit warm cream (matching booth lockup card material).
- `22aa8fc` David iPhone QA: iOS PWA status bar zone shows paperCream stripe above the postit masthead. Body bg paperCream → postit to seal.
- David's verdict after 3rd iteration: *"the background is subtly distracting as it almost feels like there is dust on the screen due to the texture. The thought was nice but I just don't think it works without a lot of other layering and component changes."*
- `c3d5528` Full revert. Production state identical to session 82 close (`760c8d3`). Net-zero on the postcard arc. V1 mockup retained as exploration record + paper.png retained in `/public` (David-uploaded asset; 2.7MB cleanup candidate).

**The clean revert before pivoting was the load-bearing move** — captured as the new memory `feedback_revert_to_clean_baseline_before_pivot.md`. Don't carry partial changes from a dead direction into the next direction.

**Arc 2 (commits 5–10) — Polaroid evolved tile pattern shipped to 4 surfaces.** David pivoted: *"I would like to explore what the card component could look like... putting the thumbnails inside a consistent container may help with unifying the somewhat random images that are loaded. This helps anchor the brand from a layered perspective."* — system-level signal recognized via `feedback_recurring_phrase_signals_system.md` (2nd session-to-session firing).

V1 mockup ([`docs/mockups/card-container-v1.html`](docs/mockups/card-container-v1.html)) explored **3 directions × 2 aspect treatments = 6 phone frames**: Polaroid evolved / Window mat print / Postage stamp on paper, each at fixed-1:1 vs natural-aspect masonry. David picked Polaroid evolved · let masonry retain natural-aspect heights · keep existing italic FONT_SYS timestamp font (no Caveat) · Home only PoC. Implementation:

- `55d9c77` Home MasonryTile gets polaroid wrapper (warm cream `#faf2e0`, 7px top/sides + 8px bottom padding, 4px radius, subtle paper shadow). Smallest possible blast: existing motion.div + flag bubble + timestamp untouched. The polaroid wrapper is a single new wrapper div around `<Link>`'s existing children.
- `2df6a78` David iPhone QA: timestamp under-weight on the polaroid mat; shadow blends in. Bumped timestamp 10 → 11.5px (FONT_SYS italic preserved per "no font change") + dual-shadow technique (`0 6px 14px 0.20` far + `0 1.5px 3px 0.10` close) for "card on surface" depth instead of "flat shape on flat shape."
- David: *"looks good. what next? I think this change should happen on the flagged page bu not on the find page (similar items) or the booths page. What are your thoughts from a UI/UX perspective."* — gave my opinion, surfaced /shelf/[slug] as the unmentioned surface, formulated **the rule: polaroid = browse/collect surfaces (Home, /flagged, /shelf/[slug] grid) — not navigate/detail surfaces (/find/[id] strip, /booths rows).** David: *"proceed, lets include /shelf/[slug] as well."*
- `6152511` Polaroid extension to /flagged FindTile + /shelf/[slug] WindowTile + ShelfTile. Three near-identical wrappers converted from card (inkWash + hairline + 6px radius + subtle shadow) to polaroid (cream paper + no border + 4px radius + dimensional shadow + 7px photo mat). Metadata block side padding 10 → 3 to compensate for wrapper sides padding. **Did NOT extract shared `<FindTile>` primitive** — three near-identical wrappers still cheaper than premature abstraction.
- David iPhone QA on /flagged: *"1. I want the title and the price to always be center aligned, same as the [find] page. 2. the price should also be consistent with the find page in terms of color and font style. Now that this font is more legible we don't need to use the san serif font for the price. 3. the title and price should be locked together with spacing between the two vertically but also centered vertically on the white polaroid card. Also, see the issue we're having again with the ligature getting cut off."*
- `b8c8e67` Four-fix surge: title+price center-align horizontally; price `FONT_SYS 12 → FONT_LORA 14` (matching title size — same-size-different-color pattern lifted from /find/[id] hero); metadata block flex column + justify-center + items-center for vertical centering of the title+price group; title `lineHeight 1.2 → 1.4` (descender clearance, **2nd firing of the same fix from session 82's BoothLockupCard vendor names**).
- David iPhone QA: *"we need to constrain so these are the same height (thumbnails) you can give a little less padding on the bottom for these three row titles if that solves the issue."* — 1-line vs 2-line title tiles had different total heights (`minHeight: 76` grew when content exceeded).
- `e19e9fe` `minHeight: 76` → `height: 76` (locked) + bottom padding 11 → 4. Exact math fit: 39.2px (2-line title at 14px Lora 1.4 lineHeight) + 4px (gap) + 19.6px (price) + 13px padding = 76. ✓
- David iPhone QA cycle 5 surfaced /find/[id] More-from-this-shelf strip wasn't included: *"It doesn't look like the centering format was applied to these 'more from this shelf...' section. Also, we need to change that to 'More from this booth ...'"* — different tile component (`ShelfCard` local to `/find/[id]/page.tsx`), missed in the polaroid sweep.
- `b804ee6` Centering format applied to ShelfCard metadata (textAlign center, lineHeight 1.4, width 100%, flex column + justify-center + items-center, height locked at 56, bottom padding 11→4) **WITHOUT** the polaroid wrapper styling — kept inkWash + hairline + 6px radius + subtle shadow per the browse-vs-navigate rule. Plus rendered eyebrow `More from this shelf…` → `More from this booth…`. Internal code comments still say "shelf" — documentation rot, opportunistic cleanup.

David: *"yep. looks good"* — closed.

**Final state in production (as of `b804ee6`):**

- 10 runtime commits, working tree clean, build green throughout.
- **Polaroid evolved tile pattern** lives on Home (MasonryTile) + /flagged (FindTile) + /shelf/[slug] (WindowTile + ShelfTile): warm cream paper `#faf2e0`, 4px radius, dimensional dual-shadow, 7px photo mat top/sides.
- **Centering format** lives on /flagged (FindTile) + /shelf/[slug] (WindowTile + ShelfTile) + /find/[id] (ShelfCard strip — without the polaroid wrapper).
- **Title + price as same-size Lora 14px group** on tiles (mirrors the /find/[id] hero's 32px title+price group at scale): centered horizontally, vertically grouped within locked height 76, gap marginTop 4px, only color differs (`inkPrimary` vs `priceInk`).
- **Tile heights locked** at 76 on polaroid surfaces; 56 on the strip. Heterogeneous title content (1-line vs 2-line) no longer breaks row consistency.
- **Lora descender clip fix propagated**: tiles use `lineHeight: 1.4` (was 1.2) so titles with descenders ('g', 'y', 'p') clear cleanly at the bottom of line 2 with `overflow: hidden + WebkitLineClamp: 2`.
- **Postcard PoC fully reverted** — no production change from session 82. Mockup retained as exploration record. paper.png retained in /public (cleanup candidate).
- **Phase 3 scroll-restore** still uncommitted, longest-standing user-facing carry-forward.

**Commits this session (10 runtime + 2 V1 mockups + close):**

| Commit | Message |
|---|---|
| `e876fba` | feat(postcard-poc): paper.png texture overlay on Home (Frame A) |
| `83cc684` | fix(postcard-poc): soften texture + masthead/footer to v1.postit warm cream |
| `22aa8fc` | fix(postcard-poc): body bg paperCream → postit to seal iOS PWA status bar zone |
| `c3d5528` | revert(postcard-poc): texture reads as dust; direction abandoned |
| `55d9c77` | feat(home-tiles): polaroid evolved card wrapper (PoC, Home only) |
| `2df6a78` | fix(home-tiles): polaroid shadow + dimension; timestamp 10 → 11.5 |
| `6152511` | feat(polaroid): extend to /flagged FindTile + /shelf/[slug] WindowTile + ShelfTile |
| `b8c8e67` | fix(polaroid-tiles): center title+price · Lora price · vertical center · descender clearance |
| `e19e9fe` | fix(polaroid-tiles): lock metadata block height; reduce bottom padding to fit 2-line titles |
| `b804ee6` | fix(find-strip): center title + lock height + rename 'shelf' → 'booth' |
| (session close) | docs: session 83 close — postcard PoC reverted + polaroid evolved on 4 surfaces |

**What's broken / carried (delta from session 82):**

- 🟢 Polaroid evolved + centering treatment validated end-to-end via Vercel preview iPhone QA in-session — David: *"yep. looks good"* — no carry-forward QA gap.
- 🟢 Postcard PoC reverted clean — production state was identical to session 82 close (`760c8d3`) before the polaroid arc started. No contamination.
- 🟡 paper.png in /public — 2.7MB unused asset David uploaded for postcard PoC. Cleanup candidate; left in place per "don't presume to delete user-uploaded assets" instinct.
- 🟡 `ShelfCard` wrapper on /find/[id] strip stayed as inkWash card — **deliberate** per browse-vs-navigate rule. If iPhone QA later reveals the strip looks visually inconsistent against the polaroid surfaces, easy 5-line edit to extend.
- 🟡 Three internal "More from this shelf" code comments in [`app/find/[id]/page.tsx`](app/find/[id]/page.tsx) (lines 14, 31, 1224) — documentation rot, same pattern as session 82's IM Fell comments.
- 🟡 Three near-identical polaroid metadata-block style strings across FindTile + WindowTile + ShelfTile + ShelfCard. If a fourth surface adopts polaroid OR if all need to evolve in lockstep, this is the **shared `<FindTile>` primitive extraction trigger**. Session 79's lesson: validate via testbed before extracting.
- 🟡 Phase 3 scroll-restore on /my-shelf + /shelf/[slug] + /flagged — still THE longest-standing user-facing carry-forward (session 79's primary user ask reverted in `a9dc1bd`). Even more justified now that the visual tile layer is fully settled.
- 🟡 All session 78–82 carry-forwards still hold unless explicitly resolved above.

**Memory updates:** ONE new memory.

- [`feedback_revert_to_clean_baseline_before_pivot.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_revert_to_clean_baseline_before_pivot.md) — when a design/PoC direction fails iPhone QA, fully revert to the clean baseline state BEFORE exploring the next direction. Don't refactor or pivot from contaminated state. The clean revert IS the load-bearing move.

**Existing memories that load-bore the session:**

- `feedback_treehouse_no_coauthored_footer.md` — applied to all 10 runtime commits ✅.
- `feedback_mockup_options_span_structural_axes.md` — **4th clean firing.** Postcard mockup spanned 3 additive frames; card-container mockup spanned 3 directions × 2 aspect treatments = full structural matrix. **Strongly promotion-ready** as Tech Rule.
- `feedback_visual_reference_enumerate_candidates.md` — fired during postcard scoping (4 discrete primitives enumerated from David's reference image) and card-container scoping.
- `feedback_ask_which_state_first.md` — fired multiple times: scoping postcard primitives; scoping card directions; scoping which surfaces get polaroid extension.
- `feedback_recurring_phrase_signals_system.md` (sessions 82 + 83) — David's *"anchor the brand from a layered perspective"* + *"unifying the somewhat random images"* recognized as system-level signal, NOT a per-screen polish ask. **2nd firing.**
- "Smallest→largest commit sequencing" — **7th clean firing.** Both arcs (postcard 3 commits + revert; polaroid 6 commits across 4 surfaces with iPhone QA between each) sequenced cleanly. **Promotion-ready and badly overdue.**
- "Mid-session iPhone QA on Vercel preview shortens redirect cycle" — **3rd clean firing.** David QA'd at 6+ explicit checkpoints. **Promotion-ready.**

**Live discoveries (single firings, Tech Rule candidates):**

- **"Browse vs navigate/detail rule for material chrome"** — first firing as a system rule (Home / /flagged / /shelf/[slug] grid all browse/collect → polaroid; /find/[id] strip + BoothPage post-it hero are navigate/detail → no polaroid). Tech Rule candidate on 2nd firing.
- **"Match a primary-page typographic pattern when extending visual identity to tiles"** — first firing (lifted /find/[id]'s 32px title+price treatment to 14px tiles: same Lora family, same weight, same lineHeight, gap 4px, only color differs). Tech Rule candidate.
- **"Lock fixed-height + reduce padding to fit worst case for row consistency in heterogeneous-content tiles"** — first firing (`minHeight: 76` → `height: 76` + bottom padding 11 → 4 to fit 2-line title + price exactly). Tech Rule candidate.
- **"Lora needs lineHeight 1.4 minimum when overflow:hidden + ≤14px text + line-clamp"** — **2nd clean firing** (session 82 vendor names + session 83 tile titles). Promotion-ready as concrete typography rule.
- **"Revert to clean baseline before pivoting"** — first firing as a memory (the new `feedback_revert_to_clean_baseline_before_pivot.md`).

**Operational follow-ups:**
- **NEW: paper.png in /public** — 2.7MB unused asset. David's call to keep or delete; default-keep until David asks.
- **NEW: 3 inline "More from this shelf" code comments** on [`app/find/[id]/page.tsx`](app/find/[id]/page.tsx) (lines 14, 31, 1224). Opportunistic cleanup with the IM Fell comment lag from session 82.
- **NEW: Three near-identical polaroid wrappers** across FindTile + WindowTile + ShelfTile + ShelfCard. Shared `<FindTile>` primitive extraction trigger if a fourth surface adopts polaroid OR if all need to evolve in lockstep.
- **Promote Tech Rule batch (overdue)** — smallest→largest sequencing now **7 firings**, structural-mockup-axes **4 firings**, mid-session-iPhone-QA **3 firings**, Lora-lineHeight-1.4-minimum **2 firings**, recurring-phrase-signals-system **2 firings**. ~30 min ops pass to land them.
- All session 78–82 carry-forwards still hold unless explicitly resolved above.

**Notable artifacts shipped this session:**
- [`docs/mockups/postcard-language-v1.html`](docs/mockups/postcard-language-v1.html) — V1 mockup (3 additive frames). Direction abandoned but mockup retained as exploration record.
- [`docs/mockups/card-container-v1.html`](docs/mockups/card-container-v1.html) — V1 mockup (3 directions × 2 aspect treatments = 6 phone frames). Direction A "Polaroid evolved" was the pick.
- [`app/page.tsx`](app/page.tsx) — Home MasonryTile wrapped in polaroid frame.
- [`app/flagged/page.tsx`](app/flagged/page.tsx) — FindTile converted to polaroid + centered title+price + height locked + Lora price.
- [`components/BoothPage.tsx`](components/BoothPage.tsx) — WindowTile + ShelfTile converted to polaroid + centered title+price + height locked + Lora price.
- [`app/find/[id]/page.tsx`](app/find/[id]/page.tsx) — ShelfCard centered title (without polaroid wrapper) + section eyebrow renamed.
- `public/paper.png` — David-uploaded vintage paper texture (2.7MB, unused after revert, cleanup candidate).

---

## ✅ Session 82 (2026-04-28) — Massive design-system consolidation: project-wide IM Fell → Lora replacement + form-label primitive sweep + BoothLockupCard extraction (rotated to tombstone session 83 close)

> Full block rotated out at session 83 close. Net: 10 runtime commits + V1/V2 typography mockups across two arcs. **Arc 1 (typography)**: project-wide `FONT_IM_FELL → FONT_LORA` sweep across 29 files (IM Fell completely retired); Option C label primitive (Lora upright, 15px /vendor-request + 13px sheets, ink-mid) swept across 5 form surfaces; /vendor-request retitled "Set up your digital booth" + permission/value intro paragraph + booth # optional + Mall → Location. **Arc 2 (booth lockup)**: extracted shared [`<BoothLockupCard>`](components/BoothLockupCard.tsx) component (v1.postit bg + inline lockup matching /find/[id] cartographic), applied to /shelves + /flagged; bookmark filter count fix on /shelves; descender clip fix lineHeight 1.25→1.4 on vendor names. ONE new memory (`feedback_recurring_phrase_signals_system.md`). Smallest→largest commit sequencing 6th clean firing. **NOTE: at session 83 close, IM Fell inline comments scattered ~20 places + new "More from this shelf" comments on /find/[id] — documentation rot, opportunistic cleanup over future sessions.**

_(Session 82 detailed beat narrative removed at session 83 close — see V1/V2 typography mockup files + the recurring-phrase memory file for load-bearing decisions.)_

---


## ✅ Session 81 (2026-04-28) — Demo-prep refinement bundle (9 runtime commits) + V1/V2 mockups + end-to-end iPhone QA (rotated to tombstone session 82 close)

> Full block rotated out at session 82 close. Net: 9 runtime commits — nav stroke 2.0; photo-overlay bubble bg paper-warm 0.85 across 5 surfaces; A3 dashed-fill-lift booth lockup card across /shelves + /flagged; BoothHero + /find/[id] post-it eyebrows small-caps FONT_SYS; v1.postit warmer #fbf3df; /flagged vendor/mall gap matched to /find/[id]; "Mall" → "Location" copy scrub across 13 files (incl. picker "All Kentucky Locations"); cartographic "Find this item at" card bg matched to post-it. ONE new memory: `feedback_visual_reference_enumerate_candidates.md`. Smallest→largest commit sequencing 5th clean firing — fully load-bearing. **NOTE: at session 82 close, the A3 dashed-fill-lift booth lockup card was retired in favor of the BoothLockupCard shared primitive (no dashed border, v1.postit bg, inline lockup matching /find/[id] cartographic). Session 81's "Mall → Location" copy scrub on /vendor-request was also fixed at session 82 close (the form was missed in the 13-file scrub).**

_(Session 81 detailed beat narrative removed at session 82 close — see the V1/V2 mockup files for load-bearing decisions.)_

---

## ✅ Session 80 (2026-04-28) — David 5-item redirect bundle + 2 polish items shipped end-to-end (rotated to tombstone session 81 close)

> Full block rotated out at session 81 close. Net: 7 runtime commits — nav rename, "curated booth" eyebrow, wordmark TNR upright ink-black 18px, bookmark relocated to BoothHero photo corner, Booths Option C2 row pattern (photo retired, rows replace grid), MallScopeHeader entrance animation, /find/[id] vendor/mall gap tightened. Two design records committed: [`docs/bookmark-relocation-design.md`](docs/bookmark-relocation-design.md) + [`docs/booths-row-pattern-design.md`](docs/booths-row-pattern-design.md). Track D phase 5 source layoutId retired on /shelves alongside the photo (graceful-no-op morph carries forward). ONE new memory: `feedback_mockup_options_span_structural_axes.md`. Smallest→largest commit sequencing 4th clean firing. See tombstone below + the two design records for load-bearing decisions.

_(Session 80 detailed beat narrative removed at session 81 close — see the design records + tombstone below for load-bearing decisions.)_

- [`components/BottomNav.tsx`](components/BottomNav.tsx) — "Find Map" → "Flagged" (item 1).

---

## ⚠️ Session 79 (2026-04-28) — Track D extension attempt: 12 commits shipped + reverted (rotated to tombstone session 81 close)

> Full block rotated out at session 81 close. Net-zero session — production state identical to session 78 close (`4bcefeb`); only artifact is the revert commit `a9dc1bd`. Attempted to extend session 78 Track D pattern; cross-page `layoutId` namespace collisions surfaced; conditional layoutId via reactive store fought React batching + framer projection + Next.js Link timing; David elected full revert. ONE memory: `feedback_extend_existing_primitive_via_testbed.md`. `feedback_kill_bug_class_after_3_patches.md` 2nd firing. Phase 3 scroll-restore code preserved in git history (`71a0555` + `51067b7`) for re-attempt WITHOUT morph changes. See tombstone below for full lessons.

_(Session 79 detailed beat narrative removed at session 81 close — see tombstone below + the memory file for load-bearing decisions.)_

---

## Recent session tombstones (last 5)

> Older tombstones live in [`docs/session-archive.md`](docs/session-archive.md). Sessions 28–43 still awaiting archive-drift backfill (one-liner only); sessions 44–53 + 56 in archive (54 + 55 + 57–82 still missing — operational backlog growing). Session 77 fell off the bottom of last-5 visible tombstones at session 83 close; session 78 mini-block rotated off (still in tombstones list).

- **Session 82** (2026-04-28) — Massive design-system consolidation: project-wide IM Fell → Lora replacement (29-file sweep, IM Fell completely retired from the codebase via `next/font/google` + `FONT_LORA` token) + Option C form-label primitive across 5 form surfaces (Lora upright, 15px /vendor-request + 13px sheets, ink-mid) + BoothLockupCard shared primitive extracted ([`components/BoothLockupCard.tsx`](components/BoothLockupCard.tsx)) and applied to /shelves + /flagged + /vendor-request retitled "Set up your digital booth" with permission/value intro paragraph + booth # optional + Mall → Location everywhere user-facing + bookmark filter count fix on /shelves + descender clip fix lineHeight 1.25 → 1.4 on Lora vendor names. 10 runtime commits + V1/V2 typography mockups + 4 in-session iPhone QA cycles. ONE new memory (`feedback_recurring_phrase_signals_system.md`). Smallest→largest commit sequencing 6th clean firing — load-bearing. Feed content seeding LANDED pre-session 82 (15 posts / 2 locations / 3 vendors). **NOTE: at session 83 close, IM Fell inline comments still scattered ~20 places — documentation rot, opportunistic cleanup over future sessions.**
- **Session 81** (2026-04-28) — Demo-prep refinement bundle (9 runtime commits + V1/V2 mockups, end-to-end iPhone QA via Vercel previews in-session). Items: nav stroke 2.0; photo-overlay bubble bg paper-warm 0.85 across 5 surfaces; A3 dashed-fill-lift booth lockup card across /shelves + /flagged; BoothHero + /find/[id] post-it eyebrows small-caps FONT_SYS; v1.postit warmer #fbf3df; /flagged vendor/mall gap matched to /find/[id]; "Mall" → "Location" copy scrub across 13 files (incl. picker "All Kentucky Locations"); cartographic "Find this item at" card bg matched to post-it. ONE new memory (`feedback_visual_reference_enumerate_candidates.md`). Smallest→largest commit sequencing 5th clean firing — fully load-bearing across the David-redirect-bundle workflow. Two test booths deleted from production via Supabase dashboard SQL (HITL). **NOTE: at session 82 close, the A3 dashed-fill-lift booth lockup card was retired in favor of the BoothLockupCard shared primitive (no dashed border, v1.postit bg, inline lockup matching /find/[id] cartographic).** Session 81's "Mall → Location" scrub on /vendor-request was also fixed at session 82 close (form was missed in the 13-file scrub).
- **Session 80** (2026-04-28) — David 5-item redirect bundle + 2 polish items shipped end-to-end (7 runtime commits). Items: nav rename Find Map → Flagged; "curated shelf" → "curated booth" eyebrow; wordmark TNR upright ink-black 18px on every screen; bookmark relocated from `/shelf/[slug]` masthead → BoothHero photo corner (verbal model: "flag a find / bookmark a booth, both on the corner of the entity you're saving"); Booths Option C2 row pattern (photo retired from `/shelves` directory; bookmark on far-left of row; `/shelves` becomes navigation-led not browse-led); MallScopeHeader entrance animation parity across primary tabs; `/find/[id]` vendor/mall gap tightened. Two design records committed in same session per the rule: [`docs/bookmark-relocation-design.md`](docs/bookmark-relocation-design.md) D1–D7 + [`docs/booths-row-pattern-design.md`](docs/booths-row-pattern-design.md) D1–D9. ONE new memory (`feedback_mockup_options_span_structural_axes.md`). Smallest→largest commit sequencing 4th clean firing (now load-bearing). Track D phase 5 source layoutId retired on `/shelves` alongside the photo (graceful-no-op morph carries forward); two surfaces still live (feed → /find/[id], /flagged → /find/[id]). `BookmarkBoothBubble` gained "hero" size variant (36×36 frosted, 18px glyph). Three new single-firings: D8 admin chrome inline-icons, mockup-options-structural-axes, wordmark brand-mark-vs-body-copy audit pattern.
- **Session 79** (2026-04-28) — Track D extension attempt: 12 commits shipped + reverted (Option A full revert). Net-zero session — production state identical to session 78 close (`4bcefeb`); only artifact is the revert commit `a9dc1bd`. Attempted to extend session 78's Track D shared-element pattern to /find/[id] More-from-shelf strip + BoothPage WindowTile/ShelfTile + add scroll-restore on /flagged + /my-shelf + /shelf/[slug]. Cross-page `layoutId` namespace collisions surfaced; conditional layoutId via reactive store (`useSyncExternalStore`) + `flushSync` + rAF defer fought React batching + framer projection + Next.js Link timing through 4 iPhone-QA cycles. David elected Option A: full revert. ONE new memory (`feedback_extend_existing_primitive_via_testbed.md`). Lessons: framer-motion `layoutId` is a global namespace; conditional layoutId via reactive store may not be reliably solvable without on-device debugging; testbed should be used for surface-extension work, not just initial primitive validation. Phase 3 scroll-restore code preserved in git history (commits `71a0555` + `51067b7`) for re-attempt in a future focused session WITHOUT morph changes. `feedback_kill_bug_class_after_3_patches.md` second firing — should have fired at R4 instead of R5.
- **Session 78** (2026-04-27) — Track D phase 5 shipped end-to-end across 6 iPhone-QA cycles. 11 runtime commits + close. FB Marketplace shared-element transition is now live across three production surfaces (feed → /find/[id], /shelves → /shelf/[slug], /flagged → /find/[id]). Critical fix `c3b9541` introduced the **preview-cache pattern**: source surfaces write `image_url` to sessionStorage on tap so destination renders motion node synchronously before async data fetches resolve; module-scope cache (`cachedFeedPosts`) handles the back direction. ONE new memory (`feedback_preview_cache_for_shared_element_transitions.md`). Smallest→largest commit sequencing finally cleanly executed (sessions 70 + 77 firings precede). FIVE new single-firing Tech Rule candidates (preview-cache pattern, sibling-not-child layoutIds, `layout="position"` stabilization, `<motion.div role="button">`, iPhone QA can override design-record motion specs). D11 + D12 design record values overridden by on-device feedback. David: "looks good." **NOTE: at session 80 close, /shelves source-side `layoutId` was retired when the photo went away from /shelves rows — that surface is now a graceful-no-op morph rather than a shipped morph.**
---

## CURRENT ISSUE
> Last updated: 2026-04-29 (session 83 close — Postcard PoC explored + reverted (texture read as dust on screen); pivoted to Polaroid evolved tile direction shipped end-to-end across 4 surfaces (Home + /flagged + /shelf/[slug] WindowTile/ShelfTile + /find/[id] strip); centering format + Lora price + height-locked metadata; 10 runtime commits + 2 V1 mockups + multiple iPhone QA cycles. ONE new memory: `feedback_revert_to_clean_baseline_before_pivot.md`. Smallest→largest commit sequencing 7th clean firing — strongly load-bearing.)

**Working tree:** clean. **Build:** green. **Beta gate:** technically unblocked since session 50; no code-level regressions. **Net change:** 10 runtime commits + close, every shipped item validated via Vercel preview iPhone QA in-session. **Polaroid evolved tile pattern** owns Home (MasonryTile) + /flagged (FindTile) + /shelf/[slug] (WindowTile + ShelfTile): warm cream paper `#faf2e0`, 4px radius, dimensional dual-shadow, 7px photo mat top/sides. **Title+price** as same-size Lora 14px group (matches /find/[id] hero pattern at scale): centered horizontally, vertically grouped within locked height 76, gap marginTop 4. **/find/[id] strip** got the centering format + height-locked at 56 (deliberately NO polaroid wrapper per browse-vs-navigate rule); section eyebrow "More from this shelf" → "More from this booth". **Tile descender clearance** lineHeight 1.4 (Lora overflow:hidden + line-clamp + 14px text minimum — 2nd firing of session 82's vendor-name fix). **Postcard PoC** reverted in full — production state was identical to session 82 close (`760c8d3`) before the polaroid arc began. paper.png retained in /public (David-uploaded, 2.7MB cleanup candidate). The `/my-shelf` back-nav scroll anchor (session 79 primary user ask) remains the longest-standing user-facing carry-forward, even more justified now that the visual tile layer is fully settled.

### 🚧 Recommended next session — Re-attempt Phase 3 scroll-restore on /my-shelf + /shelf/[slug] + /flagged (~30–60 min)

David's session 79 primary user ask, now THE longest-standing user-facing carry-forward (carrying since session 79's 12-commit revert in `a9dc1bd`). Phase 3 was reverted in session 79 because it was bundled with morph (layoutId) changes that fought React batching + framer projection + Next.js Link timing. The scroll-restore code itself was preserved in git history (commits `71a0555` + `51067b7`). The session 79 lesson: re-attempt with **STRICT scope** — only module-scope post caches + sessionStorage scroll keys + `requestAnimationFrame` scroll-restore. **NO motion.div / layoutId changes** under any circumstances.

**Why now (over the alternatives):**
- Session 79's revert means David asked for this scroll behavior, didn't get it, and it's been carrying for 4 sessions.
- Real seeded content (15 posts, since session 82) makes the scroll behavior actually exercisable in iPhone QA — the bug class needs scrollable content to show.
- Sessions 82 + 83's design-system + tile-layer consolidation means the visual primitives (BoothLockupCard, Option C labels, Lora, polaroid tiles) are now stable. Adding scroll-restore is purely behavior, no visual coupling.
- All of session 78's Track D infrastructure (preview-cache pattern, layoutId pattern) STAYS untouched — Phase 3 is a separate axis.
- Session 83 settled the tile metadata format (centering, height lock, Lora price). The *next* missing piece for the /my-shelf experience is scroll-restore.

**Verify before starting:** `/transition-test` testbed still works on production (layoutId regression canary). Read commits `71a0555` + `51067b7` in git history first to understand what Phase 3 actually was.

### Alternative next moves (top 3)

1. **Q-014 — Metabase analytics surface** (David surfaced session 73, queued in [`docs/queued-sessions.md`](docs/queued-sessions.md)) — strongly justified post-seeding. Decision point: rename `mall_activated`/`mall_deactivated` event keys to `location_*` as part of Q-014 (backwards-compat migration), or leave as historical analytics keys.
2. **Tech Rule promotion batch (badly overdue).** Smallest→largest commit sequencing now has **7 clean firings** — clearly load-bearing across every David-redirect-bundle session. `feedback_mockup_options_span_structural_axes.md` has **4 firings**. Mid-session iPhone QA pattern has **3 firings**. Lora-lineHeight-1.4-minimum has **2 firings** (session 82 vendor names + session 83 tile titles). recurring-phrase-signals-system has **2 firings**. ~30 min ops pass to land them in [`docs/tech-rules-queue.md`](docs/tech-rules-queue.md).
3. **Operational cleanup pass.** ~20 inline IM Fell comments + 3 new "More from this shelf" comments on /find/[id] + paper.png decision (keep or delete) + V1 mockup file tidying + session 80 design-record amendments. Pure docs hygiene — low-stress, high-leverage cumulative debt reduction.

Full alternatives + operational backlog in [`docs/queued-sessions.md`](docs/queued-sessions.md).

### Session 84 opener (pre-filled — Phase 3 scroll-restore re-attempt)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Sentry · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Re-attempt Phase 3 scroll-restore on /my-shelf + /shelf/[slug] + /flagged. Session 79's primary user ask, reverted because morph (layoutId) changes were bundled with scroll-restore — the scroll-restore code itself worked but the morph integration fought React + framer + Next.js Link timing through 4 iPhone-QA cycles. Reference commits `71a0555` + `51067b7` in git history for the scroll-restore code that worked. STRICT SCOPE: only module-scope post caches + sessionStorage scroll keys + `requestAnimationFrame` scroll-restore. NO motion.div / layoutId changes. NO Track D extension. The Track D infrastructure (preview-cache pattern, layoutId on feed→/find/[id] + /flagged→/find/[id], BoothLockupCard primitive, polaroid tile pattern) all stays untouched. Just scroll behavior. Real seeded content (15 posts) makes this exercisable in iPhone QA. ALTERNATIVES IF SCROLL-RESTORE DEFERRED: (1) Q-014 Metabase analytics surface — strongly justified post-seeding; decide whether to rename mall_activated/mall_deactivated event keys to location_* as part of Q-014 (backwards-compat migration). (2) Tech Rule promotion batch — smallest→largest sequencing (7 firings + overdue), structural-mockup-axes (4 firings), mid-session-iPhone-QA (3 firings), Lora-lineHeight-1.4-minimum (2 firings), recurring-phrase-signals-system (2 firings) all promotion-ready. ~30 min ops pass. (3) Operational cleanup pass — ~20 inline IM Fell comments + 3 new "More from this shelf" comments on /find/[id] + paper.png cleanup decision. CARRY-FORWARDS FROM SESSIONS 78–83: preview cache pattern (sessionStorage `treehouse_find_preview:${id}` + module-scope `cachedFeedPosts`) is reusable for any future shared-element work; framer-motion layoutId is a global namespace; testbed `/transition-test` should be USED for surface-extension work; D11+D12 design record values were overridden by on-device feedback in session 78; session 80 retired Track D phase 5 source layoutId on /shelves; BookmarkBoothBubble has 3 size variants; wordmark on every masthead is TNR upright ink-black 18px (FONT_NUMERAL); /shelves is row pattern not grid; bookmark on BoothHero photo corner not in masthead; IM Fell COMPLETELY RETIRED (FONT_LORA token); BoothLockupCard shared primitive owns /shelves + /flagged. **NEW from session 83: Polaroid evolved tile pattern owns Home + /flagged + /shelf/[slug] WindowTile + ShelfTile (warm cream `#faf2e0` paper, 4px radius, 7px photo mat, dual-shadow). Title+price on tiles is centered Lora 14px group (matches /find/[id] 32px hero pattern at scale), gap marginTop 4, height locked at 76 (FindTile/WindowTile/ShelfTile) or 56 (ShelfCard strip). /find/[id] strip got centering treatment WITHOUT polaroid wrapper per "polaroid = browse/collect surfaces, not navigate/detail surfaces" rule. Tile titles use lineHeight 1.4 for Lora descender clearance with overflow:hidden + line-clamp.** /transition-test stays live as the layoutId regression canary.
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
- **Item 1 (session 76) — masthead disappears on back-nav** ✅ — **resolved session 76** in `b5470da`. Loading + !post branches now render `StickyMasthead` with back button.
- **Items 3 + 4 (session 76) — green tokens** ✅ — **resolved session 76** in `d0c4ce3` + `fd1a874`. Treehouse Finds wordmark + "Booth" eyebrow + booth numeral all `v1.green` across every applicable surface.
- **Item 2 (session 76) — find-title centered + price below** ✅ — **resolved session 76** across `a2cf548` (record) + `fd1a874` (impl bundle). Frame B picked. Em-dash retired.
- **Item 5 (session 76, E1–E5+E7) — animation consistency** ✅ — **resolved session 76** across `ecb8ef8` + `3832fc1`. 5 motion tokens in [`lib/tokens.ts`](lib/tokens.ts); Booths VendorCard gains tap feedback; empty states unified across 4 primary tabs.
- **Migration 013_owner_acknowledged.sql** ✅ — **resolved session 77** (David ran HITL paste this session per session-77 beat 1).
- **Item 1 (session 76 attempt + session 77 4 attempts) — masthead disappears on PWA back-nav** ✅ — **resolved session 77** in `166ed59` after 5 attempts. Final fix: `position: fixed` + spacer (kills sticky-paint bug class). Earlier 4 attempts (`b5470da`, `361e1de`, `c968c1a`, `d429bbb`) addressed wrong layers — preserved in history as audit trail.
- **Track D phases 1–4** ✅ — **shipped session 77** across `c968c1a` (mockup bundled), `d3ddffb` (design record), `e601db5` (testbed). D1–D14 frozen. Three thumbnail surfaces in scope. **NEW: position:fixed + spacer is masthead's underlying primitive** — `MASTHEAD_HEIGHT` const in [`components/StickyMasthead.tsx`](components/StickyMasthead.tsx) is single source of truth. **NEW: `/transition-test` is durable diagnostic infrastructure** — keep live for layoutId regressions.
- **Track D phase 5 — surface rollout** ✅ — **shipped session 78** across 11 runtime commits and 6 iPhone-QA cycles. Three surfaces originally live: feed → /find/[id], /shelves → /shelf/[slug], /flagged → /find/[id]. **Session 80 retired the /shelves source side** when the photo went away from /shelves rows; that surface is now a graceful-no-op morph rather than a shipped morph (destination layoutId on /shelf/[slug] BoothHero preserved; framer-motion gracefully no-ops when source is absent). Two surfaces still live: feed → /find/[id], /flagged → /find/[id]. Critical fix `c3b9541` introduced the **preview cache pattern** (sessionStorage `treehouse_find_preview:${id}` + module-scope `cachedFeedPosts`) that any future shared-element work will need to reuse. **NEW carry-forward: D11 + D12 design record values overridden by on-device feedback** — all entrance delays compressed to 0; post-it crossfade replaced with zoom-in 1.15→1; bubble timing matches photograph morph. Design record stays as historical reference; runtime values only in CLAUDE.md session 78 block. Operational backlog: amend the design record with a "Runtime Overrides" section + a "Source side retired on /shelves session 80" addendum.
- **Item 5 (session 80) — wordmark TNR upright ink-black 18px** ✅ — **resolved session 80** in `2efced5`. `StickyMasthead.tsx` `WORDMARK_DEFAULT` rewritten: `FONT_NUMERAL` (Times New Roman) + `fontSize: 18` + `color: v1.inkPrimary`, dropped italic + the -1px translateY lift. Visible on every screen that uses StickyMasthead.
- **Item 4 (session 80) — bookmark relocated masthead → BoothHero photo corner** ✅ — **resolved session 80** in `786de81`. Design record at [`docs/bookmark-relocation-design.md`](docs/bookmark-relocation-design.md) D1–D7. `BookmarkBoothBubble` gained `"hero"` size variant (36×36 frosted, 18px glyph). `BoothHero` gained optional `saved` + `onToggleBookmark` props; bubble renders as SIBLING of photograph motion.div at top:8 right:8, NO own layoutId. `/shelf/[slug]` masthead right slot collapses to share-airplane-only. **NEW carry-forward: needs iPhone QA against banner-aspect hero photo** (item 4 sized to match /find/[id] flag's 4:5 photo).
- **Item 2 (session 80) — Booths page Option C2 row pattern** ✅ — **resolved session 80** in `895129b`. Design record at [`docs/booths-row-pattern-design.md`](docs/booths-row-pattern-design.md) D1–D9. `VendorCard` rewritten as full-width row, photo retired, no bio, bookmark on far-left, lockup mirrors /flagged. **D8 admin chrome (Pencil + Trash inline before booth stack) was a single-firing implementation-time decision NOT in the V2 mockup** — needs admin walk-through to confirm. **NEW carry-forward: row density on real content needs iPhone QA.** Old grid was ~4 booths/scroll; row pattern is ~7-8/scroll. Long vendor names + alphanumeric booth IDs will stress-test ellipsis behavior.
- **Item 1 + Item 3 (session 80) — nav rename + curated text** ✅ — **resolved session 80** in `2e40732` + `cdac99d`. Trivial copy changes.
- **Two polish items (session 80)** ✅ — **resolved session 80** in `eb6f942`. /shelves MallScopeHeader gains the same fade-up entrance as Home + /flagged; /find/[id] cartographic mall subtitle marginTop 4 → 2.
- **Item 1 (session 81) — nav stroke 2.0** ✅ — **resolved session 81** in `333ea3b`. BottomNav 5 icons strokeWidth 1.7 → 2.0.
- **Item 3 (session 81) — photo-overlay bubble bg lighter** ✅ — **resolved session 81** in `79306a0`. `rgba(232,221,199,0.78)` → `rgba(245,242,235,0.85)` across 5 surfaces (BookmarkBoothBubble tile + hero, masonry tile flag, /flagged tile flag, /find/[id] frostedBg + bottom flag/edit). Session 80 BoothHero bookmark iPhone QA carry-forward is now resolved through this lighter bubble shipped at the same time.
- **Item 2 (session 81) — booth lockup A3 dashed-fill-lift card** ✅ — **resolved session 81** in `ae4593c` + `846b673` (BoothHero post-it eyebrow follow-on). A3 wrapper across `/shelves` rows + `/flagged` section headers: dashed green border + paper-cream 0.55 fill + soft drop shadow + numeral 26 → 22. BoothHero + `/find/[id]` post-it eyebrows swapped to small-caps FONT_SYS to match (commits `846b673` + `bd0011b`). Mockup files at [`docs/mockups/demo-prep-refinement-v1.html`](docs/mockups/demo-prep-refinement-v1.html) + [`docs/mockups/demo-prep-refinement-v2.html`](docs/mockups/demo-prep-refinement-v2.html) serve as the design record (no separate `.md` since this was tactical visual polish, not a new structural pattern).
- **Tweak 1 (session 81) — /flagged vendor/mall gap** ✅ — **resolved session 81** in `a0e2862`. marginTop 6 → 2 to match /find/[id] cartographic block.
- **Tweak 2 (session 81) — post-it warmer + cartographic card matched** ✅ — **resolved session 81** in `c6e5273` + `154145f`. v1.postit `#fffaea → #fbf3df`. Cartographic "Find this item at" card on /find/[id] inline `background: v1.postit` (not global `v1.inkWash` swap, which would have over-broadened to 18+ surfaces).
- **Tweak 3 (session 81) — /find/[id] post-it eyebrow** ✅ — **resolved session 81** in `bd0011b`. Italic IM Fell 14px → small-caps FONT_SYS 9px / 0.12em / weight 700 / uppercase to match BoothHero post-it.
- **Tweaks 4 + 5 (session 81) — "Mall" → "Location" copy scrub + "All Kentucky Locations" picker** ✅ — **resolved session 81** in `0fab4a0`. 13 files of user-facing strings updated; internal identifiers (`Mall` types, `malls` table, `mall_id` props, `mall_activated`/`mall_deactivated` event keys, `/api/admin/malls` routes, component names) deliberately preserved. **NEW carry-forward: "All Kentucky Locations" title fit risk on narrow phones** (26px IM Fell + chevron + side padding ~290–330px on a 390px-wide phone). If wraps awkwardly, options: drop to 22px, abbreviate "All Locations", or stack on two lines. Easy to revise.
- **Session 80 carry: Item 4 BoothHero bookmark needs iPhone QA against banner photo** ✅ — **resolved session 81 implicitly**. The session 81 bubble bg lightening (paper-warm 0.85) was shipped + David QA'd via Vercel preview without flagging the BoothHero corner bubble against banner-aspect photos — assumed acceptable.
- **Session 80 carry: Item 2 row density iPhone QA** — **partially addressed session 81**. A3 lockup wrapper added to rows; David QA'd the A3 card without flagging row-density issues. Real-content seeding still the load-bearing test.
- **Session 80 carry: Item 5 wordmark 18px against masthead bubbles** — **session 81 untouched.** No regressions reported during iPhone QA cycle. Likely acceptable.
- **Session 80 carry: Item 2 D8 admin chrome** — **session 81 untouched.** No admin walk-through this session; still a single-firing implementation-time decision worth admin verification.
- **NEW (session 81): "All Kentucky Locations" title fit on narrow phones** — see tweaks 4+5 entry above.
- **NEW (session 81): A3 lockup numeral 22 vs old 26 — visual rhythm on real content** — card-padding consumes the 4px lost. Real-content seeding will stress-test against varied alphanumeric booth IDs.
- **NEW (session 81): Post-it color #fbf3df subtle vs prior #fffaea** — RGB delta (-4, -7, -11). If still reads white in real-content QA, easy refinement to push warmer (e.g. `#f9eed5`).
- **NEW (session 81): Cartographic card bg matched via inline `v1.postit` not via global token swap** — single firing. If we accumulate more "this element is in the cartographic-card family" surfaces, extract a `v1.cartographicBg` semantic token. Not needed yet.
- **NEW (session 81): Q-005 admin claimed-booth deletion gap surfaced again** — beat 10 admin SQL HITL for Kentucky Treehouse + Ella's Finds test booths. Trash on `/shelves` is gated to orphan booths only (session 74 D8). Cleanup tool would resolve. Sprint 6+ candidate.
- **NEW (session 81): "User-facing copy scrub: skip DB/API/event/type identifiers"** — first firing. Tech Rule on second.
- **NEW (session 81): "Inline bg vs token swap when token affects too many surfaces"** — first firing.
- **NEW (session 81): "V2 mockup as fill-refinement within a picked option"** — first firing pattern shape; useful for "I picked option A, but with this concern" iterations.
- **NEW (session 81): "Mid-session iPhone QA on Vercel preview shortens redirect cycle"** — first firing as a structural pattern (vs ship-then-QA-next-session). Compresses 2-session arc into one. **2nd firing session 82** — promotion-ready.
- **Item 1 (session 82) — booth # optional** ✅ — **resolved session 82** in `2af064d`. Client-side red-asterisk → `(optional)` badge + drop client validation + drop server-side `!booth_number?.trim()` validation. Server dedup query already handled null booth.
- **Item 2 (session 82) — Mall → Location on /vendor-request** ✅ — **resolved session 82** in `e924664`. Single label swap + validation error string. The form was missed in session 81's 13-file scrub.
- **Item 3 (session 82) — /vendor-request typography pass + system-wide IM Fell retirement + Option C label primitive across 5 form surfaces** ✅ — **resolved session 82** across 4 commits (`08bf5c4` Lora infra + `b444c5e` project-wide font sweep + `6d26df6` /vendor-request page changes + `e446c11` form-label primitive sweep). New title "Set up your digital booth" + permission/value intro paragraph. **IM Fell completely retired from the codebase** — Lora is the project-wide literary serif via `next/font/google` + `FONT_LORA` token. Option C label primitive (Lora upright, 15px /vendor-request + 13px sheets, ink-mid) swept across BoothFormFields + AddBoothInline + admin/login + post/preview Field. Photo dropzone + ack-card unified to Lora (was FONT_SYS). Mockup files: [`docs/mockups/vendor-request-typography-v1.html`](docs/mockups/vendor-request-typography-v1.html) + [`docs/mockups/vendor-request-typography-v2.html`](docs/mockups/vendor-request-typography-v2.html).
- **/shelves bookmark filter count bug (session 82)** ✅ — **resolved session 82** in `dfed189`. Chip rendered `bookmarkedIds.size` (global localStorage set) instead of `bookmarkedInScopeCount` (already computed at line 523). One-line fix.
- **/shelves rows without booth # are shorter + text cut off (session 82)** ✅ — **resolved session 82** in `f187165`. New BoothLockupCard primitive uses `min-height: 60` to keep rows uniform regardless of booth-number presence. Empty-state hides BOOTH eyebrow entirely (per Q1 = c); name claims full row width.
- **BoothLockupCard shared primitive extraction + applied to /shelves + /flagged (session 82)** ✅ — **shipped session 82** in [`components/BoothLockupCard.tsx`](components/BoothLockupCard.tsx) + `f187165` (apply to /shelves) + `bf8ac24` (apply to /flagged + booth bookmark wiring). Visual: v1.postit bg, 1px hairline, 10px radius, 12/14 padding, no shadow. /find/[id] cartographic card stays inline (intentional per David — *"no change to this component card"*) but visually identical. **Session 81's A3 dashed-fill-lift card is RETIRED** in favor of this shared primitive.
- **/flagged section header booth bookmark added (session 82)** ✅ — **resolved session 82** in `bf8ac24`. BoothGroup type gained `vendorId` field. State + handler mirror /shelves (boothBookmarkKey + R3 v1.1 booth_bookmarked / booth_unbookmarked events). Synced on mount + focus.
- **Descender clip on Lora vendor names (session 82)** ✅ — **resolved session 82** in `a045058`. lineHeight 1.25 → 1.4 across BoothLockupCard primitive AND /find/[id] inline (had the same bug, just hadn't been caught in QA because David's seed data lacked descender-heavy vendor names).
- **NEW (session 82): IM Fell inline comments are documentation rot.** ~20 references across 15 files ("italic IM Fell vocabulary," "matches IM Fell italic," etc.). Functional sweep was clean; comments lag. Opportunistic cleanup over future sessions.
- **NEW (session 82): Form-label sweep skipped non-`<label>`-tag form chrome** on AddFindSheet, post/preview body, setup page. Section headers in italic Lora may want similar Option C treatment if they fire as recurring readability concerns. Defer.
- **NEW (session 82): BoothLockupCard primitive could extend to /shelf/[slug] BoothHero** if David ever wants the post-it to match the card primitive. Currently intentionally NOT matched.
- **NEW (session 82): "Bug surfaced in extracted primitive AND inline copy of same primitive — fix both in same commit"** — first firing (descender clip in BoothLockupCard + /find/[id] inline simultaneously). Single firing.
- **NEW (session 82): "Per-context sizing on a swept primitive"** — first firing (Option C label at 15px on full pages, 13px on sheets — label sized relative to its input). Single firing.
- **NEW (session 82): "User-facing copy scrub: skip DB/API/event/type identifiers"** — **2nd firing.** Promotion-ready.
- **NEW (session 82): "V2 mockup as fill-refinement within a picked option"** — **2nd firing** (V1 = 3 label primitives within IM Fell / V2 = 3 fonts within picked Option C). Promotion-ready on a 3rd firing.
- **NEW (session 82): "We continue to run into this issue" / "Every time I see X" signals system-level concern** — first firing as a memory ([`feedback_recurring_phrase_signals_system.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_recurring_phrase_signals_system.md)). Pattern fired 2× in session 82 (typography + booth lockup). Memory captures the rule.
- **Postcard PoC reverted (session 83)** ✅ — explored postcard/paper visual language as session opener. V1 mockup (3 additive frames: texture / +frame / +stamp) → David picked Frame A → 3 implementation iterations on Home — David's verdict after iPhone QA: *"the background is subtly distracting as it almost feels like there is dust on the screen due to the texture."* Full revert (`c3d5528`) returned to session 82 close baseline. Mockup retained as exploration record. paper.png in /public retained (David-uploaded; cleanup candidate).
- **Polaroid evolved tile pattern (session 83)** ✅ — **shipped end-to-end across 4 surfaces.** Home MasonryTile (`55d9c77` + `2df6a78`) + /flagged FindTile + /shelf/[slug] WindowTile + ShelfTile (`6152511`). Warm cream paper `#faf2e0`, 4px radius, dimensional dual-shadow (`0 6px 14px 0.20` far + `0 1.5px 3px 0.10` close), 7px photo mat top/sides. Three near-identical wrappers — did NOT extract shared `<FindTile>` primitive (premature abstraction). If a fourth surface adopts polaroid OR all need to evolve in lockstep, refactor candidate.
- **Tile title+price centering treatment (session 83)** ✅ — `b8c8e67` David iPhone QA redirect. Title+price center-aligned horizontally, vertically grouped via flex column + justify-center + items-center within metadata block. Price `FONT_SYS 12 → FONT_LORA 14` matching title size — same-size-different-color pattern lifted from /find/[id] hero (Lora 32px both, only color differs between `inkPrimary` and `priceInk`). marginTop 3 → 4 for tighter "locked together" rhythm. Applied to FindTile + WindowTile + ShelfTile.
- **Tile metadata block height-locking (session 83)** ✅ — `e19e9fe` David iPhone QA redirect on /flagged. `minHeight: 76` → `height: 76` (locked) + bottom padding 11 → 4 to fit 2-line title + price worst case exactly (39.2 + 4 + 19.6 + 13 padding = 76). Heterogeneous title content (1-line vs 2-line) no longer breaks row consistency. Applied to FindTile + WindowTile + ShelfTile.
- **/find/[id] strip centering + "shelf" → "booth" rename (session 83)** ✅ — `b804ee6`. Centering format applied to ShelfCard metadata block (textAlign center, lineHeight 1.4, width 100%, flex column + justify-center + items-center, height locked at 56, bottom padding 11→4). **Did NOT** apply polaroid wrapper styling — kept inkWash + hairline + 6px radius + subtle shadow per "polaroid skips navigate/detail surfaces" rule. Section eyebrow rendered text "More from this shelf…" → "More from this booth…".
- **Tile title descender clearance (session 83)** ✅ — title lineHeight 1.2 → 1.4 across FindTile + WindowTile + ShelfTile + ShelfCard. **2nd firing of session 82's vendor-name fix** — Lora descenders extend ~5px below baseline; at 14px text + 1.2 lineHeight + overflow:hidden + WebkitLineClamp:2, descenders ('g', 'y', 'p') clipped on line 2.
- **NEW (session 83): paper.png in /public** — 2.7MB unused asset David uploaded for postcard PoC. Cleanup candidate; left in place per "don't presume to delete user-uploaded assets" instinct.
- **NEW (session 83): 3 inline "More from this shelf" code comments** in [`app/find/[id]/page.tsx`](app/find/[id]/page.tsx) (lines 14, 31, 1224) — documentation rot. Same pattern as session 82's IM Fell comments. Opportunistic cleanup.
- **NEW (session 83): Three near-identical polaroid wrappers across FindTile + WindowTile + ShelfTile + ShelfCard** — shared `<FindTile>` primitive extraction trigger if a fourth surface adopts polaroid OR all need to evolve in lockstep. Don't extract until that trigger fires.
- **NEW (session 83): "Browse vs navigate/detail rule for material chrome"** — first firing as a system rule. Polaroid (heavy material chrome) belongs on browse/collect surfaces (Home, /flagged, /shelf/[slug] grid). Light card chrome stays on navigate/detail surfaces (/find/[id] strip). BoothPage post-it hero counts as "anchor" not "tile" — no polaroid there. Tech Rule candidate on second firing.
- **NEW (session 83): "Match a primary-page typographic pattern when extending visual identity to tiles"** — first firing. Lifted /find/[id]'s hero title+price treatment (Lora 32px both, same weight, marginTop 2, only color differs) to 14px tiles (same family, same weight, marginTop 4, only color differs). Brand-anchoring at scale. Tech Rule candidate.
- **NEW (session 83): "Lock fixed-height + reduce padding to fit worst case for row consistency"** — first firing for heterogeneous-content tiles (1-line vs 2-line titles). Tech Rule candidate.
- **NEW (session 83): "Lora needs lineHeight 1.4 minimum when overflow:hidden + ≤14px text + line-clamp"** — **2nd firing** (session 82 vendor names + session 83 tile titles). Promotion-ready as concrete typography rule.
- **NEW (session 83): "Revert to clean baseline before pivoting directions"** — captured as new memory ([`feedback_revert_to_clean_baseline_before_pivot.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_revert_to_clean_baseline_before_pivot.md)). Don't carry abandoned changes into a pivot.
- **NEW: Frame C compact-photo alternative parked** (session 75) — [`docs/mockups/request-booth-redesign-v1.html`](docs/mockups/request-booth-redesign-v1.html) Frame C ready as a second pass if iPhone QA reveals 3:2 dropzone still feels overwhelming. CSS-only change.
- **NEW: Project-wide rule "letters → IM Fell or sans; numbers → FONT_NUMERAL"** (session 75) — captured in [`docs/booth-numeral-font-design.md`](docs/booth-numeral-font-design.md) carry-forwards. Promote to design-system.md on next consolidation.
- **NEW: BoothHero lightbox z-index sandwich pattern** (session 75) — transparent overlay at z-5 between photo container and pencil/post-it. Reusable when adding tap targets to affordance-rich surfaces. Single firing.
- **NEW: Long-form helper copy on paper-wash → FONT_SYS, not IM Fell italic** (session 75) — photo dropzone copy was the trigger. Single firing. Tech Rule on second firing.
- **NEW: Narrow-named tokens audited for generalization** (session 75) — `FONT_POSTIT_NUMERAL` discovery. Single firing.
- **NEW: Item 6 (session 76) — FB Marketplace shared-element transitions** carried into session 77. Mockup + framer-motion `layoutId` testbed + rollout across 4 thumbnail surfaces. Per `feedback_testbed_first_for_ai_unknowns.md`, build `/transition-test` testbed page first to validate cross-route shared-element transitions before touching real surfaces. Size M-L; likely its own session.
- **NEW: E6 (session 76) — scroll-restore safety deferred** — extract `useScrollReveal` from [`app/page.tsx`](app/page.tsx) into `hooks/useScrollReveal.ts`; generalize sessionStorage-key + ref machinery so Booths / Find Map / /flagged adopt skip-entrance-on-restore. ~30–60 min in its own session.
- **NEW: Frame C parked on find-title centering** (session 76) — [`docs/mockups/find-detail-title-center-v1.html`](docs/mockups/find-detail-title-center-v1.html) Frame C (22px italic subtitle) ready as CSS-only pivot if 32px twin reads heavy on real vendor content during seeding.
- **NEW: Sheet/modal entrance animation consistency NOT touched** (session 76) — DeleteBoothSheet, AddBoothSheet, EditBoothSheet, MallSheet, AddFindSheet, ShareBoothSheet etc. carry their own entrance animations. Inventory deferred to a separate consistency pass on overlay primitives.
- **NEW: `app/finds/page.tsx` (dark reseller layer "My Picks") deviates from motion tokens** (session 76) — out-of-scope by design (different theme, different layer). Future cleanup if dark layer ever migrates.
- **NEW: Home MasonryTile bespoke easing intentionally diverges** (session 76) — `cubic-bezier(0.22,1,0.36,1)` for transform + 0.38/0.44s split durations preserved as intentional polish on hero feed grid. Token values centralize but the runtime is forked.
- **NEW: Detail-page render branches must render base chrome in every state** (session 76) — first firing (find/[id] bug). Single firing; Tech Rule on second firing.
- **NEW: Default to stacked over inline for title + secondary value patterns** (session 76) — first firing (find-title em-dash retirement). Single firing.
- **NEW: Audit invariants against sibling pages of the same shape after 3+ recent sessions** (session 76) — first firing (find/[id] masthead invariant existed in /shelf/[slug] but not here despite 3 recent layout sessions). Single firing.
- **Feed content seeding** ✅ — **resolved pre-session 82** (David completed seeding before session 82 standup). 15 posts across 2 mall locations and 3 vendors. The 24× bumped item finally came off the queue. Real-content QA loop now possible.
- **Hero image upload size guard** — verify coverage across upload surfaces. Note: session 61 added DELETE coverage at `/api/admin/featured-image`; size guard remains a separate concern on the upload path.
- **Tech Rule promotion batch — badly overdue** — 30+ candidates queued; **TR-l + TR-m both 🟢 promotion-ready**, **"verify sub-agent claims that contradict known semantic rules" 🟢 promotion-ready**, **"smallest→largest commit sequencing" 🟢 promotion-ready and overdue** (sessions 70 1st + 77 2nd misfire + 78 1st clean + 80 2nd clean + 81 3rd clean + 82 6th clean + 83 7th clean — fully load-bearing across every David-redirect-bundle session), **`feedback_mockup_options_span_structural_axes.md` 🟢 promotion-ready** (sessions 80 + 81 + 82 + 83 — 4 firings), **"Mid-session iPhone QA on Vercel preview shortens redirect cycle" 🟢 promotion-ready** (sessions 81 + 82 + 83 — 3 firings), **"Lora needs lineHeight 1.4 minimum when overflow:hidden + ≤14px text + line-clamp" 🟢 promotion-ready** (session 82 BoothLockupCard vendor names + session 83 tile titles — 2 firings, concrete typography rule). **Session 83** surfaced THREE new single-firings: (1) "Browse vs navigate/detail rule for material chrome"; (2) "Match a primary-page typographic pattern when extending visual identity to tiles" (Lora-14px tile pattern lifted from /find/[id] 32px hero); (3) "Lock fixed-height + reduce padding to fit worst case for row consistency in heterogeneous-content tiles". Plus the new memory `feedback_revert_to_clean_baseline_before_pivot.md`. Full register: [`docs/tech-rules-queue.md`](docs/tech-rules-queue.md).
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
- **Item 3 — animation consistency review across pages** ✅ — **resolved session 76** in `ecb8ef8` + `3832fc1`. 5 motion tokens centralized in lib/tokens.ts; Booths VendorCard tap parity shipped; empty states unified. E6 (scroll-restore safety) deferred separately.
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
- **Operational backlog** — staging migration paste, OTP template paste, debug-toast cleanup, doc-only updates (Design agent principle, KNOWN PLATFORM GOTCHAS), `/admin` `auth.users` delete spike, `/api/suggest` SDK migration, archive-drift backfill (sessions 54 + 55 + 57–80 missing), strip verbose diag logs from `/api/admin/events/route.ts`, audit other `createClient` callsites, reap dormant showPlaceholders prop infrastructure in BoothPage.tsx, **session 80: tidy V1 mockup files** ([booths-tile-redesign-v1.html](docs/mockups/booths-tile-redesign-v1.html) + [wordmark-redesign-v1.html](docs/mockups/wordmark-redesign-v1.html), superseded by V2), **session 80: amend [`docs/marketplace-transitions-design.md`](docs/marketplace-transitions-design.md) with "Source side retired on /shelves" addendum**, **NEW (session 81): Q-014 Metabase planning** — decide whether to rename `mall_activated`/`mall_deactivated` event keys to `location_*` (backwards-compat migration, not flag-day), **NEW (session 81): consider `v1.cartographicBg` semantic token extraction** if more cartographic-card surfaces accumulate. → [`docs/queued-sessions.md`](docs/queued-sessions.md) §Operational backlog.
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

> **Sprint 4 fully closed sessions 40–41; sessions 42–53 ran the pre-beta polish arc; sessions 54–69 carried the polish + observability + brand + navigation + persistence + terminology + caption-typography + Option B booth-identity sweep; session 70 was the largest layout-redesign sweep in recent memory; session 71 closed three independent decision arcs; session 72 rationalized admin entry; session 73 closed R3 end-to-end; session 74 closed the Gemba-walk admin-management gap; sessions 75 + 76 closed David-redirect bundles end-to-end; session 77 shipped Track D phases 1–4 + the masthead 5-attempt arc; session 78 shipped Track D phase 5 end-to-end — three production surfaces, preview-cache pattern as new reusable infrastructure. Session 79 was net-zero (Track D extension attempt reverted). Session 80 closed a David-redirect bundle (5 items + 2 polish). Session 81 closed the demo-prep refinement bundle (9 runtime commits, V1 + V2 mockups). Session 82 closed the largest design-system consolidation pass since the v1.x layer was named (10 runtime commits + V1/V2 typography mockups): project-wide IM Fell → Lora replacement (29 files swept, IM Fell completely retired); Option C form-label primitive across 5 form surfaces; BoothLockupCard shared primitive applied to /shelves + /flagged. **Session 83 closed the polaroid evolved tile direction end-to-end across 4 surfaces (10 runtime commits + 2 V1 mockups, 6+ in-session iPhone QA cycles):** Home MasonryTile + /flagged FindTile + /shelf/[slug] WindowTile + ShelfTile all wrapped in warm-cream paper polaroid frame (`#faf2e0`, 4px radius, 7px photo mat, dimensional dual-shadow); title+price as same-size centered Lora 14px group with locked metadata block height (mirrors /find/[id] hero pattern at scale); /find/[id] More-from-shelf strip got centering treatment without polaroid wrapper per "browse vs navigate" rule + section eyebrow renamed "shelf" → "booth"; tile descender clearance lineHeight 1.4 (2nd firing of session 82's vendor-name fix). Postcard PoC explored + reverted in full (texture read as dust). ONE new memory: **`feedback_revert_to_clean_baseline_before_pivot.md`** (revert to clean baseline before pivoting directions). Smallest→largest commit sequencing fired clean for the 7th time — badly overdue Tech Rule promotion. The `/my-shelf` back-nav scroll anchor (session 79 primary user ask, carrying for 4 sessions) is THE longest-standing user-facing carry-forward and is the recommended next session, with strict scope: scroll-key + module-cache only, NO motion.div / layoutId changes. **Next natural investor-update trigger point** is after the next 1–2 sessions land scroll-restore + Q-014 Metabase analytics — that turns "data flowing" into "investor-ready dashboards."
