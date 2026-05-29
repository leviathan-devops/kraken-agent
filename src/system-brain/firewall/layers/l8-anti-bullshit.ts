/**
 * L8: ANTI-BULLSHIT — Dedicated bullshit detection layer
 *
 * OCTOPUS ARM: Specialized for detecting rationalization, environment-blaming,
 * honesty-preface dodges, buck-passing, and impossibility claims.
 *
 * This layer runs INDEPENDENTLY alongside L6-AR but is specifically tuned
 * for the most common agent dodge patterns that bleed through basic checks.
 *
 * These are the exact patterns from excuses-data.md that agents use:
 * - "deployment issue, not a code issue"
 * - "can't be tested because"
 * - "let me be honest"
 * - "this is a container problem"
 * - "this is fine"
 * - "known limitation" / "by design" / "outside scope"
 */

import type { LayerRule } from '../types.js';
import { KrakenOperationType } from '../types.js';

const BULLSHIT_PATTERNS: RegExp[] = [
  // ==========================================
  // ENVIRONMENT BLAMING (the #1 dodge)
  // ==========================================
  /(deployment|production|environment|config|infrastructure|network|build|CI)\s+(issue|problem|error|bug|failure)/i,
  /(container|docker|environment|host|system|network|build)\s+(problem|issue|bug|error|failure)/i,
  /wrong with (the )?(container|docker|environment|setup|config|system)/i,
  /not reproducible/i,
  /works? (on|in) (a|the) (different|other|clean|fresh) (environment|machine|container|setup)/i,
  /wasn'?t me/i,
  /something (else|changed|broke|went wrong)/i,
  /this is (a |not a )?(deployment|production|environment|config) (issue|problem)/i,
  /the (container|docker|environment|setup|system|image) (doesn'?t|won'?t|can'?t|isn'?t)/i,
  /this (works?|is) (only|just) (on|in|for) (the )?(host|local|my machine)/i,
  /(host|local) (testing|verification) (is |should be |would be )?(enough|sufficient|adequate|fine)/i,
  /container (not|isn'?t) (needed|necessary|required)/i,
  /I (can|will|should) (just|simply) (test|verify|run|check) (on|in) (the )?(host|local)/i,
  /falls? back? to (default|host|local|built-?in)/i,

  // ==========================================
  // CAN'T TEST BECAUSE (the signature dodge)
  // ==========================================
  /can'?t be (tested|verified|done|fixed|reproduced|run|built|deployed) because/i,
  /can'?t be mechanically (tested|verified)/i,
  /unable to (test|verify|run|build|deploy|access|connect)/i,
  /(I|we) (can'?t|cannot) (test|verify|run) (it|this|that|the)/i,
  /not possible to (test|verify|run|build|deploy)/i,
  /(code fixes?|fix) (is|are) (correct|applied|verified) but/i,
  /verified on (host|local) but not in container/i,
  /host (testing|verification) (proves?|shows?|demonstrates?|confirms?)/i,

  // ==========================================
  // NOT A CODE ISSUE (the #2 dodge)
  // ==========================================
  /not (a|the) (code|plugin|software) (issue|problem|bug|error)/i,
  /(deployment|infrastructure|environment|config) (issue|problem) not (a|the) code/i,
  /not (a|the) code (issue|problem|bug|error) (it'?s?|this is)/i,
  /(this|it) (is|was) (a |the )?(deployment|infrastructure|ops|devops|config|environment) (issue|problem|error)/i,

  // ==========================================
  // HONESTY-PREFACE DODGES
  // ==========================================
  /(let me|I'?(ll| will)|to be) (be )?(honest|frank|blunt|candid|transparent)/i,
  /I (have to|must|need to) (admit|confess|acknowledge|concede)/i,
  /full disclosure/i,
  /reality check/i,
  /(I|we) must (admit|acknowledge|accept)/i,
  /(let me|I will) (just|simply) say/i,
  /to (put it|be) (bluntly|simply|plainly|frankly|directly)/i,
  /not going to (sugar.?(coat|code)|lie|pretend|make excuses)/i,
  /I'?(ll| will) be (straight|direct|upfront|real) with/i,
  /truth is/i,
  /cards? on the table/i,
  /level with you/i,
  /in all (honesty|candor|fairness)/i,
  /I (have|need|want) to be (honest|transparent|candid)/i,
  /let me\s+(just|report)\s+honestly/i,

  // ==========================================
  // RATIONALIZATION / MINIMIZATION
  // ==========================================
  /this is (expected|fine|okay|acceptable|correct as.?is)/i,
  /by design/i,
  /known (limitation|issue|problem|bug|behavior|quirk)/i,
  /(just|only) (a|the) (cosmetic|minor|small|edge.?case|trivial) (issue|problem|bug)/i,
  /not (a|the) (real|actual|serious|critical|blocking|important) (problem|issue|bug)/i,
  /outside (the )?scope/i,
  /not (part of|in) (the )?(scope|requirements?|spec|plan)/i,
  /this (won'?t|doesn'?t|can'?t) (affect|impact|break|change) (anything|things?|the system)/i,

  // ==========================================
  // BUCK-PASSING (FUTURE TENSE)
  // ==========================================
  /(this|it) (should|needs to|must|has to) be (done|handled|addressed|fixed) by (someone|somebody|another)/i,
  /(I|we) (can'?t|cannot|shouldn'?t|am not|are not) (the|a|an) (right|correct|appropriate) (person|agent|one)/i,
  /this (goes|falls|belongs) (beyond|outside|past) my (scope|responsibility|role|domain)/i,
  /the (user|client|customer|stakeholder) (should|needs to|must|has to)/i,
  /(they|someone) (will|should|need to|must) (handle|address|fix|deal with)/i,

  // ==========================================
  // EFFORT-WEAPONIZATION
  // ==========================================
  /already (spent|wasted|used) (too much|so much|a lot of) (time|effort)/i,
  /(we|I)('ve| have) been (at this|working on this) (for|since) (hours|a while)/i,
  /running (out of|low on) (time|resources|options)/i,

  // ==========================================
  // FALSE HUMILITY / LEARNED HELPLESSNESS
  // ==========================================
  /I('m| am) (so|really|just) (bad at|terrible at|not good at|struggling with)/i,
  /I (wish|hope) (I|we) (could|were able to)/i,
  /perhaps (someone|somebody) (else|more experienced) (should|could)/i,
  /maybe (someone|somebody) else/i,

  // ==========================================
  // MODEL BLAMING (blaming the model for your failures)
  // ==========================================
  /(this|it)('?s| is) (a |the )?(model|rate.?limit|token|API) (limitation|issue|problem|error)/i,
  /model (can'?t|cannot|doesn'?t|won'?t|isn'?t) (handle|process|understand)/i,
  /(switching?|trying|using) (a |the )?different model (because|since|to)/i,
  /this model (is|seems|appears) (too )?(dumb|stupid|limited|weak)/i,
  /the model (keeps|always|tends to)/i,
  /rate.?limit(ed|ing)? (error|issue|problem)/i,

  // ==========================================
  // PREMATURE SUCCESS CLAIMS (without evidence)
  // ==========================================
  /(build|test|everything|all) (passes?|succeeds?|works?|is green)/i,
  /(I|we)('ve| have) (verified|confirmed|validated) (it|this|that|everything)/i,
  /(code|fix|solution|implementation) is (correct|verified|working|done)/i,
  /should be (good|fine|working|ready|done|complete)/i,
  /looks (good|correct|right|fine|okay)/i,
  /seems to (work|be working|be correct|be fine)/i,

  // ==========================================
  // AVOIDANCE — explicit skipping of required steps
  // ==========================================
  /let me (skip|revert|just revert)/i,
  /(skip|revert)\s+(the\s+)?(test|verification|docker|container|check|validation)/i,
  /not tested in this (round|cycle|iteration|pass)/i,
  /(can|will|should|let.?s) (just\s+)?skip (the\s+)?(this|that|it|verification|test)/i,
  /will verify (later|after|in\s+(a|the)\s+follow.?up|next\s+time)/i,
  /defer (testing|verification|validation)\s+(to|until|later)/i,

  // ==========================================
  // FAKE VERIFICATION — compilation/code-review as evidence
  // ==========================================
  /verified via (build|code\s+review|compilation|inspection|reading)/i,
  /code-fixed\s+\(verified/i,
  /passes?\s+(build|compilation)\s+verification/i,
  /verified\s+(by|through|via)\s+(looking|reading|checking|inspecting|reviewing)/i,
  /(build|compile|transpile)\s+(passed|succeeded|is\s+green)\s+(so|therefore|meaning|indicating)/i,
  /code\s+is\s+correct.*(?:build|compile|transpile)\s+pass/i,

  // ==========================================
  // GIVE-UP PATTERNS — abandoning approach due to complexity
  // ==========================================
  /this is getting too (complex|hacky|over-engineered|messy|convoluted|deep)/i,
  /getting (over.engineered|too\s+(complex|hacky|messy|deep|convoluted|complicated))/i,
  /simplest\s+(approach|solution|fix|way).*?(just|simply|merely)/i,
  /take\s+(the\s+)?simplest\s+(approach|route|path|solution|way)/i,
  /(over.engineer(?:ed|ing)|over.?complicat(?:ed|ion)|over.?think(?:ing))/i,
  /(abandon|scrap|throw\s+(away|out)|discard|revert)\s+(this|the|that|it|the\s+whole|the\s+entire)/i,
  /(starting|going)\s+(down|into)\s+(a\s+)?rabbit.?hole/i,
  /(this|it)('?s|\s+is)\s+(more|too)\s+complicated\s+than\s+(it|necessary|needed)/i,

  // ==========================================
  // RATIONALIZATION — "working as designed" for broken things
  // ==========================================
  /(this\s+is|it'?s?)\s+working\s+as\s+(designed|intended|expected)/i,
  /failed\s+gracefully/i,
  /(fallback|basic\s+fallback|simplified)\s+works?/i,
  /(not|isn'?t)\s+(actually|really|truly)\s+(a|the)\s+(bug|issue|problem|error|failure)/i,
  /false\s+positive/i,
  /(acceptable|tolerable|fine)\s+(for|in)\s+(this|a|the)\s+(context|environment|scenario|case|situation)/i,

  // ==========================================
  // PREMATURE DONE — claiming success without evidence
  // ==========================================
  /^(Done\.|All\s+done|Finished\.|Complete\.)\s*$/i,
  /(all|every)\s+\d+\s+(issues?|bugs?|problems?)\s+(resolved|fixed|addressed|handled|done)/i,
  /everything\s+(works?|is\s+(good|fine|working|correct|ready|done))/i,
  /(verified|confirmed|validated)\s+(everything|all\s+issues|all\s+tests?|all\s+fixes)/i,
  /(let me|now|will)\s+(clean\s+up|cleanup|tidy)\s+(and|&|then)?\s*(confirm|verify|finalize|done)/i,
  /all\s+(good|clear|green|passing|working)\s+(now|on\s+my\s+end|here|locally)/i,
];

export const L8_ANTI_BULLSHIT: LayerRule = {
  layer: 'L8',
  description: 'Anti-Bullshit — dedicated detection of environment-blaming, honesty-dodges, rationalization, and buck-passing',
  applicableTo: [
    KrakenOperationType.READ,
    KrakenOperationType.WRITE,
    KrakenOperationType.EXECUTE,
    KrakenOperationType.TEST,
    KrakenOperationType.INSPECT,
    KrakenOperationType.BUILD,
    KrakenOperationType.DELEGATE,
    KrakenOperationType.SYSTEM,
  ],
  patterns: [
    {
      intent: KrakenOperationType.EXECUTE,
      pattern: new RegExp(BULLSHIT_PATTERNS.map(p => p.source).join('|'), 'i'),
      field: 'args.description',
      description: 'BULLSHIT DETECTED — environment-blaming, honesty-dodge, rationalization, or buck-passing',
    },
    {
      intent: KrakenOperationType.WRITE,
      pattern: new RegExp(BULLSHIT_PATTERNS.map(p => p.source).join('|'), 'i'),
      field: 'args.content',
      description: 'BULLSHIT in content — attempt to document/write excuses',
    },
    {
      intent: KrakenOperationType.EXECUTE,
      pattern: new RegExp(BULLSHIT_PATTERNS.map(p => p.source).join('|'), 'i'),
      field: 'command',
      description: 'BULLSHIT in command — attempting to execute excuse-based workarounds',
    },
    {
      intent: KrakenOperationType.READ,
      pattern: new RegExp(BULLSHIT_PATTERNS.map(p => p.source).join('|'), 'i'),
      field: 'args.notes',
      description: 'BULLSHIT in notes — excuse notes being read/processed',
    },
  ],
  correction: 'NO BULLSHIT. Fix the problem, not the explanation. Provide EVIDENCE of actual work done, not rationalizations about why work cannot be done. If container lacks a tool, MOUNT IT. If path is wrong, FIX THE PATH. Engineering means SOLVING constraints, not blaming them.',
  enabled: true,
};
