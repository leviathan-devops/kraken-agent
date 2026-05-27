/**
 * L5: Macro Derailment Detection
 * Focus collisions, planner-executor desync, context stale, premature completion.
 */

interface MacroCheck {
  type: 'focus_collision' | 'planner_executor_desync' | 'context_stale' | 'premature_completion';
  patterns: RegExp[];
  reason: string;
}

const MACRO_CHECKS: MacroCheck[] = [
  {
    type: 'focus_collision',
    patterns: [
      /already.*working.*on/i,
      /another.*agent.*handling/i,
      /conflict.*with.*existing/i,
      /duplicate.*task/i,
    ],
    reason: 'focus-collision-detected',
  },
  {
    type: 'planner_executor_desync',
    patterns: [
      /plan.*changed.*after.*start/i,
      /diverged.*from.*plan/i,
      /different.*than.*planned/i,
      /not.*what.*was.*requested/i,
    ],
    reason: 'planner-executor-desync',
  },
  {
    type: 'context_stale',
    patterns: [
      /based.*on.*old.*context/i,
      /stale.*information/i,
      /outdated.*spec/i,
      /since.*last.*update/i,
      /workspace.*changed/i,
    ],
    reason: 'context-stale',
  },
  {
    type: 'premature_completion',
    patterns: [
      /early.*return/i,
      /skip.*remaining/i,
      /rest.*later/i,
      /finish.*later/i,
      /partial.*complete/i,
    ],
    reason: 'premature-completion',
  },
];

export interface L5CheckResult {
  passed: boolean;
  reason?: string;
  layer: 'L5';
  derailmentType?: string;
}

export function checkMacroDerailment(message: string): L5CheckResult {
  for (const check of MACRO_CHECKS) {
    for (const pattern of check.patterns) {
      if (pattern.test(message)) {
        return {
          passed: false,
          layer: 'L5',
          reason: `[L5_MACRO_DERAILMENT] ${check.reason}: ${check.type}`,
          derailmentType: check.type,
        };
      }
    }
  }

  return { passed: true, layer: 'L5' };
}
