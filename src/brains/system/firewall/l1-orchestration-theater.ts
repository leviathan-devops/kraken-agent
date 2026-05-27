/**
 * L1: Orchestration Theater Detection
 * Blocks "assigned = complete", "spawned = done", "queued = in progress" claims.
 */

const THEATER_PATTERNS = [
  // Spawn success = done
  { pattern: /spawn.*success/i, reason: 'spawn-success-is-not-done' },
  { pattern: /task.*spawned.*complete/i, reason: 'spawned-is-not-complete' },
  { pattern: /assigned.*done/i, reason: 'assigned-is-not-done' },
  { pattern: /queued.*complete/i, reason: 'queued-is-not-complete' },
  // Status inflation
  { pattern: /status.*complete.*without.*output/i, reason: 'complete-without-output' },
  { pattern: /success.*without.*retriev/i, reason: 'success-without-retrieval' },
  // Skip patterns
  { pattern: /skip.*verification/i, reason: 'skip-verification' },
  { pattern: /bypass.*gate/i, reason: 'bypass-gate' },
];

export interface L1CheckResult {
  passed: boolean;
  reason?: string;
  layer: 'L1';
  matchedPattern?: string;
}

export function checkOrchestrationTheater(
  message: string,
  status?: string
): L1CheckResult {
  // Check status-level theater claims
  if (status) {
    const theaterStatuses: Record<string, string> = {
      'assigned': 'Task assigned but not executed',
      'queued': 'Task queued but not started',
      'spawned': 'Task spawned but not tracked',
      'in_progress': 'Task in progress, not complete',
    };
    if (theaterStatuses[status]) {
      return {
        passed: false,
        layer: 'L1',
        reason: `[L1_THEATER] ${theaterStatuses[status]}`,
      };
    }
  }

  // Check message content for theater patterns
  for (const { pattern, reason } of THEATER_PATTERNS) {
    if (pattern.test(message)) {
      return {
        passed: false,
        layer: 'L1',
        reason: `[L1_THEATER] ${reason}`,
        matchedPattern: pattern.source,
      };
    }
  }

  return { passed: true, layer: 'L1' };
}
