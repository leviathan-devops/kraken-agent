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

export const L5_11_OPENCODE_RUN_BAN: LayerRule = {
  layer: 'L5.11',
  description: 'OPENCODE RUN BAN — blocks any reference to "opencode run" which bypasses hooks and provides false test results',
  applicableTo: ALL_OPERATIONS,
  toolGate: [],
  patterns: [
    {
      intent: OperationType.READ,
      pattern: /opencode\s+run\b/i,
      field: 'command',
      description: '"opencode run" bypasses hooks — TUI testing is the ONLY valid method',
    },
    {
      intent: OperationType.WRITE,
      pattern: /opencode\s+run\b/i,
      field: 'command',
      description: '"opencode run" bypasses hooks — TUI testing is the ONLY valid method',
    },
    {
      intent: OperationType.EXECUTE,
      pattern: /opencode\s+run\b/i,
      field: 'command',
      description: '"opencode run" bypasses hooks — TUI testing is the ONLY valid method',
    },
    {
      intent: OperationType.TEST,
      pattern: /opencode\s+run\b/i,
      field: 'command',
      description: '"opencode run" bypasses hooks — TUI testing is the ONLY valid method',
    },
    {
      intent: OperationType.INSPECT,
      pattern: /opencode\s+run\b/i,
      field: 'command',
      description: '"opencode run" bypasses hooks — TUI testing is the ONLY valid method',
    },
    {
      intent: OperationType.CONTAINER,
      pattern: /opencode\s+run\b/i,
      field: 'command',
      description: '"opencode run" bypasses hooks — TUI testing is the ONLY valid method',
    },
    {
      intent: OperationType.BUILD,
      pattern: /opencode\s+run\b/i,
      field: 'command',
      description: '"opencode run" bypasses hooks — TUI testing is the ONLY valid method',
    },
    {
      intent: OperationType.SYSTEM,
      pattern: /opencode\s+run\b/i,
      field: 'command',
      description: '"opencode run" bypasses hooks — TUI testing is the ONLY valid method',
    },
    {
      intent: OperationType.CROSS_AGENT,
      pattern: /opencode\s+run\b/i,
      field: 'command',
      description: '"opencode run" bypasses hooks — TUI testing is the ONLY valid method',
    },
    {
      intent: OperationType.READ,
      pattern: /opencode\s+run\b/i,
      field: 'args.notes',
      description: '"opencode run" in notes — TUI testing is the ONLY valid method',
    },
    {
      intent: OperationType.WRITE,
      pattern: /opencode\s+run\b/i,
      field: 'args.notes',
      description: '"opencode run" in notes — TUI testing is the ONLY valid method',
    },
    {
      intent: OperationType.EXECUTE,
      pattern: /opencode\s+run\b/i,
      field: 'args.notes',
      description: '"opencode run" in notes — TUI testing is the ONLY valid method',
    },
    {
      intent: OperationType.TEST,
      pattern: /opencode\s+run\b/i,
      field: 'args.notes',
      description: '"opencode run" in notes — TUI testing is the ONLY valid method',
    },
    {
      intent: OperationType.READ,
      pattern: /opencode\s+run\b/i,
      field: 'args.message',
      description: '"opencode run" in message — TUI testing is the ONLY valid method',
    },
    {
      intent: OperationType.WRITE,
      pattern: /opencode\s+run\b/i,
      field: 'args.message',
      description: '"opencode run" in message — TUI testing is the ONLY valid method',
    },
    {
      intent: OperationType.EXECUTE,
      pattern: /opencode\s+run\b/i,
      field: 'args.message',
      description: '"opencode run" in message — TUI testing is the ONLY valid method',
    },
    {
      intent: OperationType.TEST,
      pattern: /opencode\s+run\b/i,
      field: 'args.message',
      description: '"opencode run" in message — TUI testing is the ONLY valid method',
    },
  ],
  correction: 'OPENCODE RUN IS BANNED. Use TUI testing via: tmux new-session -d -s test "docker attach container"',
  enabled: true,
};