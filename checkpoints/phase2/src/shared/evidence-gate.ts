/**
 * Evidence Gate — Semantic Evidence Validation
 * 
 * Ensures that evidence is not just present, but valid and accurate.
 * Prevents "fake" evidence (empty files, outdated results, low pass rates).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { EvidenceCollector, type GateEvidence } from './evidence.js';

export class EvidenceGate {
  private collector: EvidenceCollector;
  private basePath: string;

  constructor(basePath: string = '.shark') {
    this.basePath = basePath;
    this.collector = new EvidenceCollector(basePath);
  }

  /**
   * Semantically validates evidence for a specific gate.
   * Returns true if evidence is valid, false otherwise.
   */
  validateEvidence(gate: string): boolean {
    const evidence = this.collector.getLatestEvidence(gate as any);
    if (!evidence) return false;

    // 1. Basic Pass Check
    if (!evidence.passed) return false;

    // 2. Timestamp Freshness Check (Must be within last 24 hours)
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    if (now - evidence.timestamp > oneDayMs) return false;

    // 3. Metadata Validation (The "Anti-Slopping" Check)
    if (gate === 'delivery') {
      const passRate = (evidence.metadata?.passRate as number) || 0;
      if (passRate < 0.96) return false;
    }

    // 4. File Existence Check (Prevent "Fake" file lists)
    if (evidence.files && evidence.files.length > 0) {
      for (const file of evidence.files) {
        const fullPath = path.join(this.basePath, file);
        if (!fs.existsSync(fullPath)) return false;
      }
    }

    return true;
  }

  /**
   * Checks if evidence for a gate is missing or invalid.
   */
  isMissingEvidence(gate: string): boolean {
    return !this.validateEvidence(gate);
  }
}
