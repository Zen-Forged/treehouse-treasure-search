# Refactor Component

Refactor or rewrite an existing component.

## Usage
/refactor [ComponentName or file path] [what to change]

Example: /refactor components/CompCard.tsx Add remove button and sold-date display

## What to do

1. Read the current file first with filesystem:read_text_file
2. Make changes, then write the FULL file with filesystem:write_file — no partial patches
3. Preserve existing prop interface unless explicitly asked to change it
4. Keep all existing functionality unless explicitly asked to remove it
5. Check for any pages that import this component and verify they still compile

## Refactor checklist
- [ ] Full file written (not patched)
- [ ] All existing props still accepted
- [ ] Mobile layout preserved (max-w-md, safe areas)
- [ ] No new context systems introduced (use useFindSession)
- [ ] CLAUDE.md updated if the component's public API changed
