# Kraken Agent v1.0

**Self-contained OpenCode plugin orchestrator with 3 async clusters, embedded Shark/Manta agents, and Kraken-Hive Mind.**

---

## Drop-In Installation

**One-command setup:**
```bash
# Add to your opencode.json plugins array:
"file:///path/to/kraken-agent/dist/index.js"

# Or clone and use directly:
git clone https://github.com/leviathan-devops/kraken-agent.git && cd kraken-agent && bun install && bun run build
```

**OpenCode Config (`~/.config/opencode/opencode.json`):**
```json
{
  "plugins": [
    "file:///path/to/kraken-agent/dist/index.js"
  ]
}
```

---

## What is Kraken?

Kraken is an **orchestrator agent** that coordinates multiple sub-agents (Sharks and Mantas) across 3 clusters for parallel task execution. It provides:

| Feature | Description |
|---------|-------------|
| **3 Async Clusters** | Alpha (build), Beta (test), Gamma (debug) - each with Shark/Manta agents |
| **Parallel Delegation** | 76+ tasks/sec throughput via async task queue |
| **Load Balancing** | ClusterScheduler distributes tasks by priority and cluster load |
| **Kraken-Hive Mind** | Persistent memory store for patterns, failures, and session context |
| **Shark/Manta Agents** | Embedded v4.7-hotfix-v3 execution agents with Guardian protection |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      KRAKEN ORCHESTRATOR                     │
│  ┌─────────────┐  ┌─────────────────┐  ┌───────────────┐  │
│  │ Kraken      │  │ AsyncDelegation │  │ Cluster       │  │
│  │ Architect   │──│ Engine          │──│ Scheduler      │  │
│  └─────────────┘  └─────────────────┘  └───────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ ALPHA CLUSTER │  │ BETA CLUSTER  │  │ GAMMA CLUSTER │
│ ┌───────────┐  │  │ ┌───────────┐ │  │ ┌───────────┐ │
│ │Shark-Alpha│  │  │ │Shark-Beta │ │  │ │Shark-Gamma│ │
│ │Manta-Alpha│  │  │ │Manta-Beta │ │  │ │Manta-Gamma│ │
│ └───────────┘  │  │ └───────────┘ │  │ └───────────┘ │
└───────────────┘  └───────────────┘  └───────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │     KRAKEN-HIVE MIND    │
              │  ┌─────┬─────┬─────┐  │
              │  │Cluster│Session│Pattern│
              │  │Memory │Memory │Store  │
              │  └─────┴─────┴─────┘  │
              └─────────────────────────┘
```

---

## Agents

### Orchestrator
| Agent | Role |
|-------|------|
| `kraken` | Primary orchestrator - strategic planning with full Hive access |

### Cluster Agents
| Cluster | Shark | Manta |
|---------|-------|-------|
| **Alpha** | `shark-alpha-1`, `shark-alpha-2` | `manta-alpha-1` |
| **Beta** | `shark-beta-1` | `manta-beta-1`, `manta-beta-2` |
| **Gamma** | `shark-gamma-1` | `manta-gamma-1`, `manta-gamma-2` |

---

## Tools

### Kraken Tools (Orchestrator)
| Tool | Description |
|------|-------------|
| `kraken-status` | View cluster load and task distribution |
| `kraken-delegate` | Manually delegate task to cluster |
| `kraken-hive-store` | Store pattern/failure in Hive |
| `kraken-hive-search` | Search Hive memory |
| `kraken-gate` | Manage PLAN→BUILD→TEST→VERIFY gate chain |

### Shark/Manta Tools (T2 Read-Only)
| Tool | Description |
|------|-------------|
| `read_kraken_context` | Read T2 reference library (patterns, failures, build-chain, architecture) |

---

## Cluster Configuration

```typescript
const KRAKEN_CLUSTERS = [
  {
    id: 'cluster-alpha',
    name: 'Alpha Cluster',
    description: 'Primary build cluster - Shark agents for steamroll tasks',
    agents: ['shark-alpha-1', 'shark-alpha-2', 'manta-alpha-1'],
    intraClusterDelegation: true,
    interClusterDelegation: true,
    sharedContext: true,
  },
  {
    id: 'cluster-beta',
    name: 'Beta Cluster',
    description: 'Testing cluster - Manta agents for precision tasks',
    agents: ['shark-beta-1', 'manta-beta-1', 'manta-beta-2'],
    intraClusterDelegation: true,
    interClusterDelegation: true,
    sharedContext: true,
  },
  {
    id: 'cluster-gamma',
    name: 'Gamma Cluster',
    description: 'Debug cluster - Balanced Shark/Manta for analysis',
    agents: ['shark-gamma-1', 'manta-gamma-1', 'manta-gamma-2'],
    intraClusterDelegation: true,
    interClusterDelegation: true,
    sharedContext: true,
  },
];
```

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| **Throughput** | 76+ tasks/sec |
| **Sustained Load** | 660 tasks in 60s (24.47/sec avg) |
| **Hive Search** | 33,333 patterns/sec |
| **Distribution** | Alpha: 99, Beta: 87, Gamma: 85 (balanced) |
| **Error Rate** | 0.0% |

---

## Kraken-Hive Mind

Self-contained persistent memory store at `~/.local/share/opencode/kraken-hive/`:

| Category | Purpose |
|----------|---------|
| `clusters/` | Per-cluster memory and context |
| `sessions/` | Session-specific patterns and decisions |
| `patterns/` | Reusable code patterns and solutions |
| `decisions/` | Architectural decisions record |
| `failures/` | Known failure modes and solutions |
| `breakthroughs/` | Major discoveries and innovations |

---

## Build

```bash
# Install dependencies
bun install

# Build plugin (bundles everything into dist/)
bun run build

# Run tests
bun test
```

**Output:** `dist/index.js` (self-contained bundle)

---

## Dependencies

**Peer Dependencies (provided by OpenCode):**
- `@opencode-ai/plugin` ^1.3.6

**Bundled Internally:**
- Shark Agent v4.7-hotfix-v3 (triple-brain coordination, Guardian protection)
- Kraken-Hive engine (self-contained file-based memory)
- AsyncDelegationEngine (parallel task processing)
- ClusterScheduler (load balancing)

**No external npm dependencies at runtime.**

---

## GitHub

**Repository:** https://github.com/leviathan-devops/kraken-agent

---

*Version 1.0.0 - Self-contained OpenCode plugin orchestrator*
