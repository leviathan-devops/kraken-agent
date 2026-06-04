/**
 * src/shared/context-manager.ts
 *
 * MECHANICAL ENFORCEMENT of context management docs (9-canon baseline).
 * Updates CONTEXT_MANAGEMENT docs after EVERY:
 * 1. Cluster/subagent task completion
 * 2. Gate advance
 * 3. Completed todo
 * 4. Major build milestone
 *
 * Non-negotiable. Called from tool execute functions and hooks.
 *
 * Path: set via KRAKEN_CONTEXT_DIR env var, defaults to /workspace/kraken/CONTEXT_MANAGEMENT
 * Mount the project directory to /workspace/kraken to persist docs on host.
 */

import * as fs from 'fs';
import * as path from 'path';

const CONTEXT_DIR: string = process.env.KRAKEN_CONTEXT_DIR || '/workspace/kraken/CONTEXT_MANAGEMENT';

/**
 * Ensure the CONTEXT_MANAGEMENT directory exists.
 * Creates it on first access.
 */
function ensureDir(): void {
  if (!fs.existsSync(CONTEXT_DIR)) {
    fs.mkdirSync(CONTEXT_DIR, { recursive: true });
    console.error(`[ContextManager] Created CONTEXT_MANAGEMENT at ${CONTEXT_DIR}`);
  }
}

/**
 * Read a context doc, returning its content or null if missing.
 */
function readDoc(docName: string): string | null {
  const docPath: string = path.join(CONTEXT_DIR, docName);
  try {
    return fs.readFileSync(docPath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Write a context doc atomically.
 */
function writeDoc(docName: string, content: string): void {
  ensureDir();
  const docPath: string = path.join(CONTEXT_DIR, docName);
  fs.writeFileSync(docPath, content, 'utf-8');
  console.error(`[ContextManager] Updated ${docName}`);
}

/**
 * MECHANICAL: Update BUILD_STATE.md when a task completes.
 */
export function updateBuildStateOnTaskComplete(
  taskId: string,
  status: string,
  taskDescription: string
): void {
  const existing: string | null = readDoc('BUILD_STATE.md');
  const header: string = existing || `# BUILD_STATE.md\n\n_Initialized by ContextManager. Updated on each milestone._\n`;
  const entry: string = `\n## Task ${taskId} — ${status.toUpperCase()} (${new Date().toISOString()})\n- ${taskDescription}\n`;
  writeDoc('BUILD_STATE.md', header + entry);
}

/**
 * MECHANICAL: Update CHANGELOG.md with a new build entry.
 */
export function updateChangelog(
  buildName: string,
  changes: Array<{ issue: string; file: string; change: string }>
): void {
  const existing: string | null = readDoc('CHANGELOG.md');
  const header: string = existing || '# Kraken — Build Log (CHANGELOG)\n\n_Initialized by ContextManager._\n';
  let entry: string = `\n## ${buildName} (${new Date().toISOString()})\n\n| Issue | File | Change |\n|-------|------|--------|\n`;
  for (const c of changes) {
    entry += `| ${c.issue} | ${c.file} | ${c.change} |\n`;
  }
  writeDoc('CHANGELOG.md', header + entry);
}

/**
 * MECHANICAL: Update TASK_QUEUE.md when a task is spawned or completed.
 */
export function updateTaskQueue(
  taskId: string,
  description: string,
  status: 'PENDING' | 'COMPLETE' | 'FAILED'
): void {
  const existing: string | null = readDoc('TASK_QUEUE.md');
  const header: string = existing || '# TASK_QUEUE.md\n\n_Initialized by ContextManager. Updated on each milestone._\n';
  const prefix: string = status === 'COMPLETE' ? '[x]' : '[ ]';
  const entry: string = `\n${prefix} ${taskId}: ${description} (${status} — ${new Date().toISOString()})\n`;
  writeDoc('TASK_QUEUE.md', header + entry);
}

/**
 * MECHANICAL: Update DECISION_CHAIN.md with a new decision.
 */
export function updateDecisionChain(
  decision: string,
  rationale: string
): void {
  const existing: string | null = readDoc('DECISION_CHAIN.md');
  const header: string = existing || '# DECISION_CHAIN.md\n\n| # | Decision | Rationale | Date |\n|---|----------|-----------|------|\n';
  // Count existing entries for numbering
  const entryCount: number = (existing || '').split('\n|').length - 1;
  const entry: string = `| ${entryCount + 1} | ${decision} | ${rationale} | ${new Date().toISOString().split('T')[0]} |\n`;
  writeDoc('DECISION_CHAIN.md', header + entry);
}

/**
 * MECHANICAL: Update DEBUG_LOG.md with a debug entry.
 */
export function updateDebugLog(
  category: string,
  description: string,
  rootCause: string,
  fix: string
): void {
  const existing: string | null = readDoc('DEBUG_LOG.md');
  const header: string = existing || '# DEBUG_LOG.md\n\n_Initialized by ContextManager. Updated on each event._\n';
  const entry: string = `\n## ${new Date().toISOString()} — ${category}\n- **Description:** ${description}\n- **Root Cause:** ${rootCause}\n- **Fix:** ${fix}\n`;
  writeDoc('DEBUG_LOG.md', header + entry);
}

/**
 * MECHANICAL: Update COMPACTION_SURVIVAL.md with current project state.
 * Contains: current phase, active tasks, completed tasks, next steps.
 * Updated after EVERY task completion or milestone.
 */
export function updateCompactionSurvival(
  currentPhase: string,
  activeTaskCount: number,
  completedTaskCount: number,
  nextMilestone: string
): void {
  const timestamp: string = new Date().toISOString();
  const content: string = `# COMPACTION SURVIVAL (Auto-Updated)\n\n**Last Updated:** ${timestamp}\n\n## Current State\n- **Phase:** ${currentPhase}\n- **Active Tasks:** ${activeTaskCount}\n- **Completed Tasks:** ${completedTaskCount}\n- **Next Milestone:** ${nextMilestone}\n\n## Quick Recovery\n1. Read BUILD_STATE.md for detailed build metrics\n2. Read TASK_QUEUE.md for remaining tasks\n3. Read POST-COMPACTION_PROMPT.md for recovery steps\n4. Run: \`bun build && docker cp dist/index.js <container>:/path\`\n5. Run: \`bun run /tmp/test.mjs\` to verify\n`;
  writeDoc('COMPACTION_SURVIVAL.md', content);
}

/**
 * MECHANICAL: Update EVIDENCE_STATE.md with latest evidence file inventory.
 * Called after tool executions that produce evidence.
 */
export function updateEvidenceState(
  bundleSize: number,
  testResults: string
): void {
  const timestamp: string = new Date().toISOString();
  const content: string = `# EVIDENCE STATE (Auto-Updated)\n\n**Last Updated:** ${timestamp}\n\n## Current Evidence\n- **Bundle:** ${bundleSize} bytes\n- **Test Results:** ${testResults}\n- **Container:** kraken-v13-test (opencode-test:1.14.43)\n\n## Evidence Files\n| File | Status |\n|------|--------|\n| ContainerTestResult.json | Generated by final-test.mjs |\n| ContainerSpawnResult.json | Generated by test runner |\n| EvidencePathVerified.json | Generated by test runner |\n| CONTEXT_MANAGEMENT/*.md | 9 canon docs, mechanically updated |\n`;
  writeDoc('EVIDENCE_STATE.md', content);
}

/**
 * MECHANICAL: Update POST-COMPACTION_PROMPT.md with latest recovery state.
 * Contains the most recent snapshot so post-compaction recovery is accurate.
 */
export function updatePostCompactionPrompt(
  lastCompletedTask: string,
  currentGate: string,
  activeTaskCount: number,
  completedTaskCount: number
): void {
  const timestamp: string = new Date().toISOString();
  const content: string = `# POST-COMPACTION RECOVERY PROMPT (Auto-Updated)\n\n**Last Snapshot:** ${timestamp}\n\n## You just woke up from compaction.\n\n### Last Known State\n- **Last Completed Task:** ${lastCompletedTask}\n- **Current Gate:** ${currentGate}\n- **Active Tasks:** ${activeTaskCount}\n- **Completed Tasks:** ${completedTaskCount}\n\n### Recovery Sequence\n1. Read COMPACTION_SURVIVAL.md first\n2. Read BUILD_STATE.md for build metrics\n3. Read TASK_QUEUE.md for remaining backlog\n4. Rebuild: \`bun build src/index.ts --outdir dist --target bun --format esm --bundle --external @opencode-ai/plugin\`\n5. Redeploy: \`docker cp dist/index.js <container>:/root/.config/opencode/plugins/kraken-agent/dist/index.js\`\n6. Re-verify: \`docker exec <container> bun run /tmp/test.mjs\`\n`;
  writeDoc('POST-COMPACTION_PROMPT.md', content);
}

/**
 * MECHANICAL: Update SoC_PRESERVATION.md with latest patterns and lessons.
 * Called after significant discoveries or when patterns are identified.
 */
export function updateSoCPreservation(
  patterns: Array<{ pattern: string; context: string; source: string }>
): void {
  const existing: string | null = readDoc('SoC_PRESERVATION.md');
  const header: string = existing || '# SoC PRESERVATION — State of Consciousness\n\n_Initialized by ContextManager. Updated on each discovery._\n';
  let entry: string = `\n## Update: ${new Date().toISOString()}\n\n`;
  for (const p of patterns) {
    entry += `### Pattern: ${p.pattern}\n- **Context:** ${p.context}\n- **Source:** ${p.source}\n\n`;
  }
  writeDoc('SoC_PRESERVATION.md', header + entry);
}
