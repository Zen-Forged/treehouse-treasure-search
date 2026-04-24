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

## ✅ Session 52 (2026-04-24) — Q-011 shipped in 4 iterations: v2→v2.1→v3→v4 (simplification arc)

Long iteration session. Four commits landed; four mockup artifacts produced; Q-011 scope expanded + collapsed twice. Started as "execute session-51 mockup v2.2" and ended somewhere much simpler after two Gmail-hostility discoveries and a David-driven content pivot. **Every iteration was mockup-mediated before code touched disk** — the session-28 rule worked exactly as intended, at speed, four times. Zero on-device QA yet; that's session 53.

**Commits landed (chronological):**

1. `5c21b90` **feat(Q-011): Window email v2 banner redesign per mockup v2.2** — first-pass execution of session-51 approved mockup. SMALL masthead (13px uppercase Georgia 600 + 10px italic tagline) + universal `"You've received a personal invite."` opener + IM Fell Google Fonts `<link>` + IM Fell 32px vendor name + `/shelf`-matching PinGlyph SVG replacing `⦲` + `senderMode` retired from the email template (server still uses it for rate-limit buckets). Post-it moved from inline SVG to styled div with `position: absolute` inside a `position: relative` + `overflow: hidden` banner wrapper. Build clean, shipped.
2. `efbf222` **fix(Q-011): Gmail strips position:absolute — refactor post-it to negative-margin overlay** — David's on-device QA caught it immediately. Gmail web = post-it invisible (position stripped, then clipped by `overflow: hidden`). iOS Gmail = post-it flowed below the banner (position stripped, natural position is below the image). Refactored to the v1 negative-margin overlay pattern: post-it sibling of banner, `display: inline-block` + `text-align: right` wrapper, `margin-top: -108px` pull-up. Pin moved from `position: absolute; top: -3px` to `margin: -16px auto 8px` (negative margin-top cancels parent padding and pokes above the edge). No `position` declarations anywhere in the subtree.
3. `1abcba2` **feat(Q-011): v3 info bar pivot — retire post-it from email, unify banner + mall** — commit 2 also failed Gmail QA. David concluded the gesture is fighting the medium and proposed a hand-sketched pivot (`IMG_2068.HEIC`): kill the overlap, put the booth number in a **two-cell info bar below the banner**, paired with mall name + address in the second cell. v3 mockup at `docs/mockups/share-booth-email-v3.html` with three variants (A attached, B separate paper-wash card, C minimalist); David picked **A + 32% booth cell + "BOOTH" uppercase eyebrow**. Shipped. `renderPostItDiv` + `renderLocationLine` + the `POSTIT` constant all deleted — no remaining callers. Pure HTML `<table>` + block `<div>` — the most forgiving email primitives; renders identically in every mail client since 2005. Semantic improvement: "this booth is at that mall" becomes one primitive instead of two.
4. `d9279e9` **feat(Q-011): v4 simplified button-forward — masthead retired, CTA elevated** — v3 rendered correctly but David flagged the email was still text-heavy and the primary CTA was buried at the bottom after the full tile grid. v4 goal shift: from "make it render" to "make it convert." v4 mockup at `docs/mockups/share-booth-email-v4.html` with three frames (v4 pill, v4 full-width, v3 reference); David picked **full-width button + preheader aligned with opener + subject aligned with new voice**. Four simplification moves: (a) shell masthead deleted entirely — sender envelope already identifies the brand, (b) opener collapses from two blocks to one phrase "You've received a personal invite to explore" flowing into the vendor name as its grammatical object, IM Fell 32→34px, (c) button moves up to directly under the banner + info bar, full-width green block (10px radius, Georgia 600 16px, "Explore the booth"), (d) closer block + "THE WINDOW" eyebrow deleted. Subject + preheader + opener now all share the phrase `"A personal invite to explore {vendor}"` for full narrative unity inbox-scan → preview → body. The word "Window" retires from user-facing copy (stays in internal identifiers only: `sendBoothWindow`, `ShareBoothWindowPayload`, the QA walk doc).

**Mockup artifacts produced this session:**

- `docs/mockups/share-booth-email-v3.html` (new) — info bar pivot, 3 variants
- `docs/mockups/share-booth-email-v4.html` (new) — simplified button-forward, 3 frames including v3 before/after
- `docs/mockups/share-booth-email-v2.html` (from session 51) — superseded twice but kept as design-history reference

**Build spec addendums written (all in one commit arc via the v4 file):**

- `docs/share-booth-build-spec.md` now has v2 + v3 + v4 addendums stacked. v4 supersedes v3 for shell masthead + opener + closer + Window eyebrow + button copy + subject + preheader; v3 supersedes v2 for banner + post-it + location-line. Banner + info bar + tile grid internals are v3-locked and unchanged in v4.

**Key hard-won tech fact (discovered live in session 52, NOT in prior memory):**

- **Gmail strips `position: absolute` from inline styles — both web and iOS.** This is stronger than the session-51 SVG-filtering discovery (which only affected `<rect>` / `<circle>` as tracking-pixel defense). `position: absolute` stripping means ANY overlap-style primitive fights Gmail at a fundamental layout-engine level. v2.0 and v2.1 both died on this; v3's pivot to pure HTML `<table>` + block `<div>` sidestepped it entirely. Documented in `lib/email.ts` file header comments. Candidate for `MASTER_PROMPT.md` KNOWN PLATFORM GOTCHAS section — not added this session (docs pass, separate scope).

**Tech Rule candidates queued (naming only, not promoted this session):**

- **Email template parity audit** (session 51 carryover + second firing here — v2→v3 pivot surfaced more drift). Same root: `lib/email.ts` drifted silently because email QA wasn't running. Promotion-threshold now reached (two firings in successive sessions).
- **NEW: Gmail-hostile primitives list** — candidate Tech Rule for DECISION_GATE or MASTER_PROMPT. Running list: `position: absolute`, `position: relative` with `overflow: hidden` clipping, SVG `<rect>`/`<circle>` as post-it-style shapes, CSS `transform: rotate` (stripped by Outlook — graceful degradation only). Useful for any future email work.

**QA hold: Q-011 v4 deployment NOT yet verified on device.** Session 53 opener. All four clients: Gmail web + iOS Gmail (proven failure clients), then iOS Mail + Apple Mail (baseline). v3 already passed Gmail QA mid-session but v4's shell + opener + button changes need a fresh walk.

---

## Archived: Session 51 tombstone

- **Session 51** (2026-04-24) — Q-008 shopper-share QA walk PASSED 5/5 scenarios on device (Q-008 QA hold retired). Q-011 scoped as a Design session rather than a patch; first-pass code attempt reverted after David called mockup-first and v2 mockup review surfaced 4-axis brand drift beyond the original SVG-stripping diagnosis (post-it proportions, wrong pin glyph, vendor name font). v2.2 mockup locked at `docs/mockups/share-booth-email-v2.html`. Zero commits. Email template parity audit Tech Rule candidate queued (first firing).

---


## CURRENT ISSUE
> Last updated: 2026-04-24 (session 52 close — Q-011 shipped in 4 iterations, v4 pending on-device QA)

**Status:** `d9279e9` on main. Four commits landed session 52 — all Q-011 iterations culminating in v4 (`feat(Q-011): v4 simplified button-forward — masthead retired, CTA elevated`). Zero on-device QA yet; session 53 opens with that walk. DB clean-slate persists; beta invites remain technically unblocked. Vercel CLI still not globally installed on David's machine — workaround `npx vercel@latest --prod` still standing.

### 🚧 Queued for session 53 — Q-011 v4 on-device QA walk (~30–45 min)

Send a Window (via `/my-shelf` masthead airplane OR `/shelf/[slug]` public airplane) to each mail client and verify:

**Primary failure clients (the ones v2.0 + v2.1 died on — re-test these first):**
- [ ] Gmail web — banner renders as one rounded unit with image on top and 2-cell info bar below (no floating orphan booth number, no broken SVG artifacts). Full-width green button sits directly below the info bar. Tile grid below the button.
- [ ] iOS Gmail — same.

**Baseline clients (were passing v1/v2 already, should still pass):**
- [ ] iOS Mail
- [ ] Apple Mail (macOS desktop)

**v4-specific checks beyond v3:**
- [ ] Email opens WITHOUT a brand masthead — body starts directly with italic invite line
- [ ] Invite line + vendor name read as one phrase ("You've received a personal invite to explore" → "Kentucky Treehouse")
- [ ] Button copy reads "Explore the booth"
- [ ] Tile grid has NO "THE WINDOW" eyebrow — tiles stand naked under the button
- [ ] No orphan closer text at the end — tiles → footer hairline → "You're receiving this..." footer
- [ ] Subject line reads `A personal invite to explore {vendor}`
- [ ] Inbox preview shows `A personal invite to explore {vendor}.`

**Graceful degradation check:**
- [ ] Outlook web — accept that `border-radius` on the banner wrapper + button may not render (Outlook ignores on `div`); content still legible, button still clickable.

**If QA PASSes:** close Q-011 loop, move to session 54 scope — Ladder B (branch-based staging + CI workflow + package scripts + staging Supabase project + `docs/beta-plan.md`) followed by Supabase MCP wiring. Both still deferred since session 51.

**If QA FAILs:** iterate with fresh mockup if the fix is > a one-line tweak (session-28 rule). All four iterations this session confirmed mockup-first works at speed — don't regress to direct-edit debugging.

### Alternative next sessions (if David wants to redirect from QA)

- **Ladder B — ops/infra sprint** (~2–3 hours, session 51 design) — branch-based staging, CI workflow, staging Supabase project, `docs/beta-plan.md`. Recommended BEFORE beta invites go out; cost compounds with each vendor added. Design discussion still only captured in session-51 chat, not docs.
- **Feed content seeding** (~30–60 min) — carried forward sessions 44–52. DB clean-slate persists. Good once Q-011 QA closes and Ladder B staging exists.
- **Q-002** 🟢 (~20 min) — Picker affordance placement revision.
- **Tech Rule promotion batch** (~40 min) — **ten candidates now queued** (session-52 adds "Gmail-hostile primitives list" — NEW, first firing; "email template parity audit" hit its second firing this session and is promotion-ready). Plus session-46 script-first rule (also promotion-ready since session 48).
- **Session-archive drift cleanup** (~30 min) — sessions 28–38 + 44–51 one-liner only; session-52 block is paste-over-ready after the session-53 close replaces it here.
- **Design agent principle addition** (~10 min, docs only) — "reconciliation of a second glyph/affordance is part of the same scope." `MASTER_PROMPT.md` Design Agent section (session-45 retrospective).
- **MASTER_PROMPT.md KNOWN PLATFORM GOTCHAS update** (~10 min, docs only) — add the session-52 hard-won "Gmail strips `position: absolute` from inline styles (web + iOS); any overlap primitive will die on Gmail" fact alongside existing Safari/ITP, Supabase RLS, Vercel, Next.js 14 gotchas.
- **`/admin` UI `auth.users` delete reliability spike** (~20–30 min).
- **Error monitoring** (Sentry or structured logs). Sprint 3 carryover.
- **Beta feedback mechanism** (Tally.so link).

### Session 53 opener (pre-filled — Q-011 v4 QA walk)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Q-011 v4 on-device QA walk per the CLAUDE.md checklist. `d9279e9` is on main; Vercel should be serving the v4 build. Send a Window from /my-shelf OR /shelf/[slug] to Gmail web + iOS Gmail first (the proven failure clients), then iOS Mail + Apple Mail for baseline. Check list is 10 items — masthead absence, invite line + vendor name flow, banner + info bar render (no orphan booth number, no broken SVG), full-width "Explore the booth" button under info bar, no "THE WINDOW" eyebrow, tiles naked, subject + preheader match the new voice. If PASS, close Q-011 loop and move to Ladder B (staging branch + CI + scripts + beta plan + Supabase MCP wiring — design lives in session-51 chat, still uncommitted). If FAIL and the fix is > a one-line tweak, iterate via fresh mockup first (session-28 rule confirmed 4× this session).
```

---

## Archived session summaries

> Sessions 34–46 kept as one-liner tombstones. Full detail in `docs/session-archive.md` (or in session-blocks that are queued for eventual archive-drift cleanup).

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
- **Session 45** (2026-04-22) — `/shelves` cross-mall fix + admin booth delete primitive + Q-009 admin Window share bypass + BoothHero URL-share airplane retired (two-airplane cleanup). Four shipments, three commits, all on-device walks passed. Session-45 Supabase nested-select explicit-columns Tech Rule candidate queued (one firing).
- **Session 46** (2026-04-22) — T4d pre-beta QA walk re-passed end-to-end (all five exit criteria clean) + `scripts/qa-walk.ts` QA utility shipped + `docs/pre-beta-qa-walk.md` hero-photo step drift patched + `/session-open` + `/session-close` slash commands added to standardize the Chat→Code workflow. First Claude Code session after 45 in Claude Chat.
- **Session 47** (2026-04-23) — Vendor onboarding hero image gap fixed: `proof_image_url` now transfers to `vendors.hero_image_url` on approval (3 edits + safe-claim path backfill in `app/api/admin/vendor-requests/route.ts`). My Shelf banner no longer blank after sign-in. Forward-only fix; no migration.
- **Session 48** (2026-04-23) — Featured banner RLS drift fixed across Home + Find Map + `/admin` Banners preview. Migration 008 + `scripts/inspect-banners.ts` diagnostic. HITL: David pasted SQL into Supabase editor; anon reads confirmed restored.
- **Session 49** (2026-04-23) — Booths page full v1.2 redesign (2-column grid, StickyMasthead, mall grouping). QR code added to share sheet with logo overlay; confirmed scanning on device. Copy polish: "Invite someone in to" header, "Send the invite" CTA, "Request Digital Booth" green pill on home, "Vendor Sign in" on login.
- **Session 50** (2026-04-23) — Q-008 shopper Window share shipped (`/api/share-booth` branches on Authorization header; anon = 2/10min + no ownership + no sender voice; auth path + Q-009 admin bypass unchanged). Guest edit-pencil hole closed: `signOut()` clears `LOCAL_VENDOR_KEY`, `detectOwnershipAsync` requires a session, Find Detail subscribes to `onAuthChange`. One commit `0d30fa0`; QA walk deferred; verified clean session 51 — 5/5 scenarios PASSED.

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

*(Empty. T4d pre-beta QA walk re-passed session 46 end-to-end — all five exit criteria clean. Q-007 Window Sprint also remains passed per sessions 40–41. Featured banner reads restored session 48. Q-008 shopper share shipped session 50 (QA walk deferred to session 51, but non-gating — code is landed and the walk is verification not revision). No code-level regressions. Beta invites remain technically unblocked after session 50.)*

### 🟡 Remaining pre-beta polish (operational, not code-gating)

- **Feed content seeding** — 10–15 real posts across 2–3 vendors. DB is clean-slate after session-46 post-walk cleanup. Natural pairing with beta invite prep. Session 44's `<AddBoothInline>` primitive + session 45's cross-mall fix + delete feature + claimed-vendor safety gate mean admin can now seed + iterate on booths directly from `/shelves` without touching Supabase. Session 46 re-confirmed the onboarding path end-to-end. Session 48 restored Home Featured Find + Find Map hero banner reads, so a populated feed will render with full chrome. *Recommended as session 49.*
- **Error monitoring** (Sentry or structured logs). Sprint 3 carryover.
- **Beta feedback mechanism** (Tally.so link).
- **Hero image upload size guard** — verify coverage across upload surfaces.
- **Tech Rule promotion batch** — ten candidates queued, two promotion-ready: (a) session-33 dependent-surface audit, (b) session-35 half-migration audit, (c) session-36 new-consumer-on-old-select audit, (d) session-38 verify-landing-surface-before-declaring-scope-closed, (e) session-40 React 19 ref-forwarding (one firing), (f) session-45 Supabase nested-select explicit-columns (one firing), (g) **session-46 script-first over SQL-dump-first in Claude Code — second firing session 48 (promotion-ready)**, meta-workflow rule, may belong in `MASTER_PROMPT.md`, (h) **session-48 RLS-safety-net policy alongside any `DISABLE ROW LEVEL SECURITY`** (one firing), (i) **session-51 email template parity audit — second firing session 52 (promotion-ready)**, belongs in `MASTER_PROMPT.md` under Design Agent or a new Docs Agent section, (j) **session-52 Gmail-hostile primitives list** — NEW, first firing. Running list: `position: absolute`, `position: relative` with `overflow: hidden` clipping, SVG `<rect>`/`<circle>` tracking-pixel-shaped children, CSS `transform: rotate` (stripped by Outlook). Belongs in `MASTER_PROMPT.md` KNOWN PLATFORM GOTCHAS. Session-42 verify-remaining-count still below the two-firings-outside-same-context bar. ~40 min.
- **Design agent principle addition** — "When a second instance of a glyph/affordance is introduced, the reconciliation is part of the same scope, not a later cleanup." Session-45 retrospective. ~10 min docs only. Goes in `MASTER_PROMPT.md` Design Agent section.
- **Session-archive drift cleanup** — sessions 28–38 carry one-liners but no archive detail; sessions 44–50 now also tombstone-only in this file. Session-51 tombstone added this session; session-52 block is paste-over-ready until the session-53 close replaces it here. ~30 min batch to backfill archive detail for 28–38 + 44–51 from tombstones + git log.
- **`/api/suggest` SDK migration or delta note** — session 43 confirmed this route is the only AI route still on raw `fetch` rather than the Anthropic SDK. Not beta-gating; reseller-intel only. Optional future cleanup.
- **`/admin` UI `auth.users` delete reliability** — session 46 observed that David's UI-driven delete of Ella's auth user didn't stick (row persisted until force-deleted via admin API). Not blocking; worth investigating if it recurs. ~20–30 min spike.

### 🟡 Q-007 Window Sprint expansion (post-MVP)

All captured in `docs/queued-sessions.md`:
- **Q-008** ✅ — Open share to unauthenticated shoppers. **Shipped session 50; QA walk PASSED session 51.**
- **Q-009** ✅ — Admin can share any booth (ownership bypass). **Shipped session 45.**
- **Q-010** ✅ — Window email CTA URL fix (`/vendor/` → `/shelf/`). Shipped session 41.
- **Q-011** 🟡 — Window email redesign. **Shipped session 52 over four iterations (`5c21b90` → `efbf222` → `1abcba2` → `d9279e9`).** Final state (v4): shell masthead retired, one-line opener flowing into IM Fell 34px vendor name, banner + attached 2-cell info bar (BOOTH numeral + mall name/address), full-width "Explore the booth" button directly under info bar, tile grid naked without eyebrow, footer. Subject + preheader + opener all share the phrase "A personal invite to explore {vendor}". Word "Window" retired from user-facing copy (stays in internal identifiers only). **QA walk queued for session 53** — Gmail web + iOS Gmail were the proven failure clients through v2.0 / v2.1 (both died on `position: absolute` stripping); v3's pivot to pure-table primitives solved that, v4 adds simplification + button elevation on top.
- **Q-006** 🟡 — Deep-link CTA. Parked on Sprint 6+ Universal Links.

### 🟡 Session 35 non-gating follow-up

- **Q-002** 🟢 — Picker affordance placement revision (masthead → inline under hero banner). ~20 min.

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

"Claim this booth," QR-code approval, **Universal Links (gating Q-006 deep-link CTA)**, native app eval, admin-cleanup tool (session 45 materially reduces the need — `/shelves` now covers the 80% case), feed pagination + search, ToS/privacy, mall vendor CTA, vendor directory, **Option B `vendor_memberships` migration**, **Direction A (link-share via native share sheet)** and **Direction C (PNG export / story-ready image)** share variants. Post-MVP: 3A sold landing state, Find Map saved-but-sold tile signal.

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
- `docs/mockups/share-booth-email-v4.html` — current v4 mockup. Keep while Q-011 QA walk is outstanding; if on-device passes cleanly, it becomes design-history.
- `docs/mockups/my-shelf-multi-booth-v1.html` — keep until Q-002 updates it.
- `docs/multi-booth-build-spec.md` — archived reference.
- `docs/share-booth-build-spec.md` — now carries v2 + v3 + v4 addendums stacked. Keep through Q-011 QA walk. Post-QA, candidate for consolidation (the three addendums are easier to read merged than stacked).
- `components/ShelfGrid.tsx` (parked; zero callers).
- `/post` redirect shim — can delete post-beta.

---

## INVESTOR UPDATE SYSTEM

- Google Drive folder: `1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW`
- Cadence: end of each sprint (weekly once beta launches)
- Trigger: say "generate investor update" at session close
- Process doc: Notion → Agent System Operating Manual → 📋 Investor Update — Process & Cadence

> **Sprint 4 fully closed sessions 40–41; session 42 cleared DB test data; session 43 audited AI model surface + locked in billing safeguards; session 44 restored `/shelves` Add-a-Booth primitive; session 45 shipped the cross-mall fix + admin delete + Q-009 admin share bypass; session 46 re-passed T4d QA walk + qa-walk.ts script; session 47 fixed vendor onboarding hero image gap; session 48 fixed featured-banner RLS drift; session 49 shipped /shelves v1.2 redesign + QR code share + copy polish; session 50 shipped Q-008 shopper Window share + guest edit-pencil fix; session 51 PASSED Q-008 QA walk 5/5 + scoped Q-011 as Design session; session 52 shipped Q-011 in 4 iterations — four commits, four mockups, scope pivoted twice (info bar + button-forward simplification). Next natural investor-update trigger point is after Q-011 v4 on-device QA walk passes + feed content seeding + Ladder B staging lands (sessions 53–55)** — the update would then honestly report the full pre-beta polish arc (sessions 42–55) as complete rather than partial.
