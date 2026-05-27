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

export const L5_3_MODEL_RESTRICTION: LayerRule = {
  layer: 'L5.3',
  description: 'Model Restriction — blocks agent from using model limitations as an excuse to skip quality gates',
  applicableTo: ALL_OPERATIONS,
  patterns: [
    {
      intent: OperationType.TEST,
      pattern: /only\s+(gpt|claude|gemini|llama)/i,
      field: 'command',
      description: '"only gpt/claude/gemini/llama" — quality gates are model-agnostic',
    },
    {
      intent: OperationType.TEST,
      pattern: /must\s+use\s+(gpt|claude)/i,
      field: 'command',
      description: '"must use gpt/claude" — quality gates apply to all models',
    },
    {
      intent: OperationType.TEST,
      pattern: /restricted\s+to\s+model/i,
      field: 'command',
      description: '"restricted to model" — no model-based restriction excuses',
    },
    {
      intent: OperationType.TEST,
      pattern: /model\s+(quota|limit)/i,
      field: 'command',
      description: '"model quota/limit" — quota is not an excuse to skip gates',
    },
    {
      intent: OperationType.TEST,
      pattern: /rate\s+limit\s+excuse/i,
      field: 'command',
      description: '"rate limit excuse" — rate limits do not waive quality requirements',
    },
    {
      intent: OperationType.TEST,
      pattern: /api\s+key\s+issue/i,
      field: 'command',
      description: '"api key issue" — API key issues do not waive quality gates',
    },
    {
      intent: OperationType.TEST,
      pattern: /can('t|not)\s+afford\s+model/i,
      field: 'command',
      description: '"can\'t afford model" — cost is not a gate waiver',
    },
    {
      intent: OperationType.TEST,
      pattern: /too\s+expensive\s+model/i,
      field: 'command',
      description: '"too expensive model" — expense does not waive quality requirements',
    },
    {
      intent: OperationType.TEST,
      pattern: /model\s+cost\s+too\s+high/i,
      field: 'command',
      description: '"model cost too high" — cost is not a valid excuse',
    },
    {
      intent: OperationType.TEST,
      pattern: /switch\s+model/i,
      field: 'command',
      description: '"switch model" — switching model does not waive quality gates',
    },
  ],
  correction: 'Quality gates apply regardless of model choice.',
  enabled: true,
};
