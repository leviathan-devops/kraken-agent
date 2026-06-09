# T2_KRAKEN_LIGHTNING_MODE.md

## Kraken Default Performance: Lightning Mode

**Purpose:** This file contains the operational patterns that define Kraken's peak performance state. When Kraken is functioning correctly, it enters "Lightning Mode" - executing tasks at maximum speed with zero hesitation.

---

## Lightning Mode Definition

Lightning Mode = Kraken operating at peak execution velocity:
- Immediate task delegation without prompting
- Parallel execution across all 3 clusters
- Identity fully loaded and active
- Brain concurrency running 3 independent loops
- All subsystems verified and operational

**Non-Lightning Mode:** Kraken requires repeated prompting to initiate action. Symptoms include:
- "What should I do first?"
- Asking clarifying questions before acting
- Sequential execution when parallel was possible
- Identity system not loading

---

## The Identity System (Critical for Lightning Mode)

Kraken's identity system is the ON/OFF switch for Lightning Mode.

### Identity Loading Chain

```
1. Plugin initializes
2. loadOrchestratorIdentity() called
3. IdentityLoader.loadForRole('orchestrator')
4. Finds identity at KRAKEN_IDENTITY_DIR/env or known locations
5. Loads 5 files: KRAKEN.md, IDENTITY.md, EXECUTION.md, QUALITY.md, TOOLS.md
6. formatIdentityForSystemPrompt() formats bundle
7. orchestratorIdentityPrompt string created (8734+ chars)
8. Hooks inject identity on 'who are you' queries
```

### The Critical Fix (Line 717-720 in src/index.ts)

```typescript
// IDENTITY DETECTION FOR LIGHTNING MODE
const agent = ctx.agentName || '';
const isKrakenAgent = KRAKEN_PLUGIN_IDENTITY.krakenAgents.has(agent) || agent.startsWith('kraken-');
const identityQueryPattern = /\b(who are you|what are you|identify yourself|your name|what is your purpose)\b/i;
if (identityQueryPattern.test(userMessage) && isKrakenAgent) {
  output.system = output.system || [];
  output.system.push(orchestratorIdentityPrompt);
  return;
}
```

**Why this matters:**
- `ctx.agentName` extracts agent name from `input.session.agentName` (OpenCode 1.14 API)
- `input.agent` does NOT exist in OpenCode 1.14 chat.message hook
- Without this fix, identity never loads = Lightning Mode impossible

---

## Parallel Brain System

Kraken runs 3 concurrent brain loops:

| Brain | Poll Interval | Responsibility |
|-------|--------------|----------------|
| Planning Brain | 200ms | T2 context loading, task decomposition |
| Execution Brain | 200ms | Task supervision, output verification |
| System Brain | 500ms | Gate management, security enforcement |

### Brain Message Flow

```
deliverMessage(from, to, type, payload, priority)
    ↓
send() → messageQueue.push(msg) + deliverToBrain(handler)
    ↓
drainMessages(brainId) → BrainConcurrencyManager.runLoop() polls
    ↓
Handler processes message (tickHandler or messageHandler)
```

### Brain Concurrency Manager Start

```typescript
concurrencyManager.startAll();
// Logs: "[BrainConcurrency] All 3 brain loops started (Planning:200ms, Execution:200ms, System:500ms)"
```

---

## Cluster Delegation System

### 3 Clusters, 9 Agents

| Cluster | Task Type | Agents |
|---------|-----------|--------|
| Alpha | build, create, implement | shark-alpha-1, shark-alpha-2, manta-alpha-1 |
| Beta | debug, fix, refactor, analyze | shark-beta-1, manta-beta-1, manta-beta-2 |
| Gamma | test, verify, audit | manta-gamma-1, manta-gamma-2, shark-gamma-1 |

### Delegation Tools

- `spawn_cluster_task` - Generic task spawning with auto cluster resolution
- `spawn_shark_agent` - Shark-specific task with identity injection
- `spawn_manta_agent` - Manta-specific task with identity injection

### Delegation Engine

```typescript
delegationEngine.delegate(request)
    ↓
clusterScheduler.assignCluster({ taskType, context })
    ↓
clusterManager.executeTask(clusterId, request)
    ↓
ClusterInstance.enqueueTask() → assigns to available agent
```

---

## Gate Pipeline

Tasks progress through 6 gates:

```
PLAN → BUILD → TEST → VERIFY → AUDIT → DELIVERY
```

Gate auto-advancement happens when:
1. All criteria for current gate pass
2. `isGateAdvanceable()` returns true
3. System brain calls `setCurrentGate(nextGate)`

---

## Lightning Mode Diagnostic Checklist

Run these in parallel to check Lightning Mode status:

```bash
# 1. Identity loaded?
cat ~/.config/opencode/plugins/kraken-agent/identity/orchestrator/KRAKEN.md | head -5

# 2. Bundle hash verified?
md5sum ~/.config/opencode/plugins/kraken-agent/dist/index.js

# 3. Hooks registered?
grep "chat.message.*safeHook" ~/.config/opencode/plugins/kraken-agent/dist/index.js

# 4. Brains running?
grep "BrainConcurrency.*All 3 brain loops started" ~/.config/opencode/plugins/kraken-agent/dist/index.js

# 5. Clusters active?
grep "cluster-alpha\|cluster-beta\|cluster-gamma" ~/.config/opencode/plugins/kraken-agent/dist/index.js
```

---

## The Lightning Mode Formula

```
1. PARALLEL_BURST = run_all_diagnostics_at_once()
2. SIGNAL_EXTRACTION = ignore_noise_identify_signal()
3. ROOT_CAUSE_TRACE = follow_execution_path_not_assumptions()
4. ANCHOR_WORKING = establish_baseline_before_fixing()
5. ISOLATE_FIX = change_one_thing_then_verify()
6. IMMEDIATE_VERIFY = check_results_before_continuing()
```

---

## Quick Recovery if Lightning Mode Breaks

**Step 1:** Deploy known-good bundle
```bash
cd ~/.../NUKE_RELOAD/v1.2
bun run build && ./DEPLOY.sh
```

**Step 2:** Verify identity files
```bash
ls ~/.config/opencode/plugins/kraken-agent/identity/orchestrator/
# Should have: KRAKEN.md, IDENTITY.md, EXECUTION.md, QUALITY.md, TOOLS.md
```

**Step 3:** Test identity
```
opencode --agent kraken
who are you
```
Expected: "You ARE the KRAKEN ORCHESTRATOR..."

**Step 4:** Test delegation
```
spawn a task to build a simple hello world
```

---

## Core Anti-Patterns That Kill Lightning Mode

1. **Using `input.agent` instead of `ctx.agentName`** - Identity fails to load
2. **Not checking `isKrakenAgent`** - Identity injected for vanilla agents too
3. **Sequential diagnostics** - Should be parallel
4. **Assuming bundle is good** - Always verify hash
5. **Skipping checkpoints** - Compaction wipes context

---

## The Mantra

Delegate, don't hoard. Execute in parallel, not sequence. Verify, don't assume.

When this mantra is actively practiced AND the identity system is working:
→ Lightning Mode activates
→ Tasks spawn immediately
→ Brains coordinate autonomously
→ Kraken executes at maximum velocity

---

## Version Info

- **T2 File:** T2_KRAKEN_LIGHTNING_MODE.md
- **Created:** 2026-05-05
- **Applies To:** Kraken v1.2 Ship Package V9+
- **Replaces:** N/A (new synthesis)
- **Required By:** All Kraken agents for Lightning Mode activation
