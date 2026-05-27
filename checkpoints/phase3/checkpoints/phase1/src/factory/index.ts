/**
 * src/factory/index.ts
 *
 * V4 Factory Index
 *
 * Re-exports all factory types, classes, and create functions.
 */

// Classes
export { AgentFactory } from './AgentFactory.js';
export { BrainFactory } from './BrainFactory.js';
export { ClusterFactory } from './ClusterFactory.js';
export { ArchitectureFactory, createArchitectureFactory } from './ArchitectureFactory.js';

// Functions
export { createStateStore, DOMAIN_OWNERSHIP } from './StateStore.js';
export { createBrainMessenger } from './BrainMessenger.js';
export {
  validateRequiredFields,
  validateBrainReferences,
  validateAgentReferences,
  validateClusterIntegrity,
  validateToolPermissions,
  validateStateOwnership,
  validateWorkflowGates,
  validateAgent,
  validateCluster,
  validateBrain,
  runValidators,
  architectureValidators,
} from './validators.js';

// Types
export type {
  BrainType,
  BrainConfig,
  SingleBrainConfig,
  DualBrainConfig,
  TrioBrainConfig,
  OrchestratorWorkflow,
  BrainHierarchy,
  BrainInstance,
  AgentDefinition,
  AgentTemplate,
  AgentOverride,
  ClusterConfig,
  ClusterInstance,
  ArchitectureConfig,
  ArchitectureInstance,
  StateDomain,
  WriteResult,
  Unsubscribe,
  StateSnapshot,
  StateStore,
  BrainMessage,
  BrainMessenger,
  ValidationResult,
  Validator,
  AgentMode,
  DelegationRequest,
  DelegationResult,
  GateResult,
  StateMachine,
  TaskStatus,
  Task,
  CreateTaskInput,
} from './types.js';
