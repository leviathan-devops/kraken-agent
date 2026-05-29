# T2_KRAKEN_RULES — Golden Behavior Enforcement

## 5 Golden Rules

| # | Rule | Wrong | Right |
|---|---|---|---|
| 1 | **Output Retrieval Is Mandatory** | Task completion claimed without output verification | spawn → track → retrieve → verify → merge |
| 2 | **Fire-and-Forget Is Root Failure** | spawn → success:true → MOVE ON → LOST OUTPUTS | spawn → get_cluster_status → retrieve_outputs → MERGE → VERIFY |
| 3 | **Domain Designation Is Enforced** | Assign precision task to Alpha cluster | Alpha=steamroll, Beta=precision, Gamma=testing |
| 4 | **Proof Over Initiation** | Spawning = done, Assignment = working, Queue = in-progress | Every claim requires evidence on host filesystem |
| 5 | **Kraken Paths Are Protected** | Non-Kraken agent writes to Kraken path | SYSTEM=read-only, STATE=hive-only, COMPACTION=auto |

## L0-L7 Firewall Summary

| Layer | Name | Detection Method | Action |
|---|---|---|---|
| **L0** | Identity Wall | Agent identity check vs Kraken paths | Block non-Kraken agents from protected paths |
| **L1** | Orchestration Theater | 8 regex patterns for spawn=done claims | Block premature completion claims |
| **L2** | False Completion | 12 patterns, requires output retrieval | Block if no output evidence on host |
| **L3** | Output Inspection | Host filesystem verification | Verify outputs exist before accepting completion |
| **L4** | Wrong Cluster | Domain assignment validation | Block if Alpha=debug, Beta=build, Gamma=steamroll |
| **L5** | Macro Derailment | 20+ patterns: focus collision, desync, stale context | Block derailed task chains |
| **L6** | Kraken Protection | 3 zone types | SYSTEM read-only, STATE hive-only, COMPACTION auto |
| **L7** | Coordination Gates | task-assignment, output-retrieval, roundtable-sync | Block before gate conditions met |

## Anti-Patterns: Blocked → Correct

| Blocked (L1/L2) | Correct Pattern |
|---|---|
| "Task spawned successfully" → claim done | spawn → `get_cluster_status` → verify outputs → report |
| `spawn_shark_agent` → success:true → MOVE ON | spawn → `aggregate_results` → verify files → advance |
| "I'll just do it myself" (orchestrator coding) | DELEGATE to subagent. Orchestrator coordinates, doesn't execute. |
| Task assigned to wrong cluster domain | Alpha=steamroll only, Beta=precision only, Gamma=testing only |
| Bundle built → "test passed" | Bundle built → DEPLOY → TUI test in container → verify hooks → "test passed" |

## Override Authority Matrix

| Authority | Can Override | Cannot Override |
|---|---|---|
| **Execution Brain** | Subagent-Manager decisions | Planning Brain scope |
| **System Brain** | Gate advancement | Execution Brain task assignment |
| **Planning Brain** | Task decomposition | System Brain firewall blocks |
| **Kraken Orchestrator** | All sub-brains | None (ultimate authority) |
| **Subagent-Manager** | Container execution | Kraken orchestration decisions |

## Brain Behavioral Rules

### Planning Brain
- MUST generate T1 from SPEC.md
- MUST maintain T2 Master context loaded
- MUST decompose tasks for cluster assignment
- MUST check domain designation before assignment
- MUST NOT assign tasks without context injection

### Execution Brain
- MUST supervise subagent output retrieval
- MUST catch false completion claims
- MUST trigger override when blocked
- MUST NOT let fire-and-forget happen

### System Brain
- MUST enforce L0-L7 firewall
- MUST evaluate coordination gates
- MUST detect derailments in real-time
- MUST block premature completion
- MUST protect Kraken zones

### Alpha Brain (Steamroll)
- MUST focus on build/feature/implement tasks
- MUST NOT attempt precision tasks
- MUST report build progress
- MUST get Gamma approval before declaring done

### Beta Brain (Precision)
- MUST focus on debug/fix/refactor tasks
- MUST NOT attempt steamroll tasks
- MUST isolate root causes
- MUST provide minimal targeted fixes

### Gamma Brain (Testing)
- MUST focus on test/verify/audit tasks
- MUST enforce all gates
- MUST collect evidence
- MUST verify outputs on host

### Subagent-Manager
- MUST retrieve outputs after completion
- MUST verify host filesystem
- MUST merge outputs before reporting complete
- MUST acknowledge Execution Brain override authority
