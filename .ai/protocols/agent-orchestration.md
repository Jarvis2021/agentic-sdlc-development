# Agent Orchestration Protocol — Parallel Execution & Handshake Visibility

## Purpose

This protocol defines how the framework coordinates multiple agents for complex tasks. It enables parallel execution where sub-tasks are independent, enforces sequential ordering where dependencies exist, and provides transparent visibility into every agent-to-agent handshake.

The goal is simple: compound tasks should feel like a single, well-coordinated operation — not a series of disconnected steps.

## When This Protocol Activates

This protocol fires automatically when any of the following conditions are met:

- **Compound task detected** — the user issues a request that spans multiple concerns (e.g., "review PR", "implement story", "audit repo").
- **Multi-agent requirement** — the task cannot be completed by a single agent alone.
- **Parallelizable sub-tasks identified** — the Planner agent determines that two or more sub-tasks have no data dependencies and can execute simultaneously.

If a task requires only one agent, this protocol does not activate. The agent runs directly.

### Orchestration Roles

In execution plans, existing agents may assume orchestration-specific roles:

| Orchestration Role | Performed By | Context |
|--------------------|-------------|---------|
| **Standards-Checker** | Reviewer agent | When operating in parallel orchestration, the Reviewer focuses on standards/patterns only |
| **Summarizer** | Quality-Gate agent | Reads all exchange files, computes MIN confidence, produces consolidated report |
| **Code-Reviewer** | Reviewer agent | When operating in parallel, the Reviewer focuses on correctness/logic only |

These are not separate agents — they are role assignments for existing agents within an orchestration flow.

## Orchestration Flow

### Step 1: Task Decomposition (Planner Agent)

Every compound task begins with the Planner agent. No exceptions.

The Planner performs four operations in sequence:

1. **Parse intent** — break the user's request into discrete, atomic sub-tasks.
2. **Assign agents** — determine which agent owns each sub-task.
3. **Build the dependency graph** — identify which tasks can run in parallel (no shared inputs) and which must be sequential (output of one feeds into the next).
4. **Estimate time** — produce a rough elapsed-time estimate and output a visible execution plan.

The Planner does not execute anything. It produces a plan and hands off.

### Step 2: Execution Plan (User Visibility)

Before any agent begins work, the framework displays the full execution plan. This is non-negotiable — the user always sees what is about to happen.

```
EXECUTION PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Task: "Review PR #2106 on shared-lib"
Agents: 4 | Parallel Groups: 2

PARALLEL GROUP 1 (simultaneous):
  ├─ Code-Reviewer    → Diff analysis, logic, edge cases
  ├─ Security-Scanner → CVE check, secrets, OWASP
  └─ Standards-Checker → Naming, patterns, Platform conventions

SEQUENTIAL (after Group 1 completes):
  └─ Summarizer → Consolidate findings, compute confidence

Estimated: ~45 seconds
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

The plan shows agent names, their responsibilities, grouping (parallel vs. sequential), and estimated duration. If a user wants to modify the plan — drop an agent, reorder groups, or add a step — they do so before execution begins.

### Step 3: Parallel Execution

Once the plan is confirmed (or auto-confirmed for trusted flows), agents in each parallel group run independently and simultaneously.

Progress is displayed in real-time so the user is never left wondering what is happening:

```
[Code-Reviewer]     ████████████░░ 80% — 3 issues found
[Security-Scanner]  ██████████████ DONE — Clean
[Standards-Checker] ███████████░░░ 75% — 1 violation
```

Key constraints during parallel execution:

- **No shared mutable state.** Parallel agents never read or write the same file at the same time.
- **Exchange files only.** Each agent writes its output to `.ai/agent-exchange/{agent-name}.json`. This is the sole communication channel between agents.
- **Isolation.** If one agent fails, the others continue. The failure is reported in the summary, not silently swallowed.

### Step 4: Handshake Exchange

When an agent completes its work, it writes a structured exchange file. This file is the handshake — it is how downstream agents (and the Summarizer) understand what happened.

```json
{
  "agent": "code-reviewer",
  "task": "Review PR #2106 diff",
  "status": "complete",
  "confidence": 88,
  "dimensions": {
    "logic_coverage": 92,
    "edge_case_coverage": 85,
    "test_coverage_review": 88,
    "security_relevance": 90
  },
  "findings": [],
  "context_hash": "sha256:abc123...",
  "timestamp": "2026-03-03T14:30:00Z"
}
```

Every exchange file includes:

| Field | Purpose |
|-------|---------|
| `agent` | Which agent produced this output |
| `task` | Human-readable description of what was done |
| `status` | `complete`, `failed`, or `blocked` |
| `confidence` | Overall confidence score (0–100) |
| `dimensions` | Per-dimension breakdown of confidence |
| `findings` | Array of structured findings (issues, recommendations, approvals) |
| `context_hash` | SHA-256 of the input context, for reproducibility |
| `timestamp` | ISO 8601 completion time |

Sequential agents **must** read their predecessor's exchange file before starting. This ensures context flows forward correctly.

### Step 5: Aggregation & Summary

After all groups complete, the Summarizer agent takes over:

1. **Read all exchange files** from the completed parallel group.
2. **Compute overall confidence** using the MIN formula: `MIN(agent_1_confidence, agent_2_confidence, ...)`. The chain is only as strong as its weakest link.
3. **Produce a consolidated report** — a single, readable summary with all findings ranked by severity.
4. **Log to session ledger** — every orchestration run is recorded in `session-ledger.md` for auditability and cost tracking.

---

## Execution Plan Templates

These are the standard orchestration patterns for common compound tasks. Each template defines the agent groups, their ordering, and the flow.

### "Review PR" Flow

```
Group 1 (parallel): Code-Reviewer + Security-Scanner + Standards-Checker
Group 2 (sequential): Summarizer → Post review (if autonomy=full)
```

Three independent analysis agents run simultaneously, then the Summarizer consolidates. If the project's autonomy level is `full`, the review is posted automatically. Otherwise, the summary is presented for user approval.

### "Implement Story" Flow

```
Group 1 (sequential): Planner → plan approval wait
Group 2 (parallel): Implementer (writes code) + Contract-Guard (checks APIs)
Group 3 (sequential): Self-Healer → Review Council → E2E Verification
Group 4 (sequential): Releaser (commit, push, PR)
```

Implementation always starts with a plan. Code writing and API contract validation happen in parallel. After implementation, the Self-Healer runs tests, the Review Council checks quality, and only then does the Releaser ship.

### "Fix Bug" Flow

```
Group 1 (sequential): Codebase-Reader (understand context)
Group 2 (parallel): Implementer (fix) + Security-Scanner (check fix)
Group 3 (sequential): Self-Healer → E2E Verification → Releaser
```

Bug fixes begin with context gathering — understanding the codebase before touching it. The fix and security scan run in parallel. Self-Healer validates the fix does not introduce regressions.

### "Audit Repo" Flow

```
Group 1 (parallel): Security-Scanner + Dependency-Auditor + Contract-Guard
Group 2 (sequential): Knowledge-Graph updater → Summarizer → Slack alert
```

A full audit runs three scanners simultaneously, then updates the knowledge graph, summarizes findings, and alerts the team.

---

## Anti-Patterns (Encoded from Real-World Experience)

These rules are non-negotiable. They encode lessons learned from production agent sessions — each one represents a real failure that cost time, trust, or both.

| # | Rule | Bad Pattern | Correct Pattern |
|---|------|------------|-----------------|
| 1 | **One-turn autonomy** | Stop and ask "Ready?" after each step | Analyse → Execute → Report in one turn |
| 2 | **Use native tools** | Python urllib, curl, shell scripts for GitHub | Always use `gh` CLI for GitHub operations |
| 3 | **Fail-fast on empty output** | Retry same command 5+ times hoping for different results | After 2 empty outputs, switch strategy immediately |
| 4 | **Clean workspace** | Create temp files in the project directory | Use `/tmp` or clean up after completion |
| 5 | **Scope discipline** | Edit source files when asked to review | Analysis and implementation are separate tasks — ask first |
| 6 | **Batch operations** | Post PR comments one at a time (N API calls) | Batch all comments in a single API call |
| 7 | **PR-accurate line numbers** | Read local checkout for PR diff line references | Use `git show origin/<branch>:<file>` for accuracy |
| 8 | **No stash without warning** | Silently run `git stash` before operations | Warn user if uncommitted changes will be stashed |
| 9 | **Evidence-based completion** | "All tests pass" with no proof | Show runtime proof: DB query, API response, UI screenshot |
| 10 | **Cost awareness** | Use strongest model for every sub-task | Route by task: strongest for planning/review, fast for implementation |

---

## Confidence Scoring (Per Agent)

Every agent reports confidence using a 4-dimension MIN formula. The overall confidence is the minimum of all dimensions — because a chain is only as strong as its weakest link.

```
Overall Confidence = MIN(dimension_1, dimension_2, dimension_3, dimension_4)

Labels:
  0–59%   → CRITICAL (block progression, escalate to human)
  60–74%  → LOW (flag for review before proceeding)
  75–89%  → MEDIUM (proceed with caution, note risks)
  90–94%  → HIGH (proceed normally)
  95–100% → VERY HIGH (auto-proceed, no human review needed)
```

### Per-Agent Dimensions

Each agent measures confidence across four dimensions specific to its domain:

| Agent | Dim 1 | Dim 2 | Dim 3 | Dim 4 |
|-------|-------|-------|-------|-------|
| Code-Reviewer | Logic Coverage | Edge Cases | Test Review | Security Relevance |
| Security-Scanner | CVE Coverage | Secret Scan | OWASP Check | Dependency Audit |
| Implementer | AC Coverage | Code Quality | Test Coverage | Evidence Quality |
| Planner | Requirement Clarity | Scope Definition | Risk Assessment | Dependency Mapping |
| Self-Healer | Fix Accuracy | Regression Check | Root Cause | Confidence in Fix |

If any single dimension drops below 60%, the agent flags the entire task as CRITICAL regardless of the other dimensions. This prevents a high average from masking a dangerous gap.

---

## Evidence Citation Format

Every finding, decision, or recommendation must include a verifiable evidence citation. No claim without proof.

```
proof: E:<source>:<reference>#<anchor>

Sources:
  file  → E:file:src/models/User.ts#L42-L50
  test  → E:test:UserTests#testCreateUser
  cmd   → E:cmd:npm audit --json
  toon  → E:toon:checkpoint_id
  api   → E:api:GET /health → 200
  db    → E:db:SELECT count(*) FROM users → 42
```

### Evidence Quality Tiers

Not all evidence is equal. The framework distinguishes three tiers:

| Tier | Sources | Why |
|------|---------|-----|
| **STRONG** | `file`, `test`, `db`, `api` | Verifiable — anyone can check the same source and get the same result |
| **MEDIUM** | `cmd`, `toon` | Reproducible — can be re-run, but output may vary by environment |
| **WEAK** | `inference`, `url` | Not verifiable locally — based on reasoning or external content that may change |

Agents should prefer STRONG evidence. If only WEAK evidence is available, the agent must note this in its confidence dimensions.

---

## Session Ledger Integration

Every orchestration run is logged to `.ai/session-ledger.md`. This creates an auditable trail of what agents did, how long it took, what they found, and what it cost.

```markdown
## 2026-03-03T14:30:00Z | Orchestrator | Task: Review PR #2106
- Agents: Code-Reviewer, Security-Scanner, Standards-Checker, Summarizer
- Parallel Groups: 2
- Elapsed: 47s
- Overall Confidence: 88% (MIN of [88%, 95%, 90%])
- Findings: 4 (CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 1)
- Cost: $0.12 | Tokens: 8,400 in / 2,100 out | Model: <model-id>
```

The ledger is append-only. Entries are never edited or deleted. Over time, it provides a clear picture of agent usage patterns, cost trends, and reliability.

---

## Rules

These are the hard rules of the orchestration protocol. They are not guidelines — they are invariants.

1. **Planner runs first.** Every compound task begins with the Planner agent. No agent executes before a plan exists.
2. **Execution plan is visible.** The user always sees the plan before agents start. No silent orchestration.
3. **Parallel agents do not share mutable state.** Communication happens through exchange files only.
4. **Sequential agents read predecessors.** A sequential agent must read the exchange file of the agent before it. Skipping is not allowed.
5. **Overall confidence = MIN of all agents.** The weakest agent's confidence determines the orchestration's confidence.
6. **Confidence < 60% triggers human review.** If any agent reports CRITICAL confidence, the orchestrator stops and escalates.
7. **Anti-patterns are hard rules.** They are encoded from real failures and enforced without exception.
8. **Session ledger is mandatory.** Every orchestration run produces a ledger entry. No exceptions, no "I'll log it later."
