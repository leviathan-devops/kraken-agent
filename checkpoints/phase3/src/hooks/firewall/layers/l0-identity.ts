import type { LayerRule } from '../types.js';
import { OperationType } from '../types.js';

export const L0_IDENTITY: LayerRule = {
  layer: 'L0',
  description: 'Identity Wall — blocks non-Shark agents or uninitialized brain from dangerous operations',
  applicableTo: [OperationType.SYSTEM, OperationType.WRITE],
  patterns: [],
  correction: 'Brain not initialized. Set current agent first.',
  enabled: true,
};
