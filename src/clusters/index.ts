/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * src/clusters/index.ts
 *
 * Kraken v1.4 Cluster Management — Dynamic ClusterEngine wrapper.
 *
 * v1.4.1: LEGACY TASK API REMOVED — only tentacle API remains.
 *   - Removed: TaskDefinition, createTask, getTask, updateTaskStatus, getClusterForTask
 *   - Added: updateSlotStatus, calculateAgentCount, aggregateTentacleResults
 *   - All spawn tools now anchor tentacles instead of creating individual tasks
 */

import { ClusterEngine } from './cluster-engine.js';
import { ClusterAgentType } from './cluster-types.js';
import type { ClusterTentacle, TentacleResult } from './cluster-types.js';
import { createLogger } from '../shared/logger.js';
import { analyzeRequest, deployPlanningDecision } from '../planning-brain/index.js';

const logger = createLogger('ClusterManager');

export class ClusterManager {
  private engine: ClusterEngine;

  constructor() {
    this.engine = new ClusterEngine();
    logger.info('ClusterManager initialized with dynamic ClusterEngine (v1.4)');
  }

  // ============================================================
  // TENTACLE API
  // ============================================================

  anchorTentacle(macroTask: string, acceptanceCriteria: string[], mode: 'build' | 'debug' | 'analyze' = 'build', agentType: ClusterAgentType = ClusterAgentType.SHARK, agentCount?: number): ClusterTentacle {
    return this.engine.anchorTentacle(macroTask, acceptanceCriteria, mode, agentType, agentCount);
  }

  getTentacle(tentacleId: string): ClusterTentacle | undefined {
    return this.engine.getTentacle(tentacleId);
  }

  getAllTentacles(): ClusterTentacle[] {
    return this.engine.getAllTentacles();
  }

  activateTentacle(tentacleId: string): boolean {
    return this.engine.activateTentacle(tentacleId);
  }

  async disperseTentacle(tentacleId: string, spawnFn: (microTask: string, agentType: ClusterAgentType) => Promise<{ taskId: string }>): Promise<boolean> {
    return this.engine.disperseTentacle(tentacleId, spawnFn);
  }

  async tightenTentacle(tentacleId: string, statusFn: (taskId: string) => Promise<{ status: string; output?: string }>): Promise<boolean> {
    return this.engine.tightenTentacle(tentacleId, statusFn);
  }

  dissolveTentacle(tentacleId: string): TentacleResult | null {
    return this.engine.dissolveTentacle(tentacleId);
  }

  removeTentacle(tentacleId: string): boolean {
    return this.engine.removeTentacle(tentacleId);
  }

  getActiveTentacleCount(): number {
    return this.engine.getActiveTentacleCount();
  }

  // ============================================================
  // NEW v1.4.1 API — tentacle slot management
  // ============================================================

  updateSlotStatus(tentacleId: string, slotId: string, newStatus: string, output?: string): boolean {
    const tentacle = this.engine.getTentacle(tentacleId);
    if (!tentacle) {
      logger.error(`updateSlotStatus: Tentacle ${tentacleId} not found`);
      return false;
    }

    let slot = tentacle.agentSlots.find(s => s.slotId === slotId);
    if (!slot) {
      const idx = parseInt(slotId, 10);
      if (!isNaN(idx) && idx >= 0 && idx < tentacle.agentSlots.length) {
        slot = tentacle.agentSlots[idx];
      }
    }
    if (!slot) {
      logger.error(`updateSlotStatus: Slot ${slotId} not found in tentacle ${tentacleId}`);
      return false;
    }

    slot.status = newStatus as any;
    if (output) slot.output = output;
    if (newStatus === 'completed' || newStatus === 'failed') {
      slot.completedAt = Date.now();
      if (newStatus === 'completed') tentacle.anchorState.completedAgents++;
      if (newStatus === 'failed') tentacle.anchorState.failedAgents++;
    }

    logger.info(`updateSlotStatus: ${tentacleId}/${slotId} -> ${newStatus}`);
    return true;
  }

  calculateAgentCount(macroTask: string): number {
    return this.engine.calcAgentCount(macroTask);
  }

  aggregateTentacleResults(tentacleId: string): TentacleResult | null {
    return this.engine.dissolveTentacle(tentacleId);
  }

  // ============================================================
  // PLANNING BRAIN API
  // ============================================================

  async planAndDeploy(userRequest: string): Promise<string[]> {
    if (!userRequest || userRequest.trim().length === 0) {
      logger.error('planAndDeploy: Empty user request');
      throw new Error('[ClusterManager] planAndDeploy requires a non-empty user request');
    }

    const decision = analyzeRequest(userRequest);
    logger.info(`planAndDeploy: Analysis complete — ${decision.tentacles.length} tentacles, complexity=${decision.totalEstimatedComplexity}`);

    const tentacleIds = deployPlanningDecision(decision, this.engine);

    let activatedCount = 0;
    for (const id of tentacleIds) {
      const activated = this.engine.activateTentacle(id);
      if (activated) {
        activatedCount++;
        logger.info(`planAndDeploy: Activated tentacle ${id}`);
      } else {
        logger.error(`planAndDeploy: Failed to activate tentacle ${id}`);
      }
    }

    logger.info(`planAndDeploy: ${activatedCount}/${tentacleIds.length} tentacles activated`);
    return tentacleIds;
  }

  getEngine(): ClusterEngine {
    return this.engine;
  }

  // ============================================================
  // CLUSTER STATE REPORTING
  // ============================================================

  getAllClusters(): Array<{
    id: string; status: string; agents: string[];
    activeTasks: number; completedTasks: number; failedTasks: number;
    tasks: Array<{ id: string; status: string; description: string }>;
  }> {
    const result: Array<{
      id: string; status: string; agents: string[];
      activeTasks: number; completedTasks: number; failedTasks: number;
      tasks: Array<{ id: string; status: string; description: string }>;
    }> = [];

    for (const tentacle of this.engine.getAllTentacles()) {
      result.push({
        id: tentacle.tentacleId,
        status: tentacle.status,
        agents: tentacle.agentSlots.map(s => `${s.agentType}-${s.slotId}`),
        activeTasks: tentacle.agentSlots.filter(s => s.status === 'running' || s.status === 'spawning').length,
        completedTasks: tentacle.agentSlots.filter(s => s.status === 'completed').length,
        failedTasks: tentacle.agentSlots.filter(s => s.status === 'failed').length,
        tasks: tentacle.agentSlots.map(s => ({ id: s.slotId, status: s.status, description: s.microTask.slice(0, 60) })),
      });
    }

    return result;
  }

  getActiveTaskCount(): number {
    let count = 0;
    for (const tentacle of this.engine.getAllTentacles()) {
      count += tentacle.agentSlots.filter(s => s.status === 'running' || s.status === 'spawning').length;
    }
    return count;
  }
}
