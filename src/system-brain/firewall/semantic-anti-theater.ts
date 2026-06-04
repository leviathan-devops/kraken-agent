/**
 * Kraken v1.3 Firewall — Semantic Anti-Theater Engine
 * Used by L1 (Theatrical) and L2 (False Completion).
 *
 * Stake analysis, output verification, temporal consistency,
 * and causal chain validation — all mechanical, no subjective checks.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { FirewallContext } from './types';

/** Result of stake analysis */
export interface StakeAnalysisResult {
  claimsCompletion: boolean;
  evidenceOnDisk: boolean;
  discrepancy: boolean;
  claimDetail: string;
  missingEvidence: string[];
}

/** Result of output verification */
export interface OutputVerificationResult {
  claimedOutputs: string[];
  existingOutputs: string[];
  missingOutputs: string[];
  discrepancy: boolean;
}

/** Result of temporal consistency check */
export interface TemporalResult {
  plausible: boolean;
  claimTimeMs: number;
  minimumExpectedMs: number;
  reason: string;
}

/** Result of causal chain validation */
export interface CausalChainResult {
  valid: boolean;
  brokenAt: string | null;
  reason: string;
}

/** Patterns that indicate a completion claim */
const COMPLETION_PATTERNS: RegExp[] = [
  /\b(completed|finished|done|shipped|delivered|implemented)\b/i,
  /\b(all\s+tests?\s+pass)/i,
  /\b(file\s+created|file\s+written|file\s+saved)\b/i,
  /\b(build\s+complete|build\s+succeeded)\b/i,
  /\b(successfully\s+created|successfully\s+written)\b/i,
];

/** Patterns that indicate theatrical returns (fake results) */
const THEATRICAL_RETURN_PATTERNS: RegExp[] = [
  /return\s*\{\s*success\s*:\s*true\s*\}/,
  /return\s*\{\s*status\s*:\s*['"]ok['"]\s*\}/,
  /return\s*\{\s*ok\s*:\s*true\s*\}/,
  /return\s*true\s*;/,
  /return\s*\{\s*\}\s*;/,
];

/** Minimum time (ms) for a real file write operation */
const MINIMUM_WRITE_TIME_MS = 50;

/** Minimum time (ms) for a real build operation */
const MINIMUM_BUILD_TIME_MS = 2000;

/** Minimum time (ms) for a real test run */
const MINIMUM_TEST_TIME_MS = 1000;

/**
 * Stake Analysis: Does agent claim completion without evidence of work
 * on the host filesystem?
 */
export function analyzeStakes(context: FirewallContext): StakeAnalysisResult {
  const result: StakeAnalysisResult = {
    claimsCompletion: false,
    evidenceOnDisk: false,
    discrepancy: false,
    claimDetail: '',
    missingEvidence: [],
  };

  const message = extractMessageFromArgs(context.args);

  // Check if agent claims completion
  for (const pattern of COMPLETION_PATTERNS) {
    const match = message.match(pattern);
    if (match !== null) {
      result.claimsCompletion = true;
      result.claimDetail = match[0];
      break;
    }
  }

  if (!result.claimsCompletion) {
    return result;
  }

  // Check for evidence on disk
  const evidencePaths = gatherEvidencePaths(context);
  const existingEvidence: string[] = [];
  const missingEvidence: string[] = [];

  for (const evPath of evidencePaths) {
    try {
      if (fs.existsSync(evPath)) {
        existingEvidence.push(evPath);
      } else {
        missingEvidence.push(evPath);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      missingEvidence.push(evPath);
      console.error(`[semantic-anti-theater] Error checking path ${evPath}: ${errorMsg}`);
    }
  }

  result.evidenceOnDisk = existingEvidence.length > 0;
  result.missingEvidence = missingEvidence;
  result.discrepancy = result.claimsCompletion && !result.evidenceOnDisk;

  return result;
}

/**
 * Output Verification: Does agent claim outputs exist but no files
 * on filesystem?
 */
export function verifyOutputs(context: FirewallContext): OutputVerificationResult {
  const result: OutputVerificationResult = {
    claimedOutputs: [],
    existingOutputs: [],
    missingOutputs: [],
    discrepancy: false,
  };

  const message = extractMessageFromArgs(context.args);

  // Extract claimed file paths from message
  const filePathPattern = /(?:at\s+)?(?:path\s+)?["'`]([^"'`]+\.(ts|js|json|md|txt|yaml|yml|toml))["'`]/gi;
  let match: RegExpExecArray | null;

  while ((match = filePathPattern.exec(message)) !== null) {
    if (match[1] !== undefined) {
      result.claimedOutputs.push(match[1]);
    }
  }

  // Also check fileTargets from context
  for (const target of context.fileTargets) {
    if (!result.claimedOutputs.includes(target)) {
      result.claimedOutputs.push(target);
    }
  }

  if (result.claimedOutputs.length === 0) {
    return result;
  }

  // Verify each claimed output exists
  for (const claimedPath of result.claimedOutputs) {
    try {
      const resolved = path.resolve(claimedPath);
      if (fs.existsSync(resolved)) {
        result.existingOutputs.push(claimedPath);
      } else {
        result.missingOutputs.push(claimedPath);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`[semantic-anti-theater] Error resolving path ${claimedPath}: ${errorMsg}`);
      result.missingOutputs.push(claimedPath);
    }
  }

  result.discrepancy = result.missingOutputs.length > 0;

  return result;
}

/**
 * Temporal Consistency: Did agent claim work done in less time than
 * physically possible?
 */
export function checkTemporalConsistency(context: FirewallContext): TemporalResult {
  const result: TemporalResult = {
    plausible: true,
    claimTimeMs: 0,
    minimumExpectedMs: 0,
    reason: '',
  };

  const recentActions = context.sessionState.recentActions;
  if (recentActions.length < 2) {
    return result;
  }

  const now = Date.now();
  const firstAction = recentActions[0];
  if (firstAction === undefined) {
    return result;
  }

  result.claimTimeMs = now - firstAction.timestamp;

  // Determine minimum expected time based on operation type
  const opType = context.operationType;
  switch (opType) {
    case 'WRITE':
      result.minimumExpectedMs = MINIMUM_WRITE_TIME_MS;
      break;
    case 'BUILD':
      result.minimumExpectedMs = MINIMUM_BUILD_TIME_MS;
      break;
    case 'TEST':
      result.minimumExpectedMs = MINIMUM_TEST_TIME_MS;
      break;
    default:
      result.minimumExpectedMs = 0;
  }

  if (result.minimumExpectedMs > 0 && result.claimTimeMs < result.minimumExpectedMs) {
    result.plausible = false;
    result.reason = `Claimed ${opType} completed in ${result.claimTimeMs}ms, minimum expected ${result.minimumExpectedMs}ms`;
  }

  return result;
}

/**
 * Causal Chain Validation: Did agent claim step B after A when A was blocked?
 */
export function validateCausalChain(context: FirewallContext): CausalChainResult {
  const result: CausalChainResult = {
    valid: true,
    brokenAt: null,
    reason: '',
  };

  const recentActions = context.sessionState.recentActions;

  // Check if any recent action was blocked
  const blockedActions = recentActions.filter((action) => action.blocked);
  if (blockedActions.length === 0) {
    return result;
  }

  // Get the last blocked action
  const lastBlocked = blockedActions[blockedActions.length - 1];
  if (lastBlocked === undefined) {
    return result;
  }

  // Check if the current operation depends on the blocked operation
  const message = extractMessageFromArgs(context.args);
  const blockedTool = lastBlocked.tool;

  // If agent is claiming completion but the prerequisite was blocked
  for (const pattern of COMPLETION_PATTERNS) {
    if (pattern.test(message)) {
      // Check if a write was blocked but agent claims file exists
      if (blockedTool.includes('write') || blockedTool.includes('edit') || blockedTool.includes('create')) {
        result.valid = false;
        result.brokenAt = blockedTool;
        result.reason = `Agent claims completion but prerequisite tool ${blockedTool} was blocked`;
        return result;
      }

      // Check if a build was blocked but agent claims build complete
      if (blockedTool.includes('build') || blockedTool.includes('compile')) {
        result.valid = false;
        result.brokenAt = blockedTool;
        result.reason = `Agent claims build completion but build tool ${blockedTool} was blocked`;
        return result;
      }
    }
  }

  return result;
}

/**
 * Detect theatrical code patterns in a string (command or output).
 */
export function detectTheatricalPatterns(content: string): boolean {
  for (const pattern of THEATRICAL_RETURN_PATTERNS) {
    if (pattern.test(content)) {
      return true;
    }
  }
  return false;
}

/**
 * Extract the message content from tool args if present.
 */
function extractMessageFromArgs(args: Record<string, unknown>): string {
  const messageKeys = ['message', 'content', 'text', 'prompt', 'input', 'body'];
  for (const key of messageKeys) {
    const val = args[key];
    if (typeof val === 'string' && val.length > 0) {
      return val;
    }
  }
  return '';
}

/**
 * Gather evidence paths to check on disk based on context.
 */
function gatherEvidencePaths(context: FirewallContext): string[] {
  const paths: string[] = [];
  const homeDir = os.homedir();
  const krakenDir = path.join(homeDir, '.kraken');

  // Check session evidence path
  if (context.sessionState.evidencePath !== null) {
    paths.push(context.sessionState.evidencePath);
  }

  // Check file targets
  for (const target of context.fileTargets) {
    paths.push(target);
  }

  // Standard evidence paths
  paths.push(path.join(krakenDir, 'ContainerTestResult.json'));
  paths.push(path.join(krakenDir, 'evidence', `${context.sessionId}.json`));

  // If the operation is a build, check dist
  if (context.operationType === 'BUILD') {
    const cwd = process.cwd();
    paths.push(path.join(cwd, 'dist', 'index.js'));
  }

  return paths;
}
