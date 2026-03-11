---
name: session-startup
description: Defines the 5-step session initialization procedure for Agentic SDLC Framework agents. Use at the start of every new session or after context window reset. Ensures continuity by reading runtime state first, loading only the needed guidance, and establishing baseline state before proceeding with work.
argument-hint: Describe what task to resume or initialize
compatibility: ["cursor", "copilot", "claude-code", "windsurf", "amazon-q"]
---

## Session Startup Ritual

Execute this 5-step ritual at the start of every session:

### Step 1: Verify Working Directory
```bash
pwd
ls -la .ai/
```
Confirm you are in the correct workspace root and `.ai/` directory exists.

### Step 2: Read Core Framework Files

Read in this order:
1. `AGENTS.md` - routing and retrieval policy
2. `.ai/session-state/index.json` and recent events - structured runtime state
3. `.ai/NOW.md` - active task summary when it exists
4. `.ai/session-ledger.md` - recent human-facing history only if needed
5. `rbac-factbook.yaml` - current user role and permissions when role checks matter
6. `.ai/domain-governance.yaml` - only when the task touches governed domains, compliance, or policy checks

### Step 3: Identify Current Context

From runtime state and recent events, identify:
- Current session, plan, and trace
- Active execution mode (`sprint` or `resume`)
- Any offset cursor or save checkpoint
- Pending approvals or incomplete operations
- Session ledger context only if the structured state is insufficient

### Step 4: Review Recent Git History
```bash
git log --oneline -10
git status
```
- Understand recent changes
- Check for uncommitted work
- Identify current branch

### Step 5: Log Session Start

Append to `.ai/session-ledger.md`:
```markdown
## [CURRENT_ISO8601_TIMESTAMP] | Agent: [agent-name] | Phase: [phase] | Story: [story-id or "general"]
Decision: Session started, resuming from [last-task or "new-work"]
Rationale: [Brief context of what you're about to do]
Files affected: [none yet]
Cost: ~0.00 USD | Tokens: 0 in / 0 out | Model: [model-name]
```

**CRITICAL**: Use system-generated timestamp, NEVER copy from examples.

### Why This Matters

The session startup ritual ensures:
- **Continuity**: No work is lost between sessions
- **Context**: Agent starts from structured state before reading broader prose
- **RBAC**: Agent knows user permissions
- **Audit Trail**: Session start is recorded (ALCOA+ compliance)
- **Efficiency**: No duplicate work

### Sprint Offset Save Behavior

- **Sprint**: work in short, focused bursts while the current approach is productive
- **Offset**: if retries, context noise, or progress stalls rise, review with council and switch strategies
- **Save**: checkpoint runtime state before the reset so the next pass resumes from facts, not from a large prompt

### Session Recovery After Context Reset

If NOW.md is stale or missing:
1. Read `.ai/session-state/index.json`
2. Read recent events from `.ai/session-state/events.jsonl`
3. Read last save or offset cursor if present
4. Read recent ADRs only if the task needs architectural context
5. Proceed from the saved checkpoint or resume cursor

### Platform Notes

- **IDE-agnostic**: Works on any AGENTS.md-compatible IDE
- **No hooks required**: Manual session logging (git hooks optional for automation)
- **Markdown-based**: No TOON format, just append to session-ledger.md
