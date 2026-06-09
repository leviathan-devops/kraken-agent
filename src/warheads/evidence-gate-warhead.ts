/**
 * src/warheads/evidence-gate-warhead.ts — W14: Pass Rate Validator
 *
 * Reads ContainerTestResult.json from .kraken/evidence/ and checks
 * whether the pass rate meets the 96% threshold.
 *
 * P2: typeof guards on parsed JSON values.
 * P3: catch has console.error with file context.
 * P6: Verified imports (fs, path).
 * P7: Relative path — no hardcoded machine paths.
 * P9: Sync read — acceptable for gate checks.
 * P11: Real state.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import type {
  Warhead, EnforcementHook, HookResult, HookContext,
  EngineState, WarheadDiagnosis, BlockEvent, KnowledgePath,
} from '../engine/types.js';
import type { KnowledgeBase } from '../knowledge/knowledge-base.js';

const EVIDENCE_DIR = '.kraken/evidence';
const THRESHOLD = 0.96;

export class EvidenceGateWarhead implements Warhead {
  readonly name = 'evidenceGateWarhead';
  readonly priority = 'HIGH' as const;
  readonly knowledgeDependencies: KnowledgePath[] = [];

  loadKnowledge(_base: KnowledgeBase): void {}

  hasEvidence(): boolean {
    try {
      const p = path.join(EVIDENCE_DIR, 'ContainerTestResult.json');
      if (!fs.existsSync(p)) return false;
      const raw = fs.readFileSync(p, 'utf-8');
      const result = JSON.parse(raw);
      const total = typeof result.totalTests === 'number' ? result.totalTests : 0;
      const passed = typeof result.passedTests === 'number' ? result.passedTests : 0;
      return total > 0 && (passed / total) >= THRESHOLD;
    } catch (e) {
      console.error('[EvidenceGate] Read failed: ' + (e instanceof Error ? e.message : String(e)));
      return false;
    }
  }

  getHooks(): EnforcementHook[] {
    // Passive — called by WarheadEngine for synthesis
    return [];
  }

  synthesize(_state: EngineState): string {
    const status = this.hasEvidence() ? 'PASS' : 'FAIL';
    return '[KRAKEN T1] EVIDENCE: ' + status + ' (' + (THRESHOLD * 100) + '% threshold) | Dir: ' + EVIDENCE_DIR;
  }

  diagnose(): WarheadDiagnosis {
    return { name: this.name, healthy: true, hooksRegistered: 0, blocksIssued: 0, knowledgeLoaded: true, lastSynthesized: Date.now(), errors: [] };
  }

  recordBlock(_e: BlockEvent): void {}

  getState(): Record<string, unknown> {
    return { hasEvidence: this.hasEvidence(), threshold: THRESHOLD };
  }
}
