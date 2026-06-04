/**
 * src/execution-brain/rge/index.ts
 *
 * Runtime Grade Engine — Orchestrator
 *
 * Creates a TypeScript Program, runs all 7 semantic analysis layers,
 * collects results, and produces the final RGEResult.
 *
 * Architecture: RGE + SRE = Execution Brain
 * RGE is the semantic half — uses ts.createProgram + TypeChecker.
 * SRE is the principle-checking half — validates P1-P11.
 */

import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import type { RGEInput, RGEResult, RGELayerResult } from './types.js';
import { RGELayer } from './types.js';
import { checkL0Syntactic } from './l0-syntactic.js';
import { checkL1TypeContract } from './l1-type-contract.js';
import { checkL2ControlFlow } from './l2-control-flow.js';
import { checkL3SymbolResolution } from './l3-symbol-resolution.js';
import { checkL4SideEffect } from './l4-side-effect.js';
import { checkL5PatternDB } from './l5-pattern-db.js';
import { buildRGEReport } from './l6-compliance.js';

export class RuntimeGradeEngine {
  private program: ts.Program | null = null;
  private checker: ts.TypeChecker | null = null;

  async analyze(input: RGEInput): Promise<RGEResult> {
    const { sourceFiles, projectRoot, compilerOptions } = input;

    // Validate inputs (P6 — verify dependencies)
    if (!sourceFiles || sourceFiles.length === 0) {
      return this.emptyResult(projectRoot, 'No source files provided');
    }

    if (!projectRoot) {
      return this.emptyResult(projectRoot, 'No project root provided');
    }

    // Filter to only existing files (P7 — verify paths exist)
    const existingFiles = sourceFiles.filter((f) => {
      try {
        return fs.existsSync(f);
      } catch (err: unknown) {
        // P3: Log stat failure with context
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[RGE] Cannot check existence of ${f}: ${errMsg}`);
        return false;
      }
    });

    if (existingFiles.length === 0) {
      return this.emptyResult(projectRoot, 'None of the provided source files exist on disk');
    }

    // Create TypeScript program
    const defaultOptions: ts.CompilerOptions = {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      ...compilerOptions,
    };

    try {
      this.program = ts.createProgram(existingFiles, defaultOptions);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[RGE] Failed to create TypeScript program: ${errMsg}`);
      return this.emptyResult(projectRoot, `TypeScript program creation failed: ${errMsg}`);
    }

    if (!this.program) {
      return this.emptyResult(projectRoot, 'TypeScript program is null after creation');
    }

    this.checker = this.program.getTypeChecker();

    // Run all layers in sequence
    const layerResults: RGELayerResult[] = [];

    // L0: Syntactic pre-filter (doesn't need program/checker)
    try {
      const l0Result = await checkL0Syntactic(existingFiles, projectRoot);
      layerResults.push(l0Result);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[RGE] L0 check failed: ${errMsg}`);
      layerResults.push(this.errorLayerResult(RGELayer.L0_SYNTACTIC, errMsg));
    }

    // L1-L5: Semantic layers (need program + checker)
    const semanticLayers: Array<{
      layer: RGELayer;
      checker: (
        files: string[],
        root: string,
        prog: ts.Program,
        chk: ts.TypeChecker,
      ) => Promise<RGELayerResult>;
    }> = [
      { layer: RGELayer.L1_TYPE_CONTRACT, checker: checkL1TypeContract },
      { layer: RGELayer.L2_CONTROL_FLOW, checker: checkL2ControlFlow },
      { layer: RGELayer.L3_SYMBOL_RESOLUTION, checker: checkL3SymbolResolution },
      { layer: RGELayer.L4_SIDE_EFFECT, checker: checkL4SideEffect },
    ];

    for (const { layer, checker: layerChecker } of semanticLayers) {
      try {
        const result = await layerChecker(existingFiles, projectRoot, this.program, this.checker);
        layerResults.push(result);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[RGE] ${layer} check failed: ${errMsg}`);
        layerResults.push(this.errorLayerResult(layer, errMsg));
      }
    }

    // L5: Pattern DB (needs program only)
    try {
      const l5Result = await checkL5PatternDB(existingFiles, projectRoot, this.program);
      layerResults.push(l5Result);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[RGE] L5 check failed: ${errMsg}`);
      layerResults.push(this.errorLayerResult(RGELayer.L5_PATTERN_DB, errMsg));
    }

    // L6: Compliance verdict
    const report = buildRGEReport(layerResults, projectRoot, existingFiles.length);

    // Cleanup (P4 — resource lifecycle)
    this.program = null;
    this.checker = null;

    return report;
  }

  private emptyResult(projectRoot: string, reason: string): RGEResult {
    return {
      passed: false,
      layers: [],
      totalViolations: 0,
      criticalCount: 0,
      highCount: 0,
      timestamp: new Date().toISOString(),
      projectRoot: projectRoot || '',
      filesAnalyzed: 0,
    };
  }

  private errorLayerResult(layer: RGELayer, error: string): RGELayerResult {
    return {
      layer,
      passed: false,
      violations: [],
      checksRun: 0,
      checksPassed: 0,
      durationMs: 0,
    };
  }
}

/** Convenience function — analyze and return result */
export async function analyzeRuntimeGrade(input: RGEInput): Promise<RGEResult> {
  const engine = new RuntimeGradeEngine();
  return engine.analyze(input);
}
