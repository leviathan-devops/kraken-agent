# KRAKEN AGENT v1.4 — PHALANX EDITION

**The Mechanical Enforcement Engine for opencode Plugin Ecosystems.**

Kraken v1.4 is a runtime-grade opencode plugin that orchestrates multi-agent task execution through a **warhead-based mechanical enforcement architecture**. It replaces the monolithic v1.3 `KrakenFirewall` pipeline with 23 independent, priority-ordered `Warhead` classes that enforce tool allowlists, phalanx spawn hierarchy, identity integrity, concurrency limits, and runtime-grade compliance — all mechanically, without subjective gates.

---

## Architecture Overview

```
opencode SDK hooks
    │
    ▼
HookAdapter (5 adapters)    ◄── Converts SDK (input, output) → Warhead HookContext
    │
    ▼
WarheadEngine               ◄── Orchestrates 23 warheads in priority order
    │
    ├── enforce()            ── tool.before  (13 hooks, priority p0-p20)
    ├── runAfterHooks()      ── tool.after   (5 hooks, priority p2-p30)
    ├── runHooks()           ── system.transform, compacting, chat.message
    ├── synthesizeAll()      ── T1 mechanical state from all warheads
    ├── getState()           ── EngineState snapshot
    └── diagnoseAll()        ── Per-warhead health diagnostics
    │
    ▼
WarheadRegistry             ◄── Priority-sorted Map: CRITICAL → HIGH → MEDIUM → LOW
    │
    ▼
23 Warheads (W1-W23)        ◄── Each implements: loadKnowledge, synthesize, getHooks,
    ── PhalanxWarhead              diagnose, recordBlock, getState
    ── IdentityWarhead
    ── RuntimeGradeOrchestratorWarhead
    ── RuntimeGradeTentacleWarhead
    ── TentacleManagerWarhead
    ── AllowlistWarhead
    ── ContextWarhead
    ── MultiBrainWarhead
    ── LayerEngineWarhead
    ── StructuredBlockErrorWarhead
    ── FirewallAuditWarhead
    ── L5AntiDerailmentWarhead
    ── F1IsolationWarhead
    ── EvidenceGateWarhead
    ── CompactionSurvivalWarhead
    ── RecoveryCheckpointWarhead
    ── T2T1PyramidWarhead
    ── TriplePathInjectionWarhead
    ── PhalanxIdentityFilesWarhead
    ── WarheadSynthesizerWarhead
    ── PerAgentAllowlistWarhead
    ── ParallelDeploymentWarhead
    ── RateLimitWarhead
```

---

## Core Systems

### 1. Warhead Engine (`src/engine/`)

The `WarheadEngine` is the mechanical orchestrator. It registers all 23 warheads in priority order, loads 4 knowledge libraries at init, fires hooks in priority sequence, synthesizes T1 context from all warheads, and provides diagnostics.

**Key files:**
- `warhead-engine.ts` — Orchestrator (enforce, runAfterHooks, runHooks, synthesizeAll, getState, diagnoseAll)
- `warhead-registry.ts` — Priority-sorted Map (getByPriority, getAll, get, count)
- `hook-adapter.ts` — 5 adapter functions (ToolBefore, ToolAfter, Transform, Compacting, ChatMessage)
- `types.ts` — Canonical types (HookContext, HookResult, EnforcementHook, EngineState, Warhead interface)

### 2. Hook Adapters (`src/engine/hook-adapter.ts`)

Bridges the gap between opencode SDK hook signatures and `WarheadEngine HookContext`. Each adapter extracts tool name, agent name, args, and metadata from the SDK's `(input, output)` tuple — with P2 runtime guards on every extraction.

| Adapter | SDK Hook | Extract Pattern |
|---------|----------|----------------|
| `adaptToolBeforeContext` | `tool.execute.before` | `input.tool`, `input.session.agentName`, `output.args` |
| `adaptToolAfterContext` | `tool.execute.after` | `input.tool`, `callAgentMap` side channel, `output.metadata` |
| `adaptTransformContext` | `system.transform` | `input.agent`, `output.system` |
| `adaptCompactingContext` | `compacting` | `input.sessionID`, `output.context` |
| `adaptChatMessageContext` | `chat.message` | `input.agent`, `output.message` |

### 3. 23 Warheads (`src/warheads/`)

Each warhead is an independent class implementing the `Warhead` interface. Warheads are registered in priority order and fire based on hook point.

**tool.before enforcement (13 hooks, priority-ordered):**

| Priority | Warhead | Layer | Enforces |
|----------|---------|-------|----------|
| p0 | F1IsolationWarhead | `F1` | Kraken-only tools restricted to Kraken orchestrator |
| p0 | LayerEngineWarhead | `LAYER_ENGINE` | 6-layer firewall (identity, allowlist, zone, theatrical, spawn) |
| p1 | PhalanxWarhead | `PHALANX_DEPTH` | 4-tier spawn hierarchy (Kraken → Tentacle → Cluster → Leaf) |
| p2 | ParallelDeploymentWarhead | `PARALLEL` | Max 8 concurrent deploy_tentacle calls |
| p3 | TentacleManagerWarhead | `BACKPRESSURE` | Max 8 tentacles / 16 agents concurrently |
| p4 | AllowlistWarhead | `ALLOWLIST` | Per-agent tool allowlists from single source of truth |
| p5 | RuntimeGradeOrchestratorWarhead | `RUNTIME_GRADE_ORCHESTRATOR` | P1-P12 principles, block direct tool use |
| p15 | L5AntiDerailmentWarhead | `L5` | 9-class derailment pattern detection |
| p20 | IdentityWarhead | `IDENTITY_ENFORCEMENT` | Identity drift detection ("i am opencode") |

**tool.after tracking (5 hooks):**

| Priority | Warhead | Layer | Tracks |
|----------|---------|-------|--------|
| p2 | ParallelDeploymentWarhead | `PARALLEL_DEC` | Decrement active deploy count |
| p3 | TentacleManagerWarhead | `BACKPRESSURE_MAINT` | Tentacle/agent counters |
| p3 | TentacleManagerWarhead | `CIRCUIT_BREAKER` | Circuit breaker failures |
| p25 | MultiBrainWarhead | `BRAIN_ROUTE` | Tool-to-brain routing |
| p30 | ContextWarhead | `CONTEXT_UPDATE` | Context-affecting tools |

### 4. T2→T1→T0 Context Pyramid (`src/shared/t2-loader.ts`)

Three-tier context system that converts cold-storage identity files into precision injectables:

- **T2 (Cold Storage):** 10 identity files at `context/t2/T2_*.md` (~40K chars). Loaded session-duration. Never injected raw.
- **T1 (Warm Injectables):** Behavioral rules extracted from T2 via priority-ordered synthesis (<5K chars). Injected on EVERY system.transform and compacting. Contains ONLY runtime-behavior-enforcing content: imperatives, prohibitions, decision trees, priorities, anti-patterns.
- **T0 (Hot Runtime):** Model's active behavior in conversation. Shaped by T1 injectables.

Each T1 injectable is capped at 500 chars. Priority order: HIGH → MEDIUM → LOW. Budget: 5000 chars total.

### 5. Tool Allowlist (`src/security/tool-allowlist.ts`)

Single source of truth for per-agent tool allowlists:

| Agent | Allowed Tools |
|-------|--------------|
| `kraken` | deploy_tentacle, get_cluster_status, aggregate_results, execution_brain_analyze, read_kraken_context, report_to_kraken, complete_todo, task |
| `kraken-tentacle-executor` | task, get_cluster_status, read_kraken_context, report_to_kraken, glob, grep, read, write |
| `kraken-cluster-agent` | bash, write, read, edit, glob, grep, task, read_kraken_context, report_to_kraken |

### 6. Cluster Engine (`src/clusters/`)

Dynamic tentacle-based execution system. No hardcoded cluster configs — tentacles are created on-demand by the planning brain via `ClusterEngine.anchorTentacle()`.

**Tentacle lifecycle:** `anchor → disperse → tighten → dissolve`

**Components:**
- `ClusterEngine` — Tentacle management (anchor, disperse, tighten, dissolve, aggregate)
- `ClusterManager` — Wrapper with calculateAgentCount, updateSlotStatus
- `ACP` — Agent creation protocol
- `Sandbox` — Isolated execution environment

### 7. Execution Brain (`src/execution-brain/`)

Combines RGE (Runtime Grade Engine) + SRE (Slop Removal Engine) for algorithmic code quality enforcement.

**RGE — 7 semantic layers (TypeScript Compiler API):**
- L0: Syntactic analysis
- L1: Type contract verification
- L2: Control flow analysis
- L3: Symbol resolution
- L4: Side effect verification
- L5: Pattern database matching
- L6: Compliance scoring

**SRE — P1-P11 principle checks:**
- P1: Defensive imports
- P2: Type certainty (no unchecked casts)
- P3: Error path completeness

### 8. Context Management (`src/shared/context-manager.ts`)

9-canon mechanical document updates triggered by EVERY tool execution:

| Doc | Update Trigger |
|-----|----------------|
| BUILD_STATE.md | report_to_kraken, complete_todo |
| TASK_QUEUE.md | deploy_tentacle, report_to_kraken, complete_todo |
| CHANGELOG.md | report_to_kraken (complete), complete_todo |
| DECISION_CHAIN.md | deploy_tentacle, complete_todo |
| DEBUG_LOG.md | report_to_kraken (failed only) |
| COMPACTION_SURVIVAL.md | Every trigger |
| EVIDENCE_STATE.md | analysis, aggregation, todo |
| POST-COMPACTION_PROMPT.md | Every trigger |
| SoC_PRESERVATION.md | Every trigger |

### 9. Agent Identity (`src/shared/agent-identity.ts`)

Externalized identity checks using prefix+Set-based detection:

| Function | Detects | Used By |
|----------|---------|---------|
| `isKrakenOrchestrator()` | kraken, kraken-executor, kraken-tentacle-executor | system.transform identity injection |
| `isClusterAgent()` | kraken-cluster-agent, shark-alpha-1, manta-beta-2 | system.transform task context |
| `isKrakenAgent()` | Orchestrator OR cluster agent | tool.execute.before filter |
| `isOtherPluginAgent()` | Agents from other plugins | Cross-plugin audit logging |
| `isVanillaAgent()` | explore, general, plan, build | isOtherPluginAgent fallthrough |

---

## Data Flow

```
User sends message
    │
    ▼
chat.message hook
    ├── adaptChatMessageContext() → HookContext
    ├── WarheadEngine.runHooks('chat.message', context)
    └── Auto-decompose request → brain messenger
    │
    ▼
system.transform hook (on every message)
    ├── SCAN+REPLACE runtime defaults with [KRAKEN IDENTITY BINDING] header
    ├── Inject combined T1: identityT1 (from T2) + mechanicalT1 (from warheads)
    ├── Post-compaction recovery context restoration
    └── WarheadEngine.runHooks('system.transform', context)
    │
    ▼
Model processes → calls tools
    │
    ▼
tool.execute.before hook (every tool call)
    ├── adaptToolBeforeContext() → HookContext
    ├── Agent filter → isKrakenAgent check + cross-plugin audit
    ├── callAgentMap.set(callID, agentName) — side channel
    ├── WarheadEngine.enforce() → 13 priority-ordered hooks
    │   └── On BLOCK: StructuredBlockError thrown → runtime rejects
    └── Evidence collection
    │
    ▼
tool.execute.after hook (post-execution)
    ├── callAgentMap.get(callID) → agent name resolution
    ├── adaptToolAfterContext() → HookContext with REAL output.metadata
    └── WarheadEngine.runAfterHooks() → 5 priority-ordered maintenance hooks
    │
    ▼
Compacting (context window management)
    ├── WarheadEngine.runHooks('compacting', context)
    ├── Evidence persist
    ├── invalidateT2Cache() → T2+T1 caches cleared
    ├── Recovery context injection
    ├── Re-synthesized T1 injection (identity + mechanical)
    └── SoC preservation log
```

---

## Phalanx Depth Enforcement

4-tier hard depth cap on agent spawning:

| Depth | Agent | Can Spawn | Cannot Spawn |
|-------|-------|-----------|--------------|
| 1 | Kraken | kraken-tentacle-executor | Everything else |
| 2 | Tentacle Executor | kraken-cluster-agent | Kraken, other tentacles |
| 3 | Cluster Agent | explore, general | kraken, tentacles, other cluster agents |
| 4 | Vanilla (leaf) | NOTHING | — |

Any spawn violating this hierarchy is BLOCKED with `[PHALANX_BLOCKED]` + reason + correction.

---

## Compaction Survival Protocol

```
compacting fires
    │
    ▼
WarheadEngine.runHooks('compacting')
    ├── TriplePathInjectionWarhead — increments counter
    └── CompactionSurvivalWarhead — saves last state
    │
    ▼
Evidence persist → invalidateT2Cache() → T2+T1 cleared
    │
    ▼
Recovery context injected → "[KRAKEN COMPACTION SURVIVAL v1.4]"
    │
    ▼
T1 re-synthesized: identityT1 (from fresh T2) + mechanicalT1 (from warheads)
    │
    ▼
SoC_PRESERVATION.md updated
```

---

## Project Structure

```
src/
├── index.ts                          — Plugin entry, tool definitions, 5 hook registrations
├── types.ts                          — Core type definitions
├── engine/
│   ├── warhead-engine.ts             — Orchestrator (271 lines)
│   ├── warhead-registry.ts           — Priority-sorted map (88 lines)
│   ├── hook-adapter.ts               — 5 SDK→Warhead adapters (288 lines)
│   └── types.ts                      — Canonical warhead types (119 lines)
├── warheads/                         — 23 warheads (~1,800 lines total)
│   ├── phalanx-warhead.ts            — W1: Spawn hierarchy enforcement
│   ├── identity-warhead.ts           — W2: Identity drift detection
│   ├── runtime-grade-orchestrator-warhead.ts  — W3: P1-P12 principle enforcement
│   ├── runtime-grade-tentacle-warhead.ts      — W4: Tentacle-level enforcement
│   ├── tentacle-manager-warhead.ts   — W5: Circuit breaker, backpressure
│   ├── allowlist-warhead.ts          — W6: Tool allowlist from single source
│   ├── context-warhead.ts            — W7: Context doc tracking
│   ├── multi-brain-warhead.ts        — W8: Tool-to-brain routing
│   ├── layer-engine-warhead.ts       — W9: 6-layer firewall engine
│   ├── structured-block-error-warhead.ts  — W10: Passive block counter
│   ├── firewall-audit-warhead.ts     — W11: JSONL audit trail
│   ├── l5-antiderailment-warhead.ts  — W12: 9-class derailment detection
│   ├── f1-isolation-warhead.ts       — W13: Cross-agent isolation
│   ├── evidence-gate-warhead.ts      — W14: Pass rate validation (96% threshold)
│   ├── compaction-survival-warhead.ts — W15: Compaction event tracking
│   ├── recovery-checkpoint-warhead.ts — W16: Recovery state persistence
│   ├── t2t1-pyramid-warhead.ts       — W17: T2→T1 file verification
│   ├── triple-path-injection-warhead.ts — W18: 3-path injection tracking
│   ├── phalanx-identity-files-warhead.ts — W19: Identity file verification
│   ├── warhead-synthesizer-warhead.ts — W20: T1 aggregation metadata
│   ├── per-agent-allowlist-warhead.ts — W21: Per-agent tool permissions
│   ├── parallel-deployment-warhead.ts — W22: Concurrent deploy limit (8 max)
│   └── rate-limit-warhead.ts         — W23: Tool call frequency limiting
├── clusters/
│   ├── index.ts                      — ClusterManager wrapper
│   ├── cluster-engine.ts             — Tentacle lifecycle engine
│   ├── cluster-types.ts              — Cluster/tentacle type definitions
│   ├── acp.ts                        — Agent creation protocol
│   └── sandbox.ts                    — Isolated execution environment
├── execution-brain/
│   ├── index.ts                      — RGE + SRE orchestrator
│   ├── rge/                          — 7-layer semantic analysis (TypeScript Compiler API)
│   │   ├── index.ts                  — RuntimeGradeEngine
│   │   ├── l0-syntactic.ts           — String pattern analysis
│   │   ├── l1-type-contract.ts       — TypeChecker contract verification
│   │   ├── l2-control-flow.ts        — Control flow analysis
│   │   ├── l3-symbol-resolution.ts   — Symbol resolution
│   │   ├── l4-side-effect.ts         — Side effect verification
│   │   ├── l5-pattern-db.ts          — Pattern matching
│   │   ├── l6-compliance.ts          — Compliance scoring
│   │   └── types.ts                  — RGE type definitions
│   └── sre/                          — P1-P11 principle checks
│       ├── index.ts                  — SlopRemovalEngine
│       ├── p1-defensive-import.ts    — Import verification
│       ├── p2-type-certainty.ts      — Type cast guard analysis
│       ├── p3-error-completeness.ts  — Error path analysis
│       ├── checks.ts                 — Check utilities
│       └── types.ts                  — SRE type definitions
├── firewall/
│   ├── firewall-audit.ts            — JSONL audit trail writer
│   └── structured-block-error.ts    — Block error class
├── knowledge/
│   └── knowledge-base.ts            — 4-library knowledge engine
├── planning-brain/
│   └── index.ts                     — Request analysis and deployment planning
├── security/
│   └── tool-allowlist.ts            — Single source allowlist
└── shared/
    ├── agent-identity.ts            — Identity check functions
    ├── t2-loader.ts                 — T2→T1 context pyramid
    ├── context-manager.ts           — 9-canon doc updates
    ├── logger.ts                    — Component-scoped logging
    ├── state-store.ts               — Session state management
    ├── evidence-collector.ts        — Gate evidence collection
    └── brain-messenger.ts           — Inter-brain messaging
context/
└── t2/                              — 10 identity files (T2 cold storage)
    ├── T2_ALIGNMENT_BIBLE.md
    ├── T2_ARCHITECTURE.md
    ├── T2_BUILD_CHAIN.md
    ├── T2_COMPACTION_SURVIVAL.md
    ├── T2_CRASH_RECOVERY.md
    ├── T2_FAILURE_MODES.md
    ├── T2_KRAKEN_LIGHTNING_MODE.md
    ├── T2_KRAKEN_RULES.md
    ├── T2_PATTERNS.md
    └── T2_PLUGIN_ENGINEERING.md
```

---

## Build & Run

```bash
# Install dependencies
bun install

# Build
bun build src/index.ts --outdir dist --target bun --format esm --bundle --external @opencode-ai/plugin

# TypeScript check
bun tsc --noEmit

# Deploy to container
docker cp dist/index.js <container>:/root/.config/opencode/plugins/kraken-agent/dist/index.js
```

---

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `KNOWLEDGE_LIBRARY_BASE` | Path to KNOWLEDGE_LIBRARY root | `''` (must be set) |
| `KRAKEN_T2_DIR` | Path to T2 context files | `/workspace/kraken/context/t2` |
| `KRAKEN_CONTEXT_DIR` | Path to context management docs | `/workspace/kraken/CONTEXT_MANAGEMENT` |
| `KRAKEN_AUDIT_PATH` | Path to JSONL audit trail | `.kraken/firewall-audit.jsonl` |
| `KRAKEN_EVIDENCE_DIR` | Path to evidence files | `.kraken/evidence` |

---

## Architecture Baseline

Kraken v1.4 was forked from v1.3, which used a monolithic `KrakenFirewall` pipeline in `system-brain/firewall/` with inline tool allowlists, hardcoded cluster configs, and static context management. The v1.4 transformation replaced this with 23 independent warheads, a priority-ordered enforcement engine, a T2→T1→T0 context pyramid, and a dynamic tentacle-based cluster engine.

For the complete architecture transformation report, see:
- `KRAKEN_V1.3_TO_V1.4_ARCHITECTURE_TRANSFORMATION.md` — Full migration inventory, dead code analysis, and remaining work
- `KRAKEN_V1.4_PHALANX_MECHANICAL_ARCHITECTURE.md` — Original 1334-line architecture specification
- `context/t2/` — T2 cold storage identity files
