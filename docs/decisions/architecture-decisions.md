# Architecture Decision Records

This document records the architectural decisions made during the development of the Agentic SDLC Framework. Each decision follows the Nygard ADR format.

**Total ADRs**: 26
**Last Updated**: 2026-03-08

---

## ADR-001: Scale-Adaptive Task Classification
**Status**: Accepted
**Date**: 2026-03-08

### Context
Tasks vary from trivial typos to high-risk architecture changes. One-size-fits-all workflows waste tokens on simple tasks and under-protect complex ones.

### Decision
Classify every task as TRIVIAL/LOW/MEDIUM/HIGH before any action. Classification determines which protocols load, which gates fire, and token budget.

### Consequences
- Simple tasks stay cheap (~5K tokens), complex tasks get full multi-agent review
- Classification must happen as the first step before any protocol loading
- Misclassification risk is mitigated by allowing reclassification mid-session if scope changes

---

## ADR-002: Classification-Based Retrieval Guardrails
**Status**: Accepted
**Date**: 2026-03-08

### Context
Unbounded LLM context leads to cost spikes and degraded reasoning quality. Without guardrails, agents consume full context windows even for trivial tasks and rely on large prompt payloads instead of targeted retrieval.

### Decision
Use fixed retrieval guardrails per classification: TRIVIAL 5K, LOW 20K, MEDIUM 80K, HIGH 200K. Retrieve only the required runtime state, rules, and protocols, then compact when the useful context is getting noisy.

### Consequences
- Cost-predictable sessions with clear per-task ceilings
- Agents must prefer selective retrieval over broader prompt loading
- HIGH tasks get deeper reasoning and broader evidence only when risk justifies it

---

## ADR-003: Progressive Retrieval Disclosure
**Status**: Accepted
**Date**: 2026-03-08

### Context
Loading all protocol files at session start wastes context on guidance that may never be needed for the current task.

### Decision
`context-index.yaml` acts as a small lookup map. Runtime state, rules, and optional protocol detail are then pulled on demand based on the task and current execution state.

### Consequences
- Baseline context stays smaller and more relevant to the active task
- Protocols load based on task classification and current runtime needs, reducing noise
- Requires well-maintained routing metadata in `context-index.yaml`

---

## ADR-004: Circuit Breaker at Three Failures
**Status**: Accepted
**Date**: 2026-03-08

### Context
Incident PROJ-NNN: agent retried the same I001 lint error repeatedly instead of escalating, wasting 6 CI loops and 45 minutes of compute time.

### Decision
Track failure_count per lint-rule or test-name. At 3 failures for the same issue: HALT, write escalation.md, report to user, do not attempt a 4th fix.

### Consequences
- Stops runaway retry loops that accumulate cost without progress
- Forces root cause analysis instead of blind retries
- Escalation file provides context for human intervention

---

## ADR-005: Post-Push Observation Within 120 Seconds
**Status**: Accepted
**Date**: 2026-03-08

### Context
Incident PROJ-NNN: Copilot PR review posted at T+6 min. Agent did not check for 45 minutes. 11 comments sat unaddressed while the agent worked on other things.

### Decision
After every git push, within 120 seconds: run `gh pr checks`, run `gh pr view --comments`, address every comment before any other work.

### Consequences
- Fast feedback loop catches CI failures and review comments immediately
- PR comments handled proactively without user intervention
- Agent must pause current work to observe, which is a small throughput cost for a large quality gain

---

## ADR-006: Preflight Script Mirrors CI Exactly
**Status**: Accepted
**Date**: 2026-03-08

### Context
Incident PROJ-NNN: agent composed lint commands ad-hoc and missed `ruff format --check`. Local checks diverged from CI, causing preventable failures.

### Decision
`scripts/preflight.sh` runs the identical command set as `.github/workflows/ci.yml`. If preflight passes, CI passes. Commit is blocked if preflight fails.

### Consequences
- Zero "works locally, fails in CI" incidents
- Single source of truth for quality checks in the preflight script
- CI workflow changes must be mirrored in preflight.sh (enforced by review)

---

## ADR-007: Autofix-First for Lint and Format Errors
**Status**: Accepted
**Date**: 2026-03-08

### Context
Incident PROJ-NNN: agent manually sorted imports twice and got it wrong both times. `ruff check --select I --fix` was available but unused.

### Decision
For lint/format errors: always run autofix commands first (`ruff check --fix`, `ruff format`). Never hand-edit import order or formatting. Manual edit only as last resort after autofix fails.

### Consequences
- Deterministic fixes that match tool configuration exactly
- Eliminates guessing and manual formatting errors
- Agents must know which tools support autofix and invoke them before manual editing

---

## ADR-008: Local Linter Config Must Match CI
**Status**: Accepted
**Date**: 2026-03-08

### Context
Incident PROJ-NNN: `pyproject.toml` had `[tool.black]` but CI ran ruff. Config drift caused 4 of 10 CI failures.

### Decision
If CI runs a tool (ruff, eslint, etc.) that has no local config section, HALT and flag the mismatch. Do not proceed until config parity is established.

### Consequences
- Eliminates config drift between local and CI environments
- Local and CI use identical rules, versions, and configurations
- Boot sequence must verify config parity as a precondition

---

## ADR-009: Agent Council Runs Before PR, Not After
**Status**: Accepted
**Date**: 2026-03-08

### Context
GitHub PR comments lack project context and often flag generic issues. Issues caught after PR creation waste CI loops and require additional push/review cycles.

### Decision
Run 3-reviewer council (Correctness, Standards, Security) before every PR. Council runs with full project context including ADRs, architecture docs, and established patterns.

### Consequences
- Shift-left quality catches issues before they reach GitHub
- Zero surprise comments on PR reviews is the target outcome
- Human review can focus on architecture and business logic rather than style and correctness

---

## ADR-010: External Review Comments Require Council Verification
**Status**: Accepted
**Date**: 2026-03-08

### Context
External reviewers (Copilot, human reviewers) may suggest changes that conflict with project patterns, violate ADRs, or introduce regressions.

### Decision
Never implement external review comments without running Review Council first. Council produces verdict: VALIDATES, REJECTS, or MODIFIES the suggestion with justification.

### Consequences
- Prevents blindly implementing incorrect or conflicting suggestions
- Council serves as the authoritative arbiter of project standards
- External input is treated as advisory, not directive

---

## ADR-011: Mandatory Protocol Invocation After Every File Edit
**Status**: Accepted
**Date**: 2026-03-08

### Context
Incident PROJ-NNN: Self-Healer and Reviewer protocols existed on disk but were never invoked. Agent behavior was opaque and changes went unvalidated.

### Decision
After every file edit: Self-Healer runs. Before every commit: Reviewer runs. Outputs go to agent-exchange/. Commit blocked if protocol outputs are missing.

### Consequences
- Every change is validated by at least two protocol passes
- Protocol runs are visible and auditable via agent-exchange files
- No silent commits; every commit has associated validation artifacts

---

## ADR-012: Boot Sequence Includes Pre-Commit Discovery
**Status**: Accepted
**Date**: 2026-03-08

### Context
Incident PROJ-NNN: `.pre-commit-config.yaml` existed with ruff hooks but `pre-commit install` was never run. If active, CI loops 1-4 would never have happened.

### Decision
On every session start: read `ci.yml`, `pyproject.toml`, `.pre-commit-config.yaml`. If pre-commit config exists but hooks aren't installed, install them immediately.

### Consequences
- Environment correctness established before any coding begins
- Pre-commit catches issues at commit time, preventing CI failures
- Boot sequence takes slightly longer but prevents cascading failures

---

## ADR-013: Impact Analysis Before Production Code Changes
**Status**: Accepted
**Date**: 2026-03-08

### Context
Incident PROJ-NNN: agent changed `error_log` from wildcard to doc-scoped without checking tests. `test_find_error_log_by_wildcard` immediately broke in CI.

### Decision
Before modifying any function: grep tests for references, run affected tests. If tests depend on old behavior, document impact and get approval before proceeding.

### Consequences
- No blind production changes that break existing test contracts
- Regressions caught before commit, not discovered in CI
- Slightly slower iteration speed, justified by preventing CI churn

---

## ADR-014: Agent-Exchange Files Overwritten Per Run
**Status**: Accepted
**Date**: 2026-03-08

### Context
Append-only agent output files would bloat over time and create confusion about which output reflects current state versus stale history.

### Decision
Each agent writes to `agent-exchange/{agent}-output.md`, overwriting previous content. Archival happens on story completion via rotation to `history/`.

### Consequences
- Simple mental model: latest file always reflects current state
- No manual cleanup or file management needed during sessions
- Historical data preserved through rotation, not accumulation

---

## ADR-015: NOW.md Bounded at ~150 Tokens
**Status**: Accepted
**Date**: 2026-03-08

### Context
Unbounded current-task context leads to cost drift and stale information accumulating across sessions.

### Decision
`NOW.md` holds current task only (~150 tokens). On story completion, content rotates to `.ai/history/` and NOW.md resets to empty.

### Consequences
- Context stays small and always relevant to current work
- History is searchable for triage and post-mortems
- No accumulation of stale task context across sessions

---

## ADR-016: AGENTS.md as Table of Contents
**Status**: Accepted
**Date**: 2026-03-08

### Context
OpenAI Harness Engineering principle H1: "AGENTS.md = Table of Contents, not Encyclopedia." Large root files consume context on every interaction.

### Decision
Keep AGENTS.md under ~1200 tokens. Point to `docs/` and `protocols/` for depth. Protocols lazy-load from `.ai/protocols/`.

### Consequences
- Fast boot with minimal always-loaded context
- Depth available on demand through lazy-loading
- AGENTS.md remains stable across protocol updates

---

## ADR-017: Model Selection Per Agent Role
**Status**: Accepted
**Date**: 2026-03-08

### Context
Different agent tasks have different reasoning requirements. Code review needs depth and nuance; implementation needs speed and throughput.

### Decision
Reviewer uses strongest available model (opus-class). Specifier, planner, and implementer use fast model (sonnet-class). Model assignment configurable in `.ai/config.yaml`.

### Consequences
- Cost/quality tradeoff optimized per role
- Review gets best reasoning; implementation stays efficient and fast
- Per-project override possible for teams with different cost tolerances

---

## ADR-018: Context Compaction at 40% of Window
**Status**: Accepted
**Date**: 2026-03-08

### Context
Need a clear, early trigger for context compaction to avoid late, disruptive truncation that loses important information.

### Decision
Compact conversation when it reaches 40% of context window. Threshold configurable in `.ai/config.yaml`.

### Consequences
- Predictable compaction timing, avoiding emergency truncation
- Summaries generated at manageable size when context is still coherent
- 40% threshold leaves room for post-compaction work before hitting limits

---

## ADR-019: Soft Denial for Quality Gates
**Status**: Accepted
**Date**: 2026-03-08

### Context
Silent hard blocks frustrate users and hide root cause. Agents should explain why a gate failed and what can be done about it.

### Decision
For coverage or quality failures: explain what's missing, suggest specific fixes, allow up to 3 Self-Healer attempts. Only hard-block after 3 attempts with full explanation of what was tried.

### Consequences
- Users understand failures and have actionable next steps
- Self-Healer gets chances to auto-resolve before escalating
- Hard blocks are justified, explained, and accompanied by full attempt history

---

## ADR-020: Deliberate Enterprise Pattern Omissions
**Status**: Accepted
**Date**: 2026-03-08

### Context
Some enterprise patterns (rigid phase numbering, mandatory compliance frameworks, TOON files, God Mode) add complexity without proportional value for our target use case.

### Decision
Explicitly omit patterns that don't add value. Adopt selectively: architecture protection, ADR automation, RBAC, quality levels, soft denial, deterministic replay. Every included pattern has documented justification.

### Consequences
- Lean framework without unnecessary ceremony
- Complexity is controlled and justified per-pattern
- Teams can opt-in to omitted patterns via config if their context warrants them

---

## ADR-021: Parallel Test Execution Above 50 Tests
**Status**: Accepted
**Date**: 2026-03-08

### Context
Large test suites run slowly in serial. Developer experience degrades as test count grows, discouraging frequent test runs.

### Decision
When test count exceeds 50, auto-run in parallel: `pytest -n auto` for Python, `vitest --pool=threads` for TypeScript, `go test -parallel=8` for Go.

### Consequences
- Faster feedback loops as test suites grow
- Automatic scaling without manual configuration
- Threshold and parallelism configurable via `project-config.yaml`

---

## ADR-022: Single-Target Handoffs Between Agents
**Status**: Accepted
**Date**: 2026-03-08

### Context
Fan-out handoffs are hard to reason about and debug. Multi-target handoffs create race conditions and non-deterministic behavior.

### Decision
Handoffs are one-to-one. Payload in `agent-exchange/{agent-name}.json`. Receiving agent reads, confirms, and proceeds. Same payload implies same behavior (deterministic replay).

### Consequences
- Clear, linear flow that is easy to trace and debug
- Reproducible agent sequences from identical payloads
- Fan-out parallelism handled by orchestrator, not by individual agent handoffs

---

## ADR-023: Separate Ruff Check and Ruff Format Commands
**Status**: Accepted
**Date**: 2026-03-08

### Context
Incident PROJ-NNN: agent ran only `ruff check`, missing formatting errors. `ruff check` and `ruff format` are different engines catching different categories of issues.

### Decision
Always run both `ruff check` (lint: unused imports, I001, type errors) AND `ruff format --check` (format: line length, spacing, quotes). Never assume one covers the other.

### Consequences
- Complete code quality coverage across both lint and format dimensions
- No silent format drift between commits
- Preflight script and CI must invoke both commands explicitly

---

## ADR-024: Preflight Quick Mode for Rapid Iteration
**Status**: Accepted
**Date**: 2026-03-08

### Context
Full preflight including tests can be slow during rapid iteration cycles. Developers need fast feedback on lint/format while iterating, with full validation at commit time.

### Decision
`scripts/preflight.sh --quick` runs lint and format only, skipping tests. Full preflight (including tests) required before commit.

### Consequences
- Faster local feedback during active development
- Full quality gate still enforced at commit boundary
- Developers can iterate quickly without waiting for full test suite

---

## ADR-025: Session Ledger Mandatory After Every Session
**Status**: Accepted
**Date**: 2026-03-08

### Context
Need audit trail for cost, decisions, and failures. Post-mortem analysis requires structured data about what happened, what it cost, and what failed.

### Decision
After every session, write `.ai/session-ledger.md` with: story/task, model used, duration, CI loops, token usage, decisions made, failures encountered, cost estimate, protocols invoked.

### Consequences
- Traceable sessions with full audit trail
- Cost and failure patterns visible for continuous improvement
- Supports post-mortems and framework optimization over time

---

## ADR-026: Architecture Changes Auto-Flagged and Gated
**Status**: Accepted
**Date**: 2026-03-08

### Context
Structural changes (new dependencies, new endpoints, schema migrations) need architect review. Agents should not merge them without oversight.

### Decision
Auto-flag as architecture change: new dependencies, new endpoints, schema migrations, new patterns, CI/CD changes, infrastructure changes, auth changes. When flagged: block PR, require architect approval, ADR-Watcher drafts a new ADR.

### Consequences
- Architecture protected from accidental or unauthorized changes
- All structural decisions documented via auto-generated ADRs
- RBAC enforces authority boundaries; agents cannot bypass the gate
