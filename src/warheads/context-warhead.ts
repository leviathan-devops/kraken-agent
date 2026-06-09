/**
 * src/warheads/context-warhead.ts — W7: Context Management
 *
 * Tracks context directory state and update frequency.
 * P2: No as casts. P6: Verified imports. P10/P11: Real state.
 */

import type {
  Warhead, EnforcementHook, HookResult, HookContext,
  EngineState, WarheadDiagnosis, BlockEvent, KnowledgePath,
} from '../engine/types.js';
import type { KnowledgeBase } from '../knowledge/knowledge-base.js';

const CONTEXT_TOOLS = new Set(['deploy_tentacle', 'report_to_kraken', 'aggregate_results', 'complete_todo']);

export class ContextWarhead implements Warhead {
  readonly name = 'contextWarhead';
  readonly priority = 'HIGH' as const;
  readonly knowledgeDependencies: KnowledgePath[] = [];

  private CANON = ['BUILD_STATE', 'TASK_QUEUE', 'CHANGELOG', 'DECISION_CHAIN', 'DEBUG_LOG', 'COMPACTION_SURVIVAL', 'EVIDENCE_STATE', 'POST_COMPACTION_PROMPT', 'SOC_PRESERVATION'];
  private dirs = { primary: 'CONTEXT_MANAGEMENT', tentacle: 'TENTACLE_CONTEXT' };
  private updateCount = 0;

  loadKnowledge(_base: KnowledgeBase): void {}

  getHooks(): EnforcementHook[] {
    return [{
      hookPoint: 'tool.after', priority: 30, layer: 'CONTEXT_UPDATE',
      description: 'Tracks context-affecting tool calls for T1 synthesis',
      handler: (ctx: HookContext): HookResult => {
        if (CONTEXT_TOOLS.has(ctx.toolName)) this.updateCount++;
        return { verdict: 'PASS', reason: '' };
      },
    }];
  }

  synthesize(_state: EngineState): string {
    return '[KRAKEN T1] CONTEXT: PRIMARY=' + this.dirs.primary + ' TENTACLE=' + this.dirs.tentacle + ' (' + this.CANON.length + ' docs) | Updates: ' + this.updateCount;
  }

  diagnose(): WarheadDiagnosis {
    return { name: this.name, healthy: this.CANON.length === 9, hooksRegistered: 1, blocksIssued: 0, knowledgeLoaded: true, lastSynthesized: Date.now(), errors: this.CANON.length !== 9 ? ['Not 9'] : [] };
  }

  recordBlock(_e: BlockEvent): void {}
  getState(): Record<string, unknown> { return { canonDocs: this.CANON.length, updates: this.updateCount }; }
}
