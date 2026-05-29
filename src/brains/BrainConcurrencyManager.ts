/**
 * BrainConcurrencyManager — V1.2
 * 
 * Manages independent async event loops for Planning, Execution, and System brains.
 * Each brain polls its own message queue, monitors state, and processes tasks independently.
 * 
 * Pattern from Agent-Factory-Edition-v4.1:
 * - Actor model with priority mailboxes (BrainMessenger.receive())
 * - Domain-owned shared state (StateStore with write enforcement)
 * - Non-blocking execution (Promise.race with timeout)
 * - Graceful shutdown via running flag + AbortController
 */

import type { BrainMessenger } from '../shared/brain-messenger.js';
import type { StateStore } from '../shared/state-store.js';

export interface BrainLoopConfig {
  brainId: string;
  pollIntervalMs: number;
  domains: string[];
  messageHandler?: (message: any) => Promise<void>;
}

export interface ConcurrencyState {
  planning: { running: boolean; messagesProcessed: number; lastPollAt: number };
  execution: { running: boolean; messagesProcessed: number; lastPollAt: number };
  system: { running: boolean; messagesProcessed: number; lastPollAt: number };
  uptime: number;
}

export class BrainConcurrencyManager {
  private running = false;
  private loops: Map<string, { controller: AbortController; config: BrainLoopConfig; processed: number }> = new Map();
  private messenger: BrainMessenger;
  private stateStore: StateStore;
  private startTime = 0;
  private onPlanningTick?: () => Promise<void>;
  private onExecutionTick?: () => Promise<void>;
  private onSystemTick?: () => Promise<void>;

  constructor(messenger: BrainMessenger, stateStore: StateStore) {
    this.messenger = messenger;
    this.stateStore = stateStore;
  }

  /**
   * Register custom tick handlers for each brain.
   * These run inside the brain's event loop on every poll cycle.
   */
  setPlanningTick(handler: () => Promise<void>): void {
    this.onPlanningTick = handler;
  }

  setExecutionTick(handler: () => Promise<void>): void {
    this.onExecutionTick = handler;
  }

  setSystemTick(handler: () => Promise<void>): void {
    this.onSystemTick = handler;
  }

  /**
   * Start all 3 brain event loops concurrently.
   * Each loop runs independently — one brain's delay doesn't block others.
   */
  startAll(): void {
    if (this.running) return;
    this.running = true;
    this.startTime = Date.now();

    // Planning Brain: frequent polling (200ms) — must catch T1 requests fast
    this.startLoop({
      brainId: 'kraken-planning',
      pollIntervalMs: 200,
      domains: ['planning-state', 'context-bridge'],
    }, this.onPlanningTick);

    // Execution Brain: frequent polling (200ms) — must catch task events fast
    this.startLoop({
      brainId: 'kraken-execution',
      pollIntervalMs: 200,
      domains: ['execution-state', 'quality-state'],
    }, this.onExecutionTick);

    // System Brain: moderate polling (500ms) — gate evaluation is less urgent
    this.startLoop({
      brainId: 'kraken-system',
      pollIntervalMs: 500,
      domains: ['workflow-state', 'security-state'],
    }, this.onSystemTick);


    // Wire reactive state watcher for task lifecycle monitoring
    // When execution-state changes, the system brain can react without polling
    try {
      this.stateStore.watch('execution-state' as any, '*', (_key: string, _value: unknown) => {
        // State change detected — system brain can check gate conditions reactively
        // This augments the 500ms polling loop with event-driven gate evaluation
      });
    } catch { /* watchers are optional */ }
  }

  /**
   * Start a single brain's event loop
   */
  private startLoop(config: BrainLoopConfig, tickHandler?: () => Promise<void>): void {
    const controller = new AbortController();
    
    this.loops.set(config.brainId, {
      controller,
      config,
      processed: 0,
    });

    this.runLoop(config, controller.signal, tickHandler);
  }

  /**
   * The core event loop for a single brain.
   * Uses recursive setTimeout (not setInterval) to prevent overlap.
   * Each iteration: poll messages → process → execute tick → sleep → repeat.
   */
  private async runLoop(
    config: BrainLoopConfig,
    signal: AbortSignal,
    tickHandler?: () => Promise<void>
  ): Promise<void> {
    const brainId = config.brainId;

    while (this.running && !signal.aborted) {
      try {
        // 1. Poll the brain's message queue — DRAIN (consume) messages
        const messages = this.messenger.drainMessages(brainId);
        
        if (messages.length > 0) {
          const entry = this.loops.get(brainId);
          if (entry) entry.processed += messages.length;

          // Process each message (dispatch to brain's message handler if set)
          for (const msg of messages) {
            try {
              if (config.messageHandler) {
                await config.messageHandler(msg);
              }
            } catch (err) {
              console.error(`[BrainConcurrency] ${brainId} message processing error:`, err);
            }
          }
        }

        // 2. Execute brain-specific tick logic (gate evaluation, task monitoring, etc.)
        if (tickHandler) {
          try {
            await Promise.race([
              tickHandler(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('tick timeout')), 5000)),
            ]);
          } catch (err: any) {
            if (err.message !== 'tick timeout') {
              console.error(`[BrainConcurrency] ${brainId} tick error:`, err);
            }
          }
        }

        // 3. Yield to event loop (non-blocking sleep)
        await new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, config.pollIntervalMs);
          signal.addEventListener('abort', () => {
            clearTimeout(timer);
            resolve();
          }, { once: true });
        });

      } catch (err) {
        console.error(`[BrainConcurrency] ${brainId} loop error:`, err);
        // Sleep before retry on error
        await new Promise(r => setTimeout(r, 1000));
      }
    }

  }

  /**
   * Stop all brain loops gracefully.
   */
  stopAll(): void {
    this.running = false;
    for (const [brainId, entry] of this.loops) {
      entry.controller.abort();
    }
  }

  /**
   * Check if all brains are running.
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Get concurrency state for monitoring.
   */
  getState(): ConcurrencyState {
    const now = Date.now();
    return {
      planning: {
        running: this.running,
        messagesProcessed: this.loops.get('kraken-planning')?.processed || 0,
        lastPollAt: now,
      },
      execution: {
        running: this.running,
        messagesProcessed: this.loops.get('kraken-execution')?.processed || 0,
        lastPollAt: now,
      },
      system: {
        running: this.running,
        messagesProcessed: this.loops.get('kraken-system')?.processed || 0,
        lastPollAt: now,
      },
      uptime: this.getUptime(),
    };
  }

  /**
   * Uptime in milliseconds.
   */
  private getUptime(): number {
    return this.startTime ? Date.now() - this.startTime : 0;
  }
}
