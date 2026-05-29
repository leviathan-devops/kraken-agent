# T2_ARCHITECTURE — Multi-Brain Integration

## Brain Wiring Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    KRAKEN ORCHESTRATOR                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  PLANNING   │  │  EXECUTION  │  │   SYSTEM    │         │
│  │  T2 Master  │  │ Supervisor  │  │ L0-L7       │         │
│  │  T1 Gen     │  │ Override    │  │ Gates       │         │
│  │  Task Dec   │  │ Momentum    │  │ Derail      │         │
│  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘         │
│         │               │               │                 │
│         └───────────────┼───────────────┘                 │
│                         │                                  │
│              ┌──────────┴──────────┐                      │
│              │  BRAIN MESSENGER    │                      │
│              │  Priority signaling │                      │
│              └──────────┬──────────┘                      │
│                         │                                  │
│  ┌──────────┬───────────┼───────────┬──────────┐         │
│  ▼          ▼           ▼           ▼          ▼         │
│ ALPHA     BETA       GAMMA       ALPHA-X    BETA-X       │
│ Steamroll Precision   Testing   (spawnable)(spawnable)    │
│ Cluster   Cluster    Cluster                              │
│  └──────────┴───────────┼───────────┘                    │
│                         │                                  │
│              ┌──────────┴──────────┐                      │
│              │  SUBAGENT-MANAGER   │                      │
│              │  (Autonomous)       │                      │
│              └─────────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

## Domain Ownership Table

| Domain State | Owners |
|---|---|
| `planning-state` | kraken-planning, kraken-system |
| `execution-state` | kraken-execution, kraken-system |
| `thinking-state` | kraken-reasoning, kraken-system |
| `context-bridge` | kraken-planning |
| `workflow-state` | kraken-system, kraken-execution |
| `security-state` | kraken-system |
| `quality-state` | kraken-execution, kraken-system |
| `container-state` | kraken-subagent |
| `execution-queue` | kraken-subagent, kraken-execution |
| `alpha-state` | alpha-execution, alpha-system |
| `beta-state` | beta-reasoning, beta-system |
| `gamma-state` | gamma-system, gamma-execution |

## Brain Messenger API

```typescript
interface BrainMessage {
  from: string;
  to: string;
  type: 'context-inject' | 'gate-failure' | 'checkpoint' | 'override' | 'sync';
  priority: 'critical' | 'high' | 'normal' | 'low';
  payload: Record<string, unknown>;
  requiresAck: boolean;
}

// Planning → Execution: context injection
messenger.send({ from: 'kraken-planning', to: 'kraken-execution',
  type: 'context-inject', priority: 'high',
  payload: { 'thinking-state': { 'spec-context': [...] } }, requiresAck: false });

// Execution → Subagent: override
messenger.send({ from: 'kraken-execution', to: 'subagent-manager',
  type: 'override', priority: 'critical',
  payload: { action: 'retrieve-outputs', taskId: 'xyz' }, requiresAck: true });
```

Message types: `context-inject` (Planning→Execution), `gate-failure` (System→any), `checkpoint` (any→any), `override` (Execution→Subagent), `sync` (any→any).

## Integration Pipeline Flow

```
User Message
  │
  ▼
chat.message hook → identity detection → T1 generation (Planning Brain)
  │
  ▼
Planning Brain → BrainMessage → Execution Brain
  │
  ▼
Execution Brain → delegation request → AsyncDelegationEngine
  │
  ▼
Delegation Engine → L4 domain validation → cluster assignment
  │
  ▼
Cluster Manager → spawn task → Subagent-Manager → Docker container
  │
  ▼
Subagent output → L2 retrieval check → Evidence Collector → Gate evaluation
  │
  ▼
System Brain → evaluateGateEntry → auto-advance → report to Execution Brain
  │
  ▼
Execution Brain → completeTask → response to user
```

## Cluster Assignment Map

| Cluster | Domain | Lead Brain | Task Types | Spawn Tool |
|---|---|---|---|---|
| **Alpha** | Steamroll builds | Execution | from-scratch, new-feature, implement | `spawn_shark_agent` |
| **Beta** | Precision tasks | Reasoning | debug, fix, refactor, analyze | `spawn_manta_agent` |
| **Gamma** | Testing/verification | System | test, verify, audit, gates | `spawn_cluster_task` |

## Brain-to-Brain Communication

All inter-brain communication flows through the Brain Messenger. Direct cross-brain access is prohibited.

| From → To | Message Types | Priority | Ack Required |
|---|---|---|---|
| Planning → Execution | context-inject, checkpoint | high | No |
| Planning → System | sync | normal | No |
| Execution → Planning | sync, checkpoint | normal | No |
| Execution → System | gate-failure | high | No |
| Execution → Subagent | override | critical | **Yes** |
| System → Execution | gate-failure, derailment | critical | No |
| System → Planning | sync | low | No |

## Concurrency Pattern

```
Parallel: Multiple cluster spawns → independent Docker containers → concurrent execution
Sequential within cluster: Tasks queue FIFO per cluster
Gate-based gating: GAMMA must approve before ALPHA declares build complete

Task lifecycle:
  PENDING → ASSIGNED (L4 validated) → RUNNING → OUTPUT_READY (L2 checked) → VERIFIED (L3) → COMPLETE
```
