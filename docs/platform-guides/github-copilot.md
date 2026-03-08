# Platform Guide: GitHub Copilot

## Setup
1. Place agent files in .github/agents/*.agent.md
2. .github/copilot-instructions.md provides global context
3. Skills referenced in copilot-instructions.md are auto-loaded

## Agent Interaction
- In VS Code Copilot Chat: @workspace references project context
- Agent files in .github/agents/ are invocable by name
- Handoffs follow the chain defined in AGENTS.md

## Tool Mapping
| Framework Tool | Copilot Equivalent |
|---------------|-------------------|
| read | #file references |
| search | @workspace search |
| bash | Terminal commands (with approval) |
| askQuestions | vscode/askQuestions |

## Notes
- Copilot does not natively read .ai/ directory -- reference via copilot-instructions.md
- Skills must be listed in copilot-instructions.md for auto-discovery
- Pre-commit hooks work normally via git integration
