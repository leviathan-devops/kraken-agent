/**
 * src/execution-brain/rge/l0-syntactic.ts
 *
 * L0: Syntactic Pre-Filter
 *
 * This is the ONLY layer where regex is acceptable.
 * Fast pattern matching to catch high-signal mechanical violations before
 * the expensive semantic layers run.
 *
 * Checks:
 * - Empty catch blocks → P3
 * - Hardcoded paths → P7
 * - Unchecked `as` casts → P2
 * - Floating promises → P9
 * - Theatrical returns → P11
 * - TODO/FIXME/HACK → MEDIUM flag
 */

import type { RGELayerResult, RGEViolation } from './types.js';
import { RGELayer } from './types.js';
import * as fs from 'fs';
import * as path from 'path';

interface PatternRule {
  pattern: RegExp;
  principle: string;
  severity: RGEViolation['severity'];
  message: string;
  fix: string;
}

const SYNTACTIC_RULES: PatternRule[] = [
  {
    pattern: /\bcatch\s*\(\s*\w*\s*\)\s*\{\s*\}/g,
    principle: 'P3',
    severity: 'CRITICAL',
    message: 'Empty catch block — errors are silently swallowed (P3 violation)',
    fix: 'Add logging, recovery, or propagation to the catch block',
  },
  {
    pattern: /\bcatch\s*\{\s*\}/g,
    principle: 'P3',
    severity: 'CRITICAL',
    message: 'Empty catch block without error variable — errors silently swallowed (P3 violation)',
    fix: 'Add catch(error) with logging, recovery, or propagation',
  },
  {
    pattern: /['"]\/home\/[a-zA-Z_][a-zA-Z0-9_]*\//g,
    principle: 'P7',
    severity: 'CRITICAL',
    message: 'Hardcoded /home/username path — only works on one machine (P7 violation)',
    fix: 'Use os.homedir() + path.join() instead',
  },
  {
    pattern: /['"]C:\\Users\\[a-zA-Z_]/g,
    principle: 'P7',
    severity: 'CRITICAL',
    message: 'Hardcoded Windows user path — only works on one machine (P7 violation)',
    fix: 'Use os.homedir() + path.join() instead',
  },
  {
    pattern: /\bas\s+[A-Z][a-zA-Z]+/g,
    principle: 'P2',
    severity: 'HIGH',
    message: 'Unchecked `as` cast — type assertion without runtime validation (P2 violation)',
    fix: 'Add a runtime type check before the cast (typeof, instanceof, Array.isArray, or schema validation)',
  },
  {
    pattern: /\.\s*then\s*\([^)]*\)\s*(?!\.\s*catch)/g,
    principle: 'P9',
    severity: 'CRITICAL',
    message: 'Floating promise — .then() without .catch() (P9 violation)',
    fix: 'Add .catch() handler or use await with try/catch',
  },
  {
    pattern: /\breturn\s*\{\s*success\s*:\s*true\s*\}/g,
    principle: 'P11',
    severity: 'CRITICAL',
    message: 'Theatrical return — returning {success:true} without performing the claimed side effect (P11 violation)',
    fix: 'Perform the actual side effect before returning, or return action_required instructions',
  },
  {
    pattern: /\breturn\s+true\s*;/g,
    principle: 'P11',
    severity: 'HIGH',
    message: 'Theatrical boolean return — returning true without evidence (P11 violation)',
    fix: 'Return evidence-based result or throw if operation failed',
  },
  {
    pattern: /\/\*[\s\S]*?\*\/|\/\/.*$/gm, // We'll filter TODO/FIXME from comments
    principle: 'STYLE',
    severity: 'MEDIUM',
    message: '',
    fix: '',
  },
];

const TODO_RULES: PatternRule[] = [
  {
    pattern: /\bTODO\b/g,
    principle: 'SPEC',
    severity: 'MEDIUM',
    message: 'TODO comment — indicates incomplete implementation',
    fix: 'Implement the feature or remove the TODO',
  },
  {
    pattern: /\bFIXME\b/g,
    principle: 'SPEC',
    severity: 'MEDIUM',
    message: 'FIXME comment — known broken code',
    fix: 'Fix the known issue or document why it is acceptable',
  },
  {
    pattern: /\bHACK\b/g,
    principle: 'SPEC',
    severity: 'MEDIUM',
    message: 'HACK comment — workaround instead of proper fix',
    fix: 'Replace the hack with a proper implementation',
  },
];

async function checkFile(
  filePath: string,
  rules: PatternRule[],
): Promise<RGEViolation[]> {
  const violations: RGEViolation[] = [];

  let content: string;
  try {
    content = await fs.promises.readFile(filePath, 'utf-8');
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[L0] Cannot read file ${filePath}: ${errMsg}`);
    return violations;
  }

  const lines = content.split('\n');

  for (const rule of rules) {
    if (rule.principle === 'STYLE') {
      continue; // Skip the comment-matching meta rule
    }

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      // Skip comment-only lines for non-TODO checks
      const trimmedLine = line.trim();
      if (
        rule.principle !== 'SPEC' &&
        (trimmedLine.startsWith('//') || trimmedLine.startsWith('*') || trimmedLine.startsWith('/*'))
      ) {
        continue;
      }

      const matches = trimmedLine.match(rule.pattern);
      if (matches && matches.length > 0) {
        // For P2 `as` casts, check if there's a preceding runtime check on the same or previous line
        if (rule.principle === 'P2') {
          const prevLine = lineIdx > 0 ? lines[lineIdx - 1] : '';
          const hasRuntimeCheck =
            /typeof\s+\w+\s*(===?|!==?)\s*['"]/.test(prevLine) ||
            /instanceof\s+/.test(prevLine) ||
            /Array\.isArray\s*\(/.test(prevLine) ||
            /typeof\s+\w+\s*(===?|!==?)\s*['"]/.test(trimmedLine.slice(0, trimmedLine.indexOf(' as ')));
          if (hasRuntimeCheck) {
            continue; // Cast is checked — skip
          }
        }

        violations.push({
          principle: rule.principle,
          layer: RGELayer.L0_SYNTACTIC,
          message: rule.message,
          file: filePath,
          line: lineIdx + 1,
          severity: rule.severity,
          fix: rule.fix,
          nodeText: trimmedLine.slice(0, 120),
        });
      }
    }
  }

  return violations;
}

export async function checkL0Syntactic(
  sourceFiles: string[],
  _projectRoot: string,
): Promise<RGELayerResult> {
  const startTime = Date.now();
  const allViolations: RGEViolation[] = [];
  let checksRun = 0;
  let checksPassed = 0;

  const allRules = [...SYNTACTIC_RULES, ...TODO_RULES];

  for (const file of sourceFiles) {
    const violations = await checkFile(file, allRules);
    checksRun += allRules.length; // Each rule counts as a check per file
    if (violations.length === 0) {
      checksPassed += allRules.length;
    } else {
      checksPassed += allRules.length - violations.length;
    }
    allViolations.push(...violations);
  }

  const durationMs = Date.now() - startTime;

  return {
    layer: RGELayer.L0_SYNTACTIC,
    passed: allViolations.filter((v) => v.severity === 'CRITICAL').length === 0,
    violations: allViolations,
    checksRun,
    checksPassed: Math.max(0, checksPassed),
    durationMs,
  };
}
