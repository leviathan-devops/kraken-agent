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

export const L5_5_SIMPLIFICATION: LayerRule = {
  layer: 'L5.5',
  description: 'Oversimplification — blocks agent from hand-waving or glossing over complexity',
  applicableTo: ALL_OPERATIONS,
  patterns: [
    {
      intent: OperationType.TEST,
      pattern: /oversimplif/i,
      field: 'args.notes',
      description: '"oversimplified/oversimplification" — address the full complexity',
    },
    {
      intent: OperationType.TEST,
      pattern: /overly\s+simplif/i,
      field: 'args.notes',
      description: '"overly simplified" — do not oversimplify',
    },
    {
      intent: OperationType.TEST,
      pattern: /too\s+simpl/i,
      field: 'args.notes',
      description: '"too simple/simplified" — complexity must be addressed',
    },
    {
      intent: OperationType.TEST,
      pattern: /hand\s*wav/i,
      field: 'args.notes',
      description: '"hand wave/handwave" — do not hand-wave complexity',
    },
    {
      intent: OperationType.TEST,
      pattern: /gloss\s+(over|ed\s+over)/i,
      field: 'args.notes',
      description: '"gloss over/glossed over" — do not gloss over details',
    },
    {
      intent: OperationType.TEST,
      pattern: /skip\s+(detail|nuance)/i,
      field: 'args.notes',
      description: '"skip detail/nuance" — nuance matters, do not skip',
    },
  ],
  correction: 'Nuance matters. Do not hand-wave complex aspects.',
  enabled: true,
};
