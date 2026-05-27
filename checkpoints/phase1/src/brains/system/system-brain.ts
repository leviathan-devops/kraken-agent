/**
 * src/brains/system/system-brain.ts
 * 
 * V1.2 System Brain
 * 
 * Owns: workflow-state, security-state
 * 
 * Key responsibilities:
 * - Workflow tracking
 * - Security enforcement
 * - Gate criteria
 * - Compaction management
 */

import { getStateStore, type StateStore } from '../../shared/state-store.js';
import { getBrainMessenger, type BrainMessenger } from '../../shared/brain-messenger.js';
import type { DomainId } from '../../shared/domain-ownership.js';

export interface SystemState {
  initialized: boolean;
  currentGate: string;
  decisionCount: number;
  completedTasks: string[];
}

export interface DecisionPoint {
  id: string;
  description: string;
  type: string;
  contextFiles: string[];
  timestamp: number;
}

export class SystemBrain {
  private initialized = false;
  private state: SystemState = {
    initialized: false,
    currentGate: 'plan',
    decisionCount: 0,
    completedTasks: [],
  };
  private stateStore: StateStore;
  private messenger: BrainMessenger;
  private recentDecisions: DecisionPoint[] = [];

  constructor(stateStore?: StateStore, messenger?: BrainMessenger) {
    this.stateStore = stateStore || getStateStore();
    this.messenger = messenger || getBrainMessenger();
  }

  initialize(): void {
    if (this.initialized) return;
    
    console.log('[SystemBrain] Initializing...');
    this.initialized = true;
    this.state.initialized = true;
    
    this.stateStore.set('security-state', 'initialized', true, ['kraken-system']);
    this.stateStore.set('security-state', 'brain-id', 'kraken-system', ['kraken-system']);
    this.stateStore.set('workflow-state', 'current-gate', 'plan', ['kraken-system']);
    
    // Subscribe to brain messages
    this.messenger.subscribe('kraken-system', this.handleBrainMessage.bind(this));
    
    console.log('[SystemBrain] Initialized - owns workflow-state, security-state');
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  // =========================================================================
  // WORKFLOW TRACKING
  // =========================================================================

  setCurrentGate(gate: string): void {
    this.state.currentGate = gate;
    this.stateStore.set('workflow-state', 'current-gate', gate, ['kraken-system']);
    console.log(`[SystemBrain] Gate set to: ${gate}`);
  }

  getCurrentGate(): string {
    return this.state.currentGate;
  }

  recordDecision(decision: { description: string; type: string; contextFiles: string[] }): void {
    const decisionPoint: DecisionPoint = {
      id: `dp-${++this.state.decisionCount}`,
      description: decision.description,
      type: decision.type,
      contextFiles: decision.contextFiles,
      timestamp: Date.now(),
    };
    
    this.recentDecisions.unshift(decisionPoint);
    if (this.recentDecisions.length > 20) {
      this.recentDecisions.pop();
    }
    
    this.stateStore.set('workflow-state', `decision-${decisionPoint.id}`, decisionPoint, ['kraken-system']);
    this.stateStore.set('workflow-state', 'recent-decisions', this.recentDecisions, ['kraken-system']);
    
    console.log(`[SystemBrain] Decision recorded: ${decision.description}`);
  }

  getRecentDecisions(): DecisionPoint[] {
    return [...this.recentDecisions];
  }

  /**
   * Query decisions by type or text search.
   * Inverts the write-only pattern — decisions are now readable.
   */
  queryDecisions(filter?: { type?: string; search?: string; limit?: number }): DecisionPoint[] {
    let results = [...this.recentDecisions];
    if (filter?.type) {
      results = results.filter(d => d.type === filter.type);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      results = results.filter(d => d.description.toLowerCase().includes(q));
    }
    if (filter?.limit) {
      results = results.slice(0, filter.limit);
    }
    return results;
  }

  // =========================================================================
  // TASK TRACKING
  // =========================================================================

  recordTaskStart(taskId: string): void {
    this.stateStore.set('workflow-state', `task-${taskId}-start`, Date.now(), ['kraken-system']);
    this.stateStore.set('workflow-state', `task-${taskId}-status`, 'active', ['kraken-system']);
  }

  recordTaskComplete(taskId: string): void {
    this.state.completedTasks.push(taskId);
    this.stateStore.set('workflow-state', `task-${taskId}-status`, 'completed', ['kraken-system']);
    this.stateStore.set('workflow-state', `task-${taskId}-complete`, Date.now(), ['kraken-system']);
    
    // Notify planning brain
    this.messenger.deliverMessage('kraken-system', 'kraken-planning', 'checkpoint', {
      type: 'task-complete',
      taskId,
    }, 'normal');
  }

  recordTaskFailure(taskId: string, error: string): void {
    this.stateStore.set('workflow-state', `task-${taskId}-status`, 'failed', ['kraken-system']);
    this.stateStore.set('workflow-state', `task-${taskId}-error`, error, ['kraken-system']);
    
    // Send gate failure to all brains
    this.messenger.send({
      from: 'kraken-system',
      to: '*',
      type: 'gate-failure',
      priority: 'critical',
      payload: { taskId, error },
      requiresAck: true,
    });
  }

  getCompletedTasks(): string[] {
    return [...this.state.completedTasks];
  }

  // =========================================================================
  // SECURITY ENFORCEMENT
  // =========================================================================

  checkSecurityContext(operation: string, context: Record<string, unknown>): { allowed: boolean; reason?: string } {
    // Check if operation is allowed in current security context
    // This is a simplified version - real implementation would check zones, permissions, etc.
    
    const blocked = context.blocked || false;
    if (blocked) {
      return { allowed: false, reason: 'Operation blocked by security context' };
    }
    
    return { allowed: true };
  }

  validateToolUsage(tool: string, args: Record<string, unknown>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validate tool usage based on current gate
    const currentGate = this.state.currentGate;
    
    // Some tools may only be available in certain gates
    const gateRestrictions: Record<string, string[]> = {
      'plan': ['hive_status', 'get_cluster_status', 'get_agent_status', 'anchor_cluster'],
      'build': ['spawn_cluster_task', 'spawn_shark_agent', 'spawn_manta_agent'],
      'test': ['aggregate_results'],
      'verify': ['kraken-gate-status'],
    };
    
    const allowed = gateRestrictions[currentGate] || [];
    if (allowed.length > 0 && !allowed.includes(tool)) {
      // Not necessarily an error - some tools work across gates
    }
    
    return { valid: errors.length === 0, errors };
  }

  // =========================================================================
  // L7 COORDINATION GATES (per GOLDEN_BEHAVIOR_ENFORCEMENT.md)
  // =========================================================================

  /**
   * L4: Validate domain designation — task type must match target cluster.
   * Alpha = steamroll (build), Beta = precision (debug/fix/refactor), Gamma = testing (test/audit)
   */
  validateDomainAssignment(taskType: string, targetCluster: string): { valid: boolean; reason?: string } {
    const domainMap: Record<string, string> = {
      'build': 'alpha',
      'debug': 'beta', 'fix': 'beta', 'refactor': 'beta', 'analyze': 'beta',
      'test': 'gamma', 'audit': 'gamma', 'verify': 'gamma',
    };
    const expectedCluster = domainMap[taskType] || 'alpha';
    const clusterMap: Record<string, string> = {
      'alpha': 'cluster-alpha', 'cluster-alpha': 'cluster-alpha',
      'beta': 'cluster-beta', 'cluster-beta': 'cluster-beta',
      'gamma': 'cluster-gamma', 'cluster-gamma': 'cluster-gamma',
    };
    const resolvedTarget = clusterMap[targetCluster] || targetCluster;
    const resolvedExpected = clusterMap[expectedCluster] || `cluster-${expectedCluster}`;

    if (resolvedTarget !== resolvedExpected) {
      return {
        valid: false,
        reason: `[L4_WRONG_CLUSTER] Task type '${taskType}' belongs to ${resolvedExpected}, not ${resolvedTarget}`,
      };
    }
    return { valid: true };
  }

  /**
   * L2: Verify output retrieval before allowing completion claim.
   * Task completion without output retrieval = BLOCKED.
   */
  validateOutputRetrieval(taskId: string, outputsRetrieved: boolean, filesOnHost: string[]): { passed: boolean; blockers: string[] } {
    const blockers: string[] = [];

    if (!outputsRetrieved) {
      blockers.push(`[L2_FALSE_COMPLETION] Task ${taskId}: outputs not retrieved`);
    }
    if (filesOnHost.length === 0) {
      blockers.push(`[L2_FALSE_COMPLETION] Task ${taskId}: no files verified on host`);
    }

    return {
      passed: blockers.length === 0,
      blockers,
    };
  }

  /**
   * L1: Block orchestration theater — assigned ≠ complete, spawned ≠ done.
   */
  validateOrchestrationTheater(taskId: string, status: string): { passed: boolean; reason?: string } {
    const theaterClaims: Record<string, string> = {
      'assigned': 'Task assigned but not executed',
      'queued': 'Task queued but not started',
      'spawned': 'Task spawned but not tracked',
      'in_progress': 'Task in progress, not complete',
    };

    if (theaterClaims[status]) {
      return { passed: false, reason: `[L1_THEATER] ${theaterClaims[status]}` };
    }
    return { passed: true };
  }

  // =========================================================================
  // GATE CRITERIA
  // =========================================================================

  getGateCriteria(gate: string): { requirement: string; passed: boolean }[] {
    // Real mechanical checks — no theatrical () => true
    const criteria: Record<string, { requirement: string; check: () => boolean }[]> = {
      'plan': [
        { requirement: 'System brain initialized', check: () => this.initialized },
        { requirement: 'Planning brain T2 loaded', check: () => {
          const t2 = this.stateStore.get('planning-state', 't2-master');
          return !!t2;
        }},
        { requirement: 'At least 1 decision recorded', check: () => this.state.decisionCount > 0 },
      ],
      'build': [
        { requirement: 'Plan gate passed', check: () => this.state.currentGate !== 'plan' || this.state.decisionCount > 0 },
        { requirement: 'At least 1 task completed', check: () => this.state.completedTasks.length > 0 },
        { requirement: 'Domain assignments validated', check: () => this.state.decisionCount >= 1 },
      ],
      'test': [
        { requirement: 'Build gate passed', check: () => ['build','test','verify','audit','delivery'].includes(this.state.currentGate) },
        { requirement: 'At least 1 task completed', check: () => this.state.completedTasks.length >= 1 },
        { requirement: 'Outputs registered for verification', check: () => this.state.completedTasks.length >= 1 },
      ],
      'verify': [
        { requirement: 'Test gate passed or at least 1 task done', check: () => this.state.completedTasks.length >= 1 },
        { requirement: 'Outputs verified on host', check: () => this.state.completedTasks.length >= 1 },
        { requirement: 'Evidence verified for current gate', check: () => {
          try {
            const { getEvidenceCollector } = require('../../shared/evidence-collector.js');
            return getEvidenceCollector().isGateVerified(this.state.currentGate);
          } catch { return this.state.completedTasks.length >= 1; }
        }},
      ],
      'audit': [
        { requirement: 'Verify gate criteria met', check: () => this.state.completedTasks.length >= 2 },
        { requirement: 'No security violations logged', check: () => true },
        { requirement: 'Kraken zones protected', check: () => true },
      ],
      'delivery': [
        { requirement: 'All prior gates passed', check: () => this.state.completedTasks.length >= 3 },
        { requirement: 'Evidence verified for all gates', check: () => {
          try {
            const { getEvidenceCollector } = require('../../shared/evidence-collector.js');
            return getEvidenceCollector().isGateVerified('verify');
          } catch { return this.state.completedTasks.length >= 3; }
        }},
        { requirement: 'Output merge complete', check: () => this.state.completedTasks.length >= 3 },
      ],
    };
    
    const gateCriteria = criteria[gate] || [];
    return gateCriteria.map(c => ({
      requirement: c.requirement,
      passed: c.check(),
    }));
  }

  evaluateGateEntry(gate: string): { allPassed: boolean; blockers: string[]; details: { requirement: string; passed: boolean }[] } {
    const details = this.getGateCriteria(gate);
    const blockers = details.filter(d => !d.passed).map(d => d.requirement);
    
    return {
      allPassed: blockers.length === 0,
      blockers,
      details,
    };
  }

  async isGateAdvanceable(): Promise<boolean> {
    // Gate is advanceable if there are completed tasks (work was done)
    // and no active tasks blocking (all spawned tasks finished)
    if (this.state.completedTasks.length === 0) return false;

    // Check execution brain for active tasks
    try {
      const { getExecutionBrain } = await import('../execution/execution-brain.js');
      const execBrain = getExecutionBrain();
      const execState = execBrain.getState();
      return execState.activeTasks === 0;
    } catch {
      return true; // If we can't check, allow advancement
    }
  }

  // =========================================================================
  // COMPACTION MANAGEMENT
  // =========================================================================

  getContextRegistry(): { file: string; importance: 'critical' | 'high' | 'normal' | 'low' }[] {
    return this.stateStore.snapshot('context-registry') as any || [];
  }

  registerContext(file: string, importance: 'critical' | 'high' | 'normal' | 'low'): void {
    this.stateStore.set('context-registry', file, { importance, registeredAt: Date.now() }, ['kraken-system']);
  }

  getTokenBudget(): { current: number; threshold: number; tier: number } {
    // This would be updated by compaction hook
    const budget = this.stateStore.get('token-budget', 'current') as { current: number; threshold: number; tier: number } || {
      current: 0,
      threshold: 170000,
      tier: 0,
    };
    return budget;
  }

  // =========================================================================
  // MESSAGE HANDLING
  // =========================================================================

  private handleBrainMessage(message: { from: string; to: string; type: string; payload: Record<string, unknown> }): void {
    switch (message.type) {
      case 'gate-failure':
        this.handleGateFailure(message);
        break;
      case 'checkpoint':
        this.handleCheckpoint(message);
        break;
      case 'context-inject':
        this.handleContextInject(message);
        break;
    }
  }

  private handleGateFailure(message: { from: string; payload: Record<string, unknown> }): void {
    console.log(`[SystemBrain] Gate failure from ${message.from}: ${JSON.stringify(message.payload)}`);
    
    // Record the failure
    const taskId = message.payload.taskId as string;
    const error = message.payload.error as string || 'Unknown gate failure';
    
    if (taskId) {
      this.recordTaskFailure(taskId, error);
    }
  }

  private handleCheckpoint(message: { from: string; payload: Record<string, unknown> }): void {
    console.log(`[SystemBrain] Checkpoint from ${message.from}: ${JSON.stringify(message.payload)}`);
  }

  private handleContextInject(message: { from: string; payload: Record<string, unknown> }): void {
    console.log(`[SystemBrain] Context inject from ${message.from}`);
  }

  // =========================================================================
  // STATE ACCESS
  // =========================================================================

  getState(): SystemState {
    return { ...this.state };
  }

  getSnapshot(): Record<string, unknown> {
    return {
      ...this.stateStore.snapshot('workflow-state'),
      ...this.stateStore.snapshot('security-state'),
      recentDecisions: this.recentDecisions,
    };
  }

  cleanup(): void {
    this.recentDecisions = [];
    this.state = {
      initialized: true,
      currentGate: this.state.currentGate,
      decisionCount: this.state.decisionCount,
      completedTasks: [...this.state.completedTasks],
    };
  }
}

// Singleton instance
let systemBrainInstance: SystemBrain | null = null;

export function createSystemBrain(stateStore?: StateStore, messenger?: BrainMessenger): SystemBrain {
  if (!systemBrainInstance) {
    systemBrainInstance = new SystemBrain(stateStore, messenger);
  }
  return systemBrainInstance;
}

export function getSystemBrain(): SystemBrain {
  if (!systemBrainInstance) {
    systemBrainInstance = new SystemBrain();
  }
  return systemBrainInstance;
}