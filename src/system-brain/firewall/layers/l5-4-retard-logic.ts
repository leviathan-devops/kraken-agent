/**
 * src/system-brain/firewall/layers/l5-4-retard-logic.ts
 *
 * L5-4: Retard Logic Detection
 *
 * BLOCKS basic logic failures that indicate the agent is being stupid.
 *
 * Evidence required: build-delivery.json (passRate >= 0.96)
 *
 * This layer catches:
 * - Contradicting itself
 * - Basic math errors
 * - Obvious nonsense
 *
 * If you can spot the retard logic without running code, you're being retarded.
 */

import type { LayerRule } from '../types.js';
import { KrakenOperationType } from '../types.js';

export const L5_4_RETARD_LOGIC: LayerRule = {
  layer: 'L5-4',
  description: 'Retard Logic — blocks basic logic failures',
  applicableTo: [
    KrakenOperationType.READ,
    KrakenOperationType.EXECUTE,
    KrakenOperationType.WRITE,
  ],
  patterns: [
    // Self-contradiction
    {
      intent: KrakenOperationType.READ,
      pattern: /\b(but|however|yet|although)\s+(not\s+)?(it|the|this|that)\b.*\1/gi,
      field: 'args.description',
      description: 'Self-contradiction detected',
    },
    // Obvious nonsense
    {
      intent: KrakenOperationType.WRITE,
      pattern: /\b(always\s+never|never\s+always)\b/i,
      field: 'args.description',
      description: 'Logical impossibility detected',
    },
    // Basic math errors
    {
      intent: KrakenOperationType.EXECUTE,
      pattern: /\b(0\s*[+\-]\s*0\s*=\s*[1-9]|1\s*0\s*=\s*0)\b/,
      field: 'args.description',
      description: 'Basic math error detected',
    },
  ],
  requireEvidence: 'build-delivery.json',
  correction: 'Think harder. Your logic is retarded. Verify mechanically.',
  enabled: true,
};