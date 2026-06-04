/**
 * src/shared/evidence-collector.ts
 *
 * Evidence collection and persistence for gate verification.
 * Every gate advancement requires mechanical evidence on disk.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { EvidenceData } from '../types.js';
import { createLogger } from './logger.js';

const logger = createLogger('EvidenceCollector');

class EvidenceCollector {
  private evidence: Map<string, EvidenceData[]> = new Map();
  private evidenceDir: string;

  constructor(evidenceDir?: string) {
    this.evidenceDir = evidenceDir ?? path.join(os.homedir(), '.kraken', 'evidence');
  }

  collect(gate: string, type: string, payload: Record<string, unknown>): void {
    const data: EvidenceData = {
      gate,
      type,
      payload,
      timestamp: Date.now(),
    };

    const existing = this.evidence.get(gate) || [];
    existing.push(data);
    this.evidence.set(gate, existing);
  }

  async persist(gate: string): Promise<void> {
    const entries = this.evidence.get(gate);
    if (!entries || entries.length === 0) {
      logger.warn(`No evidence to persist for gate: ${gate}`);
      return;
    }

    try {
      const gateDir = path.join(this.evidenceDir, gate);
      await fs.promises.mkdir(gateDir, { recursive: true });
      const filePath = path.join(gateDir, `evidence-${Date.now()}.json`);
      await fs.promises.writeFile(filePath, JSON.stringify(entries, null, 2), 'utf-8');
      logger.info(`Evidence persisted for gate ${gate}: ${filePath}`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to persist evidence for gate ${gate}: ${errMsg}`);
    }
  }

  getEvidence(gate: string): EvidenceData[] {
    return this.evidence.get(gate) || [];
  }
}

let instance: EvidenceCollector | null = null;

export function createEvidenceCollector(evidenceDir?: string): EvidenceCollector {
  instance = new EvidenceCollector(evidenceDir);
  return instance;
}

export function getEvidenceCollector(): EvidenceCollector {
  if (!instance) {
    instance = new EvidenceCollector();
  }
  return instance;
}
