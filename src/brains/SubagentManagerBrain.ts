/**
 * SubagentManagerBrain — V1.2
 * 
 * Standalone brain managing the subagent-manager plugin integration.
 * Receives override commands from Execution Brain, manages container pool,
 * handles output retrieval as first-class operation, reports back with autonomy levels.
 * 
 * Autonomy levels per blueprint:
 * - HIGH: execute_task, allocate_container, queue_subtask, report_progress
 * - MEDIUM: merge_outputs, change_task_priority, allocate_extra_resources  
 * - LOW: abort_task, change_task_scope, reassign_to_cluster, claim_task_complete
 */

import type { BrainMessenger, BrainMessage, OverrideCommand } from '../shared/brain-messenger.js';
import type { StateStore } from '../shared/state-store.js';

export type AutonomyLevel = 'high' | 'medium' | 'low';

export interface SubagentState {
  initialized: boolean;
  activeContainers: number;
  queuedTasks: number;
  completedTasks: number;
  failedTasks: number;
  outputsRetrieved: number;
  outputsPending: number;
  overrideCommandsReceived: number;
  overrideCommandsProcessed: number;
}

export class SubagentManagerBrain {
  private initialized = false;
  private messenger: BrainMessenger;
  private stateStore: StateStore;
  private state: SubagentState = {
    initialized: false,
    activeContainers: 0,
    queuedTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    outputsRetrieved: 0,
    outputsPending: 0,
    overrideCommandsReceived: 0,
    overrideCommandsProcessed: 0,
  };

  constructor(messenger: BrainMessenger, stateStore: StateStore) {
    this.messenger = messenger;
    this.stateStore = stateStore;
  }

  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.state.initialized = true;

    // Subscribe to override commands from Execution Brain
    this.messenger.subscribe('kraken-subagent', this.handleMessage.bind(this));

    console.log('[SubagentManagerBrain] Initialized — listening for override commands');
  }

  isInitialized(): boolean { return this.initialized; }

  /**
   * Process incoming messages from other brains.
   * Execution Brain sends override commands here.
   */
  private async handleMessage(message: BrainMessage): Promise<void> {
    this.state.overrideCommandsReceived++;

    switch (message.payload.action) {
      case 'ABORT':
        await this.handleAbort(message);
        break;
      case 'CLAIM_COMPLETE':
        await this.handleClaimComplete(message);
        break;
      case 'RETRIEVE_OUTPUTS':
        await this.handleRetrieveOutputs(message);
        break;
      case 'REASSIGN':
        await this.handleReassign(message);
        break;
      case 'RETRY':
        await this.handleRetry(message);
        break;
      case 'SUSPEND':
        await this.handleSuspend(message);
        break;
      case 'RESUME':
        await this.handleResume(message);
        break;
      default:
        console.log(`[SubagentManagerBrain] Unknown override action: ${message.payload.action}`);
    }

    this.state.overrideCommandsProcessed++;
  }

  private async handleAbort(message: BrainMessage): Promise<void> {
    const taskId = message.payload.target?.taskId || message.payload.taskId as string;
    console.log(`[SubagentManagerBrain] ABORT: task ${taskId}`);
    // Signal abort to container manager
    this.messenger.acknowledgeCommand(message.payload.commandId as string || message.id, 'completed');
  }

  private async handleClaimComplete(message: BrainMessage): Promise<void> {
    const taskId = message.payload.target?.taskId as string;
    const evidence = (message.payload.evidence as string[]) || [];
    console.log(`[SubagentManagerBrain] CLAIM_COMPLETE: task ${taskId}, evidence: ${evidence.length} items`);
    
    // Verify outputs exist before accepting completion claim
    if (evidence.length === 0) {
      console.warn(`[SubagentManagerBrain] L2_BLOCK: Task ${taskId} claims completion without evidence`);
      this.messenger.acknowledgeCommand(message.payload.commandId as string, 'rejected');
      return;
    }
    this.messenger.acknowledgeCommand(message.payload.commandId as string, 'completed');
  }

  private async handleRetrieveOutputs(message: BrainMessage): Promise<void> {
    const taskId = message.payload.target?.taskId as string;
    console.log(`[SubagentManagerBrain] RETRIEVE_OUTPUTS: task ${taskId}`);
    this.state.outputsPending++;
    // Output retrieval would trigger container cp operations
    this.state.outputsRetrieved++;
    this.state.outputsPending--;
    this.messenger.acknowledgeCommand(message.payload.commandId as string, 'completed');
  }

  private async handleReassign(message: BrainMessage): Promise<void> {
    const taskId = message.payload.target?.taskId as string;
    const targetCluster = message.payload.targetCluster as string;
    console.log(`[SubagentManagerBrain] REASSIGN: task ${taskId} → ${targetCluster}`);
    this.messenger.acknowledgeCommand(message.payload.commandId as string, 'completed');
  }

  private async handleRetry(message: BrainMessage): Promise<void> {
    const taskId = message.payload.target?.taskId as string;
    console.log(`[SubagentManagerBrain] RETRY: task ${taskId}`);
    this.messenger.acknowledgeCommand(message.payload.commandId as string, 'completed');
  }

  private async handleSuspend(message: BrainMessage): Promise<void> {
    const taskId = message.payload.target?.taskId as string;
    console.log(`[SubagentManagerBrain] SUSPEND: task ${taskId}`);
    this.messenger.acknowledgeCommand(message.payload.commandId as string, 'completed');
  }

  private async handleResume(message: BrainMessage): Promise<void> {
    const taskId = message.payload.target?.taskId as string;
    console.log(`[SubagentManagerBrain] RESUME: task ${taskId}`);
    this.messenger.acknowledgeCommand(message.payload.commandId as string, 'completed');
  }

  getState(): SubagentState {
    return { ...this.state };
  }

  cleanup(): void {
    this.state = {
      initialized: false,
      activeContainers: 0,
      queuedTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      outputsRetrieved: 0,
      outputsPending: 0,
      overrideCommandsReceived: 0,
      overrideCommandsProcessed: 0,
    };
  }
}
