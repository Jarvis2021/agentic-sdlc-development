# Evaluation Framework

Evals measure whether the agentic framework improves output quality over time.

## Eval Types

### 1. Protocol Compliance Eval
- Does the agent classify tasks before acting?
- Does the agent create specs for MEDIUM+ tasks?
- Does the agent run council before committing?

### 2. Code Quality Eval
- Code Health score (target: ≥9.5/10)
- Test coverage (target: ≥70% greenfield, regression for bugs)
- Lint pass rate

### 3. Token Efficiency Eval
- Tokens used vs. budget per classification
- Context utilization at session end (target: <40%)
- Unnecessary protocol loads per session

### 4. Traceability Eval
- % of PRs with complete trace chain (issue → spec → plan → PR)
- % of council reviews with written verdicts
- Mean time to detect/fix governance violations

## Running Evals
```bash
# After a sprint, review traces:
ls .ai/traces/
# Check token logs:
scripts/sdd.sh budget
# Review council outputs:
ls .ai/agent-exchange/reviewer-output*.md
```
