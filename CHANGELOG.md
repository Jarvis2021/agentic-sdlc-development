# Changelog

All notable changes to the Agentic SDLC Framework are documented here.
This project adheres to Semantic Versioning.

## [2.0.0] - 2026-03-08

### Added
- Bootstrap v2.0 with 6-phase architecture (scaffold, context, SDD, governance, traceability, isolation)
- 26 Architecture Decision Records (ADR-001 through ADR-026)
- Scale-adaptive task classification (TRIVIAL/LOW/MEDIUM/HIGH)
- Three-level progressive protocol disclosure (Level 0/1/2)
- Classification-based token budgets (5K/20K/80K/200K)
- SDD pipeline with spec/plan/task templates and CLI (scripts/sdd.sh)
- Review council runner (scripts/council.sh)
- Garbage collection scanner (scripts/gc-scan.sh)
- Post-task cleanup (scripts/post-task-cleanup.sh)
- Claude Code hooks (.claude/settings.json) with PreToolUse safety gates
- JSONL audit logger (.ai/hooks/audit-logger.sh)
- EXIT criteria verification (scripts/verify-exit-criteria.sh)
- Harness Engineering docs (architecture, golden-principles, quality)
- Eval framework scaffold
- Tech debt tracker
- Token logging with alert thresholds
- Platform guides for 5 IDEs
- Determinism documentation and tests

### Changed
- Self-healer protocol: added Rule Zero (preflight), Rule One (autofix-first), Rule Two (circuit breaker), Stage 4b (post-push observation)
- Implementer protocol: added boot sequence, impact analysis, pre/post-commit gates
- Reviewer protocol: added pre-review gate, config drift detection, external review challenge
- Quality gates protocol: added verification commands, blocking enforcement

### Fixed
- PROJ-NNN: 10 failure modes addressed with 8 non-negotiable rules in enforcement-prompt.md

## [1.0.0] - 2026-03-06

### Added
- Initial framework with AGENTS.md, 22 protocols, RBAC, Knowledge Graph
- CLI for project scaffolding (npx @Jarvis2021/agentic-sdlc-development)
- Tech stack detection (Android, iOS, Node, Python, Ruby, Go, Rust, .NET)
- MCP server with 8 tools
- Interactive Knowledge Graph visualization (D3.js)
- GitHub Actions for nightly org scanning
- 177 tests across 6 test files
