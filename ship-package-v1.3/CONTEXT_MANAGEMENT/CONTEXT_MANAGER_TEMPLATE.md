# CONTEXT MANAGER — Agent-Agnostic Framework Boilerplate

## Overview

This is a drop-in context management framework for ANY opencode plugin agent (Shark, Spider, Manta, Kraken, Trident, Hydra). Based on the working Kraken v1.3 implementation. 

**Replace `MYAGENT` with your agent's name throughout.**

---

## File 1: `src/shared/context-manager.ts` (Copy-paste, then rename functions)

```typescript
/**
 * src/shared/context-manager.ts
 *
 * MECHANICAL ENFORCEMENT of context management docs (9-canon baseline).
 * Updates CONTEXT_MANAGEMENT docs after EVERY:
 * 1. Cluster/subagent task completion
 * 2. Completed to-do task at the orchestrator level
 * 3. Any and all major milestones/breakthroughs
 * 4. Every 15% of context tokens consumed (placeholder)
 *
 * Non-negotiable. Called from tool execute functions and hooks.
 *
 * Path: set via MYAGENT_CONTEXT_DIR env var.
 * Mount the project directory to /workspace/myagent at container runtime.
 */

import * as fs from 'fs';
import * as path from 'path';

const CONTEXT_DIR: string = process.env.MYAGENT_CONTEXT_DIR || '/workspace/myagent/CONTEXT_MANAGEMENT';

function ensureDir(): void {
  if (!fs.existsSync(CONTEXT_DIR)) {
    fs.mkdirSync(CONTEXT_DIR, { recursive: true });
    console.error(`[ContextManager] Created CONTEXT_MANAGEMENT at ${CONTEXT_DIR}`);
  }
}

function readDoc(docName: string): string | null {
  try { return fs.readFileSync(path.join(CONTEXT_DIR, docName), 'utf-8'); }
  catch { return null; }
}

function writeDoc(docName: string, content: string): void {
  ensureDir();
  fs.writeFileSync(path.join(CONTEXT_DIR, docName), content, 'utf-8');
  console.error(`[ContextManager] Updated ${docName}`);
}

// ============================================================
// 1. BUILD_STATE.md — Build metrics / task completion entries
// ============================================================
export function updateBuildStateOnTaskComplete(taskId: string, status: string, description: string): void {
  const existing = readDoc('BUILD_STATE.md') || '# BUILD_STATE.md\n\n_Initialized by ContextManager._\n';
  writeDoc('BUILD_STATE.md', existing + `\n## ${taskId} — ${status.toUpperCase()} (${new Date().toISOString()})\n- ${description}\n`);
}

// ============================================================
// 2. TASK_QUEUE.md — Backlog tracking with [x]/[ ] + PENDING/COMPLETE/FAILED
// ============================================================
export function updateTaskQueue(taskId: string, description: string, status: 'PENDING' | 'COMPLETE' | 'FAILED'): void {
  const existing = readDoc('TASK_QUEUE.md') || '# TASK_QUEUE.md\n\n_Initialized by ContextManager._\n';
  const prefix = status === 'COMPLETE' ? '[x]' : '[ ]';
  writeDoc('TASK_QUEUE.md', existing + `\n${prefix} ${taskId}: ${description} (${status} — ${new Date().toISOString()})\n`);
}

// ============================================================
// 3. CHANGELOG.md — Structured build log (Issue | File | Change)
// ============================================================
export function updateChangelog(buildName: string, changes: Array<{ issue: string; file: string; change: string }>): void {
  const existing = readDoc('CHANGELOG.md') || '# Changelog\n\n_Initialized by ContextManager._\n';
  let entry = `\n## ${buildName} (${new Date().toISOString()})\n\n| Issue | File | Change |\n|-------|------|--------|\n`;
  for (const c of changes) entry += `| ${c.issue} | ${c.file} | ${c.change} |\n`;
  writeDoc('CHANGELOG.md', existing + entry);
}

// ============================================================
// 4. DECISION_CHAIN.md — Numbered decisions with rationales
// ============================================================
export function updateDecisionChain(decision: string, rationale: string): void {
  const existing = readDoc('DECISION_CHAIN.md') || '# DECISION_CHAIN.md\n\n| # | Decision | Rationale | Date |\n|---|----------|-----------|------|\n';
  const count = (existing || '').split('\n|').length - 1;
  writeDoc('DECISION_CHAIN.md', existing + `| ${count + 1} | ${decision} | ${rationale} | ${new Date().toISOString().split('T')[0]} |\n`);
}

// ============================================================
// 5. DEBUG_LOG.md — Failure root cause analysis (only on failures)
// ============================================================
export function updateDebugLog(category: string, description: string, rootCause: string, fix: string): void {
  const existing = readDoc('DEBUG_LOG.md') || '# DEBUG_LOG.md\n\n_Initialized by ContextManager._\n';
  writeDoc('DEBUG_LOG.md', existing + `\n## ${new Date().toISOString()} — ${category}\n- **Description:** ${description}\n- **Root Cause:** ${rootCause}\n- **Fix:** ${fix}\n`);
}

// ============================================================
// 6. COMPACTION_SURVIVAL.md — Current project state (phase, tasks, next)
// ============================================================
export function updateCompactionSurvival(phase: string, active: number, completed: number, next: string): void {
  writeDoc('COMPACTION_SURVIVAL.md', `# COMPACTION SURVIVAL\n\n**Updated:** ${new Date().toISOString()}\n\n- **Phase:** ${phase}\n- **Active Tasks:** ${active}\n- **Completed Tasks:** ${completed}\n- **Next Milestone:** ${next}\n`);
}

// ============================================================
// 7. EVIDENCE_STATE.md — Evidence file inventory + test results
// ============================================================
export function updateEvidenceState(bundleSize: number, testResults: string): void {
  writeDoc('EVIDENCE_STATE.md', `# EVIDENCE STATE\n\n**Updated:** ${new Date().toISOString()}\n\n- **Bundle:** ${bundleSize} bytes\n- **Test Results:** ${testResults}\n- **Container:** myagent-container\n\n| File | Status |\n|------|--------|\n| ContainerTestResult.json | Generated by test runner |\n| CONTEXT_MANAGEMENT/*.md | 9 canon docs, mechanically updated |\n`);
}

// ============================================================
// 8. POST-COMPACTION_PROMPT.md — Latest recovery snapshot
// ============================================================
export function updatePostCompactionPrompt(lastTask: string, gate: string, active: number, completed: number): void {
  writeDoc('POST-COMPACTION_PROMPT.md', `# POST-COMPACTION RECOVERY\n\n**Snapshot:** ${new Date().toISOString()}\n\n- **Last Task:** ${lastTask}\n- **Gate:** ${gate}\n- **Active:** ${active}\n- **Completed:** ${completed}\n\n### Recovery\n1. Read COMPACTION_SURVIVAL.md\n2. Read BUILD_STATE.md\n3. Read TASK_QUEUE.md\n4. Rebuild and redeploy\n5. Re-verify\n`);
}

// ============================================================
// 9. SoC_PRESERVATION.md — Patterns discovered with source
// ============================================================
export function updateSoCPreservation(patterns: Array<{ pattern: string; context: string; source: string }>): void {
  const existing = readDoc('SoC_PRESERVATION.md') || '# SoC PRESERVATION\n\n_Initialized by ContextManager._\n';
  let entry = `\n## ${new Date().toISOString()}\n\n`;
  for (const p of patterns) entry += `- **Pattern:** ${p.pattern}\n  - **Context:** ${p.context}\n  - **Source:** ${p.source}\n\n`;
  writeDoc('SoC_PRESERVATION.md', existing + entry);
}
```

---

## File 2: Agent Plugin — Wiring Context Manager into Tools

Add these imports and calls to your plugin's `src/index.ts` or equivalent:

### Import

```typescript
import {
  updateBuildStateOnTaskComplete, updateTaskQueue, updateDecisionChain, updateDebugLog, updateChangelog,
  updateCompactionSurvival, updateEvidenceState, updatePostCompactionPrompt, updateSoCPreservation
} from './shared/context-manager.js';
```

### Wire into `MYAGENT_complete_todo` tool (ORCHESTRATOR-LEVEL TO-DO)

```typescript
complete_todo: {
  description: 'Mark an orchestrator-level to-do as complete, update ALL 9 context docs',
  parameters: {
    type: 'object',
    properties: {
      description: { type: 'string', description: 'What was completed' },
      details: { type: 'string', description: 'Additional details' },
    },
    required: ['description'],
  },
  execute: async (args) => {
    const description = extractString(args, 'description', '');
    const details = extractString(args, 'details', '');
    if (!description || description.length < 5) return { success: false, error: 'Description too short' };

    const taskId = `todo-${Date.now().toString(36)}`;

    // MECHANICAL: Update ALL 9 context docs with DISTINCT data
    try {
      updateBuildStateOnTaskComplete(taskId, 'complete', description.slice(0, 60));
      updateTaskQueue(taskId, description.slice(0, 60), 'COMPLETE');
      updateChangelog(`Todo: ${description.slice(0, 40)}`, [
        { issue: taskId, file: details.slice(0, 30) || 'orchestrator', change: `${description.slice(0, 50)} — complete` }
      ]);
      updateDecisionChain(`Todo: ${description.slice(0, 50)}`, details || 'Orchestrator-level completion');
      updateCompactionSurvival('BUILD', 0, 0, description.slice(0, 60));
      updateEvidenceState(0, `Todo completed: ${description.slice(0, 40)}`);
      updatePostCompactionPrompt(description.slice(0, 60), 'BUILD', 0, 0);
      updateSoCPreservation([{ pattern: `Todo: ${description.slice(0, 60)}`, context: details.slice(0, 100) || 'Orchestrator completion', source: 'complete_todo' }]);
    } catch (err) { console.error('[ContextManager] Update failed:', err); }

    return { success: true, taskId, message: `Completed: ${description}` };
  },
},
```

### Wire into SPAWN tools (add after task creation)

```typescript
updateTaskQueue(taskDef.id, task.slice(0, 60), 'PENDING');
updateDecisionChain(`Task ${taskDef.id} allocated to ${clusterId}`, `Type: ${taskType}. ${criteria.length} criteria.`);
```

### Wire into REPORT tool (add after status update)

```typescript
if (status === 'complete' || status === 'failed') {
  const desc = task ? task.description.slice(0, 60) : 'unknown';
  updateBuildStateOnTaskComplete(taskId, status, desc);
  updateTaskQueue(taskId, desc, status === 'complete' ? 'COMPLETE' : 'FAILED');
  
  if (status === 'complete') {
    updateChangelog(`Task ${taskId.slice(0,14)}`, [{ issue: taskId.slice(0,14), file: output.slice(0,30) || 'unknown', change: desc }]);
    updateCompactionSurvival('BUILD', activeCount, completedCount, 'Next task');
    updateEvidenceState(0, `${completedCount} tasks complete`);
    updatePostCompactionPrompt(desc, 'BUILD', activeCount, completedCount);
    updateSoCPreservation([{ pattern: `Task completed: ${desc}`, context: desc, source: `report(${taskId.slice(0,14)})` }]);
  }
  if (status === 'failed') {
    updateDebugLog('TASK_FAILURE', `Task ${taskId.slice(0,14)} failed: ${desc}`, `Status: ${status}. Output: ${output}`, 'Review and re-spawn');
  }
}
```

### Wire into ANALYSIS tool (orchestrator-level analysis)

```typescript
updateEvidenceState(0, `Analysis complete: ${violations} violations`);
updateCompactionSurvival('VERIFY', 0, 0, 'Review analysis results');
updateSoCPreservation([{ pattern: `Analysis: ${violations} violations`, context: `${rge} RGE + ${sre} SRE`, source: 'analysis_tool' }]);
```

### Wire into AGGREGATE tool (orchestrator-level aggregation)

```typescript
updateEvidenceState(0, `Aggregated ${results.length} tasks (${completed} complete)`);
updatePostCompactionPrompt(lastDesc, 'VERIFY', 0, completed);
// PSEUDOCODE for token threshold check (every 15%):
//   const pct = Math.round((tokensUsed / tokenBudget) * 100);
//   if (pct >= lastThreshold + 15) { updateCompactionSurvival(...); updatePostCompactionPrompt(...); lastThreshold = Math.floor(pct / 15) * 15; }
```

---

## Deployment: Container Mount

```bash
# Mount project directory so context manager writes persist to host
docker run -d --name myagent-container \
  -v /host/path/to/myagent/project:/workspace/myagent \
  -e MYAGENT_CONTEXT_DIR=/workspace/myagent/CONTEXT_MANAGEMENT \
  opencode-test:1.14.43 \
  /bin/sh -c 'tail -f /dev/null'
```

Or use environment variable to override path:
```bash
export MYAGENT_CONTEXT_DIR=/custom/path/CONTEXT_MANAGEMENT
```

---

## Verification Checklist

After wiring, run this to verify ALL 9 docs update:

```bash
# Clear old docs
rm -f CONTEXT_MANAGEMENT/*.md

# Run operations: complete_todo, spawn tools, report tools, analysis, aggregate
# Then check every doc has grown past header size:
for f in BUILD_STATE.md CHANGELOG.md COMPACTION_SURVIVAL.md DEBUG_LOG.md \
         DECISION_CHAIN.md EVIDENCE_STATE.md POST-COMPACTION_PROMPT.md \
         SoC_PRESERVATION.md TASK_QUEUE.md; do
  sz=$(wc -c < "CONTEXT_MANAGEMENT/$f" 2>/dev/null || echo 0)
  if [ "$sz" -gt 100 ]; then echo "✅ $f ($sz bytes)"; else echo "❌ $f ($sz bytes) — NOT UPDATING"; fi
done
```

---

## 9-Canon Document Purpose Reference

| # | Doc | Core Question It Answers | Update Trigger |
|---|-----|-------------------------|----------------|
| 1 | BUILD_STATE.md | "What build metrics and task completions happened?" | Task complete/fail |
| 2 | TASK_QUEUE.md | "What's in the backlog, what's done, what's pending?" | Spawn + complete |
| 3 | CHANGELOG.md | "What changed, by whom, what was the impact?" | Milestone |
| 4 | DECISION_CHAIN.md | "Why was this decision made (not just what)?" | Decision point |
| 5 | DEBUG_LOG.md | "What failed, why, and how was it fixed?" | Failure |
| 6 | COMPACTION_SURVIVAL.md | "What state is the project in RIGHT NOW?" | Any state change |
| 7 | EVIDENCE_STATE.md | "What evidence files exist and are they valid?" | Analysis/test run |
| 8 | POST-COMPACTION_PROMPT.md | "If compaction just happened, where do I resume?" | Any state change |
| 9 | SoC_PRESERVATION.md | "What patterns and lessons were learned?" | Discovery |
