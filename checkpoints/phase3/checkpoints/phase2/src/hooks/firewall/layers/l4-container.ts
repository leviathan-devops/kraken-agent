import type { LayerRule } from '../types.js';
import { OperationType } from '../types.js';

export const L4_CONTAINER: LayerRule = {
  layer: 'L4',
  description: 'Wrong Container — blocks opencode run/container commands and incorrect docker opencode invocations',
  applicableTo: [OperationType.CONTAINER],
  toolGate: ['bash', 'terminal'],
  patterns: [
    {
      intent: OperationType.CONTAINER,
      pattern: /^opencode\s+(run|container)\b/i,
      field: 'command',
      description: 'opencode run/container — banned for testing, use docker run with opencode-test image',
    },
    {
      intent: OperationType.CONTAINER,
      pattern: /docker\s+run\b.*\bopencode\s+(run|exec|sh|start|container)\b/i,
      field: 'command',
      description: 'docker run with opencode as primary command — use opencode-test image instead',
    },
  ],
  correction: 'Use proper container workflow: docker run --rm -v ~/.config/opencode:/root/.config/opencode opencode-test:1.4.3',
  enabled: true,
};
