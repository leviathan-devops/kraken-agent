/**
 * Brain Concurrency Manager — Triple-Brain Parallel Loop Startup
 *
 * Manages the three brain polling loops (similar to Kraken's 200ms/200ms/500ms).
 * All three brains run concurrently, synchronized only at gates.
 */

import type { ExecutionBrain } from './execution-brain.js';
import type { ReasoningBrain } from './reasoning-brain.js';
import type { SystemBrain } from './system-brain.js';
import type { BrainMessenger } from './brain-messenger.js';

export interface BrainConcurrencyConfig {
  executionBrain: ExecutionBrain;
  reasoningBrain: ReasoningBrain;
  systemBrain: SystemBrain;
  messenger: BrainMessenger;
  executionPollMs?: number;
  reasoningPollMs?: number;
  systemPollMs?: number;
}

export interface BrainConcurrencyManager {
  startAll(): void;
  stopAll(): void;
  getStatus(): {
    executionRunning: boolean;
    reasoningRunning: boolean;
    systemRunning: boolean;
    messagesProcessed: number;
  };
}

let executionInterval: NodeJS.Timeout | null = null;
let reasoningInterval: NodeJS.Timeout | null = null;
let systemInterval: NodeJS.Timeout | null = null;
let messagesProcessed = 0;

export function createBrainConcurrencyManager(config: BrainConcurrencyConfig): BrainConcurrencyManager {
  const {
    executionBrain,
    reasoningBrain,
    systemBrain,
    messenger,
    executionPollMs = 200,
    reasoningPollMs = 200,
    systemPollMs = 500,
  } = config;

  function runExecutionLoop(): void {
    // Check for messages
    const messages = messenger.receive('shark-execution');
    for (const msg of messages) {
      messagesProcessed++;
      // Handle messages based on type
      if (msg.type === 'derailment') {
        // Log derailment but continue execution
      }
      if (msg.type === 'context-inject') {
        // Context already injected via messaging
      }
    }

    // Execution brain work
    const state = executionBrain.getState();
    if (state) {
      // Continue current task
    }
  }

  function runReasoningLoop(): void {
    // Check for messages
    const messages = messenger.receive('shark-reasoning');
    for (const msg of messages) {
      messagesProcessed++;
    }

    // Reasoning brain work - monitor for context gaps
    const executionState = reasoningBrain.readExecutionState();
    const thinkingState = reasoningBrain.getState();

    if (executionState && thinkingState) {
      // Monitor execution for context gaps
      // Inject context as needed
    }
  }

  function runSystemLoop(): void {
    // Check for messages
    const messages = messenger.receive('shark-system');
    for (const msg of messages) {
      messagesProcessed++;
      if (msg.type === 'checkpoint') {
        // Archive checkpoint evidence
      }
      if (msg.type === 'gate-failure') {
        // Evaluate gate failure
      }
    }

    // System brain work - enforce gates, detect derailment
    const systemState = systemBrain.getState();
    if (systemState?.state.activeDerailments.length ?? 0 > 0) {
      // Active derailments - enforce corrections
    }
  }

  return {
    startAll(): void {
      console.log('[BrainConcurrency] Starting triple-brain parallel loops');
      console.log(`[BrainConcurrency] Execution: ${executionPollMs}ms, Reasoning: ${reasoningPollMs}ms, System: ${systemPollMs}ms`);

      executionInterval = setInterval(runExecutionLoop, executionPollMs);
      reasoningInterval = setInterval(runReasoningLoop, reasoningPollMs);
      systemInterval = setInterval(runSystemLoop, systemPollMs);

      console.log('[BrainConcurrency] All 3 brain loops started');
    },

    stopAll(): void {
      if (executionInterval) clearInterval(executionInterval);
      if (reasoningInterval) clearInterval(reasoningInterval);
      if (systemInterval) clearInterval(systemInterval);
      executionInterval = null;
      reasoningInterval = null;
      systemInterval = null;
      console.log('[BrainConcurrency] All brain loops stopped');
    },

    getStatus(): {
      executionRunning: boolean;
      reasoningRunning: boolean;
      systemRunning: boolean;
      messagesProcessed: number;
    } {
      return {
        executionRunning: executionInterval !== null,
        reasoningRunning: reasoningInterval !== null,
        systemRunning: systemInterval !== null,
        messagesProcessed,
      };
    },
  };
}