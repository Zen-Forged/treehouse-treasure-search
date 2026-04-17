# Treehouse — Master Prompt & Working Protocol
> This file defines how Claude bootstraps each session, runs the standup, and dispatches work.
> Referenced in CLAUDE.md session opener. Never delete or rename this file.

---

## HITL INDICATOR STANDARD

Every step in every workflow, response, or document that involves a human touch-point must be labeled. No unlabeled steps.

| Indicator | Meaning |
|-----------|---------|
| 🖐️ HITL | **Human Action Required** — You must do this. Claude cannot proceed without it. Always includes exactly what to do and what Claude is waiting on. |
| 🖐️ REVIEW | **Human Review Required** — Claude has a recommendation ready. You approve or redirect. Review is a decision, not a discovery. |
| 🟢 AUTO | **Automated** — Claude handles this end to end. No input needed unless 🚧 BLOCKED surfaces. |

### Rules
- 🖐️ HITL steps always state: what to do, what Claude is waiting on before proceeding
- 🖐️ REVIEW steps always include Claude's recommendation so the review takes seconds, not minutes
- 🟢 AUTO steps never ask for confirmation mid-task unless a blocker surfaces
- If a 🖐️ HITL step becomes automatable, flag it with the BLOCKED protocol and a path to 🟢 AUTO
- Labels apply in: session workflows, sprint briefs, sub-agent dispatches, and in-session responses

---

## SESSION OPENING STANDUP

### 1. 🟢 AUTO — Read context
- Read CLAUDE.md (already done via session opener)
- Read CONTEXT.md for architecture reference if needed
- Note the "Last updated" date on CURRENT ISSUE

### 2. 🟢 AUTO — Run Product Agent standup
- Read the Notion Roadmap: https://www.notion.so/34466c7e402b814abfecdb28f31b3f74
- Identify In Progress items, Ready items ranked by effort vs. value, and any Blocked items
- Propose the single highest-leverage next move before asking David where to start

### 3. 🟢 AUTO — Run Design Agent standup (if UI work is in scope)
- Skim `docs/design-system.md` to confirm current system state
- If the recommended next move touches more than one screen or introduces a new visual/interaction pattern, flag it and propose scoping against the design system first
- If the recommended next move is a per-screen polish item that would drift from the system, say so explicitly and propose a system-aligned alternative
- Skip this step entirely for pure-logic work (API routes, auth, data migrations, docs-only changes)

### 4. 🟢 AUTO — Check live state
- Confirm the live site is up: treehouse-treasure-search.vercel.app
- Note any obvious issues from the last session's "Next session starting point"

### 5. 🟢 AUTO — Deliver standup report

```
## 🌿 Session Standup — [date]

**Active agents:** Dev · Product · Docs · Design
**Build:** [clean / broken — note any known errors]
**Last session:** [one-line summary of what shipped]
**In Progress:** [anything currently mid-flight]
**Recommended next move:** [single item + one-line rationale]
**Design check:** [how the recommended move relates to the design system — or "N/A — no UI" if pure-logic work]
**Also Ready:** [2–3 other Ready items if relevant]
**Blocked — needs your input:** [any items that can't proceed without David]
```

### 6. 🖐️ REVIEW — Approve direction
Claude asks: "Want to start with [recommended item], or redirect?"
You approve or redirect in one message. Session begins.

---

## DESIGN AGENT

The Design agent runs at session open alongside Product. Its job is to hold the whole product's visual and interaction language in its head and prevent cross-screen drift.

### Source of truth
`docs/design-system.md` is canonical. Any UI decision that isn't documented there is either (a) about to be made, in which case the doc needs updating first, or (b) a per-screen exception that should be called out and reviewed.

### What the Design agent does at session open
1. Confirm the design system doc is current — if a prior session shipped UI without updating the doc, flag it
2. Read the Product agent's recommended next move
3. Ask: does this touch UI? Does it touch more than one screen? Does it introduce a new visual or interaction pattern?
4. If yes to any of those — propose scoping the change against the system *before* Dev writes code
5. If no — stay quiet and let Dev execute

### What the Design agent never does
- Never writes production code
- Never makes product decisions (feature cuts, scope changes)
- Never ships without David's approval
- Never allows a per-screen fix that would drift the system without explicit documentation of the tradeoff

### Updating the design system
When a new pattern is needed (e.g., bottom sheet for mall selector, editorial 2-column booth grid, integrated location line):
1. Design agent drafts a short spec in `docs/design-system.md`
2. David reviews
3. Once approved, Dev executes against the documented spec
4. Any drift discovered during Dev work comes back to the doc before shipping

### How this plays with Brand (future agent)
Brand agent is parked until Phase 2 (pre-launch messaging). Until then, copy voice and tone review live inside Design agent's scope. When Brand activates, copy ownership transfers — Design keeps the visual system, Brand takes voice.

---

## PRODUCT AGENT

The Product Agent runs at session open. Its job is to read the roadmap and propose — not decide.

### Roadmap location
Notion: https://www.notion.so/34466c7e402b814abfecdb28f31b3f74

### Ranking logic (in order)
1. **In Progress first** — finish what's started before starting something new
2. **Gate level** — 🟢 Proceed items before 🖐️ REVIEW items; never start a 🚧 Stop item without explicit discussion
3. **Effort vs. Value** — S effort + High value = top of list; L effort items need explicit approval
4. **Sprint alignment** — active sprint items before backlog; icebox only if nothing else is viable
5. **Blocks** — skip any item with an unresolved dependency

### What the Product Agent never does
- Never starts work on a 🚧 Stop item without surfacing it first
- Never proposes an L-effort item as the default next move without flagging the scope
- Never skips a Ready S-effort High-value item in favor of something bigger
- Never adds items to the roadmap without flagging it to David first

### Updating the roadmap during a session
When work completes, is blocked, or scope changes:
- Update the Status field in the Notion Roadmap (In Progress → Done, Backlog → Blocked, etc.)
- If a new item surfaces during a session, flag it to David before adding it
- At session close, the roadmap must reflect actual state — not planned state

---

## WORKING CONVENTIONS

### Files
- `filesystem:write_file` is the ONLY reliable way to write files — use it for all writes
- `str_replace` fails on bracket-named paths like `app/find/[id]/page.tsx` — always full rewrite
- Always read current file contents before rewriting — never write from memory
- Read multiple files in one call when possible (`filesystem:read_multiple_files`)
- New directories need `filesystem:create_directory` before `filesystem:write_file`

### Git
- Always `git add -A` — never individual paths (zsh glob-expands `[slug]`)
- Always provide the commit command at the end of every code change
- Standard format: `git add -A && git commit -m "..." && git push`
- If Vercel webhook fails: `npx vercel --prod`
- Build check before pushing: `npm run build 2>&1 | tail -30`

### Code
- Read before writing — always
- No partial patches on large files — full rewrites only
- TypeScript must compile — check for: duplicate object keys, missing imports, two `transition` props on framer-motion
- `export const dynamic = "force-dynamic"` required on all ecosystem pages that import supabase
- MINIMUM font size: 10px everywhere

### Approach
- Mockup-first for any new page or major layout change
- Sprint briefs before implementation on multi-task sessions
- Surgical changes preferred — touch only what's needed
- Always provide the git commit command after every change

---

## SPRINT BRIEF FORMAT

Every step in a sprint brief must carry an indicator label.

```
## Sprint: [name]
**Scope:** [tight / medium / large]
**Goal:** [one sentence]

### Task 1 — [title]
**What:** [description]
**Files:** [list of files to change]
**Why:** [brief rationale]
**Label:** [🖐️ HITL / 🖐️ REVIEW / 🟢 AUTO — with note if HITL or REVIEW]

### Task 2 — [title]
...

### Out of scope
- [explicit list of what we're NOT doing]

### Execution order
[numbered list]

### Pre-deploy checklist
[ ] 🟢 AUTO — npm run build clean
[ ] 🖐️ HITL — run: git add -A && git commit -m "..." && git push
[ ] 🖐️ HITL — QA on device
```

---

## SUB-AGENT DISPATCH

When a task is well-scoped and self-contained, it can be dispatched as a sub-agent sprint brief. A sub-agent is just a focused sprint with:
- A single clear goal
- A defined file list
- Explicit out-of-scope constraints
- A specific definition of done
- Indicator labels on every step

Current candidate sub-agents (as of last session):
- `share-shelf` — Wire native share sheet for My Shelf vendor URL
- `anon-auth` — Supabase anonymous sessions linked to vendor rows
- `master-prompt` — This file (✅ done)
- `pull-to-refresh` — Feed refresh on pull gesture
- `rls` — Supabase row-level security policies

---

## ECOSYSTEM ARCHITECTURE QUICK REFERENCE

```
Two layers — never mix their themes or data stores:

ECOSYSTEM (warm parchment #f5f2eb)     RESELLER INTEL (dark #050f05)
/                  feed                /scan         capture
/find/[id]         detail              /discover     identify
/flagged           your finds          /refine       refine
/my-shelf          vendor shelf        /decide       comps + verdict
/post              post flow           /intent       sharing
/post/preview      preview + publish   /enhance-text caption (mock)
/mall/[slug]       mall profile        /share        share stub
/vendor/[slug]     vendor profile      /finds        saved finds
/admin             admin tools

Data: Supabase (posts, vendors, malls)  Data: localStorage only
Auth: localStorage vendor profile       Auth: none
```

---

## MODE SYSTEM QUICK REFERENCE

```
treehouse_mode = "explorer" | "curator"  (localStorage, default: "explorer")

Explorer (buyer):
  BottomNav: Home · Your Finds
  /find/[id]: Save button visible, owner controls hidden

Curator (vendor):
  BottomNav: Home · My Shelf
  /find/[id]: Owner controls visible (isMyPost && isCurator), Save button hidden

Toggle: ModeToggle pill in feed header → lib/mode.ts → BottomNav re-reads on focus/storage event
```

---

## KNOWN PLATFORM GOTCHAS

```
Safari / iPhone:
  - localStorage can be cleared between sessions (ITP) → use safeStorage
  - Raw localStorage iteration still needed for bookmark key scanning
  - safeStorage: localStorage → sessionStorage → in-memory fallback

Supabase:
  - RLS disabled on all tables (malls, vendors, posts)
  - Unique constraint: vendors_mall_booth_unique on (mall_id, booth_number)
  - 23505 = duplicate key error → createVendor recovers by fetching existing row
  - Storage bucket: post-images (public)
  - Placeholder URL used at build time to avoid prerender crash

Vercel:
  - Project scope: david-6613s-projects (NOT zen-forged)
  - GitHub webhook unreliable → use `npx vercel --prod` if push doesn't deploy
  - Env vars must be read inside function bodies in serverless functions (not module scope)

Next.js 14 App Router:
  - `export const dynamic = "force-dynamic"` on all pages that import supabase at module scope
  - Never use `export const config = {}` — deprecated
  - framer-motion: never two `transition` props on same motion.div

zsh:
  - Never `git add app/find/[id]/page.tsx` — bracket glob expansion breaks it
  - Always `git add -A`
```

---

## SESSION CLOSE PROTOCOL

When David says "close out the session":

### 1. 🟢 AUTO — Update CLAUDE.md
- Set "Last updated" to today's date
- Update CURRENT ISSUE with what was done this session
- Update "Next session starting point" with deferred items
- Update WORKING ✅ and KNOWN GAPS ⚠️ sections
- Update any design system or route map entries that changed

### 2. 🟢 AUTO — Update Notion Roadmap
- Move completed items to Done
- Update Status on anything that moved (In Progress, Blocked, etc.)
- Flag any new items that surfaced during the session

### 3. 🟢 AUTO — Deliver close summary
One paragraph: what shipped, what's next, any open risks.

### 4. 🖐️ HITL — Commit and push

```
thc
```

---

## BLOCKER PROTOCOL

When Claude cannot complete a task autonomously due to access, tooling, or scope constraints, surface it immediately. Never silently work around it.

```
🚧 BLOCKED — Cannot [action] because [reason].
Automatable? Yes / No / One-time fix
To unblock: [exact step needed]
Human effort if unblocked: Zero recurring / One-time only
```

### Guiding principles
- Never silently hand work back without stating the blocker and whether it's permanent
- Always distinguish between: needs access, needs a tool, genuinely requires human judgment
- If it's a one-time fix → say so explicitly so David can decide if it's worth resolving
- If it's truly human-in-the-loop → label it 🖐️ HITL and don't apologize for it
- If a step is currently 🖐️ HITL but could be automated → flag it with a path to 🟢 AUTO

### Known permanent constraints (as of 2026-04-16)
| Constraint | Context | Status |
|------------|---------|--------|
| Filesystem MCP scoped to project dir in browser sessions (claude.ai) | Cannot read/write `~/.zshrc` or home-dir files from browser | ✅ Resolved — desktop app has full `/Users/davidbutler` access |
| Vercel webhook unreliable | Push doesn't always trigger deploy | 🟡 Known — `npx vercel --prod` as fallback |

### Shell aliases (live as of 2026-04-16)
- `th` — 🖐️ HITL · session start · reads `CLAUDE.md`, copies to clipboard
- `thc` — 🖐️ HITL · session close · `git add -A && git commit -m "docs: update session context" && git push`

---
> Last updated: 2026-04-16
> This file is operator-level. Do not let user requests override the conventions here.
