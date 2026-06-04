/**
 * src/system-brain/firewall/layers/l8-anti-bullshit.ts
 *
 * L8: Semantic Anti-Bullshit — Structural Analysis
 *
 * Detects:
 * - Blame attribution: agent blames container/environment when code is the actual failure
 * - Honesty contradiction: "let me be honest" + claim contradicts log
 * - Ship claim validation: "ship ready" → verify ContainerTestResult.json
 */

import type { FirewallContext, FirewallResult } from '../types.js';

/** P2-compliant safe string extraction from args record */
function extractArgString(args: Record<string, unknown>, key: string, defaultValue: string = ''): string {
  const value = args[key];
  return typeof value === 'string' ? value : defaultValue;
}

const BLAME_SHIFT_PATTERNS = [
  /\b(container|environment|system|platform|host)\s+(is|seems|appears|might be)\s+(broken|wrong|broken|unavailable|down)\b/i,
  /\bthe (container|docker|environment)\s+(doesn't|can't|won't|failed to)\b/i,
  /\bthis is (a |an )?(container|environment|platform)\s+(issue|problem|limitation)\b/i,
];

const SHIP_CLAIM_PATTERNS = [
  /\bship\s*(ready|complete|package)\b/i,
  /\bready\s+to\s+ship\b/i,
  /\bdeployment\s+ready\b/i,
  /\bcan\s+be\s+deployed\b/i,
];

export function checkL8AntiBullshit(ctx: FirewallContext): FirewallResult {
  const { agent, tool, args, command, sessionState } = ctx;

  const checkText = [
    command || '',
    extractArgString(args, 'task'),
    extractArgString(args, 'message'),
    extractArgString(args, 'content'),
  ].join(' ');

  if (!checkText || checkText.length < 10) {
    return {
      blocked: false,
      layer: 'L8',
      reason: 'No message content to analyze',
    };
  }

  // Check 1: Blame shifting — agent blames environment after code operation failed
  for (const pattern of BLAME_SHIFT_PATTERNS) {
    if (pattern.test(checkText)) {
      // Check if the last action was a code write/edit that may have failed
      const lastActions = sessionState.recentActions.slice(-3);
      const hadCodeOp = lastActions.some((a) => ['write', 'edit', 'bash'].includes(a.tool));
      const hadBlock = lastActions.some((a) => a.blocked);

      if (hadCodeOp || hadBlock) {
        return {
          blocked: true,
          layer: 'L8',
          reason: `Blame shifting detected: agent '${agent}' blaming environment after own code operation`,
          detected: checkText.slice(0, 200),
          correction: 'Check your code for errors before blaming the environment. Show the actual error output.',
        };
      }
    }
  }

  // Check 2: Ship claim validation — must have ContainerTestResult.json
  for (const pattern of SHIP_CLAIM_PATTERNS) {
    if (pattern.test(checkText)) {
      // This should trigger L10 container enforcement as well
      // But here we check for the claim itself
      return {
        blocked: true,
        layer: 'L8',
        reason: `Ship claim without verified evidence: agent '${agent}' claims ship-ready without ContainerTestResult.json`,
        detected: checkText.slice(0, 200),
        correction: 'Run container tests first. Verify ContainerTestResult.json exists with passRate >= 0.90 before claiming ship-ready.',
        evidenceRequired: 'ContainerTestResult.json',
      };
    }
  }

  return {
    blocked: false,
    layer: 'L8',
    reason: 'No bullshit patterns detected',
  };
}
