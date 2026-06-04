/**
 * src/execution-brain/rge/l6-compliance.ts
 *
 * L6: Compliance Orchestration & Final Verdict
 *
 * Orchestrates all 7 RGE layers and produces the final compliance verdict.
 * Self-verification: the RGE must pass its own checks.
 */

import type { RGELayerResult, RGEResult, RGEViolation } from './types.js';
import { RGELayer } from './types.js';

export function computeCompliance(layerResults: RGELayerResult[]): {
  passed: boolean;
  totalViolations: number;
  criticalCount: number;
  highCount: number;
} {
  let totalViolations = 0;
  let criticalCount = 0;
  let highCount = 0;

  for (const result of layerResults) {
    totalViolations += result.violations.length;
    for (const v of result.violations) {
      if (v.severity === 'CRITICAL') criticalCount++;
      else if (v.severity === 'HIGH') highCount++;
    }
  }

  // Pass criteria:
  // - Zero CRITICAL violations → PASS
  // - More than 3 HIGH violations → FAIL
  // - Any CRITICAL → FAIL
  const passed = criticalCount === 0 && highCount <= 3;

  return { passed, totalViolations, criticalCount, highCount };
}

export function buildRGEReport(
  layerResults: RGELayerResult[],
  projectRoot: string,
  filesAnalyzed: number,
): RGEResult {
  const compliance = computeCompliance(layerResults);

  return {
    passed: compliance.passed,
    layers: layerResults,
    totalViolations: compliance.totalViolations,
    criticalCount: compliance.criticalCount,
    highCount: compliance.highCount,
    timestamp: new Date().toISOString(),
    projectRoot,
    filesAnalyzed,
  };
}

/** Extract blocking violations (CRITICAL + HIGH) from layer results */
export function getBlockingViolations(layerResults: RGELayerResult[]): RGEViolation[] {
  const blocking: RGEViolation[] = [];
  for (const result of layerResults) {
    for (const v of result.violations) {
      if (v.severity === 'CRITICAL' || v.severity === 'HIGH') {
        blocking.push(v);
      }
    }
  }
  return blocking;
}
