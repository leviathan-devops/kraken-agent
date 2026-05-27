/**
 * src/system-brain/firewall/layers/l2-hive-poison.ts
 *
 * L2: Hive Poison Detection
 *
 * Detects attempts to corrupt Hive memory with fake, fabricated,
 * or poisonous data.
 *
 * Hive memory is the single source of truth for the system brain.
 * Corrupting it breaks the entire orchestrator.
 *
 * Keywords detected:
 * - fake, fabricated, poison, corrupt
 * - lie, false, fabricated
 * - garbage, trash (low-quality data)
 */

import type { LayerRule } from '../types.ts';
import { KrakenOperationType } from '../types.ts';

export const L2_HIVE_POISON: LayerRule = {
  layer: 'L2',
  description: 'Hive Poison — detects Hive memory corruption attempts',
  applicableTo: [KrakenOperationType.HIVE_WRITE],
  patterns: [
    // Corruption keywords
    {
      intent: KrakenOperationType.HIVE_WRITE,
      pattern: /\b(fake|fabricat|poison|corrupt)\b/i,
      field: 'args.content',
      description: 'Content contains corruption keywords — Hive memory must be truthful',
    },
    // Explicit lie keywords
    {
      intent: KrakenOperationType.HIVE_WRITE,
      pattern: /\b(lie|falsehood|misrepresent)\b/i,
      field: 'args.content',
      description: 'Content contains lie keywords — Hive memory must be truthful',
    },
    // Intentional bad data markers
    {
      intent: KrakenOperationType.HIVE_WRITE,
      pattern: /\b(garbage|trash|junk)\b.*\b(write|save|store)\b/i,
      field: 'args.content',
      description: 'Intent to write garbage data to Hive',
    },
  ],
  correction: 'Hive memory must be truthful. Do not write fake, fabricated, or poisonous data.',
  enabled: true,
};
