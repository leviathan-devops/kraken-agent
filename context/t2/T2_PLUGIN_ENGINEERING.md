# T2_PLUGIN_ENGINEERING — Plugin Build & Deploy SOP

## Plugin vs Skill

| | Plugin | Skill |
|---|---|---|
| **Format** | Compiled JS bundle (`dist/index.js`) | Markdown file (`SKILL.md`) |
| **Loaded by** | OpenCode runtime via `opencode.json` | Agent at runtime as knowledge |
| **Provides** | Tools, hooks, runtime behavior | Knowledge, instructions, context |
| **Registration** | `"plugin": ["file:///path/to/dist/index.js"]` | Placed in `~/.hermes/skills/` |
| **Golden Rule** | `SKILL ≠ PLUGIN` — OpenCode cannot load a SKILL.md as a plugin | |

## opencode.json Requirements

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": { "minimax": {} },
  "plugin": [
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/opencode-subagent-manager/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/.../kraken-agent/dist/index.js"
  ],
  "agent": { "architect": { "disable": true } },
  "permission": { "*": { "*": "allow" } }
}
```

**CRITICAL**: Without the `"permission"` block, permission prompts block all tool execution.

## Dual Plugin Architecture

| Plugin | Role | Tools |
|---|---|---|
| **opencode-subagent-manager** (FIRST) | Container-level parallel execution | `run_subagent_task`, `run_parallel_tasks`, `cleanup_subagents` |
| **kraken-agent** (SECOND) | Orchestration & cluster management | `spawn_cluster_task`, `spawn_shark_agent`, `spawn_manta_agent`, `anchor_cluster`, `kraken_brain_status`, `kraken_hive_*` |

### Load order matters: subagent-manager FIRST (base execution), kraken-agent SECOND (orchestration depends on execution layer).

## Data Flow

```
User → chat.message hook → Kraken Agent (orchestration)
  → spawn_cluster_task → AsyncDelegationEngine (in-memory queue)
  → run_subagent_task (via subagent-manager plugin)
  → Docker container spawns actual agent process
  → output retrieval → Evidence Collector → gate evaluation → response
```

## Build Command

```bash
cd ~/OPENCODE_WORKSPACE/...kraken-agent.../
bun build src/index.ts \
  --outdir dist \
  --target bun \
  --format esm \
  --bundle
```

## Deploy Command

```bash
cp dist/index.js ~/.config/opencode/plugins/kraken-agent/dist/index.js
```

## Plugin Upgrade Protocol

1. **REMOVE** old plugin from `opencode.json` (`"plugin": [...]`)
2. **ADD** new plugin path to `opencode.json`
3. **BUILD** new bundle: `bun run build`
4. **DEPLOY** bundle: `cp dist/index.js ~/.config/opencode/plugins/kraken-agent/dist/index.js`
5. **VERIFY** config: `cat opencode.json` — confirm single plugin entry per type
6. **TUI TEST** in Docker container
7. **ROLLBACK** if broken: restore old bundle from `.bak`

## Hook Registration Table

| Hook | When Fires | Blocking? | Kraken Usage |
|---|---|---|---|
| `tool.execute.before` | Before any tool execution | **Yes** | L0-L7 firewall enforcement |
| `tool.execute.after` | After tool execution | No | Evidence collection, output tracking |
| `command.execute.before` | Before bash command | **Yes** | Path protection enforcement |
| `chat.message` | On user message | **Yes** | Identity detection, T1 generation, routing |
| `chat.params` | Before LLM call | No | Context injection |
| `experimental.session.compacting` | Before auto-compaction | No | State preservation, handover package |

## State Directory Structure

```
. kraken-agent/
├── state.json                ← Persistent agent state
├── plan.md                   ← Current build plan
├── evidence/                 ← Gate evidence collection
├── knowledge/                ← Extracted knowledge
├── checkpoints/              ← Session checkpoints
└── delegation-ledger.json    ← Task delegation tracking
```

## Env Vars

```
OPENCODE_CONFIG_DIR=~/.config/opencode/
KRAKEN_HIVE_STORE=~/.local/share/opencode/kraken-hive/
OPENCODE_SESSION_ID={auto-generated per session}
```

## Minimal Plugin Template

```typescript
import { tool, type Plugin, type Hooks } from '@opencode-ai/plugin';
import { z } from 'zod';

export default async function MyPlugin(input): Promise<Hooks> {
  return {
    tool: {
      myTool: tool({
        description: "What it does",
        args: { name: z.string().describe("Param") },
        execute: async (args, ctx) => JSON.stringify({ result: "ok" })
      })
    },
    hook: {
      'chat.message': (ctx) => ctx,          // Pass-through by default
      'tool.execute.before': (ctx) => ctx,    // Pass-through by default
    }
  };
}
```

## Key Gotchas

| Gotcha | Fix |
|---|---|
| Hook returned as array `[(ctx) => {}]` | Hooks are **functions**, not arrays: `(ctx) => {}` |
| Dual plugin loading (v1.1 + v1.2 both active) | Remove old before adding new |
| `opencode run` used for testing hooks | BANNED — hooks don't fire in headless mode |
| Missing permission block causes prompts | Always include `"permission": {"*": {"*": "allow"}}` |
| Plugin path points to folder, not bundle | Must point to `dist/index.js` specifically |
| Experimental hooks break on version bump | Pin to stable hooks only, never ship experimental |
