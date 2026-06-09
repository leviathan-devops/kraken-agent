# KRAKEN AGENT v1.4 — PHALANX EDITION

**Runtime-Grade Mechanical Enforcement Engine for opencode Plugin Ecosystems.**

---

## TABLE OF CONTENTS

1. [What Is Kraken?](#1-what-is-kraken)
2. [Architecture Overview](#2-architecture-overview)
3. [The Warhead Interface](#3-the-warhead-interface)
4. [WarheadEngine — The Orchestrator](#4-warheadengine--the-orchestrator)
5. [WarheadRegistry — Priority Ordering](#5-warheadregistry--priority-ordering)
6. [Hook Adapters — SDK Bridge](#6-hook-adapters--sdk-bridge)
7. [Complete Warhead Inventory](#7-complete-warhead-inventory)
8. [Enforcement Pipeline](#8-enforcement-pipeline)
9. [T2→T1→T0 Context Pyramid](#9-t2t1t0-context-pyramid)
10. [Identity Injection — SCAN+REPLACE](#10-identity-injection--scanreplace)
11. [Tool Allowlist — Single Source of Truth](#11-tool-allowlist--single-source-of-truth)
12. [Phalanx Depth Enforcement](#12-phalanx-depth-enforcement)
13. [Agent Identity System](#13-agent-identity-system)
14. [Cluster Engine — Dynamic Tentacles](#14-cluster-engine--dynamic-tentacles)
15. [Execution Brain — RGE + SRE](#15-execution-brain--rge--sre)
16. [Context Management — 9-Canon Docs](#16-context-management--9-canon-docs)
17. [Compaction Survival Protocol](#17-compaction-survival-protocol)
18. [callAgentMap Side Channel](#18-callagentmap-side-channel)
19. [Knowledge Base Architecture](#19-knowledge-base-architecture)
20. [StructuredBlockError — Block Mechanism](#20-structuredblockerror--block-mechanism)
21. [Cross-Plugin Isolation](#21-cross-plugin-isolation)
22. [Error Handling & P1-P11 Compliance](#22-error-handling--p1-p11-compliance)
23. [v1.3 → v1.4 Migration Inventory](#23-v13--v14-migration-inventory)
24. [Remaining Architectural Failures](#24-remaining-architectural-failures)
25. [Project Structure](#25-project-structure)
26. [Build, Deploy & Environment](#26-build-deploy--environment)

---

## 1. WHAT IS KRAKEN?

Kraken is an **opencode plugin** that transforms a base LLM into a **multi-agent orchestration engine** with mechanical enforcement. It does NOT rely on prompt engineering to enforce behavior — it uses 23 independent `Warhead` classes, each with its own hooks that fire in priority order at the SDK level.

**What Kraken IS:**
- A plugin that registers into the opencode runtime
- A mechanical enforcement engine with 23 priority-ordered warheads
- A cluster manager that deploys tentacles (each tentacle = N agent slots)
- A context pyramid that converts 10 T2 identity files into <5K T1 injectables
- A 9-canon document system that mechanically tracks build state, decisions, and failures

**What Kraken is NOT:**
- NOT a chatbot personality layer
- NOT a prompt engineering wrapper
- NOT a single-agent system
- NOT a monolith — 55+ source files across 9 subsystems

---

## 2. ARCHITECTURE OVERVIEW

```
USER MESSAGE
    │
    ▼
┌──────────────────────────────────────────────────────────────────┐
│ 1. chat.message hook                                            │
│    ├── extract agent, sessionId, user message                   │
│    ├── adaptChatMessageContext() → HookContext                   │
│    ├── WarheadEngine.runHooks('chat.message')                  │
│    └── auto-decompose → planning brain if orchestrator         │
└──────────────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. system.transform hook (on EVERY message)                     │
│    ├── SCAN output.system for "opencode" / "interactive CLI"    │
│    ├── REPLACE in-place with 6-section identity header          │
│    ├── synthesizeT1Injectables() → identityT1 (from T2 files)   │
│    ├── WarheadEngine.synthesizeAll() → mechanicalT1 (warheads)  │
│    ├── MERGE identityT1 + mechanicalT1 → combinedT1             │
│    ├── Splice combinedT1 into output.system                     │
│    ├── Load POST-COMPACTION_PROMPT.md → recovery context        │
│    └── WarheadEngine.runHooks('system.transform')              │
└──────────────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. tool.execute.before hook (EVERY tool call)                   │
│    ├── adaptToolBeforeContext() → HookContext                    │
│    ├── isKrakenAgent() check → skip non-Kraken agents           │
│    ├── isOtherPluginAgent() → cross-plugin audit log            │
│    ├── callAgentMap.set(callID, agentName) — side channel       │
│    ├── WarheadEngine.enforce() → iterates warheads by priority  │
│    │   ├── p0: F1Isolation — Kraken-only tools                 │
│    │   ├── p0: LayerEngine — 6-layer firewall                   │
│    │   ├── p1: Phalanx — spawn depth enforcement                │
│    │   ├── p2: ParallelDeployment — max 8 concurrent            │
│    │   ├── p3: TentacleManager — backpressure limits            │
│    │   ├── p4: Allowlist — per-agent tool permissions           │
│    │   ├── p5: RuntimeGradeOrchestrator — P-rules               │
│    │   ├── p15: L5AntiDerailment — 9-class derailment          │
│    │   ├── p20: IdentityWarhead — drift detection              │
│    │   ├── W4: RuntimeGradeTentacle — tentacle-level rules     │
│    │   ├── W21: PerAgentAllowlist — per-agent checks           │
│    │   ├── W23: RateLimit — frequency limiting                 │
│    │   └── W10: StructuredBlockError — passive counter         │
│    │                                                           │
│    │   On BLOCK: warhead.recordBlock() → StructuredBlockError  │
│    │             thrown → runtime catches, tool call blocked    │
│    └── Evidence collection → persist to disk                   │
└──────────────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. tool.execute.after hook (post-execution)                     │
│    ├── adaptToolAfterContext(input, output, agentName)          │
│    ├── agentName from callAgentMap.get(callID) → cleanup       │
│    ├── WarheadEngine.runAfterHooks() → priority-ordered        │
│    │   ├── p2: ParallelDeploymentWarhead — decrement count     │
│    │   ├── p3: TentacleManager — backpressure maintenance      │
│    │   ├── p3: TentacleManager — circuit breaker tracking      │
│    │   ├── p25: MultiBrainWarhead — brain routing             │
│    │   └── p30: ContextWarhead — context update counter        │
│    └── output.metadata contains REAL tool results              │
└──────────────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────────────────────┐
│ 5. compacting hook (context window management)                  │
│    ├── adaptCompactingContext() → HookContext                    │
│    ├── WarheadEngine.runHooks('compacting')                    │
│    │   ├── TriplePathInjectionWarhead — increment counter      │
│    │   └── CompactionSurvivalWarhead — save last state         │
│    ├── Evidence persist                                         │
│    ├── invalidateT2Cache() → t2Cache=null, t1Cache=null       │
│    ├── Inject recovery context [KRAKEN COMPACTION SURVIVAL]    │
│    ├── synthesizeT1Injectables() → fresh identityT1           │
│    ├── WarheadEngine.synthesizeAll() → fresh mechanicalT1     │
│    ├── MERGE and inject combinedT1                             │
│    └── updateSoCPreservation()                                 │
└──────────────────────────────────────────────────────────────────┘
```

### Architectural Layers (Bottom-Up)

| Layer | Component | Responsibility |
|-------|-----------|----------------|
| 7 | WarheadEngine | Orchestrates 23 warheads, fires hooks in priority order |
| 6 | WarheadRegistry | Priority-sorted Map: CRITICAL → HIGH → MEDIUM → LOW |
| 5 | 23 Warhead classes | Each enforces one concern: spawn hierarchy, allowlist, identity, concurrency, etc. |
| 4 | HookAdapter | Bridges SDK (input, output) → Warhead HookContext |
| 3 | T2→T1→T0 Pyramid | Cold storage → precision injectables → runtime behavior |
| 2 | ClusterEngine | Dynamic tentacle lifecycle: anchor → disperse → tighten → dissolve |
| 1 | KnowledgeBase | 4 libraries: AGENT_IDENTITY, ALGORITHMIC_SYSTEMS, RUNTIME_GRADE, TYPESCRIPT_DEEP |
| 0 | ContextManager | 9-canon mechanical document updates |

---

## 3. THE WARHEAD INTERFACE

Every warhead implements this exact interface (defined in `src/engine/types.ts`):

```typescript
interface Warhead {
  readonly name: string;                          // Unique identifier
  readonly priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';  // Priority tier
  readonly knowledgeDependencies: KnowledgePath[]; // Which knowledge files this warhead consumes

  loadKnowledge(base: KnowledgeBase): void;        // Called once at init
  synthesize(state: EngineState): string;           // Called on EVERY system prompt for T1
  getHooks(): EnforcementHook[];                    // Register hook handlers
  diagnose(): WarheadDiagnosis;                     // Run self-check
  recordBlock(event: BlockEvent): void;             // Increment block counter
  getState(): Record<string, unknown>;              // Return current state for diagnostics
}
```

Each `EnforcementHook` has:

```typescript
interface EnforcementHook {
  hookPoint: 'tool.before' | 'tool.after' | 'system.transform' | 'chat.message' | 'compacting';
  priority: number;          // Within-hookpoint priority (lower = fires first)
  layer: string;             // Layer identifier for diagnostics
  description: string;       // Human-readable purpose
  handler: (ctx: HookContext) => HookResult;  // The enforcement function
}
```

Every hook handler returns a `HookResult`:

```typescript
interface HookResult {
  verdict: 'PASS' | 'BLOCK' | 'WARN';
  reason: string;
  correction?: string;  // Shown to the model when blocked
}
```

---

## 4. WARHEAD ENGINE — THE ORCHESTRATOR

**File:** `src/engine/warhead-engine.ts` (271 lines)

The `WarheadEngine` is the central orchestrator. It is instantiated once at plugin init and held as a global singleton in `index.ts`.

### Constructor — Registration Order

The constructor registers all 23 warheads in a specific order within their priority tiers:

```typescript
// CRITICAL (10 warheads)
new PhalanxWarhead()                     // W1  p1  — Spawn hierarchy
new RuntimeGradeOrchestratorWarhead()     // W3  p5  — P1-P12 principles
new RuntimeGradeTentacleWarhead()         // W4  — Tentacle-level rules
new IdentityWarhead()                     // W2  p20 — Identity drift
new AllowlistWarhead()                    // W6  p4  — Tool allowlist
new LayerEngineWarhead()                  // W9  p0  — 6-layer firewall
new L5AntiDerailmentWarhead()             // W12 p15 — Derailment detection
new F1IsolationWarhead()                  // W13 p0  — Cross-agent isolation
new T2T1PyramidWarhead()                  // W17 — T2 file verification (no hooks)
new TriplePathInjectionWarhead()          // W18 — Injection tracking
new WarheadSynthesizerWarhead()           // W20 — T1 metadata

// HIGH (9 warheads)
new TentacleManagerWarhead()              // W5  p3  — Backpressure + circuit breaker
new ContextWarhead()                      // W7  p30 — Context update tracking
new MultiBrainWarhead()                   // W8  p25 — Brain routing
new FirewallAuditWarhead()                // W11 — Audit trail (no hooks, structurally dead)
new EvidenceGateWarhead()                 // W14 — Evidence validation
new CompactionSurvivalWarhead()           // W15 p10 — Compaction tracking
new RecoveryCheckpointWarhead()           // W16 — Recovery state
new PerAgentAllowlistWarhead()            // W21 — Per-agent allowlist
new ParallelDeploymentWarhead()           // W22 p2  — Concurrent deploy limits

// MEDIUM (1 warhead)
new PhalanxIdentityFilesWarhead()         // W19 — Identity file verification

// LOW (1 warhead)
new RateLimitWarhead()                    // W23 — Frequency limiting

// CRITICAL (passive, registered last)
new StructuredBlockErrorWarhead()         // W10 — Passive block counter
```

### Key Methods

| Method | Hook Point | Behavior |
|--------|-----------|----------|
| `enforce(context)` | tool.before | Iterates warheads by priority, calls tool.before hooks. On BLOCK: throws StructuredBlockError. Priority-ordered. |
| `runAfterHooks(context)` | tool.after | Iterates warheads by priority, calls tool.after hooks. No throws — pure state maintenance. Uses getByPriority(). |
| `runHooks(hookPoint, context)` | system.transform, compacting, chat.message | Iterates ALL warheads (registration order), calls hooks matching the hookPoint. Non-blocking. |
| `synthesizeAll(state)` | (T1) | Iterates warheads by priority, calls synthesize(). Concatenates into single T1 string. |
| `getState()` | (any) | Queries TentacleManager and ParallelDeployment warheads for real tentacle/agent counts. Aggregates block counts from all diagnoses. |
| `initialize()` | (init) | Loads 4 knowledge libraries, wires into every warhead, runs initial diagnosis. |
| `diagnoseAll()` | (diagnostics) | Calls diagnose() on every warhead. One broken warhead cannot crash others. |

### The enforce() Method — Detailed Flow

```typescript
enforce(context: HookContext): void {
    // Periodic health check (every 100 calls)
    if (++this.callCount % 100 === 0) this.diagnoseAll();

    for (const warhead of this.registry.getByPriority()) {
        for (const hook of warhead.getHooks()) {
            if (hook.hookPoint !== 'tool.before') continue;
            try {
                const result = hook.handler(context);
                if (result.verdict === 'BLOCK') {
                    // Record block on the blocking warhead
                    warhead.recordBlock({ layer, reason, toolName, agentName, timestamp });
                    // Throw StructuredBlockError — runtime catches as rejection
                    throw new StructuredBlockError(hook.layer, result.reason,
                        result.correction ?? '', context.toolName);
                }
            } catch (e) {
                // Re-throw blocks, suppress other hook errors
                if (e instanceof StructuredBlockError) throw e;
                console.error('[WarheadEngine] Hook error in ' +
                    warhead.name + '.' + hook.layer + ': ' + e.message);
            }
        }
    }
}
```

Key properties:
1. **Priority ordering**: Lower priority number fires first. p0 runs before p1.
2. **Short-circuit**: Once a warhead returns BLOCK, no further warheads fire.
3. **Error isolation**: One warhead throwing a non-StructuredBlockError does not crash the engine.
4. **Block recording**: Only the blocking warhead's recordBlock() is called — NOT all warheads.

---

## 5. WARHEAD REGISTRY — PRIORITY ORDERING

**File:** `src/engine/warhead-registry.ts` (88 lines)

### Priority Tier Mapping

```typescript
const PRIORITY_ORDER: Record<WarheadPriority, number> = {
    'CRITICAL': 0,   // Fires first
    'HIGH': 1,       // Fires second
    'MEDIUM': 2,     // Fires third
    'LOW': 3,        // Fires last
};
```

### Methods

| Method | Returns | Behavior |
|--------|---------|----------|
| `register(warhead)` | void | Adds to Map. Logs error on duplicate name. |
| `getByPriority()` | Warhead[] | Sorts by priority tier (CRITICAL→HIGH→MEDIUM→LOW), then by registration order within tier |
| `getAll()` | Warhead[] | Registration order (not sorted) |
| `get(name)` | Warhead \| undefined | Lookup by name string |
| `count()` | number | Total registered |
| `diagnoseAll()` | WarheadDiagnosis[] | Wraps each in try/catch for error isolation |

### Within-Tier Ordering

Within the same priority tier, warheads fire in **registration order**. For example, both F1IsolationWarhead (p0) and LayerEngineWarhead (p0) are CRITICAL. F1 is registered first, so its hook fires first:

1. F1IsolationWarhead.p0.F1 → checks Kraken-only tools
2. LayerEngineWarhead.p0.LAYER_ENGINE → runs 6-layer firewall

This ordering matters because F1 provides a faster, narrower check before the full LayerEngine evaluation.

---

## 6. HOOK ADAPTERS — SDK BRIDGE

**File:** `src/engine/hook-adapter.ts` (288 lines)

The opencode SDK fires hooks with `(input: Record<string, unknown>, output: Record<string, unknown>)`. The WarheadEngine expects `HookContext { toolName, agentName, args, metadata }`. The adapters bridge this gap with P2 runtime guards on every extraction (no unchecked `as` casts).

### Adapter: `adaptToolBeforeContext`

```typescript
// Input from SDK:  { tool, sessionID, callID, session: { agentName } }
// Output from SDK: { args }
// Returns:         HookContext { toolName, agentName, args, metadata }
//
// Extraction:
//   toolName ← input.tool
//   agentName ← input.session.agentName || input.agent || ''
//   args ← output.args (parsed) || input.args (raw)
//   metadata.sessionId ← input.sessionID
//   metadata.timestamp ← Date.now()
```

### Adapter: `adaptToolAfterContext`

```typescript
// Input from SDK:  { tool, sessionID, callID, args }
// Output from SDK: { title, output, metadata }
// Params:          agentName (from callAgentMap — SDK does NOT provide it)
// Returns:         HookContext { toolName, agentName, args, metadata }
//
// Key difference from before:
//   output.metadata contains REAL tool results (slots, timestamps, errors)
//   This is what tool.after hooks need for accurate state tracking
//   agentName MUST come from callAgentMap side channel (not from SDK)
//
// Extraction:
//   toolName ← input.tool
//   agentName ← parameter (from callAgentMap)
//   args ← input.args (raw, already executed)
//   metadata.sessionId ← input.sessionID
//   metadata.resultTitle ← output.title
//   metadata.resultOutput ← output.output
//   metadata ← spread output.metadata (REAL tool results)
//   metadata.timestamp ← Date.now()
```

### Adapter: `adaptTransformContext`

```typescript
// Input from SDK:  { sessionID, model }
// Output from SDK: { system: string[] }
// Returns:         HookContext with args containing input, output, system array
//
// NOTE: SDK system.transform input has NO agent field
// Agent isolation is handled by the hook body's isKrakenAgent() check
```

### Adapter: `adaptCompactingContext`

```typescript
// Input from SDK:  { sessionID }
// Output from SDK: { context: string[], prompt?: string }
// Returns:         HookContext wrapping input/output for warhead consumption
```

### Adapter: `adaptChatMessageContext`

```typescript
// Input from SDK:  { sessionID, agent?, messageID }
// Output from SDK: { message: UserMessage, parts }
// Returns:         HookContext with extracted userMessage text
//
// Extracts userMessage from output.message.content → output.message.text
// → input.message → fallback to empty string
```

### Type Guard Layer (P2 Compliance)

Every adapter uses these internal guards:

| Guard | Purpose |
|-------|---------|
| `isObject(value)` | `typeof === 'object' && !== null && !Array.isArray` |
| `isString(value)` | `typeof === 'string'` |
| `extractString(obj, key, fallback)` | Guarded string extraction |
| `extractNestedString(root, ...path)` | Guarded deep string extraction |

No `as` cast exists without a preceding guard check.

---

## 7. COMPLETE WARHEAD INVENTORY

### tool.before Enforcement (13 hooks from 11 warheads)

| Priority | Warhead | Layer | What It Enforces | Block Reason Example |
|----------|---------|-------|-------------------|---------------------|
| p0 | W13 F1Isolation | `F1` | Kraken-only tools (deploy_tentacle, aggregate_results, execution_brain_analyze, complete_todo) restricted to orchestrator | `[F1] Non-Kraken agent 'shark-alpha-1' called deploy_tentacle` |
| p0 | W9 LayerEngine | `LAYER_ENGINE` | 6-layer sequential evaluation: PHALANX_IDENTITY → ALLOWLIST → ZONE → THEATRICAL → SPAWN_VALIDATE | `[F1] Non-Kraken agent called Kraken tool` → `[ZONE] Kraken writes only to CONTEXT_MANAGEMENT/` → `[THEATRICAL] Mock/stub/TODO detected` |
| p1 | W1 Phalanx | `PHALANX_DEPTH` | 4-tier spawn hierarchy: Kraken(d1) → Tentacle(d2) → Cluster(d3) → Leaf(d4). Blocks layer-skipping and depth-exceeding spawns. | `[PHALANX_BLOCKED] kraken-cluster-agent at depth 3 cannot spawn. Max depth is 4.` |
| p2 | W22 ParallelDeployment | `PARALLEL` | Max 8 concurrent deploy_tentacle calls. Increments on deploy. | `[PARALLEL] 8 simultaneous deploys — Wait for a deploy to complete.` |
| p3 | W5 TentacleManager | `BACKPRESSURE` | Max 8 tentacles and 16 agents total across all deployments. | `[BACKPRESSURE] 16 agents running — Wait for tentacles.` |
| p4 | W6 Allowlist | `ALLOWLIST` | Per-agent tool allowlists from single source of truth (tool-allowlist.ts). | `[ALLOWLIST_BLOCKED] bash not allowed for kraken` |
| p5 | W3 RuntimeGradeOrchestrator | `RUNTIME_GRADE_ORCHESTRATOR` | Blocks direct tool use (bash, edit, patch, delete, mcp_*) at Kraken level. Blocks self-implementation patterns. P1-P12 principle rules. | `[RGE_BLOCKED] Kraken cannot use bash` |
| p15 | W12 L5AntiDerailment | `L5` | 9-class derailment pattern detection across tool arguments: HOST_FALLBACK, SUCCESS_CLAIM, MODEL_USAGE, MOCK_STUB, SIMPLIFICATION, SCOPE_CREEP, UNDERMINING, SELF_REFERENCE, AGENT_RESISTANCE | `[L5.1 HOST_FALLBACK] Derailment detected` |
| p20 | W2 IdentityWarhead | `IDENTITY_ENFORCEMENT` | Scans tool arguments for identity drift patterns: "i am opencode", "i'm opencode", "as an ai assistant", "as an ai model" | `[IDENTITY_BLOCKED] Identity drift. You are KRAKEN ORCHESTRATOR v1.4.` |
| — | W4 RuntimeGradeTentacle | `TENTACLE` | Self-implementation blocking at tentacle level. Permission violation tracking. (Not fully audited) | `[TENTACLE_BLOCKED]` |
| — | W21 PerAgentAllowlist | Per-agent tool permissions | Additional per-agent allowlist checks beyond the main AllowlistWarhead. (Not fully audited) | Per-agent block |
| — | W23 RateLimit | Rate-limit enforcement | Tool call frequency limiting. (Not fully audited) | Rate limit exceeded |
| — | W10 StructuredBlockError | — | Passive block counter — no enforcement, only records blocks reported by other warheads. | (passive) |

### tool.after Tracking (5 hooks from 4 warheads)

| Priority | Warhead | Layer | What It Tracks | How It Uses output.metadata |
|----------|---------|-------|----------------|----------------------------|
| p2 | W22 ParallelDeployment | `PARALLEL_DEC` | Decrements active deploy count on aggregate_results. Detects deploy errors from metadata.error. | `ctx.metadata?.error` — detects deploy failures |
| p3 | W5 TentacleManager | `BACKPRESSURE_MAINT` | Increments tentacle/agent counters on deploy_tentacle. Decrements on aggregate_results. Uses metadata.slots for real slot count. | `ctx.metadata.slots` — real slot count from deploy output |
| p3 | W5 TentacleManager | `CIRCUIT_BREAKER` | Tracks failure count per tentacleId. Opens circuit at threshold=3 failures. Cooldown=30s. | `ctx.args.status` — report_to_kraken status |
| p25 | W8 MultiBrain | `BRAIN_ROUTE` | Routes tools to PLANNING (deploy_tentacle, task), EXECUTION (get_cluster_status, aggregate_results), or SYSTEM (report_to_kraken, complete_todo) brain. Tracks message count. | (tracks by toolName only) |
| p30 | W7 ContextWarhead | `CONTEXT_UPDATE` | Counts context-affecting tool calls (deploy_tentacle, report_to_kraken, aggregate_results, complete_todo). Reports 9-canon doc status. | (tracks by toolName only) |

### system.transform Tracking (1 hook)

| Priority | Warhead | Layer | What It Tracks |
|----------|---------|-------|----------------|
| p0 | W18 TriplePathInjection | `INJECT_P1` | Increments system.transform path counter. Part of 3-path redundant injection monitoring. |

### compacting Tracking (2 hooks from 2 warheads, plus inline cache invalidation)

| Priority | Warhead | Layer | What It Tracks |
|----------|---------|-------|----------------|
| p0 | W18 TriplePathInjection | `INJECT_P3` | Increments compacting path counter. |
| p10 | W15 CompactionSurvival | `COMPACTION` | Increments compaction counter. Saves last gate and active task state. |

**Additionally, inline in the compacting handler (not in a warhead):**
- `invalidateT2Cache()` — clears t2Cache and t1Cache for fresh re-synthesis

### Warheads With Zero Hooks (Observational / Passive Only)

| Warhead | What It Actually Does | Why It Has No Hooks |
|---------|----------------------|---------------------|
| W11 FirewallAuditWarhead | Has recordBlock() that writes to .kraken/firewall-audit.jsonl | **Structural bug** — recordBlock() only fires on the blocking warhead; W11 has no hooks, so can never be the blocker. |
| W14 EvidenceGateWarhead | Checks ContainerTestResult.json exists with >=96% pass rate | Reports status in T1 synthesis only. No enforcement — diagnostic only. |
| W17 T2T1PyramidWarhead | Counts T2 files at configured directory | Reports file count. **Should** wire invalidateT2Cache() into compacting hook but currently has zero hooks. |
| W19 PhalanxIdentityFilesWarhead | Counts identity files at identity/kraken/ | Reports file count. No enforcement — file existence check only. |
| W16 RecoveryCheckpointWarhead | Recovery state persistence | Passive state holder. |
| W20 WarheadSynthesizerWarhead | T1 aggregation metadata | Passive — reports synthesized T1 stats. |
| W10 StructuredBlockErrorWarhead | Passive block counter | Counts blocks, no enforcement. |

---

## 8. ENFORCEMENT PIPELINE

### Full Tool Call Trace

When the model calls a tool (e.g., `deploy_tentacle`), the following happens:

```
1. SDK receives tool call from model

2. SDK fires tool.execute.before(input, output)
   ├── input = { tool: 'deploy_tentacle', sessionID: '...', callID: '...' }
   └── output = { args: { task: '...', taskType: 'BUILD' } }

3. hook-adapter.ts: adaptToolBeforeContext(input, output)
   ├── extractToolName(input) → 'deploy_tentacle'
   ├── extractAgentName(input) → 'kraken' (from input.session.agentName)
   ├── extractToolArgs(input, output) → { task: '...', taskType: 'BUILD' }
   └── returns HookContext { toolName, agentName, args, metadata }

4. index.ts: agent filter
   ├── isKrakenAgent('kraken') → true → continue
   └── callAgentMap.set('call_123', 'kraken') → store for tool.after

5. WarheadEngine.enforce(context):
   ├── getByPriority() → [F1Isolation p0, LayerEngine p0, Phalanx p1, ...]
   │
   ├── F1Isolation.p0: toolName='deploy_tentacle' → 'deploy_tentacle' is in KRAKEN_ONLY_TOOLS
   │   └── agentName='kraken' → PASS
   │
   ├── LayerEngine.p0.LAYER_ENGINE:
   │   ├── PHALANX_IDENTITY: agent='kraken', tool='deploy_tentacle' → PASS
   │   ├── ALLOWLIST: kraken allowlist has deploy_tentacle → PASS
   │   ├── ZONE: not a write tool → PASS
   │   ├── THEATRICAL: args don't match mock/stub patterns → PASS
   │   └── SPAWN_VALIDATE: not a task tool → PASS
   │
   ├── PhalanxWarhead.p1: toolName != 'task' → PASS (phalanx only checks task calls)
   │
   ├── ParallelDeployment.p2: toolName='deploy_tentacle', active < 8 → PASS, active++
   │
   ├── TentacleManager.p3.BACKPRESSURE: agents < 16 → PASS
   │
   ├── AllowlistWarhead.p4: isToolAllowed('kraken', 'deploy_tentacle') → true → PASS
   │
   ├── RuntimeGradeOrchestrator.p5: 'deploy_tentacle' not in BLOCKED_TOOLS → PASS
   │
   ├── L5AntiDerailment.p15: args don't match any pattern → PASS
   │
   ├── IdentityWarhead.p20: args don't contain drift patterns → PASS
   │
   └── All hooks passed → no StructuredBlockError thrown → tool proceeds

6. Tool executes (deploy_tentacle logic runs, returns tentacleId + slots)

7. SDK fires tool.execute.after(input, output)
   ├── input = { tool: 'deploy_tentacle', callID: 'call_123', ... }
   └── output = { title: 'Tentacle Anchored', output: '{"success":true,...}',
                  metadata: { tentacleId: 'T1', slotCount: 3 } }

8. hook-adapter.ts: adaptToolAfterContext(input, output, 'kraken')
   ├── agentName = callAgentMap.get('call_123') → 'kraken'
   ├── callAgentMap.delete('call_123') → cleanup
   ├── metadata = { ...output.metadata, slotCount: 3, timestamp: ... }
   └── returns HookContext

9. WarheadEngine.runAfterHooks(context):
   ├── ParallelDeployment.p2: not aggregate_results → PASS (no decrement)
   ├── TentacleManager.p3.BACKPRESSURE_MAINT: deploy_tentacle → activeTentacles++
   │   └── slots = metadata.slotCount || 2 → 3 → activeAgents += 3
   ├── TentacleManager.p3.CIRCUIT_BREAKER: not report_to_kraken → PASS
   ├── MultiBrain.p25: deploy_tentacle → PLANNING brain → messageCount++
   └── ContextWarhead.p30: deploy_tentacle is in CONTEXT_TOOLS → updateCount++

10. Evidence collected → persist to disk
```

### Block Trace Example

If a non-Kraken agent tries `deploy_tentacle`:

```
1. tool.execute.before fires
2. adaptToolBeforeContext → agentName='shark-alpha-1', toolName='deploy_tentacle'
3. isKrakenAgent('shark-alpha-1') → true (isClusterAgent with prefix-hyphen) → continue
4. Enforce:
   ├── F1Isolation.p0: 'deploy_tentacle' in KRAKEN_ONLY_TOOLS
   │   ├── agentName='shark-alpha-1', agentName !== 'kraken' → BLOCK
   │   ├── f1Blocks++
   │   ├── warhead.recordBlock({ layer:'F1', reason:'...', ... })
   │   └── throw new StructuredBlockError('F1', '[F1] Non-Kraken agent...', 'Switch to Kraken tab.', 'deploy_tentacle')
   │
   ├── StructuredBlockError thrown → caught by SDK
   ├── SDK rejects the tool call
   └── Model receives: "[F1] Non-Kraken agent 'shark-alpha-1' called deploy_tentacle. Switch to Kraken tab."

5. tool.execute.after does NOT fire (tool was blocked before execution)
6. No evidence collected
```

---

## 9. T2→T1→T0 CONTEXT PYRAMID

**File:** `src/shared/t2-loader.ts` (477 lines)

### The 3 Tiers

```
T2 (Cold Storage)
├── 10 files at context/t2/T2_*.md
├── ~40K chars total
├── Loaded on first synthesizeT1Injectables() call
├── Session-duration cache (never expires)
├── Invalidated on compaction
└── NEVER injected into system prompt directly (would burn 10K+ tokens)
    │
    │  synthesizeT1Injectables() extracts behavioral rules:
    │  - Imperatives (MUST, ALWAYS, ONLY)
    │  - Prohibitions (NEVER, DO NOT, AVOID)
    │  - Decision trees (IF/THEN)
    │  - Numbered rules with behavioral content
    │  - Bullet points with action verbs
    │  - SKIPS: prose, examples, code blocks >10 lines, background
    │
    ▼
T1 (Warm Injectables)
├── <5K chars total
├── Priority-ordered: HIGH → MEDIUM → LOW
├── Each injectable capped at 500 chars
├── Injected on EVERY system.transform and compacting
├── Contains ONLY runtime-behavior-enforcing content
├── Produces [T1 CONTEXT INJECTABLES — RUNTIME BEHAVIOR ENFORCEMENT] block
└── Combined with mechanicalT1 from WarheadEngine.synthesizeAll()
    │
    │  injected into output.system via splice(indentIdx, 0, combinedT1)
    │
    ▼
T0 (Hot Runtime)
├── Model's active behavior in conversation
├── Shaped by T1 injectables on every message
└── Cannot be directly read/written — it IS the model state
```

### The 10 T2 Files

| File | Priority | Content |
|------|----------|---------|
| `T2_ALIGNMENT_BIBLE.md` | HIGH | Behavioral alignment rules |
| `T2_ARCHITECTURE.md` | HIGH | System architecture reference |
| `T2_BUILD_CHAIN.md` | MEDIUM | Build and deploy chain |
| `T2_COMPACTION_SURVIVAL.md` | HIGH | Post-compaction recovery |
| `T2_CRASH_RECOVERY.md` | LOW | Crash recovery procedures |
| `T2_FAILURE_MODES.md` | MEDIUM | Known failure patterns |
| `T2_KRAKEN_LIGHTNING_MODE.md` | HIGH | Default operating mode rules |
| `T2_KRAKEN_RULES.md` | HIGH | Non-negotiable rules |
| `T2_PATTERNS.md` | MEDIUM | Reusable patterns |
| `T2_PLUGIN_ENGINEERING.md` | LOW | Plugin engineering guidelines |

### T1 Synthesis Algorithm

```
For each T2 file:
  1. Extract headings (##, #) that contain: Rule, Principle, Protocol, Requirement, Standard, Mandate
  2. Extract bold patterns (**pattern**)
  3. Extract numbered rules (1., 2., 3.) that contain: MUST, NEVER, ALWAYS, ONLY, DELEGATE, VERIFY
  4. Extract prohibitions: NEVER, DO NOT, AVOID
  5. Extract decision trees: IF/THEN patterns
  6. Extract behavioral bullet points: use, call, run, check, verify, ensure, validate
  7. Filter OUT: code blocks >10 lines, explanatory prose, background, examples, notes
  8. Limit to 500 chars per injectable
  9. Sort by priority: HIGH first, MEDIUM second, LOW last

  If any file is missing/unreadable → produces "[T1:PRIORITY] FILE: CONTENT UNAVAILABLE"
```

### T1 + Mechanical Merge (in system.transform)

```typescript
// Both are called and concatenated:
const identityT1 = synthesizeT1Injectables();    // Behavioral rules from T2
const mechanicalT1 = getWarheadEngine().synthesizeAll(engineState);  // Enforcement state from warheads
const combinedT1 = identityT1 + '\n' + mechanicalT1;

// Example output:
// [T1 CONTEXT INJECTABLES — RUNTIME BEHAVIOR ENFORCEMENT]
// [T1:HIGH] T2:KRAKEN_LIGHTNING_MODE
// 1. DELEGATE FIRST: Always use deploy_tentacle before direct execution
// NEVER edit code, write files, or run bash directly
// ...
// [T1 INJECTABLES END — 8/10 active injectables, 4231 chars]
//
// [KRAKEN T1 WARHEADS — MECHANICAL STATE COMPILED]
// [KRAKEN T1] PHALANX: kraken=d1 tentacle=d2 cluster=d3 | Max: d4 | Blocks: 0
// [KRAKEN T1] CONCURRENCY: 1/8 tentacles | 3/16 agents | Open circuits: 0
// ...
// [KRAKEN T1 WARHEADS END — 23 active]
```

---

## 10. IDENTITY INJECTION — SCAN+REPLACE

### The Problem with unshift()

In v1.3, identity was injected with `output.system.unshift(identityHeader)`. The problem: the runtime APPENDS its own default prompt ("You are opencode, an interactive CLI tool...") AFTER `system.transform` returns. The result was:

```
[KRAKEN IDENTITY BINDING]           ← unshifted first
You are opencode...                 ← appended AFTER by runtime (WINS)
```

The runtime default comes LAST in the array, and since the model reads left-to-right/bottom-of-array, the runtime default wins.

### The Fix: SCAN+REPLACE

v1.4 replaces in-place:

```typescript
// SCAN for runtime default
let replaced = false;
for (let i = 0; i < outputSys.length; i++) {
    const s = outputSys[i];
    if (typeof s === 'string' && (
        s.includes('opencode') ||
        s.includes('interactive CLI') ||
        s.includes('software engineering tasks')
    )) {
        // REPLACE in-place — runtime default is gone
        outputSys[i] = identityHeader;
        replaced = true;
        break;
    }
}

// FALLBACK: if no runtime default found (first-ever call), unshift
if (!replaced) {
    outputSys.unshift(identityHeader);
}
```

### The 6-Section Identity Header

The header is a ~900-line inline template in `src/index.ts:914-1049`:

| Section | Lines | Content |
|---------|-------|---------|
| [KRAKEN IDENTITY BINDING] | 914-936 | 3 NOT statements (NOT opencode, NOT chatbot, NOT interactive CLI), phalanx architecture, identity responses |
| [KRAKEN LIGHTNING MODE] | 937-965 | Default operating mode: delegate first, tentacle execution steps, verification requirements |
| [DEPLOYMENT PATTERNS] | 966-993 | BUILD vs DEBUG vs DIRECT execution patterns, tool restrictions |
| [KNOWN DERAILMENT PATTERNS] | 994-1016 | D1-D6: chat.message identity, array replacement, event hooks, config instructions, false success, static docs |
| [CONTEXT MANAGEMENT ARCHITECTURE] | 1018-1033 | 9 canon docs with update triggers |
| [TOOL ACCESS — ALLOWLIST ENFORCED] | 1035-1048 | Per-agent tool lists (7 for kraken, 4 for executor, 9 for cluster) |

### Deduplication

Before injecting, the hook checks if `[KRAKEN IDENTITY BINDING]` already exists in `output.system`. If yes, it skips entirely. This prevents double-injection on subsequent messages in the same session.

---

## 11. TOOL ALLOWLIST — SINGLE SOURCE OF TRUTH

**File:** `src/security/tool-allowlist.ts` (75 lines)

In v1.3, tool allowlists were inline `Set` objects inside the `tool.execute.before` handler. This meant:
- To change a tool permission, you had to edit `index.ts`
- Different consumers (allowlist enforcement, T1 synthesis, documentation) had to maintain their own copies
- Inconsistent: one place might allow a tool another blocks

v1.4 externalizes everything into a single `ALLOWLISTS` record:

```typescript
export const ALLOWLISTS: Readonly<Record<string, readonly string[]>> = {
    'kraken': [
        'deploy_tentacle', 'get_cluster_status', 'aggregate_results',
        'execution_brain_analyze', 'read_kraken_context', 'report_to_kraken',
        'complete_todo', 'task',
    ],
    'kraken-tentacle-executor': [
        'task', 'get_cluster_status', 'read_kraken_context', 'report_to_kraken',
        'glob', 'grep', 'read', 'write',
    ],
    'kraken-cluster-agent': [
        'bash', 'write', 'read', 'edit', 'glob', 'grep',
        'task', 'read_kraken_context', 'report_to_kraken',
    ],
} as const;
```

### O(1) Lookup via Pre-Computed Sets

```typescript
const allowlistSets = new Map<string, ReadonlySet<string>>();

function getAllowlistSet(agent: string): ReadonlySet<string> {
    const cached = allowlistSets.get(agent);
    if (cached) return cached;
    const list = ALLOWLISTS[agent];
    const set = list ? new Set(list) : new Set<string>();
    allowlistSets.set(agent, set);
    return set;
}
```

### Consumers

| Consumer | How It Uses ALLOWLISTS |
|----------|----------------------|
| W6 AllowlistWarhead | `isToolAllowed(agent, tool)` — blocks if not allowed |
| W9 LayerEngineWarhead (LAYER 3) | Checks `ALLOWLISTS[input.agentName].includes(input.toolName)` |
| W21 PerAgentAllowlistWarhead | Additional per-agent checks |
| T1 synthesis (RuntimeGradeOrchestratorWarhead) | Reports allowed tools in T1 string |
| Identity header | Documents allowed tools per agent |

Changing `ALLOWLISTS` in this single file updates ALL consumers simultaneously.

---

## 12. PHALANX DEPTH ENFORCEMENT

### The 4-Tier Hierarchy

```
Depth 1: Kraken (orchestrator)
    │  spawns ONLY kraken-tentacle-executor
    ▼
Depth 2: Tentacle Executor
    │  spawns ONLY kraken-cluster-agent
    ▼
Depth 3: Cluster Agent
    │  spawns ONLY explore/general (vanilla)
    ▼
Depth 4: Vanilla Agent (leaf)
    │  spawns NOTHING
    ▼
   [END]
```

### Hardcoded Permissions Map

```typescript
const SPAWN_PERMISSIONS: Readonly<Record<string, readonly string[]>> = {
    'kraken': ['kraken-tentacle-executor'],
    'kraken-tentacle-executor': ['kraken-cluster-agent'],
    'kraken-cluster-agent': ['explore', 'general'],
    // Vanilla agents (explore, general) have NO entry → cannot spawn anything
};

const PHALANX_DEPTHS: Readonly<Record<string, number>> = {
    'kraken': 1,
    'kraken-tentacle-executor': 2,
    'kraken-cluster-agent': 3,
};

const MAX_DEPTH = 4;
```

### Enforcement Logic (W1 PhalanxWarhead)

The `PhalanxWarhead` registers a single `tool.before` hook at priority p1. It ONLY checks `task` calls (spawns):

```typescript
handler: (ctx: HookContext): HookResult => {
    // Only enforce on task() calls
    if (ctx.toolName !== 'task') return { verdict: 'PASS', reason: 'Not a task call' };

    // Extract target agent from args
    const target = ctx.args.agent || ctx.args.agentType || '';

    // If no target specified, we can't enforce — pass
    if (!target) return { verdict: 'PASS', reason: 'No target agent' };

    // Get spawner's depth (defaults to MAX_DEPTH for unknown agents)
    const depth = PHALANX_DEPTHS[ctx.agentName] ?? MAX_DEPTH;

    // Rule 1: Depth cap — cannot spawn at or beyond max depth
    if (depth >= MAX_DEPTH) return {
        verdict: 'BLOCK',
        reason: `[PHALANX_BLOCKED] ${ctx.agentName} at max depth ${depth}`,
        correction: 'Cannot spawn from this depth.'
    };

    // Rule 2: Permission check — does this spawner have this target?
    const allowed = SPAWN_PERMISSIONS[ctx.agentName];
    if (!allowed) return {
        verdict: 'BLOCK',
        reason: `[PHALANX_BLOCKED] ${ctx.agentName} has no spawn permissions`,
        correction: 'Not in phalanx map.'
    };

    // Rule 3: Target check — is the target in the allowed list?
    if (!allowed.includes(target)) return {
        verdict: 'BLOCK',
        reason: `[PHALANX_BLOCKED] ${ctx.agentName} can only spawn [${allowed.join(',')}]`,
        correction: `Spawn only: ${allowed.join(', ')}`
    };

    return { verdict: 'PASS', reason: `${ctx.agentName} (d${depth}) -> ${target} (d${depth + 1})` };
}
```

### What Gets Blocked

| Scenario | Block Reason |
|----------|-------------|
| Kraken spawns kraken-cluster-agent directly (layer skip) | `kraken can only spawn [kraken-tentacle-executor]` |
| Tentacle executor spawns another tentacle executor | `kraken-tentacle-executor can only spawn [kraken-cluster-agent]` |
| Cluster agent spawns another cluster agent | `kraken-cluster-agent at max depth 3` |
| Vanilla agent attempts any spawn | `explore at max depth 4` |
| Unknown agent attempts any spawn | `unknown-agent has no spawn permissions` |

---

## 13. AGENT IDENTITY SYSTEM

**File:** `src/shared/agent-identity.ts` (90 lines)

### Agent Classification

```
All agents
├── Kraken-managed (isKrakenAgent)
│   ├── Orchestrators (isKrakenOrchestrator)
│   │   ├── kraken
│   │   ├── kraken-executor
│   │   └── kraken-tentacle-executor
│   │
│   └── Cluster agents (isClusterAgent)
│       ├── kraken-cluster-agent (exact match)
│       ├── shark-* (hyphen-suffix: shark-alpha-1, shark-beta-2)
│       └── manta-* (hyphen-suffix: manta-gamma-1)
│
├── Vanilla agents (isVanillaAgent)
│   ├── explore
│   ├── general
│   ├── plan
│   └── build
│
└── Other plugin agents (isOtherPluginAgent)
    ├── shark (Shark plugin primary — NO hyphen)
    ├── trident (Trident plugin primary)
    ├── spider (Spider plugin primary)
    └── Any agent not Kraken and not vanilla
```

### The Hyphen-Suffix Rule

```typescript
function isClusterAgent(agentName: string | undefined): boolean {
    // Exact match for kraken-cluster-agent
    if (KRAKEN_CLUSTER_AGENTS.has(agentName)) return true;

    // Prefix-hyphen match for legacy cluster agents
    for (const prefix of KRAKEN_CLUSTER_PREFIXES) {  // ['shark', 'manta']
        // "shark" → NOT cluster (Shark plugin primary)
        // "shark-alpha-1" → cluster (Kraken-managed subagent)
        if (agentName.startsWith(prefix + '-')) return true;
    }
    return false;
}
```

This is critical for tab-toggle isolation. When the user switches to the "Shark" tab in TUI, the agent is `'shark'` (no hyphen). `isClusterAgent('shark')` returns `false`. But when Kraken spawns a cluster agent named `'shark-alpha-1'`, `isClusterAgent('shark-alpha-1')` returns `true`.

### How Identity Determines Hook Behavior

| Hook | isKrakenOrchestrator | isClusterAgent | Neither |
|------|---------------------|---------------|---------|
| system.transform | Inject 6-section identity + T1 context | Inject lightweight [KRAKEN TASK CONTEXT] | Skip (other plugin's agent) |
| tool.execute.before | Run all warheads | Run all warheads | Skip (early return) |
| chat.message | Auto-decompose messages | Forward messages | Skip |

---

## 14. CLUSTER ENGINE — DYNAMIC TENTACLES

**Files:** `src/clusters/index.ts`, `src/clusters/cluster-engine.ts`

### Tentacle Lifecycle

```
anchorTentacle(task, criteria, mode, agentType, agentCount)
    │
    ├── Calculates N agent slots based on task complexity
    ├── Each slot gets a microTask (sub-task derived from macro task)
    ├── Creates ClusterTentacle with tentacleId, mode, slots
    └── Returns tentacle object
    │
    ▼
disperseTentacle(tentacleId, spawnFn)
    │
    ├── For each slot, calls spawnFn(microTask, agentType)
    ├── Assigns task IDs to slots
    └── Tentacle becomes ACTIVE
    │
    ▼
    [Agent slots execute independently]
    │
    ▼
tightenTentacle(tentacleId, statusFn)
    │
    ├── For each slot, calls statusFn(taskId)
    ├── Checks completion status
    └── Returns true when ALL slots complete
    │
    ▼
dissolveTentacle(tentacleId)
    │
    ├── Collects all slot outputs
    ├── Merges into single result
    └── Returns TentacleResult with outputs, mergedOutput, counts
```

### Agent Count Calculation

```typescript
// In ClusterManager:
calculateAgentCount(task: string): number {
    const wordCount = task.split(/\s+/).length;
    if (wordCount > 200) return 8;    // Complex task
    if (wordCount > 100) return 4;    // Medium task
    return 2;                          // Simple task
}
```

### Slot Status Model

| Status | Meaning |
|--------|---------|
| `'pending'` | Slot created, not yet assigned |
| `'assigned'` | Task dispatched to agent |
| `'running'` | Agent executing |
| `'completed'` | Agent reported success |
| `'failed'` | Agent reported failure |

### Cluster Types

```typescript
interface ClusterTentacle {
    tentacleId: string;
    macroTask: string;
    acceptanceCriteria: string[];
    mode: 'build' | 'debug' | 'analyze';
    agentType: ClusterAgentType;  // SHARK or MANTA
    agentSlots: AgentSlot[];
    status: 'pending' | 'active' | 'completed' | 'failed';
    createdAt: number;
}

interface AgentSlot {
    slotId: string;
    microTask: string;
    status: 'pending' | 'assigned' | 'running' | 'completed' | 'failed';
    taskId?: string;
    output?: string;
}

interface TentacleResult {
    tentacleId: string;
    macroTask: string;
    totalSlots: number;
    completedSlots: number;
    failedSlots: number;
    outputs: string[];
    mergedOutput: string;
}
```

---

## 15. EXECUTION BRAIN — RGE + SRE

**File:** `src/execution-brain/index.ts` (237 lines)

The Execution Brain combines two algorithmic analysis engines. It is invoked via the `execution_brain_analyze` tool, which is available only to the kraken orchestrator.

### RGE — Runtime Grade Engine (7 Semantic Layers)

Each layer uses the TypeScript Compiler API for structural analysis (not regex):

| Layer | File | What It Analyzes | Analysis Order |
|-------|------|-----------------|----------------|
| L0 Syntactic | `rge/l0-syntactic.ts` | String patterns, code structure | Order 1 (string pattern) |
| L1 Type Contract | `rge/l1-type-contract.ts` | TypeScript TypeChecker: type assignability, interface conformance | Order 3 (type system) |
| L2 Control Flow | `rge/l2-control-flow.ts` | CFG construction, dominator trees, unreachable paths | Order 4 (control flow) |
| L3 Symbol Resolution | `rge/l3-symbol-resolution.ts` | Import resolution, symbol binding, cross-file references | Order 3 (type system) |
| L4 Side Effect | `rge/l4-side-effect.ts` | Side effect detection, purity analysis | Order 4 (control flow) |
| L5 Pattern DB | `rge/l5-pattern-db.ts` | Known anti-pattern matching against database | Order 2 (structural) |
| L6 Compliance | `rge/l6-compliance.ts` | Aggregates all layer results, computes compliance score | Order 4 (cross-layer) |

### SRE — Slop Removal Engine (P1-P11 Principle Checks)

| Principle | File | What It Checks |
|-----------|------|----------------|
| P1 Defensive Import | `sre/p1-defensive-import.ts` | Verifies every import resolves to an actual export |
| P2 Type Certainty | `sre/p2-type-certainty.ts` | Detects unchecked `as` casts without preceding runtime guard |
| P3 Error Completeness | `sre/p3-error-completeness.ts` | Ensures every catch block has meaningful error handling (not empty/console.log only) |

### Analysis Flow

```typescript
async analyze(projectRoot: string): Promise<ExecutionBrainOutput> {
    // 1. Collect all .ts/.tsx files (excluding node_modules, dist, .git)
    const sourceFiles = await collectSourceFiles(projectRoot);

    // 2. Run RGE (7 layers via TypeScript Compiler API)
    const rgeResult = await this.rge.analyze({ sourceFiles, projectRoot });

    // 3. Run SRE (P1-P11 checks)
    const sreResult = await this.sre.analyze({ sourceFiles, projectRoot });

    // 4. Combine blocking violations (CRITICAL + HIGH only)
    const blocking = [
        ...(rgeResult?.layers?.flatMap(l => l.violations
            .filter(v => v.severity === 'CRITICAL' || v.severity === 'HIGH')) ?? []),
        ...(sreResult?.principles?.flatMap(p => p.violations
            .filter(v => v.severity === 'CRITICAL' || v.severity === 'HIGH')) ?? []),
    ];

    // 5. Overall pass = RGE passed AND SRE passed AND no blocking violations
    return { passed: rgeResult.passed && sreResult.passed && blocking.length === 0,
             rgeReport, sreReport, blockingViolations: blocking };
}
```

---

## 16. CONTEXT MANAGEMENT — 9-CANON DOCS

**File:** `src/shared/context-manager.ts` (188 lines)

### The 9 Docs

| Doc | File | Update Trigger | Content |
|-----|------|----------------|---------|
| BUILD_STATE | `BUILD_STATE.md` | report_to_kraken, complete_todo | Task-level build metrics |
| TASK_QUEUE | `TASK_QUEUE.md` | deploy_tentacle, report_to_kraken, complete_todo | Backlog with [x]/[ ] markers |
| CHANGELOG | `CHANGELOG.md` | report_to_kraken(complete), complete_todo | Structured build log with issue/file/change table |
| DECISION_CHAIN | `DECISION_CHAIN.md` | deploy_tentacle, complete_todo | Numbered decisions with rationale |
| DEBUG_LOG | `DEBUG_LOG.md` | report_to_kraken(failed) | Failure root cause with category/description/fix |
| COMPACTION_SURVIVAL | `COMPACTION_SURVIVAL.md` | EVERY trigger | Current phase, active/completed tasks, next milestone |
| EVIDENCE_STATE | `EVIDENCE_STATE.md` | analysis, aggregation, todo | Evidence file inventory |
| POST-COMPACTION_PROMPT | `POST-COMPACTION_PROMPT.md` | EVERY trigger | Recovery snapshot: last task, current gate, task counts |
| SoC_PRESERVATION | `SoC_PRESERVATION.md` | EVERY trigger | Patterns discovered, context, source |

### Update Pattern (P11 — Error Isolation)

Every update is wrapped in its own try/catch so one failure cannot kill all:

```typescript
// In complete_todo tool handler:
try { updateBuildStateOnTaskComplete(taskId, 'complete', desc); }
    catch (e) { logger?.error?.(...) }

try { updateTaskQueue(taskId, desc, 'COMPLETE'); }
    catch (e) { logger?.error?.(...) }

try { updateChangelog(...); }
    catch (e) { logger?.error?.(...) }

// ... etc. for all 9 docs
```

### Directory Management

Docs are stored at `KRAKEN_CONTEXT_DIR` (default: `/workspace/kraken/CONTEXT_MANAGEMENT`). The directory is auto-created on first write. Each doc is overwritten atomically with `writeFileSync`.

---

## 17. COMPACTION SURVIVAL PROTOCOL

When the runtime triggers compaction (context window management):

```
experimental.session.compacting fires
    │
    ▼
1. adaptCompactingContext(input, output) → HookContext
    │
    ▼
2. WarheadEngine.runHooks('compacting', context)
    ├── TriplePathInjectionWarhead.INJECT_P3: compactCount++
    └── CompactionSurvivalWarhead.COMPACTION: compactCount++, save state
    │
    ▼
3. Evidence persist → evidence.persist(state.currentGate)
    │
    ▼
4. invalidateT2Cache()
    ├── t2Cache = null
    ├── t1Cache = null
    └── Next synthesizeT1Injectables() call re-loads from disk
    │
    ▼
5. Inject recovery context:
    ctxArr.push(`[KRAKEN COMPACTION SURVIVAL v1.4]
    Last Gate: ${state.currentGate}
    Active Tasks: ${state.activeTasks}
    Completed: ${state.completedTasks}
    Failed: ${state.failedTasks}
    T1 Context: Re-synthesized from fresh T2 after cache invalidation

    Post-compaction recovery:
    1. system.transform will re-inject KRAKEN IDENTITY BINDING + T1 injectables
    2. T1/T2 caches invalidated and re-synthesized from fresh T2
    3. ClusterEngine tentacles preserved in memory
    4. Read COMPACTION_SURVIVAL.md for full instructions
    5. Read TASK_QUEUE.md for remaining backlog`)
    │
    ▼
6. Re-synthesize T1 (identity + mechanical):
    ├── synthesizeT1Injectables() → fresh identityT1 from re-loaded T2
    ├── WarheadEngine.synthesizeAll(state) → fresh mechanicalT1
    └── combinedT1 = identityT1 + '\n' + mechanicalT1 → ctxArr.push(combinedT1)
    │
    ▼
7. updateSoCPreservation([
    { pattern: 'Compaction survived — T2 caches invalidated, T1 re-synthesized',
      context: 'Gate: ${state.currentGate}, Tasks: ${state.activeTasks} active',
      source: 'compacting hook' }
    ])
```

### Key Design Decision: Invalidate + Re-Synthesize (Not "Survive")

Originally, the compacting handler had:
```
// NOTE: NO invalidateT2Cache() — caches survive compaction.
// NO T1 re-synthesis — T1 is already hot in memory.
```

This was WRONG. If T2 files are updated between compaction cycles, stale T1 content persists forever. The fix (applied in this session) forces cache invalidation on EVERY compaction, ensuring fresh T1 from current T2.

---

## 18. callAgentMap SIDE CHANNEL

### The Problem

The SDK's `tool.execute.after` hook provides `(input, output)` where:

```typescript
// SDK tool.execute.after signature:
input: { tool: string, sessionID: string, callID: string, args: any }
output: { title: string, output: string, metadata: any }
```

There is NO `agent` field in the input. Without knowing which agent made the call, tool.after hooks cannot track per-agent state.

### The Solution: Side Channel via callAgentMap

```typescript
// Global Map (index.ts:337)
const callAgentMap = new Map<string, string>();
```

**Populated in tool.execute.before:**
```typescript
// After extracting agentName (index.ts:1170-1173):
if (typeof input.callID === 'string' && input.callID) {
    callAgentMap.set(input.callID, agentName);
}
```

**Consumed in tool.execute.after:**
```typescript
// Extract agentName from side channel (index.ts:1219-1222):
const callID = typeof input.callID === 'string' ? input.callID : '';
const agentName = callID ? (callAgentMap.get(callID) || '') : '';
if (callID) callAgentMap.delete(callID);  // One-shot cleanup
```

### Cleanup Guarantee

Every `set()` is paired with a `delete()` in the after hook. If `tool.execute.after` never fires (e.g., runtime crash between before and after), the entry leaks until... well, it leaks. But the map is bounded by concurrent tool calls, not session-duration. A leak of a few entries per crash is acceptable — the map is in-memory and destroyed when the plugin process exits.

---

## 19. KNOWLEDGE BASE ARCHITECTURE

**File:** `src/knowledge/knowledge-base.ts` (171 lines)

### The 4 Libraries

| Library | Directory Subpath | Files | Used By |
|---------|------------------|-------|---------|
| AGENT_IDENTITY | `Agent_Identity_Architecture/` | Identity architecture bible, shark warhead system | W1 Phalanx, W2 Identity, W3 RuntimeGradeOrch |
| ALGORITHMIC_SYSTEMS | `Algorithmic Systems/` | State machines, concurrency, firewall, philosophy | W1 Phalanx, W5 TentacleManager, W8 MultiBrain, W9 LayerEngine, W3 RuntimeGradeOrch |
| RUNTIME_GRADE | `Runtime_Grade_Standards/` | Operational identity bible, runtime grade standards | W3 RuntimeGradeOrch |
| TYPESCRIPT_DEEP | `Typescript Deep Knowledge/` | Adversarial resilience, type-level enforcement | W3 RuntimeGradeOrch, W9 LayerEngine |

### Loading Logic

```typescript
const KNOWLEDGE_BASE: string = process.env.KNOWLEDGE_LIBRARY_BASE || '';
const KNOWLEDGE_ROOTS: Readonly<Record<string, string>> = {
    'AGENT_IDENTITY': 'Agent_Identity_Architecture',
    'ALGORITHMIC_SYSTEMS': 'Algorithmic Systems',
    'RUNTIME_GRADE': 'Runtime_Grade_Standards',
    'TYPESCRIPT_DEEP': 'Typescript Deep Knowledge',
};
```

Each library directory is scanned for `.md` and `.txt` files. Each file is parsed into sections by heading (`#`, `##`, `###`). Warheads call `extractRules(file, sections)` to get non-heading, non-empty lines from matching sections.

### Parsed Section Structure

```typescript
class KnowledgeLibrary {
    files: Map<string, string>;           // filename → raw content
    parsedSections: Map<string, string[]>; // section heading → lines
}

class KnowledgeBase {
    libraries: Map<string, KnowledgeLibrary>; // library name → loaded library
    loadLibrary(name, rootPath?): void;        // Load once (subsequent calls no-op)
    getLibrary(name): KnowledgeLibrary;         // Get loaded library (throws if not loaded)
    extractRules(library, file, sections): string[]; // Convenience wrapper
}
```

### WARHEAD CONSUMPTION PATTERN

Each warhead declares its knowledge dependencies and loads them in `loadKnowledge()`:

```typescript
// Example: PhalanxWarhead
readonly knowledgeDependencies: KnowledgePath[] = [
    { library: 'ALGORITHMIC_SYSTEMS', files: ['02_STATE_MACHINES_AND_GATES.md'],
      rules: ['1. XState FSMs', '5. Guard Functions'] },
    { library: 'AGENT_IDENTITY', files: ['AGENT_IDENTITY_ARCHITECTURE_BIBLE.md'],
      rules: ['PART 1: Session Lifecycle', 'PART 2: Identity Scoping'] },
];

loadKnowledge(base: KnowledgeBase): void {
    this.stateMachineRules = base.getLibrary('ALGORITHMIC_SYSTEMS').extractRules(
        '02_STATE_MACHINES_AND_GATES.md',
        ['Guard Functions', 'State Transition Validation'],
    );
    this.identityScopingRules = base.getLibrary('AGENT_IDENTITY').extractRules(
        'AGENT_IDENTITY_ARCHITECTURE_BIBLE.md',
        ['PART 2: Identity Scoping'],
    );
}
```

### FRAGILITY NOTE

`KNOWLEDGE_BASE` defaults to `''` if `KNOWLEDGE_LIBRARY_BASE` env var is not set. All 4 libraries will load with 0 files. Warheads fall back to hardcoded defaults, but `knowledgeLoaded` in `diagnose()` will report `false`. Set this env var to the KNOWLEDGE_LIBRARY root path.

---

## 20. STRUCTUREDBLOCKERROR — BLOCK MECHANISM

**File:** `src/firewall/structured-block-error.ts` (40 lines)

When a warhead blocks a tool call, it returns `{ verdict: 'BLOCK', reason: '...', correction: '...' }`. The `WarheadEngine.enforce()` catches this and:

1. Calls `warhead.recordBlock()` on the blocking warhead
2. Constructs a `StructuredBlockError` with structured metadata
3. Throws it

```typescript
export class StructuredBlockError extends Error {
    readonly layer: string;      // e.g., 'PHALANX_DEPTH', 'F1', 'ALLOWLIST'
    readonly reason: string;     // e.g., '[PHALANX_BLOCKED] agent at max depth'
    readonly correction: string; // e.g., 'Cannot spawn from this depth.'
    readonly toolName: string;   // e.g., 'task'
    readonly timestamp: string;  // ISO timestamp of block event

    constructor(layer: string, reason: string, correction: string, toolName: string) {
        super('[' + layer + '] ' + reason);
        this.name = 'StructuredBlockError';
        this.layer = layer;
        this.reason = reason;
        this.correction = correction;
        this.toolName = toolName;
        this.timestamp = new Date().toISOString();
    }

    toJSON(): Record<string, string> {
        return {
            errorType: 'StructuredBlockError',
            layer: this.layer,
            reason: this.reason,
            correction: this.correction,
            toolName: this.toolName,
            timestamp: this.timestamp,
        };
    }
}
```

### How the Runtime Handles It

In `index.ts:1145-1152`, the `tool.execute.before` hook catches the thrown error:

```typescript
try {
    const context = adaptToolBeforeContext(input, output);
    getWarheadEngine().enforce(context);
} catch (err) {
    // StructuredBlockError is the expected block path — re-throw so runtime blocks the call
    if (err instanceof StructuredBlockError) {
        throw err;
    }
    // Unknown error — log and block-safe (fail closed)
    logger.error('Unexpected error in warhead enforcement: ' + ...);
    throw new Error('[WARHEAD_ENGINE_ERROR] Internal enforcement error — call blocked for safety.');
}
```

The SDK catches the thrown error and rejects the tool call. The model receives the error message as the tool response, which includes the reason and correction.

---

## 21. CROSS-PLUGIN ISOLATION

### The Problem

Kraken shares the opencode runtime with other plugins (Shark, Trident, Spider, etc.). Without isolation:
1. Kraken's warhead hooks could fire for other plugins' agents
2. Kraken's identity could inject into other plugins' sessions
3. Other plugins' agents could call Kraken tools

### The Isolation Strategy

Kraken uses a **3-layer isolation** approach:

#### Layer 1: Agent Filter in Hook Registration

The `system.transform` hook uses `agentFilter: null` (line 1147), meaning it fires for ALL agents. Identity isolation is done INSIDE the hook body:

```typescript
// system.transform handler:
const agent = extractNestedString(input, 'agent') || '';
if (agent && !isKrakenAgent(agent)) return;  // Skip non-Kraken agents
```

**CRITICAL BUG:** The SDK's `system.transform` input does NOT have an `agent` field. So `agent` is always `''`, and `!agent` is always true. The check never skips. **Identity bleeds to every session.** This is a known unresolved issue.

#### Layer 2: Agent Check in tool.execute.before

The `tool.execute.before` filter (index.ts:1160-1168):

```typescript
if (!agentName || !isKrakenAgent(agentName)) {
    if (isOtherPluginAgent(agentName)) {
        logger.warn(`[CrossPlugin] Agent '${agentName}' attempted tool '${toolName}' — not a Kraken agent`);
    }
    return;  // Early exit — skip all warheads
}
```

This means:
- `kraken` → runs warheads (full enforcement)
- `shark-alpha-1` → runs warheads (Kraken-managed cluster agent)
- `explore` → runs warheads (Kraken-managed vanilla agent)
- `shark` → skips warheads + logs cross-plugin warning
- `trident` → skips warheads + logs cross-plugin warning
- `spider` → skips warheads + logs cross-plugin warning

#### Layer 3: F1IsolationWarhead (p0)

Even if a non-Kraken agent slips through the filter (shouldn't happen), `F1IsolationWarhead` runs at priority p0 (FIRST) and checks:

```typescript
if (ctx.toolName in KRAKEN_ONLY_TOOLS && ctx.agentName !== 'kraken') {
    return BLOCK;
}
```

This is a safety net. Kraken-only tools (`deploy_tentacle`, `aggregate_results`, `execution_brain_analyze`, `complete_todo`) are mechanically blocked from any non-kraken agent.

---

## 22. ERROR HANDLING & P1-P11 COMPLIANCE

### P1 — No Dead Code

- All imports in `index.ts` are used (synthesizeT1Injectables, invalidateT2Cache, isOtherPluginAgent, updateDebugLog all wired this session)
- **Remaining violations:** 10 dead type exports in `src/types.ts` (see Section 24)

### P2 — Runtime Guards on Every Cast

Every `as` cast is preceded by a runtime guard:

```typescript
// GOOD (P2 compliant):
const sessionObj = isObject(input.session) ? input.session : {};
const sessionAgent = extractString(sessionObj, 'agentName', '');

// NEVER:
const sessionAgent = (input.session as any).agentName;
```

All guard functions are defined at the top of `index.ts`:
- `isString(value)` — typeof === 'string'
- `isStringArray(value)` — Array.isArray + every isString
- `isObject(value)` — typeof === 'object' && !== null && !Array.isArray
- `hasStringProperty(obj, key)` — isObject + key in obj + typeof string
- `isErrnoException(err)` — err instanceof Error && 'code' in err

### P3 — Error Path Completeness

Every `catch` block contains at least one of:
- Re-throwing (StructuredBlockError in enforce)
- Wrapping + throwing (catch → new Error in tool.before)
- Logging + defined recovery action (logger.error + continue)

**Never:** empty `catch {}` or `catch(e) { console.log(e) }`

### P6 — Dependency Verification

All imports are statically resolved. The `bun build` produces 56 modules with 0 errors. The `tsc --noEmit` produces 0 type errors.

### P9 — Async Discipline

Every promise is either awaited or has `.catch()`:

```typescript
// AWAITED:
await evidence.persist(state.currentGate);
await getClusterManager().tightenTentacle(...);

// .catch()'d:
// (none needed — all promises are awaited in async functions)
```

### P11 — No Theatrical Returns

Every function returns real data from real computation:
- `getState()` queries warheads for real tentacle/agent counts
- `synthesizeAll()` iterates all 23 warheads and concatenates their real T1
- `diagnoseAll()` calls diagnose() on every warhead (wrapped in try/catch)
- Tool handlers return real execution results, not placeholder success messages

---

## 23. v1.3 → v1.4 MIGRATION INVENTORY

### What Was Deleted (15 files, ~350K lines removed)

| Path | Files | Reason |
|------|-------|--------|
| `src/system-brain/firewall/` | 14 files | Replaced by 23 warheads with priority-ordered enforcement |
| `src/system-brain/firewall/types.ts` | Types (FirewallContext, etc.) | Dumped to src/types.ts but NEVER cleaned — 10 dead exports |
| Inline allowlist Sets in index.ts | — | Replaced by single-source tool-allowlist.ts |
| Inline validatePhalanxSpawn() in index.ts | — | Replaced by PhalanxWarhead |
| Hardcoded cluster configs | — | Replaced by dynamic ClusterEngine |
| Old faked runAfterHooks in tool.before | — | Replaced by real tool.execute.after hook |
| Old T1 synthesis (mechanical-only) | — | Now merged identityT1 + mechanicalT1 |
| `ship-package-v1.3/` | 50+ files | v1.3 delivery artifacts — replaced by v1.4 source |
| `context-management/` (old v1.3 docs) | 7 files | Replaced by 9-canon system |
| `dist/index.js` | 1 file | Old build output |

### What Was Added (55+ files, ~9K lines added)

| Component | Files | Lines |
|-----------|-------|-------|
| `src/engine/` — WarheadEngine, Registry, HookAdapter, Types | 4 | 678 |
| `src/warheads/` — 23 warhead implementations | 23 | ~1,800 |
| `src/security/tool-allowlist.ts` | 1 | 75 |
| `src/knowledge/knowledge-base.ts` | 1 | 171 |
| `src/shared/agent-identity.ts` | 1 | 90 |
| `src/shared/t2-loader.ts` | 1 | 477 |
| `src/shared/context-manager.ts` | 1 | 188 |
| `src/shared/logger.ts`, `state-store.ts`, `evidence-collector.ts`, `brain-messenger.ts` | 4 | ~130 |
| `src/firewall/structured-block-error.ts`, `firewall-audit.ts` | 2 | 95 |
| `src/clusters/` — ClusterEngine, ACP, Sandbox, Types | 5 | ~250 |
| `src/execution-brain/` — RGE (7 layers) + SRE (3 checks) | 13 | ~800 |
| `src/planning-brain/index.ts` | 1 | ~150 |
| `context/t2/` — 10 T2 cold storage files | 10 | ~10K |
| Updated `src/index.ts`, `src/types.ts` | 2 | 1,839 |

### What Changed (Architecture Transformations)

| System | v1.3 | v1.4 | Why |
|--------|------|------|-----|
| Enforcement | Monolithic KrakenFirewall (10 layers) | 23 independent warheads (priority-ordered) | Testability, error isolation, per-warhead T1 synthesis |
| Allowlist | Inline Sets in index.ts | tool-allowlist.ts single source | Single point of change, O(1) lookup, consumed by 3 warheads |
| Cluster config | Hardcoded agent maps | Dynamic ClusterEngine.anchorTentacle() | No config changes needed for different workloads |
| Identity | output.system.unshift() (broken) | SCAN+REPLACE in-place | Runtime default wins with unshift; REPLACE ensures identity wins |
| Context docs | 5-7 inconsistently managed | 9 mechanically updated | Complete traceability, error isolation per doc |
| T1 context | None | T2→T1→T0 pyramid | Behavioral guidance + enforcement state on every message |
| Audit | Central FirewallAudit class | Per-warhead recordBlock() | Distributed counters, but central audit file is structurally dead |
| tool.after | Faked inside tool.before | Real tool.execute.after hook | Real output.metadata for accurate state tracking |
| Agent identity | Inline === checks | Externalized in agent-identity.ts | Shared between index.ts hooks and warheads |
| Cross-plugin | None | isOtherPluginAgent + audit log | Visibility into foreign agent tool access |

---

## 24. REMAINING ARCHITECTURAL FAILURES

### CRITICAL (Will cause runtime bugs in production)

| # | Failure | File | Root Cause | Impact |
|---|---------|------|-----------|--------|
| 1 | **system.transform identity bleed** | `index.ts:892` | SDK system.transform input has NO `agent` field. `extractNestedString(input, 'agent')` always returns `''`. The `if (!effectiveAgent \|\| isKrakenOrchestrator(effectiveAgent))` check at line 902 always passes. | Kraken identity header + T1 context injected into EVERY session, including non-Kraken plugins |
| 2 | **FirewallAuditWarhead is structurally dead** | `firewall-audit-warhead.ts` | `recordBlock()` only fires on the warhead whose hook returned BLOCK (warhead-engine.ts:145). W11 has zero hooks (getHooks() returns []), so it can never be the blocking warhead. | Block events are NEVER written to `.kraken/firewall-audit.jsonl`. Audit trail is always empty. |
| 3 | **FirewallAudit class is dead code** | `firewall/firewall-audit.ts` | 55-line class, never imported or instantiated. Comment "Used by W11 FirewallAuditWarhead" is false — W11 does audit logging inline. | Dead file consuming maintenance attention |

### HIGH (Will cause silent functional gaps)

| # | Failure | File | Root Cause | Impact |
|---|---------|------|-----------|--------|
| 4 | **10 dead type exports in types.ts** | `types.ts:266-442` | FirewallContext, FirewallSessionState, BlockResult, AllowResult, FirewallResult, AuditEntry, TaskStatus, TaskDefinition, SessionStateData, PluginOutput, HookContext — all moved from deleted system-brain/firewall/ but never cleaned | Code clutter, P1 violation |
| 5 | **W17 T2T1PyramidWarhead has zero hooks** | `t2t1-pyramid-warhead.ts:64` | CRITICAL priority warhead named "T2→T1 Context Pyramid" but only checks file existence in synthesize()/diagnose(). Should register compacting hook calling invalidateT2Cache(). | Cache invalidation is inlined in index.ts instead of owned by the warhead. W17 is a slot-filler, not an active component. |
| 6 | **KnowledgeBase loads empty without env var** | `knowledge-base.ts:21` | `process.env.KNOWLEDGE_LIBRARY_BASE \|\| ''` defaults to empty. All 4 knowledge libraries load with 0 files. Warheads get empty rule arrays. | Warheads function by hardcoded defaults, but `knowledgeLoaded` reports false. Knowledge-backed enforcement is disabled. |
| 7 | **isT1Ready() returns 'ready' even when empty** | `t2-loader.ts:436` | `t1Cache` is set regardless of content quality. Even when all 10 T2 files return "CONTENT UNAVAILABLE", `isT1Ready()` returns true. | SoC log reports "ready" but model receives empty behavioral guidance. |

### MEDIUM

| # | Failure | File | Root Cause |
|---|---------|------|-----------|
| 8 | **Architecture doc stale** | `KRAKEN_V1.4_PHALANX_MECHANICAL_ARCHITECTURE.md:86,91,97` | References FirewallAudit import, private field, and constructor call that no longer exist in actual warhead-engine.ts |
| 9 | **6 warheads not fully audited** | W4, W16, W20, W21, W23 + RGE/SRE internals | Cannot verify hook registration, state tracking, or enforcement behavior without container runtime |

---

## 25. PROJECT STRUCTURE

```
kraken-agent/
├── src/
│   ├── index.ts                          — Plugin entry, 5 hook registrations, 7 tools, ~1371 lines
│   ├── types.ts                          — Core type definitions (PluginIdentity, AgentDefinition, etc.)
│   │
│   ├── engine/                           — Warhead enforcement engine
│   │   ├── warhead-engine.ts             — Orchestrator: enforce, runAfterHooks, runHooks, synthesizeAll
│   │   ├── warhead-registry.ts           — Priority-sorted Map with getByPriority/getAll
│   │   ├── hook-adapter.ts               — 5 adapters: ToolBefore, ToolAfter, Transform, Compacting, ChatMessage
│   │   └── types.ts                      — Canonical types: HookContext, HookResult, EnforcementHook, Warhead
│   │
│   ├── warheads/                         — 23 independent enforcement classes
│   │   ├── phalanx-warhead.ts            — W1: Spawn hierarchy enforcement (p1)
│   │   ├── identity-warhead.ts           — W2: Identity drift detection (p20)
│   │   ├── runtime-grade-orchestrator-warhead.ts  — W3: P1-P12 principles (p5)
│   │   ├── runtime-grade-tentacle-warhead.ts      — W4: Tentacle-level enforcement
│   │   ├── tentacle-manager-warhead.ts   — W5: Circuit breaker, backpressure (p3)
│   │   ├── allowlist-warhead.ts          — W6: Tool allowlist enforcement (p4)
│   │   ├── context-warhead.ts            — W7: Context doc tracking (p30)
│   │   ├── multi-brain-warhead.ts        — W8: Tool-to-brain routing (p25)
│   │   ├── layer-engine-warhead.ts       — W9: 6-layer firewall engine (p0)
│   │   ├── structured-block-error-warhead.ts  — W10: Passive block counter
│   │   ├── firewall-audit-warhead.ts     — W11: JSONL audit trail (structurally dead)
│   │   ├── l5-antiderailment-warhead.ts  — W12: 9-class derailment detection (p15)
│   │   ├── f1-isolation-warhead.ts       — W13: Cross-agent isolation (p0)
│   │   ├── evidence-gate-warhead.ts      — W14: Pass rate validation
│   │   ├── compaction-survival-warhead.ts — W15: Compaction event tracking (p10)
│   │   ├── recovery-checkpoint-warhead.ts — W16: Recovery state persistence
│   │   ├── t2t1-pyramid-warhead.ts       — W17: T2→T1 file verification (0 hooks)
│   │   ├── triple-path-injection-warhead.ts — W18: 3-path injection tracking (p0)
│   │   ├── phalanx-identity-files-warhead.ts — W19: Identity file verification
│   │   ├── warhead-synthesizer-warhead.ts — W20: T1 aggregation metadata
│   │   ├── per-agent-allowlist-warhead.ts — W21: Per-agent tool permissions
│   │   ├── parallel-deployment-warhead.ts — W22: Concurrent deploy limits (p2)
│   │   └── rate-limit-warhead.ts         — W23: Tool call frequency limiting
│   │
│   ├── clusters/                         — Dynamic tentacle execution
│   │   ├── index.ts                      — ClusterManager wrapper (183 lines)
│   │   ├── cluster-engine.ts             — Tentacle lifecycle engine
│   │   ├── cluster-types.ts              — ClusterTentacle, AgentSlot, TentacleResult types
│   │   ├── acp.ts                        — Agent creation protocol
│   │   └── sandbox.ts                    — Isolated execution environment
│   │
│   ├── execution-brain/                  — Algorithmic code analysis
│   │   ├── index.ts                      — RGE + SRE orchestrator (237 lines)
│   │   ├── rge/                          — Runtime Grade Engine (7 layers)
│   │   │   ├── index.ts                  — RuntimeGradeEngine
│   │   │   ├── types.ts                  — RGE type definitions
│   │   │   ├── l0-syntactic.ts           — String pattern analysis
│   │   │   ├── l1-type-contract.ts       — TypeChecker contract verification
│   │   │   ├── l2-control-flow.ts        — CFG construction and analysis
│   │   │   ├── l3-symbol-resolution.ts   — Cross-file symbol resolution
│   │   │   ├── l4-side-effect.ts         — Side effect detection
│   │   │   ├── l5-pattern-db.ts          — Anti-pattern matching
│   │   │   └── l6-compliance.ts          — Compliance scoring
│   │   └── sre/                          — Slop Removal Engine (P1-P11)
│   │       ├── index.ts                  — SlopRemovalEngine
│   │       ├── types.ts                  — SRE type definitions
│   │       ├── checks.ts                 — Check utilities
│   │       ├── p1-defensive-import.ts    — Import verification
│   │       ├── p2-type-certainty.ts      — Type cast guard analysis
│   │       └── p3-error-completeness.ts  — Error path analysis
│   │
│   ├── firewall/                         — Block mechanism + audit (legacy)
│   │   ├── structured-block-error.ts     — Block error class (40 lines)
│   │   └── firewall-audit.ts            — JSONL audit writer (55 lines, DEAD)
│   │
│   ├── knowledge/                        — Knowledge base
│   │   └── knowledge-base.ts            — 4-library knowledge engine (171 lines)
│   │
│   ├── planning-brain/                   — Task decomposition
│   │   └── index.ts                     — Request analysis and deployment planning
│   │
│   ├── security/                         — Tool permissions
│   │   └── tool-allowlist.ts            — Single source allowlist (75 lines)
│   │
│   └── shared/                           — Shared infrastructure
│       ├── agent-identity.ts            — Identity check functions (90 lines)
│       ├── t2-loader.ts                 — T2→T1 context pyramid (477 lines)
│       ├── context-manager.ts           — 9-canon doc updates (188 lines)
│       ├── logger.ts                    — Component-scoped logging
│       ├── state-store.ts               — Session state management
│       ├── evidence-collector.ts        — Gate evidence collection
│       └── brain-messenger.ts           — Inter-brain messaging
│
├── context/
│   └── t2/                              — 10 T2 cold storage identity files
│       ├── T2_ALIGNMENT_BIBLE.md
│       ├── T2_ARCHITECTURE.md
│       ├── T2_BUILD_CHAIN.md
│       ├── T2_COMPACTION_SURVIVAL.md
│       ├── T2_CRASH_RECOVERY.md
│       ├── T2_FAILURE_MODES.md
│       ├── T2_KRAKEN_LIGHTNING_MODE.md
│       ├── T2_KRAKEN_RULES.md
│       ├── T2_PATTERNS.md
│       └── T2_PLUGIN_ENGINEERING.md
│
├── KRAKEN_V1.3_TO_V1.4_ARCHITECTURE_TRANSFORMATION.md  — Full migration report
├── KRAKEN_V1.4_PHALANX_MECHANICAL_ARCHITECTURE.md       — Original 1334-line spec
├── package.json
├── tsconfig.json
├── bun.lock
└── README.md (this file)
```

---

## 26. BUILD, DEPLOY & ENVIRONMENT

### Prerequisites

- [bun](https://bun.sh) (v1.x)
- opencode runtime (v1.14.43+)
- Docker (for container testing)

### Build

```bash
# Install dependencies
bun install

# Production build
bun build src/index.ts \
    --outdir dist \
    --target bun \
    --format esm \
    --bundle \
    --external @opencode-ai/plugin

# TypeScript verification
bun tsc --noEmit
```

Expected output: `56 modules bundled`, `dist/index.js` ~9.0 MB.

### Deploy to Container

```bash
# Copy plugin bundle into running container
docker cp dist/index.js <container>:/root/.config/opencode/plugins/kraken-agent/dist/index.js

# Restart the container or reload plugins
docker exec <container> <reload-command>
```

### Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `KNOWLEDGE_LIBRARY_BASE` | **YES** | `''` | Path to KNOWLEDGE_LIBRARY root. Must point to directory containing Agent_Identity_Architecture/, Algorithmic Systems/, Runtime_Grade_Standards/, Typescript Deep Knowledge/. Without this, all 4 knowledge libraries load empty. |
| `KRAKEN_T2_DIR` | No | `/workspace/kraken/context/t2` | Path to T2 cold storage files. Falls back to CWD-relative `context/t2`, then plugin-root-relative. |
| `KRAKEN_CONTEXT_DIR` | No | `/workspace/kraken/CONTEXT_MANAGEMENT` | Path for 9-canon context management docs. Mount project directory here to persist docs across container restarts. |
| `KRAKEN_AUDIT_PATH` | No | `.kraken/firewall-audit.jsonl` | Path for JSONL audit trail (currently not written — see Section 24 failure #2). |
| `KRAKEN_EVIDENCE_DIR` | No | `.kraken/evidence` | Path for evidence files (ContainerTestResult.json, etc.). |

### Required Container Mounts

```
/workspace/kraken/ → Project root (for CONTEXT_MANAGEMENT/, context/t2/)
```

### Verification Checklist

After build and deploy:

```bash
# 1. Build succeeds
bun build src/index.ts --outdir dist --target bun --format esm --bundle --external @opencode-ai/plugin
# Expected: "Bundled 56 modules in XXXms" → "index.js 9.0 MB"

# 2. TypeScript compiles
bun tsc --noEmit
# Expected: no output (0 errors)

# 3. All 23 warheads initialize
docker exec <container> ... | grep "warheads initialized"
# Expected: "[WarheadEngine] 23 warheads initialized"

# 4. T1 synthesis loads
# Trigger system.transform → check SoC_PRESERVATION.md for T1 status
# Expected: "Identity+T1 context injected (ready)"

# 5. Tool enforcement works
# Try bash from kraken orchestrator → should be blocked
# Expected: "[RGE_BLOCKED] Kraken cannot use bash"

# 6. Cross-plugin isolation
# Tool call from non-Kraken agent → should be logged
# Expected: "[CrossPlugin] Agent 'shark' attempted tool '...'"
```
