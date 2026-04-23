# Session Open

Run the full Treehouse Finds session-opening standup per `MASTER_PROMPT.md`.

## Usage

`/session-open [optional: what you want to work on]`

Examples:
- `/session-open` → run the standup cold, recommend a next move based on CLAUDE.md
- `/session-open feed content seeding` → run the standup with that scope in mind

## What to do

1. **Read the canonical docs (in this order):**
   - `MEMORY.md` index (loads automatically but call it out explicitly for recall)
   - `CLAUDE.md` — especially the most recent session block + CURRENT ISSUE
   - `MASTER_PROMPT.md` §SESSION OPENING STANDUP
   - `docs/DECISION_GATE.md` — only if the recommended next move touches production data, auth, or brand voice (otherwise skip)

2. **Check live state:**
   - `git status` + `git log --oneline -5` — what's uncommitted, what's recent
   - If on a worktree, note the branch name and whether it's merged to `main` yet

3. **Run the standup report per MASTER_PROMPT.md step 5:**
   ```
   ## 🌿 Session Standup — [date]

   **Active agents:** Dev · Product · Docs · Design
   **Build:** [clean / broken]
   **Last session:** [one-line summary from CLAUDE.md]
   **In Progress:** [anything mid-flight]
   **Recommended next move:** [single item + one-line rationale]
   **Design check:** [how the recommended move relates to the design system — or "N/A — no UI"]
   **Also Ready:** [2–3 other Ready items]
   **Blocked — needs your input:** [anything that can't proceed without David]
   ```

4. **Ask for approval** (MASTER_PROMPT.md step 6):
   > "Want to start with [recommended item], or redirect?"

## Do NOT

- Do NOT start executing work until David approves the direction
- Do NOT skip the standup report even if the user's opener specifies the scope — they still benefit from the "Also Ready" list
- Do NOT load Notion roadmap — Notion MCP isn't currently wired; skip that step with a one-line flag

## Claude Code notes

- `CLAUDE.md` auto-loads as project instructions — you don't need David to paste it; just read it with the Read tool.
- The Chat-era `th` → clipboard → paste pattern is obsolete in Claude Code. The minimum viable session opener from David is just `/session-open`.
- Memory files at `/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/` auto-load relevant context — honor feedback memories before proposing approaches.
