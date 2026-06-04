/**
 * src/execution-brain/index.ts
 *
 * Execution Brain — RGE + SRE Unified Orchestrator
 *
 * The Execution Brain is the algorithmic enforcement engine of Kraken.
 * It combines:
 *   - RGE (Runtime Grade Engine): 7-layer semantic analysis via TypeScript Compiler API
 *   - SRE (Slop Removal Engine): P1-P11 principle checks
 *
 * Both run at the TEST gate to verify code quality before shipping.
 * 100% algorithmic at runtime. Model as SLAVE (build-time data conversion only).
 * Engine as MASTER (mechanical evidence transitions, no subjective gates).
 */

import * as path from 'path';
import * as fs from 'fs';
import { RuntimeGradeEngine } from './rge/index.js';
import { SlopRemovalEngine } from './sre/index.js';
import type { RGEInput, RGEResult } from './rge/types.js';
import type { SREInput, SREResult } from './sre/types.js';
import type { ExecutionBrainState, ExecutionBrainOutput } from '../types.js';

export class ExecutionBrain {
  private rge: RuntimeGradeEngine;
  private sre: SlopRemovalEngine;
  private state: ExecutionBrainState;

  constructor() {
    this.rge = new RuntimeGradeEngine();
    this.sre = new SlopRemovalEngine();
    this.state = {
      rgeResults: null,
      sreResults: null,
      overallPassed: false,
      gateReady: false,
      lastAnalysis: null,
      totalCritical: 0,
      totalHigh: 0,
    };
  }

  /**
   * Run full execution brain analysis on a project.
   * Runs both RGE and SRE, then combines results.
   */
  async analyze(projectRoot: string): Promise<ExecutionBrainOutput> {
    // Collect source files from project
    const sourceFiles = await this.collectSourceFiles(projectRoot);

    if (sourceFiles.length === 0) {
      this.state.overallPassed = false;
      return {
        passed: false,
        rgeReport: null,
        sreReport: null,
        blockingViolations: [{
          source: 'SRE',
          principle: 'NO_SOURCE_FILES',
          severity: 'CRITICAL' as const,
          message: 'No source files found to analyze',
          file: projectRoot,
          line: 0,
        }],
      };
    }

    // Run RGE (semantic analysis)
    let rgeResult: RGEResult | null = null;
    try {
      const rgeInput: RGEInput = {
        sourceFiles,
        projectRoot,
      };
      rgeResult = await this.rge.analyze(rgeInput);
      this.state.rgeResults = rgeResult;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[ExecutionBrain] RGE analysis failed: ${errMsg}`);
      // P3: RGE failure is itself a CRITICAL violation — cannot verify runtime grade
    }

    // If RGE failed, add synthetic CRITICAL violation
    const syntheticViolations: ExecutionBrainOutput['blockingViolations'] = [];
    if (rgeResult === null) {
      syntheticViolations.push({
        source: 'RGE',
        principle: 'ANALYSIS_FAILURE',
        severity: 'CRITICAL' as const,
        message: 'RGE analysis failed to complete — cannot verify runtime grade',
        file: projectRoot,
        line: 0,
      });
    }

    // Run SRE (principle checks)
    let sreResult: SREResult | null = null;
    try {
      const sreInput: SREInput = {
        sourceFiles,
        projectRoot,
      };
      sreResult = await this.sre.analyze(sreInput);
      this.state.sreResults = sreResult;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[ExecutionBrain] SRE analysis failed: ${errMsg}`);
      // P3: SRE failure is itself a CRITICAL violation — cannot verify principle compliance
    }

    // If SRE failed, add synthetic CRITICAL violation
    if (sreResult === null) {
      syntheticViolations.push({
        source: 'SRE',
        principle: 'ANALYSIS_FAILURE',
        severity: 'CRITICAL' as const,
        message: 'SRE analysis failed to complete — cannot verify principle compliance',
        file: projectRoot,
        line: 0,
      });
    }

    // Combine results
    const blockingViolations = [
      ...syntheticViolations,
      ...this.collectBlockingViolations(rgeResult, sreResult),
    ];

    // Determine overall pass/fail
    const rgePassed = rgeResult?.passed ?? false;
    const srePassed = sreResult?.passed ?? false;
    const overallPassed = rgePassed && srePassed && blockingViolations.length === 0;

    // Update state
    this.state.overallPassed = overallPassed;
    this.state.gateReady = overallPassed;
    this.state.lastAnalysis = new Date().toISOString();
    this.state.totalCritical = blockingViolations.filter((v) => v.severity === 'CRITICAL').length;
    this.state.totalHigh = blockingViolations.filter((v) => v.severity === 'HIGH').length;

    return {
      passed: overallPassed,
      rgeReport: rgeResult,
      sreReport: sreResult,
      blockingViolations,
    };
  }

  getState(): ExecutionBrainState {
    return { ...this.state };
  }

  isGateReady(): boolean {
    return this.state.gateReady;
  }

  private async collectSourceFiles(projectRoot: string): Promise<string[]> {
    const extensions = ['.ts', '.tsx'];
    const files: string[] = [];

    async function walk(dir: string): Promise<void> {
      let entries: fs.Dirent[];
      try {
        entries = await fs.promises.readdir(dir, { withFileTypes: true });
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[ExecutionBrain] Cannot read directory ${dir}: ${errMsg}`);
        return;
      }

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // Skip node_modules, dist, .git
        if (entry.isDirectory()) {
          if (['node_modules', 'dist', '.git', 'coverage', '.turbo'].includes(entry.name)) {
            continue;
          }
          await walk(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    }

    await walk(projectRoot);
    return files;
  }

  private collectBlockingViolations(
    rgeResult: RGEResult | null,
    sreResult: SREResult | null,
  ): ExecutionBrainOutput['blockingViolations'] {
    const violations: ExecutionBrainOutput['blockingViolations'] = [];

    // Collect RGE blocking violations
    if (rgeResult) {
      for (const layer of rgeResult.layers) {
        for (const v of layer.violations) {
          if (v.severity === 'CRITICAL' || v.severity === 'HIGH') {
            violations.push({
              source: 'RGE',
              principle: v.principle,
              severity: v.severity,
              message: v.message,
              file: v.file,
              line: v.line,
            });
          }
        }
      }
    }

    // Collect SRE blocking violations
    if (sreResult) {
      for (const check of sreResult.principles) {
        for (const v of check.violations) {
          if (v.severity === 'CRITICAL' || v.severity === 'HIGH') {
            violations.push({
              source: 'SRE',
              principle: v.principle,
              severity: v.severity,
              message: v.description,
              file: v.file,
              line: v.line,
            });
          }
        }
      }
    }

    return violations;
  }
}
