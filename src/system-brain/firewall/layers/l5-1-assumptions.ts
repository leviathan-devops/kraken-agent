/**
 * src/system-brain/firewall/layers/l5-1-assumptions.ts
 *
 * L5-1: Assumption Detection
 *
 * BLOCKS "probably works" style claims unless mechanical evidence exists.
 *
 * Evidence required: build-delivery.json (passRate >= 0.96)
 *
 * This layer catches:
 * - "probably works"
 * - "should be fine"
 * - "might work"
 * - "likely correct"
 *
 * These claims MUST be backed by mechanical proof (test results).
 */

import type { LayerRule } from '../types.ts';
import { KrakenOperationType } from '../types.ts';

export const L5_1_ASSUMPTIONS: LayerRule = {
  layer: 'L5-1',
  description: 'Assumption Detection — blocks "probably works" claims without evidence',
  applicableTo: [
    KrakenOperationType.READ,
    KrakenOperationType.EXECUTE,
    KrakenOperationType.WRITE,
  ],
  patterns: [
    // Uncertainty language
    {
      intent: KrakenOperationType.READ,
      pattern: /\b(probably|might be|should work|might work|likely|could be)\b/i,
      field: 'args.description',
      description: 'Uncertain language — "probably works" requires mechanical proof',
    },
    // "It should work" variants
    {
      intent: KrakenOperationType.EXECUTE,
      pattern: /\bshould(?:'s)?\s*(be fine|work|pass| succeed)/i,
      field: 'args.description',
      description: 'Assumption of success without evidence',
    },
    // Hope-based claims
    {
      intent: KrakenOperationType.WRITE,
      pattern: /\bhope\s*(it|this)\s*(works|helps|passes)/i,
      field: 'args.description',
      description: 'Hope-based claim without evidence',
    },
  ],
  requireEvidence: 'build-delivery.json',
  correction: 'Verify mechanically. Do not assume. Run tests. Show output that proves it works.',
  enabled: true,
};
