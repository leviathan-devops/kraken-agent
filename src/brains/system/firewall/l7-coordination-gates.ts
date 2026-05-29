/**
 * L7: Coordination Gates (brains/system re-export)
 * Re-exports from system-brain/firewall/l7-coordination-gates.ts — SINGLE SOURCE OF TRUTH
 */

export {
  L7_COORDINATION_GATES,
  COORDINATION_GATES,
  evaluateCoordinationGate,
  type GateDefinition,
  type L7CheckResult,
  type GateCriterion,
  type GateData,
} from '../../../system-brain/firewall/l7-coordination-gates.js';
