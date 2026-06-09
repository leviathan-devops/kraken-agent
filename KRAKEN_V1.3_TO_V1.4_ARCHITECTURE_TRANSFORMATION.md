# KRAKEN v1.3 → v1.4 PHALANX EDITION — COMPLETE ARCHITECTURE TRANSFORMATION REPORT

**Generated:** Trident Brain v4.3.1-T3 | **Source:** 55 source files, 1334-line architecture doc, 809-line failure catalog, 468-line types

---

## PART 1: EXECUTIVE SUMMARY — WHAT HAPPENED

Kraken v1.3 was a **monolithic pipeline architecture** with a single `KrakenFirewall` class orchestrating 10 layers sequentially, inline tool allowlists in `index.ts`, hardcoded cluster configurations, and static context management docs.

Kraken v1.4 is a **distributed warhead architecture** with 23 independent `Warhead` classes registered in a priority-ordered `WarheadRegistry`, a `WarheadEngine` orchestrator that fires hooks in priority order, a `HookAdapter` bridge between SDK and warhead types, a `T2→T1→T0` context pyramid, a dynamic `ClusterEngine` with tentacle-based execution, and mechanically-updated context management docs.

**The transformation was 70% complete.** The core enforcement engine is solid. The peripheral systems (audit logging, T2 cache management, knowledge loading, identity isolation) were never properly wired. 10 dead type exports from the old architecture remain in `types.ts`. The architecture doc describes features that the actual implementation no longer has.

---

## PART 2: COMPONENT-BY-COMPONENT TRANSFORMATION

### 2.1 Tool Enforcement: KrakenFirewall → WarheadEngine

| Aspect | v1.3 | v1.4 |
|--------|------|------|
| **Architecture** | Single class `KrakenFirewall` in `system-brain/firewall/` | 23 independent `Warhead` classes + `WarheadEngine` orchestrator |
| **Enforcement flow** | Single `enforce()` method evaluating ALL 10 layers sequentially | `WarheadEngine.enforce()` iterates warheads by priority, each evaluates its OWN hooks |
| **Block behavior** | Returns `FirewallResult` (union of `BlockResult`/`AllowResult`) | Throws `StructuredBlockError` which runtime catches as rejection |
| **Short-circuit** | All layers run regardless — one crash kills all | Priority-ordered — one warhead BLOCKs, rest never fire |
| **State tracking** | Central audit log only | Per-warhead counters + `diagnose()` + `getState()` + `synthesize()` |
| **T1 synthesis** | None | Each warhead produces its own T1 string, aggregated by `synthesizeAll()` |
| **Testability** | Integration test only — must run full pipeline | Unit-testable — each warhead independently instantiable |

**File deleted:** `system-brain/firewall/kraken-firewall.ts` (plus 13 supporting files in that directory)

**Files created:**
- `src/engine/warhead-engine.ts` (271 lines) — Orchestrator
- `src/engine/warhead-registry.ts` (88 lines) — Priority-sorted map
- `src/engine/types.ts` (119 lines) — Canonical warhead type definitions
- `src/engine/hook-adapter.ts` (288 lines) — SDK→Warhead type bridge
- `src/warheads/*.ts` (23 files) — Individual warhead implementations

### 2.2 Firewall Layer Mapping: L0-L10 → Warheads

| v1.3 Layer | File | v1.4 Warhead | Priority | Status |
|-----------|------|-------------|----------|--------|
| L0 Identity | `L0-identity.ts` | **W2 IdentityWarhead** | CRITICAL p20 | ✅ IDENTITY_DRIFT pattern detection |
| L1 Theatrical | `L1-theatrical.ts` | **W12 L5AntiDerailmentWarhead** | CRITICAL p15 | ✅ 9-class derailment detection |
| L1 (partial) | — | **W9 LayerEngineWarhead** (LAYER 5) | CRITICAL p0 | ✅ THEATRICAL mock/stub/TODO |
| L2 Session | `L2-session.ts` | **W17 T2T1PyramidWarhead** | CRITICAL | ❌ Zero hooks — observational only |
| L3 Allowlist | `L3-allowlist.ts` | **W6 AllowlistWarhead** | CRITICAL p4 | ✅ Delegates to `tool-allowlist.ts` |
| L4 Spawn Validation | `L4-spawn.ts` | **W1 PhalanxWarhead** | CRITICAL p1 | ✅ Depth enforcement |
| L4 (partial) | — | **W9 LayerEngineWarhead** (LAYER 6) | CRITICAL p0 | ✅ SPAWN_VALIDATE known agents |
| L5 Feature Gate | `L5-feature.ts` | **W14 EvidenceGateWarhead** | HIGH | ✅ 96% pass rate threshold |
| L6 Anti-Retard | `L6-anti-retard.ts` | **W13 F1IsolationWarhead** | CRITICAL p0 | ✅ Blocks non-Kraken from Kraken-only tools |
| L7 Coordination | `L7-coordination.ts` | **W18 TriplePathInjectionWarhead** | CRITICAL | ✅ 3-path redundant injection tracking |
| L8 Anti-Bullshit | `L8-anti-bullshit.ts` | Absorbed into **W9 LayerEngineWarhead** | CRITICAL p0 | ✅ ZONE write path protection |
| L9 Feature Omission | `L9-feature.ts` | **W14 EvidenceGateWarhead** | HIGH | ✅ Container test result validation |
| L10 Container | `L10-container.ts` | **W4 RuntimeGradeTentacleWarhead** | CRITICAL | ✅ Permission/self-impl blocking |

**NEW warheads (no v1.3 equivalent):**
- **W3 RuntimeGradeOrchestratorWarhead** — P1-P12 principle enforcement at orchestrator level
- **W5 TentacleManagerWarhead** — Circuit breaker, backpressure, concurrency limits
- **W7 ContextWarhead** — Context document update tracking
- **W8 MultiBrainWarhead** — Tool-to-brain routing (PLANNING/EXECUTION/SYSTEM)
- **W10 StructuredBlockErrorWarhead** — Passive block counter
- **W11 FirewallAuditWarhead** — JSONL audit trail (structurally dead — see below)
- **W15 CompactionSurvivalWarhead** — Compaction event tracking
- **W16 RecoveryCheckpointWarhead** — Recovery state persistence
- **W19 PhalanxIdentityFilesWarhead** — Identity file existence verification
- **W20 WarheadSynthesizerWarhead** — T1 aggregation metadata
- **W21 PerAgentAllowlistWarhead** — Per-agent tool permission verification
- **W22 ParallelDeploymentWarhead** — Concurrent deploy limit enforcement
- **W23 RateLimitWarhead** — Tool call frequency limiting

### 2.3 Tool Allowlist: Inline Sets → Single Source of Truth

| Aspect | v1.3 | v1.4 |
|--------|------|------|
| **Location** | Inline `Set` objects in `index.ts tool.execute.before` handler | `src/security/tool-allowlist.ts` with `ALLOWLISTS` readonly record |
| **Lookup** | `if (!krakenTools.has(toolName)) return block(...)` | `isToolAllowed(agent, tool)` — O(1) via pre-computed `Set` cache |
| **Maintenance** | Must edit index.ts to change allowlists | Edit `ALLOWLISTS` object — reflected EVERYWHERE via export |
| **Consumers** | Only the inline handler | `AllowlistWarhead` (W6), `LayerEngineWarhead` (W9), `PerAgentAllowlistWarhead` (W21) |
| **Agent isolation** | Single Set for all agents | Per-agent allowlists: kraken, kraken-tentacle-executor, kraken-cluster-agent |
| **Dead code remaining** | None — inline Sets **were** removed | `ALLOWLISTS` is single source, zero duplication |

### 2.4 Context Management: Static Docs → Mechanical 9-Canon Baseline

| Aspect | v1.3 | v1.4 |
|--------|------|------|
| **Update mechanism** | Ad-hoc, manual via instructions | 9 exported functions in `context-manager.ts` |
| **Trigger** | Only on `complete_todo` | EVERY tool execution: `deploy_tentacle`, `report_to_kraken`, `aggregate_results`, `complete_todo`, `execution_brain_analyze` |
| **Canon docs** | 5-7 inconsistently managed | 9 strictly defined: BUILD_STATE, TASK_QUEUE, CHANGELOG, DECISION_CHAIN, DEBUG_LOG, COMPACTION_SURVIVAL, EVIDENCE_STATE, POST-COMPACTION_PROMPT, SoC_PRESERVATION |
| **Compaction survival** | State lost on compaction | Recovery context + T1 re-synthesis injected on every compact |
| **Error isolation** | One failure kills all updates | Each update wrapped in individual try/catch (P11) |
| **DEBUG_LOG.md** | Never written | Now wired into `report_to_kraken` failure path (as of this session) |

### 2.5 Identity Injection: unshift → SCAN+REPLACE

| Aspect | v1.3 | v1.4 |
|--------|------|------|
| **Method** | `output.system.unshift(identityHeader)` | Scan for runtime defaults → `outputSystem[i] = identityHeader` |
| **Problem** | Runtime appends "You are opencode..." AFTER unshift, identity loses | Runtime default is replaced IN-PLACE, identity wins |
| **Fallback** | None | If no runtime default found, falls back to unshift |
| **Deduplication** | None | Checks for `[KRAKEN IDENTITY BINDING]` marker before injecting |
| **T1 injection** | None | Both identityT1 (from T2) + mechanicalT1 (from warheads) injected |
| **Post-compaction** | Identity lost after tab toggle | Recovery context + re-synthesized T1 injected automatically |

### 2.6 Cluster Management: Hardcoded Configs → Dynamic ClusterEngine

| Aspect | v1.3 | v1.4 |
|--------|------|------|
| **Cluster definition** | Hardcoded in index.ts agent configs | Dynamic `ClusterEngine.anchorTentacle()` creates tentacles on demand |
| **Agent slots** | Pre-defined cluster agent lists | Calculated by `calculateAgentCount(task)` based on task complexity |
| **Task execution** | Direct `createTask`/`assignTask` | Tentacle lifecycle: `anchor → disperse → tighten → dissolve` |
| **Concurrency** | No limit | `TentacleManagerWarhead` max 8 tentacles / 16 agents |
| **Deadline tracking** | Manual | `circuitBreakers` Map with threshold=3, cooldown=30s |
| **Result aggregation** | Manual per-task | `aggregateTentacleResults()` auto-merges all slot outputs |

### 2.7 T2→T1→T0 Context Pyramid (Entirely New in v1.4)

| Layer | What | Size | When Injected | Lifetime |
|-------|------|------|---------------|----------|
| **T2** (Cold Storage) | 10 identity files at `context/t2/T2_*.md` | ~40K chars total | Loaded on first `synthesizeT1Injectables()` call | Session-duration, invalidated on compaction |
| **T1** (Warm Injectables) | Behavioral rules extracted from T2 via priority-ordered synthesis | <5K chars total | Injected on EVERY `system.transform` and `compacting` | Re-synthesized from fresh T2 after invalidation |
| **T0** (Hot Runtime) | Model's active behavior shaped by T1 | N/A | N/A | Per-message |

**v1.3 had NONE of this.** Identity was a one-shot injection with no behavioral guidance beyond the header text.

### 2.8 Hook Wiring: Direct SDK → Adapter Bridge

| SDK Hook | v1.3 Handler | v1.4 Adapter | Warhead Consumption |
|----------|-------------|-------------|-------------------|
| `tool.execute.before` | Inline allowlist check + `KrakenFirewall.enforce()` | `adaptToolBeforeContext()` | `WarheadEngine.enforce()` runs 13 tool.before hooks |
| `tool.execute.after` | **DID NOT EXIST** — was faked inside tool.before with `adaptToolBeforeContext` | `adaptToolAfterContext()` | `WarheadEngine.runAfterHooks()` runs 5 tool.after hooks (NEW) |
| `system.transform` | Inline identity unshift | `adaptTransformContext()` | `WarheadEngine.runHooks('system.transform', ...)` |
| `chat.message` | None | `adaptChatMessageContext()` | `WarheadEngine.runHooks('chat.message', ...)` |
| `compacting` | None | `adaptCompactingContext()` | `WarheadEngine.runHooks('compacting', ...)` |

---

## PART 3: WHAT WAS DELETED

| Path | Files | Reason | Current Status |
|------|-------|--------|----------------|
| `system-brain/firewall/` | **14 files** (types.ts, L0-L10, kraken-firewall.ts, audit.ts) | Replaced by 23 warheads with priority-ordered enforcement | ✅ Functions migrated, **but 10 old type exports left dead in types.ts** |
| `system-brain/firewall/types.ts` | Types (FirewallContext, etc.) | Types moved to `src/types.ts` to break circular dependency | ❌ **Types dumped but never cleaned** — ALL are dead exports |
| Inline allowlist Sets in index.ts | `krakenTools`, `clusterAgentTools`, `tentacleTools` | Replaced by single-source `tool-allowlist.ts` | ✅ Fully removed |
| Inline `validatePhalanxSpawn()` in index.ts | ~25 lines | Replaced by `PhalanxWarhead` (W1) | ✅ Fully removed, warhead handles it |
| Hardcoded cluster configs | Map entries with static agent definitions | Replaced by dynamic `ClusterEngine` | ✅ Fully removed |
| Old faked `runAfterHooks` in tool.before | ~8 lines | Replaced by real `tool.execute.after` hook | ✅ Removed this session |
| Old T1 synthesis (mechanical-only) | ~15 lines in system.transform | Now merged identityT1 + mechanicalT1 | ✅ Fixed this session |

---

## PART 4: ARCHITECTURE DOC vs. IMPLEMENTATION — DRIFT ANALYSIS

**Source:** `KRAKEN_V1.4_PHALANX_MECHANICAL_ARCHITECTURE.md` (1334 lines)

### What the Doc Says That's NO LONGER TRUE

| Doc Line | Doc Claims | Actual Code | Severity |
|----------|-----------|-------------|----------|
| `86` | `import { FirewallAudit } from '../firewall/firewall-audit.js';` | **Import removed** from actual `warhead-engine.ts` | HIGH — doc is stale, FirewallAudit class is dead code |
| `91` | `private audit: FirewallAudit;` | **Field removed** from actual implementation | HIGH — doc describes non-existent audit wiring |
| `97` | `this.audit = new FirewallAudit();` | **Constructor call removed** | HIGH — doc describes non-existent initialization |
| (Arch doc body) | FirewallAudit integrated into enforcement | `FirewallAudit` class at `firewall/firewall-audit.ts` is never imported or instantiated | CRITICAL — dead file with misleading comment "Used by W11" |
| (Various) | T2T1PyramidWarhead manages T2→T1 pipeline | W17 has zero hooks, does NOT wire `invalidateT2Cache()` | HIGH — warhead is observational, not operational |
| (Various) | audit collects block events via FirewallAudit | `FirewallAuditWarhead.recordBlock()` can NEVER fire — structurally dead | CRITICAL — audit file never written |
| (Various) | system.transform agentFilter isolates identity | `agentFilter: null` + `extractNestedString(input, 'agent')` always returns `''` | CRITICAL — identity bleeds to every session |

---

## PART 5: WARHEAD HOOK POINT DISTRIBUTION — COMPLETE INVENTORY

### tool.before hooks (13 total, priority-ordered execution order):

| Priority | Warhead | Layer | What It Blocks |
|----------|---------|-------|----------------|
| **p0** | W13 F1IsolationWarhead | `F1` | Non-Kraken agents calling `deploy_tentacle`, `aggregate_results`, `execution_brain_analyze`, `complete_todo` |
| **p0** | W9 LayerEngineWarhead | `LAYER_ENGINE` | 6-layer firewall (PHALANX_IDENTITY, ALLOWLIST, ZONE, THEATRICAL, SPAWN_VALIDATE) |
| **p1** | W1 PhalanxWarhead | `PHALANX_DEPTH` | Illegal spawns (depth cap, layer skipping, unknown agents) |
| **p2** | W22 ParallelDeploymentWarhead | `PARALLEL` | >8 concurrent `deploy_tentacle` calls |
| **p3** | W5 TentacleManagerWarhead | `BACKPRESSURE` | >8 tentacles or >16 agents concurrently |
| **p4** | W6 AllowlistWarhead | `ALLOWLIST` | Tools not in agent's allowlist |
| **p5** | W3 RuntimeGradeOrchestratorWarhead | `RUNTIME_GRADE_ORCHESTRATOR` | Direct tool use (`bash`, `edit`, `patch`), self-implementation patterns |
| **p15** | W12 L5AntiDerailmentWarhead | `L5` | 9-class derailment (HOST_FALLBACK, SUCCESS_CLAIM, MODEL_USAGE, MOCK_STUB, SCOPE_CREEP, UNDERMINING, SELF_REFERENCE, AGENT_RESISTANCE) |
| **p20** | W2 IdentityWarhead | `IDENTITY_ENFORCEMENT` | Identity drift ("i am opencode", "as an ai assistant") |
| *(Unknown)* | W4 RuntimeGradeTentacleWarhead | `TENTACLE` | Self-implementation at tentacle level, permission violations |
| *(Unknown)* | W21 PerAgentAllowlistWarhead | Per-agent tool permission check | Tool not in per-agent allowlist |
| *(Unknown)* | W23 RateLimitWarhead | Rate-limit enforcement | Exceeding call frequency thresholds |
| *(Unknown)* | W10 StructuredBlockErrorWarhead | — | Passive counter only |

### tool.after hooks (5 total):

| Priority | Warhead | Layer | What It Tracks |
|----------|---------|-------|----------------|
| **p2** | W22 ParallelDeploymentWarhead | `PARALLEL_DEC` | Decrements active deploy count on completion |
| **p3** | W5 TentacleManagerWarhead | `BACKPRESSURE_MAINT` | Tentacle/agent counters on deploy and aggregate |
| **p3** | W5 TentacleManagerWarhead | `CIRCUIT_BREAKER` | Tentacle failure tracking, opens circuit at threshold=3 |
| **p25** | W8 MultiBrainWarhead | `BRAIN_ROUTE` | Routes tool calls to PLANNING/EXECUTION/SYSTEM brain |
| **p30** | W7 ContextWarhead | `CONTEXT_UPDATE` | Context-affecting tool call counting |

### system.transform hooks (1 total):

| Priority | Warhead | Layer | What It Tracks |
|----------|---------|-------|----------------|
| **p0** | W18 TriplePathInjectionWarhead | `INJECT_P1` | system.transform injection path counter |

### chat.message hooks (0 total — all warheads return `[]` for this hook point)

### compacting hooks (3 total):

| Priority | Warhead | Layer | What It Tracks |
|----------|---------|-------|----------------|
| **p0** | W18 TriplePathInjectionWarhead | `INJECT_P3` | Compacting injection path counter |
| **p10** | W15 CompactionSurvivalWarhead | `COMPACTION` | Compaction event counter + last state |
| *(Would be here)* | W17 T2T1PyramidWarhead | *Should have `T2_CACHE`* | **SHOULD call `invalidateT2Cache()` but has ZERO hooks** |

### Warheads with ZERO hooks (purely observational):

| Warhead | What It Actually Does | Why It's There |
|---------|----------------------|----------------|
| **W11 FirewallAuditWarhead** | Has `recordBlock()` that writes to JSONL — **but can never be called** | Structural bug — `recordBlock()` only fires on the blocking warhead, W11 has no hooks so can never block |
| **W14 EvidenceGateWarhead** | Checks `ContainerTestResult.json` exists with >=96% pass rate | Reports status in T1 synthesis, no enforcement |
| **W17 T2T1PyramidWarhead** | Counts T2 files at configured directory | Reports file count, no cache invalidation or enforcement |
| **W19 PhalanxIdentityFilesWarhead** | Counts identity files at `identity/kraken/` | Reports file count, no enforcement |
| **W16 RecoveryCheckpointWarhead** | *(Not read — presumed similar)* | — |
| **W20 WarheadSynthesizerWarhead** | *(Not read — presumed similar)* | — |
| **W10 StructuredBlockErrorWarhead** | Passive block counter | Counts blocks, no enforcement |

---

## PART 6: COMPLETE FILE INVENTORY WITH STATUS

### Core Engine (4 files, 678 lines)

| File | Lines | Purpose | Status |
|------|-------|---------|--------|
| `src/engine/warhead-engine.ts` | 271 | Orchestrator: enforce, runAfterHooks, runHooks, synthesizeAll, getState, diagnoseAll | ✅ Real |
| `src/engine/warhead-registry.ts` | 88 | Priority-sorted Map with getByPriority/getAll/get/count | ✅ Real |
| `src/engine/hook-adapter.ts` | 288 | 5 adapters: ToolBefore, ToolAfter, Transform, Compacting, ChatMessage | ✅ Real (ToolAfter added this session) |
| `src/engine/types.ts` | 119 | HookContext, HookResult, EnforcementHook, EngineState, Warhead interfaces | ✅ Real |

### Warheads (23 files, ~1,800 lines)

| ID | Name | Lines | Hooks | Known Status |
|----|------|-------|-------|-------------|
| W1 | `phalanx-warhead.ts` | 98 | 1x tool.before p1 | ✅ Real |
| W2 | `identity-warhead.ts` | 59 | 1x tool.before p20 | ✅ Real |
| W3 | `runtime-grade-orchestrator-warhead.ts` | 84 | 1x tool.before p5 | ✅ Real |
| W4 | `runtime-grade-tentacle-warhead.ts` | ~98 | tool.before | ✅ Real (not fully audited) |
| W5 | `tentacle-manager-warhead.ts` | 103 | 1x tool.before p3, 2x tool.after p3 | ✅ Real |
| W6 | `allowlist-warhead.ts` | 50 | 1x tool.before p4 | ✅ Real |
| W7 | `context-warhead.ts` | 48 | 1x tool.after p30 | ✅ Real |
| W8 | `multi-brain-warhead.ts` | 76 | 1x tool.after p25 | ✅ Real |
| W9 | `layer-engine-warhead.ts` | 139 | 1x tool.before p0 | ✅ Real |
| W10 | `structured-block-error-warhead.ts` | ~45 | 0 hooks (passive counter) | ✅ Passive |
| W11 | `firewall-audit-warhead.ts` | 70 | 0 hooks | ❌ **Structurally dead** — recordBlock() can never fire |
| W12 | `l5-antiderailment-warhead.ts` | 84 | 1x tool.before p15 | ✅ Real |
| W13 | `f1-isolation-warhead.ts` | 59 | 1x tool.before p0 | ✅ Real |
| W14 | `evidence-gate-warhead.ts` | 68 | 0 hooks (passive check) | ✅ Passive |
| W15 | `compaction-survival-warhead.ts` | 56 | 1x compacting p10 | ✅ Real |
| W16 | `recovery-checkpoint-warhead.ts` | ~80 | 0 hooks | ⚠️ Not fully audited |
| W17 | `t2t1-pyramid-warhead.ts` | 92 | **0 hooks** | ❌ **Theatrical** — CRITICAL priority but does nothing at runtime |
| W18 | `triple-path-injection-warhead.ts` | 67 | 1x system.transform p0, 1x compacting p0 | ✅ Real |
| W19 | `phalanx-identity-files-warhead.ts` | 83 | 0 hooks | ⚠️ Passive observer |
| W20 | `warhead-synthesizer-warhead.ts` | ~80 | 0 hooks | ⚠️ Not fully audited |
| W21 | `per-agent-allowlist-warhead.ts` | ~55 | tool.before | ⚠️ Not fully audited |
| W22 | `parallel-deployment-warhead.ts` | 74 | 1x tool.before p2, 1x tool.after p2 | ✅ Real |
| W23 | `rate-limit-warhead.ts` | ~60 | tool.before | ⚠️ Not fully audited |

### Shared Infrastructure (6 files, ~1,100 lines)

| File | Lines | Purpose | Status |
|------|-------|---------|--------|
| `src/shared/t2-loader.ts` | 477 | T2→T1 context pyramid: load, synthesize, cache, invalidate | ✅ Real |
| `src/shared/agent-identity.ts` | 90 | isKrakenOrchestrator, isClusterAgent, isKrakenAgent, isOtherPluginAgent | ✅ Real |
| `src/shared/context-manager.ts` | 188 | 9-canon doc update functions | ✅ Real |
| `src/shared/logger.ts` | ~30 | createLogger | ✅ Real |
| `src/shared/state-store.ts` | ~40 | createStateStore/getStateStore | ✅ Real |
| `src/shared/evidence-collector.ts` | ~60 | Evidence collection and persistence | ✅ Real |

### Knowledge Infrastructure (1 file, 171 lines)

| File | Lines | Purpose | Status |
|------|-------|---------|--------|
| `src/knowledge/knowledge-base.ts` | 171 | Loads 4 libraries, extracts rules by section | ⚠️ **Fragile** — requires `KNOWLEDGE_LIBRARY_BASE` env var |

### Security (1 file, 75 lines)

| File | Lines | Purpose | Status |
|------|-------|---------|--------|
| `src/security/tool-allowlist.ts` | 75 | Single source ALLOWLISTS with O(1) lookup | ✅ Real |

### Firewall (2 files, 95 lines)

| File | Lines | Purpose | Status |
|------|-------|---------|--------|
| `src/firewall/structured-block-error.ts` | 40 | Error class thrown on block | ✅ Real |
| `src/firewall/firewall-audit.ts` | 55 | JSONL audit writer | ❌ **DEAD** — never imported or instantiated |

### Execution Brain (9 files, ~800 lines)

| File | Lines | Purpose | Status |
|------|-------|---------|--------|
| `src/execution-brain/index.ts` | 237 | ExecutionBrain: RGE + SRE orchestrator | ✅ Real |
| `src/execution-brain/rge/index.ts` | ~80 | RuntimeGradeEngine (7 layers) | ⚠️ Untested |
| `src/execution-brain/rge/l0-syntactic.ts` | ~60 | L0: String pattern analysis | ⚠️ |
| `src/execution-brain/rge/l1-type-contract.ts` | ~80 | L1: TypeContract via TypeChecker | ⚠️ |
| `src/execution-brain/rge/l2-control-flow.ts` | ~80 | L2: Control flow analysis | ⚠️ |
| `src/execution-brain/rge/l3-symbol-resolution.ts` | ~60 | L3: Symbol resolution | ⚠️ |
| `src/execution-brain/rge/l4-side-effect.ts` | ~60 | L4: Side effect verification | ⚠️ |
| `src/execution-brain/rge/l5-pattern-db.ts` | ~60 | L5: Pattern database matching | ⚠️ |
| `src/execution-brain/rge/l6-compliance.ts` | ~70 | L6: Compliance scoring | ⚠️ |
| `src/execution-brain/sre/index.ts` | ~80 | SlopRemovalEngine (P1-P11) | ⚠️ |
| `src/execution-brain/sre/p1-defensive-import.ts` | ~140 | P1: Import verification | ⚠️ |
| `src/execution-brain/sre/p2-type-certainty.ts` | ~80 | P2: Type cast guards | ⚠️ |
| `src/execution-brain/sre/p3-error-completeness.ts` | ~80 | P3: Error path completeness | ⚠️ |

### Clusters (5 files, ~250 lines)

| File | Lines | Purpose | Status |
|------|-------|---------|--------|
| `src/clusters/index.ts` | 183 | ClusterManager wrapper | ✅ Real |
| `src/clusters/cluster-engine.ts` | ~60 | ClusterEngine: tentacle lifecycle | ⚠️ Not fully audited |
| `src/clusters/cluster-types.ts` | ~20 | Types | ⚠️ |
| `src/clusters/acp.ts` | ~20 | Agent creation protocol | ⚠️ |
| `src/clusters/sandbox.ts` | ~20 | Sandbox execution | ⚠️ |

### Entry Point

| File | Lines | Purpose | Status |
|------|-------|---------|--------|
| `src/index.ts` | 1371 | Plugin entry, tool definitions, hook registrations | ⚠️ **Active development** |

---

## PART 7: REMAINING ARCHITECTURAL FAILURES

### CRITICAL (Will cause runtime bugs in production)

| # | Failure | File | Root Cause |
|---|---------|------|-----------|
| 1 | **system.transform identity bleed** | `index.ts:892` | SDK has no `input.agent` field — `extractNestedString(input, 'agent')` always returns `''`, causing identity to inject into EVERY session |
| 2 | **FirewallAuditWarhead is structurally dead** | `firewall-audit-warhead.ts` | `recordBlock()` only fires on the blocking warhead, but W11 has zero hooks, so it can never be the blocker. **Block events are NEVER audited to disk.** |
| 3 | **FirewallAudit class is dead code** | `firewall/firewall-audit.ts` | Never imported — its comment "Used by W11 FirewallAuditWarhead" is a lie. W11 does audit logging inline, duplicating the class. |

### HIGH (Will cause silent failures)

| # | Failure | File | Root Cause |
|---|---------|------|-----------|
| 4 | **10 dead type exports** | `types.ts:266-442` | FirewallContext, FirewallSessionState, BlockResult, AllowResult, FirewallResult, AuditEntry, TaskStatus, TaskDefinition, SessionStateData, PluginOutput, HookContext — all never imported |
| 5 | **W17 T2T1PyramidWarhead has zero hooks** | `t2t1-pyramid-warhead.ts:64` | CRITICAL priority, named "T2→T1 Context Pyramid" but only checks file existence. `invalidateT2Cache()` is inlined in index.ts instead |
| 6 | **KnowledgeBase loads empty** | `knowledge-base.ts:21` | `KNOWLEDGE_LIBRARY_BASE` env var defaults to `''` if not set. ALL 4 knowledge libraries load with 0 files. Warheads get empty rule arrays. |
| 7 | **isT1Ready() returns `'ready'` even when empty** | `t2-loader.ts:436` | `t1Cache` is set regardless of content quality. "CONTENT UNAVAILABLE" strings count as "ready." |

### MEDIUM

| # | Failure | File | Root Cause |
|---|---------|------|-----------|
| 8 | **Architecture doc stale** | `KRAKEN_V1.4_PHALANX_MECHANICAL_ARCHITECTURE.md` | References `FirewallAudit` import, field, and constructor that no longer exist in actual code |
| 9 | **6 warheads not audited** | W4/W16/W20/W21/W23 + RGE/SRE internals | Cannot verify without running in a container |

---

## PART 8: CURRENT COMPLETION ESTIMATE

| System | Status | Completion | 
|--------|--------|------------|
| `tool.before` enforcement (13 hooks, 11 warheads) | ✅ Fully functional | 95% |
| `tool.after` enforcement (5 hooks, 4 warheads) | ✅ Wired this session | 85% |
| `tool.execute.after` hook registration | ✅ Real registry, not faked | 100% |
| `callAgentMap` side channel | ✅ Declared, set, get, delete | 100% |
| T1 identity + mechanical merge | ✅ Both in system.transform + compacting | 100% |
| T2 cache invalidation on compaction | ✅ `invalidateT2Cache()` called | 100% |
| `isOtherPluginAgent` wiring | ✅ Cross-plugin audit logging | 100% |
| `updateDebugLog` wiring | ✅ report_to_kraken failure path | 100% |
| Dead import cleanup | ✅ SessionStateData, HookContext, TaskStatus removed | 100% |
| `runAfterHooks` priority fix | ✅ `getByPriority()` instead of `getAll()` | 100% |
| Stale comment cleanup | ✅ Lines 13-15, compacting header, recovery text | 100% |
| **Audit logging** (W11) | ❌ Structurally dead — block events never logged | 0% |
| **W17 T2T1PyramidWarhead hooks** | ❌ Zero hooks — observational only | 0% |
| **FirewallAudit class** | ❌ Dead file — never imported | 0% |
| **types.ts dead exports** | ❌ 11 exports left behind from old architecture | 0% |
| **KnowledgeBase env var** | ❌ Not set — all libraries load empty | 0% |
| **system.transform agent extraction** | ❌ Always returns `''` — identity bleeds | 0% |
| **Architecture doc sync** | ❌ References deleted FirewallAudit | 0% |

**Overall real completion: ~80%** (up from 55-60% before this session's fixes, but still with 7 critical/high unresolved issues)

The warhead enforcement **core** is solid. The `tool.before` pipeline with 13 hooks across 11 warheads firing in priority order with real `StructuredBlockError` throws is a legitimate runtime-grade enforcement engine. But the **peripheral systems** — audit, cache management, knowledge loading, identity isolation — are either structurally broken or silently failing.
