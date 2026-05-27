/**
 * L4: Wrong Cluster Detection
 * Alpha = steamroll (build, feature, implement)
 * Beta = precision (debug, fix, refactor, analyze)
 * Gamma = testing (test, verify, audit)
 * Wrong cluster = wrong approach = wasted time.
 */

export const TASK_DOMAIN_MAP: Record<string, string> = {
  'build': 'alpha',
  'create': 'alpha',
  'implement': 'alpha',
  'feature': 'alpha',
  'write': 'alpha',
  'scaffold': 'alpha',
  'prototype': 'alpha',

  'debug': 'beta',
  'fix': 'beta',
  'refactor': 'beta',
  'analyze': 'beta',
  'investigate': 'beta',
  'review': 'beta',
  'examine': 'beta',
  'inspect': 'beta',

  'test': 'gamma',
  'verify': 'gamma',
  'validate': 'gamma',
  'audit': 'gamma',
  'assess': 'gamma',
  'integration': 'gamma',
};

export const CLUSTER_MAP: Record<string, string> = {
  'alpha': 'cluster-alpha',
  'cluster-alpha': 'cluster-alpha',
  'beta': 'cluster-beta',
  'cluster-beta': 'cluster-beta',
  'gamma': 'cluster-gamma',
  'cluster-gamma': 'cluster-gamma',
};

const WRONG_CLUSTER_PATTERNS = [
  { pattern: /debug.*alpha/i, reason: 'debug-task-to-alpha' },
  { pattern: /fix.*alpha/i, reason: 'fix-task-to-alpha' },
  { pattern: /test.*alpha/i, reason: 'test-task-to-alpha' },
  { pattern: /build.*gamma/i, reason: 'build-task-to-gamma' },
  { pattern: /implement.*gamma/i, reason: 'implement-task-to-gamma' },
];

export interface L4CheckResult {
  valid: boolean;
  reason?: string;
  layer: 'L4';
}

export function checkWrongCluster(
  taskDescription: string,
  taskType: string,
  targetCluster: string
): L4CheckResult {
  const expectedDomain = TASK_DOMAIN_MAP[taskType] || 'alpha';
  const resolvedTarget = CLUSTER_MAP[targetCluster] || targetCluster;
  const resolvedExpected = CLUSTER_MAP[expectedDomain] || `cluster-${expectedDomain}`;

  if (resolvedTarget !== resolvedExpected) {
    return {
      valid: false,
      layer: 'L4',
      reason: `[L4_WRONG_CLUSTER] Task type '${taskType}' belongs to ${resolvedExpected}, not ${resolvedTarget}`,
    };
  }

  // Pattern-based detection
  for (const { pattern, reason } of WRONG_CLUSTER_PATTERNS) {
    if (pattern.test(taskDescription)) {
      return {
        valid: false,
        layer: 'L4',
        reason: `[L4_WRONG_CLUSTER] ${reason} detected in task description`,
      };
    }
  }

  return { valid: true, layer: 'L4' };
}
