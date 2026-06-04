/**
 * src/system-brain/firewall/intent-classifier.ts
 *
 * Classifies the intent of a tool call into OperationType.
 * Used by the firewall to determine which layers to apply.
 *
 * Priority ordering:
 * 1. Cross-agent tools → CROSS_AGENT
 * 2. Dangerous ops (rm, chmod, kill) → EXECUTE
 * 3. Write ops (write, edit, mkdir) → WRITE
 * 4. Test ops (test, verify, audit) → TEST
 * 5. Inspect ops (ls, stat, cat) → INSPECT
 * 6. Pipe/wc ops → INSPECT
 * 7. Container ops (docker) → CONTAINER
 * 8. Build ops (bun, npm, tsc) → BUILD
 * 9. Read ops (read, grep) → READ
 * 10. Hive tools → HIVE_READ/HIVE_WRITE
 * 11. Spawn tools → DELEGATE
 * 12. System tools → SYSTEM
 */

import { OperationType } from './types.js';

const TOOL_OPERATION_MAP: Record<string, OperationType> = {
  // Write operations
  write: OperationType.WRITE,
  edit: OperationType.WRITE,
  mkdir: OperationType.WRITE,
  mv: OperationType.WRITE,
  cp: OperationType.WRITE,
  touch: OperationType.WRITE,
  rm: OperationType.EXECUTE,

  // Read operations
  read: OperationType.READ,
  grep: OperationType.READ,
  glob: OperationType.READ,
  ls: OperationType.INSPECT,
  stat: OperationType.INSPECT,
  cat: OperationType.INSPECT,
  head: OperationType.INSPECT,
  tail: OperationType.INSPECT,

  // Execute operations
  bash: OperationType.EXECUTE,
  command: OperationType.EXECUTE,
  exec: OperationType.EXECUTE,

  // Test operations
  test: OperationType.TEST,
  verify: OperationType.TEST,
  audit: OperationType.TEST,

  // Build operations
  build: OperationType.BUILD,
  compile: OperationType.BUILD,

  // Container operations
  docker: OperationType.CONTAINER,

  // Hive operations
  kraken_hive_search: OperationType.HIVE_READ,
  kraken_hive_remember: OperationType.HIVE_WRITE,
  kraken_hive_inject_context: OperationType.HIVE_WRITE,
  hive_context: OperationType.HIVE_READ,
  hive_remember: OperationType.HIVE_WRITE,
  memread_session: OperationType.HIVE_READ,

  // Spawn/delegation
  spawn_shark_agent: OperationType.DELEGATE,
  spawn_manta_agent: OperationType.DELEGATE,
  spawn_cluster_task: OperationType.DELEGATE,
  task: OperationType.DELEGATE,

  // System/monitoring
  get_cluster_status: OperationType.SYSTEM,
  get_agent_status: OperationType.SYSTEM,
  aggregate_results: OperationType.SYSTEM,
  report_to_kraken: OperationType.SYSTEM,
  read_kraken_context: OperationType.HIVE_READ,
  get_task_context: OperationType.HIVE_READ,

  // Browser
  browser_open: OperationType.READ,
  browser_snapshot: OperationType.INSPECT,
  browser_screenshot: OperationType.INSPECT,
  browser_click: OperationType.WRITE,
  browser_fill: OperationType.WRITE,
  browser_get_text: OperationType.READ,
  browser_exec: OperationType.EXECUTE,
  browser_close: OperationType.SYSTEM,
  browser_vision: OperationType.READ,

  // Vision
  vlm_vision: OperationType.READ,
  vlm_status: OperationType.SYSTEM,
  vlm_on: OperationType.SYSTEM,
  vlm_off: OperationType.SYSTEM,
};

const DANGEROUS_COMMANDS = [
  'rm -rf', 'chmod 777', 'chmod -R', 'kill -9', 'killall',
  'dd if=', 'mkfs', 'fdisk', 'format',
  ':(){:|:&};:',  // fork bomb
  'shutdown', 'reboot', 'init 0', 'init 6',
];

export function classifyIntent(
  tool: string,
  command: string | null,
  args: Record<string, unknown>,
): OperationType {
  // Priority 1: Check tool-specific mapping
  const toolOp = TOOL_OPERATION_MAP[tool];
  if (toolOp) return toolOp;

  // Priority 2: Check for dangerous commands in bash/exec
  if (tool === 'bash' || tool === 'command' || tool === 'exec') {
    if (command) {
      for (const dangerous of DANGEROUS_COMMANDS) {
        if (command.includes(dangerous)) {
          return OperationType.EXECUTE;
        }
      }

      // Check for write commands
      if (/\b(write|edit|mkdir|touch|cp|mv|rm|chmod|chown)\b/.test(command)) {
        return OperationType.WRITE;
      }

      // Check for pipe + wc (verification theater pattern)
      if (command.includes('|') && command.includes('wc')) {
        return OperationType.INSPECT;
      }

      // Check for container commands
      if (/\b(docker|podman|container)\b/.test(command)) {
        return OperationType.CONTAINER;
      }

      // Check for build commands
      if (/\b(bun|npm|yarn|pnpm|tsc|webpack|vite)\b/.test(command)) {
        return OperationType.BUILD;
      }

      // Default for bash: EXECUTE
      return OperationType.EXECUTE;
    }
  }

  // P2: Safe string extraction — no unchecked casts
  const extractArgStr = (key: string): string | undefined => {
    const val = args[key];
    return typeof val === 'string' ? val : undefined;
  };

  // Priority 3: Check for spawn/delegation patterns in args
  const taskArg = extractArgStr('task');
  if (taskArg && /spawn|delegate|assign|dispatch/.test(taskArg)) {
    return OperationType.DELEGATE;
  }

  // Priority 4: Check for cross-agent patterns
  const desc = extractArgStr('description') || extractArgStr('task') || '';
  if (/send\s+to\s+(shark|manta|kraken|agent)/i.test(desc)) {
    return OperationType.CROSS_AGENT;
  }

  // Default: READ (safest assumption)
  return OperationType.READ;
}
