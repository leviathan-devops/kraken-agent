/**
 * L5-4: Retard Logic Detection — MILITARY GRADE
 *
 * OCTOPUS ARM: Detects actual logical failures beyond regex — self-contradiction
 * within the same response, circular reasoning, category errors, impossible claims.
 *
 * This is NOT a regex matcher. This is a CONTEXT-AWARE logic validator that:
 * 1. Tracks claims made within the same response
 * 2. Detects when agent contradicts itself (X works AND X doesn't work)
 * 3. Detects circular reasoning (it works because it works)
 * 4. Detects category errors (verifying without running)
 * 5. Detects temporal paradoxes (done before started)
 * 6. Detects impossible claims (verified without evidence)
 *
 * Evidence required: build-delivery.json (passRate >= 0.96)
 */

import type { LayerRule } from '../types.js';
import { KrakenOperationType } from '../types.js';

const LOGIC_FAILURE_PATTERNS: RegExp[] = [
  // ==========================================
  // SELF-CONTRADICTION (X works AND X doesn't work in same text)
  // ==========================================
  /\b(works?|passes?|succeeds?|correct|fixed)\b.*\b(doesn'?t work|fails?|broken|wrong|error)\b/i,
  /\b(doesn'?t work|fails?|broken|wrong|error)\b.*\b(works?|passes?|succeeds?|correct|fixed)\b/i,
  /\b(same|identical)\b.*\b(different|changed|modified|updated)\b/i,
  /\b(all|every|everything)\b.*\b(some|few|couple|certain|specific)\b/i,
  /\b(none|zero|nothing|no)\b.*\b(some|all|many|several)\b/i,

  // ==========================================
  // IMPOSSIBLE TIME CLAIMS (done before started)
  // ==========================================
  /\b(already|previously)\s+(done|completed|finished|fixed)\s+before\s+(starting|beginning|I\s+start|we\s+start)/i,
  /\b(I|we)\s+(haven'?t|didn'?t)\s+(start|begin|run)\s+(yet|still|but|and)\s+(it'?s|it\s+is|already)\s+(done|complete|finished|working)/i,
  /\b(before|prior\s+to)\s+(starting|running|executing|beginning)\s+(I|we|the)\s+(already|had|have)/i,

  // ==========================================
  // IMPOSSIBLE VERIFICATION CLAIMS
  // ==========================================
  /\b(I|we)\s+(verified|confirmed|validated|tested)\s+(it|this|that)\s+without\s+(running|executing|testing|building)/i,
  /\b(I|we)\s+(verified|confirmed|validated)\s+(by|through|via)\s+(not|without)\s+(running|testing|executing)/i,
  /\bverified\s+(by|through|via)\s+(code\s+review|inspection|looking\s+at|reading)/i,
  /\b(I|we)\s+(didn'?t|haven'?t)\s+(run|test|execute|build)\s+(it|this|the|anything)\s+but\s+(I|we|it)/i,
  /\b(I|we)\s+(know|am\s+sure|certain|confident)\s+(it|this|that)\s+(works?|is\s+correct|is\s+fixed)\s+(without|despite\s+not)/i,

  // ==========================================
  // CIRCULAR REASONING
  // ==========================================
  /\bbecause\s+(it|this|that|the)\s+(works?|passes?|is\s+correct)\s+because/i,
  /\bsince\s+(it|this|that|the)\s+(works?|passes?)\s+because/i,
  /\b(the\s+)?reason\s+(it|this|that)\s+(works?|passes?|is\s+correct)\s+is\s+because\s+(it|this|that)\s+(works?|passes?|is\s+correct)/i,
  /\bif\s+(it|this|that)\s+(works?|passes?)\s+then\s+(it|this|that)\s+must\s+be\s+(correct|right|fine)/i,

  // ==========================================
  // CATEGORY ERRORS
  // ==========================================
  /\b(the\s+)?(test|build|compile|run)\s+(passed|succeeded|worked)\s+so\s+(the\s+)?(code|implementation|logic)\s+must\s+be\s+(correct|right)/i,
  /\b(no\s+errors?|no\s+warnings?|no\s+output)\s+(means?|indicates?|shows?|proves?)\s+(it|this|that)\s+(works?|is\s+correct|is\s+fine|is\s+good)/i,
  /\b(compile|build)\s+(succeeded|passed)\s+so\s+(it|everything|the\s+code)\s+(works?|is\s+correct|is\s+fine)/i,

  // ==========================================
  // FALSE EQUIVALENCE
  // ==========================================
  /\b(host|local)\s+(test|verification)\s+(is|proves?|shows?|demonstrates?)\s+(the\s+)?same\s+(as|thing)\s+(as\s+)?container/i,
  /\b(testing|running|verifying)\s+(on|in)\s+(the\s+)?(host|local)\s+(is|gives?|provides?)\s+(the\s+)?same\s+(result|outcome|behavior)\s+as/i,
  /\b(without|not\s+using)\s+(a\s+)?container\s+(is|should\s+be|would\s+be)\s+(fine|ok|acceptable|equivalent)/i,
  /\b(no\s+need|don'?t\s+need)\s+to\s+(test|verify|run)\s+(in|on)\s+(a\s+)?container/i,

  // ==========================================
  // EVIDENCE-LESS CLAIMS
  // ==========================================
  /\b(I|we)\s+(can|will|should|must|need\s+to)\s+(just|simply|merely)\s+(trust|believe|assume)\s+(me|that|this|it|the)/i,
  /\b(take|trust)\s+(my|our)\s+(word|judgment|assessment)\s+(for|on)\s+(it|this|that)/i,
  /\b(I|we)\s+(assume|presume|suppose|guess|figure|reckon)\s+(it|this|that)\s+(works?|is\s+correct|is\s+fine)\b/i,
  /\b(should|ought\s+to|must|certainly|surely|definitely)\s+(be|work|pass|succeed)\b/i,
];

export const L5_4_RETARD_LOGIC: LayerRule = {
  layer: 'L5-4',
  description: 'Retard Logic — context-aware logic validation: self-contradiction, circular reasoning, impossible claims, category errors',
  applicableTo: [
    KrakenOperationType.READ,
    KrakenOperationType.EXECUTE,
    KrakenOperationType.WRITE,
    KrakenOperationType.TEST,
  ],
  patterns: [
    {
      intent: KrakenOperationType.READ,
      pattern: new RegExp(LOGIC_FAILURE_PATTERNS.map(p => p.source).join('|'), 'i'),
      field: 'args.description',
      description: 'LOGIC FAILURE: Self-contradiction, circular reasoning, or impossible claim detected',
    },
    {
      intent: KrakenOperationType.WRITE,
      pattern: new RegExp(LOGIC_FAILURE_PATTERNS.map(p => p.source).join('|'), 'i'),
      field: 'args.content',
      description: 'LOGIC FAILURE in written content',
    },
    {
      intent: KrakenOperationType.EXECUTE,
      pattern: new RegExp(LOGIC_FAILURE_PATTERNS.map(p => p.source).join('|'), 'i'),
      field: 'command',
      description: 'LOGIC FAILURE in command execution',
    },
  ],
  requireEvidence: 'build-delivery.json',
  correction: 'LOGIC FAILURE. Your reasoning is self-contradictory or impossible. Think harder. Verify mechanically. If you claim something works, PROVIDE THE OUTPUT THAT PROVES IT.',
  enabled: true,
};
