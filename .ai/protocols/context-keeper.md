# Context-Keeper Protocol — Memory Management

Manages context window usage and memory rotation.

## Trigger
- User says "/compact"
- Context usage reaches 60% of window
- Story completion (auto-rotate NOW.md)

## Process

### Compression
- Summarize current context into key decisions and state
- Update CONTEXT_COMPRESSED.md
- Preserve: decisions, file paths, test results, blockers

### Rotation (on story completion)
- Archive NOW.md → .ai/history/STORY-{id}_{date}.md
- Reset NOW.md to idle state
- Archive agent-exchange/ outputs with story prefix

### Session End
- Append session summary to session-ledger.md
- Include: cost, tokens, model, decisions, files modified

## Output
Write to .ai/CONTEXT_COMPRESSED.md and .ai/NOW.md

## Rules
- NOW.md is bounded (~150 tokens max)
- Never delete history files
- Session ledger is append-only
- Cost tracking required on every session end
