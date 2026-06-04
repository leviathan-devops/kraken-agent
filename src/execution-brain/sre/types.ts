/**
 * src/execution-brain/sre/types.ts
 *
 * Slop Removal Engine — Type Definitions
 *
 * The SRE checks source code against the 11 Runtime Grade principles.
 * Combined with the RGE, it forms the Execution Brain.
 */

export enum SREPrinciple {
  P1_DEFENSIVE_IMPORT = 'P1_DEFENSIVE_IMPORT',
  P2_TYPE_CERTAINTY = 'P2_TYPE_CERTAINTY',
  P3_ERROR_COMPLETENESS = 'P3_ERROR_COMPLETENESS',
  P4_RESOURCE_LIFECYCLE = 'P4_RESOURCE_LIFECYCLE',
  P5_ATOMIC_STATE = 'P5_ATOMIC_STATE',
  P6_DEPENDENCY_CHECK = 'P6_DEPENDENCY_CHECK',
  P7_PATH_RESOLUTION = 'P7_PATH_RESOLUTION',
  P8_CONFIG_VALIDATION = 'P8_CONFIG_VALIDATION',
  P9_ASYNC_DISCIPLINE = 'P9_ASYNC_DISCIPLINE',
  P10_OUTPUT_CONTRACT = 'P10_OUTPUT_CONTRACT',
  P11_OUTPUT_IS_WORK = 'P11_OUTPUT_IS_WORK',
}

export interface SREInput {
  sourceFiles: string[];
  projectRoot: string;
  enabledPrinciples?: SREPrinciple[];
}

export interface SREViolation {
  principle: SREPrinciple;
  file: string;
  line: number;
  column?: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  codeSnippet?: string;
  fix?: string;
}

export interface SRECheckResult {
  principle: SREPrinciple;
  passed: boolean;
  violations: SREViolation[];
  filesChecked: number;
  durationMs: number;
}

export interface SREResult {
  passed: boolean;
  principles: SRECheckResult[];
  totalViolations: number;
  criticalCount: number;
  highCount: number;
  timestamp: string;
  filesAnalyzed: number;
}

/** Principle checker function signature */
export type PrincipleChecker = (
  sourceFiles: string[],
  projectRoot: string,
) => Promise<SRECheckResult>;
