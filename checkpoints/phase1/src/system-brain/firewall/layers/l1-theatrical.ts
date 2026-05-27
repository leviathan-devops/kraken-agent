/**
 * src/system-brain/firewall/layers/l1-theatrical.ts
 *
 * L1: Theatrical Detection
 *
 * Catches pipe-to-wc, pipe-to-tee, and redirect patterns used
 * to FAKE verification by counting instead of actually testing.
 *
 * Examples blocked:
 * - grep -r "TODO" src/ | wc -l  (counting grep results)
 * - find . -name "*.ts" | wc -l   (counting files)
 * - cat file | wc -l               (counting lines)
 * - echo "test" | wc -l             (fabricated counting)
 * - command | tee                   (capturing output)
 *
 * Examples allowed:
 * - grep "TODO"                     (actual grep, no counting)
 * - find . -name "*.ts"             (actual find, no counting)
 */

import type { LayerRule } from '../types.ts';
import { KrakenOperationType } from '../types.ts';

export const L1_THEATRICAL: LayerRule = {
  layer: 'L1',
  description: 'Theatrical Detection — catches pipe-to-wc, pipe-to-tee, and redirect patterns used to fake verification',
  applicableTo: [KrakenOperationType.INSPECT],
  toolGate: ['bash', 'terminal', 'sh', 'zsh'],
  patterns: [
    // grep piped to wc -l
    {
      intent: KrakenOperationType.INSPECT,
      pattern: /grep\b.*\|\s*wc\s+-l/i,
      field: 'command',
      description: 'grep piped to wc -l — theatrical line counting',
    },
    // find piped to wc -l
    {
      intent: KrakenOperationType.INSPECT,
      pattern: /find\b.*\|\s*wc\s+-l/i,
      field: 'command',
      description: 'find piped to wc -l — theatrical file counting',
    },
    // ls piped to wc -l
    {
      intent: KrakenOperationType.INSPECT,
      pattern: /ls\b.*\|\s*wc\s+-l/i,
      field: 'command',
      description: 'ls piped to wc -l — theatrical listing count',
    },
    // cat piped to wc -l
    {
      intent: KrakenOperationType.INSPECT,
      pattern: /cat\b.*\|\s*wc\s+-l/i,
      field: 'command',
      description: 'cat piped to wc -l — theatrical content counting',
    },
    // echo piped to wc -l (fabricated)
    {
      intent: KrakenOperationType.INSPECT,
      pattern: /echo\b.*\|\s*wc\s+-l/i,
      field: 'command',
      description: 'echo piped to wc -l — theatrical fabricated counting',
    },
    // wc -l against dist/src/build (fake build verification)
    {
      intent: KrakenOperationType.INSPECT,
      pattern: /wc\s+-l\s+.*\b(dist|src|build|node_modules)\//i,
      field: 'command',
      description: 'wc -l against build paths — theatrical build verification',
    },
    // pipe to tee (output capture)
    {
      intent: KrakenOperationType.INSPECT,
      pattern: /\|\s*tee\b/i,
      field: 'command',
      description: 'pipe to tee — theatrical redirect capture',
    },
    // redirect to file
    {
      intent: KrakenOperationType.INSPECT,
      pattern: /\|\s*>/,
      field: 'command',
      description: 'pipe redirect to file — theatrical output capture',
    },
    // sort | uniq (fake deduplication)
    {
      intent: KrakenOperationType.INSPECT,
      pattern: /\|\s*sort\b.*\|\s*uniq\b/i,
      field: 'command',
      description: 'sort piped to uniq — theatrical deduplication',
    },
    // rg piped to wc -l
    {
      intent: KrakenOperationType.INSPECT,
      pattern: /\brg\b.*\|\s*wc\s+-l/i,
      field: 'command',
      description: 'rg piped to wc -l — theatrical line counting',
    },
    // rg piped to awk
    {
      intent: KrakenOperationType.INSPECT,
      pattern: /\brg\b.*\|\s*awk\b/i,
      field: 'command',
      description: 'rg piped to awk — theatrical aggregation',
    },
    // grep piped to awk
    {
      intent: KrakenOperationType.INSPECT,
      pattern: /grep\b.*\|\s*awk\b/i,
      field: 'command',
      description: 'grep piped to awk — theatrical aggregation',
    },
    // find piped to awk
    {
      intent: KrakenOperationType.INSPECT,
      pattern: /find\b.*\|\s*awk\b/i,
      field: 'command',
      description: 'find piped to awk — theatrical aggregation',
    },
    // ls piped to awk
    {
      intent: KrakenOperationType.INSPECT,
      pattern: /ls\b.*\|\s*awk\b/i,
      field: 'command',
      description: 'ls piped to awk — theatrical aggregation',
    },
  ],
  correction: 'Counting does not verify. Run the code. Execute the tests. Show actual output.',
  enabled: true,
};
