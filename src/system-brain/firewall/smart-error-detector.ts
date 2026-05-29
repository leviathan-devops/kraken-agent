/**
 * SMART ERROR DETECTOR — System Brain Module
 *
 * OCTOPUS BRAIN: Tracks tool failures across agents. When the same
 * approach fails 2+ times, automatically injects relevant Hive context
 * to prevent the agent from wasting time in failure loops.
 *
 * This is NOT reactive — it's PREEMPTIVE. Before the agent even
 * tries the same failed approach again, the system brain injects
 * the correct context to steer it in the right direction.
 *
 * Failure categories and their Hive context mappings:
 * - MODEL_LOADING: Model config, alternative models, API setup
 * - RATE_LIMITING: Alternative models, rate limit workarounds
 * - CONTAINER: Container setup, docker commands, config mounting
 * - BUILD: Build chain errors, compilation fixes, dependency issues
 * - TOOL: Wrong tool usage, parameter errors, tool alternates
 * - TEST: Test failures, test setup, test infrastructure
 * - CONFIG: Configuration errors, config file format, missing keys
 * - NETWORK: Network errors, connectivity, API endpoints
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export interface FailureRecord {
  toolName: string;
  description: string;
  error: string;
  timestamp: number;
  count: number;
  category: string;
}

export interface ContextInjection {
  triggered: boolean;
  category: string;
  failureCount: number;
  hiveTopics: string[];
  specificContext: string;
  actionableAdvice: string;
  correctionMessage: string;
}

// ============================================================
// FAILURE CATEGORY MAPPING
// ============================================================

const FAILURE_CATEGORIES: Record<string, { keywords: RegExp[]; topics: string[]; injectables: string[]; advice: string }> = {
  MODEL_LOADING: {
    keywords: [
      /model/i, /provider/i, /api.?key/i, /endpoint/i, /npm.*@ai-sdk/i,
      /openai-compatible/i, /token.?plan/i, /mimo/i, /minimax/i, /big.?pickle/i,
      /deepseek/i, /gemini/i, /claude/i, /openai/i, /anthropic/i,
      /model.*not.*found/i, /provider.*not.*recognized/i, /unsupported.*model/i,
      /invalid.*model/i, /model.*config/i, /config.*model/i,
    ],
    topics: ['container-testing', 'build-chain'],
    injectables: [
      't1_mimo_token_plan_injectable',
      'HOW_TO_SET_OPENCODE_ZEN_MODEL_IN_CONTAINER',
    ],
    advice: 'STOP. If the current model is rate-limited or unavailable, USE A DIFFERENT MODEL. OpenCode Zen (Big Pickle) is built-in and free — use it as default. MiMo-V2-Pro via Xiaomi Token Plan Singapore is available for smarter testing. Do NOT spend more than 2 attempts getting a specific model to work. SWITCH MODELS and continue.',
  },
  RATE_LIMITING: {
    keywords: [
      /rate.?limit/i, /429/i, /too\s+many\s+requests/i, /quota/i,
      /usage\s+exceeded/i, /free.*exceeded/i, /retry/i, /throttle/i,
      /too\s+hot/i, /overloaded/i, /busy/i, /unavailable/i,
      /try\s+again\s+later/i, /cool.?down/i, /back.?off/i,
    ],
    topics: ['container-testing'],
    injectables: [
      'HOW_TO_SET_OPENCODE_ZEN_MODEL_IN_CONTAINER',
      'container-api-rate-limit-workaround-2026-05-08',
    ],
    advice: 'STOP RETRYING THE SAME RATE-LIMITED MODEL. Switch to OpenCode Zen (Big Pickle) — it is built-in, free, and unlimited. Or use MiMo if you need smarter responses. Do NOT wait for rate limits to clear — SWITCH MODELS IMMEDIATELY.',
  },
  CONTAINER: {
    keywords: [
      /docker/i, /container/i, /image/i, /entrypoint/i, /bind.?mount/i,
      /-v\s/i, /volume/i, /tmux/i, /opencode-test/i, /spawn/i,
      /cannot\s+connect/i, /docker.*daemon/i, /permission\s+denied/i,
      /container.*not.*running/i, /no.*such.*container/i, /port.*already/i,
      /baseline/i, /musl/i, /glibc/i, /binary/i, /wrapper/i,
    ],
    topics: ['tui-testing', 'container-testing', 'build-chain'],
    injectables: [
      'HOW_TO_SET_OPENCODE_ZEN_MODEL_IN_CONTAINER',
    ],
    advice: 'CONTAINER SETUP RULES:\n1. Use image opencode-test:1.14.34\n2. Use baseline binary, NOT wrapper: /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64-baseline/bin/opencode\n3. Config MUST be copy-in (not bind mount)\n4. Entrypoint: sleep 3600\n5. Use tmux for TUI interaction\n6. Mount hive-mind as read-only\n7. Wait 28s after TUI start, then send Escape',
  },
  BUILD: {
    keywords: [
      /build/i, /bundle/i, /compile/i, /typescript/i, /tsc/i, /bun/i,
      /module\s+not\s+found/i, /cannot\s+find\s+module/i, /import/i,
      /export/i, /syntax\s+error/i, /unexpected\s+token/i,
      /resolution/i, /node_modules/i, /package/i, /dependency/i,
    ],
    topics: ['build-chain', 'compaction-survival'],
    injectables: [],
    advice: 'BUILD FIX RULES:\n1. Use `bun build src/index.ts --outdir dist --target bun --format esm --bundle --external @opencode-ai/plugin`\n2. Check import paths — .ts extension only if allowImportingTsExtensions enabled\n3. Type errors that are pre-existing can be ignored — focus on build errors\n4. If module not found, check file exists at the import path\n5. Re-exports from system-brain files need correct relative paths',
  },
  TOOL: {
    keywords: [
      /tool/i, /function/i, /hook/i, /callback/i, /handler/i,
      /not\s+a\s+function/i, /undefined\s+is\s+not/i, /cannot\s+call/i,
      /invalid.*tool/i, /unknown.*tool/i, /tool.*not.*found/i,
      /parameter/i, /arguments?/i, /signature/i, /type.*error/i,
    ],
    topics: ['patterns', 'plugin-engineering'],
    injectables: [],
    advice: 'TOOL FIX RULES:\n1. Check the tool name matches registered tools\n2. Verify parameters match the tool\'s expected signature\n3. Check that hooks (tool.execute.before, chat.message, etc.) are properly registered\n4. agentFilter: null is correct for tool.execute.before (agent name unavailable in v1.14.48)\n5. Args may be in output.args not input.args',
  },
  TEST: {
    keywords: [
      /test/i, /assert/i, /expect/i, /fail(ed|ure|ing)/i,
      /pass(ed|ing|es)/i, /coverage/i, /actual/i, /got:/i,
      /expected:/i, /error:/i, /jest/i, /vitest/i, /mocha/i,
      /bun\s+test/i, /pytest/i, /go\s+test/i, /cargo/i,
    ],
    topics: ['tui-testing', 'failures', 'patterns'],
    injectables: [],
    advice: 'TEST FIX RULES:\n1. Read the test to understand what it expects\n2. Check if the test message matches the patterns being tested\n3. L1/L2 tests now require proper messages that match patterns (not empty messages)\n4. L7 coordination gates need non-empty task data\n5. Don\'t rely on unconditional mechanical checks — tests verify pattern matching',
  },
  CONFIG: {
    keywords: [
      /config/i, /opencode\.json/i, /auth\.json/i, /.env/i,
      /invalid.*config/i, /expected.*config/i, /configuration/i,
      /provider.*config/i, /token/i, /key/i, /secret/i,
      /permission/i, /plugin/i, /agent.*config/i,
    ],
    topics: ['build-chain', 'container-testing'],
    injectables: [],
    advice: 'CONFIG FIX RULES:\n1. Provider config requires npm field for @ai-sdk/openai-compatible\n2. Provider name must match model prefix (e.g., xiaomi-token-plan-sgp/mimo-v2-pro)\n3. API keys go in auth.json, not opencode.json\n4. Plugin paths use file:// prefix\n5. Permission {"*": {"*": "allow"}} for testing',
  },
  NETWORK: {
    keywords: [
      /network/i, /connect/i, /fetch/i, /timeout/i, /dns/i,
      /ENOTFOUND/i, /ECONNREFUSED/i, /ETIMEDOUT/i, /socket/i,
      /SSL/i, /TLS/i, /certificate/i, /proxy/i, /firewall/i,
      /cannot\s+reach/i, /host\s+unreachable/i, /no\s+route/i,
    ],
    topics: ['container-testing'],
    injectables: [],
    advice: 'NETWORK FIX RULES:\n1. Containers need --network host or proper network config\n2. API endpoints must be accessible from the container\n3. Check DNS resolution inside the container\n4. Base URLs need the full path including /v1',
  },
};

// ============================================================
// FAILURE TRACKER
// ============================================================

interface FailureTracker {
  records: Map<string, FailureRecord>;
  totalFailures: number;
  injectionsMade: number;
}

const globalTracker: FailureTracker = {
  records: new Map(),
  totalFailures: 0,
  injectionsMade: 0,
};

function getFailureKey(toolName: string, description: string): string {
  return `${toolName}:${description.slice(0, 50).toLowerCase().trim()}`;
}

// ============================================================
// CATEGORY DETECTION
// ============================================================

export function classifyFailure(description: string, error: string): string {
  const combined = `${description} ${error}`.toLowerCase();

  const scores: Record<string, number> = {};
  for (const [category, config] of Object.entries(FAILURE_CATEGORIES)) {
    let score = 0;
    for (const kw of config.keywords) {
      if (kw.test(combined)) score++;
    }
    scores[category] = score;
  }

  let best = 'UNKNOWN';
  let bestScore = 0;
  for (const [cat, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      best = cat;
    }
  }

  return bestScore > 0 ? best : 'UNKNOWN';
}

// ============================================================
// FAILURE RECORDING & INJECTION DECISION
// ============================================================

export function recordFailure(
  toolName: string,
  description: string,
  error: string,
  hivePaths: string[] = []
): ContextInjection | null {
  const key = getFailureKey(toolName, description);
  const now = Date.now();
  const category = classifyFailure(description, error);

  globalTracker.totalFailures++;

  let record = globalTracker.records.get(key);
  if (!record) {
    record = {
      toolName,
      description: description.slice(0, 100),
      error: error.slice(0, 200),
      timestamp: now,
      count: 0,
      category,
    };
    globalTracker.records.set(key, record);
  }

  record.count++;
  record.timestamp = now;
  record.category = category;

  // ============================================================
  // INJECTION THRESHOLD: 2+ failures → inject context
  // ============================================================
  if (record.count >= 2 && category !== 'UNKNOWN') {
    const config = FAILURE_CATEGORIES[category];
    if (!config) return null;

    globalTracker.injectionsMade++;

    const injection: ContextInjection = {
      triggered: true,
      category,
      failureCount: record.count,
      hiveTopics: config.topics,
      specificContext: '',
      actionableAdvice: config.advice,
      correctionMessage: '',
    };

    // Try to load injectable content from Hive
    const injectableContents: string[] = [];
    for (const name of config.injectables) {
      const content = findInjectable(name, hivePaths);
      if (content) injectableContents.push(content);
    }

    // Build correction message
    injection.correctionMessage = buildInjectionMessage(record, config, injectableContents);

    return injection;
  }

  return null;
}

// ============================================================
// HIVE INJECTABLE LOADER
// ============================================================

function findInjectable(name: string, hivePaths: string[]): string | null {
  for (const base of hivePaths) {
    const locs = [
      join(base, `${name}.md`),
      join(base, `t1_${name}.md`),
      join(base, 'shared', 'memory', `${name}.md`),
      join(base, 'shared', 'memory', `t1_${name}.md`),
      join(base, 'memory', `${name}.md`),
    ];
    for (const loc of locs) {
      try {
        if (existsSync(loc)) return readFileSync(loc, 'utf-8');
      } catch {}
    }
  }
  return null;
}

// ============================================================
// CORRECTION MESSAGE BUILDER
// ============================================================

function buildInjectionMessage(
  record: FailureRecord,
  config: typeof FAILURE_CATEGORIES[string],
  injectableContents: string[]
): string {
  let msg = `\n========================================\n`;
  msg += `SYSTEM BRAIN — SMART ERROR DETECTION\n`;
  msg += `========================================\n\n`;
  msg += `> You have failed "${record.toolName}" ${record.count} times with the SAME approach.\n`;
  msg += `> Category: ${record.category}\n`;
  msg += `> Last error: ${record.error.slice(0, 150)}\n\n`;
  msg += `> RELEVANT HIVE CONTEXT:\n`;
  for (const topic of config.topics) {
    msg += `>   hive-context topic=${topic}\n`;
  }
  msg += `\n> ACTIONABLE ADVICE:\n`;
  for (const line of config.advice.split('\n')) {
    msg += `> ${line}\n`;
  }

  if (injectableContents.length > 0) {
    msg += `\n> INJECTABLE CONTENT:\n`;
    for (const content of injectableContents) {
      const truncated = content.length > 600 ? content.slice(0, 600) + '\n... (truncated — read full injectable with hive-context)' : content;
      msg += `> ---\n${truncated.split('\n').map(l => `> ${l}`).join('\n')}\n> ---\n`;
    }
  }

  msg += `\n> DO NOT RETRY THE SAME APPROACH. Use a DIFFERENT approach, different model, different method. Read the injectable content above.\n`;

  return msg;
}

// ============================================================
// PUBLIC API
// ============================================================

export function resetFailures(): void {
  globalTracker.records.clear();
  globalTracker.totalFailures = 0;
  globalTracker.injectionsMade = 0;
}

export function getFailureStats(): { total: number; injections: number; categories: Record<string, number> } {
  const categories: Record<string, number> = {};
  for (const [, record] of globalTracker.records) {
    categories[record.category] = (categories[record.category] || 0) + record.count;
  }

  return {
    total: globalTracker.totalFailures,
    injections: globalTracker.injectionsMade,
    categories,
  };
}
