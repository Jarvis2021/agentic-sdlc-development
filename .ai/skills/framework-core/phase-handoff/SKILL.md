---
name: phase-handoff
description: Manages phase transitions in the Agentic SDLC Framework. Use when completing a work phase, preparing agent-exchange handoff documentation, or validating delivery completeness. Contains pre-handoff checklist and session ledger update requirements.
argument-hint: Name the current phase and next phase for handoff
compatibility: ["cursor", "copilot", "claude-code", "windsurf", "amazon-q"]
---

## Phase Handoff Protocol

The Agentic SDLC Framework uses trigger-based protocols, not a fixed handoff chain. Agents are invoked on-demand by user commands.

### Typical Phase Flow

| Phase | Protocol(s) | Deliverable |
|-------|-------------|-------------|
| **Plan** | Planner | `.ai/agent-exchange/planner-output.md` |
| **Implement** | Implementer + Self-Healer | Code + tests |
| **Review** | Reviewer (Review Council) | `.ai/agent-exchange/review-report.md` |
| **Test** | Quality-Gate | Test results + coverage report |
| **Release** | Releaser + Release-Gate | Git tag + release notes |

### Pre-Handoff Checklist

Before transitioning to next phase, verify:

- [ ] Phase deliverables created (output written to `.ai/agent-exchange/`)
- [ ] Session ledger entry updated with phase completion
- [ ] No unresolved blockers
- [ ] Files committed (if applicable)
- [ ] Summary prepared for next agent

### Session Ledger Update on Phase Completion

Append to `.ai/session-ledger.md`:
```markdown
## [CURRENT_ISO8601_TIMESTAMP] | Agent: [agent-name] | Phase: [phase] | Story: [story-id]
Decision: [Phase name] complete
Rationale: [What was accomplished, key decisions]
Files affected: [list of modified files]
Cost: ~[USD estimate] | Tokens: [input] in / [output] out | Model: [model]
```

### Agent Exchange Format

When handing off to next agent, write output to `.ai/agent-exchange/[agent-name]-output.md`:

```markdown
# [Agent Name] Output - [Story ID]
Timestamp: [ISO 8601]
Phase: [phase-name]

## Summary
[1-2 sentence summary of what was done]

## Deliverables
- [List of created/modified files]
- [Key decisions made]
- [ADRs created]

## Next Steps
[What the next agent should do]

## Blockers
[Any unresolved issues, or "None"]
```

### Critical Rules

1. **ALWAYS write session ledger entry** on phase completion
2. **ALWAYS create agent-exchange output** if next agent needs context
3. **ALWAYS commit files** before transitioning phases
4. **NEVER skip verification steps** (tests, review, quality-gates)

### Phase Transition Commands

Users trigger phase transitions via commands:
- `plan [story]` → Invokes Planner
- `implement [story]` → Invokes Implementer (reads planner output)
- `review` → Invokes Reviewer (Review Council)
- `release` → Invokes Releaser + Release-Gate

No strict handoff chain — user drives workflow.
