/**
 * src/execution-brain/rge/types.ts
 *
 * Runtime Grade Engine — Type Definitions
 *
 * The RGE performs 7-layer semantic analysis using the TypeScript Compiler API.
 * L0: Syntactic pre-filter (regex acceptable here ONLY)
 * L1: Type contract enforcement (TypeChecker)
 * L2: Control flow & liveness analysis
 * L3: Symbol resolution & architecture
 * L4: Side-effect truth (P11 — Output is the Work)
 * L5: Cross-project pattern database
 * L6: Compliance orchestration & verdict
 */

export enum RGELayer {
  L0_SYNTACTIC = 'L0_SYNTACTIC',
  L1_TYPE_CONTRACT = 'L1_TYPE_CONTRACT',
  L2_CONTROL_FLOW = 'L2_CONTROL_FLOW',
  L3_SYMBOL_RESOLUTION = 'L3_SYMBOL_RESOLUTION',
  L4_SIDE_EFFECT = 'L4_SIDE_EFFECT',
  L5_PATTERN_DB = 'L5_PATTERN_DB',
  L6_COMPLIANCE = 'L6_COMPLIANCE',
}

export interface RGEInput {
  sourceFiles: string[];
  projectRoot: string;
  compilerOptions?: Record<string, unknown>;
}

export interface RGEViolation {
  principle: string;
  layer: RGELayer;
  message: string;
  file: string;
  line: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  fix?: string;
  nodeText?: string;
}

export interface RGELayerResult {
  layer: RGELayer;
  passed: boolean;
  violations: RGEViolation[];
  checksRun: number;
  checksPassed: number;
  durationMs: number;
}

export interface RGEResult {
  passed: boolean;
  layers: RGELayerResult[];
  totalViolations: number;
  criticalCount: number;
  highCount: number;
  timestamp: string;
  projectRoot: string;
  filesAnalyzed: number;
}

export type ViolationSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

/** Layer check function signature */
export type LayerChecker = (
  sourceFiles: string[],
  projectRoot: string,
  program: import('typescript').Program,
  checker: import('typescript').TypeChecker,
) => Promise<RGELayerResult>;
