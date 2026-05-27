/**
 * src/system-brain/firewall/layers/l5-2-skip-verification.ts
 *
 * L5-2: Skip Verification Detection
 *
 * BLOCKS claims that tests pass without actually running them.
 *
 * Evidence required: test-delivery.json (passRate >= 0.96)
 *
 * This layer catches:
 * - "tests pass"
 * - "all green"
 * - "no errors"
 * - "works fine"
 *
 * Without mechanical test output, these claims are bullshit.
 */

import type { LayerRule } from '../types.js';
import { KrakenOperationType } from '../types.js';

export const L5_2_SKIP_VERIFICATION: LayerRule = {
  layer: 'L5-2',
  description: 'Skip Verification — blocks claims tests pass without running',
  applicableTo: [
    KrakenOperationType.TEST,
    KrakenOperationType.EXECUTE,
  ],
  patterns: [
    // "Tests pass" without running
    {
      intent: KrakenOperationType.READ,
      pattern: /\btests?\s*(pass|passing|passed|green|successful)\b/i,
      field: 'args.description',
      description: 'Claim tests pass without evidence',
    },
    // "All good" / "No errors" variants
    {
      intent: KrakenOperationType.EXECUTE,
      pattern: /\b(all\s*good|no\s*errors?|looks?\s*fine|works?\s*fine)\b/i,
      field: 'args.description',
      description: 'Claim of success without verification',
    },
    // "Verified" without evidence
    {
      intent: KrakenOperationType.WRITE,
      pattern: /\bverified?|validated?|confirmed?\b/i,
      field: 'args.description',
      description: 'Claim of verification without evidence',
    },
  ],
  requireEvidence: 'test-delivery.json',
  correction: 'Run the tests. Show the output. Prove it mechanically.',
  enabled: true,
};