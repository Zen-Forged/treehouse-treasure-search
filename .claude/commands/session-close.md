# Session Close

Run the full Treehouse Finds session-closing protocol per `MASTER_PROMPT.md` §SESSION CLOSE PROTOCOL.

## Usage

`/session-close`

## What to do

1. **Update `CLAUDE.md`:**
   - Replace the previous session's full block with the current session's full block
   - Move the previous session to the Archived session summaries list as a one-liner tombstone
   - Update `> Last updated:` line in CURRENT ISSUE
   - Refresh the "Recommended next session" + "Alternative next sessions" + "Session N+1 opener" subsections
   - Adjust KNOWN GAPS: mark resolved items, add any new ones, update references to session numbers
   - Update the INVESTOR UPDATE SYSTEM footer's sprint-arc line

2. **Patch any docs drift surfaced this session:**
   - If the session exercised a runbook and found the runbook outdated, patch the runbook in the same commit
   - Update `CONTEXT.md` only if architecture, routes, schema, or gotchas changed

3. **Memory updates:**
   - Save new user preferences, feedback corrections, or project facts as memory files per the memory-system guidance
   - Never save memory content directly in `MEMORY.md` — always separate file + index entry

4. **Git:**
   - `git status` + `git diff --stat HEAD` — audit what changed
   - Commit with a message following the repo's existing style (see `git log --oneline -10`). Treehouse pattern: `feat(scope): ...` or `docs: session N close — ...` — NO `Co-Authored-By` line (matches 45+ prior commits)
   - Push the current branch
   - If on a worktree, open a PR to `main` via `gh pr create` — include a test plan checklist + notes for future sessions

5. **Deliver close summary:**
   - One paragraph: what shipped, what's next, any open risks
   - Flag any 🚧 BLOCKED items (e.g., Notion roadmap update when MCP isn't wired)
   - Provide the session N+1 starting-point in one line so David knows how to resume

## Do NOT

- Do NOT commit without a descriptive message tied to the actual shipments
- Do NOT skip the archive-tombstone step — CLAUDE.md grows unbounded otherwise
- Do NOT merge to `main` automatically when closing from a worktree — stop at the PR (Vercel preview is the safety net David relies on)
- Do NOT use `--no-verify` or skip hooks, even if pre-commit is slow
- Do NOT update Notion Roadmap unless Notion MCP is loaded — flag as 🚧 BLOCKED and note it's automatable once wired

## Claude Code notes

- Worktree sessions commit to a `claude/<worktree-name>` branch, not `main`. The close-protocol ends at "PR opened" — David merges when ready.
- The `thc` shell alias from the Chat era is obsolete here. `/session-close` replaces it with a far richer protocol that handles tombstoning, memory, PR creation, and docs drift.
- If the session was a pure research/exploration pass with no code or docs changes, say so explicitly and close without a commit rather than inventing edits.
