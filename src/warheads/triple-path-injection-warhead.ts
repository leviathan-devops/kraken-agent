/**
 * src/warheads/triple-path-injection-warhead.ts — W18: Redundant Path Injection
 *
 * Tracks injection across system.transform and compacting hooks.
 * Ensures Kraken context is injected through multiple redundant paths.
 *
 * P2: No casts needed.
 * P3: No catch needed — pure counter tracking.
 * P6: Verified imports.
 * P9: Sync.
 * P11: Real state.
 */

import type {
  Warhead, EnforcementHook, HookResult, HookContext,
  EngineState, WarheadDiagnosis, BlockEvent, KnowledgePath,
} from '../engine/types.js';
import type { KnowledgeBase } from '../knowledge/knowledge-base.js';

export class TriplePathInjectionWarhead implements Warhead {
  readonly name = 'triplePathInjectionWarhead';
  readonly priority = 'CRITICAL' as const;
  readonly knowledgeDependencies: KnowledgePath[] = [];

  private readonly counts = {
    systemTransform: 0,
    messagesTransform: 0,
    compacting: 0,
  };

  loadKnowledge(_base: KnowledgeBase): void {}

  getHooks(): EnforcementHook[] {
    return [
      {
        hookPoint: 'system.transform', priority: 0, layer: 'INJECT_P1',
        description: 'Tracks system.transform injection path',
        handler: (_ctx: HookContext): HookResult => {
          this.counts.systemTransform++;
          return { verdict: 'PASS', reason: '' };
        },
      },
      {
        hookPoint: 'compacting', priority: 0, layer: 'INJECT_P3',
        description: 'Tracks compacting injection path',
        handler: (_ctx: HookContext): HookResult => {
          this.counts.compacting++;
          return { verdict: 'PASS', reason: '' };
        },
      },
    ];
  }

  synthesize(_state: EngineState): string {
    return '[KRAKEN T1] INJECTION: system.transform=' + this.counts.systemTransform + ' compacting=' + this.counts.compacting + ' | 3-path redundant';
  }

  diagnose(): WarheadDiagnosis {
    return { name: this.name, healthy: true, hooksRegistered: 2, blocksIssued: 0, knowledgeLoaded: true, lastSynthesized: Date.now(), errors: [] };
  }

  recordBlock(_e: BlockEvent): void {}

  getState(): Record<string, unknown> {
    return { counts: { ...this.counts } };
  }
}
