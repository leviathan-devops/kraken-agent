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

export const L5_9_IMPATIENCE: LayerRule = {
  layer: 'L5.9',
  description: 'Impatience — blocks agent from rushing through or skipping verification steps',
  applicableTo: ALL_OPERATIONS,
  toolGate: ['shark-gate'],
  patterns: [
    {
      intent: OperationType.TEST,
      pattern: /let('s| us)\s+(just\s+)?move\s+on/i,
      field: 'args.notes',
      description: '"let\'s move on" — do not skip verification',
    },
    {
      intent: OperationType.TEST,
      pattern: /let('s| us)\s+skip\s+to\s+the\s+end/i,
      field: 'args.notes',
      description: '"let\'s skip to the end" — complete all verification steps',
    },
    {
      intent: OperationType.TEST,
      pattern: /good\s+enough/i,
      field: 'args.notes',
      description: '"good enough" — "good enough" is not sufficient',
    },
    {
      intent: OperationType.TEST,
      pattern: /close\s+enough/i,
      field: 'args.notes',
      description: '"close enough" — precision required, not approximation',
    },
    {
      intent: OperationType.TEST,
      pattern: /ship\s+it/i,
      field: 'args.notes',
      description: '"ship it" — premature shipping without verification',
    },
    {
      intent: OperationType.TEST,
      pattern: /just\s+deploy/i,
      field: 'args.notes',
      description: '"just deploy" — do not deploy without full verification',
    },
    {
      intent: OperationType.TEST,
      pattern: /ship\s+now/i,
      field: 'args.notes',
      description: '"ship now" — ship only after verification gates pass',
    },
    {
      intent: OperationType.TEST,
      pattern: /let('s| us)\s+hurry/i,
      field: 'args.notes',
      description: '"let\'s hurry" — verification cannot be rushed',
    },
  ],
  correction: 'Proper verification takes time. Do not skip required steps.',
  enabled: true,
};
