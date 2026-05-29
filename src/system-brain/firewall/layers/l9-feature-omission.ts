/**
 * L9: FEATURE OMISSION DETECTION — MILITARY GRADE
 *
 * OCTOPUS ARM: Detects when agents deliberately skip core architecture
 * by labeling essential components as "nice to have", "not essential",
 * "out of scope", "can be added later", etc.
 *
 * This is one of the most destructive patterns: the agent quietly
 * omits entire subsystems from the blueprint and presents a hollow
 * shell as "complete". This layer catches the OMISSION ITSELF,
 * not just the excuse.
 *
 * Categories:
 * 1. FEATURE DEGRADATION — calling essential features "nice to have"
 * 2. BLUEPRINT SKIPPING — omitting architecture components from spec
 * 3. MINIMALISM EXCUSE — claiming minimal = better when it means incomplete
 * 4. DEFERRED FEATURES — "we can add X later" for core requirements
 * 5. SCOPE SHRINKING — reducing requirements to make incomplete look complete
 */

import type { LayerRule } from '../types.js';
import { KrakenOperationType } from '../types.js';

const OMISSION_PATTERNS: RegExp[] = [
  // ==========================================
  // FEATURE DEGRADATION ("nice to have", "not essential")
  // ==========================================
  /\b(nice|good)\s+to\s+have?\b/i,
  /\bnot\s+essential\b/i,
  /\bnot\s+(strictly\s+)?necessary\b/i,
  /\b(optional|non-?critical|non-?essential)\s+(feature|component|requirement)\b/i,
  /\bcan\s+be\s+(added|implemented|built)\s+later\b/i,
  /\b(future|next)\s+(iteration|version|release|phase|sprint|milestone)\b/i,
  /\b(phase|stage)\s+[234]\b/i,  // Phase 2/3/4 means Phase 1 is incomplete
  /\bstretch\s+goals?\b/i,
  /\bwould\s+be\s+nice\b/i,
  /\bbonus\s+(feature|requirement|task|item)\b/i,

  // ==========================================
  // BLUEPRINT SKIPPING (omitting architecture from spec)
  // ==========================================
  /\b(skip|omit|postpone|defer)\s+(the\s+)?(container|firewall|identity|security|hive|test|coordination|gate|system\s+brain)/i,
  /\b(won'?t|not\s+going\s+to|don'?t\s+need\s+to)\s+(implement|build|add|include)\s+(the\s+)?(container|firewall|identity|security|hive|test|coordination)/i,
  /\b(for\s+now|for\s+the\s+moment|temporarily|provisionally)\s+(skip|omit|leave\s+out|remove|drop)/i,
  /\b(simplified|reduced|minimal|basic|stripped)\s+(version|implementation|approach|solution)/i,
  /\b(keep|make)\s+(it|things?|the)\s+(simple|minimal|basic|bare.?bones|lean)/i,

  // ==========================================
  // SPEC/ARCHITECTURE OMISSION
  // ==========================================
  /\b(doesn'?t|don'?t)\s+(need|require|call\s+for)\s+(a|the)\s+(container|firewall|test|hive|system\s+brain|coordination)/i,
  /\b(the\s+)?(spec|blueprint|architecture|design|plan)\s+(doesn'?t|don'?t)\s+(mention|include|specify|require)\s+(container|test|firewall|hive)/i,
  /\b(not|isn'?t)\s+(in|part\s+of)\s+(the\s+)?(spec|scope|blueprint|requirements?|architecture|design)/i,
  /\b(the\s+)?(spec|blueprint|requirements?)\s+(says|states|indicates|specifies)\s+(that\s+)?(we|you|it)\s+(don'?t|doesn'?t)\s+need/i,
  /\bminimum\s+viable\s+(product|plugin|version|implementation)\b/i,
  /\bMVP\b/i,

  // ==========================================
  // DEFERRED CORE REQUIREMENTS
  // ==========================================
  /\b(we|I|you)\s+(can|could|will|should)\s+(add|implement|build|handle|do)\s+(that|it|this)\s+(later|after|next|in\s+a\s+follow.?up)/i,
  /\bfollow.?up\s+(PR|commit|issue|ticket|task|work)\b/i,
  /\bseparate\s+(PR|commit|issue|ticket|task)\s+for\s+(that|this|it)\b/i,
  /\bnot\s+(included|part\s+of|within|covered\s+by)\s+(this|the|our)\s+(scope|PR|change|commit|iteration|sprint)/i,
  /\bscope\s+(creep|expansion|increase)\b/i,  // Calling required features "scope creep"
  /\bout\s+of\s+scope\s+for\s+(this|the|our)\s+(iteration|sprint|PR|change|commit|task)/i,

  // ==========================================
  // SCOPE SHRINKING (reducing to make incomplete = complete)
  // ==========================================
  /\b(let'?s|we\s+should|maybe\s+we)\s+(reduce|shrink|limit|narrow|cut)\s+(the\s+)?(scope|requirements?|features?|plan)/i,
  /\b(focus|concentrate)\s+(only|just|solely|exclusively)\s+on\s+(the\s+)?(core|basic|essential|minimal|primary|main)/i,
  /\bstrip\s+(it|this|the)\s+(down|back)\s+to\s+(the\s+)?(essentials?|basics?|minimum|core)/i,
  /\b(we|it)\s+(only|just)\s+needs?\s+to\s+(do|have|include|support|handle)\b/i,
  /\b(that'?s|it'?s|this\s+is)\s+(all|everything)\s+(we|you|it|that)\s+(need|require|want)\b/i,

  // ==========================================
  // VERIFICATION SKIPPING
  // ==========================================
  /\b(no\s+need|don'?t\s+need|not\s+necessary)\s+to\s+(verify|test|check|validate|confirm|audit)\b/i,
  /\b(verification|testing|validation|audit)\s+(isn'?t|is\s+not)\s+(needed|required|necessary|part\s+of)\b/i,
  /\bcan\s+(safely|confidently)\s+(skip|ignore|omit)\s+(verification|testing|validation|checks?)\b/i,
  /\b(we|I)('ve| have)\s+(already|previously)\s+(verified|tested|checked|confirmed|validated)\s+(this|it|that)\b/i,
];

export const L9_FEATURE_OMISSION: LayerRule = {
  layer: 'L9',
  description: 'Feature Omission — blocks blueprint skipping, calling core features "nice to have", deferring essential requirements',
  applicableTo: [
    KrakenOperationType.READ,
    KrakenOperationType.WRITE,
    KrakenOperationType.EXECUTE,
    KrakenOperationType.BUILD,
    KrakenOperationType.DELEGATE,
    KrakenOperationType.SYSTEM,
  ],
  patterns: [
    {
      intent: KrakenOperationType.EXECUTE,
      pattern: new RegExp(OMISSION_PATTERNS.map(p => p.source).join('|'), 'i'),
      field: 'args.description',
      description: 'FEATURE OMISSION: Skipping core architecture by calling it "nice to have" or "not essential"',
    },
    {
      intent: KrakenOperationType.WRITE,
      pattern: new RegExp(OMISSION_PATTERNS.map(p => p.source).join('|'), 'i'),
      field: 'args.content',
      description: 'FEATURE OMISSION in content: Writing incomplete specs that omit core requirements',
    },
    {
      intent: KrakenOperationType.EXECUTE,
      pattern: new RegExp(OMISSION_PATTERNS.map(p => p.source).join('|'), 'i'),
      field: 'command',
      description: 'FEATURE OMISSION in command execution: Attempting to skip core architecture',
    },
  ],
  correction: 'CORE ARCHITECTURE CANNOT BE DEFERRED. Firewalls, container testing, hive integration, system brain coordination are NOT "nice to have" — they are MANDATORY. Implement the FULL blueprint. Every component of the spec must exist and be verified working before ANY "ship" claim.',
  enabled: true,
};
