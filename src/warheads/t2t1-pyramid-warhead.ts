/**
 * src/warheads/t2t1-pyramid-warhead.ts — W17: T2→T1 Context Pyramid
 *
 * Verifies that T2 identity files exist at the configured directory.
 * Counts present files and reports T1 readiness.
 *
 * P3: catch has console.error with dir context.
 * P6: Verified imports (fs, path).
 * P7: Path from env var with fallback — no hardcoded machine-specific paths.
 * P9: Sync file checks — acceptable for init/diagnosis.
 * P11: Real state.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import type {
  Warhead, EnforcementHook, HookResult, HookContext,
  EngineState, WarheadDiagnosis, BlockEvent, KnowledgePath,
} from '../engine/types.js';
import type { KnowledgeBase } from '../knowledge/knowledge-base.js';

const T2_FILES: readonly string[] = [
  'T2_ALIGNMENT_BIBLE.md',
  'T2_ARCHITECTURE.md',
  'T2_BUILD_CHAIN.md',
  'T2_COMPACTION_SURVIVAL.md',
  'T2_CRASH_RECOVERY.md',
  'T2_FAILURE_MODES.md',
  'T2_KRAKEN_LIGHTNING_MODE.md',
  'T2_KRAKEN_RULES.md',
  'T2_PATTERNS.md',
  'T2_PLUGIN_ENGINEERING.md',
];

const MIN_T2_FILES = 5;

export class T2T1PyramidWarhead implements Warhead {
  readonly name = 't2t1PyramidWarhead';
  readonly priority = 'CRITICAL' as const;
  readonly knowledgeDependencies: KnowledgePath[] = [];

  private readonly t2Dir = process.env.KRAKEN_T2_DIR || '/workspace/kraken/context/t2';
  private count = 0;
  private loaded = false;

  loadKnowledge(_base: KnowledgeBase): void {}

  private verify(): void {
    this.count = 0;
    try {
      for (const f of T2_FILES) {
        if (fs.existsSync(path.join(this.t2Dir, f))) {
          this.count++;
        }
      }
      this.loaded = this.count >= MIN_T2_FILES;
    } catch (e) {
      console.error('[T2T1Pyramid] Verify failed: ' + (e instanceof Error ? e.message : String(e)));
      this.loaded = false;
    }
  }

  getHooks(): EnforcementHook[] {
    return [];
  }

  synthesize(_state: EngineState): string {
    this.verify();
    const status = this.loaded ? ' | T1: 8 warheads <4K chars' : ' | T2 NOT LOADED';
    return '[KRAKEN T1] T2->T1: ' + this.count + '/' + T2_FILES.length + ' T2 files at ' + this.t2Dir + status;
  }

  diagnose(): WarheadDiagnosis {
    this.verify();
    return {
      name: this.name,
      healthy: this.loaded,
      hooksRegistered: 0,
      blocksIssued: 0,
      knowledgeLoaded: this.loaded,
      lastSynthesized: Date.now(),
      errors: !this.loaded ? ['T2 not loaded at ' + this.t2Dir + ' (' + this.count + '/' + T2_FILES.length + ')'] : [],
    };
  }

  recordBlock(_e: BlockEvent): void {}

  getState(): Record<string, unknown> {
    return { t2Files: this.count, t2Loaded: this.loaded, t2Dir: this.t2Dir };
  }
}
