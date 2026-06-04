# Kraken v1.3 — README

## Overview

Kraken v1.3 is a multi-brain orchestrator plugin for opencode. It provides centralized orchestration, cluster management, firewall enforcement, and execution brain analysis (RGE + SRE).

## Architecture

```
                    ┌─────────────────────┐
                    │   KRAKEN ORCHESTRATOR │
                    │   (this plugin)       │
                    └──────────┬──────────┘
                               │
           ┌───────────────────┼───────────────────┐
           │                   │                   │
           ▼                   ▼                   ▼
     Alpha Cluster       Beta Cluster       Gamma Cluster
     (Shark agents)     (Manta/Shark)      (Manta agents)
```

## Components

### Execution Brain (RGE + SRE)
- **RGE:** 7-layer semantic analysis via TypeScript Compiler API
- **SRE:** P1-P11 principle checks via AST analysis
- Combined: Zero subjective gates, mechanical evidence transitions

### Firewall (L0-L10)
| Layer | Purpose |
|-------|---------|
| L0 | Identity Wall — non-Kraken agent access control |
| L1 | Theatrical Detection — `{success:true}` without side effects |
| L6 | Anti-Retard Engine — excuses, gaslighting, completion theater |
| L7 | Coordination Gates — spawn without description blocked |
| L8 | Anti-Bullshit — blame shifting, ship claims without evidence |
| L9 | Feature Omission — blanket "all features complete" claims |
| L10 | Container Enforcement — evidence path fabrication, sync→async |

### Agent Identity Tiers
| Tier | Agents | Identity |
|------|--------|----------|
| Orchestrator | kraken, kraken-executor | Full KRAKEN ORCHESTRATOR identity |
| Cluster | shark-*, manta-* (9) | TASK CONTEXT only |
| Non-Kraken | All others | Skip entirely |

## Tools (8 total)

| Tool | Description |
|------|-------------|
| `spawn_cluster_task` | Spawn a task on a cluster |
| `spawn_shark_agent` | Spawn a Shark agent on Alpha cluster |
| `spawn_manta_agent` | Spawn a Manta agent on Beta cluster |
| `get_cluster_status` | Get status of all clusters |
| `aggregate_results` | Aggregate results from completed tasks |
| `execution_brain_analyze` | Run RGE+SRE analysis on a project |
| `read_kraken_context` | Read T2 reference patterns |
| `report_to_kraken` | Report task completion or blockers |

## Requirements

- **Runtime:** opencode 1.14.34+ (tested on 1.14.43)
- **Container image:** opencode-test:1.14.43
- **Model:** `xiaomi-token-plan-sgp/mimo-v2.5-pro` (MiMo credits)
- **Build:** bun (not tsc)

## Deployment

```bash
# 1. Copy bundle to plugin path
cp kraken-agent-v1.3-bundle.js /path/to/plugins/kraken-agent/dist/index.js

# 2. Configure opencode.json
# See compaction_survival/CONTAINER_TEST_PROTOCOL.md for exact config

# 3. Set agent in opencode.json:
{
  "model": "xiaomi-token-plan-sgp/mimo-v2.5-pro",
  "plugin": ["file:///path/to/plugins/kraken-agent/dist/index.js"],
  "agent": {
    "kraken": { "name": "kraken", "mode": "primary" }
    // ... other agents
  }
}

# 4. Run
opencode --agent kraken
```
