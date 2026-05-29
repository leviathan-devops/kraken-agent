# Dual Plugin Architecture — Kraken v1.2 Firewall v11

## Overview

Kraken requires TWO plugins loaded in specific order:

| Plugin | Role | Load Order |
|--------|------|------------|
| **opencode-subagent-manager** | Container-level parallel execution | FIRST |
| **kraken-firewall** | Orchestration + firewall enforcement | SECOND |

### Why Two Plugins?

Kraken separates execution (spawning containers, running subagents) from orchestration (planning, firewalls, Hive coordination). This allows:

1. **Independent updates** — firewall can be updated without touching subagent execution
2. **Separation of concerns** — subagent-manager handles Docker, firewall handles logic
3. **Clean hook isolation** — no cross-plugin hook conflicts
4. **Firewall can run standalone** — works without subagent-manager for non-orchestration use

---

## Plugin Roles

### opencode-subagent-manager (FIRST)
- `run_subagent_task` — Spawn agent in container
- `run_parallel_tasks` — Parallel task execution
- `cleanup_subagents` — Clean up containers

### kraken-firewall (SECOND)
**Agents:** kraken, kraken-executor, shark-alpha-1/2, manta-alpha-1, shark-beta-1, manta-beta-1/2, manta-gamma-1/2, shark-gamma-1

**Firewall Layers:** L0-L10 + AR (16 layers, 14 arms, 220+ patterns)

**Tools:**
- `spawn_shark_agent` — Alpha cluster (steamroll/build)
- `spawn_manta_agent` — Beta/Gamma (precision/test)
- `spawn_cluster_task` — Generic task assignment
- `get_cluster_status` — Cluster state
- `kraken_hive_search/remember/inject` — Hive Mind tools
- `kraken_brain_status` — Brain health check
- `read_kraken_context` — T2 reference patterns

---

## Config

```json
{
  "model": "opencode/big-pickle",
  "provider": {"opencode": {}},
  "plugin": [
    "file:///root/.config/opencode/plugins/subagent-manager/dist/index.js",
    "file:///root/.config/opencode/plugins/kraken-firewall/dist/index.js"
  ],
  "agent": {
    "kraken": {"mode": "primary", "hidden": false}
  },
  "permission": {"*": {"*": "allow"}}
}
```

---

## Data Flow

```
User → chat.message hook → Kraken orchestrator
    → Planning Brain (task decomposition)
    → spawn_cluster_task → AsyncDelegationEngine
    → subagent-manager (Docker execution)
    → Shark/Manta agents complete work
    → report_to_kraken → System Brain verification
    → Hive Mind (pattern storage)
```

## Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Load order reversed | spawn tools fail silently | subagent-manager FIRST |
| Missing subagent-manager | "wrapper not found" errors | Install both plugins |
| Missing `mode: "primary"` | Kraken not in tab toggle | Add to config |
| Bind mount config | rm -rf destroys host files | Use docker cp |
| Wrapper binary | GLIBC errors | Use baseline binary |
