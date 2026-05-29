# T2_ALIGNMENT_BIBLE — Kraken Failure Mode Encyclopedia

## 10 Failure Modes

| # | Failure Mode | Root Cause | Correct Fix |
|---|---|---|---|
| 1 | **Fake Task Execution** | `simulateTaskExecution()` returned success after 100ms — no real Docker containers spawned | Always verify Docker process exists after spawn: `docker ps \| grep opencode` |
| 2 | **Dual Plugin Breakdown** | Adding v1.2 plugin without removing v1.1 → both loaded → tool conflicts, config corruption | **EXPLICIT removal** of old plugin before adding new. Single plugin per agent type. |
| 3 | **Evidence Variable Ordering** | `evidence` variable referenced before definition in all Kraken tools → "evidence is not defined" | Define `evidence` before any usage. Hoist initialization to top of execute block. |
| 4 | **Config Corruption** | Adding plugin agents modified `opencode.json` `agents:{}` block incorrectly → agent disappeared from TUI | Never modify agents block programmatically. Manual config only. Verify with `cat opencode.json` after. |
| 5 | **Parallel Tools All Failed** | 3 different tools, 3 different bugs: `spawn_cluster_task` → "Cluster not found", `run_parallel_tasks` → "requires shim", `run_subagent_task` → CLI arg parsing bug | Each tool must be independently tested in TUI. No assuming "one works = all work". |
| 6 | **Hook Format Misunderstanding** | Hooks returned arrays instead of functions → `chat.message: [(ctx) => {...}]` instead of `chat.message: (ctx) => {...}` | Hooks are **functions**, not arrays. Single handler per hook name. |
| 7 | **Experimental Hooks Crash** | Used `experimental.*` hooks that changed API between versions → runtime crash | Pin to stable hooks only. Never ship with experimental hooks. |
| 8 | **Memory Leaks** | Global state accumulated across sessions without cleanup → OOM | Scoped state per session. Always cleanup in `experimental.session.compacting` hook. |
| 9 | **Wrong Agent Versions** | GitHub v1.0 shipped with Python wrapper (never called), v1.1 local had same code → theatrical execution | Verify version by checking git tag + bundle hash. Source-only verification is worthless. |
| 10 | **No Container Testing** | Shipped to production without ever running TUI in Docker → all hooks broken | **Mandatory**: Docker container TUI test before ANY ship. See T2_TUI_TESTING.md. |

## 3 Architecture Principles

1. **Execution > Initiation** — Spawning a task ≠ task complete. Track→Retrieve→Verify→Merge.
2. **Mechanical > Textual** — 90% enforcement via code (firewalls, gates, schemas), 10% via text matching.
3. **Isolation > Integration** — Every component independently testable. No cross-component dependency assumptions.

## Testing Protocol

```
PLAN → BUILD → DEPLOY to Docker → TUI TEST in container → VERIFY hooks fired → SHIP
```
- **NEVER** skip container testing
- **NEVER** use `opencode run` as substitute (hooks don't fire)
- **ALWAYS** verify `tool.execute.before` and `chat.message` hooks fired in TUI output
- Evidence: capture-pane output showing hook activation messages

## Migration Rules

| Rule | Detail |
|---|---|
| **Old plugin REMOVAL** | Remove old plugin from `opencode.json` before adding new. Dual loading = corruption. |
| **Bundle rebuild** | Every source change → `bun run build` → copy `dist/index.js` to plugin path |
| **Config verify** | After any config change: `cat opencode.json` and confirm structure intact |
| **Version bump** | Tag with `git tag vX.Y.Z` AND record bundle hash in BUILD_STATE.txt |
| **Rollback ready** | Keep last known-good bundle at `dist/index.js.bak` before deploying new |
