/**
 * src/system-brain/firewall/evidence-gate.ts
 *
 * Mechanical proof verification for evidence-gated layers.
 *
 * Evidence files are JSON files in .kraken/evidence/delivery/
 * that prove a gate was passed mechanically.
 *
 * Format:
 * {
 *   "overallPassed": true,
 *   "passRate": 0.98
 * }
 *
 * A pass requires:
 * - overallPassed === true
 * - passRate >= 0.96 (96%)
 */

import fs from 'node:fs';
import path from 'node:path';

interface Threshold {
  overallPassed: boolean;
  passRate: number;
}

export class EvidenceGate {
  private workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
  }

  /**
   * check — verifies mechanical evidence exists and meets threshold.
   *
   * @param evidenceFileName - Filename in .kraken/evidence/delivery/
   * @returns true if evidence exists and meets threshold
   */
  check(evidenceFileName: string): boolean {
    try {
      const evidencePath = path.join(
        this.workspacePath,
        '.kraken',
        'evidence',
        'delivery',
        evidenceFileName,
      );

      // Check file exists
      if (!fs.existsSync(evidencePath)) {
        return false;
      }

      // Read and parse
      const raw = fs.readFileSync(evidencePath, 'utf-8');
      const data = JSON.parse(raw) as Threshold;

      // Verify threshold
      return (
        data.overallPassed === true &&
        typeof data.passRate === 'number' &&
        data.passRate >= 0.96
      );
    } catch {
      // Any error = evidence check fails
      return false;
    }
  }
}
