# CONTEXT MANAGEMENT ENGINEERING REPORT — Kraken v1.3

## How We Finally Got Context Management Working

### The Problem

Context management docs are supposed to be "mechanically enforced memory anchors" that update automatically after every significant operation. In practice, every agent starts with good intentions and then either:
- Forgets to update them entirely
- Copy-pastes the same data across all 9 docs (defeating the purpose)
- Wires only 2 of 9 docs and calls it done
- Makes the docs "static reference" that never change

This happened across multiple builds before we finally engineered a solution that actually works.

### The Architecture

#### File: `src/shared/context-manager.ts`

This is a pure TypeScript module with ZERO dependencies on opencode SDK types. It can be imported by ANY plugin.

```
const CONTEXT_DIR = process.env.KRAKEN_CONTEXT_DIR || '/workspace/kraken/CONTEXT_MANAGEMENT';
```

Each of the 9 canon docs has its own update function. Every function:
1. Reads the existing file (or initializes with a header if missing)
2. Appends NEW unique data appropriate to that doc's purpose
3. Writes atomically back to disk

#### The 9 Functions (one per doc, each with DISTINCT content):

| Function | Doc | Content Type | When Called |
|----------|-----|-------------|-------------|
| `updateBuildStateOnTaskComplete()` | BUILD_STATE.md | Task completion entries with status + timestamp | Task complete |
| `updateTaskQueue()` | TASK_QUEUE.md | `[x]`/`[ ]` backlog with PENDING/COMPLETE/FAILED | Task spawn + complete |
| `updateChangelog()` | CHANGELOG.md | Issue \| File \| Change structured table rows | Milestone complete |
| `updateDecisionChain()` | DECISION_CHAIN.md | # \| Decision \| Rationale \| Date table | Decision made |
| `updateDebugLog()` | DEBUG_LOG.md | Category, Description, Root Cause, Fix sections | Failure occurs |
| `updateCompactionSurvival()` | COMPACTION_SURVIVAL.md | Current phase, active/completed counts, next milestone | State change |
| `updateEvidenceState()` | EVIDENCE_STATE.md | Bundle size, test results, evidence inventory | Analysis run |
| `updatePostCompactionPrompt()` | POST-COMPACTION_PROMPT.md | Last completed task, current gate, task counts | State change |
| `updateSoCPreservation()` | SoC_PRESERVATION.md | Pattern, Context, Source attribution entries | Discovery made |

**Critical rule — NO COPY-PASTE:** Each function writes DIFFERENT data. `updateTaskQueue` writes backlog status (`[x] task-xxx: description (COMPLETE — timestamp)`). `updateChangelog` writes structured table rows (`| issue | file | change |`). `updateDecisionChain` writes numbered decision entries with rationales. They share the `taskId` but the FORMAT and CONTENT are completely different.

### Mechanical Trigger Points (Kraken-specific)

The context manager is called from INSIDE the plugin's tool execute functions — not from a separate process, not from a cron job, not from an external script. This is what makes it "mechanical" — it fires as a side effect of the tool execution itself.

#### Trigger: `complete_tool` (Orchestrator completes a to-do)

```typescript
// src/index.ts — inside complete_todo.execute()
const taskId = `todo-${Date.now().toString(36)}`;

// ALL 9 update functions called with distinct data:
updateBuildStateOnTaskComplete(taskId, 'complete', description);
updateTaskQueue(taskId, description, 'COMPLETE');
updateChangelog(`Todo: ${description}`, [{ issue: taskId, file: details, change: description }]);
updateDecisionChain(`Todo completed: ${description}`, `Orchestrator to-do item finished. ${details}`);
updateCompactionSurvival('BUILD', activeCount, completedCount + 1, description);
updateEvidenceState(0, `${completedCount + 1} tasks completed, ${activeCount} active`);
updatePostCompactionPrompt(description, 'BUILD', activeCount, completedCount + 1);
updateSoCPreservation([{ pattern: `Todo completed: ${description}`, context: details, source: 'complete_todo' }]);
// DEBUG_LOG not updated on success — only on failures
```

#### Trigger: `report_to_kraken` (Subagent reports back)

```typescript
// src/index.ts — inside report_to_kraken.execute()
if (status === 'complete') {
  updateBuildStateOnTaskComplete(taskId, 'complete', desc);
  updateTaskQueue(taskId, desc, 'COMPLETE');
  updateChangelog(`Task ${taskId} completed`, [{ issue: taskId, file: output, change: `${desc} — ${status}` }]);
  updateCompactionSurvival('BUILD', activeCount, completedCount, 'Next task');
  updateEvidenceState(0, `${completedCount} tasks complete`);
  updatePostCompactionPrompt(desc, 'BUILD', activeCount, completedCount);
  updateSoCPreservation([{ pattern: `Task completed: ${desc}`, context: desc, source: `report_to_kraken(${taskId})` }]);
}
if (status === 'failed') {
  updateDebugLog('TASK_FAILURE', `Task ${taskId} failed: ${desc}`, `Status: ${status}`, 'Review and re-spawn');
}
```

#### Trigger: `spawn_cluster_task` / `spawn_shark_agent` / `spawn_manta_agent`

```typescript
updateTaskQueue(taskDef.id, task, 'PENDING');
updateDecisionChain(
  `Task ${taskDef.id} allocated to ${clusterId}`,
  `Task type ${taskType} routed to ${clusterId}. ${criteria.length} criteria.`
);
```

#### Trigger: `execution_brain_analyze` (Orchestrator analysis)

```typescript
updateEvidenceState(0, `RGE+SRE: ${totalViolations} violations`);
updateCompactionSurvival('VERIFY', 0, 0, 'Review results');
updateSoCPreservation([{ pattern: `Analysis found ${totalViolations} violations`, context: `${rgeCount} RGE + ${sreCount} SRE`, source: 'execution_brain_analyze' }]);
```

#### Trigger: `aggregate_results` (Orchestrator aggregation)

```typescript
updateEvidenceState(0, `Aggregated ${results.length} tasks (${completed} complete)`);
updatePostCompactionPrompt(lastDesc, 'VERIFY', 0, completed);
// PSEUDOCODE for token threshold:
//   const tokenPct = Math.round((tokensUsed / tokenBudget) * 100);
//   if (tokenPct >= lastTokenThreshold + 15) { updateCompactionSurvival(...); updatePostCompactionPrompt(...); }
```

### What Makes It Work (Anti-Patterns Avoided)

1. **Don't make docs static.** Every doc must update on every relevant trigger. The `COMPACTION_SURVIVAL.md` should show CURRENT state, not static architecture text. The `POST-COMPACTION_PROMPT.md` should show the LATEST snapshot, not generic recovery instructions.

2. **Don't copy-paste data.** Each doc has a distinct format and purpose. `BUILD_STATE.md` tracks task entries. `TASK_QUEUE.md` tracks backlog. `CHANGELOG.md` tracks structured changes. They share the same `taskId` but present completely different information.

3. **Don't wire only 2 functions.** We started with only `updateTaskQueue` and `updateBuildStateOnTaskComplete` wired. The other 7 were "static" — which meant they never updated. ALL 9 must be wired.

4. **Don't forget orchestrator-level triggers.** `report_to_kraken` only covers subagent reports. The orchestrator itself uses `complete_todo`, `execution_brain_analyze`, `aggregate_results`, `spawn_shark_agent`, `spawn_manta_agent`. ALL needed wiring.

5. **Mount the project directory.** The context manager writes to `CONTEXT_MANAGEMENT/` via a mounted volume (`-v $PROJECT:/workspace/kraken`). Without the mount, container writes are ephemeral.

### Verifying It Works

After implementation, verify by running a build cycle and checking every doc:

```bash
# Clear docs, run operations, verify all 9 updated
for f in BUILD_STATE.md CHANGELOG.md COMPACTION_SURVIVAL.md DEBUG_LOG.md \
         DECISION_CHAIN.md EVIDENCE_STATE.md POST-COMPACTION_PROMPT.md \
         SoC_PRESERVATION.md TASK_QUEUE.md; do
  echo "$f: $(wc -c < CONTEXT_MANAGEMENT/$f) bytes"
done
```

Each doc should have grown from its initialization size. If any doc is still at header-only size (70-100 bytes), that function isn't being triggered.

### Container Mount Requirement

The context manager writes to `/workspace/kraken/CONTEXT_MANAGEMENT/` by default. To persist docs on the host:

```bash
docker run -d --name my-agent \
  -v /host/path/to/project:/workspace/kraken \
  opencode-test:1.14.43 \
  /bin/sh -c 'tail -f /dev/null'
```

Or override via env:
```bash
docker run -d --name my-agent \
  -e KRAKEN_CONTEXT_DIR=/custom/path/CONTEXT_MANAGEMENT \
  ...
```
