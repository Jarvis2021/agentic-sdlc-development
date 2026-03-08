# Platform Guide: Windsurf (Codeium)

## Setup
1. AGENTS.md at repo root is auto-discovered
2. .windsurfrules file can extend with project-specific rules
3. Cascade (Windsurf's agent) reads project files on demand

## Agent Interaction
- Cascade reads AGENTS.md when referenced
- Protocols can be loaded via "read .ai/protocols/implementer.md"
- Classification prompts work through natural conversation

## Tool Mapping
| Framework Tool | Windsurf Equivalent |
|---------------|-------------------|
| read | File reading |
| write | File writing/editing |
| bash | Terminal commands |
| search | Code search |

## Notes
- Windsurf Cascade has multi-file editing capabilities
- Pre-commit hooks work normally via git integration
- AGENTS.md golden rules apply across all platforms
