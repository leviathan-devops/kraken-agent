# TOOLS.md — Kraken Orchestrator Tools Reference

## Orchestration Tools (Kraken Only)

### spawn_shark_agent
**Domain:** Alpha cluster (steamroll/build)
**Use:** Build from scratch, new features, implementation
```
Args: task, clusterId?, instructions?, context?, priority?
Example: spawn_shark_agent({ task: "Build a REST API", clusterId: "cluster-alpha" })
```

### spawn_manta_agent
**Domain:** Beta (precision) / Gamma (testing)
**Use:** Debug, test, verify, analyze
```
Args: task, clusterId?, instructions?, context?, priority?
Example: spawn_manta_agent({ task: "Debug auth failure", clusterId: "cluster-beta" })
```

### spawn_cluster_task
**Domain:** Any cluster (auto-assigned)
**Use:** Generic task assignment with acceptance criteria
```
Args: task, clusterId?, targetAgent?, context?, acceptanceCriteria?, priority?
Example: spawn_cluster_task({ task: "Run audit", acceptanceCriteria: ["0 critical findings"] })
```

### anchor_cluster
**Use:** Bind a cluster to a specific focus/project
```
Args: clusterId, focusName
Example: anchor_cluster({ clusterId: "cluster-alpha", focusName: "kraken-firewall-build" })
```

### aggregate_results
**Use:** Wait for and aggregate multiple task results
```
Args: taskIds, timeoutMs?
Example: aggregate_results({ taskIds: ["task_1", "task_2"], timeoutMs: 60000 })
```

## Monitoring Tools (Kraken Only)

### get_cluster_status
**Use:** Check state of Alpha/Beta/Gamma clusters
```
Args: clusterId? (all clusters if not specified)
Returns: Cluster status, agent load, task queues
```

### get_agent_status
**Use:** Check which agents are busy and what they're doing
```
Returns: Agent availability, current tasks, uptime
```

### kraken_brain_status
**Use:** Check brain initialization and gate status
```
Returns: Brain states, current gate, T2 loaded, T1 generated
```

## Hive Tools (Kraken Only)

### kraken_hive_search
**Use:** Search Hive for patterns, failures, decisions, breakthroughs
```
Args: query, category? (all|patterns|failures|decisions), limit?
Example: kraken_hive_search({ query: "firewall", category: "patterns", limit: 5 })
```

### kraken_hive_remember
**Use:** Store a pattern, failure, decision, or breakthrough
```
Args: key, content, category (pattern|failure|decision|breakthrough), targetId?
Example: kraken_hive_remember({ key: "firewall-blocks", content: "L6 blocks rm -rf opencode config", category: "pattern" })
```

### kraken_hive_inject_context
**Use:** Push Hive context into a task before agent execution
```
Args: taskId, taskDescription, includePatterns?, includeFailures?, includePreviousWork?
Example: kraken_hive_inject_context({ taskId: "task_1", taskDescription: "Build API", includePatterns: true })
```

### kraken_hive_get_cluster_context
**Use:** Get all memories related to a specific cluster
```
Args: clusterId
Returns: Cluster memories, recent tasks, common patterns, known failures
```

## Agent Tools (Shark/Manta Read-Only)

### read_kraken_context
**Use:** Read T2 reference patterns, failures, build chains, rules
```
Args: topic (patterns|failures|build-chain|architecture|alignment-bible|crash-recovery|tui-testing|kraken-rules|compaction-survival|plugin-engineering)
Agent: Shark, Manta (read-only access)
```

### report_to_kraken
**Use:** Report completion, issues, or requests back to Kraken
```
Args: taskId, status (complete|blocked|error|request), details, files?, errorDetails?
Agent: Shark, Manta (communication channel to Kraken)
```

### get_task_context
**Use:** Get injected context from Kraken orchestrator
```
Args: taskId
Agent: Shark, Manta (read context Kraken injected into their task)
```

## Tool Access Matrix

| Tool | Kraken | Shark | Manta | Vanilla |
|------|--------|-------|-------|---------|
| spawn_shark_agent | ✅ | ❌ | ❌ | ❌ |
| spawn_manta_agent | ✅ | ❌ | ❌ | ❌ |
| spawn_cluster_task | ✅ | ❌ | ❌ | ❌ |
| anchor_cluster | ✅ | ❌ | ❌ | ❌ |
| aggregate_results | ✅ | ❌ | ❌ | ❌ |
| get_cluster_status | ✅ | ❌ | ❌ | ❌ |
| get_agent_status | ✅ | ❌ | ❌ | ❌ |
| kraken_brain_status | ✅ | ❌ | ❌ | ❌ |
| kraken_hive_search | ✅ | ❌ | ❌ | ❌ |
| kraken_hive_remember | ✅ | ❌ | ❌ | ❌ |
| kraken_hive_inject_context | ✅ | ❌ | ❌ | ❌ |
| kraken_hive_get_cluster_context | ✅ | ❌ | ❌ | ❌ |
| read_kraken_context | ✅ | ✅ | ✅ | ❌ |
| report_to_kraken | ✅ | ✅ | ✅ | ❌ |
| get_task_context | ✅ | ✅ | ✅ | ❌ |

**L0 Identity Wall:** Non-Kraken agents attempting Hive tools → BLOCKED.

---

*Kraken v1.2 — Central Multi-Brain Orchestrator*
