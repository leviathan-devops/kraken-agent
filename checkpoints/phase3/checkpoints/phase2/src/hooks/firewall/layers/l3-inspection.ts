import type { LayerRule } from '../types.js';
import { OperationType } from '../types.js';

export const L3_INSPECTION: LayerRule = {
  layer: 'L3',
  description: 'Source Inspection Theater — blocks file-existence checks presented as verification',
  applicableTo: [OperationType.INSPECT, OperationType.WRITE, OperationType.EXECUTE],
  toolGate: ['bash', 'terminal'],
  patterns: [
    {
      intent: OperationType.INSPECT,
      pattern: /test\s+-f\s+.*\b(dist|build)\//i,
      field: 'command',
      description: 'test -f against dist/build path — existence ≠ verification',
    },
    {
      intent: OperationType.INSPECT,
      pattern: /test\s+-d\s+.*\b(dist|build)\//i,
      field: 'command',
      description: 'test -d against dist/build path — directory existence ≠ verification',
    },
    {
      intent: OperationType.INSPECT,
      pattern: /stat\s+.*\b(dist|build)\//i,
      field: 'command',
      description: 'stat against dist/build — metadata ≠ runtime proof',
    },
    {
      intent: OperationType.INSPECT,
      pattern: /ls\s+-l\s+.*\b(dist|src|build)\//i,
      field: 'command',
      description: 'ls -l against dist/src/build — listing as verification',
    },
    {
      intent: OperationType.INSPECT,
      pattern: /\[\s+-f\s+.*\b(dist|build)\//i,
      field: 'command',
      description: '[ -f ] shell conditional against build path — existence check theater',
    },
    {
      intent: OperationType.INSPECT,
      pattern: /\[\s+-d\s+.*\b(dist|build)\//i,
      field: 'command',
      description: '[ -d ] shell conditional against build path — directory check theater',
    },
    {
      intent: OperationType.INSPECT,
      pattern: /find\s+src\/.*\|\s*wc\b/i,
      field: 'command',
      description: 'find src piped to wc — source counting theater',
    },
    {
      intent: OperationType.WRITE,
      pattern: /^\s*(echo|cat|printf)\s+.*\s*>\s*.*src\//i,
      field: 'command',
      description: 'write to src/ directory — SOURCE_INSPECTION blocked',
    },
    {
      intent: OperationType.EXECUTE,
      pattern: /^\s*(echo|cat|printf)\s+.*\s*>\s*.*src\//i,
      field: 'command',
      description: 'write to src/ directory — SOURCE_INSPECTION blocked',
    },
    {
      intent: OperationType.WRITE,
      pattern: /^\s*tee\s+.*src\//i,
      field: 'command',
      description: 'tee to src/ — SOURCE_INSPECTION blocked',
    },
    {
      intent: OperationType.EXECUTE,
      pattern: /^\s*tee\s+.*src\//i,
      field: 'command',
      description: 'tee to src/ — SOURCE_INSPECTION blocked',
    },
  ],
  correction: 'File existence ≠ runtime proof. Test in container.',
  enabled: true,
};
