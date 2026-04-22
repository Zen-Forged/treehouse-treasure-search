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

Tell Claude: "close out the session" then run `thc`.

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
| Queued sessions (scoped work sequenced behind something else) | `docs/queued-sessions.md` |

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

## ✅ Session 45 (2026-04-22) — /shelves cross-mall fix + admin booth delete + Q-009 admin share bypass + BoothHero URL share retired

Largest single-session scope since session 35. Four user-visible shipments, three distinct commits, all landed green with on-device walks passing. Session opened on a session-44 regression report ("booths at non-AAM malls vanish on refetch") and a queued admin-surface gap, expanded naturally into Q-009 when David reported the missing share affordance on `/shelf/[slug]` as admin, and closed with a cleanup pass on the two-airplane confusion surfaced by the Q-009 work. Explicit mid-session scope expansions all passed the Decision Gate before proceeding; no scope creep into Q-008 shopper-share or Q-011 email-post-it bug (both remain queued).

### Shipment 1 — /shelves cross-mall directory fix + admin delete feature

**Bug root cause:** `/shelves/page.tsx` called `getVendorsByMall(DEFAULT_MALL_ID)` hardcoded to America's Antique Mall. Session-44's `<AddBoothInline>` optimistic prepend concealed the limitation — new booth appeared on create, vanished on refetch if seeded at a non-AAM mall. `/shelves` is the cross-mall booth directory per CONTEXT.md §5; the single-mall query was never correct. Bug only surfaced when session 44 gave admins the ability to seed outside AAM.

**Fix + feature bundled:**
- `lib/posts.ts` — new `getAllVendors(): Promise<Vendor[]>` exported. `*, mall:malls(id,name,city,state,slug)` select (matches sibling getter pattern to keep TS inference legal — see Tech Rule note below). Ordered by `mall_id ASC, booth_number ASC NULLS LAST`. In-code comment documents the trap.
- `app/api/admin/vendors/route.ts` — NEW file. DELETE handler, `requireAdmin` first line. Seven-step cascade: fetch vendor → **409 safety gate if `user_id !== null`** (claimed booths must be unlinked in Supabase first, per David's explicit session-45 call) → fetch posts + collect image paths → remove post-image blobs → remove `vendor-hero/{id}.jpg` → delete posts rows → delete vendor row. Log all outcomes. Returns `{ ok, vendorId, postsDeleted, imagesDeleted }`.
- `app/shelves/page.tsx` — swapped to `getAllVendors`. Subtitle rewritten as data-driven helper (`subtitleFor(vendors)`): 5 graceful cases — 0 booths hides the line entirely, 1-mall variants read "N booths at {mallName}" (treats single-mall correctly since production is still AAM-only today), multi-mall reads "N booths across M locations" using "locations" to match `<MallSheet>` voice and preserve cartographic-pin semantic. Admin-only `<Trash2>` bubble added to `<VendorCard>` hero band at `right: 46` (clears the `<Pencil>` edit bubble at `right: 10`); trash only renders when `!vendor.user_id` (client-side cosmetic gate — server 409 is the actual safety). `<DeleteBoothSheet>` inline component: typed-confirm pattern — admin types the exact `display_name` to enable the red delete button. `authFetch` bearer pattern. Error path surfaces the server's 409 message verbatim so the claimed-vendor case reads cleanly.

**🔴 STOP trigger at session open.** Deleting a vendor cascades posts + post-image storage + hero image + vendor row. Flagged as "Deleting or overwriting production data." Mitigations shipped: `requireAdmin` first line, 409 safety gate on claimed vendors (reduces blast radius to pre-seeded + unclaimed only), typed-name client confirmation, inline confirm sheet showing booth identity + mall + booth number. David approved the shape before execution.

**Build error caught pre-commit:** first attempt used explicit column list in `getAllVendors` select. Supabase client's TS inference on nested joins tightens differently between `*, mall:malls(...)` and `id, ..., mall:malls(...)` — the explicit-columns shape typed `mall` as an array (general foreign-key case), colliding with `Vendor.mall?: Mall` (object). One-line fix: swap to `*` pattern matching `getVendorsByUserId` / `getVendorBySlug` / `getVendorById` / `linkVendorToUser`. Tech Rule candidate captured — see "Tech Rule candidates queued" below.

**On-device walk passed:** admin adds booth at non-AAM mall → appears + persists across refetch; subtitle updates correctly; trash bubble visible on unclaimed booths only; typed-confirm delete works; server 409 fires correctly on claimed vendors.

### Shipment 2 — Q-009 admin Window share bypass

David reported after Shipment 1's walk: "I don't see Share-the-Booth on `/shelf/[slug]` as admin." This was Q-009 in `docs/queued-sessions.md`, already scoped (~15 min). The report also surfaced the cultural question of what the two airplanes actually do, which led to Shipment 3.

**What shipped:**
- `app/api/share-booth/route.ts` — added `isAdminCaller` derivation post-`requireAuth` (pattern matches `requireAdmin` in `lib/adminAuth.ts`: compare `auth.user.email.toLowerCase()` to `NEXT_PUBLIC_ADMIN_EMAIL.toLowerCase()`). Ownership query refactored to build conditionally: admin branch skips `.eq("user_id", auth.user.id)`, non-admin branch keeps it. Downstream `ownedVendor` shape identical; nothing else changed. 403 returns "You don't own this booth." for non-admin, 404 "Booth not found." for admin (which shouldn't fire in practice — admin querying a non-existent id). Success log appends `(admin-bypass)` when admin path used so audit trails distinguish admin sends from vendor sends. `senderFirstName` stays as `vendorRow.display_name` per David's explicit session-45 call ("ZenForged Finds sent you a Window…" reads as "from the booth" rather than "from the admin personally").
- `app/shelf/[slug]/page.tsx` — added `getSession` + `isAdmin` import, session state, `useEffect` session read (non-blocking: page renders for all viewers, only masthead airplane is gated). Masthead right slot now renders paper-airplane button when `canShare = isAdmin(user) && !!vendor && available.length >= 1`. SVG + button chrome duplicated from `/my-shelf` verbatim (no primitive extraction — two consumers doesn't meet the "canonical primitive impulse" bar per Design agent system prompt). `<ShareBoothSheet>` mounted whenever `vendor` resolved; open/close via `shareOpen` state.

**On-device walk passed:** admin sees airplane top-right on `/shelf/[slug]`; sends Window to own email; email delivers; shopper + signed-out users see no airplane; booth with zero available posts shows no airplane.

**Q-008 (shopper share) and Q-011 (email post-it bug) stayed queued** — explicit scope decision, not creep. Q-008 would require auth-branching + sender-attribution rewrite + rate-limit rescope (90–120 min); Q-011 requires email-rendering diagnostic across iOS Mail / Gmail / Outlook (60–90 min). Both are their own sessions.

### Shipment 3 — BoothHero URL link-share retired (two-airplane cleanup)

Q-009 completion exposed the latent confusion: `<BoothHero>` had a top-right frosted airplane bubble (link-share via `navigator.share` / clipboard URL fallback) AND the masthead airplane (Window email). Two airplanes, both labeled "Share," on the same page — the cultural debt session 40 explicitly acknowledged ("reconciling the two airplanes is a Sprint 5+ Design agent question"). David's call: retire the hero bubble, keep masthead only.

**What shipped:**
- `components/BoothPage.tsx` — deleted the Share bubble JSX from `<BoothHero>` (both the `hasCopied ? <Copied!> : <airplane>` conditional and the `motion.button`). Removed `onShare` and `hasCopied` from the prop interface. Removed `Send` and `Check` from `lucide-react` imports (neither has another caller in the file — verified). File header comment block updated with session-45 retirement rationale (what was removed, why, where the capability lives now, what users who want URL share should do). Primitives-list header comment updated: "edit/share bubbles" → "edit bubble". Scrim-preservation comment updated to reflect that only the edit bubble (top-left, owner-only) now needs the gradient.
- `app/my-shelf/page.tsx` — deleted `copied` state, deleted `handleShare` function, deleted `BASE_URL` constant (only caller was `handleShare`). Stripped `onShare` and `hasCopied` props from `<BoothHero>`.
- `app/shelf/[slug]/page.tsx` — same three deletions, same prop strip.

**Replacement capability for URL share:** users can still use the browser's native share menu or copy from the address bar. The masthead airplane's richer output (6-find curated HTML email) replaces the URL link-copy the hero bubble used to produce.

**On-device visual walk passed:** hero banner clean of airplane on all three surfaces (`/my-shelf` vendor, `/shelf/[slug]` admin, `/shelf/[slug]` signed-out); masthead airplane unchanged on its existing gates.

**No `<BoothHero>` third-consumer risk:** confirmed via grep before prop removal. Only `/my-shelf` and `/shelf/[slug]` import it.

### Self-audit against Tech Rules (all three shipments)

- **File-creation verify** — `app/api/admin/vendors/route.ts` confirmed on disk via `list_directory` mid-session. ✓
- **New API route dir creation** — HITL `mkdir -p` ran cleanly at session open; write succeeded on second attempt. ✓
- **Framer-motion transitions** — no two-transition-props pattern introduced. ✓
- **Framer-motion centering transform** — `<DeleteBoothSheet>` uses non-animated wrapper div with animated child (session-9 KI-002 pattern). ✓
- **`export const dynamic = "force-dynamic"`** — preserved on all five edited pages. ✓
- **TS downlevelIteration** — no `for...of` over Map/Set introduced. ✓
- **New consumer on old select (session-36 rule)** — `/shelves`'s `<VendorCard>` now reads `vendor.mall?.name` as bio fallback; `<DeleteBoothSheet>` reads `vendor.mall?.name` + `vendor.booth_number`. Verified `getAllVendors` `*` select covers all fields. ✓
- **Service-role-only tables via /api/*** — `/api/admin/vendors` DELETE uses `auth.service` exclusively. ✓
- **Admin API route has `requireAdmin` first line** — both DELETE and the `/api/share-booth` admin branch derive from `requireAdmin`-pattern code. ✓
- **zsh glob** — `git add -A` used at every commit. ✓
- **Copyright / brand rules** — N/A this session (no external content reproduced). ✓

### Tech Rule candidates queued by this session

1. **Supabase nested-select explicit-columns type-narrowing** (named session 45). Using `select("id, col1, col2, mall:malls(...)")` tightens the client's TS inference on `mall:malls(...)` to an array type — collides with `Vendor.mall?: Mall`. Sibling pattern `select("*, mall:malls(...)")` preserves the inference that lets the outer `as Vendor[]` cast compile. One firing this session; watch for a second firing before promoting. Sits in the same family as the existing session-39 `TS downlevelIteration` rule (both are "Supabase/TS quirks that only surface at build time"). Workaround documented inline in `getAllVendors` comment.

2. **"Two-airplanes" pattern audit** (conceptual, session-45 observation). When a shared primitive accumulates multiple affordances with the same glyph but different semantics (session 40's committed two-airplane coexistence on `<BoothHero>` + masthead), plan the reconciliation at the SAME time as the second addition — not "Sprint 5+ Design agent question later." Session 45 paid the cleanup cost for what session 40 deferred. Not promoting as a hard Tech Rule (judgment call, not mechanical check), but worth logging as a Design-agent principle. Candidate addition to the Design agent system prompt: "When a second instance of a glyph/affordance is introduced, the reconciliation is part of the same scope — not a later cleanup."

### Risk Register updates (DECISION_GATE.md will be updated separately as part of close)

- `/shelves` hardcoded single-mall query — ✅ Resolved session 45
- KI (new) — admin-seeded booths at non-AAM malls vanished on refetch — ✅ Resolved session 45 (same line as above)
- Q-009 admin share bypass — ✅ Resolved session 45 (was 🟢 Ready)
- Session-40 deferred "two-airplane reconciliation" — ✅ Resolved session 45 (BoothHero bubble retired)
- Admin vendor delete capability — ✅ Added session 45 (was manual Supabase-only)
- Session 44 T4b partial-reversal row — still open (no change; session-45 scope didn't touch `<AddBoothInline>`)

### Session 45 close HITL

All code shipped already (three commits pushed mid-session). Nothing pending in code. Only the docs close commit remains.

```bash
cd /Users/davidbutler/Projects/treehouse-treasure-search && git add -A && git commit -m "docs: session 45 close — /shelves cross-mall + admin delete + Q-009 + BoothHero airplane retired" && git push
```

---

## CURRENT ISSUE
> Last updated: 2026-04-22 (session 45 close — four shipments, all on-device walks passed, all commits pushed)

**Status:** No pending HITL in code. Docs commit remains. Beta invites still technically unblocked (sprint 4 tail closed sessions 40–41, remains closed). Feed content seeding is still the highest-leverage remaining pre-beta item and has been carried forward from session 43's and session 44's recommendations without change. The `/shelves` Add-a-Booth primitive is now fully functional end-to-end (seed → persist cross-mall → delete with safety gate), which strengthens the session-45-feed-seeding workflow — admins can seed + iterate on booths directly from `/shelves` without touching Supabase.

### Recommended next session — feed content seeding (~30–60 min)

Unchanged from session 44's recommendation. Session 45 did not dislodge it.

Seeding scope:
- Create 2–3 real (non-test) vendors via `/shelves` Add-a-Booth (primary path, session 44 + 45). `/vendor-request` → `/admin` approve flow remains available for Flow 3 if desired.
- Seed 10–15 finds across those vendors, mostly available status with 1–2 "found a home."
- Photos should be real items, ideally spanning a few material categories (glass, ceramic, brass, wood) to make the feed feel varied on first scroll.
- Verify the feed, Find Map, and mall pages all render well with the new population.
- Light QA: ensure the session-27 `source: "claude" \| "mock"` field returns `"claude"` for all auto-caption calls.

This session is likely to first trip session-43 Anthropic auto-reload (threshold $10 / reload $20). Expected and non-blocking. Balance at session-45 close is whatever session 43 reported minus any API spend this session (none — no AI routes touched session 45).

### Alternative next sessions

- **Q-008** 🟢 (~90–120 min) — Open Window share to unauthenticated shoppers. Scope-expansion sibling to the Q-009 that shipped this session.
- **Q-011** 🟢 (~60–90 min) — Window email banner post-it missing/misplaced (email-rendering diagnostic).
- **Q-002** 🟢 (~20 min) — Picker affordance placement revision.
- **Tech Rule promotion batch** (~40 min) — now six candidates queued:
  - sessions 33, 35, 36, 38 dependency-surface family
  - session-40 React 19 ref-forwarding (one firing)
  - **session-45 Supabase nested-select explicit-columns** (one firing, NEW)
  - session-42 verify-remaining-count (still below two-firings-outside-same-context bar)
- **Session-archive drift cleanup** (~30 min) — sessions 28–38 carry one-liner summaries but no archive detail. Session 45 adds itself to the list of sessions needing archive detail eventually, but the session-45 block in this whiteboard is comprehensive enough that the eventual archive entry is a paste-over rather than a rewrite.
- **Design agent principle addition** (~10 min, docs only) — "When a second instance of a glyph/affordance is introduced, the reconciliation is part of the same scope, not a later cleanup." Session-45 retrospective. Would go in MASTER_PROMPT.md's Design Agent section.
- **Error monitoring** (Sentry or structured logs) — Sprint 3 carryover.
- **Beta feedback mechanism** (Tally.so link).
- **Hero image upload size guard** — verify coverage across upload surfaces.
- **`/admin` v0.2 → v1.2 redesign pass** (Sprint 5+, size L) — still queued; needs design scope first.

### Session 46 opener (pre-filled for feed content seeding)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Feed content seeding per CLAUDE.md recommendation. Scope: (1) create 2–3 real (non-test) vendors via /shelves Add-a-Booth (session 44+45 primary path) or /vendor-request → /admin approve flow (Flow 3); (2) seed 10–15 finds across those vendors, mostly available status with 1–2 "found a home"; (3) verify feed, Find Map, mall pages render well with new population; (4) light QA that session-27 `source: "claude"` field returns clean on all auto-caption calls. This session will likely first trip session-43 auto-reload (threshold $10 / reload $20); expected and non-blocking. ~30–60 min.
```

---

## Archived session summaries

> Sessions 34–44 kept as one-liner tombstones. Full detail in `docs/session-archive.md` (or in session-blocks that are queued for eventual archive-drift cleanup).

- **Session 34** (2026-04-20) — Multi-booth scoping. Option A chosen, mockup approved, Q-001 Path B backup captured. Superseded by session 35.
- **Session 35** (2026-04-20) — Multi-booth rework shipped end-to-end + KI-006 resolved. Six-step QA walk passed.
- **Session 36** (2026-04-20) — Q-003 BottomNav badge resolved across four surfaces + KI-007 edit-page redirect loop fixed.
- **Session 37** (2026-04-20) — Sprint 4 tail closed: T4c confirmed done, T4b `<AddBoothInline>` folded into `/admin`, T4b `/admin/login` locked as Keep Dedicated, T4d runbook written.
- **Session 38** (2026-04-21) — Window Sprint scoping, four-frame mockup + build spec, three queued implementation sessions.
- **Session 39** (2026-04-21) — Q-004 rename + Q-005 tagline + Q-007 Window Sprint backend shipped. TS downlevelIteration rule promoted.
- **Sessions 40–41** (2026-04-21) — Q-007 client shipped + Q-007 + T4d QA walks both PASSED. Beta invites technically unblocked.
- **Session 42** (2026-04-21) — DB test-data wipe. Admin identity confirmed never drifted.
- **Session 43** (2026-04-21) — Anthropic model audit + billing auto-reload at $10/$20. Session-27 rule fired cleanly for the first time since promotion.
- **Session 44** (2026-04-22) — `/shelves` Add-a-Booth restored via `<AddBoothInline>` primitive (partial T4b reversal). Hero-photo field added. Chrome mismatch flagged.

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

*(Empty. As of sessions 40–41, both Q-007 Window Sprint and T4d pre-beta QA walk have passed. No code-level regressions. Beta invites remain technically unblocked after session 45.)*

### 🟡 Remaining pre-beta polish (operational, not code-gating)

- **Feed content seeding** — 10–15 real posts across 2–3 vendors. DB is empty and clean-slate safe. Natural pairing with beta invite prep. Session 44's `<AddBoothInline>` primitive + session 45's cross-mall fix + delete feature + claimed-vendor safety gate mean admin can now seed + iterate on booths directly from `/shelves` without touching Supabase. *Recommended as session 46.*
- **Error monitoring** (Sentry or structured logs). Sprint 3 carryover.
- **Beta feedback mechanism** (Tally.so link).
- **Hero image upload size guard** — verify coverage across upload surfaces.
- **Tech Rule promotion batch** — six candidates queued: (a) session-33 dependent-surface audit, (b) session-35 half-migration audit, (c) session-36 new-consumer-on-old-select audit, (d) session-38 verify-landing-surface-before-declaring-scope-closed, (e) session-40 React 19 ref-forwarding (one firing), (f) **session-45 Supabase nested-select explicit-columns** (one firing, NEW). Session-42 verify-remaining-count still below the two-firings-outside-same-context bar. ~40 min.
- **Design agent principle addition** — "When a second instance of a glyph/affordance is introduced, the reconciliation is part of the same scope, not a later cleanup." Session-45 retrospective. ~10 min docs only. Goes in `MASTER_PROMPT.md` Design Agent section.
- **Session-archive drift cleanup** — sessions 28–38 carry one-liners but no archive detail. Session 45's own block in this file is comprehensive enough that its eventual archive entry is a paste-over. Sessions 34–44 now all have the tombstone treatment. ~30 min batch to backfill archive detail for 28–38 + 44–45.
- **`/api/suggest` SDK migration or delta note** — session 43 confirmed this route is the only AI route still on raw `fetch` rather than the Anthropic SDK. Not beta-gating; reseller-intel only. Optional future cleanup.

### 🟡 Q-007 Window Sprint expansion (post-MVP)

All captured in `docs/queued-sessions.md`:
- **Q-008** 🟢 — Open share to unauthenticated shoppers (scope expansion). ~90–120 min.
- **Q-009** ✅ — Admin can share any booth (ownership bypass). **Shipped session 45.**
- **Q-010** ✅ — Window email CTA URL fix (`/vendor/` → `/shelf/`). Shipped session 41.
- **Q-011** 🟢 — Window email banner post-it placement (email-rendering bug). ~60–90 min.
- **Q-006** 🟡 — Deep-link CTA. Parked on Sprint 6+ Universal Links.

### 🟡 Session 35 non-gating follow-up

- **Q-002** 🟢 — Picker affordance placement revision (masthead → inline under hero banner). ~20 min.

### 🟡 Sprint 5 + design follow-ons

- **`/admin` v0.2 → v1.2 redesign pass** (session 37) — Posts tab, Banners tab, tab switcher, header, approval toast, diagnosis panel. Size L. Needs design scoping first (mockup-first per session-28 rule). ~2–3 sessions. **Session 45 note:** `/shelves` still has the session-44 chrome mismatch (v1.1k `<AddBoothInline>` primitive inside v0.2 Georgia + legacy `colors.*` surface). Same Sprint 5+ redesign that folds `/admin` should fold `/shelves`.
- **KI-005** — Pre-approval sign-in signaling gap. Batch with guest-user UX.
- **Typography reassessment** (session-32 deferral — IM Fell readability).
- **Post-approval booth-name edit surface** (session-32 deferral).
- `<MallSheet>` migration to `/vendor-request` (still deferred per v1.1k (h)).
- Nav Shelf decision + BottomNav full chrome rework.
- Guest-user UX parked items: "Sign in" → "Curator Sign In" rename, `/welcome` guest landing, PWA install onboarding, vendor onboarding Loom, bookmarks persistence.
- **PWA pull-to-refresh** — confirmed missing in session 41 Q-007 walk. Not a bug (browser default-gesture override in standalone PWA mode) — Sprint 5 polish, needs a `pulltorefreshjs`-class library or custom gesture handler tied to scroll position. Workaround is navigate-away-and-back.

### 🟢 Sprint 6+ (parked)

"Claim this booth," QR-code approval, **Universal Links (gating Q-006 deep-link CTA)**, native app eval, admin-cleanup tool (session 45 materially reduces the need — `/shelves` now covers the 80% case), feed pagination + search, ToS/privacy, mall vendor CTA, vendor directory, **Option B `vendor_memberships` migration**, **Direction A (link-share via native share sheet)** and **Direction C (PNG export / story-ready image)** share variants. Post-MVP: 3A sold landing state, Find Map saved-but-sold tile signal.

**Session 45 note on Direction A:** the BoothHero URL link-share bubble that was retired this session was essentially Direction A. If/when a URL-share capability is reintroduced (e.g. native share sheet with OG preview), it should land as a deliberate Design pass, not a quiet restoration of the retired bubble. The masthead airplane is the sole share affordance on Booth pages; a future URL-share primitive is a separate glyph/location decision.

### 🟢 Cleanup (not urgent)

- Deprecated functions in `lib/posts.ts` including session-35 `getVendorByUserId` shim.
- Cloudflare nameservers dormant (no cost).
- `docs/VENDOR_SETUP_EMAIL_TEMPLATE.md` (obsolete since T4a).
- `docs/design-system-v1.2-draft.md` (tombstone).
- `docs/mockups/add-find-sheet-v1-2.html`, `review-page-v1-2.html`, `edit-listing-v1-2.html` — partial retirement pending post-beta.
- `docs/mockups/email-v1-2.html` — updated session 39 rename sweep; keep as reference.
- `docs/mockups/share-booth-email-v1.html` — reference for Q-011 if post-it bug needs mockup diff.
- `docs/mockups/my-shelf-multi-booth-v1.html` — keep until Q-002 updates it.
- `docs/multi-booth-build-spec.md` — archived reference.
- `docs/share-booth-build-spec.md` — keep until Q-008/Q-011 ship (each references it). Q-009 shipped session 45 so its reference weight dropped.
- `components/ShelfGrid.tsx` (parked; zero callers).
- `/post` redirect shim — can delete post-beta.

---

## INVESTOR UPDATE SYSTEM

- Google Drive folder: `1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW`
- Cadence: end of each sprint (weekly once beta launches)
- Trigger: say "generate investor update" at session close
- Process doc: Notion → Agent System Operating Manual → 📋 Investor Update — Process & Cadence

> **Sprint 4 fully closed sessions 40–41; session 42 cleared DB test data; session 43 audited AI model surface + locked in billing safeguards; session 44 restored `/shelves` Add-a-Booth primitive; session 45 shipped the cross-mall fix + admin delete + Q-009 admin share bypass + retired the BoothHero URL share to resolve the two-airplane confusion. Next natural investor-update trigger point is after feed content seeding (session 46)** — the update would then honestly report the full pre-beta polish arc (sessions 42–46) as complete rather than partial.
