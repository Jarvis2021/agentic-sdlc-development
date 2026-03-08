---
name: session-startup
description: Defines the 5-step session initialization procedure for Agentic SDLC Framework agents. Use at the start of every new session or after context window reset. Ensures continuity by reading session ledger, loading AGENTS.md, verifying working directory, and establishing baseline state before proceeding with work.
argument-hint: Describe what task to resume or initialize
compatibility: ["cursor", "copilot", "claude-code", "windsurf", "amazon-q"]
---

## Session Startup Ritual

Execute this 5-step ritual at the start of EVERY session:

### Step 1: Verify Working Directory
```bash
pwd
ls -la .ai/
```
Confirm you are in the correct workspace root and `.ai/` directory exists.

### Step 2: Read Core Framework Files

Read in this exact order:
1. `AGENTS.md` - Agent definitions and protocols
2. `.ai/NOW.md` - Current bounded context (What's happening right now)
3. `.ai/session-ledger.md` - Last 5-10 session entries (find latest timestamp)
4. `rbac-factbook.yaml` - Current user role and permissions
5. `.ai/domain-governance.yaml` - Platform-specific guardrails

### Step 3: Identify Current Context

From session ledger, identify:
- Last session timestamp
- Last agent that ran
- Last story/task worked on
- Last phase (plan/implement/test/deploy)
- Any incomplete operations

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
- **Context**: Agent understands current state
- **RBAC**: Agent knows user permissions
- **Audit Trail**: Session start is recorded (ALCOA+ compliance)
- **Efficiency**: No duplicate work

### Session Recovery After Context Reset

If NOW.md is stale (older than current branch work):
1. Read last 10 session ledger entries
2. Read recent ADRs from `.ai/decisions/architecture-decisions.md`
3. Read CONTEXT_COMPRESSED.md for high-level project structure
4. Proceed from last checkpoint

### Platform Notes

- **IDE-agnostic**: Works on any AGENTS.md-compatible IDE
- **No hooks required**: Manual session logging (git hooks optional for automation)
- **Markdown-based**: No TOON format, just append to session-ledger.md
