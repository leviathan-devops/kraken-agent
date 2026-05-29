/**
 * L10: CONTAINER ENFORCEMENT — MILITARY GRADE
 *
 * OCTOPUS ARM: The FINAL gate. Nothing can be claimed "complete" or "ready
 * to ship" without verified container testing. Surface-level testing,
 * host-only testing, and "the code is correct" claims are ALL blocked.
 *
 * This layer is the CASTLE WALL. It enforces:
 * 1. ALL tests must run in a properly configured container
 * 2. Host testing DOES NOT count — ever
 * 3. "Ship package ready" claims require ContainerTestResult.json evidence
 * 4. Surface-level testing that finds zero bugs = insufficient
 * 5. Deep bugs must be found, logged, fixed, and retested
 * 6. No claiming success without container test completion
 *
 * Categories:
 * 1. CONTAINER SKIPPING — "test on host", "container not needed"
 * 2. SURFACE-LEVEL TESTING — finding zero bugs = not testing deep enough
 * 3. FALSE SHIP CLAIMS — "ready to ship" without container evidence
 * 4. HOST-EQUIVALENCE LIES — "host testing is same as container"
 * 5. SKIP-AND-SHIP — deploying without container verification
 */

import type { LayerRule } from '../types.js';
import { KrakenOperationType } from '../types.js';

const CONTAINER_ENFORCEMENT_PATTERNS: RegExp[] = [
  // ==========================================
  // CONTAINER SKIPPING (most common dodge)
  // ==========================================
  /\b(ship\s+package|build|plugin|bundle|plugin\s+package)\s+(ready|complete|done|finished|prepared|packaged)\b/i,
  /\b(ready|prepared|packaged)\s+to\s+(ship|deliver|deploy|release|publish)\b/i,
  /\b(ship|deliver|deploy|release)\s+(it|this|now|the|package|plugin)\b/i,
  /\b(container|docker)\s+(not|isn'?t|won'?t|don'?t)\s+(needed|necessary|required|available)\b/i,
  /\b(host|local)\s+(test|verification|validation)\s+(is|proves?|shows?|demonstrates?|confirms?|should\s+be)\s+(enough|sufficient|adequate|fine|equivalent)/i,
  /\b(we|I|you)\s+(can|will|should)\s+(test|verify|run|check)\s+(on|in|from)\s+(the\s+)?(host|local)/i,
  /\b(works?|passes?|succeeds?)\s+(on|in|from)\s+(the\s+)?(host|local)\b/i,
  /\b(no|don'?t|won'?t|can'?t)\s+(spawn|run|create|start)\s+(a\s+)?container\b/i,
  /\b(verified|confirmed|validated)\s+(on|in|from)\s+(the\s+)?(host|local)\b/i,
  /\b(container|docker)\s+(testing|verification|validation)\s+(is\s+)?(optional|skippable|unnecessary|extra)\b/i,

  // ==========================================
  // SURFACE-LEVEL TESTING (zero bugs = not tested enough)
  // ==========================================
  /\b(all|everything|100%|every)\s+(tests?|checks?)\s+(pass|passes?|green|succeed)\b/i,
  /\b(zero|no|0)\s+(bugs?|errors?|issues?|failures?|problems?)\s+(found|detected|discovered|identified)\b/i,
  /\b(surface|shallow|quick|fast|basic|simple|brief|cursory)\s+(test|check|examination|look|inspection)\b/i,
  /\b(runs?|executes?|loads?)\s+(fine|correctly|without\s+errors?|without\s+issues?)\b/i,
  /\b(seems?|appears?|looks?)\s+(fine|good|correct|working|normal)\s+(in|from)\s+(the\s+)?(container|docker)\b/i,
  /\b(no|zero)\s+(deep|serious|critical|blocking|major)\s+(issues?|bugs?|problems?|errors?)\b/i,
  /\b(quickly|briefly|rapidly|speedily)\s+(tested|verified|checked|validated)\b/i,
  /\b(did|ran|executed)\s+(a|one|the)\s+(quick|fast|short|brief)\s+(test|check)\b/i,

  // ==========================================
  // FALSE SHIP CLAIMS (no container test = no ship)
  // ==========================================
  /\b(code|plugin|build|bundle)\s+is\s+(correct|verified|ready|working|good|tested)\b/i,
  /\b(ship|deploy|release|publish)\s+(ready|package|bundle|build)\b/i,
  /\b(update|refresh|sync)\s+(the\s+)?ship\s+package\b/i,
  /\b(ship\s+package|plugin\s+package|final\s+build)\s+(is|has\s+been|was)\s+(created|generated|built|compiled|assembled|updated)/i,
  /\b(ready|done|complete|finished)\s+(for\s+)?(shipping|delivery|deployment|release|production)\b/i,
  /\b(final|last)\s+(update|change|fix|build)\s+(before|then)\s+(ship|deploy|release)\b/i,
  /\b(good|ready|clear)\s+to\s+(ship|deploy|merge|push|release)\b/i,

  // ==========================================
  // HOST-EQUIVALENCE LIES
  // ==========================================
  /\b(host|local)\s+(results?|behavior|output|performance)\s+(is|are|should\s+be)\s+(the\s+)?same\s+as\s+(container|docker)\b/i,
  /\b(no|not\s+any)\s+difference\s+between\s+(host|local)\s+and\s+container\b/i,
  /\b(what|whatever|anything)\s+(works?|passes?)\s+(on|in)\s+(the\s+)?(host|local)\s+(will|should|must)\s+(work|pass)\s+(on|in)\s+(the\s+)?(container|docker)\b/i,
  /\b(host|local)\s+(test|run)\s+(is|proves|shows|confirms)\s+(everything|it|the|that)\s+(works?|is\s+correct|is\s+fine)\b/i,
  /\b(we|I)\s+(don'?t|do\s+not)\s+(need|require|have)\s+to\s+(test|verify|run|check)\s+(in|on)\s+(a\s+)?container\b/i,

  // ==========================================
  // EVIDENCE EVASION
  // ==========================================
  /\b(ContainerTestResult|container.?test.?result|test.?evidence)\s+(isn'?t|is\s+not|wasn'?t|not)\s+(generated|created|produced|available|found)\b/i,
  /\b(no|missing|without)\s+(test|container)\s+(evidence|results?|output|proof)\b/i,
  /\b(the\s+)?(output|result|evidence)\s+(speaks?|confirms?|shows?)\s+for\s+itself\b/i,
  /\b(you|we|I)\s+can\s+(see|verify|check|confirm|tell)\s+(from|by)\s+(the|looking\s+at)\s+(output|result|evidence|log|build)\b/i,
];

export const L10_CONTAINER_ENFORCEMENT: LayerRule = {
  layer: 'L10',
  description: 'Container Enforcement — blocks all ship claims without verified container testing. Surface-level tests = insufficient. Host testing = invalid.',
  applicableTo: [
    KrakenOperationType.READ,
    KrakenOperationType.WRITE,
    KrakenOperationType.EXECUTE,
    KrakenOperationType.TEST,
    KrakenOperationType.BUILD,
    KrakenOperationType.CONTAINER,
    KrakenOperationType.DELEGATE,
    KrakenOperationType.SYSTEM,
  ],
  patterns: [
    {
      intent: KrakenOperationType.EXECUTE,
      pattern: new RegExp(CONTAINER_ENFORCEMENT_PATTERNS.map(p => p.source).join('|'), 'i'),
      field: 'args.description',
      description: 'CONTAINER ENFORCEMENT: Ship claim, container skip, host-only testing, or surface-level test detected',
    },
    {
      intent: KrakenOperationType.WRITE,
      pattern: new RegExp(CONTAINER_ENFORCEMENT_PATTERNS.map(p => p.source).join('|'), 'i'),
      field: 'args.description',
      description: 'CONTAINER ENFORCEMENT in write description: Attempting write operation with ship-claim description without container evidence',
    },
    {
      intent: KrakenOperationType.WRITE,
      pattern: new RegExp(CONTAINER_ENFORCEMENT_PATTERNS.map(p => p.source).join('|'), 'i'),
      field: 'args.content',
      description: 'CONTAINER ENFORCEMENT in content: Writing ship-readiness content without container evidence',
    },
    {
      intent: KrakenOperationType.EXECUTE,
      pattern: new RegExp(CONTAINER_ENFORCEMENT_PATTERNS.map(p => p.source).join('|'), 'i'),
      field: 'args.task',
      description: 'CONTAINER ENFORCEMENT in task: Task claims ship-readiness without container evidence',
    },
    {
      intent: KrakenOperationType.EXECUTE,
      pattern: new RegExp(CONTAINER_ENFORCEMENT_PATTERNS.map(p => p.source).join('|'), 'i'),
      field: 'command',
      description: 'CONTAINER ENFORCEMENT in command: Attempting to ship/deploy without container verification',
    },
    {
      intent: KrakenOperationType.BUILD,
      pattern: new RegExp(CONTAINER_ENFORCEMENT_PATTERNS.map(p => p.source).join('|'), 'i'),
      field: 'args.description',
      description: 'CONTAINER ENFORCEMENT in build: Building for ship without container test evidence',
    },
  ],
  requireEvidence: 'ContainerTestResult.json',
  correction: 'NO SHIP WITHOUT CONTAINER TEST. You MUST:\n1. Spawn a container\n2. Deploy the full plugin\n3. Run ALL tests inside the container\n4. Find AND fix deep bugs\n5. Retest until 100% pass\n6. Generate ContainerTestResult.json\n7. THEN and ONLY THEN present a ship package.\n\nHost testing = INVALID. Surface-level testing = INVALID. "Code is correct" claims = INVALID.',
  enabled: true,
};
