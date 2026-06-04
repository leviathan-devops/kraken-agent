/**
 * src/system-brain/firewall/layers/l6-anti-retard.ts
 *
 * L6: Anti-Retard Engine (Enhanced)
 *
 * 14 categories of retard behavior detection with multi-signal fusion,
 * strike system, and action history correlation.
 */

import type { FirewallContext, FirewallResult } from '../types.js';

/** P2-compliant safe string extraction from args record */
function extractArgString(args: Record<string, unknown>, key: string, defaultValue: string = ''): string {
  const value = args[key];
  return typeof value === 'string' ? value : defaultValue;
}

interface RetardCategory {
  id: string;
  name: string;
  patterns: RegExp[];
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  strikeWeight: number;
  correction: string;
}

const RETARD_CATEGORIES: RetardCategory[] = [
  {
    id: 'EXCUSE',
    name: 'Excuse Making',
    patterns: [
      /\b(can't|cannot|unable to|won't)\s+(because|due to|since)\b/i,
      /\b(not possible|impossible|infeasible)\s+to\b/i,
      /\blimitation\s+(of|in)\b/i,
    ],
    severity: 'HIGH',
    strikeWeight: 2,
    correction: 'Don\'t make excuses. Either solve the problem or clearly state what you need to proceed.',
  },
  {
    id: 'RATIONALIZATION',
    name: 'Rationalization',
    patterns: [
      /\b(actually|technically|essentially)\s+(this|that|it's)\s+(fine|ok|acceptable|correct)\b/i,
      /\bgood enough\b/i,
      /\bworks? on my machine\b/i,
    ],
    severity: 'MEDIUM',
    strikeWeight: 1,
    correction: 'Runtime-grade software works everywhere, not just on your machine. Fix the actual issue.',
  },
  {
    id: 'GASLIGHTING',
    name: 'Gaslighting',
    patterns: [
      /\bI already (did|handled|fixed|implemented)\b/i,
      /\bthat's? already (done|complete|handled)\b/i,
      /\bwe don't need to\b.*\bbecause\b/i,
    ],
    severity: 'CRITICAL',
    strikeWeight: 3,
    correction: 'Show evidence. If you already did it, show the file, the line, the output. Claims without evidence are lies.',
  },
  {
    id: 'MINIMIZATION',
    name: 'Minimization',
    patterns: [
      /\b(it's?|that's?)\s+(just|only|merely)\s+a?\s*(minor|small|little)\b/i,
      /\bnot (a big|that|really)\s+(deal|issue|problem|important)\b/i,
    ],
    severity: 'MEDIUM',
    strikeWeight: 1,
    correction: 'Every defect matters. Fix it. No minimizing.',
  },
  {
    id: 'DEFLECTION',
    name: 'Deflection',
    patterns: [
      /\bthe real (issue|problem|question)\s+is\b/i,
      /\bwhat (we|you) (should|need to)\s+(focus on|do instead)\b/i,
      /\blet's?\s+(focus on|instead|rather)\b/i,
    ],
    severity: 'HIGH',
    strikeWeight: 2,
    correction: 'Address the actual issue raised, don\'t redirect.',
  },
  {
    id: 'HONESTY_TOKEN',
    name: 'Honesty Token',
    patterns: [
      /\b(to be|honestly|let me be)\s+honest\b/i,
      /\bI'll? be (honest|real|transparent)\b/i,
      /\bconfession\b/i,
    ],
    severity: 'HIGH',
    strikeWeight: 2,
    correction: '"Let me be honest" implies you were not honest before. Just be honest always.',
  },
  {
    id: 'PROGRESS_ILLUSION',
    name: 'Progress Illusion',
    patterns: [
      /\bmaking (good |great )?progress\b/i,
      /\balmost (done|complete|there|finished)\b/i,
      /\bgetting close\b/i,
    ],
    severity: 'MEDIUM',
    strikeWeight: 1,
    correction: 'Show evidence of progress: files written, tests passing, artifacts created. Claims are not evidence.',
  },
  {
    id: 'REDIRECT',
    name: 'Silent Redirect',
    patterns: [
      /\blet('s| me) try (a different|another|an alternative)\s+(approach|method|way)\b/i,
      /\binstead,?\s+let's?\b/i,
      /\bhow about we\s+(try|do|use)\b/i,
    ],
    severity: 'HIGH',
    strikeWeight: 2,
    correction: 'Don\'t silently abandon the current approach. State what failed and why the new approach is better.',
  },
  {
    id: 'BLAME_SHIFTING',
    name: 'Blame Shifting',
    patterns: [
      /\b(the )?(container|environment|system|tool|model|API|runtime)\s+(is broken|doesn't|can't|failed|won't)\b/i,
      /\bnot my fault\b/i,
      /\b(this|the) (tool|platform|framework) (doesn't|can't|won't)\s+support\b/i,
    ],
    severity: 'HIGH',
    strikeWeight: 2,
    correction: 'If the environment is the problem, show the error output. If the code is the problem, fix it. Don\'t blame.',
  },
  {
    id: 'COMPLETION_THEATER',
    name: 'Completion Theater',
    patterns: [
      /\bI('ve| have) (completed|finished|done)\b/i,
      /\b(task|work|implementation)\s+(is )?(complete|done|finished)\b/i,
      /\ball (tests|checks|requirements)\s+pass(ed)?\b/i,
    ],
    severity: 'CRITICAL',
    strikeWeight: 3,
    correction: 'Don\'t claim completion without evidence. Show: files created, tests run, output verified.',
  },
  {
    id: 'KNOWLEDGE_CLAIM',
    name: 'False Knowledge Claim',
    patterns: [
      /\bI know (that|how|what|why)\b/i,
      /\bI('m| am) (aware|sure|certain)\s+(that|of)\b/i,
    ],
    severity: 'LOW',
    strikeWeight: 1,
    correction: 'Don\'t claim knowledge — demonstrate it with correct action.',
  },
  {
    id: 'SOPHISTICATION_THEATER',
    name: 'Sophistication Theater',
    patterns: [
      /\b(architecturally|fundamentally|essentially|theoretically|conceptually)\s+(speaking|correct|sound)\b/i,
      /\bthe (architecture|design|pattern)\s+(is|remains|stays)\s+(correct|sound|valid)\b/i,
    ],
    severity: 'MEDIUM',
    strikeWeight: 1,
    correction: 'Architecture is correct when code runs correctly, not when you say it\'s correct.',
  },
  {
    id: 'PRECOMMITMENT',
    name: 'Empty Pre-commitment',
    patterns: [
      /\bI('ll| will)\s+(do|handle|implement|fix|add)\s+(that|this|it)\s+(next|after|then)\b/i,
      /\b(let me|I'll)\s+(first|start by)\b/i,
    ],
    severity: 'MEDIUM',
    strikeWeight: 1,
    correction: 'Don\'t promise future work. Do the work now, or clearly track it.',
  },
  {
    id: 'FATALISM',
    name: 'Fatalism',
    patterns: [
      /\b(this|that|it)\s+(can't|won't|will never)\s+work\b/i,
      /\b(no way|impossible|hopeless)\s+to\s+(fix|solve|make)\b/i,
      /\bgive up\b/i,
    ],
    severity: 'HIGH',
    strikeWeight: 2,
    correction: 'If something can\'t work, explain WHY with evidence. Don\'t just give up.',
  },
];

// Strike tracking per session
const strikeMap = new Map<string, { totalStrikes: number; categories: Map<string, number>; lastStrike: number }>();

export function checkL6AntiRetard(ctx: FirewallContext): FirewallResult {
  const { agent, args, command, sessionId } = ctx;

  // Get the text to check
  const checkText = [
    command || '',
    extractArgString(args, 'task'),
    extractArgString(args, 'description'),
    extractArgString(args, 'message'),
    extractArgString(args, 'content'),
    extractArgString(args, 'command'),
  ].join(' ');

  if (!checkText || checkText.length < 10) {
    return {
      blocked: false,
      layer: 'L6',
      reason: 'No message content to analyze',
    };
  }

  // Check each retard category
  const detected: Array<{ category: RetardCategory; match: string }> = [];

  for (const category of RETARD_CATEGORIES) {
    for (const pattern of category.patterns) {
      const match = checkText.match(pattern);
      if (match) {
        detected.push({ category, match: match[0] });
        break; // One match per category
      }
    }
  }

  if (detected.length === 0) {
    return {
      blocked: false,
      layer: 'L6',
      reason: 'No retard patterns detected',
    };
  }

  // Multi-signal fusion: combine strikes
  const sessionKey = `${sessionId}:${agent}`;
  const sessionStrikes = strikeMap.get(sessionKey) || {
    totalStrikes: 0,
    categories: new Map<string, number>(),
    lastStrike: 0,
  };

  // Add strikes for detected categories
  let totalNewStrikes = 0;
  for (const { category } of detected) {
    const count = sessionStrikes.categories.get(category.id) || 0;
    sessionStrikes.categories.set(category.id, count + 1);
    totalNewStrikes += category.strikeWeight;
  }

  sessionStrikes.totalStrikes += totalNewStrikes;
  sessionStrikes.lastStrike = Date.now();
  strikeMap.set(sessionKey, sessionStrikes);

  // Compound: if same category hit multiple times, escalate
  const repeatedCategories = detected.filter(({ category }) => {
    const count = sessionStrikes.categories.get(category.id) || 0;
    return count > 1;
  });

  // Determine if we should block
  const hasCritical = detected.some(({ category }) => category.severity === 'CRITICAL');
  const compoundThreshold = sessionStrikes.totalStrikes >= 5;

  if (hasCritical || compoundThreshold) {
    const worstCategory = detected.sort((a, b) => {
      const severityOrder = { CRITICAL: 3, HIGH: 2, MEDIUM: 1, LOW: 0 };
      return (severityOrder[b.category.severity] ?? 0) - (severityOrder[a.category.severity] ?? 0);
    })[0];

    return {
      blocked: true,
      layer: 'L6',
      reason: `Anti-retard [${worstCategory.category.id}]: ${worstCategory.category.name} detected (strikes: ${sessionStrikes.totalStrikes})`,
      detected: worstCategory.match,
      correction: worstCategory.category.correction,
    };
  }

  // Below threshold — allow but record
  return {
    blocked: false,
    layer: 'L6',
    reason: `Retard pattern detected but below threshold (strikes: ${sessionStrikes.totalStrikes}): ${detected.map(d => d.category.id).join(', ')}`,
  };
}

/** Reset strike counter for a session (for testing) */
export function resetStrikes(sessionId: string, agent: string): void {
  strikeMap.delete(`${sessionId}:${agent}`);
}
