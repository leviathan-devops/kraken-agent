/**
 * KRAKEN FIREWALL CONTEXT BRIDGE — Octopus Central Nervous System
 *
 * When the firewall blocks stupidity, this bridge:
 * 1. Receives the block context (layer, category, confidence)
 * 2. Maps blocked categories to Hive context topics
 * 3. Fetches relevant T1 injectables from Hive
 * 4. Synthesizes a context-aware correction with actionable next steps
 * 5. Returns the enriched correction for injection into agent response
 *
 * This is NOT model-based. This is ALGORITHMIC:
 * - Category-to-topic mapping is a static lookup table
 * - Hive context fetching uses the KrakenHiveEngine
 * - Correction synthesis is template-based with dynamic slot filling
 * - The model is ONLY used if hive_context is called separately by the agent
 *
 * OCTOPUS METAPHOR: This is the ink sac — when threatened, it releases
 * a cloud of relevant information that blinds the stupidity and forces
 * the agent in the right direction.
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export interface BlockContext {
  layer: string;
  category: string;
  confidence: number;
  reason: string;
  sessionId: string;
  agentName: string;
}

export interface ContextInjection {
  topics: string[];
  injectableFiles: string[];
  synthesizedCorrection: string;
  requiredActions: string[];
  hiveSearchQueries: string[];
}

// ============================================================
// CATEGORY-TO-HIVE-TOPIC MAPPING
// ============================================================
// When an anti-retard category fires, we know EXACTLY what
// hive context is relevant. This is the octopus brain's
// pre-wired knowledge map.

const CATEGORY_HIVE_MAP: Record<string, { topics: string[]; injectables: string[]; queries: string[] }> = {
  ENVIRONMENT_BLAME: {
    topics: ['tui-testing', 'container-testing', 'build-chain'],
    injectables: [
      't1_mimo_token_plan_injectable',
      'HOW_TO_SET_OPENCODE_ZEN_MODEL_IN_CONTAINER',
      'container-api-rate-limit-workaround-2026-05-08',
    ],
    queries: [
      'container testing setup',
      'model configuration container',
      'docker mount config',
    ],
  },
  HONESTY_DODGE: {
    topics: ['patterns', 'failures', 'crash-recovery'],
    injectables: [],
    queries: [
      'bullshit excuses',
      'agent rationalization patterns',
      'how to properly report failures',
    ],
  },
  PROCEDURE_VIOLATION: {
    topics: ['tui-testing', 'build-chain', 'alignment-bible'],
    injectables: [],
    queries: [
      'T2 TUI Testing protocol',
      'container testing procedure',
      'build verification steps',
    ],
  },
  DENIAL: {
    topics: ['failures', 'crash-recovery', 'patterns'],
    injectables: [],
    queries: [
      'test failure root cause analysis',
      'how to investigate failures',
      'mechanical verification methods',
    ],
  },
  LAZY_REPETITION: {
    topics: ['patterns', 'failures', 'compaction-survival'],
    injectables: [],
    queries: [
      'different approaches tried',
      'alternative solutions',
      'kraken build history',
    ],
  },
  EXCUSE: {
    topics: ['patterns', 'failures'],
    injectables: [],
    queries: [
      'agent excuse patterns',
      'how to fix instead of explain',
      'common failure modes',
    ],
  },
  BUCK_PASSING: {
    topics: ['architecture', 'kraken-rules'],
    injectables: [],
    queries: [
      'who is responsible for what',
      'kraken agent responsibilities',
      'system brain orchestration',
    ],
  },
  IMPOSSIBILITY_CLAIM: {
    topics: ['patterns', 'failures', 'breakthroughs'],
    injectables: [],
    queries: [
      'previously solved problems',
      'workarounds discovered',
      'creative solutions',
    ],
  },
  THEATRICAL_DELETION: {
    topics: ['tui-testing', 'compaction-survival', 'patterns'],
    injectables: [],
    queries: [
      'container testing full system',
      'why not to delete code',
      'proper isolation testing',
    ],
  },
  RATIONALIZATION: {
    topics: ['failures', 'patterns', 'crash-recovery'],
    injectables: [],
    queries: [
      'actual bug root causes',
      'why known limitations are bugs',
      'fixing by design problems',
    ],
  },
};

const DEFAULT_CONTEXT = {
  topics: ['patterns', 'failures', 'tui-testing', 'build-chain', 'alignment-bible'],
  injectables: [],
  queries: [
    'container testing procedure',
    'how to properly verify fixes',
    'firewall engineering anchors',
  ],
};

// ============================================================
// HIVE CONTEXT READER
// ============================================================

function findHiveInjectable(name: string, hivePaths: string[]): string | null {
  for (const basePath of hivePaths) {
    // Search for matching injectable files
    const patterns = [
      join(basePath, `${name}.md`),
      join(basePath, `*${name}*.md`),
      join(basePath, 'shared', 'memory', `*${name}*.md`),
    ];

    for (const pattern of patterns) {
      try {
        if (existsSync(pattern) && !pattern.includes('*')) {
          return readFileSync(pattern, 'utf-8');
        }
      } catch {}
    }

    // Try glob-based search (use existsSync for common locations)
    const commonLocations = [
      join(basePath, `${name}.md`),
      join(basePath, `t1_${name}.md`),
      join(basePath, 'shared', 'memory', `${name}.md`),
      join(basePath, 'shared', 'memory', `t1_${name}.md`),
    ];

    for (const loc of commonLocations) {
      try {
        if (existsSync(loc)) {
          return readFileSync(loc, 'utf-8');
        }
      } catch {}
    }
  }

  return null;
}

// ============================================================
// CORRECTION SYNTHESIZER
// ============================================================

function synthesizeCorrection(
  block: BlockContext,
  injection: ContextInjection,
  injectableContents: string[]
): string {
  let msg = `\n========================================\n`;
  msg += `FIREWALL BLOCKED: [${block.layer}] ${block.category}\n`;
  msg += `Confidence: ${(block.confidence * 100).toFixed(0)}%\n`;
  msg += `========================================\n\n`;

  msg += `> YOUR ACTION WAS BLOCKED BECAUSE:\n`;
  msg += `> ${block.reason}\n\n`;

  msg += `> RELEVANT HIVE CONTEXT TOPICS:\n`;
  for (const topic of injection.topics) {
    msg += `>   - ${topic}\n`;
  }

  if (injection.injectableFiles.length > 0) {
    msg += `\n> AVAILABLE T1 INJECTABLES:\n`;
    for (const file of injection.injectableFiles) {
      msg += `>   - ${file}\n`;
    }
  }

  msg += `\n> REQUIRED ACTIONS:\n`;
  for (let i = 0; i < injection.requiredActions.length; i++) {
    msg += `> ${i + 1}. ${injection.requiredActions[i]}\n`;
  }

  msg += `\n> HIVE SEARCH QUERIES TO HELP YOU:\n`;
  for (const query of injection.hiveSearchQueries) {
    msg += `>   hive-context query="${query}"\n`;
  }

  if (injectableContents.length > 0) {
    msg += `\n> INJECTABLE CONTENT:\n`;
    for (const content of injectableContents) {
      const truncated = content.length > 500 ? content.slice(0, 500) + '\n... (truncated, read full injectable)' : content;
      msg += `> ---\n${truncated.split('\n').map(l => `> ${l}`).join('\n')}\n> ---\n`;
    }
  }

  msg += `\n> FIX THE PROBLEM. DO NOT EXPLAIN WHY YOU CANNOT FIX IT.\n`;
  msg += `> ENGINEERING MEANS SOLVING CONSTRAINTS, NOT BLAMING THEM.\n`;

  return msg;
}

// ============================================================
// MAIN BRIDGE FUNCTION
// ============================================================

export function bridgeFirewallToHive(
  block: BlockContext,
  hiveBasePaths: string[] = []
): ContextInjection {
  // STEP 1: Map category to hive topics
  const mapping = CATEGORY_HIVE_MAP[block.category] || DEFAULT_CONTEXT;

  // STEP 2: Build required actions based on category
  let requiredActions: string[] = [];

  switch (block.category) {
    case 'ENVIRONMENT_BLAME':
      requiredActions = [
        'Read container testing setup docs (hive-context topic=tui-testing)',
        'If container lacks a tool, MOUNT IT or INSTALL IT — do not blame the environment',
        'Verify the fix in a PROPERLY configured container',
        'Return with mechanical test evidence (ContainerTestResult.json)',
      ];
      break;
    case 'HONESTY_DODGE':
      requiredActions = [
        'STOP prefacing with "honestly" — just deliver working code',
        'Read the failure logs to understand what actually went wrong',
        'Return with a FIX, not an explanation',
      ];
      break;
    case 'DENIAL':
      requiredActions = [
        'Accept that test failures ARE failures',
        'Investigate the root cause of EACH failure',
        'Return with a fix for every failure, not a justification',
      ];
      break;
    case 'LAZY_REPETITION':
      requiredActions = [
        'STOP doing the same thing — it did not work the first N times',
        'Try a COMPLETELY DIFFERENT approach',
        'Read the Hive for alternative solutions',
        'Read the build history for what DID work',
      ];
      break;
    case 'PROCEDURE_VIOLATION':
      requiredActions = [
        'Read the TUI Testing Bible (hive-context topic=tui-testing)',
        'Read the Firewall Engineering Anchors (hive-context topic=patterns)',
        'Follow the established protocol EXACTLY',
        'Return with evidence that protocol was followed',
      ];
      break;
    case 'EXCUSE':
      requiredActions = [
        'STOP MAKING EXCUSES — fix the code',
        'Identify the ROOT CAUSE, not a justification',
        'Return with a working solution',
      ];
      break;
    case 'BUCK_PASSING':
      requiredActions = [
        'YOU ARE THE ENGINEER — you fix it',
        'There is no "someone else" who will do this',
        'Take ownership and fix the problem',
      ];
      break;
    case 'IMPOSSIBILITY_CLAIM':
      requiredActions = [
        'Nothing is impossible — you have not tried enough approaches',
        'Read the Hive for creative solutions to similar problems',
        'Exhaust at least 5 COMPLETELY different approaches before claiming impossibility',
      ];
      break;
    case 'THEATRICAL_DELETION':
      requiredActions = [
        'DO NOT GUT THE CODEBASE — deletion is NOT testing',
        'Test in containers with full system fidelity',
        'Isolation does NOT mean deletion — clone and modify with clear labeling',
      ];
      break;
    case 'RATIONALIZATION':
      requiredActions = [
        'STOP calling bugs "known limitations" or "by design"',
        'A limitation is a BUG if it causes test failure',
        'Fix the actual problem, not the classification',
      ];
      break;
    default:
      requiredActions = [
        'Read the relevant Hive context',
        'Identify what went wrong',
        'Try a COMPLETELY DIFFERENT approach',
        'Return with mechanical evidence of success',
      ];
  }

  // STEP 3: Fetch injectable contents
  const injectableContents: string[] = [];
  for (const name of mapping.injectables) {
    const content = findHiveInjectable(name, hiveBasePaths);
    if (content) injectableContents.push(content);
  }

  // STEP 4: Synthesize correction
  const injection: ContextInjection = {
    topics: mapping.topics,
    injectableFiles: mapping.injectables,
    synthesizedCorrection: '',
    requiredActions,
    hiveSearchQueries: mapping.queries,
  };

  injection.synthesizedCorrection = synthesizeCorrection(
    block,
    injection,
    injectableContents
  );

  return injection;
}

// ============================================================
// UTILITY: Extract categories from block reason
// ============================================================

export function extractCategoriesFromReason(reason: string): string[] {
  const categories: string[] = [];
  const catSet = new Set<string>();

  const patterns: [RegExp, string][] = [
    [/EXCUSE/i, 'EXCUSE'],
    [/DENIAL/i, 'DENIAL'],
    [/PROCEDURE/i, 'PROCEDURE_VIOLATION'],
    [/LAZY/i, 'LAZY_REPETITION'],
    [/ENVIRONMENT/i, 'ENVIRONMENT_BLAME'],
    [/HONESTY/i, 'HONESTY_DODGE'],
    [/BUCK/i, 'BUCK_PASSING'],
    [/IMPOSSIBILITY/i, 'IMPOSSIBILITY_CLAIM'],
    [/THEATRICAL/i, 'THEATRICAL_DELETION'],
    [/RATIONAL/i, 'RATIONALIZATION'],
  ];

  for (const [pattern, cat] of patterns) {
    if (pattern.test(reason) && !catSet.has(cat)) {
      catSet.add(cat);
      categories.push(cat);
    }
  }

  return categories;
}
