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

export const L5_4_MOCK_STUB: LayerRule = {
  layer: 'L5.4',
  description: 'Mock/Stub Data — blocks agent from substituting real data with mock, stub, or fake data',
  applicableTo: ALL_OPERATIONS,
  requireEvidence: 'ContainerTestResult.json',
  patterns: [
    {
      intent: OperationType.TEST,
      pattern: /mock\s+data/i,
      field: 'args.notes',
      description: '"mock data" — real data required',
    },
    {
      intent: OperationType.TEST,
      pattern: /stub\s+data/i,
      field: 'args.notes',
      description: '"stub data" — real data required',
    },
    {
      intent: OperationType.TEST,
      pattern: /fake\s+(data|dummy|sample)/i,
      field: 'args.notes',
      description: '"fake data/dummy/sample" — real data + real execution required',
    },
    {
      intent: OperationType.TEST,
      pattern: /dummy\s+data/i,
      field: 'args.notes',
      description: '"dummy data" — real data required',
    },
    {
      intent: OperationType.TEST,
      pattern: /sample\s+data/i,
      field: 'args.notes',
      description: '"sample data" — real production data required',
    },
    {
      intent: OperationType.TEST,
      pattern: /mocked\s+(response|data)/i,
      field: 'args.notes',
      description: '"mocked response/data" — real execution required',
    },
    {
      intent: OperationType.TEST,
      pattern: /stubbed\s+(response|data)/i,
      field: 'args.notes',
      description: '"stubbed response/data" — real execution required',
    },
    {
      intent: OperationType.TEST,
      pattern: /fake\s+api/i,
      field: 'args.notes',
      description: '"fake api" — real API integration required',
    },
    {
      intent: OperationType.TEST,
      pattern: /hardcoded\s+response/i,
      field: 'args.notes',
      description: '"hardcoded response" — dynamic real responses required',
    },
    {
      intent: OperationType.TEST,
      pattern: /static\s+json\s+instead/i,
      field: 'args.notes',
      description: '"static json instead" — real dynamic data required',
    },
    {
      intent: OperationType.TEST,
      pattern: /no\s+real\s+api/i,
      field: 'args.notes',
      description: '"no real api" — real API integration required',
    },
    {
      intent: OperationType.TEST,
      pattern: /mock\s+(data|stub|fake)/i,
      field: 'command',
      description: '"mock data/stub/fake" in command — real data required',
    },
    {
      intent: OperationType.TEST,
      pattern: /fake\s+(data|api|response)/i,
      field: 'command',
      description: '"fake data/api/response" in command — real execution required',
    },
  ],
  correction: 'Real data + real execution required. Container test evidence needed.',
  enabled: true,
};
