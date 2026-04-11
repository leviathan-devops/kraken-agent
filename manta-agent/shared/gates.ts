/**
 * Gates — Mechanical Enforcement Layer
 * 
 * Gate chain: PLAN → BUILD → TEST → VERIFY → AUDIT → SHIP
 * 
 * VERIFY failure triggers iteration loop:
 *   VERIFY fail → BUILD → TEST → VERIFY (max 3 attempts)
 *   After 3 failures → escalate to PLAN with new iteration (V1.0 → V1.1)
 */

import { EvidenceCollector, type GateName, type GateEvidence } from './evidence.js';

export type GateStatus = 'pending' | 'blocked' | 'passed' | 'failed';

export interface GateCriteria {
  gate: GateName;
  blockingCriteria: string[];
  evidenceRequired: string[];
}

export const GATE_CHAIN: GateName[] = ['plan', 'build', 'test', 'verify', 'audit', 'delivery'];

export const GATE_CRITERIA: Record<GateName, GateCriteria> = {
  plan: {
    gate: 'plan',
    blockingCriteria: [
      'Clear requirements defined',
      'SPEC.md generated',
      'Scope boundaries defined',
      'Acceptance criteria defined',
    ],
    evidenceRequired: ['SPEC.md', 'GuardianConfig.json'],
  },
  build: {
    gate: 'build',
    blockingCriteria: [
      'Files created per SPEC.md',
      'No scope violations',
      'Implementation matches spec',
    ],
    evidenceRequired: ['FileManifest.json', 'GitDiff.txt'],
  },
  test: {
    gate: 'test',
    blockingCriteria: [
      'Tests pass',
      'Coverage ≥ 80%',
      'No weak assertions (toBeTruthy banned)',
    ],
    evidenceRequired: ['TestResults.xml', 'CoverageReport.json'],
  },
  verify: {
    gate: 'verify',
    blockingCriteria: [
      'SPEC.md alignment verified',
      'Integration tests pass',
      'Edge cases handled',
      'No theatrical code',
      'Error handling complete',
    ],
    evidenceRequired: ['VerificationReport.json'],
  },
  audit: {
    gate: 'audit',
    blockingCriteria: [
      'SAST clean (0 critical/high)',
      'No secrets detected',
      'Dependencies audited (no critical CVEs)',
    ],
    evidenceRequired: ['SASTReport.json', 'SecretsScan.json', 'AuditReport.json'],
  },
  delivery: {
    gate: 'delivery',
    blockingCriteria: [
      'All previous gates passed',
      'Evidence archived',
      'Checkpoint created',
    ],
    evidenceRequired: ['EvidenceArchive.zip', 'DeliverySummary.md'],
  },
};

export class GateManager {
  private currentGate: GateName = 'plan';
  private gateStatus: Record<GateName, GateStatus> = {
    plan: 'pending',
    build: 'pending',
    test: 'pending',
    verify: 'pending',
    audit: 'pending',
    delivery: 'pending',
  };
  private verifyAttempts: number = 0;
  private currentIteration: string = 'V1.0';
  private evidenceCollector: EvidenceCollector;
  private iterationAttempts: Record<string, number> = {};

  constructor(basePath: string = '.manta') {
    this.evidenceCollector = new EvidenceCollector(basePath);
  }

  getCurrentGate(): GateName {
    return this.currentGate;
  }

  getGateStatuses(): Record<GateName, GateStatus> {
    return { ...this.gateStatus };
  }

  getCurrentIteration(): string {
    return this.currentIteration;
  }

  canTransition(to: GateName): boolean {
    const currentIndex = GATE_CHAIN.indexOf(this.currentGate);
    const targetIndex = GATE_CHAIN.indexOf(to);

    if (targetIndex <= currentIndex) return false;
    if (targetIndex > currentIndex + 1) return false;

    return true;
  }

  transitionTo(to: GateName): boolean {
    if (!this.canTransition(to)) {
      return false;
    }

    this.gateStatus[this.currentGate] = 'passed';
    this.currentGate = to;
    this.gateStatus[to] = 'blocked';

    if (to === 'verify') {
      this.verifyAttempts = 0;
    }

    return true;
  }

  blockCurrentGate(): void {
    this.gateStatus[this.currentGate] = 'blocked';
  }

  passCurrentGate(): void {
    this.gateStatus[this.currentGate] = 'passed';
  }

  failCurrentGate(): void {
    this.gateStatus[this.currentGate] = 'failed';
  }

  getCriteria(gate: GateName): GateCriteria {
    return GATE_CRITERIA[gate];
  }

  getIterationAttempts(iteration: string): number {
    return this.iterationAttempts[iteration] || 0;
  }

  handleVerifyFailure(): { action: 'loop' | 'escalate'; iteration: string } {
    this.verifyAttempts++;
    this.iterationAttempts[this.currentIteration] = this.verifyAttempts;

    if (this.verifyAttempts >= 3) {
      return this.escalateToPlan();
    }

    return { action: 'loop', iteration: this.currentIteration };
  }

  private escalateToPlan(): { action: 'escalate'; iteration: string } {
    const parts = this.currentIteration.split(/(\d+)$/);
    const name = parts[0] || 'V';
    const numStr = parts[1] || '0';
    const nextNum = parseInt(numStr) + 1;
    this.currentIteration = `${name}${nextNum}`;

    // Reset verify attempts
    this.verifyAttempts = 0;

    this.gateStatus = {
      plan: 'pending',
      build: 'pending',
      test: 'pending',
      verify: 'pending',
      audit: 'pending',
      delivery: 'pending',
    };

    this.currentGate = 'plan';

    return { action: 'escalate', iteration: this.currentIteration };
  }

  getEvidenceCollector(): EvidenceCollector {
    return this.evidenceCollector;
  }

  isComplete(): boolean {
    return this.currentGate === 'delivery' && this.gateStatus['delivery'] === 'passed';
  }

  getState(): Record<string, unknown> {
    return {
      currentGate: this.currentGate,
      gateStatus: { ...this.gateStatus },
      verifyAttempts: this.verifyAttempts,
      currentIteration: this.currentIteration,
      iterationAttempts: { ...this.iterationAttempts },
    };
  }

  restore(state: Record<string, unknown>): void {
    if (state.currentGate) this.currentGate = state.currentGate as GateName;
    if (state.gateStatus) this.gateStatus = state.gateStatus as Record<GateName, GateStatus>;
    if (state.verifyAttempts !== undefined) this.verifyAttempts = state.verifyAttempts as number;
    if (state.currentIteration) this.currentIteration = state.currentIteration as string;
    if (state.iterationAttempts) this.iterationAttempts = state.iterationAttempts as Record<string, number>;
  }
}
