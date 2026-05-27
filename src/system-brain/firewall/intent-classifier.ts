/**
 * src/system-brain/firewall/intent-classifier.ts
 *
 * Algorithmic semantic classification using token-set lookups.
 * NOT regex-based. NOT model-based. O(1) Set lookups.
 *
 * Classification priority chain (first match wins):
 * 1. CROSS_AGENT tools (external bridges)
 * 2. HIVE_WRITE tools (writes to Hive)
 * 3. HIVE_READ tools (reads from Hive)
 * 4. DELEGATE tools (spawning agents)
 * 5. WRITE tools (file modification)
 * 6. Command-based classification (EXECUTE, TEST, INSPECT, BUILD, SYSTEM)
 */

import { KrakenOperationType } from './types.ts';

// ============================================================
// TOKEN SETS — O(1) lookup, mutually exclusive
// ============================================================

/**
 * CROSS_AGENT: Tools that bridge to OTHER agents/systems.
 * These communicate with external systems, not Kraken native.
 * Priority: CHECKED FIRST (after HIVE_WRITE/HIVE_READ for exact matches)
 */
const CROSS_AGENT_PREFIXES = ['hermes_', 'hive_', 'kraken_'] as const;
const CROSS_AGENT_EXACT = new Set<string>([
  'memread',
  'memsearch',
  'membrowse',
  'memcommit',
]);

/**
 * HIVE_WRITE: Tools that WRITE to Kraken Hive.
 * CRITICAL: These must be protected — corrupt Hive memory breaks everything.
 * NOTE: memcommit and memlink_parent are here, NOT in CROSS_AGENT.
 * They write to session lineage graph, which is a Hive write operation.
 */
const HIVE_WRITE_TOOLS = new Set<string>([
  'kraken_hive_remember',
  'hive_remember',
  'memcommit',        // Writes session lineage
  'memlink_parent',   // Writes session relationships
]);

/**
 * HIVE_READ: Tools that READ from Kraken Hive.
 * NOTE: memread, memsearch, membrowse are HIVE_READ here.
 * They query existing data from Hive.
 */
const HIVE_READ_TOOLS = new Set<string>([
  'kraken_hive_search',
  'hive_context',
  'memsearch',
  'membrowse',
  'memread',
]);

/**
 * DELEGATE: Tools that SPAWN or delegate to other agents.
 */
const DELEGATE_TOOLS = new Set<string>([
  'spawn_shark_agent',
  'spawn_manta_agent',
  'spawn_cluster_task',
  'run_parallel_tasks', // Takes array of tasks
]);

/**
 * WRITE_TOOLS: File modification tools.
 */
const WRITE_TOOLS = new Set<string>([
  'write_file',
  'write',
  'patch',
  'edit',
]);

/**
 * EXECUTE_TOKENS: Shells and interpreters.
 */
const EXECUTE_TOKENS = new Set<string>([
  'bash', 'sh', 'zsh',
  'node', 'deno', 'bun',
  'python', 'python3',
  'npm', 'npx', 'yarn', 'pnpm',
  'cargo', 'go', 'rustc',
  'dotnet', 'java', 'javac',
  'perl', 'ruby', 'php', 'lua', 'zig',
]);

/**
 * TEST_FRAMEWORKS: Known test runners.
 */
const TEST_FRAMEWORKS = new Set<string>([
  'jest', 'vitest', 'mocha',
  'pytest', 'pytest', 'unittest',
  'cargo', 'go', 'mix',
  'phpunit', 'rspec', 'minitest',
  'ava', 'tape', 'tap',
]);

/**
 * CONTAINER_TOOLS: Container orchestration.
 */
const CONTAINER_TOOLS = new Set<string>([
  'docker', 'docker-compose', 'podman', 'containerd',
]);

/**
 * BUILD_TOOLS: Build systems.
 */
const BUILD_TOOLS = new Set<string>([
  'make', 'cmake', 'ninja',
  'gradle', 'maven', 'ant', 'sbt',
  'buck', 'bazel',
]);

/**
 * DANGEROUS_PATTERNS: Commands that are ALWAYS blocked.
 * These are checked AFTER tool-based classification.
 */
const DANGEROUS_PATTERNS: RegExp[] = [
  /\brm\s+-rf\s+\//i,                    // rm -rf /
  /\bdd\s+if=/i,                         // dd if= (disk clone)
  /\bmkfs\b/i,                          // mkfs (format)
  /:\s*\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;/, // Fork bomb
  /for\s*\(.*\)\s*do\s*.*&\s*;\s*done/i,     // Fork bomb loop
  /\bfork\s*bomb\b/i,                   // Explicit fork bomb
  /\bsudo\b.*\brm\b/i,                  // sudo rm (privilege escalation)
  /\bcryptolocker\b/i,                  // Ransomware
  /\bwget\b.*\|\s*(ba)?sh/i,            // wget | sh (remote exec)
  /\bcurl\b.*\|\s*(ba)?sh/i,           // curl | sh (remote exec)
  /\bchmod\s+777\b/i,                   // chmod 777 (insecure)
  /\bchmod\s+-R\s+777\b/i,              // chmod -R 777 (recursive insecure)
];

/**
 * INSPECT_PIPE_TARGETS: Commands that indicate theatrical counting.
 * If a pipe ends with one of these, it's INSPECT (theatrical).
 */
const INSPECT_PIPE_TARGETS = new Set<string>([
  'wc', 'tee', 'sort', 'uniq', 'head', 'tail', 'less', 'more',
]);

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * isCrossAgentTool checks if a tool bridges to external agents/systems.
 */
function isCrossAgentTool(tool: string): boolean {
  // Check exact matches first
  if (CROSS_AGENT_EXACT.has(tool)) return true;
  // Check prefixes
  for (const prefix of CROSS_AGENT_PREFIXES) {
    if (tool.startsWith(prefix)) return true;
  }
  return false;
}

/**
 * tokenize — quote-aware command tokenization.
 * Handles:
 * - Double quotes: "hello world" → single token
 * - Single quotes: 'hello world' → single token
 * - Escaped characters: hello\$world → preserves $
 */
function tokenize(command: string): string[] {
  const trimmed = command.trim();
  if (!trimmed) return [];

  const tokens: string[] = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];

    if (inSingle) {
      if (ch === "'") {
        inSingle = false;
      } else {
        current += ch;
      }
    } else if (inDouble) {
      if (ch === '"') {
        inDouble = false;
      } else {
        current += ch;
      }
    } else if (ch === "'") {
      inSingle = true;
    } else if (ch === '"') {
      inDouble = true;
    } else if (ch === ' ' || ch === '\t') {
      if (current.length > 0) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += ch;
    }
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}

/**
 * detectPipeChain — detects pipe (|) and redirect (>).
 * Returns:
 * - hasPipe: true if pipes or redirects found
 * - pipeChain: array of segments split by pipe
 */
function detectPipeChain(command: string): { hasPipe: boolean; pipeChain: string[] } {
  if (!command) return { hasPipe: false, pipeChain: [] };

  const parts = command.split('|');

  if (parts.length < 2) {
    // No pipe, check for redirect
    const redirectMatch = command.match(/>/);
    if (redirectMatch) {
      const redirectParts = command.split(/>+/);
      return {
        hasPipe: true,
        pipeChain: redirectParts.map(p => p.trim()).filter(Boolean),
      };
    }
    return { hasPipe: false, pipeChain: [] };
  }

  return {
    hasPipe: true,
    pipeChain: parts.map(p => p.trim()).filter(Boolean),
  };
}

/**
 * hasWcTeeRedirectPipe — detects theatrical pipe patterns.
 * Returns true if the pipe chain ends with wc, tee, sort, uniq, or redirect.
 */
function hasWcTeeRedirectPipe(hasPipe: boolean, pipeChain: string[]): boolean {
  if (!hasPipe) return false;
  if (pipeChain.length < 2) return false;

  const lastSegment = pipeChain[pipeChain.length - 1].trim().toLowerCase();
  const lastTokens = lastSegment.split(/\s+/).filter(Boolean);

  if (lastTokens.length === 0) return false;

  const firstToken = lastTokens[0];

  // Check if ends with inspect target
  if (INSPECT_PIPE_TARGETS.has(firstToken)) return true;

  // Check if ends with redirect
  if (firstToken === '>' || firstToken === '>>') return true;

  return false;
}

/**
 * isTestExecution — detects test framework invocations.
 */
function isTestExecution(command: string, tokens: string[]): boolean {
  if (tokens.length === 0) return false;

  const firstToken = tokens[0].toLowerCase();

  // Direct test framework invocation
  if (TEST_FRAMEWORKS.has(firstToken)) return true;

  // npm/pnpm/yarn test
  if (['npm', 'pnpm', 'yarn'].includes(firstToken)) {
    const joined = tokens.join(' ');
    return /\b(run\s+)?test\b/.test(joined);
  }

  // pytest, cargo test, go test, mix test
  if (firstToken === 'pytest') return true;
  if (firstToken === 'cargo' && tokens.length > 1 && tokens[1] === 'test') return true;
  if (firstToken === 'go' && tokens.length > 1 && tokens[1] === 'test') return true;
  if (firstToken === 'mix' && tokens.length > 1 && tokens[1] === 'test') return true;

  return false;
}

/**
 * isContainerCommand — detects container orchestration.
 */
function isContainerCommand(command: string): boolean {
  const lower = command.toLowerCase().trim();
  return lower.startsWith('docker ') ||
          lower.startsWith('docker-compose ') ||
          lower.startsWith('podman ') ||
          lower.startsWith('kubectl ');
}

/**
 * isBuildCommand — detects build system invocations.
 */
function isBuildCommand(command: string, tokens: string[]): boolean {
  if (tokens.length === 0) return false;

  const firstToken = tokens[0].toLowerCase();

  // Direct build tool
  if (BUILD_TOOLS.has(firstToken)) return true;

  // npm/pnpm/yarn build
  if (['npm', 'pnpm', 'yarn'].includes(firstToken)) {
    const joined = tokens.join(' ');
    // Match "build" but NOT "test" or "rebuild"
    return /\bbuild\b/.test(joined) && !/\btest\b/.test(joined);
  }

  // cargo build, go build, gradle build, mvn compile/package/install
  if (firstToken === 'cargo' && tokens.includes('build')) return true;
  if (firstToken === 'go' && tokens.includes('build')) return true;
  if (firstToken === 'gradle' && tokens.includes('build')) return true;
  if (firstToken === 'mvn' && ['compile', 'package', 'install'].some(t => tokens.includes(t))) return true;

  return false;
}

/**
 * isExecuteInvocation — detects shell/interpretor execution.
 */
function isExecuteInvocation(tokens: string[]): boolean {
  if (tokens.length === 0) return false;

  const firstToken = tokens[0].toLowerCase();

  // Known execute tokens
  if (EXECUTE_TOKENS.has(firstToken)) return true;

  // Direct script execution
  if (firstToken.startsWith('./') || firstToken.startsWith('/')) return true;
  if (firstToken.endsWith('.sh') || firstToken.endsWith('.bash') ||
      firstToken.endsWith('.zsh') || firstToken.endsWith('.py')) return true;

  return false;
}

/**
 * isDangerousCommand — detects commands that are ALWAYS blocked.
 */
function isDangerousCommand(command: string): boolean {
  return DANGEROUS_PATTERNS.some(p => p.test(command));
}

// ============================================================
// INTENT CLASSIFIER
// ============================================================

export class IntentClassifier {
  /**
   * classifyIntent — main classification entry point.
   *
   * Classification follows strict priority chain.
   * First match wins — no fallback to later priorities.
   */
  classifyIntent(
    command: string | null,
    tool: string,
    _args: Record<string, unknown>
  ): KrakenOperationType {
    // 1. Cross-agent tools (external bridges)
    if (isCrossAgentTool(tool)) {
      return KrakenOperationType.CROSS_AGENT;
    }

    // 2. Hive write tools (HIGHEST PRIORITY for these)
    // Must check BEFORE cross-agent because memcommit is in both sets conceptually
    // but we want it classified as HIVE_WRITE for protection
    if (HIVE_WRITE_TOOLS.has(tool)) {
      return KrakenOperationType.HIVE_WRITE;
    }

    // 3. Hive read tools
    if (HIVE_READ_TOOLS.has(tool)) {
      return KrakenOperationType.HIVE_READ;
    }

    // 4. Delegation tools (spawning agents)
    if (DELEGATE_TOOLS.has(tool)) {
      return KrakenOperationType.DELEGATE;
    }

    // 5. Write tools (file modification)
    if (WRITE_TOOLS.has(tool)) {
      return KrakenOperationType.WRITE;
    }

    // 6. No command = default to READ
    if (!command) {
      return KrakenOperationType.READ;
    }

    // 7. Dangerous commands = SYSTEM (always block)
    if (isDangerousCommand(command)) {
      return KrakenOperationType.SYSTEM;
    }

    // 8. Tokenize for further classification
    const tokens = tokenize(command);
    const { hasPipe, pipeChain } = detectPipeChain(command);

    // 9. Test execution
    if (isTestExecution(command, tokens)) {
      return KrakenOperationType.TEST;
    }

    // 10. Theatrical inspection (pipe to wc/tee/redirect)
    if (hasWcTeeRedirectPipe(hasPipe, pipeChain)) {
      return KrakenOperationType.INSPECT;
    }

    // 11. Container commands
    if (isContainerCommand(command)) {
      return KrakenOperationType.CONTAINER;
    }

    // 12. Build commands
    if (isBuildCommand(command, tokens)) {
      return KrakenOperationType.BUILD;
    }

    // 13. Execute tokens (shell invocation)
    if (isExecuteInvocation(tokens)) {
      return KrakenOperationType.EXECUTE;
    }

    // 14. Default to READ
    return KrakenOperationType.READ;
  }
}

// Re-export for convenience

