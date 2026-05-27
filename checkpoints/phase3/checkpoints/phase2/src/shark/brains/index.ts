/**
 * Triple-Brain Index — Export all brain modules
 */

export { createBrainMessenger, createGateFailureMessage, createContextInjectMessage, createCheckpointMessage, createDerailmentMessage } from './brain-messenger.js';
export type { BrainMessenger, BrainMessage, BrainName, MessagePriority, MessageType } from './brain-messenger.js';

export { DOMAIN_OWNERSHIP, canWrite, canRead, getOwnedDomains, getWriters } from './domain-ownership.js';
export type { DomainName, BrainName as DomainBrainName } from './domain-ownership.js';

export { createStateStore, saveAllBrainStates, loadAllBrainStates } from './brain-state-store.js';
export type { BrainState, StateStore } from './brain-state-store.js';

export { createExecutionBrain } from './execution-brain.js';
export type { ExecutionBrain, ExecutionBrainConfig, ExecutionBrainState } from './execution-brain.js';

export { createReasoningBrain } from './reasoning-brain.js';
export type { ReasoningBrain, ReasoningBrainConfig, ReasoningBrainState } from './reasoning-brain.js';

export { createSystemBrain } from './system-brain.js';
export type { SystemBrain, SystemBrainConfig, SystemBrainState, GateCriteria } from './system-brain.js';

export { createBrainConcurrencyManager } from './brain-concurrency.js';
export type { BrainConcurrencyManager, BrainConcurrencyConfig } from './brain-concurrency.js';

import { createBrainMessenger, createStateStore, createExecutionBrain, createReasoningBrain, createSystemBrain, createBrainConcurrencyManager } from './index.js';

export function initializeTripleBrain(basePath: string = process.cwd()) {
  const messenger = createBrainMessenger();
  const stateStore = createStateStore(basePath);

  const executionBrain = createExecutionBrain({ stateStore, messenger, basePath });
  const reasoningBrain = createReasoningBrain({ stateStore, messenger });
  const systemBrain = createSystemBrain({ stateStore, messenger });

  const concurrencyManager = createBrainConcurrencyManager({
    executionBrain,
    reasoningBrain,
    systemBrain,
    messenger,
    executionPollMs: 200,
    reasoningPollMs: 200,
    systemPollMs: 500,
  });

  return {
    messenger,
    stateStore,
    executionBrain,
    reasoningBrain,
    systemBrain,
    concurrencyManager,
  };
}