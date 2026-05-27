export { OperationType } from './types.js';
export type {
  FirewallContext,
  LayerRule,
  IntentPattern,
  BlockResult,
  AuditEntry,
  Threshold,
  WiredHook,
} from './types.js';

export { IntentClassifier, isReadOnlyCommand } from './intent-classifier.js';
export type { IntentClassifierInput } from './intent-classifier.js';

export { buildContext } from './firewall-context.js';
export type { FirewallHookInput, FirewallHookOutput, AgentStateInput } from './firewall-context.js';

export { LayerEngine } from './layer-engine.js';
export { EvidenceGate } from './evidence-gate.js';
export { FirewallAudit } from './firewall-audit.js';
export { StructuredBlockError, createBlockResponse } from './block-response.js';
