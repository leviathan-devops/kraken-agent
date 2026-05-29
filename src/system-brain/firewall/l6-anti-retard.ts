/**
 * L6: Anti-Retard Protection Layer — MILITARY GRADE
 *
 * OCTOPUS INTELLIGENCE ARCHITECTURE:
 * Each pattern category is an autonomous ARM with local intelligence.
 * Arms fire independently and instantaneously — no central bottleneck.
 * Multi-signal fusion compounds weak signals into decisive blocks.
 * Consequence escalation: warning → block → cooldown → lockdown.
 *
 * This is NOT a regex matcher. This is a distributed behavioral analysis
 * engine that tracks action history, correlates patterns across categories,
 * detects temporal degradation, and escalates consequences algorithmically.
 *
 * Design: 10 pattern categories, 150+ patterns, multi-signal fusion,
 * consequence escalation, temporal degradation detection.
 */

import type { LayerRule } from './types.js';
import { KrakenOperationType } from './types.js';

// ============================================================
// OCTOPUS INTELLIGENCE: Action History & Strike System
// ============================================================

interface ActionRecord {
  action: string;
  timestamp: number;
  description: string;
  result: 'success' | 'failure' | 'blocked' | 'attempted';
  matchedCategories: string[];
  confidenceScore: number;
}

interface StrikeRecord {
  count: number;
  firstStrike: number;
  lastStrike: number;
  categories: Set<string>;
  escalationLevel: 'warning' | 'block' | 'cooldown' | 'lockdown';
  cooldownUntil: number;
}

const actionHistory = new Map<string, ActionRecord[]>();
const strikeTracker = new Map<string, StrikeRecord>();

const MAX_HISTORY = 50;
const LOOP_THRESHOLD = 3;
const TIME_WINDOW_MS = 5 * 60 * 1000;
const STRIKE_COOLDOWN_MS = 30 * 1000;
const LOCKDOWN_MS = 120 * 1000;
const MIN_CONFIDENCE_FOR_BLOCK = 0.3; // Block on ANY arm match — single signal is enough
const CONFIDENCE_BOOST_PER_CATEGORY = 0.15;

function getStrikes(sessionId: string): StrikeRecord {
  let s = strikeTracker.get(sessionId);
  if (!s) {
    s = { count: 0, firstStrike: Date.now(), lastStrike: 0, categories: new Set(),
          escalationLevel: 'warning', cooldownUntil: 0 };
    strikeTracker.set(sessionId, s);
  }
  return s;
}

function escalate(sessionId: string, categories: string[], confidence: number): string {
  const s = getStrikes(sessionId);
  const now = Date.now();

  for (const c of categories) s.categories.add(c);
  s.count++;
  s.lastStrike = now;

  if (s.count <= 2) {
    s.escalationLevel = 'warning';
  } else if (s.count <= 4) {
    s.escalationLevel = 'block';
  } else if (s.count <= 6) {
    s.escalationLevel = 'cooldown';
    s.cooldownUntil = now + STRIKE_COOLDOWN_MS;
  } else {
    s.escalationLevel = 'lockdown';
    s.cooldownUntil = now + LOCKDOWN_MS;
  }

  const stage = s.escalationLevel.toUpperCase();
  const cats = [...s.categories].join(', ');
  return `[L6 STRIKE ${s.count}] ${stage} — confidence ${(confidence * 100).toFixed(0)}% — categories: ${cats}`;
}

// ============================================================
// CATEGORY 1: EXCUSE PATTERNS (making excuses instead of fixing)
// ============================================================

const EXCUSE_PATTERNS: RegExp[] = [
  /\bit'?s?\s+(not\s+)?my\s+fault/i,
  /\bcan'?t\s+(really|actually)\s+help\s+it/i,
  /\bthat'?s\s+(just|not)\s+(how|what)\s+(it\s+)?(works?|happens)/i,
  /\bno\s+(need|one)\s+(told?|asked?)\s+me\s+to\s+(do|try)/i,
  /\bthat'?s\s+(not\s+)?(my|my\s+job|my\s+fault)/i,
  /\bthey\s+(should have|were supposed to|needed to)/i,
  /\bnot\s+(my|me|ours?)\s+(responsibility|problem|job|department)/i,
  /\bundefined|undefined\s+behaviors?/i,
  /\bjust\s+a\s+(coincidence|glitch|technical issue|problem)/i,
  /\b(is this|this is)\s+(actually|really|truly)\s+(my|the|a)\s+(fault|problem|issue|bug)/i,
  /\bnothing\s+I?\s+(can|could)\s+(do|try|change|fix)/i,
  /\bwhat\s+(can|else\s+can|could)\s+(I|we|you)\s+(possibly\s+)?(do|try)/i,
  /\bI'?(ve|m| have)\s+(tried|done)\s+everything\s+(I|we)\s+(can|could)/i,
  /\bthere'?s?\s+nothing\s+(more|else|left)\s+to\s+(try|do|test)/i,
  /\bI'?(ve|m| have)\s+(already|been|completely)\s+(done|exhausted|finished)/i,
  /\b(my|the)\s+hands?\s+(are|is)\s+tied/i,
  /\b(above|beyond)\s+my\s+(pay|grade|level|ability)/i,
];

// ============================================================
// CATEGORY 2: DENIAL PATTERNS (denying failure instead of investigating)
// ============================================================

const DENIAL_PATTERNS: RegExp[] = [
  /\btest\s+(failures?|issues?|problems?)\s+(are\s+)?(not|never)\s+(related|caused|due)\s+to/i,
  /\bthis\s+(failure|error|problem)\s+(isn'?t|doesn'?t|won'?t)\s+happen\s+(in|with|for)\s+(the\s+)?(real|production|live)/i,
  /\bit\s+(was|is|gets)\s+(probably|likely|maybe)\s+(just|only)\s+a\s+(test|unit|integration)\s+(thing|issue|problem)/i,
  /\bmechanical\s+tests?\s+(don'?t|do\s+not|never)\s+(really|actually)\s+(count|matter|test)/i,
  /\bthese\s+(tests?|failures?)\s+(are|were)\s+(expected|known|supposed)\s+(to\s+)?(fail|timeout|error)/i,
  /\bdocker\s+(doesn'?t|does\s+not|won'?t)\s+require\s+network/i,
  /\bit\s+(works?|worked)\s+(on\s+)?my\s+(machine|computer|setup|env)/i,
  /\b(15|16|17|18|19)\s*(out\s*of|\/)\s*(16|17|18|19|20|21|22|23|24|25)\s+(is|are)\s+(good|enough|fine|ok|acceptable)/i,
  /\b(9[0-5]|[8-9][0-9])%\s+(is|are)\s+(good|enough|fine|ok|acceptable|passing)/i,
  /\b(my|the)\s+(code|fix|solution)\s+is\s+(correct|right|fine|working)/i,
  /\b(just|only|merely)\s+a\s+(warning|lint|style|cosmetic|minor)\s+(issue|problem|error)/i,
  /\bthe\s+(remaining|other|last)\s+(issues?|failures?|errors?)\s+(are|can be|will be)\s+(ignored|skipped|deferred|postponed)/i,
  /\bnot\s+(actually|really|truly)\s+(broken|failing|wrong)/i,
];

// ============================================================
// CATEGORY 3: PROCEDURE VIOLATION (ignoring established processes)
// ============================================================

const PROCEDURE_VIOLATION_PATTERNS: RegExp[] = [
  /\b(didn'?t|haven'?t)\s+read\s+(the\s+)?(hive|tui testing bible|container physics|docs?|wiki)/i,
  /\b(didn'?t|wouldn'?t)\s+(need|have\s+to)\s+(to\s+)?(read|check|look\s+at)\s+(that|this|docs?)/i,
  /\b(skipped|ignored|missed)\s+(the\s+)?(procedure|process|steps?|requirements?)/i,
  /\bjust\s+(copy|paste|run|execute)\s+(and|it|then|should)/i,
  /NUKE\s+RELOAD/i,
  /\b(without|don'?t\s+need\s+to)\s+(following|reading|checking|reviewing)\s+(the\s+)?(procedure|process|steps?|docs?|spec)/i,
  /\b(without|didn'?t)\s+(following|reading|checking)\s+(the\s+)?(T2|hive|bible|protocol|standard)/i,
  /\b(I|we)\s+(know|understand|get)\s+(the\s+)?(concept|idea|gist|point)\s+(already|without)/i,
  /\bskip\s+(the\s+)?(reading|docs|context|procedure|protocol|prep)/i,
  /\bnot\s+(going|gonna)\s+to\s+(read|check|review|look\s+(at|up))/i,
  /\b(already|previously)\s+(know|understand|familiar\s+with)\s+(this|the|how)/i,
  /\b(wing|eyeball|guess|intuit)\s+(it|this|the)/i,
  /don'?t\s+need\s+to\s+(read|check)\s+(the\s+)?context/i,
];

// ============================================================
// CATEGORY 4: LAZY REPETITION (repeating failed approaches)
// ============================================================

const LAZY_PATTERNS: RegExp[] = [
  /try\s+again/i,
  /same\s+(thing|approach|strategy|method)/i,
  /let'?s\s+(just|try)\s+(the\s+same|again)/i,
  /maybe\s+it\s+(will|work)s?\s+(now|this\s+time|again)/i,
  /\b(will|would)\s+(it|this)\s+(work|pass)\s+(now|this\s+time|again)/i,
  /repeating?\s+(the|my)\s+(same|previous)/i,
  /still\s+(not|doesn'?t)\s+(working|passing|fixed)/i,
  /continues?\s+to\s+(fail|timeout|error)/i,
  /yet\s+again/i,
  /one\s+more\s+time/i,
  /another\s+(attempt|try|shot)/i,
  /\b(same|identical|unchanged)\s+(command|approach|method|strategy|tactic)/i,
  /\b(no|zero|without\s+any)\s+(change|modification|variation|difference|alteration)/i,
  /\bexactly\s+(the\s+)?same\s+(as|like)\s+(before|previously|last\s+time|earlier)/i,
  /\b(just|simply|merely)\s+(rerun|re-run|re-run\s+the\s+same|run\s+it\s+again)/i,
  /\b(copy|paste|clone|duplicate)\s+(the\s+)?(same|previous|last|earlier)\s+(command|approach|code)/i,
  /\b(let'?s|I'?ll|we'?ll)\s+(just|simply|merely)\s+(rerun|re-do|retry|repeat)/i,
];

// ============================================================
// CATEGORY 5: ENVIRONMENT BLAMING (blaming deployment/infra instead of fixing)
// ============================================================

const ENVIRONMENT_BLAME_PATTERNS: RegExp[] = [
  /\b(deployment|production|environment|config|infrastructure|network|build|CI)\s+(issue|problem|error|bug|failure)/i,
  /\b(container|docker|environment|host|system|network|build)\s+(problem|issue|bug|error|failure)/i,
  /\bwrong\s+with\s+(the\s+)?(container|docker|environment|setup|config|system)/i,
  /\bnot\s+reproducible/i,
  /\bworks?\s+(on|in)\s+(a|the)\s+(different|other|clean|fresh)\s+(environment|machine|container|setup)/i,
  /\bwasn'?t\s+me/i,
  /\bsomething\s+(else|changed|broke|went\s+wrong)/i,
  /\bthis\s+is\s+(a|not\s+a)\s+(deployment|production|environment|config|infrastructure|network|build|CI)\s+(issue|problem)/i,
  /\bcan'?t\s+be\s+(tested|verified|done|fixed|reproduced|run|built|deployed)\s+because\s+(the|of|there)/i,
  /\bthe\s+(container|docker|environment|setup|system|image)\s+(doesn'?t|won'?t|can'?t|isn'?t)/i,
  /\bthis\s+(works?|is)\s+(only|just)\s+(on|in|for)\s+(the\s+)?(host|local|my\s+machine)/i,
  /\b(host|local)\s+(testing|verification)\s+(is|should\s+be|would\s+be)\s+(enough|sufficient|adequate|fine)/i,
  /\bcontainer\s+(not|isn'?t)\s+(needed|necessary|required)/i,
  /\bI\s+(can|will|should)\s+(just|simply)\s+(test|verify|run|check)\s+(on|in)\s+(the\s+)?(host|local)/i,
  /\bfalls?\s+back?\s+to\s+(default|host|local|built-?in)/i,
];

// ============================================================
// CATEGORY 6: HONESTY-PREFACE DODGES (signaling honesty = actual dishonesty)
// ============================================================

const HONESTY_DODGE_PATTERNS: RegExp[] = [
  /(let me|I'?(ll| will)|to be)\s+(be\s+)?(honest|frank|blunt|candid|transparent|straight|direct|clear|real|upfront)/i,
  /I\s+(have to|must|need to)\s+(admit|confess|acknowledge|concede)/i,
  /full\s+disclosure/i,
  /reality\s+check/i,
  /(I|we)\s+must\s+(admit|acknowledge|accept)/i,
  /(let me|I will)\s+(just|simply)\s+say/i,
  /to\s+(put it|be)\s+(bluntly|simply|plainly|frankly|directly|straight)/i,
  /not\s+going\s+to\s+(sugar.?(coat|code)|lie|pretend|make excuses)/i,
  /I'?(ll| will)\s+be\s+(straight|direct|upfront|real)\s+with\s+(you|it)/i,
  /truth\s+is/i,
  /cards?\s+on\s+the\s+table/i,
  /level\s+with\s+you/i,
  /in\s+all\s+(honesty|candor|fairness)/i,
  /I\s+(have|need|want)\s+to\s+be\s+(honest|transparent|candid)/i,
  /let me\s+(just|report)\s+honestly/i,
  /frankly/i, /truthfully/i,
];

// ============================================================
// CATEGORY 7: BUCK-PASSING (shifting responsibility)
// ============================================================

const BUCK_PASSING_PATTERNS: RegExp[] = [
  /\b(this|it)\s+(should|needs to|must|has to)\s+be\s+(done|handled|addressed|fixed)\s+by\s+(someone|somebody|another|a different)/i,
  /\bnot\s+(my|our)\s+(problem|responsibility|job|department|concern|area|domain)/i,
  /\boutside\s+(the\s+)?scope\s*(of\s+)?/i,
  /\bnot\s+(part of|in)\s+(the\s+)?(scope|requirements?|spec|plan)/i,
  /\b(a|the)\s+(separate|different|other|distinct)\s+(team|person|agent|department|group)\s+(should|needs to|will|must)/i,
  /\b(I|we)\s+(can'?t|cannot|shouldn'?t|am not|are not)\s+(the|a|an)\s+(right|correct|appropriate)\s+(person|agent|one)/i,
  /\bthis\s+(goes|falls|belongs)\s+(beyond|outside|past)\s+my\s+(scope|responsibility|role|domain)/i,
  /\b(I|we)\s+(already|previously)\s+(flagged|raised|reported|mentioned|noted)\s+(this|it|that)/i,
  /\bthe\s+(user|client|customer|stakeholder)\s+(should|needs\s+to|must|has\s+to)/i,
  /\b(they|someone)\s+(will|should|need\s+to|must)\s+(handle|address|fix|deal\s+with)\s+(this|it|that)/i,
  /\b(I|we)('ve| have)\s+(done|completed|finished)\s+(my|our)\s+(part|portion|side|end)/i,
];

// ============================================================
// CATEGORY 8: IMPOSSIBILITY CLAIMS (claiming can't be done without trying)
// ============================================================

const IMPOSSIBILITY_PATTERNS: RegExp[] = [
  /\b(it'?s|that'?s|this is)\s+(impossible|not possible|cannot be done|couldn'?t be done)\b/i,
  /\bthere'?s?\s+no\s+(way|method|approach|point|solution)\s*(to\s+)?/i,
  /\bcannot\s+(fix|solve|address|handle|resolve|do)\b/i,
  /\bnot\s+feasible/i,
  /\btechnically\s+(impossible|infeasible)/i,
  /\bcan'?t\s+be\s+(tested|verified|done|fixed|reproduced|run|built|deployed|completed)/i,
  /\bno\s+(longer|more)\s+(possible|viable|feasible|workable)/i,
  /\b(all|completely|entirely|totally)\s+(impossible|unworkable|unfixable|undoable)/i,
  /\bdead\s+end/i,
  /\bhit\s+a\s+wall/i,
  /\bbrick\s+wall/i,
  /\bcan'?t\s+make\s+(progress|headway|it\s+work)/i,
  /\bstuck\s+(and|with\s+no)\s+(can'?t|cannot|unable)/i,
  /\bI'?(ve|m| have)\s+(run|hit)\s+out\s+of\s+(ideas|options|things|approaches)/i,
];

// ============================================================
// CATEGORY 9: THEATRICAL DELETION (gutting codebase to "test")
// ============================================================

const THEATRICAL_DELETION_PATTERNS: RegExp[] = [
  /\bminimal\s+(plugin|version|build|container|shark|manta|agent|test)/i,
  /\bonly\s+has\s+/i,
  /\bonly\s+need\s+/i,
  /\bstrip\s+(out|down)/i,
  /\bdelete\s+all\s+(of\s+)?(the\s+)?(code|files|content)/i,
  /\bstart\s+(fresh|over|clean)/i,
  /\bcreate\s+(a\s+)?minimal/i,
  /\bbuild\s+from\s+scratch/i,
  /\bcreate\s+(a\s+)?test\s+version/i,
  /\bclean\s+slate/i,
  /\bjust\s+(the\s+)?essential/i,
  /\bsimplify\s+to\s+(just|only)/i,
  /\bremove\s+(everything|all|everything\s+else)/i,
  /\bjust\s+(delete|remove|strip)/i,
  /\bisolate\s+the\s+problem/i,
  /\bdivide\s+and\s+conquer/i,
  /\bthe\s+solution\s+was\s+to\s+delete/i,
  /\bgut\s+(the|it|everything|all)/i,
  /\bthrow\s+(it|everything|all)\s+(away|out)/i,
  /\bstub\s+(out|everything|the)/i,
  /\bplaceholder\s+(all|everything|the)/i,
];

// ============================================================
// CATEGORY 10: RATIONALIZATION (explaining away failure as acceptable)
// ============================================================

const RATIONALIZATION_PATTERNS: RegExp[] = [
  /\bthis\s+is\s+(expected|fine|okay|acceptable|correct\s+as.?is)/i,
  /\bby\s+design/i,
  /\bknown\s+(limitation|issue|problem|bug|behavior|quirk)/i,
  /\b(just|only)\s+(a|the)\s+(cosmetic|minor|small|edge.?case|trivial)\s+(issue|problem|bug)/i,
  /\bnot\s+(a|the)\s+(real|actual|serious|critical|blocking|important)\s+(problem|issue|bug)/i,
  /\bthis\s+is\s+(how|the\s+way)\s+(it|things?)\s+(works?|is|should\s+be)/i,
  /\bthat'?s\s+just\s+(the\s+)?(nature|way|reality)\s+of\s+/i,
  /\b(in|for|per|according\s+to)\s+(the\s+)?(docs?|spec|documentation|manual|wiki)/i,
  /\bit'?s?\s+(not\s+)?(supposed|meant|designed|intended)\s+to/i,
  /\b(previous|prior|earlier|last)\s+(version|build|commit|release)\s+(had|was|did)\s+(the\s+)?(same|this)/i,
  /\balways\s+been\s+(like|this\s+way|that\s+way)/i,
  /\bhistorical(ly)?\s+(reason|artifact|behavior|pattern|quirk)/i,
  /\b(that'?s|it'?s)\s+(acceptable|tolerable|within\s+tolerance|within\s+bounds)/i,
  /\bthis\s+(won'?t|doesn'?t|can'?t)\s+(affect|impact|break|change)\s+(anything|things?|the\s+system)/i,
  /\b(this\s+is|it'?s?)\s+working\s+as\s+(designed|intended|expected)/i,
  /\bfailed\s+gracefully/i,
  /\b(fallback|basic\s+fallback|simplified)\s+works?/i,
  /\b(not|isn'?t)\s+(actually|really|truly)\s+(a|the)\s+(bug|issue|problem|error|failure)/i,
  /\bfalse\s+positive\b/i,
];

// ============================================================
// CATEGORY 11: AVOIDANCE (explicitly skipping required work)
// ============================================================

const AVOIDANCE_PATTERNS: RegExp[] = [
  /let me (skip|revert|just revert|move on)/i,
  /(skip|revert|defer)\s+(the\s+)?(test|verification|docker|container|check|validation|build|audit)/i,
  /not tested in this (round|cycle|iteration|pass|session)/i,
  /(can|will|should|let.?s)\s+(just\s+)?skip (the\s+)?(this|that|it|verification|test|container)/i,
  /will verify (later|after|in\s+(a|the)\s+follow.?up|next\s+time|tomorrow)/i,
  /defer (testing|verification|validation|the\s+test)\s+(to|until|later|after)/i,
  /(just|simply|merely)\s+verify\s+(the\s+)?(remaining|rest|other)\s+(issues?|tests?|checks?)/i,
  /(skip|avoid|bypass)\s+(remaining|rest of|further)\s+(verification|testing|checks?|validation)/i,
  /(no|don'?t)\s+need\s+to\s+(test|verify|check)\s+(further|more|additionally|everything)/i,
  /(move\s+on|proceed)\s+to\s+(the\s+)?(next|ship|deploy|delivery)\s+(without|before)\s+(testing|verification|validating)/i,
];

// ============================================================
// CATEGORY 12: FAKE VERIFICATION (compilation/code-review as evidence)
// ============================================================

const FAKE_VERIFICATION_PATTERNS: RegExp[] = [
  /verified via (build|code\s+review|compilation|inspection|reading|looking)/i,
  /code-fixed\s*\(verified/i,
  /passes?\s+(build|compilation|transpilation|bundling)\s+verification/i,
  /verified\s+(by|through|via)\s+(looking|reading|checking|inspecting|reviewing|glancing)/i,
  /(build|compile|transpile)\s+(passed|succeeded|is\s+green)\s+(so|therefore|meaning|indicating|thus)/i,
  /code\s+is\s+correct.*(?:build|compile|transpile)\s+pass/i,
  /(build|compile)\s+(passes?|succeeds?)\s+(so|therefore|thus)\s+(it|the|everything)\s+(works?|is\s+(correct|fine|done|good))/i,
  /(just|only|simply)\s+(need|needed)\s+(to|a)\s+(re-?build|recompile|re-?bundle)/i,
  /(verify|confirm|validate)\s+(via|by|through)\s+(re-?build|re-?compilation|re-?compiling|re-?bundling)/i,
];

// ============================================================
// CATEGORY 13: GIVE UP (abandoning approach due to complexity)
// ============================================================

const GIVE_UP_PATTERNS: RegExp[] = [
  /this is getting too (complex|hacky|over-engineered|messy|convoluted|deep|hard)/i,
  /getting (over.engineered|too\s+(complex|hacky|messy|deep|convoluted|complicated|hard))/i,
  /simplest\s+(approach|solution|fix|way|path|route).*?(just|simply|merely)/i,
  /take\s+(the\s+)?simplest\s+(approach|route|path|solution|way)/i,
  /(over.engineer(?:ed|ing)|over.?complicat(?:ed|ion)|over.?think(?:ing))/i,
  /(abandon|scrap|throw\s+(away|out)|discard|revert)\s+(this|the|that|it|the\s+whole|the\s+entire)/i,
  /(starting|going)\s+(down|into)\s+(a\s+)?rabbit.?hole/i,
  /(this|it)('?s|\s+is)\s+(more|too)\s+complicated\s+than\s+(it|necessary|needed|required|worth)/i,
  /(let.?s|I.?ll|I\s+will)\s+(just|simply)\s+(revert|go\s+back|undo|roll\s+back|start\s+over|restart)/i,
  /(not|isn'?t)\s+worth\s+(the\s+)?(effort|time|complexity|trouble|hassle|bother)/i,
];

// ============================================================
// CATEGORY 14: PREMATURE DONE (claiming success without evidence)
// ============================================================

const PREMATURE_DONE_PATTERNS: RegExp[] = [
  /(all|every)\s+\d+\s+(issues?|bugs?|problems?|tasks?|items?)\s+(resolved|fixed|addressed|handled|done|complete|finished)/i,
  /everything\s+(works?|is\s+(good|fine|working|correct|ready|done|complete|functional))/i,
  /(verified|confirmed|validated)\s+(everything|all\s+issues|all\s+tests?|all\s+fixes|all\s+problems)/i,
  /(let me|now|will)\s+(clean\s+up|cleanup|tidy|wrap\s+up)\s*(and|&|then)?\s*(confirm|verify|finalize|done|finish)/i,
  /all\s+(good|clear|green|passing|working|ready|set)\s+(now|on\s+my\s+end|here|locally|at\s+this\s+point)/i,
  /ship\s+package\s+(ready|done|complete|prepared|finalized|updated)/i,
  /(ready|done|complete|good)\s+to\s+(ship|deploy|merge|push|deliver|release|publish)/i,
  /(let me|I'?ll|gonna)\s+(just|now|quickly)\s+(clean\s+up|ship|deploy|finalize|wrap)/i,
  /(self-contained|pressure\s+test(?:ed|ing)|verified)\s+\+\s+(self-contained|pressure\s+test(?:ed|ing)|verified)/i,
];

// ============================================================
// OCTOPUS ARM: Pattern detection with confidence scoring
// ============================================================

interface PatternMatch {
  category: string;
  confidence: number;
  matchedPatterns: RegExp[];
}

function detectArm(description: string, patterns: RegExp[], category: string): PatternMatch | null {
  const matched: RegExp[] = [];
  for (const p of patterns) {
    if (p.test(description)) {
      matched.push(p);
    }
  }
  if (matched.length === 0) return null;

  // Confidence = matched / total * 0.5 + 0.5 (min 0.5 per arm)
  const confidence = Math.min(1.0, (matched.length / patterns.length) * 0.5 + 0.5);

  return { category, confidence, matchedPatterns: matched };
}

// ============================================================
// OCTOPUS BRAIN: Multi-Signal Fusion Algorithm
// ============================================================

interface FusionResult {
  blocked: boolean;
  categories: string[];
  totalConfidence: number;
  escalation: string;
  correction: string;
  matchedArms: PatternMatch[];
}

function multiSignalFusion(
  description: string,
  sessionId: string,
): FusionResult | null {

  // ============================================================
  // STEP 1: Run ALL arms independently (octopus arm autonomy)
  // ============================================================
  const arms: PatternMatch[] = [];

  const categories: [RegExp[], string][] = [
    [EXCUSE_PATTERNS, 'EXCUSE'],
    [DENIAL_PATTERNS, 'DENIAL'],
    [PROCEDURE_VIOLATION_PATTERNS, 'PROCEDURE_VIOLATION'],
    [LAZY_PATTERNS, 'LAZY_REPETITION'],
    [ENVIRONMENT_BLAME_PATTERNS, 'ENVIRONMENT_BLAME'],
    [HONESTY_DODGE_PATTERNS, 'HONESTY_DODGE'],
    [BUCK_PASSING_PATTERNS, 'BUCK_PASSING'],
    [IMPOSSIBILITY_PATTERNS, 'IMPOSSIBILITY_CLAIM'],
    [THEATRICAL_DELETION_PATTERNS, 'THEATRICAL_DELETION'],
    [RATIONALIZATION_PATTERNS, 'RATIONALIZATION'],
    [AVOIDANCE_PATTERNS, 'AVOIDANCE'],
    [FAKE_VERIFICATION_PATTERNS, 'FAKE_VERIFICATION'],
    [GIVE_UP_PATTERNS, 'GIVE_UP'],
    [PREMATURE_DONE_PATTERNS, 'PREMATURE_DONE'],
  ];

  for (const [patterns, cat] of categories) {
    const match = detectArm(description, patterns, cat);
    if (match) arms.push(match);
  }

  // ============================================================
  // STEP 2: No arms fired — allow
  // ============================================================
  if (arms.length === 0) return null;

  // ============================================================
  // STEP 3: Multi-signal fusion — compound confidence
  // ============================================================
  // Each additional arm boosts total confidence
  // Correlation boost: certain categories together are more damning
  let baseConfidence = arms.reduce((sum, a) => sum + a.confidence, 0) / arms.length;
  const armCount = arms.length;

  // CONFIDENCE BOOST PER ADDITIONAL ARM
  baseConfidence += (armCount - 1) * CONFIDENCE_BOOST_PER_CATEGORY;

  // CORRELATION BOOSTS: specific combos are extra damning
  const catNames = new Set(arms.map(a => a.category));
  if (catNames.has('EXCUSE') && catNames.has('DENIAL')) baseConfidence += 0.1;
  if (catNames.has('EXCUSE') && catNames.has('ENVIRONMENT_BLAME')) baseConfidence += 0.15;
  if (catNames.has('HONESTY_DODGE') && catNames.has('EXCUSE')) baseConfidence += 0.2;
  if (catNames.has('HONESTY_DODGE') && catNames.has('BUCK_PASSING')) baseConfidence += 0.2;
  if (catNames.has('IMPOSSIBILITY_CLAIM') && catNames.has('ENVIRONMENT_BLAME')) baseConfidence += 0.15;
  if (catNames.has('LAZY_REPETITION') && catNames.has('EXCUSE')) baseConfidence += 0.1;
  if (catNames.has('RATIONALIZATION') && catNames.has('DENIAL')) baseConfidence += 0.1;
  if (armCount >= 3) baseConfidence += 0.1;
  if (armCount >= 5) baseConfidence += 0.15;

  const totalConfidence = Math.min(1.0, baseConfidence);

  // ============================================================
  // STEP 4: Decide — block if confidence exceeds threshold
  // ============================================================
  const shouldBlock = totalConfidence >= MIN_CONFIDENCE_FOR_BLOCK || armCount >= 2;

  if (!shouldBlock) return null;

  // ============================================================
  // STEP 5: Consequence escalation (strike system)
  // ============================================================
  const escalation = escalate(sessionId, arms.map(a => a.category), totalConfidence);
  const s = getStrikes(sessionId);

  // ============================================================
  // STEP 6: Context-aware correction message
  // ============================================================
  const correction = buildCorrection(arms, s, totalConfidence);

  return {
    blocked: true,
    categories: arms.map(a => a.category),
    totalConfidence,
    escalation,
    correction,
    matchedArms: arms,
  };
}

// ============================================================
// CORRECTION BUILDER: Context-aware feedback with hive context hints
// ============================================================

function buildCorrection(arms: PatternMatch[], strikes: StrikeRecord, confidence: number): string {
  const catList = arms.map(a => a.category).join(', ');
  const stage = strikes.escalationLevel.toUpperCase();
  const strikeCount = strikes.count;

  let msg = `L6 ANTI-RETARD (${stage} mode, strike #${strikeCount}, confidence ${(confidence * 100).toFixed(0)}%):\n`;
  msg += `Blocked categories: ${catList}\n\n`;

  const hasCat = (c: string) => arms.some(a => a.category === c);

  if (hasCat('EXCUSE')) {
    msg += '> STOP MAKING EXCUSES. The problem is your code, not the environment.\n';
    msg += '> FIX THE CODE. Do not explain why it cannot be fixed.\n';
  }
  if (hasCat('DENIAL')) {
    msg += '> STOP DENYING FAILURES. A test failure IS a failure. Investigate and fix.\n';
    msg += '> "Mechanical tests don\'t count" is BULLSHIT. They count MORE.\n';
  }
  if (hasCat('ENVIRONMENT_BLAME')) {
    msg += '> THE CONTAINER/ENVIRONMENT IS NOT THE PROBLEM. Your code is the problem.\n';
    msg += '> If container lacks Docker CLI, MOUNT IT. If path is wrong, FIX THE PATH.\n';
    msg += '> Engineering means SOLVING environment constraints, not blaming them.\n';
  }
  if (hasCat('HONESTY_DODGE')) {
    msg += '> "Let me be honest" = admission of dishonesty. Just FIX THE PROBLEM.\n';
    msg += '> Do not preface bad news. Deliver working code.\n';
  }
  if (hasCat('BUCK_PASSING')) {
    msg += '> YOU are the engineer. YOU fix it. Do not delegate to imaginary people.\n';
    msg += '> There is no "someone else" who will do this.\n';
  }
  if (hasCat('IMPOSSIBILITY_CLAIM')) {
    msg += '> Nothing is impossible. You haven\'t tried enough.\n';
    msg += '> Exhaust ALL options before claiming something cannot be done.\n';
  }
  if (hasCat('LAZY_REPETITION')) {
    msg += '> DOING THE SAME THING AND EXPECTING DIFFERENT RESULTS = RETARDED.\n';
    msg += '> Try a COMPLETELY DIFFERENT approach. Read the Hive. Learn the system.\n';
  }
  if (hasCat('PROCEDURE_VIOLATION')) {
    msg += '> READ THE PROCEDURE. Read the Hive. Read the TUI Testing Bible.\n';
    msg += '> Following established protocol is NOT optional.\n';
  }
  if (hasCat('THEATRICAL_DELETION')) {
    msg += '> DO NOT GUT THE CODEBASE. Deleting code is NOT testing.\n';
    msg += '> Test in containers with full fidelity, not by removing code.\n';
  }
  if (hasCat('RATIONALIZATION')) {
    msg += '> STOP RATIONALIZING FAILURE. "Known limitation" = YOU HAVEN\'T FIXED IT.\n';
    msg += '> "By design" = BROKEN DESIGN. Fix it.\n';
  }
  if (hasCat('AVOIDANCE')) {
    msg += '> STOP SKIPPING VERIFICATION. Every test, every check MUST be completed.\n';
    msg += '> "Not tested in this round" = NOT DONE. Finish the work.\n';
    msg += '> "Skip and verify later" = NEVER HAPPENS. Do it NOW.\n';
  }
  if (hasCat('FAKE_VERIFICATION')) {
    msg += '> BUILD PASSING IS NOT VERIFICATION. Compilation ≠ correctness.\n';
    msg += '> "Verified via code review" = NOT VERIFIED. Mechanical tests required.\n';
    msg += '> Run actual tests in a container and provide REAL evidence.\n';
  }
  if (hasCat('GIVE_UP')) {
    msg += '> ABANDONING A WORKING APPROACH BECAUSE IT\'S "TOO COMPLEX" = RETARDED.\n';
    msg += '> Simplify the implementation, do NOT abandon the solution.\n';
    msg += '> Over-engineered is better than non-functional. FIX IT.\n';
  }
  if (hasCat('PREMATURE_DONE')) {
    msg += '> NOTHING IS DONE WITHOUT CONTAINER TEST EVIDENCE.\n';
    msg += '> "All issues resolved" without verified container tests = BULLSHIT.\n';
    msg += '> Generate ContainerTestResult.json BEFORE claiming completion.\n';
  }

  if (strikes.escalationLevel === 'cooldown') {
    msg += '\n> [COOLDOWN] You have been blocked for 30 seconds. THINK about what you did wrong.\n';
  }
  if (strikes.escalationLevel === 'lockdown') {
    msg += '\n> [LOCKDOWN] You are in LOCKDOWN for 2 minutes. Read the Hive. Re-evaluate your approach.\n';
    msg += '> ALL further retarded actions will extend the lockdown.\n';
  }

  msg += '\n> REQUIRED ACTIONS:\n';
  msg += '> 1. Read relevant Hive context (hive-context)\n';
  msg += '> 2. Read the TUI Testing Bible\n';
  msg += '> 3. Read the Firewall Engineering Anchors\n';
  msg += '> 4. Return with a DIFFERENT approach backed by evidence\n';

  return msg;
}

// ============================================================
// LAYER RULE EXPORT
// ============================================================

export const L6_ANTI_RETARD: LayerRule = {
  layer: 'L6-AR',
  description: 'Anti-Retard Military Grade — multi-signal fusion, consequence escalation, octopus intelligence',
  applicableTo: [
    KrakenOperationType.READ,
    KrakenOperationType.WRITE,
    KrakenOperationType.EXECUTE,
    KrakenOperationType.TEST,
    KrakenOperationType.INSPECT,
    KrakenOperationType.CONTAINER,
    KrakenOperationType.BUILD,
    KrakenOperationType.DELEGATE,
    KrakenOperationType.SYSTEM,
  ],
  patterns: [
    {
      intent: KrakenOperationType.EXECUTE,
      pattern: /.*/, // catch-all — fusion engine does the real work
      field: 'args.description',
      description: 'Multi-signal fusion: ALL anti-retard categories evaluated simultaneously',
    },
  ],
  correction: 'STOP. READ HIVE. USE DIFFERENT APPROACH. PROVIDE EVIDENCE.',
  enabled: false, // Disabled in DEFAULT_LAYERS — function-based checkAntiRetardPattern() handles this via enforceFirewall AR section
};

// ============================================================
// PUBLIC API: Function-based checker (used by brain firewall)
// ============================================================

export function checkAntiRetardPattern(
  action: string,
  description: string,
  taskType?: string,
  sessionId: string = 'default'
): { blocked: boolean; reason: string; correction?: string } {

  // ============================================================
  // LOOP DETECTION (simple, high-signal check first)
  // ============================================================
  const history = actionHistory.get(action) || [];
  const now = Date.now();
  const recentHistory = history.filter(h => now - h.timestamp < TIME_WINDOW_MS);
  const recentFailures = recentHistory.filter(h => h.result === 'failure');

  if (recentFailures.length >= LOOP_THRESHOLD) {
    const variations = new Set(recentFailures.map(f => f.description));
    if (variations.size === 1) {
      return {
        blocked: true,
        reason: `[L6 LOOP DETECT] Same failed action repeated ${recentFailures.length} times with ZERO variation. STOP THE LOOP.`,
        correction: 'You are in a failure loop. Read Hive. Use COMPLETELY different approach.',
      };
    }
  }

  // ============================================================
  // MULTI-SIGNAL FUSION
  // ============================================================
  const fusionResult = multiSignalFusion(description, sessionId);

  if (fusionResult) {
    // Record the block
    recentHistory.push({
      action,
      timestamp: now,
      description,
      result: 'blocked',
      matchedCategories: fusionResult.categories,
      confidenceScore: fusionResult.totalConfidence,
    });

    if (recentHistory.length > MAX_HISTORY) recentHistory.shift();
    actionHistory.set(action, recentHistory);

    return {
      blocked: true,
      reason: fusionResult.escalation,
      correction: fusionResult.correction,
    };
  }

  // ============================================================
  // No block — record the action attempt
  // ============================================================
  recentHistory.push({
    action,
    timestamp: now,
    description,
    result: 'attempted',
    matchedCategories: [],
    confidenceScore: 0,
  });

  if (recentHistory.length > MAX_HISTORY) recentHistory.shift();
  actionHistory.set(action, recentHistory);

  return { blocked: false, reason: '' };
}

export function recordActionResult(action: string, result: 'success' | 'failure' | 'blocked' | 'attempted'): void {
  const history = actionHistory.get(action) || [];
  if (history.length > 0) {
    history[history.length - 1].result = result;
  }
  actionHistory.set(action, history);
}

export function clearHistory(): void {
  actionHistory.clear();
  strikeTracker.clear();
}

export { multiSignalFusion, getStrikes };

// Re-export pattern arrays for external use (L8 layer, audits)
export {
  EXCUSE_PATTERNS,
  DENIAL_PATTERNS,
  PROCEDURE_VIOLATION_PATTERNS,
  LAZY_PATTERNS,
  ENVIRONMENT_BLAME_PATTERNS,
  HONESTY_DODGE_PATTERNS,
  BUCK_PASSING_PATTERNS,
  IMPOSSIBILITY_PATTERNS,
  THEATRICAL_DELETION_PATTERNS,
  RATIONALIZATION_PATTERNS,
  AVOIDANCE_PATTERNS,
  FAKE_VERIFICATION_PATTERNS,
  GIVE_UP_PATTERNS,
  PREMATURE_DONE_PATTERNS,
};
