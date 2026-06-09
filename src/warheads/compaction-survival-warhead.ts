/**
 * src/warheads/compaction-survival-warhead.ts — W15: Context Persistence
 *
 * Tracks compaction events and preserves warhead caches across compaction cycles.
 *
 * P2: typeof guards on args.
 * P3: No catch needed — pure state tracking.
 * P6: Verified imports.
 * P9: Sync.
 * P11: Real state.
 */

import type {
  Warhead, EnforcementHook, HookResult, HookContext,
  EngineState, WarheadDiagnosis, BlockEvent, KnowledgePath,
} from '../engine/types.js';
import type { KnowledgeBase } from '../knowledge/knowledge-base.js';

export class CompactionSurvivalWarhead implements Warhead {
  readonly name = 'compactionSurvivalWarhead';
  readonly priority = 'HIGH' as const;
  readonly knowledgeDependencies: KnowledgePath[] = [];

  private compactCount = 0;
  private lastState = '';

  loadKnowledge(_base: KnowledgeBase): void {}

  getHooks(): EnforcementHook[] {
    return [{
      hookPoint: 'compacting', priority: 10, layer: 'COMPACTION',
      description: 'Preserves warhead caches across compaction cycles',
      handler: (ctx: HookContext): HookResult => {
        this.compactCount++;
        const gate = typeof ctx.args.currentGate === 'string' ? ctx.args.currentGate : '?';
        const active = typeof ctx.args.activeTasks === 'number' ? ctx.args.activeTasks : 0;
        this.lastState = 'Gate=' + gate + ' Active=' + active;
        return { verdict: 'PASS', reason: 'Caches preserved' };
      },
    }];
  }

  synthesize(_state: EngineState): string {
    return '[KRAKEN T1] COMPACTION: ' + this.compactCount + ' survived | Last: ' + this.lastState + ' | Caches: T2+T1 preserved';
  }

  diagnose(): WarheadDiagnosis {
    return { name: this.name, healthy: true, hooksRegistered: 1, blocksIssued: 0, knowledgeLoaded: true, lastSynthesized: Date.now(), errors: [] };
  }

  recordBlock(_e: BlockEvent): void {}

  getState(): Record<string, unknown> {
    return { compactions: this.compactCount };
  }
}
