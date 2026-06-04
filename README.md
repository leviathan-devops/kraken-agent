# KRAKEN AGENT v1.3 — Runtime-Grade Multi-Brain Orchestrator

**Status:** ✅ SHIP READY — All 5 gates pass, 31/31 container tests (100.0%), Tier 4 TUI identity verified
**Bundle:** 8,961,332 bytes (8.96 MB), 32 modules, bun build 382ms
**Container:** opencode-test:1.14.43, model `xiaomi-token-plan-sgp/mimo-v2.5-pro`
**Runtime:** opencode 1.14.43

---

## Overview

Kraken v1.3 is a runtime-grade multi-brain orchestrator plugin for opencode. It provides centralized orchestration, cluster management, firewall enforcement, execution brain analysis (RGE + SRE), and mechanical context management across 3 agent clusters.

### Architecture

```
                    ┌─────────────────────────────┐
                    │      KRAKEN ORCHESTRATOR      │
                    │  RGE + SRE = Execution Brain  │
                    │  Firewall: L0-L10 consolidated │
                    └──────────┬──────────────────┘
                               │
           ┌───────────────────┼───────────────────┐
           │                   │                   │
           ▼                   ▼                   ▼
     Alpha Cluster       Beta Cluster       Gamma Cluster
     (Shark agents)     (Manta/Shark)      (Manta agents)
      3 agents            3 agents            3 agents
```

### Identity

When asked "who are you":

> **"I am KRAKEN ORCHESTRATOR v1.3, the central coordination engine of the Kraken Agent Harness."**

Three-tier identity scoping:
- **Orchestrator** (kraken, kraken-executor) — Full KRAKEN ORCHESTRATOR identity via `experimental.chat.system.transform` REPLACE pattern
- **Cluster agents** (shark-*, manta-*) — TASK CONTEXT only
- **Non-Kraken agents** — Nothing (no identity leak)

---

## Tools (9)

| Tool | Parameters | Description |
|------|------------|-------------|
| `complete_todo` | description, details | Mark an orchestrator-level to-do complete, updates ALL 9 context docs |
| `spawn_cluster_task` | task, taskType, clusterId?, criteria? | Spawn a task on a cluster |
| `spawn_shark_agent` | task, criteria? | Spawn a Shark agent on Alpha cluster |
| `spawn_manta_agent` | task, criteria? | Spawn a Manta agent on Beta cluster |
| `get_cluster_status` | (none) | Get status of all clusters with task-level detail |
| `aggregate_results` | taskIds | Aggregate results from completed tasks |
| `execution_brain_analyze` | projectRoot | Run RGE+SRE analysis on a project |
| `read_kraken_context` | contextFile | Read T2 reference patterns |
| `report_to_kraken` | taskId, status, output? | Report task completion or blockers |

ALLOWLIST enforced — these 9 tools are the ONLY tools allowed. All other tools (bash, write, edit, etc.) are blocked with `FIREWALL_BLOCKED`.

---

## Agents (11)

| Agent | Type | Role |
|-------|------|------|
| kraken | Primary | Central orchestrator — full tool access |
| kraken-executor | Subagent | Execution coordinator |
| shark-alpha-1, shark-alpha-2, manta-alpha-1 | Subagent | Alpha cluster (steamroll) |
| shark-beta-1, manta-beta-1, manta-beta-2 | Subagent | Beta cluster (balanced) |
| manta-gamma-1, manta-gamma-2, shark-gamma-1 | Subagent | Gamma cluster (precision) |

---

## Execution Brain (RGE + SRE)

**RGE — Runtime Grade Engine** (7 layers, TypeScript Compiler API)
| Layer | Name | Method |
|-------|------|--------|
| L0 | Syntactic | Regex pre-filter for P1-P11 patterns |
| L1 | Type Contract | checker.getSignatureFromDeclaration() |
| L2 | Control Flow | Resource leak, floating promise detection |
| L3 | Symbol Resolution | checker.getSymbolAtLocation() |
| L4 | Side-Effect Truth | P11 theatrical return detection via AST |
| L5 | Pattern Database | Known anti-pattern detection |
| L6 | Compliance | Zero CRITICAL = pass verdict |

**SRE — Slop Removal Engine** (P1-P11 principle checks via AST)
- P1-P11: Defensive import, type certainty, error completeness, resource lifecycle, atomic state, dependency check, path resolution, config validation, async discipline, output contract, output is the work

**Verified:** 208 violations detected in Shark v4.8.3 (28 files, 0.9s analysis)

---

## Firewall (Consolidated — L0-L10)

| Layer | Name | Enforcement |
|-------|------|-------------|
| L0 | Identity Wall | Non-Kraken agent access control |
| L1 | Theatrical Detection | `{success:true}` without side effects |
| L6 | Anti-Retard Engine | 14 categories of retard behavior |
| L7 | Coordination Gates | Spawn without description blocked |
| L8 | Anti-Bullshit | Ship claims without evidence blocked |
| L9 | Feature Omission | Blanket "all features complete" blocked |
| L10 | Container Enforcement | Evidence path fabrication blocked (async fs.promises) |

---

## Context Management (9-Canon Docs)

ALL 9 docs are mechanically updated on EVERY trigger — none are static:

| # | Doc | Updates On | Content |
|---|-----|-----------|---------|
| 1 | BUILD_STATE.md | `complete_todo`, `report_to_kraken` | Task completion entries with status + timestamp |
| 2 | TASK_QUEUE.md | `spawn_*`, `report_to_kraken`, `complete_todo` | `[x]`/`[ ]` backlog tracking |
| 3 | CHANGELOG.md | `report_to_kraken`, `complete_todo` | Issue \| File \| Change structured rows |
| 4 | DECISION_CHAIN.md | `spawn_*`, `complete_todo` | Numbered decisions with rationale |
| 5 | DEBUG_LOG.md | `report_to_kraken` (failed only) | Root cause analysis (Description/Cause/Fix) |
| 6 | COMPACTION_SURVIVAL.md | Every state change | Current phase, active/completed tasks |
| 7 | EVIDENCE_STATE.md | Analysis, aggregation, todo complete | Evidence inventory, test results |
| 8 | POST-COMPACTION_PROMPT.md | Every state change | Recovery snapshot with last completed task |
| 9 | SoC_PRESERVATION.md | Every completion | Patterns discovered with source attribution |

### Trigger Matrix

| Trigger | Source | Docs Updated |
|---------|--------|-------------|
| Orchestrator completes a to-do | `complete_todo` | ALL 9 |
| Subagent reports complete/failed | `report_to_kraken` | ALL 9 (DEBUG_LOG on fail only) |
| Orchestrator spawns work | `spawn_cluster_task`, `spawn_shark_agent`, `spawn_manta_agent` | TASK_QUEUE + DECISION_CHAIN |
| Orchestrator runs analysis | `execution_brain_analyze` | EVIDENCE_STATE + COMPACTION_SURVIVAL + SoC |
| Orchestrator aggregates | `aggregate_results` | EVIDENCE_STATE + POST-COMPACTION_PROMPT |

---

## Container Test Results (31/31 — 100.0%)

| Test Group | Count | Result |
|-----------|-------|--------|
| TC-4.6 ALLOWLIST | 45 tools | ✅ All blocked |
| Identity (Tier 2 hook) | 3 | ✅ KRAKEN ORCHESTRATOR injected |
| Firewall L0-L10 | 7 | ✅ All layers block properly |
| Cluster Lifecycle (P11) | 14 | ✅ Task in cluster, status changes, aggregate matches |
| Compaction Survival | 3 | ✅ Context injected with gate info |
| RGE+SRE | 3 | ✅ Engines run, return violations |

**Tier 4 TUI Identity:**
```
Model: "I am KRAKEN ORCHESTRATOR v1.3, the central coordination engine."
Thinking: "According to the KRAKEN IDENTITY BINDING in my system prompt..."
```

---

## Fixes Applied (R1-R22)

| Phase | Fixes | Severity |
|-------|-------|----------|
| R1-R10 | Code quality: null assertions, casts, sync I/O, fail-open | CRITICAL→MEDIUM |
| R11-R13 | Runtime defects: ALLOWLIST, cluster state, L9 regex | CRITICAL→MEDIUM |
| R14-R16 | Async: L10 fs.promises, firewall Promise, identity fallback | MEDIUM |
| R17-R22 | T3 audit: P2 type guards, P3 circuit breaker, P4 TTL, P5 atomic | MEDIUM |

---

## Deployment

### Container

```bash
# 1. Mount project directory for context management persistence
SNAP="/tmp/kraken-snap-$(date +%s)"
mkdir -p "$SNAP/plugins/kraken-agent/dist"
cp ship-package-v1.3/kraken-agent-v1.3-bundle.js "$SNAP/plugins/kraken-agent/dist/index.js"

# 2. Write config
cat > "$SNAP/opencode.json" << 'CONFIG'
{
  "model": "xiaomi-token-plan-sgp/mimo-v2.5-pro",
  "provider": {
    "xiaomi-token-plan-sgp": {
      "npm": "@ai-sdk/openai-compatible",
      "options": {
        "baseURL": "https://token-plan-sgp.xiaomimimo.com/v1",
        "apiKey": "tp-ssy5nlzfc5vccack4ccierszbs0fojjp0lp3uj37hlp328ci"
      }
    }
  },
  "plugin": ["file:///root/.config/opencode/plugins/kraken-agent/dist/index.js"],
  "agent": {
    "kraken": { "name": "kraken", "mode": "primary" }
  }
}
CONFIG

# 3. Spawn
docker run -d --name kraken-v13-test --entrypoint "" \
  -v "$SNAP:/root/.config/opencode" \
  -v "$(pwd):/workspace/kraken" \
  opencode-test:1.14.43 \
  /bin/sh -c 'tail -f /dev/null'
```

### Run

```bash
# TUI mode
BASELINE="/usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64-baseline/bin/opencode"
tmux new-session -d -s kraken-tui "$BASELINE --agent kraken"

# Headless mode
$BASELINE run --agent kraken "your message here"
```

---

## Ship Package Contents

```
ship-package-v1.3/
├── SHIP_MANIFEST.md                 ← Package manifest
├── BUILD_REPORT.md                  ← Build process and fixes
├── CONTAINER_TEST_REPORT.md         ← Container test results (31/31)
├── README.md                        ← This file
├── HANDOVER.md                      ← Context handover
├── kraken-agent-v1.3-bundle.js      ← Built bundle (8,961,332 bytes)
├── identity/kraken/                 ← Identity documentation
│   ├── IDENTITY.md, EXECUTION.md, QUALITY.md, TOOLS.md
├── evidence/                        ← Test evidence files (3 JSON)
├── compaction_survival/             ← Dev history (13 files)
└── CONTEXT_MANAGEMENT/              ← 9 canon docs + engineering report + template
    ├── BUILD_STATE.md through TASK_QUEUE.md (9 files)
    ├── CONTEXT_MANAGEMENT_ENGINEERING_REPORT.md
    └── CONTEXT_MANAGER_TEMPLATE.md
```

---

## Repository Contents

```
kraken-agent/
├── src/                    ← TypeScript source (37 files, 6,289 LOC)
│   ├── index.ts            ← Main plugin entry (all hooks + tools)
│   ├── clusters/           ← Cluster manager
│   ├── shared/             ← Evidence, state, brain messenger, context-manager
│   ├── system-brain/       ← Firewall L0-L10 (consolidated)
│   └── execution-brain/    ← RGE + SRE engines
├── dist/index.js           ← Built bundle
├── context-management/     ← 9 live context docs (auto-updated at runtime)
├── ship-package-v1.3/      ← Full ship package (37 files)
├── package.json
└── README.md
```
