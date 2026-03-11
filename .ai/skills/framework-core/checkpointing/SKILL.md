---
name: checkpointing
description: Provides session checkpointing and recovery for Agentic SDLC Framework. Use when context window is filling up, before long operations, or to save progress. Ensures work continuity across sessions via structured runtime state, session-ledger.md, and NOW.md updates.
argument-hint: Describe what checkpoint to create or recover from
compatibility: ["cursor", "copilot", "claude-code", "windsurf", "amazon-q"]
---

## Checkpointing Protocol

Checkpointing preserves work progress across context resets and session boundaries.

Checkpointing is the `Save` part of the Sprint/Offset/Save loop:
- Sprint while the current approach is productive
- Offset when retries or context noise make the burst inefficient
- Save the smallest useful runtime state before resuming with a fresh strategy

### When to Checkpoint

Checkpoint in these scenarios:
- **Context approaching capacity** (80%+ used, if visible)
- **Before long operations** (bulk refactor, large file generation)
- **Phase completion** (after plan, after implement, after review)
- **Before offsetting** to a new strategy after council review
- **End of work session** (before user closes IDE)
- **On demand** (user requests checkpoint via command)

### Checkpoint Format (Session Ledger)

Append to `.ai/session-ledger.md`:
```markdown
## [CURRENT_ISO8601_TIMESTAMP] | Agent: Checkpoint | Phase: [current-phase] | Story: [story-id or "general"]
Decision: Checkpoint created - [reason]
Rationale: [What work was in progress, what's next]
Files affected: [list of files modified since last checkpoint]
Cost: ~[cumulative USD] | Tokens: [cumulative] in / [out] out | Model: [model]
Context: [brief state summary]
```

### NOW.md Update

Update `.ai/NOW.md` to reflect current bounded context:
```markdown
# NOW - Current Bounded Context

Last updated: [CURRENT_ISO8601_TIMESTAMP]

## Active Story
[Story ID]: [Story title]

## Current Phase
[plan | implement | review | test | release]

## In Progress
- [Task 1]
- [Task 2]

## Recent Decisions (Last 3)
1. [Decision] - See ADR-XXX
2. [Decision] - See session ledger [timestamp]
3. [Decision] - See agent-exchange/[agent]-output.md

## Next Actions
1. [Next task]
2. [Next task]

## Blockers
[List any blockers, or "None"]
```

### Structured Save State

Before writing markdown summaries, persist:
- execution mode in `.ai/session-state/index.json`
- latest offset cursor or trace boundary
- save reason and timestamp
- any open approvals or blockers still active

### Recovery from Checkpoint

To recover from a checkpoint (e.g., after context reset):
1. Read `.ai/NOW.md` (most recent bounded context)
2. Read last 5 entries in `.ai/session-ledger.md`
3. Read `.ai/agent-exchange/[last-agent]-output.md`
4. Read recent ADRs from `.ai/decisions/architecture-decisions.md`
5. Resume from "Next Actions" in NOW.md

### Emergency Checkpoint (Pre-Compaction)

If context is about to be compacted (token limit reached):
1. Write checkpoint to session ledger immediately
2. Update NOW.md with current state
3. Commit files if any are modified
4. Note "Emergency checkpoint - context compaction imminent" in rationale

After compaction, read checkpoint to resume.

### Checkpoint Integrity

Checkpoints must be:
- **Attributable**: Logged by specific agent
- **Timestamped**: System-generated ISO 8601 timestamp
- **Complete**: All in-progress work documented
- **Linked**: References session ledger, ADRs, agent-exchange files

### Platform Notes

- **No hooks required**: Manual checkpointing (write to session-ledger.md)
- **IDE-agnostic**: Works on any IDE
- **Git-based**: Committed checkpoints survive across clones
