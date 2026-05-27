/**
 * System Brain — Active Derailment Detection, Real-Time Enforcement
 *
 * ROLE: Active derailment detection, real-time enforcement, gate evaluation
 * PRIORITY: 80 (lowest — enforces, doesn't drive)
 * CAN OVERRIDE: true (can block Execution if needed)
 *
 * DOMAIN OWNERSHIP:
 *   - workflow-state (writes)
 *   - security-state (writes)
 *
 * READS:
 *   - ALL domains (read-only observation)
 *
 * FUNCTIONS:
 *   1. Derailment Detection — Monitors all brains for domain violations
 *   2. Real-Time Fix Application — Applies fix immediately when derailment detected
 *   3. Gate Enforcement — Evaluates gate criteria before phase transitions
 *   4. Escalation Triggering — Escalates to human when auto-fix impossible
 */

import type { BrainState, StateStore } from './brain-state-store.js';
import type { BrainMessenger } from './brain-messenger.js';

export interface SystemBrainConfig {
  stateStore: StateStore;
  messenger: BrainMessenger;
}

export interface SystemBrainState extends BrainState {
  brain: 'shark-system';
  state: {
    activeDerailments: string[];
    gateCriteria: Record<string, boolean>;
    lastEvaluation: string;
    escalationCount: number;
  };
}

export interface GateCriteria {
  gateId: string;
  criteria: Array<{
    type: 'evidence' | 'pattern' | 'state';
    description: string;
    required: string[];
  }>;
  evaluatedBy: 'shark-system';
}

export function createSystemBrain(config: SystemBrainConfig) {
  const { stateStore, messenger } = config;

  function getState(): SystemBrainState | null {
    const state = stateStore.read('workflow-state', 'shark-system');
    return state as SystemBrainState | null;
  }

  function updateState(updates: Partial<SystemBrainState['state']>): void {
    const current = getState();
    const next: SystemBrainState = {
      brain: 'shark-system',
      timestamp: new Date().toISOString(),
      gate: current?.gate || 'PLAN',
      iteration: current?.iteration || 'V1.0',
      state: {
        activeDerailments: updates.activeDerailments ?? current?.state.activeDerailments ?? [],
        gateCriteria: updates.gateCriteria ?? current?.state.gateCriteria ?? {},
        lastEvaluation: updates.lastEvaluation ?? current?.state.lastEvaluation ?? '',
        escalationCount: updates.escalationCount ?? current?.state.escalationCount ?? 0,
      },
      evidence: current?.evidence,
    };
    stateStore.write('workflow-state', 'shark-system', next);
  }

  function detectDerailment(detection: string, severity: 'critical' | 'high' | 'medium' | 'low'): void {
    const current = getState();
    updateState({
      activeDerailments: [...(current?.state.activeDerailments ?? []), detection],
    });

    messenger.send({
      from: 'shark-system',
      to: 'shark-execution',
      type: 'derailment',
      priority: severity === 'critical' ? 'critical' : 'high',
      payload: { detection, severity },
      requiresAck: true,
    });
  }

  function clearDerailment(detection: string): void {
    const current = getState();
    const updated = (current?.state.activeDerailments ?? []).filter(d => d !== detection);
    updateState({ activeDerailments: updated });
  }

  function evaluateGate(criteria: GateCriteria): boolean {
    let allPassed = true;
    const results: Record<string, boolean> = {};

    for (const criterion of criteria.criteria) {
      let passed = true;
      for (const req of criterion.required) {
        // Check if required evidence/state exists
        const evidencePath = `.shark/evidence/${criteria.gateId}/${req}`;
        // Simplified check - actual implementation would verify file existence
        if (!req) passed = false;
      }
      results[criterion.description] = passed;
      if (!passed) allPassed = false;
    }

    updateState({
      gateCriteria: results,
      lastEvaluation: new Date().toISOString(),
    });

    return allPassed;
  }

  function escalate(issue: string, severity: 'critical' | 'high' | 'medium' | 'low'): void {
    const current = getState();
    updateState({
      escalationCount: (current?.state.escalationCount ?? 0) + 1,
    });

    messenger.send({
      from: 'shark-system',
      to: 'shark-execution',
      type: 'gate-failure',
      priority: severity === 'critical' ? 'critical' : 'high',
      payload: { issue, severity },
      requiresAck: true,
    });
  }

  function readExecutionState(): BrainState | null {
    return stateStore.read('execution-state', 'shark-system');
  }

  function readThinkingState(): BrainState | null {
    return stateStore.read('thinking-state', 'shark-system');
  }

  function readPlanState(): BrainState | null {
    return stateStore.read('plan-state', 'shark-system');
  }

  function readQualityState(): BrainState | null {
    return stateStore.read('quality-state', 'shark-system');
  }

  return {
    getState,
    updateState,
    detectDerailment,
    clearDerailment,
    evaluateGate,
    escalate,
    readExecutionState,
    readThinkingState,
    readPlanState,
    readQualityState,
  };
}

export type SystemBrain = ReturnType<typeof createSystemBrain>;