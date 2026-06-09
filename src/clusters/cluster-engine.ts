/**
 * src/clusters/cluster-engine.ts
 *
 * Kraken v1.4 ClusterEngine — Tentacle-based cluster management.
 *
 * Architecture: Octopus model — each tentacle operates independently.
 * Replicates Spider v2.3 SpiderWebEngine pattern, adapted for Kraken.
 *
 * SpiderWeb equivalence:
 *   constructWeb -> anchorTentacle
 *   generateStrands -> generateAgentSlots
 *   disperse -> disperseTentacle
 *   tighten -> tightenTentacle
 *   dissolve -> dissolveTentacle
 *   Strand -> AgentSlot, Web -> Tentacle
 */

import { randomUUID } from 'crypto';
import { createLogger } from '../shared/logger.js';
import { ClusterAgentType, ACTIVE_AGENT_TYPES, TENTACLE_CAPS, type ClusterTentacle, type AgentSlot, type TentacleAnchorState, type TentacleResult, type TentacleStatus, type TentacleMode } from './cluster-types.js';

const logger = createLogger('ClusterEngine');

const BUILD_KW = /build|implement|create|scaffold|generate|write/i;
const DEBUG_KW = /debug|fix|repair|patch|resolve|correct/i;
const TEST_KW = /test|verify|validate|audit|check/i;

/** P2: Type guard for TentacleMode */
function isValidTentacleMode(value: string): value is TentacleMode {
  return value === 'build' || value === 'debug' || value === 'analyze';
}

export class ClusterEngine {
  private tentacles: Map<string, ClusterTentacle> = new Map();

  anchorTentacle(macroTask: string, acceptanceCriteria: string[], mode: string = 'build', agentType: ClusterAgentType = ClusterAgentType.SHARK, agentCount?: number): ClusterTentacle {
    if (!ACTIVE_AGENT_TYPES.includes(agentType)) {
      throw new Error(`[ClusterEngine] Agent type '${agentType}' not active. Active: ${ACTIVE_AGENT_TYPES.join(', ')}`);
    }
    const count = agentCount ?? this.calcAgentCount(macroTask);
    const clamped = Math.max(TENTACLE_CAPS.minAgents, Math.min(TENTACLE_CAPS.maxAgents, count));
    const id = 'tentacle-' + randomUUID().slice(0, 8);

    // P2: Safe mode assignment via type guard — no unchecked cast
    const validatedMode: TentacleMode = isValidTentacleMode(mode) ? mode : 'build';

    const t: ClusterTentacle = {
      tentacleId: id, macroTask, acceptanceCriteria, mode: validatedMode,
      agentType, agentSlots: this.genSlots(id, macroTask, agentType, clamped),
      anchorState: { totalSlots: clamped, activeAgents: 0, completedAgents: 0, failedAgents: 0, lastTightening: 0 },
      status: 'anchoring', createdAt: Date.now(),
    };
    this.tentacles.set(id, t);
    logger.info('Anchored: ' + id + ' (' + clamped + ' agents, type=' + agentType + ')');
    return t;
  }

  calcAgentCount(task: string): number {
    const len = task.length;
    if (len > 800) return TENTACLE_CAPS.maxAgents;
    if (len > 400) return 5;
    if (len > 200) return 3;
    return TENTACLE_CAPS.minAgents;
  }

  private genSlots(tentacleId: string, macroTask: string, agentType: ClusterAgentType, count: number): AgentSlot[] {
    const slots: AgentSlot[] = [];
    const microTasks = this.decompose(macroTask, count);
    for (let i = 0; i < count; i++) {
      slots.push({
        slotId: tentacleId + '_agent_' + (i + 1),
        agentType, microTask: microTasks[i] || '[AGENT ' + (i + 1) + '/' + count + '] ' + macroTask,
        assignedFiles: [], status: 'pending', output: '', startedAt: 0,
      });
    }
    return slots;
  }

  private decompose(macroTask: string, count: number): string[] {
    const lower = macroTask.toLowerCase();
    if (BUILD_KW.test(lower)) return this.functionalDecomposition(macroTask, count);
    if (DEBUG_KW.test(lower)) return this.isolationDecomposition(macroTask, count);
    if (TEST_KW.test(lower)) return this.coverageDecomposition(macroTask, count);
    return this.sequentialDecomposition(macroTask, count);
  }

  private functionalDecomposition(macro: string, count: number): string[] {
    const aspects = [
      `[Component 1/${count}] Data layer: ${macro}`,
      `[Component 2/${count}] Business logic: ${macro}`,
      `[Component 3/${count}] Interface: ${macro}`,
      `[Component 4/${count}] Integration: ${macro}`,
    ];
    if (count <= 4) return aspects.slice(0, count);
    const extras: string[] = [];
    for (let i = 5; i <= count; i++) extras.push(`[Component ${i}/${count}] Sub-component ${i - 4}: ${macro}`);
    return [...aspects, ...extras];
  }

  private isolationDecomposition(macro: string, count: number): string[] {
    const steps = [
      `[Step 1/${count}] Isolate root cause: ${macro}`,
      `[Step 2/${count}] Implement fix: ${macro}`,
      `[Step 3/${count}] Verify fix: ${macro}`,
    ];
    if (count <= 3) return steps.slice(0, count);
    const extras: string[] = [];
    for (let i = 4; i <= count; i++) extras.push(`[Step ${i}/${count}] Validation ${i - 3}: ${macro}`);
    return [...steps, ...extras];
  }

  private coverageDecomposition(macro: string, count: number): string[] {
    const coverages = [
      `[Coverage 1/${count}] Unit tests: ${macro}`,
      `[Coverage 2/${count}] Integration tests: ${macro}`,
      `[Coverage 3/${count}] E2E tests: ${macro}`,
    ];
    if (count <= 3) return coverages.slice(0, count);
    const extras: string[] = [];
    for (let i = 4; i <= count; i++) extras.push(`[Coverage ${i}/${count}] Supplementary tests: ${macro}`);
    return [...coverages, ...extras];
  }

  private sequentialDecomposition(macro: string, count: number): string[] {
    const parts: string[] = [];
    for (let i = 0; i < count; i++) parts.push(`[Part ${i + 1}/${count}] ${macro}`);
    return parts;
  }

  activateTentacle(id: string): boolean {
    const t = this.tentacles.get(id);
    if (!t) return false;
    t.status = 'active';
    for (const s of t.agentSlots) { s.status = 'spawning'; s.startedAt = Date.now(); }
    t.anchorState.activeAgents = t.agentSlots.length;
    return true;
  }

  async disperseTentacle(id: string, spawnFn: (microTask: string, agentType: ClusterAgentType) => Promise<{ taskId: string }>): Promise<boolean> {
    const t = this.tentacles.get(id);
    if (!t) return false;
    if (t.status !== 'active') throw new Error('[ClusterEngine] Cannot disperse ' + id + ': status=' + t.status);
    let d = 0;
    for (const s of t.agentSlots) {
      if (s.status === 'spawning' || s.status === 'pending') {
        try {
          const r = await spawnFn(s.microTask, s.agentType);
          s.taskId = r.taskId; s.status = 'running'; d++;
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          s.status = 'failed'; s.output = 'Spawn fail: ' + errMsg;
          t.anchorState.failedAgents++;
          logger.error(`Disperse slot ${s.slotId} failed: ${errMsg}`);
        }
      }
    }
    this.updateStatus(t);
    return d > 0;
  }

  /**
   * tightenTentacle — Check status of all deployed slots via statusFn.
   *
   * Lifecycle: pending → (activate) → spawning → (disperse) → running → (tighten) → completed|failed
   *
   * IMPORTANT: Only slots that are 'running' (i.e. have been dispersed) are checked.
   * Slots in 'spawning' state WITHOUT a taskId are skipped — they haven't been
   * deployed yet (tighten was called before disperse, which is valid).
   * A 'spawning' slot WITH a taskId (edge case) IS checked.
   *
   * P9: All statusFn calls are dispatched in parallel via Promise.all
   *     so slow calls don't block fast ones.
   * P3: Each statusFn call is individually try/caught so a single
   *     failure never blocks other slots. The actual error message
   *     is captured (not a hardcoded string).
   */
  async tightenTentacle(id: string, statusFn: (taskId: string) => Promise<{ status: string; output?: string }>): Promise<boolean> {
    const t = this.tentacles.get(id);
    if (!t) return false;

    const results = await Promise.all(t.agentSlots.map(async (s: AgentSlot) => {
      // Skip slots not yet deployed (spawning without taskId = before disperse)
      if (s.status === 'spawning' && !s.taskId) {
        return { changed: false };
      }
      // Skip already-terminal slots
      if (s.status !== 'running' && s.status !== 'spawning') {
        return { changed: false };
      }

      // Running/spawning slots MUST have a taskId — if missing, it's a bug
      if (!s.taskId) {
        const errMsg = `Slot ${s.slotId} is ${s.status} but has no taskId — lifecycle violation`;
        s.status = 'failed';
        s.completedAt = Date.now();
        t.anchorState.failedAgents++;
        s.output = 'Tighten error: ' + errMsg;
        logger.error(errMsg);
        return { changed: true };
      }

      try {
        const result = await statusFn(s.taskId);
        if (result.status === 'completed') {
          s.status = 'completed';
          s.output = typeof result.output === 'string' ? result.output : s.output;
          s.completedAt = Date.now();
          t.anchorState.completedAgents++;
          return { changed: true };
        } else if (result.status === 'failed') {
          s.status = 'failed';
          if (typeof result.output === 'string') s.output = result.output;
          s.completedAt = Date.now();
          t.anchorState.failedAgents++;
          return { changed: true };
        }
        // Unknown status or 'running' — leave slot as-is
        return { changed: false };
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        s.status = 'failed';
        s.output = 'Tighten error: ' + errMsg;
        s.completedAt = Date.now();
        t.anchorState.failedAgents++;
        logger.error(`Tighten slot ${s.slotId} (task ${s.taskId}) threw: ${errMsg}`);
        return { changed: true };
      }
    }));

    t.anchorState.lastTightening = Date.now();
    this.updateStatus(t);
    return results.some((r: { changed: boolean }) => r.changed);
  }

  dissolveTentacle(id: string): TentacleResult | null {
    const t = this.tentacles.get(id);
    if (!t) return null;
    t.status = 'dissolving';

    // P4: Clean up coordination messages when tentacle dissolves
    if (t.coordinator) {
      t.coordinator.clearInbox();
    }

    const outputs: TentacleResult['outputs'] = [];
    const merged: string[] = [];
    for (const s of t.agentSlots) {
      outputs.push({ slotId: s.slotId, microTask: s.microTask, output: s.output || '(no output)' });
      if (s.output) merged.push('[' + s.slotId + '] ' + s.output);
    }
    const r: TentacleResult = {
      tentacleId: id, macroTask: t.macroTask,
      totalSlots: t.agentSlots.length, completedSlots: t.anchorState.completedAgents, failedSlots: t.anchorState.failedAgents,
      outputs, mergedOutput: merged.join('\n\n---\n\n'), dissolvedAt: Date.now(),
    };
    t.status = 'completed'; t.completedAt = Date.now();
    return r;
  }

  private updateStatus(t: ClusterTentacle): void {
    const allDone = t.agentSlots.every((s: AgentSlot) => s.status === 'completed' || s.status === 'failed');
    if (allDone) {
      t.status = 'tightening';
      logger.info(`Tentacle ${t.tentacleId} all slots done: ${t.anchorState.completedAgents} completed, ${t.anchorState.failedAgents} failed`);
    }
  }

  /**
   * Get tentacle by ID — returns the LIVE object by reference.
   * Callers who mutate the returned object directly modify engine state.
   * This is intentional for performance — use getTentacleCopy() for a snapshot.
   */
  getTentacle(id: string): ClusterTentacle | undefined { return this.tentacles.get(id); }

  /**
   * Get a deep copy of a tentacle (safe for reading without mutating engine state).
   */
  getTentacleCopy(id: string): ClusterTentacle | undefined {
    const t = this.tentacles.get(id);
    if (!t) return undefined;
    return JSON.parse(JSON.stringify(t));
  }

  getAllTentacles(): ClusterTentacle[] { return Array.from(this.tentacles.values()); }
  removeTentacle(id: string): boolean { return this.tentacles.delete(id); }
  clearCompleted(): number {
    let c = 0;
    for (const [id, t] of this.tentacles) { if (t.status === 'completed') { this.tentacles.delete(id); c++; } }
    return c;
  }

  getActiveTentacleCount(): number {
    let count = 0;
    for (const tentacle of this.tentacles.values()) {
      if (tentacle.status === 'active' || tentacle.status === 'tightening') {
        count++;
      }
    }
    return count;
  }
}
