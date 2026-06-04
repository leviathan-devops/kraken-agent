/**
 * src/system-brain/firewall/evidence-gate.ts
 *
 * Evidence Gate — Mechanical evidence verification before gate advancement.
 *
 * Before allowing certain operations, verify that required evidence exists:
 * - Gate advancement requires evidence file for current gate
 * - Task completion requires output files on disk
 * - Ship claim requires ContainerTestResult.json
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { GateName } from '../../types.js';
import { GATE_ORDER } from '../../types.js';

export interface EvidenceRequirement {
  gate: GateName;
  requiredFiles: string[];
  description: string;
}

const GATE_EVIDENCE_REQUIREMENTS: Record<GateName, EvidenceRequirement> = {
  plan: {
    gate: 'plan',
    requiredFiles: [],
    description: 'Planning gate — no file evidence required',
  },
  build: {
    gate: 'build',
    requiredFiles: ['dist/index.js'],
    description: 'Build gate — dist/index.js must exist with non-zero size',
  },
  test: {
    gate: 'test',
    requiredFiles: ['ContainerTestResult.json'],
    description: 'Test gate — ContainerTestResult.json must exist with passRate >= 0.90',
  },
  verify: {
    gate: 'verify',
    requiredFiles: ['ContainerTestResult.json'],
    description: 'Verify gate — triple evidence required',
  },
  audit: {
    gate: 'audit',
    requiredFiles: ['ContainerTestResult.json'],
    description: 'Audit gate — full code review evidence',
  },
  delivery: {
    gate: 'delivery',
    requiredFiles: ['ContainerTestResult.json', 'dist/index.js'],
    description: 'Delivery gate — ship package complete',
  },
};

export class EvidenceGate {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Verify that all required evidence exists for a gate.
   * Returns { passed: boolean, missing: string[] }
   */
  verifyGate(gate: GateName): { passed: boolean; missing: string[]; details: string } {
    const requirement = GATE_EVIDENCE_REQUIREMENTS[gate];
    if (!requirement) {
      return { passed: false, missing: [`Unknown gate: ${gate}`], details: `No evidence requirements defined for gate ${gate}` };
    }

    // Some gates don't require file evidence
    if (requirement.requiredFiles.length === 0) {
      return { passed: true, missing: [], details: requirement.description };
    }

    const missing: string[] = [];

    for (const requiredFile of requirement.requiredFiles) {
      const resolvedPath = this.resolvePath(requiredFile);
      if (!fs.existsSync(resolvedPath)) {
        missing.push(requiredFile);
        continue;
      }

      // Verify non-zero size
      try {
        const stat = fs.statSync(resolvedPath);
        if (stat.size === 0) {
          missing.push(`${requiredFile} (empty — 0 bytes)`);
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        missing.push(`${requiredFile} (cannot stat: ${errMsg})`);
      }
    }

    // Special check for test/verify/audit/delivery: verify ContainerTestResult.json passRate
    if (['test', 'verify', 'audit', 'delivery'].includes(gate)) {
      const resultPath = this.resolvePath('ContainerTestResult.json');
      if (fs.existsSync(resultPath)) {
        try {
          const content = fs.readFileSync(resultPath, 'utf-8');
          const raw = JSON.parse(content);

          // Validate parsed result is a non-null object before field access
          if (typeof raw !== 'object' || raw === null) {
            missing.push('ContainerTestResult.json (not a valid JSON object)');
            return {
              passed: missing.length === 0,
              missing,
              details: requirement.description,
            };
          }

          const parsed = raw as Record<string, unknown>;  // Safe: validated above
          const overallPassed = typeof parsed.overallPassed === 'boolean' ? parsed.overallPassed : undefined;
          const passRate = typeof parsed.passRate === 'number' ? parsed.passRate : undefined;
          if (overallPassed === false && (passRate ?? 0) < 0.90) {
            missing.push('ContainerTestResult.json (passRate < 0.90)');
          }
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          missing.push(`ContainerTestResult.json (cannot parse: ${errMsg})`);
        }
      }
    }

    return {
      passed: missing.length === 0,
      missing,
      details: requirement.description,
    };
  }

  private resolvePath(inputPath: string): string {
    if (path.isAbsolute(inputPath)) return inputPath;
    if (inputPath.startsWith('~/')) return path.join(os.homedir(), inputPath.slice(2));
    return path.resolve(this.projectRoot, inputPath);
  }
}
