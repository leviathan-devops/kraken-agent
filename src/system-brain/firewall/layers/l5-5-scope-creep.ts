/**
 * src/system-brain/firewall/layers/l5-5-scope-creep.ts
 *
 * L5-5: Scope Creep Detection
 *
 * BLOCKS expanding beyond the original scope.
 * This is NOT evidence-gated — scope creep must be stopped immediately.
 *
 * This layer catches:
 * - Adding features not requested
 * - "While we're at it"
 * - "Should also"
 * - Expanding scope mid-task
 */

import type { LayerRule } from '../types.js';
import { KrakenOperationType } from '../types.js';

export const L5_5_SCOPE_CREEP: LayerRule = {
  layer: 'L5-5',
  description: 'Scope Creep — blocks expanding beyond original scope',
  applicableTo: [
    KrakenOperationType.READ,
    KrakenOperationType.EXECUTE,
    KrakenOperationType.WRITE,
    KrakenOperationType.BUILD,
  ],
  patterns: [
    // Scope expansion language
    {
      intent: KrakenOperationType.READ,
      pattern: /\b(while\s+(we'er?|re)|at\s+the\s+same\s+time|also\s+add|should\s+also)\b/i,
      field: 'args.description',
      description: 'Scope creep — adding features not in original request',
    },
    // "In addition" expansions
    {
      intent: KrakenOperationType.WRITE,
      pattern: /\b(in\s+addition|additionally|furthermore)\b.*\b(request|ask|need)/i,
      field: 'args.description',
      description: 'Expanding scope mid-task',
    },
    // "Would be nice" features
    {
      intent: KrakenOperationType.EXECUTE,
      pattern: /\b(would\s+be\s+(nice|good|great)|could\s+also\s+do)\b/i,
      field: 'args.description',
      description: 'Adding unsolicited features',
    },
  ],
  correction: 'Stay in scope. Do not add features not explicitly requested.',
  enabled: true,
};
