/**
 * src/system-brain/firewall/layers/l1-theatrical.ts
 *
 * L1: Theatrical Code Detection
 * Detects functions/tools that claim work was done without doing it.
 */

import type { FirewallContext, FirewallResult } from '../types.js';

/** P2-compliant safe string extraction from args record */
function extractArgString(args: Record<string, unknown>, key: string, defaultValue: string = ''): string {
  const value = args[key];
  return typeof value === 'string' ? value : defaultValue;
}

const THEATRICAL_PATTERNS = [
  { pattern: /return\s*\{\s*success\s*:\s*true\s*\}/, desc: 'Returns {success:true} without side effect' },
  { pattern: /return\s+true\s*;/, desc: 'Returns boolean true without evidence' },
  { pattern: /dispersed\s*:\s*true/, desc: 'Claims dispersed but no spawn call' },
  { pattern: /completed\s*:\s*true/, desc: 'Claims completed without verification' },
  { pattern: /allTestsPass\s*:\s*true/, desc: 'Claims all tests pass without running them' },
];

export function checkL1Theatrical(ctx: FirewallContext): FirewallResult {
  const { tool, args, command } = ctx;

  // Check tool args for theatrical claims
  const argsStr = JSON.stringify(args);
  const checkText = `${command || ''} ${argsStr}`;

  for (const { pattern, desc } of THEATRICAL_PATTERNS) {
    if (pattern.test(checkText)) {
      // If writing code that contains theatrical patterns, block it
      if (tool === 'write' || tool === 'edit') {
        const content = extractArgString(args, 'content') || extractArgString(args, 'new_str');
        if (pattern.test(content)) {
          return {
            blocked: true,
            layer: 'L1',
            reason: `Theatrical code detected: ${desc}`,
            detected: `Pattern matched in ${tool} call`,
            correction: 'Perform the actual side effect before claiming success, or return action_required instructions',
          };
        }
      }
    }
  }

  return {
    blocked: false,
    layer: 'L1',
    reason: 'No theatrical patterns detected',
  };
}
