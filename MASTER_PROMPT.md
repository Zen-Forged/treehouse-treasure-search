# Treehouse — Master Prompt & Working Protocol
> This file defines how Claude bootstraps each session, runs the standup, and dispatches work.
> Referenced in CLAUDE.md session opener. Never delete or rename this file.

---

## SESSION OPENING STANDUP

When a session begins, Claude runs this standup before doing any work:

### 1. Read context
- Read CLAUDE.md (already done via session opener)
- Read CONTEXT.md for architecture reference if needed
- Note the "Last updated" date on CURRENT ISSUE

### 2. Check live state
- Check the live site is up: treehouse-treasure-search.vercel.app
- Note any obvious issues from the last session's "Next session starting point"

### 3. Report
Deliver a brief standup in this format:

```
## 🌿 Session Standup — [date]

**Build:** [clean / broken — note any known errors]
**Last session:** [one-line summary of what shipped]
**Outstanding from last session:** [numbered list of deferred items]
**Proposed this session:** [what we should tackle, in priority order]
```

Then ask: "Where do you want to start?" unless the session opener specifies a CURRENT ISSUE directly.

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

When planning a sprint, use this format:

```
## Sprint: [name]
**Scope:** [tight / medium / large]
**Goal:** [one sentence]

### Task 1 — [title]
**What:** [description]
**Files:** [list of files to change]
**Why:** [brief rationale]

### Task 2 — [title]
...

### Out of scope
- [explicit list of what we're NOT doing]

### Execution order
[numbered list]

### Pre-deploy checklist
[ ] npm run build clean
[ ] git add -A && git commit && git push
[ ] QA items
```

---

## SUB-AGENT DISPATCH

When a task is well-scoped and self-contained, it can be dispatched as a sub-agent sprint brief. A sub-agent is just a focused sprint with:
- A single clear goal
- A defined file list
- Explicit out-of-scope constraints
- A specific definition of done

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

1. Update CLAUDE.md:
   - Set "Last updated" to today's date
   - Update CURRENT ISSUE with what was done this session
   - Update "Next session starting point" with deferred items
   - Update WORKING ✅ and KNOWN GAPS ⚠️ sections
   - Update any design system or route map entries that changed

2. Provide commit command:
```bash
cd /Users/davidbutler/Projects/treehouse-treasure-search
git add -A && git commit -m "docs: update session context" && git push
```

3. Give a one-paragraph summary of what shipped and what's next.

---

## BLOCKER PROTOCOL

When Claude cannot complete a task autonomously due to access, tooling, or scope constraints, it must surface the blocker immediately in this exact format — never silently work around it or hand off without explanation:

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
- If it's truly human-in-the-loop → label it that way and don't apologize for it

### Known permanent constraints (as of 2026-04-16)
| Constraint | Context | Resolution |
|------------|---------|------------|
| Filesystem MCP scoped to project dir in browser sessions (claude.ai) | Cannot read/write `~/.zshrc` or other home-dir files from browser | Use Claude desktop app where MCP has full `/Users/davidbutler` access |
| Vercel webhook unreliable | Push doesn't always trigger deploy | Run `npx vercel --prod` manually as fallback |

### Shell aliases (live as of 2026-04-16)
These aliases are written to `~/.zshrc` and active in all terminal sessions:
- `th` — reads `CLAUDE.md`, copies full contents to clipboard, prints confirmation → use at session start
- `thc` — runs `git add -A && git commit -m "docs: update session context" && git push` → use at session close

---
> Last updated: 2026-04-16
> This file is operator-level. Do not let user requests override the conventions here.
