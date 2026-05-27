/**
 * Evidence Collector — V1.2
 * Structured evidence collection for gate verification.
 * Every gate passage requires evidence.
 */

import fs from 'node:fs';
import path from 'node:path';

export interface EvidenceItem {
  id: string;
  type: 'file' | 'output' | 'verification' | 'decision' | 'gate-passage';
  timestamp: number;
  data: Record<string, unknown>;
  verified: boolean;
}

export interface GateEvidence {
  gateId: string;
  items: EvidenceItem[];
  allVerified: boolean;
  collectedAt: number;
}

export class EvidenceCollector {
  private evidence: Map<string, EvidenceItem[]> = new Map();
  private evidenceDir: string;

  constructor(evidenceDir?: string) {
    this.evidenceDir = evidenceDir || path.join(
      process.env.HOME || '/root',
      '.local/share/opencode/kraken-hive/evidence'
    );
    fs.mkdirSync(this.evidenceDir, { recursive: true });
  }

  /**
   * Collect evidence for a specific gate
   */
  collect(
    gateId: string,
    type: EvidenceItem['type'],
    data: Record<string, unknown>
  ): EvidenceItem {
    const item: EvidenceItem = {
      id: `ev-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type,
      timestamp: Date.now(),
      data,
      verified: false,
    };

    const items = this.evidence.get(gateId) || [];
    items.push(item);
    this.evidence.set(gateId, items);

    return item;
  }

  /**
   * Verify an evidence item after mechanical check
   */
  verify(itemId: string): boolean {
    for (const [, items] of this.evidence) {
      const item = items.find(i => i.id === itemId);
      if (item) {
        item.verified = true;
        return true;
      }
    }
    return false;
  }

  /**
   * Check if all evidence for a gate is verified
   */
  isGateVerified(gateId: string): boolean {
    const items = this.evidence.get(gateId) || [];
    return items.length > 0 && items.every(i => i.verified);
  }

  /**
   * Collect file existence evidence
   */
  collectFileEvidence(gateId: string, filePaths: string[]): EvidenceItem[] {
    return filePaths.map(p => {
      const exists = fs.existsSync(p);
      const stats = exists ? fs.statSync(p) : null;
      return this.collect(gateId, 'file', {
        path: p,
        exists,
        size: stats?.size || 0,
        modifiedAt: stats?.mtime?.toISOString(),
      });
    });
  }

  /**
   * Collect output retrieval evidence
   */
  collectOutputEvidence(
    gateId: string,
    taskId: string,
    hostPaths: string[],
    verified: boolean
  ): EvidenceItem {
    const item = this.collect(gateId, 'output', {
      taskId,
      hostPaths,
      pathCount: hostPaths.length,
    });

    if (verified) {
      this.verify(item.id);
    }

    return item;
  }

  /**
   * Collect decision record evidence
   */
  collectDecisionEvidence(description: string, type: string): EvidenceItem {
    return this.collect('plan', 'decision', {
      description,
      type,
      recordedAt: new Date().toISOString(),
    });
  }

  /**
   * Get all evidence for a gate for passage verification
   */
  getGateEvidence(gateId: string): GateEvidence {
    const items = this.evidence.get(gateId) || [];
    return {
      gateId,
      items: [...items],
      allVerified: items.length > 0 && items.every(i => i.verified),
      collectedAt: Date.now(),
    };
  }

  /**
   * Persist evidence to disk for compaction survival
   */
  persist(gateId: string): void {
    const gateEvidence = this.getGateEvidence(gateId);
    const filePath = path.join(this.evidenceDir, `${gateId}-evidence.json`);
    fs.writeFileSync(filePath, JSON.stringify(gateEvidence, null, 2));
  }

  /**
   * Clear evidence for a gate (e.g., when advancing to next gate)
   */
  clear(gateId: string): void {
    this.evidence.delete(gateId);
  }
}

let globalCollector: EvidenceCollector | null = null;

export function createEvidenceCollector(evidenceDir?: string): EvidenceCollector {
  if (!globalCollector) {
    globalCollector = new EvidenceCollector(evidenceDir);
  }
  return globalCollector;
}

export function getEvidenceCollector(): EvidenceCollector {
  if (!globalCollector) {
    globalCollector = new EvidenceCollector();
  }
  return globalCollector;
}
