/**
 * src/shared/state-store.ts
 *
 * Centralized state management for Kraken v1.4
 * All state transitions are atomic (P5).
 */

import type { GateName, GateState } from '../types.js';
import { GATE_ORDER } from '../types.js';
import { createLogger } from './logger.js';

const logger = createLogger('StateStore');

interface KrakenState {
  initialized: boolean;
  currentGate: GateName;
  gates: Record<GateName, { passed: boolean; evidence: string[] }>;
  activeTasks: number;
  completedTasks: number;
  failedTasks: number;
  decisions: number;
  lastUpdated: number;
}

// P2: Explicit gate defaults — no unchecked `as unknown as` double cast
const DEFAULT_GATES: Record<GateName, { passed: boolean; evidence: string[] }> = {
  plan: { passed: false, evidence: [] },
  build: { passed: false, evidence: [] },
  test: { passed: false, evidence: [] },
  verify: { passed: false, evidence: [] },
  audit: { passed: false, evidence: [] },
  delivery: { passed: false, evidence: [] },
};

const DEFAULT_STATE: KrakenState = {
  initialized: false,
  currentGate: 'plan',
  gates: DEFAULT_GATES,
  activeTasks: 0,
  completedTasks: 0,
  failedTasks: 0,
  decisions: 0,
  lastUpdated: Date.now(),
};

class StateStore {
  private state: KrakenState;

  constructor() {
    this.state = { ...DEFAULT_STATE, gates: { ...DEFAULT_STATE.gates } };
  }

  getState(): Readonly<KrakenState> {
    return { ...this.state };
  }

  initialize(): void {
    this.state = { ...DEFAULT_STATE, gates: { ...DEFAULT_STATE.gates } };
    this.state.initialized = true;
    this.state.lastUpdated = Date.now();
    logger.info('State store initialized');
  }

  isInitialized(): boolean {
    return this.state.initialized;
  }

  getCurrentGate(): GateName {
    return this.state.currentGate;
  }

  setGatePassed(gate: GateName, evidence?: string): void {
    const previousState = { ...this.state };
    try {
      if (this.state.gates[gate]) {
        this.state.gates[gate].passed = true;
        if (evidence) {
          this.state.gates[gate].evidence.push(evidence);
        }
      }
      this.state.lastUpdated = Date.now();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to set gate ${gate} as passed: ${errMsg}`);
      this.state = previousState; // Rollback (P5)
    }
  }

  advanceGate(): GateName | null {
    const currentIdx = GATE_ORDER.indexOf(this.state.currentGate);
    if (currentIdx < 0 || currentIdx >= GATE_ORDER.length - 1) {
      logger.warn(`Cannot advance gate from ${this.state.currentGate}`);
      return null;
    }

    // Verify current gate is passed
    if (!this.state.gates[this.state.currentGate].passed) {
      logger.warn(`Cannot advance: current gate ${this.state.currentGate} not passed`);
      return null;
    }

    const previousState = { ...this.state };
    try {
      const nextGate = GATE_ORDER[currentIdx + 1];
      this.state.currentGate = nextGate;
      this.state.lastUpdated = Date.now();
      logger.info(`Gate advanced: ${GATE_ORDER[currentIdx]} → ${nextGate}`);
      return nextGate;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to advance gate: ${errMsg}`);
      this.state = previousState; // Rollback (P5)
      return null;
    }
  }

  incrementTasks(field: 'activeTasks' | 'completedTasks' | 'failedTasks'): void {
    this.state[field]++;
    this.state.lastUpdated = Date.now();
  }

  recordDecision(): void {
    this.state.decisions++;
    this.state.lastUpdated = Date.now();
  }
}

// Singleton instance
let instance: StateStore | null = null;

export function createStateStore(): StateStore {
  instance = new StateStore();
  return instance;
}

export function getStateStore(): StateStore {
  if (!instance) {
    instance = new StateStore();
  }
  return instance;
}
