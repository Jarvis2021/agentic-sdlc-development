# Platform Guide: Cursor

## Setup
1. Open your project in Cursor
2. AGENTS.md is auto-discovered by Cursor's agent chat
3. Protocols in .ai/protocols/ are available via @-mention or file read

## Agent Interaction
- Type in Composer or Chat: "classify this task" to trigger classification
- Reference protocols: "@self-healer.md" or "read .ai/protocols/implementer.md"
- The context-index.yaml is loaded automatically when AGENTS.md is read

## Tool Mapping
| Framework Tool | Cursor Equivalent |
|---------------|-------------------|
| read | Read file tool |
| write | Write/StrReplace tools |
| bash | Shell tool |
| search | SemanticSearch/Grep |
| glob | Glob tool |

## Notes
- Cursor reads project rules from .cursorrules and .cursor/rules/
- AGENTS.md can reference protocols that Cursor will read on demand
- Pre-commit hooks work normally via git integration
