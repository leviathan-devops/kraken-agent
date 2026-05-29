/**
 * src/system-brain/firewall/index.ts
 *
 * Public exports for the Kraken System Brain Firewall — MILITARY GRADE.
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

// Context bridge (firewall → hive injection)
export {
  bridgeFirewallToHive,
  extractCategoriesFromReason,
  type BlockContext,
  type ContextInjection,
} from './firewall-context-bridge.ts';

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
  L8_ANTI_BULLSHIT,
  L9_FEATURE_OMISSION,
  L10_CONTAINER_ENFORCEMENT,
} from './layers/index.ts';

// Smart Error Detector
export {
  recordFailure,
  classifyFailure,
  resetFailures,
  getFailureStats,
  type FailureRecord,
  type ContextInjection,
} from './smart-error-detector.ts';

// Anti-Retard (exported from l6-anti-retard directly to avoid duplicates with layers/index)
export {
  L6_ANTI_RETARD,
  checkAntiRetardPattern,
  recordActionResult,
  clearHistory,
  multiSignalFusion,
  getStrikes,
} from './l6-anti-retard.ts';

// Kraken Protection
export {
  L6_KRAKEN_PROTECTION,
  KRAKEN_ZONES,
  checkKrakenProtection,
  checkProtectionPatterns,
} from './l6-kraken-protection.ts';

// Coordination Gates
export {
  L7_COORDINATION_GATES,
  COORDINATION_GATES,
  evaluateCoordinationGate,
} from './l7-coordination-gates.ts';
