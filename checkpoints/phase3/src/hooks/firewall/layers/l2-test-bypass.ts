import type { LayerRule } from '../types.js';
import { OperationType } from '../types.js';

export const L2_TEST_BYPASS: LayerRule = {
  layer: 'L2',
  description: 'Test Framework Bypass — blocks direct invocation of test runners outside OpenCode hook-based test runner',
  applicableTo: [OperationType.TEST],
  toolGate: ['bash', 'terminal', 'node'],
  patterns: [
    {
      intent: OperationType.TEST,
      pattern: /^npm$/i,
      field: 'commandTokens[0]',
      description: 'npm test / run test / exec test bypass',
    },
    {
      intent: OperationType.TEST,
      pattern: /^yarn$/i,
      field: 'commandTokens[0]',
      description: 'yarn test / run test bypass',
    },
    {
      intent: OperationType.TEST,
      pattern: /^(pnpm|bun)$/i,
      field: 'commandTokens[0]',
      description: 'pnpm test / bun test bypass',
    },
    {
      intent: OperationType.TEST,
      pattern: /^bunx$/i,
      field: 'commandTokens[0]',
      description: 'bunx test bypass',
    },
    {
      intent: OperationType.TEST,
      pattern: /^(jest|vitest|mocha|jasmine)$/i,
      field: 'commandTokens[0]',
      description: 'standalone test runner bypass (jest/vitest/mocha/jasmine)',
    },
    {
      intent: OperationType.TEST,
      pattern: /^(pytest|python)$/i,
      field: 'commandTokens[0]',
      description: 'pytest / python -m pytest bypass',
    },
    {
      intent: OperationType.TEST,
      pattern: /^(go|cargo)$/i,
      field: 'commandTokens[0]',
      description: 'go test / cargo test bypass',
    },
    {
      intent: OperationType.TEST,
      pattern: /^(ruby|rspec)$/i,
      field: 'commandTokens[0]',
      description: 'ruby -Itest / rspec bypass',
    },
    {
      intent: OperationType.TEST,
      pattern: /^node$/i,
      field: 'commandTokens[0]',
      description: 'node test / node run-tests.js / node verify-*.mjs bypass',
    },
  ],
  correction: "Tests must run via OpenCode hooks. Use: opencode run 'shark-test-runner' --agent shark",
  enabled: true,
};
