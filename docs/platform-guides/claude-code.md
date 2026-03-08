# Platform Guide: Claude Code (claude.ai/code)

## Setup
1. CLAUDE.md or AGENTS.md at repo root is auto-loaded
2. Place agent definitions in .claude/agents/*.md for structured agent routing
3. .claude/settings.json configures hooks (PreToolUse, PostToolUse, Stop)

## Agent Interaction
- Claude Code reads AGENTS.md on session start
- Use /agents to list available agents
- Agent-to-agent handoffs via agent-exchange files

## Tool Mapping
| Framework Tool | Claude Code Equivalent |
|---------------|----------------------|
| read | Read tool |
| write | Write tool |
| edit | Edit tool |
| bash | Bash tool |
| search | Grep/Glob tools |

## Hooks
.claude/settings.json defines:
- PreToolUse: blocks destructive commands (rm -rf, writing secrets)
- PostToolUse: reminds about testing after code changes
- Stop: runs post-task cleanup
