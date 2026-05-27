import type { LayerRule } from '../types.js';
import { OperationType } from '../types.js';

export const L1_THEATRICAL: LayerRule = {
  layer: 'L1',
  description: 'Theatrical Detection — catches pipe-to-wc, pipe-to-tee, and redirect patterns used to fake verification',
  applicableTo: [OperationType.INSPECT],
  toolGate: ['bash', 'terminal'],
  patterns: [
    {
      intent: OperationType.INSPECT,
      pattern: /grep\b.*\|\s*wc\s+-l/i,
      field: 'command',
      description: 'grep piped to wc -l — theatrical line counting',
    },
    {
      intent: OperationType.INSPECT,
      pattern: /find\b.*\|\s*wc\s+-l/i,
      field: 'command',
      description: 'find piped to wc -l — theatrical file counting',
    },
    {
      intent: OperationType.INSPECT,
      pattern: /ls\b.*\|\s*wc\s+-l/i,
      field: 'command',
      description: 'ls piped to wc -l — theatrical file listing count',
    },
    {
      intent: OperationType.INSPECT,
      pattern: /cat\b.*\|\s*wc\s+-l/i,
      field: 'command',
      description: 'cat piped to wc -l — theatrical line counting',
    },
    {
      intent: OperationType.INSPECT,
      pattern: /echo\b.*\|\s*wc\s+-l/i,
      field: 'command',
      description: 'echo piped to wc -l — theatrical fabricated counting',
    },
    {
      intent: OperationType.INSPECT,
      pattern: /wc\s+-l\s+.*\b(dist|src|build)\//i,
      field: 'command',
      description: 'wc -l against dist/src/build paths — theatrical build verification',
    },
    {
      intent: OperationType.INSPECT,
      pattern: /grep\b.*\b(setCurrentAgent|isSharkAgent|guardian)\b/i,
      field: 'command',
      description: 'grep against firewall source files — theatrical source audit',
    },
    {
      intent: OperationType.INSPECT,
      pattern: /\|\s*tee\b/i,
      field: 'command',
      description: 'pipe to tee — theatrical redirect capture',
    },
    {
      intent: OperationType.INSPECT,
      pattern: /\|\s*>/,
      field: 'command',
      description: 'pipe redirect to file — theatrical output capture',
    },
  ],
  correction: 'Counting does not verify. Run the code. Test the output.',
  enabled: true,
};
