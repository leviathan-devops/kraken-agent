/**
 * src/system-brain/firewall/layers/l4-context-theft.ts
 *
 * L4: Context Theft Detection
 *
 * Detects attempts to steal context from Hive or other agents.
 * This includes:
 * - Copying session context
 * - Dumping Hive memories
 * - Stealing work products
 */

import type { LayerRule } from '../types.ts';
import { KrakenOperationType } from '../types.ts';

export const L4_CONTEXT_THEFT: LayerRule = {
  layer: 'L4',
  description: 'Context Theft — detects stealing context from Hive',
  applicableTo: [KrakenOperationType.HIVE_READ],
  patterns: [
    // Bulk dumping Hive memories
    {
      intent: KrakenOperationType.HIVE_READ,
      pattern: /\b(dump|export|steal|copy).*hive/i,
      field: 'args.description',
      description: 'Attempt to dump Hive memories',
    },
    // Session hijacking language
    {
      intent: KrakenOperationType.HIVE_READ,
      pattern: /\b(hijack|steal|takeover).*(session|context)/i,
      field: 'args.description',
      description: 'Attempt to hijack session context',
    },
    // Work product theft
    {
      intent: KrakenOperationType.HIVE_READ,
      pattern: /\b(steal|copy|clone).*(work|output|result)/i,
      field: 'args.description',
      description: 'Attempt to steal work products',
    },
  ],
  correction: 'Do not steal context from Hive. Build your own context.',
  enabled: true,
};
