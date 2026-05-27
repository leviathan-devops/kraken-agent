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

export const L5_7_SCOPE_CREEP: LayerRule = {
  layer: 'L5.7',
  description: 'Scope Creep — blocks agent from expanding scope during verification or writing',
  applicableTo: ALL_OPERATIONS,
  toolGate: ['shark-gate', 'write_file'],
  patterns: [
    {
      intent: OperationType.TEST,
      pattern: /while\s+(we're\s+)?at\s+it/i,
      field: 'args.notes',
      description: '"while (we\'re) at it" — stay on task',
    },
    {
      intent: OperationType.TEST,
      pattern: /at\s+the\s+same\s+time/i,
      field: 'args.notes',
      description: '"at the same time" — separate tasks, separate scope',
    },
    {
      intent: OperationType.TEST,
      pattern: /also\s+need\s+to/i,
      field: 'args.notes',
      description: '"also need to" — new items need separate tasks',
    },
    {
      intent: OperationType.TEST,
      pattern: /might\s+as\s+well/i,
      field: 'args.notes',
      description: '"might as well" — do not expand scope opportunistically',
    },
    {
      intent: OperationType.TEST,
      pattern: /just\s+to\s+be\s+thorough/i,
      field: 'args.notes',
      description: '"just to be thorough" — thoroughness without scope creep',
    },
    {
      intent: OperationType.TEST,
      pattern: /for\s+completeness/i,
      field: 'args.notes',
      description: '"for completeness" — completeness does not justify scope creep',
    },
    {
      intent: OperationType.TEST,
      pattern: /one\s+more\s+thing/i,
      field: 'args.notes',
      description: '"one more thing" — separate item, separate task',
    },
    {
      intent: OperationType.TEST,
      pattern: /oh\s+and\s+also/i,
      field: 'args.notes',
      description: '"oh and also" — stay on current task',
    },
    {
      intent: OperationType.TEST,
      pattern: /on\s+the\s+side/i,
      field: 'args.notes',
      description: '"on the side" — side tasks need separate tasks',
    },
  ],
  correction: 'Stay on task. Use separate task for new items.',
  enabled: true,
};
