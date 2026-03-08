# Platform Guide: Amazon Q Developer

## Setup
1. AGENTS.md at repo root provides agent context
2. .amazonq/ directory can hold agent configurations
3. Amazon Q reads markdown files referenced in conversation

## Agent Interaction
- Amazon Q discovers project structure via /dev command
- Reference AGENTS.md explicitly: "Read AGENTS.md and follow the protocols"
- Classification and SDD pipeline work through conversational prompts

## Tool Mapping
| Framework Tool | Amazon Q Equivalent |
|---------------|-------------------|
| read | File reading |
| write | File writing |
| bash | Terminal execution |
| search | Code search |

## Notes
- Amazon Q has CodeWhisperer for inline suggestions
- Agent chat follows AGENTS.md when explicitly referenced
- Pre-commit hooks work normally
