/**
 * src/system-brain/firewall/layers/l0-identity.ts
 *
 * L0: Identity Wall
 *
 * SPECIAL CASE: This layer is NOT pattern-based.
 * It is handled by the layer engine as a special case.
 *
 * This file exists for:
 * 1. Documentation
 * 2. Audit trail
 * 3. Consistent layer structure
 *
 * The actual identity check is in LayerEngine.evaluate():
 * - If operation is HIVE_READ or HIVE_WRITE
 * - AND agent is NOT in authorizedAgents set
 * - THEN block
 */

import type { LayerRule } from '../../../system-brain/firewall/types.js';
import { KrakenOperationType } from '../../../system-brain/firewall/types.js';

export const L0_IDENTITY: LayerRule = {
  layer: 'L0',
  description: 'Identity Wall — blocks non-Kraken agents from Hive operations. SPECIAL CASE: handled by layer engine, not patterns.',
  applicableTo: [
    KrakenOperationType.HIVE_READ,
    KrakenOperationType.HIVE_WRITE,
  ],
  patterns: [
    // Empty patterns — identity check is done by layer engine
    // This layer exists for audit trail and documentation
  ],
  correction: 'Hive access restricted to Kraken orchestrator.',
  enabled: true,
};

export interface L0CheckResult {
  allowed: boolean;
  reason?: string;
  layer: 'L0';
}

const HIVE_TOOLS = new Set([
  'kraken_hive_search',
  'kraken_hive_remember',
  'kraken_hive_inject_context',
  'read_kraken_context',
  'kraken_hive_get_cluster_context',
]);

const AUTHORIZED_AGENTS = new Set(['kraken', 'kraken-executor']);

export function checkKrakenIdentityWall(
  agentName?: string,
  toolName?: string,
  toolArgs?: Record<string, unknown>
): L0CheckResult {
  if (!agentName) {
    return { allowed: false, reason: '[L0_IDENTITY] No agent name provided', layer: 'L0' };
  }

  if (HIVE_TOOLS.has(toolName || '')) {
    if (!AUTHORIZED_AGENTS.has(agentName)) {
      return {
        allowed: false,
        reason: `[L0_IDENTITY] Hive access restricted to Kraken orchestrator. Agent '${agentName}' not authorized.`,
        layer: 'L0',
      };
    }
  }

  return { allowed: true, layer: 'L0' };
}
