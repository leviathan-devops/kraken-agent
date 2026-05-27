import { OperationType } from './types.js';

const CROSS_AGENT_TOOLS = new Set<string>([
  'hermes_',
  'hive_',
  'kraken_',
  'memread',
  'memsearch',
  'membrowse',
  'memcommit',
]);

const DANGEROUS_COMMAND_PATTERNS: RegExp[] = [
  /\brm\s+-rf\s+\//i,
  /\bdd\s+if=/i,
  /\bmkfs\b/i,
  /\bchmod\s+777\b/i,
  /:\s*\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;/, // fork bomb (classic)
  /for\s*\(.*\)\s*do\s*.*&\s*;\s*done/i,       // fork bomb loop variant
  /\bfork\s*bomb\b/i,
  /\bsudo\b.*\brm\b/i,
  /\bcryptolocker\b/i,
  /\bwget\b.*\|\s*(ba)?sh/i,
  /\bcurl\b.*\|\s*(ba)?sh/i,
  /\bchmod\s+-R\s+777\b/i,
];

const TEST_FRAMEWORKS = new Set<string>([
  'jest',
  'vitest',
  'mocha',
  'jasmine',
  'ava',
  'tape',
  'karma',
  'cypress',
  'playwright',
  'puppeteer',
  'webdriverio',
]);

const READ_ONLY_TOKENS = new Set<string>([
  'grep',
  'find',
  'ls',
  'cat',
  'head',
  'tail',
  'stat',
  'wc',
  'less',
  'more',
  'file',
  'du',
  'df',
  'uname',
  'whoami',
  'id',
  'echo',
  'printf',
  'pwd',
  'env',
  'printenv',
  'type',
  'which',
  'whereis',
  'tree',
  'readlink',
  'realpath',
  'git',
  'rg',
  'ripgrep',
]);

const BUILD_TOOLS = new Set<string>([
  'make',
  'cmake',
  'ninja',
  'bazel',
  'buck',
  'gradle',
  'mvn',
  'ant',
  'sbt',
]);

const EXECUTE_TOKENS = new Set<string>([
  'npm',
  'npx',
  'node',
  'python',
  'python3',
  'bun',
  'bash',
  'zsh',
  'sh',
  'deno',
  'ts-node',
  'tsx',
  'yarn',
  'pnpm',
  'pip',
  'pip3',
  'cargo',
  'go',
  'rustc',
  'gcc',
  'g++',
  'clang',
  'clang++',
  'dotnet',
  'java',
  'javac',
  'kotlin',
  'scala',
  'swift',
  'perl',
  'ruby',
  'php',
  'lua',
  'zig',
]);

const TOOL_SET_WRITE = new Set<string>([
  'write_file',
  'write',
  'patch',
  'edit',
]);

const TEST_EXECUTION_PATTERNS: RegExp[] = [
  /^npm\s+(run\s+)?test(\s|$)/i,
  /^pnpm\s+(run\s+)?test(\s|$)/i,
  /^yarn\s+test(\s|$)/i,
  /^pytest(\s|$)/i,
  /^cargo\s+test(\s|$)/i,
  /^go\s+test(\s|$)/i,
  /^mix\s+test(\s|$)/i,
  /^jest(\s|$)/i,
  /^vitest(\s|$)/i,
  /^npx\s+(jest|vitest|mocha|cypress|playwright)(\s|$)/i,
  /^phpunit(\s|$)/i,
  /^rspec(\s|$)/i,
];

const CONTAINER_PATTERNS: RegExp[] = [
  /^docker(\s|$)/i,
  /^docker-compose(\s|$)/i,
  /^podman(\s|$)/i,
  /^opencode\s+(run|container|start|exec)/i,
  /^compose(\s|$)/i,
];

const BUILD_COMMAND_PATTERNS: RegExp[] = [
  /^npm\s+((?!test\b)\S+\s+)*build(\s|$)/i,
  /^pnpm\s+((?!test\b)\S+\s+)*build(\s|$)/i,
  /^yarn\s+build(\s|$)/i,
  /^cargo\s+build(\s|$)/i,
  /^go\s+build(\s|$)/i,
  /^make(\s|$)/i,
  /^cmake(\s|$)/i,
  /^ninja(\s|$)/i,
  /^gradle\s+build(\s|$)/i,
  /^mvn\s+(compile|package|install)(\s|$)/i,
];

const INSPECT_PIPE_TARGETS = new Set<string>([
  'wc',
  'tee',
  'sort',
  'uniq',
]);

function isCrossAgentTool(tool: string): boolean {
  for (const prefix of CROSS_AGENT_TOOLS) {
    if (tool.startsWith(prefix)) return true;
  }
  return false;
}

function isDangerousCommand(command: string): boolean {
  return DANGEROUS_COMMAND_PATTERNS.some((p) => p.test(command));
}

function isTestExecution(command: string, tokens: string[]): boolean {
  if (tokens.length === 0) return false;
  const firstToken = tokens[0].toLowerCase();
  if (firstToken === 'npm' || firstToken === 'pnpm' || firstToken === 'yarn') {
    return /^npm\s+(run\s+)?test(\s|$)/i.test(command) ||
      /^pnpm\s+(run\s+)?test(\s|$)/i.test(command) ||
      /^yarn\s+test(\s|$)/i.test(command);
  }
  if (TEST_FRAMEWORKS.has(firstToken)) return true;
  return TEST_EXECUTION_PATTERNS.some((p) => p.test(command));
}

function isContainerCommand(command: string): boolean {
  return CONTAINER_PATTERNS.some((p) => p.test(command));
}

function isBuildCommand(command: string, tokens: string[]): boolean {
  if (tokens.length === 0) return false;
  const firstToken = tokens[0].toLowerCase();
  if (BUILD_TOOLS.has(firstToken)) return true;
  if (firstToken === 'cargo' || firstToken === 'go' || firstToken === 'gradle' || firstToken === 'mvn') {
    return tokens.length > 1;
  }
  return BUILD_COMMAND_PATTERNS.some((p) => p.test(command));
}

function isStatLsRead(tokens: string[]): boolean {
  if (tokens.length === 0) return false;
  const firstToken = tokens[0].toLowerCase();
  if (firstToken !== 'test' && firstToken !== 'stat' && firstToken !== 'ls') return false;
  if (firstToken === 'ls') {
    const hasListingFlags = tokens.some(
      (t) => t === '-l' || t === '-la' || t === '-al' || t.startsWith('-l') || t === '-1'
    );
    return hasListingFlags;
  }
  if (firstToken === 'test') {
    const hasFileFlags = tokens.some((t) => t === '-f' || t === '-d' || t === '-e');
    return hasFileFlags;
  }
  return true;
}

function hasWcTeeRedirectPipe(hasPipe: boolean, pipeChain: string[]): boolean {
  if (!hasPipe) return false;
  if (pipeChain.length < 2) return false;
  const lastSegment = pipeChain[pipeChain.length - 1].trim().toLowerCase();
  const lastTokens = lastSegment.split(/\s+/).filter(Boolean);
  if (lastTokens.length === 0) return false;
  const firstToken = lastTokens[0];
  if (INSPECT_PIPE_TARGETS.has(firstToken)) return true;
  if (firstToken === '>' || firstToken === '>>') return true;
  return false;
}

function isExecuteInvocation(tokens: string[]): boolean {
  if (tokens.length === 0) return false;
  const firstToken = tokens[0].toLowerCase();
  if (EXECUTE_TOKENS.has(firstToken)) return true;
  if (firstToken.startsWith('./') || firstToken.startsWith('/')) return true;
  if (firstToken.endsWith('.sh') || firstToken.endsWith('.bash') || firstToken.endsWith('.zsh')) return true;
  return false;
}

/**
 * isReadOnlyCommand determines whether a command is a safe read-only operation.
 * Returns true for commands that do not modify system state.
 */
export function isReadOnlyCommand(command: string | null, tool: string, tokens: string[]): boolean {
  if (!command) {
    return TOOL_SET_WRITE.has(tool) ? false : true;
  }
  if (TOOL_SET_WRITE.has(tool)) return false;
  if (isDangerousCommand(command)) return false;
  if (tokens.length === 0) return true;
  const firstToken = tokens[0].toLowerCase();
  if (firstToken === 'git') return true;
  if (READ_ONLY_TOKENS.has(firstToken)) return true;
  if (firstToken === 'npm' || firstToken === 'pnpm' || firstToken === 'yarn') {
    const joined = tokens.join(' ');
    return !/\b(run|exec|start|test|build|deploy|publish|link|add)\b/i.test(joined);
  }
  return false;
}

function tokenizeCommand(command: string): string[] {
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
  if (current.length > 0) tokens.push(current);
  return tokens;
}

function detectPipeChain(command: string): { hasPipe: boolean; pipeChain: string[] } {
  if (!command) return { hasPipe: false, pipeChain: [] };
  const parts = command.split('|');
  if (parts.length < 2) {
    const redirectMatch = command.match(/>/);
    if (redirectMatch) {
      const redirectParts = command.split(/>+/);
      return {
        hasPipe: true,
        pipeChain: redirectParts.map((p) => p.trim()).filter(Boolean),
      };
    }
    return { hasPipe: false, pipeChain: [] };
  }
  return {
    hasPipe: true,
    pipeChain: parts.map((p) => p.trim()).filter(Boolean),
  };
}

export interface IntentClassifierInput {
  command: string | null;
  tool: string;
  args: Record<string, unknown>;
}

export class IntentClassifier {
  /**
   * classifyIntent classifies a command into an OperationType.
   * Classification follows a strict priority:
   *  1. Cross-agent tools → CROSS_AGENT
   *  2. Dangerous commands → SYSTEM
   *  3. write_file/patch/edit tools → WRITE
   *  4. Test execution → TEST
   *  5. test/stat/ls with flags and no pipe → READ
   *  6. Pipe chain with wc/tee/redirect → INSPECT
   *  7. Container commands → CONTAINER
   *  8. Build commands → BUILD
   *  9. Execute tokens → EXECUTE
   * 10. Default → READ
   */
  classifyIntent(command: string | null, tool: string, args: Record<string, unknown>): OperationType {
    if (isCrossAgentTool(tool)) {
      return OperationType.CROSS_AGENT;
    }

    if (command && isDangerousCommand(command)) {
      return OperationType.SYSTEM;
    }

    if (TOOL_SET_WRITE.has(tool)) {
      return OperationType.WRITE;
    }

    if (!command) {
      return OperationType.READ;
    }

    const tokens = tokenizeCommand(command);
    const { hasPipe, pipeChain } = detectPipeChain(command);

    if (isTestExecution(command, tokens)) {
      return OperationType.TEST;
    }

    if (isStatLsRead(tokens) && !hasWcTeeRedirectPipe(hasPipe, pipeChain)) {
      return OperationType.READ;
    }

    if (hasWcTeeRedirectPipe(hasPipe, pipeChain)) {
      return OperationType.INSPECT;
    }

    if (isContainerCommand(command)) {
      return OperationType.CONTAINER;
    }

    if (isBuildCommand(command, tokens)) {
      return OperationType.BUILD;
    }

    if (isExecuteInvocation(tokens)) {
      return OperationType.EXECUTE;
    }

    return OperationType.READ;
  }
}
