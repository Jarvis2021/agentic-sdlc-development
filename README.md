# Agentic SDLC Framework v1.0

[![CI](https://github.com/Jarvis2021/agentic-sdlc-development/actions/workflows/ci.yml/badge.svg)](https://github.com/Jarvis2021/agentic-sdlc-development/actions/workflows/ci.yml)
[![Industry Compliance](https://img.shields.io/badge/industry%20compliance-98%25-brightgreen)]()
[![Agents](https://img.shields.io/badge/agents-22-blue)]()
[![Protocols](https://img.shields.io/badge/protocols-21-blue)]()
[![License: MIT](https://img.shields.io/badge/license-MIT-green)]()

> AI agents embedded across planning, implementation, debugging, review, and release.
> IDE-agnostic. Runtime-backed. Evidence-first.

MIT-licensed and designed for open-source use by any team or individual.

---

## Quick Start

### For New or Existing Projects

```bash
# 1. Clone the framework
git clone https://github.com/Jarvis2021/agentic-sdlc-development.git

# 2. Copy framework files into your project
cp -r agentic-sdlc-development/{AGENTS.md,.ai,rbac-factbook.yaml,.mcp.json,.github,scripts} ./your-project/

# 3. Configure RBAC with your team emails
# Edit rbac-factbook.yaml and add your team:
# annotations:
#   framework_roles: |
#     alice@example.com: architect
#     bob@example.com: dev_lead
#     charlie@example.com: dev_engineer

# 4. Initialize (auto-detects existing code or scaffolds new project)
# Open in any AGENTS.md-compatible IDE and say:
#    "init" — analyze existing codebase
#    "init --repos ../repo1 ../repo2" — multi-repo knowledge graph

# 5. Push to GitHub — CI workflows activate automatically
git add AGENTS.md .ai rbac-factbook.yaml .mcp.json .github scripts
git commit -m "feat: adopt Agentic SDLC v1.0"
git push
```

**What the framework setup does**:
1. Copies framework files (`AGENTS.md`, `.ai/`, `rbac-factbook.yaml`, `.mcp.json`, `.github/workflows/`)
2. Takes 30 seconds and initializes structured runtime state under `.ai/session-state/`
3. Detects your stack (Node.js, Python, Swift, Kotlin, etc.)
4. Registers built-in plugin packs for debugging, browser verification, security, compliance, and semantic code tools

### Runtime Commands

```bash
agentic-sdlc plan checkout-flow --title "Checkout flow hardening" --story PROJ-123
agentic-sdlc resume
agentic-sdlc trace --kind debug --command "npm test" --test-output "FAIL tests/cart.test.js"
agentic-sdlc events --limit 20
agentic-sdlc plugins list
```

---

## What This Framework Includes

This framework turns collaboration and debugging guidance into executable runtime capabilities:

- **Structured session runtime** with plans, traces, approvals, and events under `.ai/session-state/`
- **Debug fabric** that captures command, test, CI, and browser verification evidence in a common schema
- **Plugin packs** for browser verification, security, compliance, JIRA, and semantic engineering
- **Semantic tool abstraction** for symbol search, usage lookup, and rename preview
- **MCP-visible runtime** so host IDEs and external tools can inspect plans, diagnostics, and plugins
- **MIT-friendly distribution** so the framework can be copied, adapted, and reused across personal or commercial repositories

## Open Source Use

This repository is published for open-source adoption under the MIT license declared in `package.json`. It is intended as a generic framework that teams can copy, fork, adapt, and extend without any dependency on private infrastructure or proprietary IDE features.

## What Is Agentic SDLC v1.0?

The Agentic SDLC Framework embeds specialized AI agents at every phase of software development — planning, implementation, testing, review, release, and maintenance. Instead of using AI as a chat assistant, agents operate as autonomous teammates with:

- **Persistent memory** — decisions survive across sessions via `.ai/history/`, `.ai/decisions/`, and `.ai/session-state/`
- **Governance guardrails** — domain-specific rules enforced on every turn (idempotency, contracts, PII policy)
- **Shift-left quality** — Review Council catches bugs before PR, not after
- **CI-powered security** — dependency auditing runs in GitHub Actions, not IDE plugins
- **Structured evidence** — command, test, CI, and browser verification artifacts are captured as typed diagnostics
- **Pack-based extensibility** — debugging, browser, security, compliance, JIRA, and semantic code capabilities can be toggled as plugin packs

### Practical Benefits

| Capability | Before | Now |
|------------|--------|-----|
| **Session continuity** | Markdown-only handoff | Structured plans, approvals, traces, and resumable runtime state |
| **Debugging** | Protocol guidance and CI polling | Typed diagnostics, evidence bundles, and browser-proof workflows |
| **Collaboration** | Manual checkpoints | Event timeline, resume flow, approval queue, plan state |
| **Extensibility** | Copy the whole framework | Enable or disable capability packs with plugin manifests |
| **Code intelligence** | Search-based only | Semantic abstraction with symbol search, usages, and rename preview |

### Why It Exists

| Pain Point | How Framework Solves It |
|------------|------------------------|
| **Context-switch tax** | NOW.md + bounded memory = instant context reload |
| **Knowledge decay** | History files + knowledge graph = zero knowledge loss |
| **Reactive security** | Dependency-Auditor + Security-Scanner = proactive scanning |
| **Contract violations** | Contract-Guard + Pact + Bump.sh = backward compatibility |
| **Data handling under failure** | Audit-ready tracing + idempotent flows = resilient pipelines |

### IDE-Agnostic (1 File, Any IDE)

This framework uses `AGENTS.md` — an open standard supported by modern IDEs with AI agent capabilities. No proprietary plugins, no vendor lock-in. Works in any editor that supports the AGENTS.md specification.

One canonical entry-point file (`AGENTS.md`). Zero drift. Zero maintenance burden per IDE.

---

## Architecture Overview

![Agentic SDLC Architecture](docs/architecture-diagram.svg)

### Runtime Control Plane

The framework now operates as a small control plane rather than a collection of static templates:

- **Control plane**: `AGENTS.md`, CLI, hooks, and MCP entrypoints orchestrate execution
- **Session runtime**: plans, tasks, approvals, traces, and events are persisted under `.ai/session-state/`
- **Debug fabric**: command failures, test failures, CI evidence, and browser verification share a common schema
- **Plugin runtime**: optional packs expose debugging, browser, security, compliance, JIRA, and semantic capabilities
- **Semantic layer**: symbol search, usage lookup, and rename preview can map to host-native APIs when available

### Layered Design

1. **Always Loaded (Bounded)**: `AGENTS.md` + `NOW.md` + `domain-governance.yaml` + `rbac-factbook.yaml` (~1,550 tokens total, never grows)
2. **Runtime State (Executable)**: `.ai/session-state/`, evidence bundles, approvals, traces, plugin registry, and event log
3. **On-Demand Packs**: Protocols, skills, history, decisions, knowledge graph, and plugin capabilities load when needed
4. **CI/CD Layer (IDE-Agnostic)**: GitHub Actions for dependency auditing, validation, coverage, and release enforcement

### Execution Flow
```
User → CLI / AGENTS.md / MCP
     → session runtime records plan, approval, task, trace, event
     → debug fabric captures evidence from tests, CI, browser, commands
     → plugin runtime exposes optional capability packs
     → knowledge graph and governance stay available for cross-repo decisions
```

### Verification Flow
```
Local execution / CI failure
→ diagnostics adapter normalizes evidence
→ trace + event timeline stored in `.ai/session-state/`
→ optional browser pack verifies runtime behavior
→ self-heal and review loops use the same evidence model
```

### Memory Architecture

| Layer | Files | Token Budget | Lifecycle |
|-------|-------|-------------|-----------|
| Always loaded | AGENTS.md + NOW.md + domain-governance.yaml | ~1,550 tokens | Constant |
| Runtime state | Session index, events, plans, traces, approvals | Small JSON records | Updated every run |
| On-demand | Protocols, packs, skills, repo intelligence | Loaded on trigger | Loaded when needed |
| Persistent | History, decisions, knowledge graph | Unbounded | Git-committed |

This repository contains the full control-plane surface for planning, execution, debugging, and extensibility:
- **AGENTS.md** (~1200 tokens, always loaded)
- **Session runtime** in `.ai/session-state/` for plans, tasks, approvals, traces, and events
- **21 protocols** in `.ai/protocols/` (lazy-loaded, includes agent-orchestration)
- **10 skills** in `.ai/skills/` (on-demand)
- **Plugin packs** in `.ai/plugins/` for debug, browser, security, JIRA, compliance, and semantic tooling
- **Schemas** in `.ai/schemas/` for runtime state, plugin manifests, and debug artifacts
- **5 git hooks** in `scripts/hooks/`
- **rbac-factbook.yaml** — role registry
- **.ai/domain-governance.yaml** — domain guardrails
- **.ai/NOW.md** — bounded context (current task only, ~150 tokens)
- **.ai/role-based-prompt-templates.md** — structured prompting guide for all team roles

### Agent Roster (22 Agents)

The framework includes 15 core agents (always available) and 7 extended agents (trigger on demand), organized by SDLC phase.

---

## Agent Descriptions

### Core Agents

| Agent | Trigger | Protocol | What It Does |
|-------|---------|----------|-------------|
| **Planner** | "plan", "design", new feature | planner.md | Creates technical plans with risk assessment |
| **Implementer** | "implement", "build", "fix" | implementer.md | Executes approved plans with E2E verification |
| **Self-Healer** | After every code change (auto) | self-healer.md | Fixes test failures, max 3 retries, Stage 6 E2E proof |
| **Reviewer** | "review", before commit/PR | reviewer.md | 3-perspective Review Council (correctness, standards, security) |
| **Releaser** | "commit", "push", "ship" | releaser.md | Conventional commits, PR creation, no tool attribution |
| **Context-Keeper** | "/compact", 60% context | context-keeper.md | Memory rotation, session cost logging |
| **Merge-Watcher** | After git pull/merge (auto) | merge-watcher.md | Post-merge verification, test suite, graph update |
| **Codebase-Reader** | "init" on existing project | codebase-reader.md | Project analysis, knowledge graph population |
| **ADR-Watcher** | Structural changes, merges | adr-watcher.md | Auto-creates Architecture Decision Records |
| **Quality-Gate** | Phase transitions | quality-gates.md | Blocks phase progress until criteria met |
| **Security-Scanner** | New dependency, before PR | security-scanner.md | Secrets, license, supply chain (IDE-local) |
| **Dependency-Auditor** | Scheduled CI, pre-PR, "deps" | dependency-auditor.md | CVEs, outdated packages (CI-powered) |
| **Knowledge-Graph** | init, story completion, arch changes | knowledge-graph.md | Repository Intelligence Graph with vulnerability overlay |
| **Contract-Guard** | API changes, before PR | contract-guard.md | Pact + Bump.sh + Spectral + encryption salt verification |
| **Story-Runner** | JIRA story ID (PROJ-NNN) | prd-to-stories.md | Full cycle: fetch → plan → implement → verify → ship |

### Extended Agents

| Agent | Trigger | Protocol | What It Does |
|-------|---------|----------|-------------|
| **PRD-to-Stories** | "create stories", PRD provided | prd-to-stories.md | Decomposes PRD into JIRA-ready stories |
| **RBAC** | rbac-factbook.yaml exists | rbac.md | Role-based agent access control |
| **Compliance** | domain-governance.yaml compliance=true | compliance.md | Regulatory compliance verification |
| **Observability** | After each session | observability.md | Cost tracking, token metrics, session telemetry |
| **Release-Gate** | "release", before tag/deploy | release-gate.md | 10 EXIT criteria verification |
| **Benchmark** | "benchmark", on demand | sdlc-benchmark.md | 10-category scoring against 6 industry standards |
| **Orchestrator** | Compound tasks (multi-agent) | agent-orchestration.md | Parallel agent coordination with visible execution plans |

---

## Agent Orchestration (Parallel Execution)

Complex tasks activate the Orchestrator — enabling multiple agents to work simultaneously with transparent handshakes.

### How It Works

```
User: "Review PR #2106 on backend-api"

EXECUTION PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Agents: 4 | Parallel Groups: 2

PARALLEL GROUP 1 (simultaneous):
  ├─ Code-Reviewer    → Diff analysis, logic, edge cases
  ├─ Security-Scanner → CVE check, secrets, OWASP
  └─ Standards-Checker → Naming, patterns, project conventions

SEQUENTIAL (after Group 1 completes):
  └─ Summarizer → Consolidate findings, compute confidence
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Execution Templates

| Task | Parallel Groups | Flow |
|------|:---:|------|
| **Review PR** | 2 | Code-Reviewer + Security-Scanner + Standards-Checker → Summarizer |
| **Implement Story** | 4 | Planner → (Implementer + Contract-Guard) → (Self-Healer → Council → E2E) → Releaser |
| **Fix Bug** | 3 | Codebase-Reader → (Implementer + Security-Scanner) → Self-Healer → E2E → Releaser |
| **Audit Repo** | 2 | (Security-Scanner + Dep-Auditor + Contract-Guard) → KG update → Slack |

### Handshake Visibility

Every agent-to-agent transition produces a structured exchange file in `.ai/agent-exchange/`:

```json
{
  "agent": "code-reviewer",
  "status": "complete",
  "confidence": 88,
  "dimensions": {"logic_coverage": 92, "edge_cases": 85, "test_review": 88, "security": 90},
  "context_hash": "sha256:abc123...",
  "findings": [...]
}
```

### Anti-Patterns (Hard Rules from Production)

| Rule | Bad Pattern | Correct Pattern |
|------|------------|-----------------|
| One-turn autonomy | Ask "Ready?" after each step | Analyse → Execute → Done |
| Use native tools | Python/curl for GitHub | Always use `gh` CLI |
| Fail-fast | Retry same command 5x | After 2 empty outputs, switch strategy |
| Scope discipline | Edit source when asked to review | Analysis ≠ implementation |
| Evidence-based done | "All tests pass" = done | Show runtime proof |

Full protocol: `.ai/protocols/agent-orchestration.md`

---

## Evidence Citations & Confidence Scoring

### Evidence Citation Format

Every agent finding includes verifiable evidence — no claim without proof.

```
proof: E:<source>:<reference>#<anchor>
```

| Source | Example | Quality Tier |
|--------|---------|:---:|
| `file` | `E:file:src/models/User.ts#L42-L50` | STRONG |
| `test` | `E:test:UserTests#testCreateUser` | STRONG |
| `api` | `E:api:GET /health → 200` | STRONG |
| `db` | `E:db:SELECT count(*) FROM users → 42` | STRONG |
| `cmd` | `E:cmd:npm audit --json` | MEDIUM |
| `inference` | Reasoning-based (no verifiable source) | WEAK |

### Confidence Scoring (4-Dimension MIN)

Every agent reports confidence using a structured 4-dimension MIN formula — the weakest dimension becomes the gate.

```
Overall Confidence = MIN(dim_1, dim_2, dim_3, dim_4)

Labels:
  0-59%   → CRITICAL (block, escalate to human)
  60-74%  → LOW (flag for review)
  75-89%  → MEDIUM (proceed with caution)
  90-94%  → HIGH (proceed)
  95-100% → VERY HIGH (auto-proceed)
```

| Agent | Dim 1 | Dim 2 | Dim 3 | Dim 4 |
|-------|-------|-------|-------|-------|
| Code-Reviewer | Logic Coverage | Edge Cases | Test Review | Security Relevance |
| Implementer | AC Coverage | Code Quality | Test Coverage | Evidence Quality |
| Planner | Requirement Clarity | Scope Definition | Risk Assessment | Dependency Mapping |
| Self-Healer | Fix Accuracy | Regression Check | Root Cause | Confidence in Fix |
| Security-Scanner | CVE Coverage | Secret Scan | OWASP Check | Dep Audit |

---

## Role-Based Prompt Templates

A structured prompting guide for all team roles is available at `.ai/role-based-prompt-templates.md`.

### Universal Prompt Structure

```
ROLE: [Your role — Product Owner, PMO, EM, Developer, Tester, Architect]
TASK: [What you want — start with a verb]
SCOPE: [Boundaries — what NOT to touch]
OUTPUT: [Expected format — table, code, JIRA stories, ADR draft]
CONSTRAINTS: [Timeline, repos, branches, files]
AUTONOMY: [full | review-first | plan-only]
```

| AUTONOMY | Meaning |
|----------|---------|
| `full` | Agent executes end-to-end |
| `review-first` | Shows plan, waits for approval (default) |
| `plan-only` | Analysis only, no code changes |

Templates cover: Product Owner (stories, backlog), PMO (sprint health, release readiness), Engineering Manager (PR review, velocity), Developer (implement, fix, refactor), Tester (test plans, regression), Architect (decisions, impact analysis).

---

## Agent Skills (On-Demand Capabilities)

Skills are reusable, on-demand capabilities loaded only when needed. Each skill follows the SKILL.md format with YAML frontmatter.

### Compliance Skills (3)

| Skill | Path | Purpose |
|-------|------|---------|
| `alcoa-plus` | `.ai/skills/compliance/alcoa-plus/SKILL.md` | ALCOA+ compliance principles |
| `audit-trail` | `.ai/skills/compliance/audit-trail/SKILL.md` | Audit trail format and documentation requirements |
| `gxp-21cfr11` | `.ai/skills/compliance/gxp-21cfr11/SKILL.md` | 21 CFR Part 11 and GxP compliance requirements |

### Framework-Core Skills (4)

| Skill | Path | Purpose |
|-------|------|---------|
| `session-startup` | `.ai/skills/framework-core/session-startup/SKILL.md` | 5-step session initialization ritual |
| `phase-handoff` | `.ai/skills/framework-core/phase-handoff/SKILL.md` | Phase transition management |
| `checkpointing` | `.ai/skills/framework-core/checkpointing/SKILL.md` | Session checkpointing and recovery |
| `web-safety` | `.ai/skills/framework-core/web-safety/SKILL.md` | URL validation, citation requirements, compliance |

### Development/Documentation Skills (3)

| Skill | Path | Purpose |
|-------|------|---------|
| `story-breakdown` | `.ai/skills/development/story-breakdown/SKILL.md` | Story format, Gherkin acceptance criteria |
| `test-strategy` | `.ai/skills/development/test-strategy/SKILL.md` | Test pyramid, coverage thresholds, CI enforcement |
| `adr-creation` | `.ai/skills/documentation/adr-creation/SKILL.md` | ADR format (Nygard style) |

Skills are loaded progressively — zero token cost until triggered.

---

## Domain Governance Layer

The governance layer (`domain-governance.yaml`) enforces organization-specific rules on every agent turn.

### Sensitive Data Handling

The framework can enforce PII and sensitive-data guardrails through `domain-governance.yaml`. Logging and tracing policy remains configurable by each team, while agents warn when sensitive data patterns appear to be hardcoded in source code or config.

### Encryption Salt Contract

Cross-platform applications (e.g., iOS and Android) must maintain **identical** encryption salts per environment. Any mismatch = BLOCK. Requires architect approval + ADR.

### Idempotency Enforcement

All data write endpoints MUST use idempotency keys (UUID-based). No insert without `ON CONFLICT DO NOTHING` or equivalent dedup guard.

### 18-Month Mobile Backward Compatibility

- New fields: additive (OK)
- Changed field types: BLOCK
- Removed fields: BLOCK (18-month minimum retention)
- New required fields: BLOCK (mobile clients may not send them)

### Shared Library Model

Changes to shared models in a common library affect **all** consuming applications. All consumers must be built and verified before merging shared library changes.

---

## Dependency Auditing

### CI-Powered Scanning

The Dependency-Auditor runs in **GitHub Actions** — not tied to any IDE or plugin.

| Schedule | Trigger | Action |
|----------|---------|--------|
| Weekly (Mon 6am UTC) | Cron schedule | Full ecosystem scan |
| Pre-PR | Pull request event | Block if critical CVEs |
| On-demand | User says "deps" | IDE-local quick scan |

### Multi-Ecosystem Support

| Ecosystem | Outdated | CVEs | Command |
|-----------|----------|------|---------|
| npm/pnpm/yarn | `npm outdated --json` | `npm audit --json` | Automated |
| Python | `pip list --outdated` | `pip-audit --format=json` | Automated |
| Ruby | `bundle outdated` | `bundle audit check` | Automated |
| .NET | `dotnet list package --outdated` | `dotnet list package --vulnerable` | Automated |
| iOS (CocoaPods) | `pod outdated` | — | Automated |
| Android (Gradle) | `./gradlew dependencyUpdates` | — | Automated |
| Go | `go list -u -m -json all` | `govulncheck -json ./...` | Automated |

### Severity Actions

| Level | Action |
|-------|--------|
| CRITICAL | Block PR + Slack alert immediately |
| HIGH | Block PR until resolved |
| MEDIUM | Warn + require ADR justification |
| LOW | Note in output |

### Knowledge Graph Vulnerability Overlay

Nodes are color-coded by vulnerability status:
- **Green** (`clean`): No vulnerabilities, all deps current
- **Yellow** (`warn`): Outdated deps but no CVEs
- **Red** (`vulnerable`): CVE detected (low/medium)
- **Pulsing Red** (`critical`): Critical CVE detected

---

## Knowledge Graph (RIG)

The **Repository Intelligence Graph** is a structured map of codebase architecture, dependencies, and decisions across all your repositories.

### How It Works
- **On init**: Codebase-Reader analyzes project structure → creates nodes/edges
- **On story completion**: Story-Runner adds story→file links
- **On architecture change**: ADR-Watcher links decisions to affected modules
- **On CI audit**: Dependency-Auditor updates vulnerability metadata per node
- **Multi-repo**: `init --repos path1 path2 ...` builds cross-repo dependency graph

### Node Types
`repo` | `module` | `service` | `contract` | `decision`

### Edge Types
`depends_on` | `calls` | `shares` | `decided_by`

### Knowledge Graph Sample

The repository includes a sample knowledge graph JSON that can be inspected locally or reused by your own tooling:

Features:
- **Repositories** rendered as force-directed nodes, color-coded by layer (Mobile, Gateway, Backend, Web, Tooling)
- **Dependency connections** with directional particles (API calls, event streams, SDK dependencies)
- **Risk overlay** — hover any node to see risks; filter to show only HIGH-risk nodes
- **Layer focus** — isolate Mobile or Backend sub-graphs
- **Portable data source** — `knowledge-graph.json` can be rendered by any local or hosted graph viewer you choose

Data source: `docs/knowledge-graph/knowledge-graph.json` (manually curated sample data for v1.0)

---

## Delivery Flow

```
PRD → stories → plan → implement → test/self-heal → E2E-verify → Review Council → commit → push → PR
                                                          ↑
                                                 Stage 6: E2E proof required
                                                 (DB query, API call, or UI load)
                                                 "tests pass" ≠ "feature works"
```

Every feature goes through this pipeline. The Quality-Gate blocks transitions between phases until criteria are met. Self-Healer has a **Stage 6** requirement: runtime evidence (not just passing tests) before declaring "done."

---

## Review Council

Runs **BEFORE** every PR. 3 virtual reviewers with full project context:

| Perspective | What It Checks |
|-------------|---------------|
| **Correctness** | Logic errors, edge cases, null handling, race conditions, idempotency |
| **Standards** | Naming, patterns, DRY, SOLID, project conventions |
| **Security** | PII exposure, encryption integrity, secrets, OWASP, data safety |

**Goal**: Zero surprise comments on GitHub PR reviews.

- **MUST-FIX**: Blocks commit. Auto-fixed if possible.
- **SHOULD-FIX**: Applied if trivial. Logged if deferred.
- **NOTE**: Informational only.

---

## Quick Commands

| Command | Action |
|---------|--------|
| `init` | New project: scaffold. Existing: analyze + populate knowledge graph |
| `init --repos path1 path2` | Multi-repo setup with cross-dependency mapping |
| `PROJ-NNN` (e.g. PROJ-NNN) | Fetch JIRA story → plan → implement → ship |
| `plan X` | Create technical plan |
| `implement` | Execute approved plan |
| `fix X` | Fix bug, auto self-heal + E2E verify |
| `create stories from PRD` | PRD → stories → JIRA |
| `review` | Review Council + architecture check |
| `ship` | test → E2E verify → council → commit → push → PR |
| `/compact` | Compress context, update NOW.md |
| `status` | Story, branch, coverage, metrics |
| `rollback` | Show rollback options |
| `decisions` | List all ADRs |
| `audit` | Security-Scanner + Dependency-Auditor + Contract-Guard |
| `deps` | Trigger Dependency-Auditor scan |
| `benchmark` | SDLC benchmark scoring (10 categories) |
| `release` | Release-Gate (10 EXIT criteria) |
| `freeze` | Create/view architecture freeze |
| `unfreeze` | Request architecture unfreeze (architect only) |
| `cost` | Session cost summary (tokens, USD, model) |
| `ledger` | Recent session ledger entries |

---

## CI/CD Integration

GitHub Actions workflows for automated quality checks.

### Workflows

| Workflow | Triggers | Jobs |
|----------|----------|------|
| **`ci.yml`** | PR, push to main/develop | 4 jobs: lint, test (95% coverage), security audit, framework validation |
| **`dependency-audit.yml`** | Weekly schedule, manual | Outdated deps + CVE scan (npm, pip, bundler, etc.) |
| **`security-scan.yml`** | Mon + Thu 7am UTC, manual | Cross-repo OWASP/CVE/SAST scan, KG update, Slack alerts |
| **`update-knowledge-graph.yml`** | Weekly (Mon 6am UTC), manual | Validate + timestamp `knowledge-graph.json`, commit sample updates |

### CI Jobs Breakdown

**Job 1: Lint & Build** — Fast feedback
- Node.js: `npm run lint`, `npm run build`
- Python: `ruff check .`

**Job 2: Test & Coverage** — Quality gate
- Node.js: `npm run test:coverage` (95% threshold)
- Python: `pytest --cov --cov-fail-under=95`

**Job 3: Security & Dependency Audit** — Vulnerability scanning
- Node.js: `npm audit`
- Python: `pip-audit`
- Secrets scanning: Trufflehog

**Job 4: Framework Validation** — Structural checks
- RBAC configuration validation (`rbac-factbook.yaml`)
- AGENTS.md existence check
- IDE-agnostic enforcement (no IDE-specific refs)

CI failures block PR merge. All checks must pass before release.

---

## Multi-Repo Support

The framework supports organizations with multiple repositories across different layers:

| Layer | Example Repos |
|-------|---------------|
| **Mobile** | `mobile-ios`, `mobile-android`, `shared-lib` |
| **Gateway** | `api-gateway`, `auth-service` |
| **Backend** | `core-api`, `analytics-service`, `notification-service`, `search-service` |
| **Web** | `web-app`, `admin-dashboard`, `settings-portal` |
| **Tooling** | `agentic-sdlc-development`, `design-system` |

### Cross-Repo Knowledge Graph

Run `init --repos ../frontend-app ../backend-api ../shared-lib ...` to build a unified knowledge graph with:
- Cross-repo dependency edges
- Shared contract detection (shared-lib → consumer apps)
- Encryption salt sync verification
- Aggregated vulnerability overlay

### Contract Testing

| Tool | Purpose |
|------|---------|
| **Pact** | Consumer-driven contract tests (mobile ↔ backend) |
| **Bump.sh** | Breaking change detection in OpenAPI |
| **Spectral** | OpenAPI linting with custom rules |

---

## Industry Best-Practice Scoring

| Standard | Coverage | Score | Key Evidence |
|----------|----------|-------|-------------|
| **IEEE 12207** | All 17 processes | 97% | Agent protocols map to all lifecycle processes |
| **OWASP Secure SDLC** | All 7 phases | 100% | Security-Scanner + Dependency-Auditor + Contract-Guard |
| **NIST SSDF** | All 4 practice areas | 97% | Governance config, SBOM, Review Council, Dependency-Auditor |
| **Google DORA** | 4 key metrics | Improved | Faster deploys, reduced lead time, lower failure rate, faster recovery |
| **ISO/IEC 25010** | 8 characteristics | 96% | Reliability, security, maintainability, portability |
| **ALCOA+** | 9 principles | 100% | Session ledger, git timestamps, append-only audit trail |

**Overall Score: 98% industry standard compliance**

### Gaps (2%)
- Formal supplier/vendor management (assumes org-level process)
- Formal training records (assumes org onboarding)

### Strengths
- 100% OWASP Secure SDLC coverage
- 100% ALCOA+ compliance mapping (audit-ready)
- CI-powered security (not IDE-dependent)
- Multi-repo knowledge graph with vulnerability overlay
- Domain-specific governance guardrails
- Session ledger with cost tracking
- Release-Gate with 10 EXIT criteria
- SDLC benchmark auto-scoring
- Architecture freeze protocol
- RBAC via rbac-factbook.yaml
- Deterministic agent handoffs

---

## RBAC via rbac-factbook.yaml

The **Role-Based Access Control** system uses `rbac-factbook.yaml` to define team roles and enforce access boundaries.

### Roles

| Role | Agents Available | File Scope | Can Freeze |
|------|-----------------|------------|-----------|
| **architect** | All agents | All files | Yes |
| **dev_lead** | Planner, Implementer, Self-Healer, Reviewer, Releaser, Story-Runner, Knowledge-Graph | `src/`, `tests/`, `docs/` | No |
| **dev_engineer** | Implementer, Self-Healer | `src/`, `tests/` | No |
| **test_engineer** | Self-Healer, Quality-Gate | `tests/` | No |

### How It Works
1. Agent reads `rbac-factbook.yaml` on every invocation
2. Resolves user identity via `git config user.email`
3. Checks requested agent + target files against role permissions
4. **Permitted** → proceed. **Denied** → BLOCK with explanation.

### Example
> A `dev_engineer` attempts to modify `AGENTS.md` → **RBAC BLOCKED**: Your role (dev_engineer) cannot modify AGENTS.md. Required: architect.

---

## Git Hooks (RBAC + Session Tracking)

Git hooks enforce RBAC and track session activity for ALCOA+ compliance.

### 5 Hook Scripts

| Hook | Purpose | Location |
|------|---------|----------|
| `pre-commit.sh` | RBAC enforcement (role-based file access control) | `scripts/hooks/pre-commit.sh` |
| `post-checkout.sh` | RBAC reminder after branch checkout | `scripts/hooks/post-checkout.sh` |
| `session-tracker.sh` | Manual session start/end logging | `scripts/hooks/session-tracker.sh` |
| `context-monitor.sh` | Session telemetry, runtime pressure checks, approval/checkpoint warnings | `scripts/hooks/context-monitor.sh` |
| `emergency-checkpoint.sh` | Pre-context-reset checkpoint creation | `scripts/hooks/emergency-checkpoint.sh` |

### Installation

To install as git hooks:

```bash
cd <your-project-root>
ln -s ../../scripts/hooks/pre-commit.sh .git/hooks/pre-commit
ln -s ../../scripts/hooks/post-checkout.sh .git/hooks/post-checkout
```

For manual use:

```bash
./scripts/hooks/session-tracker.sh          # Start session logging
./scripts/hooks/context-monitor.sh          # Check session telemetry pressure
./scripts/hooks/emergency-checkpoint.sh     # Create checkpoint
```

Hooks are IDE-agnostic and work on any platform with bash.

---

## Session Ledger & Cost Tracking

The session ledger (`.ai/session-ledger.md`) is an **append-only** audit trail logging every agent action. It is complemented by `.ai/session-state/`, which stores the executable runtime state used by `plan`, `resume`, `trace`, `events`, and plugin workflows.

### What Gets Logged

| Field | Example |
|-------|---------|
| Timestamp | System-generated (not LLM-generated) |
| Agent | Planner, Implementer, Self-Healer, etc. |
| Phase | plan, implement, review, ship |
| Story | PROJ-NNN |
| Decision | "Use repository pattern for data access" |
| Rationale | "Decouples business logic from persistence (ADR-007)" |
| Files | src/repos/, src/services/ |
| Cost | ~0.12 USD |
| Tokens | 4,200 in / 1,800 out |
| Model | strongest / fast |

### ALCOA+ Compliance

| Principle | Implementation |
|-----------|---------------|
| **A**ttributable | Agent name + user email from rbac-factbook.yaml |
| **L**egible | All outputs in markdown |
| **C**ontemporaneous | System timestamps via git hooks |
| **O**riginal | Append-only (never edited) |
| **A**ccurate | Review Council + E2E verification + configured coverage threshold |
| **C**omplete | Quality-Gate blocks until all criteria met |
| **C**onsistent | Same protocols across all sessions |
| **E**nduring | Git-committed (persists across branches) |
| **A**vailable | In-repo (no external dependencies for audit) |

---

## Release-Gate & SDLC Benchmark

### Release-Gate (10 EXIT Criteria)

Every release must pass ALL criteria before tag/deploy:

| # | Criterion | Check |
|---|-----------|-------|
| 1 | All tests pass | Test suite exit 0 |
| 2 | Coverage meets project threshold | Coverage report + project config |
| 3 | Zero critical/high CVEs | Dependency-Auditor |
| 4 | Review Council passed | No MUST-FIX remaining |
| 5 | E2E verification evidence | Runtime proof per feature |
| 6 | Contract-Guard passed | Pact + Bump.sh + Spectral |
| 7 | Architecture freeze respected | No violations |
| 8 | ADRs documented | All structural decisions |
| 9 | Session ledger current | All sessions logged |
| 10 | Version bump consistent | Files aligned |

### SDLC Benchmark (10 Categories)

On-demand scoring against industry standards:

| # | Category | Max Score |
|---|----------|-----------|
| 1 | ADR Documentation | 10 |
| 2 | Story Breakdown | 10 |
| 3 | Commit Quality | 10 |
| 4 | Test Discipline | 10 |
| 5 | Planning Discipline | 10 |
| 6 | Error Correction | 10 |
| 7 | Security Posture | 10 |
| 8 | Documentation Completeness | 10 |
| 9 | Role-Based Design | 10 |
| 10 | AI-Assisted Quality | 10 |

Reports generated to `.ai/releases/` and `.ai/benchmarks/`.

---

## Architecture Freeze Protocol

After planning phase is approved:
1. Agent creates `.ai/ARCHITECTURE-FREEZE.md` listing frozen decisions
2. PRs changing frozen files → **BLOCKED** by Review Council
3. Unfreeze requires **architect approval** + ADR documenting why

Prevents mid-sprint architectural drift. Only architects (per rbac-factbook.yaml) can freeze/unfreeze.

---

## How This Repo Self-Updates

| Event | Auto-Action |
|-------|------------|
| Git commit (post-commit hook) | Update knowledge graph nodes |
| CI dependency audit (weekly) | Update vulnerability overlay |
| Story completion | Add story→file links to graph |
| ADR creation | Link ADR to affected modules |
| Dependency change | Rebuild sub-graph |

---

## Adoption Guide

1. **Clone**: `git clone https://github.com/Jarvis2021/agentic-sdlc-development.git`
2. **Copy files**: Copy `AGENTS.md`, `.ai/`, `rbac-factbook.yaml`, `.mcp.json`, `.github/`, and `scripts/` into your project
3. **Configure Slack**: Set `SLACK_WEBHOOK_URL` as a GitHub secret for audit alerts
4. **Configure RBAC**: Update `rbac-factbook.yaml` with your team emails and roles (see CONTRIBUTING.md)
5. **Initialize**: Open your project in any AGENTS.md-compatible IDE and say `init` (or `init --repos path1 path2` for multi-repo)
6. **Push**: Commit and push — CI workflows activate automatically

---

## Team Workflow

```
Engineer sees JIRA story
    → pastes story ID (e.g. PROJ-NNN) into chat
    → agent fetches story from JIRA via MCP
    → Planner creates technical plan
    → engineer reviews and says "implement"
    → Implementer builds + tests + verifies E2E
    → Review Council reviews (correctness, standards, security)
    → engineer says "ship"
    → Releaser creates PR with story ID
    → JIRA story moves to "In Review"
```

---

## Production Lessons

Hard-won patterns from production development:

1. **E2E verification is non-negotiable** — "499 tests passed" is not evidence. "curl returned 200 with `{uuid: ...}`" IS evidence.
2. **Verify assumptions before fixing** — Query the DB, read the config, check the env var. Never assume what a value contains at runtime.
3. **Parameterized edge case tests** — Filename parsing, UUID derivation, suffix stripping — all MUST have parameterized tests covering ALL variants.
4. **Contract testing is critical** — Mobile apps may be 3+ App Store versions behind. Breaking API changes silently break end users' devices.

---

## Contributing

### Proposing New Agents or Skills
1. Create an ADR in `.ai/decisions/` explaining the need
2. Write the protocol in `.ai/protocols/` or skill in `.ai/skills/`
3. Update AGENTS.md agent table
4. Submit PR with evidence of testing

### Updating Governance Layer
- Requires **architect** role (per rbac-factbook.yaml)
- Changes to `domain-governance.yaml` require ADR
- Architecture freeze must be respected

### Structural Changes
- **ADR required** for any change to project structure, dependencies, or patterns
- Architecture freeze blocks structural changes until unfreeze

---

## FAQ

### Q: Do I need to install anything to use this framework?

**A**: Just Git. Clone the repository with `git clone https://github.com/Jarvis2021/agentic-sdlc-development.git`, then copy the framework files into your project. Works in any AGENTS.md-compatible IDE.

### Q: How is this different from AI coding assistants?

**A**: AI coding assistants provide code suggestions and chat. This framework provides **persistent memory, governance guardrails, RBAC, audit trails, and shift-left quality**. It's an SDLC *framework*, not just a chat interface.

### Q: Does this work with my existing codebase?

**A**: Yes. Run `init` to analyze your existing codebase. The framework populates the knowledge graph, creates ADRs for current architecture, and integrates with your existing workflow.

### Q: Can I use this without GitHub Actions?

**A**: Yes. The CI workflows are optional. You can use the framework locally with manual session tracking via git hooks.

### Q: What if my team doesn't want RBAC?

**A**: RBAC is optional. If `rbac-factbook.yaml` doesn't exist, agents skip role checks. All agents remain available to all users.

### Q: How do I contribute to the framework?

**A**: See `CONTRIBUTING.md`. Open an issue first to discuss your proposal, then submit a PR.

### Q: How do I upgrade from v1.0 to future versions?

**A**: Future versions will include a migration guide in `CHANGELOG.md`. Pull the latest from the repository and copy updated framework files into your project.

---

## License

[MIT](LICENSE)

---

## Contact

- **GitHub**: [github.com/Jarvis2021/agentic-sdlc-development](https://github.com/Jarvis2021/agentic-sdlc-development)
- **Issues**: [github.com/Jarvis2021/agentic-sdlc-development/issues](https://github.com/Jarvis2021/agentic-sdlc-development/issues)
