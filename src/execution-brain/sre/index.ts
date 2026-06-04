/**
 * src/execution-brain/sre/index.ts
 *
 * Slop Removal Engine — Orchestrator
 *
 * Runs all P1-P11 principle checks on source files.
 * Combined with the RGE, it forms the Execution Brain.
 */

import * as fs from 'fs';
import { SREPrinciple } from './types.js';
import type { SREInput, SREResult, SRECheckResult } from './types.js';
import {
  checkP1, checkP2, checkP3, checkP4, checkP5,
  checkP6, checkP7, checkP8, checkP9, checkP10, checkP11,
} from './checks.js';

const ALL_PRINCIPLES = Object.values(SREPrinciple);

const CHECKERS: Record<SREPrinciple, (files: string[], root: string) => Promise<SRECheckResult>> = {
  [SREPrinciple.P1_DEFENSIVE_IMPORT]: checkP1,
  [SREPrinciple.P2_TYPE_CERTAINTY]: checkP2,
  [SREPrinciple.P3_ERROR_COMPLETENESS]: checkP3,
  [SREPrinciple.P4_RESOURCE_LIFECYCLE]: checkP4,
  [SREPrinciple.P5_ATOMIC_STATE]: checkP5,
  [SREPrinciple.P6_DEPENDENCY_CHECK]: checkP6,
  [SREPrinciple.P7_PATH_RESOLUTION]: checkP7,
  [SREPrinciple.P8_CONFIG_VALIDATION]: checkP8,
  [SREPrinciple.P9_ASYNC_DISCIPLINE]: checkP9,
  [SREPrinciple.P10_OUTPUT_CONTRACT]: checkP10,
  [SREPrinciple.P11_OUTPUT_IS_WORK]: checkP11,
};

export class SlopRemovalEngine {
  async analyze(input: SREInput): Promise<SREResult> {
    const { sourceFiles, projectRoot, enabledPrinciples } = input;

    if (!sourceFiles || sourceFiles.length === 0) {
      return {
        passed: false,
        principles: [],
        totalViolations: 0,
        criticalCount: 0,
        highCount: 0,
        timestamp: new Date().toISOString(),
        filesAnalyzed: 0,
      };
    }

    // Filter to existing files (P7)
    const existingFiles = sourceFiles.filter((f) => {
      try {
        return fs.existsSync(f);
      } catch (err: unknown) {
        // P3: Log stat failure with context — file may be inaccessible
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[SRE] Cannot check existence of ${f}: ${errMsg}`);
        return false;
      }
    });

    const principles = enabledPrinciples ?? ALL_PRINCIPLES;
    const results: SRECheckResult[] = [];

    for (const principle of principles) {
      const checker = CHECKERS[principle];
      if (!checker) {
        console.error(`[SRE] No checker for principle: ${principle}`);
        continue;
      }

      try {
        const result = await checker(existingFiles, projectRoot);
        results.push(result);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[SRE] ${principle} check failed: ${errMsg}`);
        results.push({
          principle,
          passed: false,
          violations: [],
          filesChecked: 0,
          durationMs: 0,
        });
      }
    }

    // Compute overall pass/fail
    let totalViolations = 0;
    let criticalCount = 0;
    let highCount = 0;

    for (const result of results) {
      totalViolations += result.violations.length;
      for (const v of result.violations) {
        if (v.severity === 'CRITICAL') criticalCount++;
        else if (v.severity === 'HIGH') highCount++;
      }
    }

    // Pass criteria: zero CRITICAL, max 3 HIGH
    const passed = criticalCount === 0 && highCount <= 3;

    return {
      passed,
      principles: results,
      totalViolations,
      criticalCount,
      highCount,
      timestamp: new Date().toISOString(),
      filesAnalyzed: existingFiles.length,
    };
  }
}

/** Convenience function — analyze and return result */
export async function analyzeSlop(input: SREInput): Promise<SREResult> {
  const engine = new SlopRemovalEngine();
  return engine.analyze(input);
}
