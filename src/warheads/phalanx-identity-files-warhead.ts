/**
 * src/warheads/phalanx-identity-files-warhead.ts — W19: Identity File Verification
 *
 * Verifies that all 10 Kraken identity .md files exist in identity/kraken/.
 * Reports completeness on every synthesize/diagnose call.
 *
 * P3: catch has console.error with dir context.
 * P6: Verified imports (fs, path).
 * P7: Relative path — no hardcoded machine paths.
 * P9: Sync file checks — acceptable for verification.
 * P11: Real state.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import type {
  Warhead, EnforcementHook, HookResult, HookContext,
  EngineState, WarheadDiagnosis, BlockEvent, KnowledgePath,
} from '../engine/types.js';
import type { KnowledgeBase } from '../knowledge/knowledge-base.js';

const IDENTITY_FILES: readonly string[] = [
  'KRAKEN.md', 'IDENTITY.md', 'EXECUTION.md', 'QUALITY.md',
  'TOOLS.md', 'PHALANX.md', 'FIREWALL.md', 'DERAILMENT.md',
  'TENTACLE.md', 'AGENT_AWARENESS.md',
];

const IDENTITY_DIR = 'identity/kraken';

export class PhalanxIdentityFilesWarhead implements Warhead {
  readonly name = 'phalanxIdentityFilesWarhead';
  readonly priority = 'MEDIUM' as const;
  readonly knowledgeDependencies: KnowledgePath[] = [];

  private count = 0;
  private valid = false;

  loadKnowledge(_base: KnowledgeBase): void {}

  private verify(): void {
    this.count = 0;
    try {
      for (const f of IDENTITY_FILES) {
        if (fs.existsSync(path.join(IDENTITY_DIR, f))) {
          this.count++;
        }
      }
    } catch (e) {
      console.error('[PhalanxIdentityFiles] Verify failed: ' + (e instanceof Error ? e.message : String(e)));
    }
    this.valid = this.count === IDENTITY_FILES.length;
  }

  getHooks(): EnforcementHook[] {
    return [];
  }

  synthesize(_state: EngineState): string {
    this.verify();
    const status = this.valid ? ' ALL VALID' : ' MISSING';
    return '[KRAKEN T1] IDENTITY FILES: ' + this.count + '/' + IDENTITY_FILES.length + ' at ' + IDENTITY_DIR + status;
  }

  diagnose(): WarheadDiagnosis {
    this.verify();
    return {
      name: this.name,
      healthy: this.valid,
      hooksRegistered: 0,
      blocksIssued: 0,
      knowledgeLoaded: true,
      lastSynthesized: Date.now(),
      errors: !this.valid ? ['Only ' + this.count + '/' + IDENTITY_FILES.length + ' files'] : [],
    };
  }

  recordBlock(_e: BlockEvent): void {}

  getState(): Record<string, unknown> {
    return { loaded: this.count, total: IDENTITY_FILES.length, valid: this.valid };
  }
}
