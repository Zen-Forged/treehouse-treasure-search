# Update Context

Sync CLAUDE.md and CONTEXT.md after significant changes.

## Usage
/update-context [what changed]

Example: /update-context Added /price-history route and PriceHistory component

## What to do

1. Read current CLAUDE.md
2. Update only the sections affected by the change:
   - Route Map (if new/changed route)
   - API Routes table (if new/changed API)
   - Key Files Quick Reference (if new file)
   - Current State (if feature status changed)
3. Write the full updated CLAUDE.md
4. Note at top: update the `> Last updated:` line in CONTEXT.md too

## Do NOT change
- Architectural rules section (only update if a new gotcha was discovered)
- Pricing Logic (only if thresholds actually changed in pricingLogic.ts)
- Design Tokens (only if new tokens were added to the system)
