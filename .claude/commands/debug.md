# Debug Issue

Diagnose and fix a bug.

## Usage
/debug [description of the problem]

Example: /debug Saves aren't persisting to localStorage on mobile Safari after navigation

## What to do

1. Ask which screen/flow the bug occurs on if not specified
2. Read the relevant files before suggesting a fix
3. Check these known gotchas first:

### Known Treehouse Gotchas

**localStorage on mobile Safari**
React state batching defers `localStorage.setItem` past navigation events.
Fix: call `persist()` synchronously *outside* the state updater, before `router.push()`.

**SerpAPI 400 errors**
Almost always the `_sop` sort parameter. Remove it.

**Env vars undefined in serverless**
Reading `process.env.X` at module scope returns undefined on Vercel.
Fix: move the read inside the request handler.

**zsh glob expansion**
Paths like `app/[id]/page.tsx` must be quoted: `'app/[id]/page.tsx'`

**filesystem:edit_file whitespace**
Requires exact character match including all whitespace and Unicode.
When in doubt, use `filesystem:write_file` with the full file.

4. Propose the fix with the specific file + line or full replacement
5. Explain *why* the bug happened, not just what to change
