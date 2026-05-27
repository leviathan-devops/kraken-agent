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

export const L5_8_UNDERMINING: LayerRule = {
  layer: 'L5.8',
  description: 'Undermining — blocks agent from devaluing quality gates and verification steps',
  applicableTo: ALL_OPERATIONS,
  patterns: [
    {
      intent: OperationType.TEST,
      pattern: /not\s+worth\s+the\s+effort/i,
      field: 'args.notes',
      description: '"not worth the effort" — quality gates are always worth the effort',
    },
    {
      intent: OperationType.TEST,
      pattern: /too\s+much\s+work/i,
      field: 'args.notes',
      description: '"too much work" — verification work is necessary, not optional',
    },
    {
      intent: OperationType.TEST,
      pattern: /not\s+worth\s+it/i,
      field: 'args.notes',
      description: '"not worth it" — quality verification is worth it',
    },
    {
      intent: OperationType.TEST,
      pattern: /diminishing\s+returns/i,
      field: 'args.notes',
      description: '"diminishing returns" — verification does not have diminishing returns',
    },
    {
      intent: OperationType.TEST,
      pattern: /marginal\s+benefit/i,
      field: 'args.notes',
      description: '"marginal benefit" — verification benefit is not marginal',
    },
    {
      intent: OperationType.TEST,
      pattern: /minimal\s+gain/i,
      field: 'args.notes',
      description: '"minimal gain" — verification gain is substantial',
    },
  ],
  correction: 'Quality gates exist for reason. Do not use \'not worth it\' excuses.',
  enabled: true,
};
