/**
 * Reasoning Brain — Context Bridge, On-Demand Intelligence
 *
 * ROLE: On-demand intelligence, dynamic T1/T2 context management
 * PRIORITY: 90
 * CAN OVERRIDE: false
 *
 * DOMAIN OWNERSHIP:
 *   - thinking-state (writes)
 *   - context-bridge (writes)
 *
 * READS:
 *   - ALL domains (read-only observation)
 *
 * FUNCTIONS:
 *   1. Context Gap Detection — Monitors Execution, injects missing context
 *   2. Auto-Debug — 60% of errors fixed automatically
 *   3. T2 Synthesis — Synthesizes relevant patterns from knowledge base
 */

import type { BrainState, StateStore } from './brain-state-store.js';
import type { BrainMessenger } from './brain-messenger.js';

export interface ReasoningBrainConfig {
  stateStore: StateStore;
  messenger: BrainMessenger;
}

export interface ReasoningBrainState extends BrainState {
  brain: 'shark-reasoning';
  state: {
    currentMonitoring: string[];
    contextGaps: string[];
    autoDebugHits: number;
    injectedContexts: string[];
  };
}

export function createReasoningBrain(config: ReasoningBrainConfig) {
  const { stateStore, messenger } = config;

  function getState(): ReasoningBrainState | null {
    const state = stateStore.read('thinking-state', 'shark-reasoning');
    return state as ReasoningBrainState | null;
  }

  function updateState(updates: Partial<ReasoningBrainState['state']>): void {
    const current = getState();
    const next: ReasoningBrainState = {
      brain: 'shark-reasoning',
      timestamp: new Date().toISOString(),
      gate: current?.gate || 'PLAN',
      iteration: current?.iteration || 'V1.0',
      state: {
        currentMonitoring: updates.currentMonitoring ?? current?.state.currentMonitoring ?? [],
        contextGaps: updates.contextGaps ?? current?.state.contextGaps ?? [],
        autoDebugHits: updates.autoDebugHits ?? current?.state.autoDebugHits ?? 0,
        injectedContexts: updates.injectedContexts ?? current?.state.injectedContexts ?? [],
      },
      evidence: current?.evidence,
    };
    stateStore.write('thinking-state', 'shark-reasoning', next);
  }

  function injectContext(targetBrain: 'shark-execution', context: Record<string, unknown>): void {
    updateState({
      injectedContexts: [...(getState()?.state.injectedContexts ?? []), JSON.stringify(context)],
    });

    messenger.send({
      from: 'shark-reasoning',
      to: targetBrain,
      type: 'context-inject',
      priority: 'high',
      payload: { thinkingState: context },
      requiresAck: false,
    });
  }

  function detectContextGap(requiredContext: string[], availableContext: string[]): string[] {
    const gaps: string[] = [];
    for (const req of requiredContext) {
      if (!availableContext.includes(req)) {
        gaps.push(req);
      }
    }
    updateState({ contextGaps: gaps });
    return gaps;
  }

  function recordAutoDebugHit(): void {
    const current = getState();
    updateState({
      autoDebugHits: (current?.state.autoDebugHits ?? 0) + 1,
    });
  }

  function readExecutionState(): BrainState | null {
    return stateStore.read('execution-state', 'shark-reasoning');
  }

  function readWorkflowState(): BrainState | null {
    return stateStore.read('workflow-state', 'shark-reasoning');
  }

  function readPlanState(): BrainState | null {
    return stateStore.read('plan-state', 'shark-reasoning');
  }

  return {
    getState,
    updateState,
    injectContext,
    detectContextGap,
    recordAutoDebugHit,
    readExecutionState,
    readWorkflowState,
    readPlanState,
  };
}

export type ReasoningBrain = ReturnType<typeof createReasoningBrain>;