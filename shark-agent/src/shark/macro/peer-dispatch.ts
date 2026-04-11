/**
 * SharkPeerDispatch — Triple-Brain Coordination Manager
 * 
 * V4.5: Coordinates Execution + Reasoning + System brains.
 * Synchronization at gates. Context injection from Reasoning → Execution.
 * System Brain alerting and enforcement. Plan Brain background monitoring.
 */

import type { StateStore } from '../shared/state-store.js';
import type { BrainMessenger } from '../shared/messenger.js';
import type { GateManager } from '../shared/gates.js';

export type MacroBrain = 'execution' | 'reasoning' | 'system' | 'plan';

export interface MacroBrainState {
  activeBrains: MacroBrain[];
  primaryBrain: MacroBrain;
  phase: 'execution' | 'reasoning' | 'verification' | 'audit' | 'delivery';
  contextInjected: boolean;
  lastSyncAt: number;
}

export interface MacroDispatchConfig {
  stateStore: StateStore;
  messenger: BrainMessenger;
  gateManager: GateManager;
}

export class SharkPeerDispatch {
  private stateStore: StateStore;
  private messenger: BrainMessenger;
  private gateManager: GateManager;

  constructor(config: MacroDispatchConfig) {
    this.stateStore = config.stateStore;
    this.messenger = config.messenger;
    this.gateManager = config.gateManager;
  }

  /**
   * Initialize triple-brain state for a new session
   */
  initialize(): void {
    const state: MacroBrainState = {
      activeBrains: ['execution', 'reasoning', 'system'],
      primaryBrain: 'execution',
      phase: 'execution',
      contextInjected: false,
      lastSyncAt: Date.now(),
    };
    this.stateStore.set('shark-macro-state', state, 'shark-state');
  }

  /**
   * Get current macro state
   */
  getState(): MacroBrainState {
    return this.stateStore.get<MacroBrainState>('shark-macro-state', 'shark-state') || {
      activeBrains: ['execution'],
      primaryBrain: 'execution',
      phase: 'execution',
      contextInjected: false,
      lastSyncAt: 0,
    };
  }

  /**
   * Inject context from Reasoning Brain into Execution Brain
   */
  injectContext(context: unknown): void {
    const state = this.getState();
    this.stateStore.set('shark-macro-state', {
      ...state,
      contextInjected: true,
      lastSyncAt: Date.now(),
    }, 'shark-state');
    this.messenger.send({
      from: 'reasoning-brain',
      to: 'execution-brain',
      type: 'context-inject',
      priority: 'normal',
      payload: context,
      requiresAck: false,
    });
  }

  /**
   * Handle gate transition — synchronize all brains
   */
  onGateTransition(fromGate: string, toGate: string): void {
    
    const state = this.getState();
    
    // Update phase based on gate
    let newPhase: MacroBrainState['phase'] = 'execution';
    if (toGate === 'verify') newPhase = 'verification';
    else if (toGate === 'audit') newPhase = 'audit';
    else if (toGate === 'delivery') newPhase = 'delivery';
    
    this.stateStore.set('shark-macro-state', {
      ...state,
      phase: newPhase,
      contextInjected: false,
      lastSyncAt: Date.now(),
    }, 'shark-state');

    // Notify all brains
    this.messenger.send({
      from: 'system',
      to: 'all',
      type: 'handoff',
      priority: 'high',
      payload: { from: fromGate, to: toGate, phase: newPhase, signal: 'gate-transition' },
      requiresAck: false,
    });
  }

  /**
   * Handle verification failure — trigger Reasoning Brain auto-debug
   */
  onVerifyFailure(): void {
    this.messenger.send({
      from: 'system-brain',
      to: 'reasoning-brain',
      type: 'request',
      priority: 'critical',
      payload: { request: 'auto-debug', error, timestamp: Date.now() },
      requiresAck: false,
    });
  }

  /**
   * Handle 3 VERIFY failures — escalate to Plan Brain
   */
  onEscalation(gateName: string, attempts: number): void {
    this.stateStore.set('shark-macro-state', {
      ...this.getState(),
      phase: 'execution',
      contextInjected: false,
      lastSyncAt: Date.now(),
    }, 'shark-state');
    this.messenger.send({
      from: 'system-brain',
      to: 'plan-brain',
      type: 'alert',
      priority: 'critical',
      payload: { gate: gateName, attempts, signal: 'escalation', timestamp: Date.now() },
      requiresAck: false,
    });
  }
}
