# Kraken v1.3 — TOOLS

## Registered Tools (8)

### Orchestration Tools

| Tool | Parameters | Description |
|------|------------|-------------|
| `spawn_cluster_task` | task, taskType, clusterId?, criteria? | Spawn a task on a cluster |
| `spawn_shark_agent` | task, criteria? | Spawn a Shark agent on Alpha cluster |
| `spawn_manta_agent` | task, criteria? | Spawn a Manta agent on Beta cluster |

### Monitoring Tools

| Tool | Parameters | Description |
|------|------------|-------------|
| `get_cluster_status` | (none) | Get status of all clusters |
| `aggregate_results` | taskIds | Aggregate results from completed tasks |
| `report_to_kraken` | taskId, status, output? | Report task completion or blockers |

### Analysis Tools

| Tool | Parameters | Description |
|------|------------|-------------|
| `execution_brain_analyze` | projectRoot | Run RGE+SRE analysis on a project |

### Context Tools

| Tool | Parameters | Description |
|------|------------|-------------|
| `read_kraken_context` | contextFile | Read T2 reference patterns |

## Tool Permissions

ALLOWLIST enforced via `tool.execute.before` hook (Bible §19 TC-4.6).
Only the 8 tools above are allowed. All other tools (bash, write, edit, etc.) are blocked.

## Agent Tool Assignments

| Agent | Tools |
|-------|-------|
| kraken (orchestrator) | All 8 tools |
| kraken-executor | spawn_cluster_task, spawn_shark_agent, spawn_manta_agent, get_cluster_status, aggregate_results, get_agent_status |
| Cluster agents (shark-*, manta-*) | read_kraken_context, report_to_kraken |
