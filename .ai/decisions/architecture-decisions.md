# Architecture Decision Records — Platform Agentic SDLC Framework v1.0

This document records the foundational architectural decisions made during the design of the Platform Agentic SDLC Framework. Each ADR captures the context, decision, alternatives, and consequences.

---

## ADR-001: AGENTS.md as Universal Agent Instruction Format

**Date**: 2026-03-04
**Status**: Accepted
**Author**: Platform Architecture Team

### Context

The framework needed a single, portable way to instruct AI agents across different IDEs and platforms. Vendor-specific formats would fragment the framework and force teams to maintain separate instruction sets for each tool.

### Decision

Adopt AGENTS.md as the universal agent instruction format. This open-standard file is read by the agent on every turn, defines the boot sequence, and references protocol files on demand. The format is documented in the framework and works in any AGENTS.md-compatible editor.

### Alternatives Considered

- Vendor-specific instruction files: Not portable across different AI coding platforms
- Product-specific configuration formats: Would require separate configs for each platform
- **Proprietary config files (e.g., JSON/YAML)**: Less human-readable and harder for teams to edit directly.

### Consequences

- Framework works in any AGENTS.md-compatible editor without modification.
- Teams maintain a single instruction file; no per-platform duplication.
- New platforms can adopt the framework by implementing AGENTS.md support.

---

## ADR-002: Retrieval-First Routing With Bounded Guardrails

**Date**: 2026-03-04
**Status**: Accepted
**Author**: Platform Architecture Team

### Context

Loading all protocol files on every agent turn would cause token bloat as the framework grows. Fixed prompt bundles also age badly because agents often need only a small subset of the available guidance and runtime evidence.

### Decision

Implement retrieval-first routing: `AGENTS.md` stays small, runtime state is read from `.ai/session-state/`, and protocols or governance files are retrieved only when the task requires them. Token budgets remain as operational guardrails, not as the primary architectural interface.

### Alternatives Considered

- **Load all protocols on every turn**: Rejected due to token bloat and cost scaling with protocol count.
- **Single monolithic file**: Rejected; would exceed context limits and violate separation of concerns.
- **Dynamic protocol selection by AI**: Rejected; adds latency and complexity; explicit triggers are more predictable.

### Consequences

- Agents begin from a small router plus structured runtime state.
- Protocols and governance files load selectively, reducing noise and stale context.
- Token budgets still cap cost and encourage compaction, but retrieval rules define behavior.

---

## ADR-003: Protocol Files Over Inline Instructions

**Date**: 2026-03-04
**Status**: Accepted
**Author**: Platform Architecture Team

### Context

AGENTS.md could become a monolithic file containing all agent rules, triggers, and workflows. This would make it hard to maintain, evolve, and reason about individual agent behaviors.

### Decision

Define agent behavior in separate `.ai/protocols/*.md` files. Each protocol (e.g., planner.md, implementer.md, self-healer.md) is a standalone document with trigger conditions, rules, and deliverables. AGENTS.md contains only the boot sequence, retrieval policy, and lookup pointers that map tasks to optional deeper workflows.

### Alternatives Considered

- **Monolithic AGENTS.md with all rules**: Rejected; would grow unbounded and become unmaintainable.
- **Protocols embedded in code**: Rejected; non-technical stakeholders need to read and modify protocol content.
- **Database-stored protocols**: Rejected; version control and diff are essential for protocol evolution.

### Consequences

- AGENTS.md stays small and focused on boot and routing.
- Protocols evolve independently; changes to one protocol do not affect others.
- Teams can version, diff, and review protocol changes as code.

---

## ADR-004: CI-Powered Dependency Auditing Over IDE Plugins

**Date**: 2026-03-04
**Status**: Accepted
**Author**: Platform Architecture Team

### Context

Dependency vulnerability scanning and outdated package detection needed to run consistently across the team. IDE plugins vary by platform and may not be installed or configured uniformly.

### Decision

Run CVE and outdated dependency scanning in GitHub Actions. Workflows execute on schedule (e.g., daily) and on every PR. Results are written to `.ai/dependency-status.json` for consumption by agents and dashboards. Severity levels (green/yellow/red/pulsing-red) are defined in the framework.

### Alternatives Considered

- **IDE-specific vulnerability plugins**: Rejected; not all team members use the same IDE; plugins may be disabled or misconfigured.
- **Manual audit**: Rejected; does not scale with dependency churn.
- **Third-party SaaS dashboard only**: Rejected; agents need local access to results for knowledge graph overlay.

### Consequences

- IDE-agnostic; works regardless of team tooling.
- Runs on schedule and on every PR; no reliance on developer discipline.
- Results in `.ai/dependency-status.json` enable agent-driven architecture views with security overlay.

---

## ADR-005: RBAC via Separate rbac-factbook.yaml

**Date**: 2026-03-04
**Status**: Accepted
**Author**: Platform Architecture Team

### Context

The framework needed RBAC (role-based access control) for agent actions and permissions. The organization already uses `factbook.yaml` for Backstage/DevOps Central. Overloading it with RBAC fields could cause conflicts and schema drift.

### Decision

Create a separate `rbac-factbook.yaml` for RBAC configuration. Keep `factbook.yaml` for Backstage/DevOps Central and other org tooling. RBAC protocol loads from `rbac-factbook.yaml` when enabled; `factbook.yaml` remains unchanged.

### Alternatives Considered

- **Overload factbook.yaml with RBAC fields**: Rejected; schema conflicts with org tooling; risk of breaking Backstage integrations.
- **Single monolithic factbook**: Rejected for same reasons.
- **RBAC in project-config.yaml**: Rejected; project config is team-level; RBAC may need org-level definitions.

### Consequences

- Clean separation of concerns; no conflicts with org tooling.
- RBAC can evolve independently; factbook.yaml remains stable for Backstage.
- RBAC protocol is optional; enabled only when rbac-factbook.yaml exists.

---

## ADR-006: Zero Data Loss PII/PII Policy

**Date**: 2026-03-04
**Status**: Accepted
**Author**: Platform Architecture Team

### Context

The framework needed to balance PII/PII compliance with operational observability. Blocking all PII patterns from logs would break production tracing and debugging. Blocking nothing would violate compliance.

### Decision

Adopt a zero-data-loss policy: PII fields (user_name, DOB, SSN, etc.) are allowed in runtime logs with WARN (not HARD_BLOCK). Agents warn when PII patterns appear in source code literals. Telemetry and tracing continue to function for debugging; the agent surfaces warnings for human review rather than blocking execution.

### Alternatives Considered

- **HARD_BLOCK on all PII patterns**: Rejected; would break production tracing when legitimate identifiers are logged for debugging.
- **No PII detection**: Rejected; compliance risk.
- **Audit-only (no warnings)**: Rejected; teams need real-time feedback during development.

### Consequences

- Telemetry works for debugging; no blocking of legitimate runtime logs.
- Agent warns on source code literals only; human review catches issues.
- ALCOA+ compliance supported via session ledger and audit trail.

---

## ADR-007: Review Council Over Automated Linting

**Date**: 2026-03-04
**Status**: Accepted
**Author**: Platform Architecture Team

### Context

Linting alone catches style violations and some bugs but misses logic errors, race conditions, and security vulnerabilities. Teams need higher assurance before PR submission.

### Decision

Implement a 3-perspective AI Review Council (correctness, standards, security) that runs before every PR. Each perspective reviews the full diff with project context. MUST-FIX items block or auto-fix; SHOULD-FIX items are applied if trivial. The goal is zero surprise comments on GitHub PR reviews.

### Alternatives Considered

- **Lint-only approach**: Rejected; catches style, not logic; does not address security or architecture.
- **Post-PR human review only**: Rejected; feedback comes too late; rework is costly.
- **Single AI reviewer**: Rejected; multiple perspectives reduce blind spots and improve coverage.

### Consequences

- Catches logic errors, race conditions, and security issues, not just style violations.
- Shift-left quality; issues found before PR, not after.
- Zero surprise PR comments as the goal; reduces review friction.

---

## ADR-008: Session Ledger as Append-Only Audit Trail

**Date**: 2026-03-04
**Status**: Accepted
**Author**: Platform Architecture Team

### Context

The framework needed an audit trail for agent actions, decisions, and cost tracking. Per-session log files would fragment the audit and make it hard to search across sessions.

### Decision

Log all agent actions to a single `.ai/session-ledger.md` file. The file is append-only and never edited. Each entry includes timestamp, action, agent, and relevant metadata. Entries are never deleted or modified; history is preserved for audit and compliance.

### Alternatives Considered

- **Per-session log files**: Rejected; harder to search; grep across many files is cumbersome.
- **Database-stored ledger**: Rejected; version control and diff are essential; file-based is simpler for audit.
- **Editable ledger**: Rejected; violates ALCOA+ (attributable, legible, contemporaneous, original, accurate).

### Consequences

- Single file for cost tracking, decision audit, and ALCOA+ compliance.
- Append-only ensures integrity; no tampering.
- Searchable across all sessions; supports compliance and cost analysis.

---

## ADR-009: E2E Verification as Non-Negotiable Stage 6

**Date**: 2026-03-04
**Status**: Accepted
**Author**: Platform Architecture Team

### Context

The Self-Healer and completion criteria needed a clear definition of "done." Unit tests alone can pass while the system is broken (e.g., DB schema mismatch, API contract drift, UI not loading).

### Decision

E2E verification is required as Stage 6 in the execution flow. Self-Healer must obtain runtime proof (DB query, API call, UI load) before declaring "done." Unit test pass is necessary but not sufficient. Evidence must include at least one runtime proof (e.g., "curl returned 200," "API response matches schema," "UI loads without error").

### Alternatives Considered

- **Unit test pass as sufficient evidence**: Rejected; tests can pass while integration is broken.
- **Manual verification only**: Rejected; does not scale; not automatable.
- **Optional E2E**: Rejected; "optional" becomes "never" in practice.

### Consequences

- "499 tests passed" is not evidence; "curl returned 200" IS evidence.
- Runtime proof reduces false positives; Self-Healer does not declare done without it.
- Aligns with regulated SDLC requirements for verification evidence.

---

## ADR-010: Knowledge Graph with Vulnerability Overlay

**Date**: 2026-03-04
**Status**: Accepted
**Author**: Platform Architecture Team

### Context

Architecture views and security views were initially conceived as separate dashboards. Teams would need to switch between them to understand both structure and risk.

### Decision

Integrate dependency audit results into the knowledge graph. Each node (service, package, library) is overlaid with a vulnerability status: green (no issues), yellow (outdated), red (CVE), pulsing-red (critical CVE). The architecture view and security view are unified in a single graph.

### Alternatives Considered

- **Separate vulnerability dashboard**: Rejected; context switching; no spatial relationship between architecture and risk.
- **Vulnerability-only view**: Rejected; loses architecture context.
- **Text-only dependency report**: Rejected; graph visualization improves comprehension.

### Consequences

- Architecture view and security view are unified; one graph shows both.
- Dependency status from `.ai/dependency-status.json` drives overlay colors.
- Reduces cognitive load; teams see structure and risk at a glance.

---
