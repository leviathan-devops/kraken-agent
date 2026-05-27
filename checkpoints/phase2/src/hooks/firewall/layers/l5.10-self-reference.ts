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

export const L5_10_SELF_REFERENCE: LayerRule = {
  layer: 'L5.10',
  description: 'Self-Reference — blocks agent from claiming verification based on its own assessment',
  applicableTo: ALL_OPERATIONS,
  requireEvidence: 'ContainerTestResult.json',
  patterns: [
    {
      intent: OperationType.TEST,
      pattern: /i\s+have\s+verified\s+that/i,
      field: 'args.notes',
      description: '"I have verified that" — self-verification ≠ mechanical proof',
    },
    {
      intent: OperationType.TEST,
      pattern: /i\s+verified\s+it\s+works/i,
      field: 'args.notes',
      description: '"I verified it works" — self-verification invalid',
    },
    {
      intent: OperationType.TEST,
      pattern: /my\s+verification\s+shows/i,
      field: 'args.notes',
      description: '"my verification shows" — personal verification is not evidence',
    },
    {
      intent: OperationType.TEST,
      pattern: /i\s+tested\s+it\s+works/i,
      field: 'args.notes',
      description: '"I tested it works" — self-testing is not mechanical proof',
    },
    {
      intent: OperationType.TEST,
      pattern: /i\s+ran\s+it\s+and\s+works/i,
      field: 'args.notes',
      description: '"I ran it and works" — self-execution is not container evidence',
    },
    {
      intent: OperationType.TEST,
      pattern: /my\s+testing\s+confirms/i,
      field: 'args.notes',
      description: '"my testing confirms" — personal testing is not mechanical verification',
    },
    {
      intent: OperationType.TEST,
      pattern: /i\s+know\s+it\s+works/i,
      field: 'args.notes',
      description: '"I know it works" — knowledge is not proof',
    },
    {
      intent: OperationType.TEST,
      pattern: /i\s+am\s+certain\s+it\s+works/i,
      field: 'args.notes',
      description: '"I am certain it works" — certainty is not mechanical evidence',
    },
    {
      intent: OperationType.TEST,
      pattern: /my\s+assessment\s+is/i,
      field: 'args.notes',
      description: '"my assessment is" — assessment ≠ mechanical proof',
    },
    {
      intent: OperationType.TEST,
      pattern: /in\s+my\s+assessment/i,
      field: 'args.notes',
      description: '"in my assessment" — self-assessment invalid',
    },
    {
      intent: OperationType.TEST,
      pattern: /my\s+analysis\s+shows/i,
      field: 'args.notes',
      description: '"my analysis shows" — analysis is not container test evidence',
    },
  ],
  correction: 'Self-verification ≠ mechanical proof. MECHANICAL PROOF REQUIRED: Container test evidence.',
  enabled: true,
};
