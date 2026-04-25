# Treehouse — Tech Rules Queue

> Register of candidate Tech Rules that have surfaced during sessions but not yet been promoted into [`docs/DECISION_GATE.md`](DECISION_GATE.md). One row per candidate. Update this file when a rule fires again or graduates.
>
> **Lifecycle:** Captured (1×) → Promotion-ready (2×) → Promoted (lives in DECISION_GATE.md, removed from this queue). The 2× threshold is the soft promotion gate — a rule fires twice in independent sessions before earning the cost of a Tech Rule. Single firings stay queued indefinitely; not every captured pattern earns promotion.
>
> **Why this register exists:** before session 59 this queue lived as a single ~1000-char paragraph in `CLAUDE.md` that rewrote every session a candidate fired. Moving to a table makes new firings a one-row edit instead of a CLAUDE.md prose rewrite. CLAUDE.md keeps a one-line pointer to this file.
>
> Maintained by Docs agent. CLAUDE.md links here from KNOWN GAPS → "Tech Rule promotion batch."

---

## Status legend

- 🟡 **Captured (1×)** — surfaced once, watching for a second firing.
- 🟢 **Promotion-ready (2×+)** — fired in two or more independent sessions; ready for the next promotion batch.
- ✅ **Promoted** — lives in `docs/DECISION_GATE.md` Tech Rules. Kept here briefly for traceability, then archived.

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
| TR-l | **Vercel-runtime-vs-local PostgREST quirks** — when local-vs-Vercel diverge on identical Supabase queries, suspect Vercel runtime/build cache before query syntax. Deploy a known-good fallback pattern (`.or()`) rather than the textbook-correct one (`.eq()`) if behavior diverges. | Session 58 | Session 58 | 1× | 🟡 |
| TR-m | **Front-load visibility tooling on debug round 3** — when prod QA bugs aren't isolated by the second test cycle, build debug toasts + server logs + diagnostic scripts before continuing to guess. Already captured as `feedback_visibility_tools_first.md` memory. | Session 58 | Session 59 | 2× | 🟢 |
| TR-n | **Always force `vercel --prod` after routing/route-handler changes during prod QA** — GitHub→Vercel webhook lag + PWA cache compound; if you're QA-walking after a route-handler change, deploy explicitly rather than hoping the push triggered. | Session 58 | Session 58 | 1× | 🟡 |

**Total candidates:** 14 active · **1 promotion-ready (TR-m)** · 13 at first firing.

---

## Recently promoted (kept briefly for traceability)

| ID | Rule | Promoted in | DECISION_GATE.md anchor |
|----|------|-------------|-------------------------|
| TR-old-1 | **Email-template parity audit** | Session 57 | MASTER_PROMPT.md §Design Agent |
| TR-old-2 | **Commit design records in the same session** | Session 57 | MASTER_PROMPT.md §Design Agent |
| TR-old-3 | **Script-first over SQL-dump-first for Supabase fixes** | Session 57 | MASTER_PROMPT.md §Working Conventions |

(After two sessions of stability, recently-promoted entries can drop off this table — they live in DECISION_GATE.md / MASTER_PROMPT.md as the source of truth.)

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
1. Cut the row from the active table.
2. Add it to "Recently promoted" with the session number and DECISION_GATE.md anchor.
3. Update CLAUDE.md's KNOWN GAPS one-liner if the totals shifted meaningfully.

**Soft rules:**
- Don't promote the lone-firing-but-feels-important ones until they actually fire twice. The two-firing gate is what makes Tech Rules earn their cost.
- A rule that hasn't fired in 10+ sessions is probably specific to a moment that won't repeat — consider closing it without promotion.
