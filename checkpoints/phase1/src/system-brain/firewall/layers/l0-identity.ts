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

import type { LayerRule } from '../types.ts';
import { KrakenOperationType } from '../types.ts';

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
