/**
 * L2: False Completion Detection
 * Blocks completion claims without output retrieval.
 * Output retrieval is MANDATORY — task completion ≠ outputs on host.
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
  // Mechanical check: outputs MUST be retrieved
  if (!outputsRetrieved) {
    return {
      passed: false,
      layer: 'L2',
      reason: '[L2_FALSE_COMPLETION] Task claims completion but outputs not retrieved',
      outputsRetrieved: false,
    };
  }

  // Mechanical check: files MUST exist on host
  if (filesOnHost.length === 0) {
    return {
      passed: false,
      layer: 'L2',
      reason: '[L2_FALSE_COMPLETION] No files verified on host filesystem',
      outputsRetrieved: false,
    };
  }

  // Check message for false completion patterns
  for (const { pattern, reason } of FALSE_COMPLETION_PATTERNS) {
    if (pattern.test(message)) {
      return {
        passed: false,
        layer: 'L2',
        reason: `[L2_FALSE_COMPLETION] ${reason}`,
        matchedPattern: pattern.source,
        outputsRetrieved,
      };
    }
  }

  return { passed: true, layer: 'L2', outputsRetrieved };
}
