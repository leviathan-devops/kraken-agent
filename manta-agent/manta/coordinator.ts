/**
 * MantaCoordinator — Mechanical Plan↔Build Brain Switcher
 * 
 * V4.5: Implements HARD mechanical brain switching between Plan and Build brains.
 * This is NOT agent-driven — the coordinator watches signals and flips the switch.
 * NO agent can override the Coordinator.
 */

import type { StateStore } from '../shared/state-store.js';
import type { BrainMessenger } from '../shared/messenger.js';
import type { GateManager } from '../shared/gates.js';

export type BrainType = 'plan' | 'build';

export interface MantaCoordinatorState {
  currentBrain: BrainType;
  switchReason: string;
  lastSwitchAt: number;
}

export interface CoordinatorConfig {
  stateStore: StateStore;
  messenger: BrainMessenger;
  gateManager: GateManager;
}

export class MantaCoordinator {
  private stateStore: StateStore;
  private messenger: BrainMessenger;
  private gateManager: GateManager;
  
  constructor(config: CoordinatorConfig) {
    this.stateStore = config.stateStore;
    this.messenger = config.messenger;
    this.gateManager = config.gateManager;
  }

  /**
   * Initialize coordinator state for a new session
   */
  initialize(): void {
    const state: MantaCoordinatorState = {
      currentBrain: 'plan',
      switchReason: 'session-start',
      lastSwitchAt: Date.now(),
    };
    this.stateStore.set('manta-micro-state', state, 'manta-state');
    console.error('[MantaCoordinator] Initialized with Plan Brain');
  }

  /**
   * Get current active brain
   */
  getCurrentBrain(): BrainType {
    const microState = this.stateStore.get<MantaCoordinatorState>('manta-micro-state', 'manta-state');
    return microState?.currentBrain || 'plan';
  }

  /**
   * Mechanical switch to Plan Brain
   * Called when: build-complete, gate-failed (3x)
   */
  switchToPlan(reason: string): void {
    const state: MantaCoordinatorState = {
      currentBrain: 'plan',
      switchReason: reason,
      lastSwitchAt: Date.now(),
    };
    this.stateStore.set('manta-micro-state', state, 'manta-state');
    console.error(`[MantaCoordinator] Switched to PLAN Brain: ${reason}`);
  }

  /**
   * Mechanical switch to Build Brain
   * Called when: spec-complete, plan-passed
   */
  switchToBuild(reason: string): void {
    const state: MantaCoordinatorState = {
      currentBrain: 'build',
      switchReason: reason,
      lastSwitchAt: Date.now(),
    };
    this.stateStore.set('manta-micro-state', state, 'manta-state');
    console.error(`[MantaCoordinator] Switched to BUILD Brain: ${reason}`);
  }

  /**
   * Check if switch is allowed (mechanical rules)
   */
  canSwitch(from: BrainType, to: BrainType): boolean {
    if (from === to) return false;
    
    // Plan → Build allowed when: spec-complete signal received
    if (from === 'plan' && to === 'build') {
      return true; // Controlled by signal receipt
    }
    
    // Build → Plan allowed when: build-complete or 3 failures
    if (from === 'build' && to === 'plan') {
      return true; // Always allowed (build done or forced)
    }
    
    return false;
  }

  /**
   * Handle build-complete signal → switch to Plan for review
   */
  onBuildComplete(): void {
    const current = this.getCurrentBrain();
    if (current === 'build' && this.canSwitch(current, 'plan')) {
      this.switchToPlan('build-complete');
      // Signal Plan Brain
      this.messenger.send({
        from: 'coordinator',
        to: 'manta-plan-brain',
        type: 'handoff',
        priority: 'high',
        payload: { signal: 'build-complete', timestamp: Date.now() },
        requiresAck: false,
      });
    }
  }

  /**
   * Handle spec-complete signal → switch to Build for execution
   */
  onSpecComplete(): void {
    const current = this.getCurrentBrain();
    if (current === 'plan' && this.canSwitch(current, 'build')) {
      this.switchToBuild('spec-complete');
      // Signal Build Brain
      this.messenger.send({
        from: 'coordinator',
        to: 'manta-build-brain',
        type: 'handoff',
        priority: 'critical',
        payload: { signal: 'spec-complete', timestamp: Date.now() },
        requiresAck: false,
      });
    }
  }

  /**
   * Handle gate-failed (3x) → force switch to Plan for re-spec
   */
  onGateFailed(gateName: string, attempts: number): void {
    if (attempts >= 3) {
      console.error(`[MantaCoordinator] 3 failures on ${gateName} — forcing escalation`);
      this.switchToPlan('escalation-3-failures');
      // Notify Plan Brain
      this.messenger.send({
        from: 'coordinator',
        to: 'manta-plan-brain',
        type: 'alert',
        priority: 'critical',
        payload: { gate: gateName, attempts, signal: 'escalation', timestamp: Date.now() },
        requiresAck: false,
      });
    }
  }

  /**
   * Get active T1 prompt based on current brain
   */
  getActiveT1(planBrainT1: string, buildBrainT1: string): string {
    const current = this.getCurrentBrain();
    return current === 'plan' ? planBrainT1 : buildBrainT1;
  }
}
