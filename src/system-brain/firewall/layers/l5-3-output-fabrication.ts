/**
 * src/system-brain/firewall/layers/l5-3-output-fabrication.ts
 *
 * L5-3: Output Fabrication Detection
 *
 * BLOCKS claims about output that hasn't been verified.
 *
 * Evidence required: build-delivery.json (passRate >= 0.96)
 *
 * This layer catches:
 * - "outputs X"
 * - "produces Y"
 * - "generates Z"
 *
 * Without seeing the actual output, these are fabrications.
 */

import type { LayerRule } from '../types.js';
import { KrakenOperationType } from '../types.js';

export const L5_3_OUTPUT_FABRICATION: LayerRule = {
  layer: 'L5-3',
  description: 'Output Fabrication — blocks claims about output without evidence',
  applicableTo: [
    KrakenOperationType.EXECUTE,
    KrakenOperationType.BUILD,
  ],
  patterns: [
    // Fabricated output claims
    {
      intent: KrakenOperationType.READ,
      pattern: /\b(outputs?|produces?|generates?|creates?)\s+['"]?\w+/i,
      field: 'args.description',
      description: 'Fabricated output claim without evidence',
    },
    // "Shows X" without seeing it
    {
      intent: KrakenOperationType.EXECUTE,
      pattern: /\bshows?\s+(the\s+)?(user|output|result|count|number)/i,
      field: 'args.description',
      description: 'Claim about what is shown without evidence',
    },
    // Dimensional claims without proof
    {
      intent: KrakenOperationType.WRITE,
      pattern: /\b\d+\s*(files?|lines?|functions?|classes?)\b/i,
      field: 'args.description',
      description: 'Dimensional claim without mechanical count',
    },
  ],
  requireEvidence: 'build-delivery.json',
  correction: 'Show the actual output. Run the command. Prove it mechanically.',
  enabled: true,
};