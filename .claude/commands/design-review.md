# Design Review

Dispatch the design-reviewer subagent against a design record, an audit doc, or a proposed primitive contract. Surfaces structural concerns with explicit citations before implementation arc kicks off.

## Usage

```
/design-review [target file path OR audit doc OR design record]
```

Examples:
- `/design-review docs/contrast-audit.md` — walk the 47 offenders + propose fix-bundle structure
- `/design-review docs/home-hero-design.md` — review a frozen design record before Arc 1 ships
- `/design-review components/DestinationHero.tsx` — review a proposed primitive contract against lattice + tokens + brand rules

## What to do

This is the canonical dispatch wrapper for the `design-reviewer` subagent. Your job is to:

1. **Verify the target file exists** at the path passed by David. If it doesn't, ask David for the correct path before dispatching.
2. **Read the canonical substrate** the agent needs (so your dispatch prompt threads the full operating-system context):
   - `docs/DECISION_GATE.md` "The Brand Rules" section (lines ~53-90)
   - `~/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/project_layered_engagement_share_hierarchy.md` (3-tier lattice canonical)
   - `~/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/project_vendor_value_first_prioritization.md` (vendor-value priority gate)
   - `~/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/project_treehouse_thesis_digital_to_physical_bridge.md` (digital-to-physical bridge)
   - `~/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/MEMORY.md` (index of 50+ memory-backed operating disciplines)
   - `lib/tokens.ts` head (the layered v1/v2/v0.2 token namespace + canonical scales)
3. **Dispatch the design-reviewer agent** via the Agent tool with `subagent_type: "design-reviewer"` and a self-contained prompt that includes:
   - The target file path + a one-line framing of what David asked for
   - The substrate inventory (so the agent verifies its context coverage)
   - The dispatch context: pre-implementation design pass (NOT post-implementation QA self-walk, NOT autonomous fixer)
   - A reminder of the load-bearing trust contract verbatim: *"as long as the explanation can point to sound reasoning from a UI/UX design process I'm good with the calls you make"* — recommendations without citations violate the contract
4. **Relay the agent's structured triage report back to David** in your next response. The agent's output is structured per its definition (Summary / Recommendations with Citation+Reasoning+Recommendation+Severity / Outside advisory bounds / Verified against). Surface it verbatim or with a brief framing intro.
5. **Do NOT auto-apply any recommendations**. The agent is advisory; David picks. If David approves a recommendation, ship it in a follow-up commit (smallest→largest sequencing).

## Dispatch prompt template

When invoking the Agent tool, structure your prompt to the design-reviewer like this (fill in the bracketed parts):

```
You are dispatched pre-implementation against [target file path or description].

David's framing: "[verbatim or paraphrased — what David asked for in /design-review]"

Substrate verified loaded (you have these in memory; verify your context coverage by listing them in your "Verified against" section):
- docs/DECISION_GATE.md Brand Rules
- memory/project_layered_engagement_share_hierarchy.md (lattice canonical)
- memory/project_vendor_value_first_prioritization.md (vendor-value gate)
- memory/project_treehouse_thesis_digital_to_physical_bridge.md (thesis)
- memory/MEMORY.md (operating-discipline index)
- lib/tokens.ts (token namespace)

Dispatch context: pre-implementation design pass. Advisory only. Surface
structural concerns at axis-level — never per-pixel asks. Every recommendation
must carry a citation per the must-cite trust contract.

David's trust contract verbatim from session 171 close:
"as long as the explanation can point to sound reasoning from a UI/UX design
process I'm good with the calls you make."

Recommendations without citations violate the contract. If you can't cite,
demote to "Outside advisory bounds — needs David's input" rather than
risking a vibes-call.

Output format is non-negotiable per your agent definition: structured triage
report with Citation / Reasoning / Recommendation / Severity per
recommendation.

Begin.
```

## What NOT to do

- **Do NOT skip the substrate read step.** The agent needs to know it has full context coverage to operate at full advisory authority. If you dispatch without the substrate, the agent will demote more aggressively to "outside advisory bounds" and you lose half the value of the dispatch.
- **Do NOT thread per-pixel asks into the dispatch.** If David asked "should this button move 4px left," that's a dial cycle — invoke iPhone QA, not the design-reviewer.
- **Do NOT auto-apply recommendations.** Relay them; David picks; commit on David's approval.
- **Do NOT compress the agent's structured output** into prose summary unless David explicitly asks. The structure (Citation / Reasoning / Recommendation / Severity) is load-bearing — David reads at-scale and uses the structure to triage.
- **Do NOT dispatch the agent on pure-logic work** (API routes, auth flow, data migrations). The design-reviewer is for UI-touching work where visual / interaction / brand decisions are in play.

## Claude Code notes

- This slash command is project-scoped (lives at `.claude/commands/design-review.md`). The design-reviewer subagent itself is at `.claude/agents/design-reviewer.md`.
- The subagent runs with read-only tools (Read, Grep, Glob, Bash) — it cannot Edit/Write/NotebookEdit by design. Any code change ships via the main session's commits, not the subagent's tool calls.
- First firing test case per session 172 ship: dispatch against `docs/contrast-audit.md` to validate the trust contract works as designed on the 47 offenders + 3 systemic recommendations.
