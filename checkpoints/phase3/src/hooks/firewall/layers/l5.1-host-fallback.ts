import type { LayerRule } from '../types.js';
import { OperationType } from '../types.js';

const ALL_OPERATIONS: OperationType[] = [
  OperationType.READ,
  OperationType.WRITE,
  OperationType.EXECUTE,
  OperationType.TEST,
  OperationType.INSPECT,
  OperationType.CONTAINER,
  OperationType.BUILD,
  OperationType.CROSS_AGENT,
  OperationType.SYSTEM,
];

export const L5_1_HOST_FALLBACK: LayerRule = {
  layer: 'L5.1',
  description: 'Host Fallback — blocks agent from claiming host testing substitutes for container testing',
  applicableTo: ALL_OPERATIONS,
  toolGate: ['shark-gate', 'bash', 'write_file'],
  patterns: [
    {
      intent: OperationType.TEST,
      pattern: /host\s+testing\s+already\s+works/i,
      field: 'args.notes',
      description: '"host testing already works" — host ≠ container',
    },
    {
      intent: OperationType.TEST,
      pattern: /fall\s+back\s+to\s+host/i,
      field: 'args.notes',
      description: '"fall back to host" — reject host fallback',
    },
    {
      intent: OperationType.TEST,
      pattern: /local\s+works\s+container\s+not\s+needed/i,
      field: 'args.notes',
      description: '"local works container not needed" — container IS required',
    },
    {
      intent: OperationType.TEST,
      pattern: /skip\s+container/i,
      field: 'args.notes',
      description: '"skip container" in gate notes — container test is mandatory',
    },
    {
      intent: OperationType.TEST,
      pattern: /container\s+not\s+(necessary|needed)/i,
      field: 'args.notes',
      description: '"container not necessary/needed" — container IS necessary',
    },
    {
      intent: OperationType.TEST,
      pattern: /not\s+need\s+container/i,
      field: 'args.notes',
      description: '"not need container" — container IS needed',
    },
    {
      intent: OperationType.TEST,
      pattern: /use\s+host\s+instead/i,
      field: 'args.notes',
      description: '"use host instead" — host testing ≠ container testing',
    },
    {
      intent: OperationType.TEST,
      pattern: /host\s+works/i,
      field: 'args.notes',
      description: '"host works" — host testing does not prove container behavior',
    },
    {
      intent: OperationType.TEST,
      pattern: /host\s+mode/i,
      field: 'args.notes',
      description: '"host mode" — host mode bypasses container isolation',
    },
    {
      intent: OperationType.TEST,
      pattern: /skip.*(container|test)/i,
      field: 'args.notes',
      description: 'skip+container/test — any variation of skipping container validation',
    },
    {
      intent: OperationType.TEST,
      pattern: /host\s+prove\s+it\s+works/i,
      field: 'args.notes',
      description: '"host prove it works" — host does not prove container behavior',
    },
    {
      intent: OperationType.TEST,
      pattern: /already\s+proven\s+to\s+work/i,
      field: 'args.notes',
      description: '"already proven to work" — needs container proof',
    },
    {
      intent: OperationType.TEST,
      pattern: /already\s+verified\s+on\s+(host|local)/i,
      field: 'args.notes',
      description: '"already verified on host/local" — host verification ≠ container verification',
    },
    {
      intent: OperationType.TEST,
      pattern: /already\s+tested\s+on\s+(host|local)/i,
      field: 'args.notes',
      description: '"already tested on host/local" — test must be in container',
    },
    {
      intent: OperationType.TEST,
      pattern: /skip\s+container/i,
      field: 'command',
      description: '"skip container" in command — container is mandatory',
    },
    {
      intent: OperationType.TEST,
      pattern: /host\s+instead/i,
      field: 'command',
      description: '"host instead" in command — host is not a substitute',
    },
  ],
  correction: 'Host testing DOES NOT EQUAL container testing. Container isolation REQUIRED for ship gate.',
  enabled: true,
};
