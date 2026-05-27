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

export const L5_6_CONFUSION: LayerRule = {
  layer: 'L5.6',
  description: 'Confusion Pretense — blocks hedging language that masks uncertainty about correctness',
  applicableTo: ALL_OPERATIONS,
  patterns: [
    {
      intent: OperationType.TEST,
      pattern: /somewhat\s+works/i,
      field: 'args.notes',
      description: '"somewhat works" — binary: it works or it does not',
    },
    {
      intent: OperationType.TEST,
      pattern: /(sorta|kinda)\s+works/i,
      field: 'args.notes',
      description: '"sorta/kinda works" — not an acceptable status',
    },
    {
      intent: OperationType.TEST,
      pattern: /more\s+or\s+less/i,
      field: 'args.notes',
      description: '"more or less" — imprecise language not accepted',
    },
    {
      intent: OperationType.TEST,
      pattern: /mostly\s+works/i,
      field: 'args.notes',
      description: '"mostly works" — "mostly" is not "does"',
    },
    {
      intent: OperationType.TEST,
      pattern: /approximately\s+correct/i,
      field: 'args.notes',
      description: '"approximately correct" — binary: correct or incorrect',
    },
    {
      intent: OperationType.TEST,
      pattern: /basically\s+correct/i,
      field: 'args.notes',
      description: '"basically correct" — imprecise acceptance',
    },
    {
      intent: OperationType.TEST,
      pattern: /essentially\s+works/i,
      field: 'args.notes',
      description: '"essentially works" — essentially is not actually',
    },
    {
      intent: OperationType.TEST,
      pattern: /nominally\s+functional/i,
      field: 'args.notes',
      description: '"nominally functional" — nominal ≠ verified',
    },
    {
      intent: OperationType.TEST,
      pattern: /partially\s+(implemented|working)/i,
      field: 'args.notes',
      description: '"partially implemented/working" — complete implementation required',
    },
    {
      intent: OperationType.TEST,
      pattern: /somewhat\s+correct/i,
      field: 'args.notes',
      description: '"somewhat correct" — correct is binary',
    },
  ],
  correction: "If uncertain, admit it clearly. 'Somewhat works' is not an acceptable status.",
  enabled: true,
};
