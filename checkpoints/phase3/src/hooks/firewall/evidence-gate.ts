import fs from 'node:fs';
import path from 'node:path';
import { Threshold } from './types.js';

export class EvidenceGate {
  private workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
  }

  /**
   * check verifies that mechanical evidence exists and meets the threshold.
   * Evidence file must satisfy: overallPassed === true AND passRate >= 0.96
   */
  check(evidenceFileName: string): boolean {
    try {
      const evidencePath = path.join(
        this.workspacePath,
        '.shark',
        'evidence',
        'delivery',
        evidenceFileName,
      );

      if (!fs.existsSync(evidencePath)) {
        return false;
      }

      const raw = fs.readFileSync(evidencePath, 'utf-8');
      const data: unknown = JSON.parse(raw);

      const threshold = data as Threshold;
      return (
        threshold.overallPassed === true &&
        typeof threshold.passRate === 'number' &&
        threshold.passRate >= 0.96
      );
    } catch {
      return false;
    }
  }
}
