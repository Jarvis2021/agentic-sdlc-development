# Observability Protocol — Session Metrics & Telemetry

Tracks agent performance, cost, and session metrics.

## Trigger (AUTOMATIC)
- After each session (auto)
- User says "cost", "metrics", "observability"

## What Gets Tracked

### Per-Session
- Total tokens (input + output)
- Estimated cost (USD)
- Model used (strongest/fast)
- Duration
- Files created/modified
- Tests run/passed/failed

### Per-Story
- Cumulative cost across sessions
- Total tokens
- Time from plan to ship
- Number of self-heal cycles
- Review Council iterations

### Per-Agent
- Invocation count
- Average tokens per invocation
- Success/failure rate

## Output

### Session Summary (appended to session-ledger.md)
```
## Session Summary | [timestamp]
Cost: $X.XX | Tokens: N in / M out | Model: strongest
Files: created 3, modified 5 | Tests: 42 run, 42 passed
Decisions: 2 (ADR-012, ADR-013)
```

### Cost Report (on "cost" command)
Show cumulative costs by story, agent, and model.

## Rules
- Cost tracking is automatic (no opt-out)
- Session ledger entries are append-only
- Token counts come from model response metadata
- Cost estimates use published model pricing
