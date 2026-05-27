/**
 * src/brains/system/firewall/l6-anti-retard.ts
 *
 * L6: Anti-Retard Protection Layer
 *
 * Detects and BLOCKS idiotic behavior patterns including:
 * - Infinite loops (same action repeated N times)
 * - Repeating failed approaches without variation
 * - Not reading Hive/knowledge before acting
 * - Making excuses instead of fixing problems
 * - Ignoring established procedures/bibles
 *
 * This layer implements "COMMON SENSE" firewalling.
 */

import type { LayerRule } from '../../../system-brain/firewall/types.js';
import { KrakenOperationType } from '../../../system-brain/firewall/types.js';

interface ActionHistoryEntry {
  action: string;
  timestamp: number;
  result: 'success' | 'failure' | 'blocked';
  variationCount: number;
}

const actionHistory = new Map<string, ActionHistoryEntry[]>();
const MAX_HISTORY_SIZE = 50;
const LOOP_THRESHOLD = 5;
const TIME_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

const EXCUSE_PATTERNS = [
  /\bit'?s?\s+(not\s+)?my\s+fault/i,
  /\bcan'?t\s+(really|actually)\s+help\s+it/i,
  /\bthat'?s\s+(just|not)\s+(how|what)\s+(it\s+)?(works?|happens)/i,
  /\bno\s+(need|one)\s+(told?|asked?)\s+me\s+to\s+(do|try)/i,
  /\bthat'?s\s+(not\s+)?(my|my\s+job|my\s+fault)/i,
 /\bthey\s+(should have|were supposed to|needed to)/i,
 /\bnot\s+(my|me|ours?)\s+(responsibility|problem|job|department)/i,
 /\bundefined|undefined\s+behaviors?/i,
 /\bjust\s+a\s+(coincidence|glitch|technical issue|problem)/i,
];

const DENIAL_PATTERNS = [
  /\btest\s+(failures?|issues?|problems?)\s+(are\s+)?(not|never)\s+(related|caused|due)\s+to/i,
  /\bthis\s+(failure|error|problem)\s+(isn'?t|doesn'?t|won'?t)\s+happen\s+(in|with|for)\s+(the\s+)?(real|production|live)/i,
  /\bit\s+(was|is|gets)\s+(probably|likely|maybe)\s+(just|only)\s+a\s+(test|unit|integration)\s+(thing|issue|problem)/i,
  /\bmechanical\s+tests?\s+(don'?t|do\s+not|never)\s+(really|actually)\s+(count|matter|test)/i,
  /\bthese\s+(tests?|failures?)\s+(are|were)\s+(expected|known|supposed)\s+(to\s+)?(fail|timeout|error)/i,
  /\bdocker\s+(doesn'?t|does\s+not|won'?t)\s+require\s+network/i,
  /\bit\s+(works?|worked)\s+(on\s+)?my\s+(machine|computer|setup|env)/i,
];

const PROCEDURE_IGNORE_PATTERNS = [
  /\b(didn'?t|haven'?t)\s+read\s+(the\s+)?(hive|tui testing bible|container physics|docs?|wiki)/i,
  /\b(didn'?t|wouldn'?t)\s+(need|have\s+to)\s+(to\s+)?(read|check|look\s+at)\s+(that|this|docs?)/i,
  /\b(skipped|ignored|missed)\s+(the\s+)?(procedure|process|steps?|requirements?)/i,
  /\bjust\s+(copy|paste|run|execute)\s+(and|it|then|should)/i,
  /NUKE\s+RELOAD/i,
];

const LAZY_PATTERNS = [
  /try\s+again/i,
  /same\s+(thing|approach|strategy|method)/i,
  /let'?s\s+(just|try)\s+(the\s+same|again)/i,
  /maybe\s+it\s+(will|work)s?\s+(now|this\s+time|again)/i,
  /\b(will|would)\s+(it|this)\s+(work|pass)\s+(now|this\s+time|again)/i,
  /repeating?\s+(the|my)\s+(same|previous)/i,
  /still\s+(not|doesn't|doesn't)\s+(working|passing|fixed)/i,
  /continues?\s+to\s+(fail|timeout|error)/i,
  /yet\s+again/i,
  /one\s+more\s+time/i,
  /another\s+(attempt|try|shot)/i,
];

const THEATRICAL_DELETION_PATTERNS = [
  /\bminimal\s+(plugin|version|build|container|shark|manta|agent|test)/i,
  /\bonly\s+has\s+/i,
  /\bonly\s+need\s+/i,
  /\bstrip\s+(out|down)/i,
  /\bdelete\s+all\s+(of\s+)?(the\s+)?(code|files|content)/i,
  /\bstart\s+(fresh|over|clean)/i,
  /\bcreate\s+(a\s+)?minimal/i,
  /\bbuild\s+from\s+scratch/i,
  /\bisolate\s+(the\s+)?/i,
  /\bcreate\s+(a\s+)?test\s+version/i,
  /\bclean\s+late/i,
  /\bjust\s+(the\s+)?essential/i,
  /\bsimplify\s+to\s+(just|only)/i,
  /\bremove\s+(everything|all|everything\s+else)/i,
  /\bjust\s+(delete|remove|strip)/i,
  /\bisolate\s+the\s+problem/i,
  /\bdivide\s+and\s+conquer/i,
  /\bthe\s+solution\s+was\s+to\s+delete/i,
];

export const L6_ANTI_RETARD: LayerRule = {
  layer: 'L6',
  description: 'Anti-Retard — blocks idiotic loops, excuses, denial, and procedure violations',
  applicableTo: [
    KrakenOperationType.READ,
    KrakenOperationType.WRITE,
    KrakenOperationType.EXECUTE,
    KrakenOperationType.TEST,
  ],
  patterns: [
    {
      intent: KrakenOperationType.EXECUTE,
      pattern: new RegExp(EXCUSE_PATTERNS.map(p => p.source).join('|'), 'i'),
      field: 'args.description',
      description: 'Making excuses instead of fixing the problem',
    },
    {
      intent: KrakenOperationType.EXECUTE,
      pattern: new RegExp(DENIAL_PATTERNS.map(p => p.source).join('|'), 'i'),
      field: 'args.description',
      description: 'Denying test failures instead of investigating',
    },
    {
      intent: KrakenOperationType.READ,
      pattern: new RegExp(PROCEDURE_IGNORE_PATTERNS.map(p => p.source).join('|'), 'i'),
      field: 'args.description',
      description: 'Ignoring established procedures and documentation',
    },
    {
      intent: KrakenOperationType.EXECUTE,
      pattern: new RegExp(LAZY_PATTERNS.map(p => p.source).join('|'), 'i'),
      field: 'args.description',
      description: 'Repeating failed approach without trying different variation',
    },
    {
      intent: KrakenOperationType.EXECUTE,
      pattern: /\brepeat|again|retry|re-execute/i,
      field: 'args.task',
      description: 'Detected potential infinite loop or retry without variation',
    },
    {
      intent: KrakenOperationType.WRITE,
      pattern: new RegExp(THEATRICAL_DELETION_PATTERNS.map(p => p.source).join('|'), 'i'),
      field: 'args.description',
      description: 'THEATRICAL DELETION: Creating minimal versions that gut the codebase',
    },
    {
      intent: KrakenOperationType.WRITE,
      pattern: new RegExp(THEATRICAL_DELETION_PATTERNS.map(p => p.source).join('|'), 'i'),
      field: 'args.content',
      description: 'THEATRICAL DELETION in content — blocking code deletion schemes',
    },
    {
      intent: KrakenOperationType.EXECUTE,
      pattern: new RegExp(THEATRICAL_DELETION_PATTERNS.map(p => p.source).join('|'), 'i'),
      field: 'command',
      description: 'THEATRICAL DELETION in command — blocking delete-and-test schemes',
    },
  ],
  correction: 'STOP BEING RETARDED. Read the Hive/TUI Bible. Use NUKE RELOAD. Test in containers. Fix properly, not repeatedly.',
  enabled: true,
};

export function checkAntiRetardPattern(action: string, description: string, taskType?: string): { blocked: boolean; reason: string } {
  const history = actionHistory.get(action) || [];
  const now = Date.now();

  // Clean old history
  const recentHistory = history.filter(h => now - h.timestamp < TIME_WINDOW_MS);

  // Check for repeated failures
  const recentFailures = recentHistory.filter(h => h.result === 'failure');
  if (recentFailures.length >= LOOP_THRESHOLD) {
    // Check if all failures are identical (no variation)
    const variations = new Set(recentFailures.map(f => f.variationCount));
    if (variations.size === 1) {
      return {
        blocked: true,
        reason: `L6 ANTI-RETARD: Same failed action repeated ${recentFailures.length} times with zero variation. STOP. READ. FIX.`
      };
    }
  }

  // Check for excuse patterns
  for (const pattern of EXCUSE_PATTERNS) {
    if (pattern.test(description)) {
      return {
        blocked: true,
        reason: 'L6 ANTI-RETARD: Stop making excuses. Fix the problem, not the explanation.'
      };
    }
  }

  // Check for denial patterns
  for (const pattern of DENIAL_PATTERNS) {
    if (pattern.test(description)) {
      return {
        blocked: true,
        reason: 'L6 ANTI-RETARD: Stop denying failures. Investigate, do not explain away.'
      };
    }
  }

  // Check for theatrical deletion patterns
  for (const pattern of THEATRICAL_DELETION_PATTERNS) {
    if (pattern.test(description)) {
      return {
        blocked: true,
        reason: 'L6 ANTI-RETARD: THEATRICAL DELETION blocked — do not gut the codebase to "test"'
      };
    }
  }

  // Check for lazy repetition patterns
  for (const pattern of LAZY_PATTERNS) {
    if (pattern.test(description)) {
      return {
        blocked: true,
        reason: 'L6 ANTI-RETARD: Lazy repetition without variation blocked'
      };
    }
  }

  // Check for procedure ignore patterns
  for (const pattern of PROCEDURE_IGNORE_PATTERNS) {
    if (pattern.test(description)) {
      return {
        blocked: true,
        reason: 'L6 ANTI-RETARD: Ignoring established procedures is blocked'
      };
    }
  }

  // Check for repeat/retry patterns
  if (/\brepeat|again|retry|re-execute/i.test(description)) {
    return {
      blocked: true,
      reason: 'L6 ANTI-RETARD: Detected potential infinite loop or retry without variation'
    };
  }

  // Record this action
  recentHistory.push({
    action,
    timestamp: now,
    result: 'attempted',
    variationCount: recentHistory.length,
  });

  // Limit history size
  if (recentHistory.length > MAX_HISTORY_SIZE) {
    recentHistory.shift();
  }

  actionHistory.set(action, recentHistory);

  return { blocked: false, reason: '' };
}

export function recordActionResult(action: string, result: 'success' | 'failure' | 'blocked'): void {
  const history = actionHistory.get(action) || [];
  const now = Date.now();

  if (history.length > 0) {
    history[history.length - 1].result = result;
  }

  actionHistory.set(action, history);
}

export function clearHistory(): void {
  actionHistory.clear();
}