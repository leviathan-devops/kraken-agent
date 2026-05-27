/**
 * src/system-brain/firewall/index.ts
 *
 * Public exports for the Kraken System Brain Firewall.
 */

// Types
export {
  KrakenOperationType,
  type FirewallContext,
  type LayerRule,
  type IntentPattern,
  type PatternField,
  type BlockResult,
  type AuditEntry,
  type GateTargets,
  type SessionState,
  type WiredHook,
} from './types.ts';

// Core components
export { IntentClassifier } from './intent-classifier.ts';
export { buildContext } from './firewall-context.ts';
export type {
  FirewallHookInput,
  FirewallHookOutput,
  AgentStateInput,
} from './firewall-context.ts';

export { LayerEngine } from './layer-engine.ts';
export { EvidenceGate } from './evidence-gate.ts';
export { FirewallAudit } from './firewall-audit.ts';

// Block response
export { StructuredBlockError, createBlockResponse } from './block-response.ts';

// Layers
export { DEFAULT_LAYERS } from './layers/index.ts';
export {
  L0_IDENTITY,
  L1_THEATRICAL,
  L2_HIVE_POISON,
  L3_DELEGATION_ABUSE,
  L4_CONTEXT_THEFT,
  L5_1_ASSUMPTIONS,
  L5_2_SKIP_VERIFICATION,
  L5_3_OUTPUT_FABRICATION,
  L5_4_RETARD_LOGIC,
  L5_5_SCOPE_CREEP,
  L6_ANTI_RETARD,
  L6_KRAKEN_PROTECTION,
  L7_COORDINATION_GATES,
} from './layers/index.ts';
export { L6_ANTI_RETARD, checkAntiRetardPattern, recordActionResult, clearHistory } from './l6-anti-retard.ts';
export { L6_KRAKEN_PROTECTION, KRAKEN_ZONES, checkKrakenProtection, checkProtectionPatterns } from './l6-kraken-protection.ts';
export { L7_COORDINATION_GATES, COORDINATION_GATES, evaluateCoordinationGate } from './l7-coordination-gates.ts';
