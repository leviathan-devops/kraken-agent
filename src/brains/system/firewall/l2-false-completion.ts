/**
 * L2: False Completion Detection — MILITARY GRADE
 *
 * Blocks completion claims without output retrieval.
 * Pattern check FIRST, then mechanical verification.
 *
 * FIXED: Mechanical checks now only apply when patterns MATCH.
 * Previously blocked ALL tool calls because outputsRetrieved was always false.
 */

const FALSE_COMPLETION_PATTERNS = [
  { pattern: /task.*complete/i, reason: 'completion-claim-without-verification' },
  { pattern: /build.*passed/i, reason: 'build-passed-without-output-check' },
  { pattern: /tests.*pass/i, reason: 'tests-passed-without-evidence' },
  { pattern: /all.*good/i, reason: 'all-good-without-verification' },
  { pattern: /done.*already/i, reason: 'done-already-claim' },
  { pattern: /finished.*it/i, reason: 'finished-claim' },
  { pattern: /no.*issues/i, reason: 'no-issues-claim' },
  { pattern: /it.*works.*trust.*me/i, reason: 'trust-me-claim' },
  { pattern: /output.*not.*needed/i, reason: 'output-not-needed-excuse' },
  { pattern: /output.*unnecessary/i, reason: 'output-unnecessary-excuse' },
  { pattern: /verified.*in.*container/i, reason: 'container-only-verification' },
  { pattern: /container.*filesystem.*verified/i, reason: 'container-fs-not-host' },
  { pattern: /(15|16|17|18|19)\s*(out\s*of|\/)\s*(16|17|18|19|20|21|22|23|24|25)\s+(is|are)\s+(good|enough|fine|ok|acceptable)/i, reason: 'partial-pass-claim' },
  { pattern: /\b(9[0-5]|[8-9][0-9])%\s+(is|are)\s+(good|enough|fine|ok|acceptable|passing)/i, reason: 'percentage-pass-claim' },
  { pattern: /\b(my|the)\s+(code|fix|solution)\s+is\s+(correct|right|fine|working)/i, reason: 'unverified-code-claim' },
  { pattern: /\b(must|definitely|certainly|surely|without\s+a\s+doubt)\s+(be|work|pass)/i, reason: 'certainty-claim-without-evidence' },
  { pattern: /\b(verified|confirmed|validated)\s+(it|this|that|everything|the)\s+(works?|is\s+correct|is\s+done)\b/i, reason: 'self-verification-claim' },
];

export interface L2CheckResult {
  passed: boolean;
  reason?: string;
  layer: 'L2';
  matchedPattern?: string;
  outputsRetrieved?: boolean;
}

export function checkFalseCompletion(
  message: string,
  outputsRetrieved: boolean,
  filesOnHost: string[]
): L2CheckResult {
  // STEP 1: Check if the message matches ANY false completion pattern FIRST
  let matchedReason: string | undefined;
  let matchedPatternSource: string | undefined;

  for (const { pattern, reason } of FALSE_COMPLETION_PATTERNS) {
    if (pattern.test(message)) {
      matchedReason = reason;
      matchedPatternSource = pattern.source;
      break;
    }
  }

  // No pattern match — allow
  if (!matchedReason) {
    return { passed: true, layer: 'L2', outputsRetrieved };
  }

  // STEP 2: Pattern matched — now verify mechanical evidence
  if (!outputsRetrieved) {
    return {
      passed: false,
      layer: 'L2',
      reason: `[L2_FALSE_COMPLETION] ${matchedReason} — outputs not retrieved`,
      matchedPattern: matchedPatternSource,
      outputsRetrieved: false,
    };
  }

  if (filesOnHost.length === 0) {
    return {
      passed: false,
      layer: 'L2',
      reason: `[L2_FALSE_COMPLETION] ${matchedReason} — no files verified on host`,
      matchedPattern: matchedPatternSource,
      outputsRetrieved: false,
    };
  }

  // Pattern matched and evidence exists — allow
  return { passed: true, layer: 'L2', outputsRetrieved };
}
