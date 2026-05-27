/**
 * src/brains/execution/execution-brain.ts
 * 
 * V1.2 Execution Brain
 * 
 * Owns: execution-state, quality-state
 * 
 * Key responsibilities:
 * - Task supervision via executeOnAgent
 * - Output verification
 * - Override commands
 * - Quality enforcement
 */

import { getStateStore, type StateStore } from '../../shared/state-store.js';
import { getBrainMessenger, type BrainMessenger } from '../../shared/brain-messenger.js';
import type { DomainId } from '../../shared/domain-ownership.js';
import type { OverrideCommand } from '../../shared/brain-messenger.js';

export interface ExecutionState {
  initialized: boolean;
  activeTasks: number;
  completedTasks: number;
  failedTasks: number;
}

export interface TaskOutput {
  taskId: string;
  path: string;
  type: 'file' | 'directory';
  required: boolean;
  retrieved: boolean;
  retrievedAt?: number;
}

export interface ExecutionResult {
  taskId: string;
  success: boolean;
  clusterId: string;
  agentId: string;
  outputs?: string[];
  error?: string;
  completedAt: number;
}

export class ExecutionBrain {
  private initialized = false;
  private state: ExecutionState = {
    initialized: false,
    activeTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
  };
  private stateStore: StateStore;
  private messenger: BrainMessenger;
  private registeredOutputs: Map<string, TaskOutput[]> = new Map();
  private activeTasks: Map<string, { clusterId: string; status: string; startTime: number }> = new Map();

  constructor(stateStore?: StateStore, messenger?: BrainMessenger) {
    this.stateStore = stateStore || getStateStore();
    this.messenger = messenger || getBrainMessenger();
  }

  initialize(): void {
    if (this.initialized) return;
    
    console.log('[ExecutionBrain] Initializing...');
    this.initialized = true;
    this.state.initialized = true;
    
    this.stateStore.set('execution-state', 'initialized', true, ['kraken-execution']);
    this.stateStore.set('execution-state', 'brain-id', 'kraken-execution', ['kraken-execution']);
    
    // Subscribe to brain messages
    this.messenger.subscribe('kraken-execution', this.handleBrainMessage.bind(this));
    
    console.log('[ExecutionBrain] Initialized - owns execution-state, quality-state');
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  // =========================================================================
  // OUTPUT VERIFICATION (V1.2 KEY FEATURE)
  // =========================================================================

  registerTaskOutputs(taskId: string, outputs: TaskOutput[]): void {
    this.registeredOutputs.set(taskId, outputs);
    console.log(`[ExecutionBrain] Registered ${outputs.length} outputs for task ${taskId}`);
    
    this.stateStore.set('execution-state', `outputs-${taskId}`, outputs, ['kraken-execution']);
  }

  async claimOutputsRetrieved(taskId: string, hostPaths: string[]): Promise<void> {
    const outputs = this.registeredOutputs.get(taskId);
    if (!outputs) {
      console.warn(`[ExecutionBrain] No registered outputs for task ${taskId}`);
      return;
    }

    for (const path of hostPaths) {
      const output = outputs.find(o => o.path === path);
      if (output) {
        output.retrieved = true;
        output.retrievedAt = Date.now();
      }
    }

    console.log(`[ExecutionBrain] Verified ${hostPaths.length} outputs for task ${taskId}`);
    
    this.stateStore.set('execution-state', `retrieved-${taskId}`, hostPaths, ['kraken-execution']);
  }

  canCompleteTask(taskId: string): boolean {
    const outputs = this.registeredOutputs.get(taskId);
    if (!outputs) return true; // No outputs required
    
    // All required outputs must be retrieved
    const required = outputs.filter(o => o.required);
    const retrieved = outputs.filter(o => o.retrieved);
    
    return required.length === retrieved.length;
  }

  getOutputStatus(taskId: string): { required: number; retrieved: number; complete: boolean } {
    const outputs = this.registeredOutputs.get(taskId) || [];
    const required = outputs.filter(o => o.required);
    const retrieved = outputs.filter(o => o.retrieved);
    
    return {
      required: required.length,
      retrieved: retrieved.length,
      complete: required.length === retrieved.length,
    };
  }

  // =========================================================================
  // TASK EXECUTION
  // =========================================================================

  async executeTask(taskId: string, clusterId: string, request: {
    task: string;
    model?: string;
    timeout?: number;
    outputs?: TaskOutput[];
  }): Promise<ExecutionResult> {
    console.log(`[ExecutionBrain] Executing task ${taskId} on cluster ${clusterId}`);
    
    // Register outputs if provided
    if (request.outputs && request.outputs.length > 0) {
      this.registerTaskOutputs(taskId, request.outputs);
    }
    
    // Track active task
    this.activeTasks.set(taskId, {
      clusterId,
      status: 'executing',
      startTime: Date.now(),
    });
    this.state.activeTasks++;
    this.updateState();
    
    // Send execution message
    this.messenger.deliverMessage('kraken-execution', 'kraken-system', 'context-inject', {
      type: 'task-started',
      taskId,
      clusterId,
    }, 'normal');
    
    return {
      taskId,
      success: false, // Task NOT complete — result comes from delegation engine
      clusterId,
      agentId: 'pending',
      completedAt: 0, // Not completed yet
    };
  }

  completeTask(result: ExecutionResult): void {
    const taskInfo = this.activeTasks.get(result.taskId);
    if (taskInfo) {
      this.activeTasks.delete(result.taskId);
      this.state.activeTasks = Math.max(0, this.state.activeTasks - 1);
    }
    
    if (result.success) {
      this.state.completedTasks++;
      
      // L2: Fire-and-forget detection — completion MUST have output retrieval
      const outputs = this.registeredOutputs.get(result.taskId);
      const allVerified = outputs ? outputs.every(o => o.retrieved) : false;
      
      if (outputs && outputs.length > 0 && !allVerified) {
        console.warn(`[ExecutionBrain] L2_WARNING: Task ${result.taskId} claims completion but ${outputs.filter(o => !o.retrieved).length}/${outputs.length} outputs not retrieved`);
        console.warn(`[ExecutionBrain] FIRE-AND-FORGET DETECTED — triggering output retrieval enforcement`);
        // Auto-enforce output retrieval
        this.enforceOutputRetrieval(result.taskId);
      }
    } else {
      this.state.failedTasks++;
    }
    
    this.updateState();
    this.stateStore.set('execution-state', 'active-tasks', this.state.activeTasks, ['kraken-execution']);
    this.stateStore.set('execution-state', 'completed-tasks', this.state.completedTasks, ['kraken-execution']);
    this.stateStore.set('execution-state', `task-${result.taskId}-result`, result, ['kraken-execution']);
    
    console.log(`[ExecutionBrain] Task ${result.taskId} completed: ${result.success ? 'SUCCESS' : 'FAILED'} (active: ${this.state.activeTasks}, completed: ${this.state.completedTasks})`);
    
    // Check if task can complete (outputs verified)
    if (result.success && this.canCompleteTask(result.taskId)) {
      this.messenger.deliverMessage('kraken-execution', 'kraken-system', 'checkpoint', {
        type: 'task-complete-verified',
        taskId: result.taskId,
        outputs: result.outputs,
      }, 'high');
    }
  }

  // =========================================================================
  // SUPERVISION
  // =========================================================================

  async superviseTask(taskId: string): Promise<void> {
    const taskInfo = this.activeTasks.get(taskId);
    if (!taskInfo) {
      console.warn(`[ExecutionBrain] No active task ${taskId} to supervise`);
      return;
    }
    
    const outputStatus = this.getOutputStatus(taskId);
    
    if (!outputStatus.complete) {
      console.log(`[ExecutionBrain] Task ${taskId} outputs incomplete: ${outputStatus.retrieved}/${outputStatus.required}`);
      
      // Send gate failure message
      this.messenger.deliverMessage('kraken-execution', 'kraken-system', 'gate-failure', {
        taskId,
        reason: 'outputs-not-retrieved',
        required: outputStatus.required,
        retrieved: outputStatus.retrieved,
      }, 'critical');
    }
  }

  // =========================================================================
  // OVERRIDE COMMANDS (V1.2 KEY FEATURE)
  // =========================================================================

  createOverrideCommand(params: {
    action: OverrideCommand['action'];
    target: { taskId?: string; brainId?: string; clusterId?: string };
    payload?: Record<string, unknown>;
    priority?: 'critical' | 'high';
  }): OverrideCommand {
    const commandId = `ovr-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    
    return {
      id: commandId,
      from: 'kraken-execution',
      to: params.target.brainId || params.target.clusterId || 'kraken-subagent',
      action: params.action,
      target: params.target,
      payload: params.payload || {},
      priority: params.priority || 'high',
      requiresAck: true,
      createdAt: Date.now(),
    };
  }

  async abortTask(taskId: string, reason: string): Promise<void> {
    const command = this.createOverrideCommand({
      action: 'ABORT',
      target: { taskId },
      payload: { reason },
      priority: 'critical',
    });
    
    const result = this.messenger.sendOverride(command);
    console.log(`[ExecutionBrain] Abort command sent for task ${taskId}: ${command.id}`);
  }

  async enforceOutputRetrieval(taskId: string): Promise<void> {
    const command = this.createOverrideCommand({
      action: 'RETRIEVE_OUTPUTS',
      target: { taskId },
      payload: {},
      priority: 'high',
    });
    
    this.messenger.sendOverride(command);
  }

  // =========================================================================
  // QUALITY ENFORCEMENT
  // =========================================================================

  async checkQuality(taskId: string): Promise<{ passed: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    // Check output retrieval
    const outputStatus = this.getOutputStatus(taskId);
    if (!outputStatus.complete) {
      issues.push(`Output incomplete: ${outputStatus.retrieved}/${outputStatus.required}`);
    }
    
    // Check task duration
    const taskInfo = this.activeTasks.get(taskId);
    if (taskInfo) {
      const duration = Date.now() - taskInfo.startTime;
      const timeout = 120000; // 2 minutes default
      if (duration > timeout) {
        issues.push(`Task duration ${duration}ms exceeds timeout ${timeout}ms`);
      }
    }
    
    const passed = issues.length === 0;
    
    this.stateStore.set('quality-state', `check-${taskId}`, { passed, issues }, ['kraken-execution']);
    
    return { passed, issues };
  }

  // =========================================================================
  // RESULT TRACKING
  // =========================================================================

  recordResult(result: ExecutionResult): void {
    // Delegate to completeTask which handles the full lifecycle
    this.completeTask(result);
  }

  private handleBrainMessage(message: { from: string; to: string; type: string; payload: Record<string, unknown> }): void {
    if (message.type === 'gate-failure' && message.from === 'kraken-system') {
      console.log(`[ExecutionBrain] Received gate failure: ${JSON.stringify(message.payload)}`);
    }
  }

  getState(): ExecutionState {
    return { ...this.state };
  }

  getActiveTasks(): Map<string, { clusterId: string; status: string; startTime: number }> {
    return new Map(this.activeTasks);
  }

  getSnapshot(): Record<string, unknown> {
    return {
      ...this.stateStore.snapshot('execution-state'),
      ...this.stateStore.snapshot('quality-state'),
    };
  }

  cleanup(): void {
    this.registeredOutputs.clear();
    this.activeTasks.clear();
    this.state = {
      initialized: true,
      activeTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
    };
  }
}

// Singleton instance
let executionBrainInstance: ExecutionBrain | null = null;

export function createExecutionBrain(stateStore?: StateStore, messenger?: BrainMessenger): ExecutionBrain {
  if (!executionBrainInstance) {
    executionBrainInstance = new ExecutionBrain(stateStore, messenger);
  }
  return executionBrainInstance;
}

export function getExecutionBrain(): ExecutionBrain {
  if (!executionBrainInstance) {
    executionBrainInstance = new ExecutionBrain();
  }
  return executionBrainInstance;
}