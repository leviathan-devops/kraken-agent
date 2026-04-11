/**
 * Evidence System
 * 
 * Mandatory evidence collection for every gate.
 * Evidence is archived to .shark/evidence/{gate}/{timestamp}/
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

export type GateName = 'plan' | 'build' | 'test' | 'verify' | 'audit' | 'delivery';

export interface GateEvidence {
  gate: GateName;
  timestamp: number;
  passed: boolean;
  files: string[];
  metadata?: Record<string, unknown>;
  debugLog?: string;
}

export interface IterationEvidence {
  iteration: string;
  timestamp: number;
  debugLogs: string[];
  gateAttempts: Record<GateName, number>;
}

const EVIDENCE_DIR = '.shark/evidence';
const ITERATIONS_DIR = '.shark/iterations';

export class EvidenceCollector {
  private basePath: string;

  constructor(basePath: string = '.shark') {
    this.basePath = basePath;
  }

  collectEvidence(evidence: GateEvidence): void {
    const gateDir = path.join(this.basePath, EVIDENCE_DIR, evidence.gate);
    const timestampDir = path.join(gateDir, String(evidence.timestamp));

    this.ensureDir(timestampDir);

    const metaPath = path.join(timestampDir, 'evidence.json');
    fs.writeFileSync(metaPath, JSON.stringify(evidence, null, 2));

    if (evidence.debugLog) {
      fs.writeFileSync(path.join(timestampDir, 'debug.log'), evidence.debugLog);
    }
  }

  collectDebugLog(iteration: string, attempt: number, debugLog: string): void {
    const iterDir = path.join(this.basePath, ITERATIONS_DIR, iteration, 'debug-logs');
    this.ensureDir(iterDir);

    const logPath = path.join(iterDir, `attempt-${attempt}.md`);
    fs.writeFileSync(logPath, debugLog);
  }

  recordIteration(evidence: IterationEvidence): void {
    const iterDir = path.join(this.basePath, ITERATIONS_DIR, evidence.iteration);
    this.ensureDir(iterDir);

    const metaPath = path.join(iterDir, 'iteration.json');
    fs.writeFileSync(metaPath, JSON.stringify(evidence, null, 2));
  }

  getGateEvidence(gate: GateName): GateEvidence[] {
    const gateDir = path.join(this.basePath, EVIDENCE_DIR, gate);
    if (!fs.existsSync(gateDir)) return [];

    const evidences: GateEvidence[] = [];
    const entries = fs.readdirSync(gateDir);

    for (const entry of entries) {
      const evidencePath = path.join(gateDir, entry, 'evidence.json');
      if (fs.existsSync(evidencePath)) {
        try {
          const content = fs.readFileSync(evidencePath, 'utf-8');
          evidences.push(JSON.parse(content));
        } catch {
          // Skip invalid evidence files
        }
      }
    }

    return evidences.sort((a, b) => b.timestamp - a.timestamp);
  }

  getLatestEvidence(gate: GateName): GateEvidence | null {
    const evidences = this.getGateEvidence(gate);
    return evidences[0] || null;
  }

  getIterationLogs(iteration: string): string[] {
    const logsDir = path.join(this.basePath, ITERATIONS_DIR, iteration, 'debug-logs');
    if (!fs.existsSync(logsDir)) return [];

    return fs.readdirSync(logsDir)
      .filter(f => f.endsWith('.md'))
      .sort()
      .map(f => fs.readFileSync(path.join(logsDir, f), 'utf-8'));
  }

  hasCompleteEvidence(): boolean {
    const gates: GateName[] = ['plan', 'build', 'test', 'verify', 'audit', 'delivery'];
    return gates.every(gate => this.getGateEvidence(gate).length > 0);
  }

  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

export interface DebugLogFormat {
  issue: string;
  location: string;
  rootCause: string;
  fix: string;
  iteration: string;
}

export function formatDebugLog(data: DebugLogFormat): string {
  return `╔══════════════════════════════════════════════════════════════════════════╗
║ SHARK DEBUG LOG — ${data.iteration}
╚══════════════════════════════════════════════════════════════════════════╝

ISSUE: ${data.issue}

LOCATION: ${data.location}

ROOT CAUSE: ${data.rootCause}

FIX: ${data.fix}

ITERATION: ${data.iteration}
`;
}
