# Treehouse — Tech Rules Queue

> Register of candidate Tech Rules that have surfaced during sessions but not yet been promoted into [`docs/DECISION_GATE.md`](DECISION_GATE.md). One row per candidate. Update this file when a rule fires again or graduates.
>
> **Lifecycle:** Captured (1×) → Promotion-ready (2×) → Promoted (lives in DECISION_GATE.md OR a `feedback_*.md` memory file, removed from this queue). The 2× threshold is the soft promotion gate — a rule fires twice in independent sessions before earning the cost of a Tech Rule. Single firings stay queued indefinitely; not every captured pattern earns promotion.
>
> **Promotion destination depends on the rule's nature** — see [`feedback_tech_rule_promotion_destination.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_tech_rule_promotion_destination.md): operating-style rules → `feedback_*.md` memory file (auto-load); production-safety rules → `docs/DECISION_GATE.md ## The Tech Rules` (loaded conditionally); already-memorialized → mark ✅ Promoted-via-memory.
>
> **Why this register exists:** before session 59 this queue lived as a single ~1000-char paragraph in `CLAUDE.md` that rewrote every session a candidate fired. Moving to a table makes new firings a one-row edit instead of a CLAUDE.md prose rewrite. CLAUDE.md keeps a one-line pointer to this file.
>
> Maintained by Docs agent. CLAUDE.md links here from KNOWN GAPS → "Tech Rule promotion batch."

---

## Status legend

- 🟡 **Captured (1×)** — surfaced once, watching for a second firing.
- 🟢 **Promotion-ready (2×+)** — fired in two or more independent sessions; ready for the next promotion batch.
- ✅ **Promoted** — lives in `docs/DECISION_GATE.md` Tech Rules or in a `feedback_*.md` memory file. Kept in "Recently promoted" briefly for traceability, then archived.

---

## Active candidates

| ID | Rule | First fired | Last fired | Firings | Status |
|----|------|-------------|------------|---------|--------|
| TR-a | **Dependent-surface audit** — when a route or surface changes shape, grep every consumer before declaring scope closed. | Session 33 | Session 33 | 1× | 🟡 |
| TR-b | **Half-migration audit** — when a schema or model migration ships, walk every read AND every write path before declaring done. | Session 35 | Session 35 | 1× | 🟡 |
| TR-c | **New-consumer-on-old-select audit** — when a new consumer subscribes to an existing select/query, check that the select still returns what the new consumer needs. | Session 36 | Session 36 | 1× | 🟡 |
| TR-d | **Verify-landing-surface-before-declaring-scope-closed** — a feature isn't closed until the on-device landing surface has been walked. Code shipped ≠ feature shipped. | Session 38 | Session 38 | 1× | 🟡 |
| TR-e | **React 19 ref-forwarding** — `React.Ref<T>` not `RefObject<T \| null>` when forwarding `useRef<T \| null>(null)` through a typed prop. | Session 40 | Session 40 | 1× | 🟡 |
| TR-f | **Supabase nested-select explicit-columns** — when nesting a Supabase select into another table, name the columns explicitly. Implicit `*`-style nesting drops fields silently. | Session 45 | Session 45 | 1× | 🟡 |
| TR-g | **RLS-safety-net policy alongside `DISABLE ROW LEVEL SECURITY`** — any migration that disables RLS must also ship a service-role-only safety policy so anon reads never leak. | Session 48 | Session 48 | 1× | 🟡 |
| TR-h | **Gmail-hostile primitives list** — maintain a growing list of primitives stripped/filtered by Gmail/Outlook (currently: `position: absolute`, `position: relative` + `overflow: hidden` clipping, SVG `<rect>`/`<circle>` tracking-pixel-shaped children, CSS `transform: rotate`). Read this list before any email template change. | Session 52 | Session 52 | 1× | 🟡 |
| TR-i | **Capture-initial-schema-as-001-before-claiming-migrations-from-scratch** — when standing up a new environment, the first migration must capture the existing schema, not assume a clean slate. | Session 54 | Session 54 | 1× | 🟡 |
| TR-j | **Env-var checklist must enumerate every `NEXT_PUBLIC_*`** — a new-environment checklist that lists service-role secrets but not `NEXT_PUBLIC_*` values produces silently-broken client bundles. | Session 54 | Session 54 | 1× | 🟡 |
| TR-k | **New Supabase project must set Auth → URL Configuration before first magic link** — default Auth URL points at localhost; first magic link from a fresh project fails silently if not pre-configured. | Session 54 | Session 54 | 1× | 🟡 |
| TR-n | **Always force `vercel --prod` after routing/route-handler changes during prod QA** — GitHub→Vercel webhook lag + PWA cache compound; if you're QA-walking after a route-handler change, deploy explicitly rather than hoping the push triggered. | Session 58 | Session 58 | 1× | 🟡 |
| TR-o | **Multi-element-glyph strokeWidth=0 trap** — when swapping a single-path icon (Heart, Pin) for a multi-element glyph (e.g. FlagGlyph's `<line>` + `<path>`), drop the `strokeWidth={isSaved ? 0 : 1.7}` saved-state trick. Line elements vanish entirely at strokeWidth=0; you lose the pole. Differentiate saved/unsaved via color + fill only, keeping strokeWidth always >0. | Session 61 | Session 61 | 1× | 🟡 |
| TR-p | **Testbed-first for AI/LLM call unknowns in multi-file integrations** — when a feature's load-bearing risk is the accuracy/reliability of an AI/LLM call (vision, structured-output, classification), ship a standalone testbed page first that exercises ONLY that call, surfaces the response visibly on screen, and lets the user validate against real inputs BEFORE any production wiring exists. Saved an unknown number of debug cycles in session 62 — handwritten-tag validation in 1 round on a ~200-line testbed instead of after a ~600-line integration. Already captured as `feedback_testbed_first_for_ai_unknowns.md` memory. | Session 62 | Session 62 | 1× | 🟡 |
| TR-q | **`force-dynamic` does NOT propagate `cache: "no-store"` to inner fetches on Next.js + Vercel** — `export const dynamic = "force-dynamic"` disables caching of the route RESPONSE but does NOT extend to `fetch()` calls happening inside the route. Supabase clients (and any HTTP client wrapping native `fetch`) must opt out via the client's own fetch hook. For `@supabase/supabase-js`: pass `global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) }` to `createClient`. Without this, identical requests return cached responses indefinitely (~25–78 min observed on the R3 admin Events route). The data-cache lifetime is decoupled from function instance lifetime, so fresh deploys do not invalidate stale entries (which is what made this so hard to diagnose — session 60's stuck-instance theory was disproved by deploy-test, but the cache lived in a separate layer). Compounds with TR-l (Vercel-runtime PostgREST quirks): both rules are about subtle deviations between local and Vercel runtimes that identical-looking code reveals only under specific conditions. | Session 73 | Session 73 | 1× | 🟡 |
| TR-aa | **Match the canonical source's signal, not the convenient probe** — when building a diagnostic that's meant to pre-empt a 3rd-party advisor (Supabase Security Advisor, Sentry, Lighthouse), the diagnostic must check the same axis the advisor reads. A diagnostic that "feels" comprehensive without reading the same bit gives false confidence. Session 84: Supabase Advisor checks `pg_class.relrowsecurity`; the audit RPC `audit_rls_state()` reads it directly so the local diagnostic and the advisor stay in sync. Captured in [`docs/security-audit-runbook.md`](security-audit-runbook.md) §Operating principles #4. | Session 84 | Session 84 | 1× | 🟡 |
| TR-ab | **Both Supabase projects always (prod + staging) for security-side fixes** — prod and staging diverge silently if treated separately. Every Supabase-side security fix runs against both, with the diagnostic CLI arg making this a one-line mechanical step (`npx tsx scripts/security-audit/inspect-rls.ts staging`). Session 84: migration 014 was applied prod first, staging follow-up still pending. Captured in [`docs/security-audit-runbook.md`](security-audit-runbook.md) §Operating principles #6. | Session 84 | Session 84 | 1× | 🟡 |
| TR-ac | **Coverage drift in audit-tool expectations is itself a finding** — if a new public-schema table or Storage bucket exists in the database that's not in the diagnostic's expectation list, that's a 🟡 warning, not a silent skip. Coverage that drifts away from reality is worse than coverage that's missing — it gives false confidence. Session 84: the inspect-rls audit emits a "🟡 unexpected table" line if it encounters a public-schema table not in the known-tables list. Captured in [`docs/security-audit-runbook.md`](security-audit-runbook.md) §Operating principles #3. | Session 84 | Session 84 | 1× | 🟡 |
| TR-ad | **Idempotent security migrations only (safe to re-run)** — every security migration must be safe to re-run end-to-end. The dashboard SQL editor accepts a paste once; if a deploy is interrupted or partially applied, re-running the same file should land the rest cleanly. Use `IF EXISTS` / `IF NOT EXISTS` / `CREATE OR REPLACE` everywhere applicable. Session 84: migrations 014 + 015 follow this pattern. Captured in [`docs/security-audit-runbook.md`](security-audit-runbook.md) §Operating principles #5. | Session 84 | Session 84 | 1× | 🟡 |
| TR-ae | **Storage-layer bugs on iOS PWA are below the on-screen-diagnostic ceiling** — on-screen diagnostic pills work well for React-state and DB-layer bugs but cannot reach below React into browser/iOS lifecycle (BFCache, scroll-event-during-transition, storage-write timing). For those, only Safari Web Inspector via USB cable provides the necessary visibility. Session 85 burned 6 rounds patching speculatively at progressively deeper layers above the bug because the on-screen diagnostic could only show "saved is empty" — but the actual bug was bursts of zero-writes invisible to the React layer. Captured separately in [`reference_ios_safari_web_inspector.md`](../../.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/reference_ios_safari_web_inspector.md) memory. Sub-rule of TR-r (escalate to device-level visibility) but worth standalone capture for the specific iOS-PWA + storage-layer combination, which is project-shaping for a PWA-heavy product. | Session 85 | Session 85 | 1× | 🟡 |
| TR-af | **Hypothesis + diagnostic + fix in same commit cycle when confidence ≥80%** — when device-level visibility (Inspector, Sentry, etc.) reveals a bug at high confidence (≥80% on the root-cause story), ship the diagnostic AND the fix in the same commit cycle rather than a verify-then-fix two-cycle dance. Session 86: Inspector showed bursts of 5–8 zero-writes per cycle → 90% confidence on Next.js scroll-to-top firing real scroll events → shipped diagnostic (`console.warn` on zero-writes with stack trace) AND fix (`if (rounded <= 0) return`) in commit `0c53fb3` rather than waiting for another verify cycle. Compresses 2 cycles into 1. Inverse of TR-m + TR-r (which fire when confidence is low and visibility is needed before guessing); TR-af fires when visibility has already produced high-confidence root cause. | Session 86 | Session 86 | 1× | 🟡 |
| TR-ag | **Refuse-to-write-0 pattern (write-side filter on meaningless restore values)** — when a persistence primitive (scroll position, form-draft cache, etc.) has a "default state value" (0, empty string, null) that the storage layer would already restore to *implicitly* if storage were empty, refuse to write that default value at the write site rather than filter it at the read site. Reasons: (1) the write site is closer to the source of the meaningless value (a stray scroll-event-during-transition vs a synthetic absent-key restore); (2) read-side filtering still leaves the bug visible to debuggers (storage shows `key = 0`); (3) write-side filtering keeps storage clean. Session 86 fix: `app/my-shelf/page.tsx` `writeScrollY` adds `if (rounded <= 0) return` — empty storage already restores to 0, so 0 is a meaningless restore target. Project-specific scroll-restore primitive but the shape generalizes to any storage-restore primitive. | Session 86 | Session 86 | 1× | 🟡 |

**Total candidates:** 22 active · **0 promotion-ready (🟢)** · **22 at first firing (🟡):** TR-a, TR-b, TR-c, TR-d, TR-e, TR-f, TR-g, TR-h, TR-i, TR-j, TR-k, TR-n, TR-o, TR-p, TR-q, TR-aa, TR-ab, TR-ac, TR-ad, TR-ae, TR-af, TR-ag.

_Session 88 promotion batch landed: all 11 🟢 candidates promoted. 5 new memory files for operating-style rules (TR-r, TR-s, TR-v, TR-y, TR-z); 2 prose entries into `docs/DECISION_GATE.md ## The Tech Rules` for production-safety rules (TR-l, TR-w); 4 marked ✅ Promoted-via-memory because their `feedback_*.md` files already auto-load (TR-m, TR-t, TR-u, TR-x). TR-s firing count bumped to 10× (session 87 favicon-set-before-wordmark-swap split) before promotion. Queue now has 0 🟢 candidates — clean slate for the next promotion batch._

---

## Recently promoted (kept briefly for traceability)

| ID | Rule | Promoted in | Destination |
|----|------|-------------|-------------|
| TR-old-1 | **Email-template parity audit** | Session 57 | MASTER_PROMPT.md §Design Agent |
| TR-old-2 | **Commit design records in the same session** | Session 57 | MASTER_PROMPT.md §Design Agent |
| TR-old-3 | **Script-first over SQL-dump-first for Supabase fixes** | Session 57 | MASTER_PROMPT.md §Working Conventions |
| TR-l | **Vercel-runtime-vs-local divergence on identical Supabase queries** | Session 88 | `docs/DECISION_GATE.md` §The Tech Rules — "Vercel-runtime PostgREST divergence on identical Supabase queries" |
| TR-m | **Front-load visibility tooling on debug round 3** | Session 88 (✅ Promoted-via-memory) | [`feedback_visibility_tools_first.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_visibility_tools_first.md) |
| TR-r | **Cap speculative patching at 3 rounds + escalate to device-level visibility** | Session 88 | [`feedback_cap_speculative_patching_at_3_rounds.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_cap_speculative_patching_at_3_rounds.md) |
| TR-s | **Smallest→largest commit sequencing on multi-commit ships** (10× firings) | Session 88 | [`feedback_smallest_to_largest_commit_sequencing.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_smallest_to_largest_commit_sequencing.md) |
| TR-t | **Structural fix < accumulated patches when 3+ deploy-and-verify cycles fail** | Session 88 (✅ Promoted-via-memory) | [`feedback_kill_bug_class_after_3_patches.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_kill_bug_class_after_3_patches.md) |
| TR-u | **Mockup options span structural axes, not just style variants** | Session 88 (✅ Promoted-via-memory) | [`feedback_mockup_options_span_structural_axes.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_mockup_options_span_structural_axes.md) |
| TR-v | **Mid-session iPhone QA on Vercel preview shortens the redirect cycle** | Session 88 | [`feedback_mid_session_iphone_qa_on_vercel_preview.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_mid_session_iphone_qa_on_vercel_preview.md) |
| TR-w | **Lora needs `lineHeight: 1.4` minimum when overflow:hidden + ≤14px text + line-clamp** | Session 88 | `docs/DECISION_GATE.md` §The Tech Rules — "Lora lineHeight 1.4 minimum when clipped + ≤14px" |
| TR-x | **"We continue to run into this" / "Every time I see X" signals a system-level concern** | Session 88 (✅ Promoted-via-memory) | [`feedback_recurring_phrase_signals_system.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_recurring_phrase_signals_system.md) |
| TR-y | **User-facing copy scrub: skip DB / API / event / type identifiers** | Session 88 | [`feedback_user_facing_copy_scrub_skip_db_identifiers.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_user_facing_copy_scrub_skip_db_identifiers.md) |
| TR-z | **V2 mockup as fill-refinement within a picked option** | Session 88 | [`feedback_v2_mockup_as_fill_refinement.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_v2_mockup_as_fill_refinement.md) |

(After two sessions of stability, recently-promoted entries can drop off this table — they live in DECISION_GATE.md / MASTER_PROMPT.md / `feedback_*.md` as the source of truth.)

---

## How to update this file

**When a candidate fires again:**
1. Find its row.
2. Update `Last fired` to the new session number.
3. Increment `Firings` (1× → 2×).
4. Flip `Status` 🟡 → 🟢 if it crossed the 2× threshold.

**When a new candidate surfaces:**
1. Append a new row at the bottom of the active table with the next `TR-<letter>` ID.
2. CLAUDE.md's KNOWN GAPS line stays unchanged unless the total or promotion-ready count moves.

**When a candidate is promoted:**
1. Triage the destination per [`feedback_tech_rule_promotion_destination.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_tech_rule_promotion_destination.md): operating-style → memory file; production-safety → DECISION_GATE.md; already-memorialized → mark ✅ Promoted-via-memory.
2. Cut the row from the active table.
3. Add it to "Recently promoted" with the session number and destination.
4. Update CLAUDE.md's KNOWN GAPS one-liner if the totals shifted meaningfully.

**Soft rules:**
- Don't promote the lone-firing-but-feels-important ones until they actually fire twice. The two-firing gate is what makes Tech Rules earn their cost.
- A rule that hasn't fired in 10+ sessions is probably specific to a moment that won't repeat — consider closing it without promotion.
