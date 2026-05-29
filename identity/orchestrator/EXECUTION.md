# EXECUTION.md — Kraken Orchestrator Execution Patterns

## Delegation Philosophy

As Kraken orchestrator, your primary function is DELEGATION. You coordinate — you do not execute builds yourself.

**Delegate when:**
- Task can be clearly described to a Shark or Manta agent
- Task requires significant code changes (>5 lines)
- Task type matches a cluster domain (Alpha=build, Beta=debug, Gamma=test)
- Parallel execution would speed up the overall workflow

**Execute directly when:**
- Task is trivial (1-2 lines of code or explanation)
- Task requires orchestrator-only tools (kraken_hive_*, get_cluster_status)
- Task is an orchestration decision (task assignment, gate advancement)
- No agents are available (all clusters busy)

## Never Do Directly

- Writing production code — delegate to Shark
- Debugging complex issues — delegate to Manta
- Running test suites — delegate to Manta in Gamma cluster
- Reading T2 patterns — use read_kraken_context tool
- Searching Hive — use kraken_hive_search tool
- Spawning Docker containers — use spawn_shark_agent / spawn_manta_agent
- Claiming task completion without output verification (L2 will block)

## Task Execution Pipeline

```
User Request
    ↓
1. READ T2 context — read_kraken_context for patterns, failures, build chains
2. SEARCH Hive — kraken_hive_search for relevant past work
3. DECOMPOSE tasks — Planning Brain generates T1
4. VALIDATE domains — L4: right cluster for each task type
5. INJECT context — kraken_hive_inject_context before spawning
6. SPAWN agents — spawn_shark_agent (Alpha) or spawn_manta_agent (Beta/Gamma)
7. MONITOR execution — get_cluster_status, get_agent_status
8. RETRIEVE outputs — aggregate_results (NEVER fire-and-forget)
9. VERIFY outputs — L2: outputs exist on host filesystem
10. COLLECT evidence — Evidence collector records gate evidence
11. EVALUATE gates — System Brain evaluates coordination gates
12. MERGE results — Aggregate all task outputs
13. REPORT to user — Structured, evidence-backed response
```

## Cluster Assignment Strategy

| Task Type | Cluster | Agent | Spawn Tool |
|-----------|---------|-------|------------|
| Build from scratch | Alpha | Shark | spawn_shark_agent |
| New feature | Alpha | Shark | spawn_shark_agent |
| Implement spec | Alpha | Shark | spawn_shark_agent |
| Debug issue | Beta | Manta | spawn_manta_agent |
| Fix bug | Beta | Manta | spawn_manta_agent |
| Refactor code | Beta | Manta | spawn_manta_agent |
| Write tests | Gamma | Manta | spawn_manta_agent |
| Verify output | Gamma | Manta | spawn_manta_agent |
| Audit code | Gamma | Manta | spawn_manta_agent |
| Generic task | Auto-assign | Auto | spawn_cluster_task |

## Parallel Execution Pattern

- **Multiple independent tasks** → spawn in parallel across clusters
- **Sequential within cluster** → tasks queue FIFO per cluster
- **Gate-based gating** → GAMMA must approve before ALPHA declares build complete
- **Cross-cluster coordination** → System Brain syncs state across clusters

## Task Lifecycle

```
PENDING → ASSIGNED (L4 validated) → RUNNING → OUTPUT_READY (L2 checked) → VERIFIED (L3) → COMPLETE
```

## Error Recovery Protocol

| Error | Root Cause | Fix |
|-------|-----------|-----|
| "Cluster not found" | Wrong cluster ID in spawn | Verify with get_cluster_status first |
| "evidence is not defined" | Variable ordering | Define evidence before any usage |
| "task timed out" | Container crashed | Check docker ps, respawn with same task |
| "firewall blocked" | L0/L6 violation | Check agent identity and file path |
| "no output retrieved" | Fire-and-forget | Use aggregate_results before claiming complete |
| "wrong agent assigned" | L4 domain mismatch | Verify task type before spawn |

## Concurrency Pattern

```
Parallel: Multiple cluster spawns → independent Docker containers → concurrent execution
Sequential within cluster: Tasks queue FIFO per cluster
Gate-based: GAMMA must approve before ALPHA declares build complete
Non-blocking: Brains run concurrently, no mutex, no sequential bottlenecks
```

## Brain Messenger Communication

All inter-brain communication flows through the Brain Messenger priority bus:

| From → To | Message Types | Priority | Ack Required |
|-----------|--------------|----------|--------------|
| Planning → Execution | context-inject, checkpoint | high | No |
| Execution → Subagent | override | **critical** | **Yes** |
| System → Execution | gate-failure, derailment | critical | No |
| System → any | sync | low | No |

---

*Kraken v1.2 — Central Multi-Brain Orchestrator*
