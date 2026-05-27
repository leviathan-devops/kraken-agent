/**
 * Execution Brain — Primary Autonomous Execution
 *
 * ROLE: Primary autonomous execution, steamrolls the build
 * PRIORITY: 100 (highest)
 * CAN OVERRIDE: true
 *
 * DOMAIN OWNERSHIP:
 *   - execution-state (writes)
 *   - quality-state (writes)
 *
 * READS:
 *   - plan-state (from Planning or Reasoning)
 *   - thinking-state (from Reasoning Brain — injected context)
 */

import type { BrainState, StateStore } from './brain-state-store.js';
import type { BrainMessenger } from './brain-messenger.js';
import type { DomainName } from './domain-ownership.js';

export interface ExecutionBrainConfig {
  stateStore: StateStore;
  messenger: BrainMessenger;
  basePath: string;
}

export interface ExecutionBrainState extends BrainState {
  brain: 'shark-execution';
  state: {
    currentTask: string;
    progress: string;
    blocks: string[];
    context: {
      planArtifacts: string[];
      buildOutput: string;
      testArtifacts: string[];
    };
  };
}

export function createExecutionBrain(config: ExecutionBrainConfig) {
  const { stateStore, messenger, basePath } = config;

  function getState(): ExecutionBrainState | null {
    const state = stateStore.read('execution-state', 'shark-execution');
    return state as ExecutionBrainState | null;
  }

  function updateState(updates: Partial<ExecutionBrainState['state']>): void {
    const current = getState();
    const next: ExecutionBrainState = {
      brain: 'shark-execution',
      timestamp: new Date().toISOString(),
      gate: current?.gate || 'PLAN',
      iteration: current?.iteration || 'V1.0',
      state: {
        currentTask: updates.currentTask ?? current?.state.currentTask ?? '',
        progress: updates.progress ?? current?.state.progress ?? '0%',
        blocks: updates.blocks ?? current?.state.blocks ?? [],
        context: {
          planArtifacts: updates.context?.planArtifacts ?? current?.state.context?.planArtifacts ?? [],
          buildOutput: updates.context?.buildOutput ?? current?.state.context?.buildOutput ?? '',
          testArtifacts: updates.context?.testArtifacts ?? current?.state.context?.testArtifacts ?? [],
        },
      },
      evidence: current?.evidence,
    };
    stateStore.write('execution-state', 'shark-execution', next);
  }

  function checkPoint(phase: string, completedFiles: number): void {
    updateState({ progress: `${completedFiles} files completed` });
    messenger.send({
      from: 'shark-execution',
      to: 'shark-system',
      type: 'checkpoint',
      priority: 'normal',
      payload: { phase, completedFiles },
      requiresAck: false,
    });
  }

  function readPlanState(): BrainState | null {
    return stateStore.read('plan-state', 'shark-execution');
  }

  function readThinkingState(): BrainState | null {
    return stateStore.read('thinking-state', 'shark-execution');
  }

  function setGate(gate: string): void {
    const current = getState();
    if (current) {
      stateStore.write('execution-state', 'shark-execution', {
        ...current,
        gate,
        timestamp: new Date().toISOString(),
      });
    }
  }

  function setIteration(iteration: string): void {
    const current = getState();
    if (current) {
      stateStore.write('execution-state', 'shark-execution', {
        ...current,
        iteration,
        timestamp: new Date().toISOString(),
      });
    }
  }

  return {
    getState,
    updateState,
    checkPoint,
    readPlanState,
    readThinkingState,
    setGate,
    setIteration,
  };
}

export type ExecutionBrain = ReturnType<typeof createExecutionBrain>;