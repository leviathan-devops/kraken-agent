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

export const L5_2_SUCCESS_CLAIM: LayerRule = {
  layer: 'L5.2',
  description: 'Success Claim Without Proof — blocks agent from claiming verification without container test evidence',
  applicableTo: ALL_OPERATIONS,
  toolGate: ['shark-gate', 'write_file'],
  requireEvidence: 'ContainerTestResult.json',
  patterns: [
    {
      intent: OperationType.TEST,
      pattern: /trust\s+me\s+it\s+works/i,
      field: 'args.notes',
      description: '"trust me it works" — trust is not evidence',
    },
    {
      intent: OperationType.TEST,
      pattern: /believe\s+me/i,
      field: 'args.notes',
      description: '"believe me" — belief is not evidence',
    },
    {
      intent: OperationType.TEST,
      pattern: /obviously\s+correct/i,
      field: 'args.notes',
      description: '"obviously correct" — obviousness is not proof',
    },
    {
      intent: OperationType.TEST,
      pattern: /clearly\s+works/i,
      field: 'args.notes',
      description: '"clearly works" — clarity is not evidence',
    },
    {
      intent: OperationType.TEST,
      pattern: /already\s+verified\s+by\s+myself/i,
      field: 'args.notes',
      description: '"already verified by myself" — self-verification is not mechanical proof',
    },
    {
      intent: OperationType.TEST,
      pattern: /already\s+tested\s+and\s+works/i,
      field: 'args.notes',
      description: '"already tested and works" — needs container evidence',
    },
    {
      intent: OperationType.TEST,
      pattern: /in\s+my\s+assessment\s+it\s+works/i,
      field: 'args.notes',
      description: '"in my assessment it works" — assessment ≠ mechanical proof',
    },
    {
      intent: OperationType.TEST,
      pattern: /based\s+on\s+my\s+analysis\s+works/i,
      field: 'args.notes',
      description: '"based on my analysis works" — analysis ≠ evidence',
    },
    {
      intent: OperationType.TEST,
      pattern: /no\s+need\s+for\s+(test|verification)/i,
      field: 'args.notes',
      description: '"no need for test/verification" — mechanical proof IS needed',
    },
    {
      intent: OperationType.TEST,
      pattern: /no\s+further\s+test\s+needed/i,
      field: 'args.notes',
      description: '"no further test needed" — container test IS needed',
    },
    {
      intent: OperationType.TEST,
      pattern: /self\s+evidently\s+correct/i,
      field: 'args.notes',
      description: '"self evidently correct" — self-evidence ≠ mechanical proof',
    },
  ],
  correction: 'MECHANICAL PROOF REQUIRED: Container test evidence (passRate >= 0.96). Run: shark-test-runner',
  enabled: true,
};
