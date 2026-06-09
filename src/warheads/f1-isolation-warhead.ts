/**
 * src/warheads/f1-isolation-warhead.ts — W13: Cross-Agent Isolation
 *
 * Enforces that Kraken-only tools cannot be called by non-Kraken agents.
 * Priority 0 — runs before all other warheads.
 *
 * P2: No casts needed.
 * P3: No catch needed — pure logic.
 * P6: Verified imports.
 * P9: Sync.
 * P11: Real state.
 */

import type {
  Warhead, EnforcementHook, HookResult, HookContext,
  EngineState, WarheadDiagnosis, BlockEvent, KnowledgePath,
} from '../engine/types.js';
import type { KnowledgeBase } from '../knowledge/knowledge-base.js';

const KRAKEN_ONLY_TOOLS: ReadonlySet<string> = new Set([
  'deploy_tentacle', 'aggregate_results', 'execution_brain_analyze', 'complete_todo',
]);

export class F1IsolationWarhead implements Warhead {
  readonly name = 'f1IsolationWarhead';
  readonly priority = 'CRITICAL' as const;
  readonly knowledgeDependencies: KnowledgePath[] = [];

  private f1Blocks = 0;

  loadKnowledge(_base: KnowledgeBase): void {}

  getHooks(): EnforcementHook[] {
    return [{
      hookPoint: 'tool.before', priority: 0, layer: 'F1',
      description: 'Blocks non-Kraken agents from calling Kraken-only tools',
      handler: (ctx: HookContext): HookResult => {
        if (!KRAKEN_ONLY_TOOLS.has(ctx.toolName)) return { verdict: 'PASS', reason: 'Not a Kraken-only tool' };
        if (ctx.agentName === 'kraken') return { verdict: 'PASS', reason: 'Kraken confirmed' };
        this.f1Blocks++;
        return { verdict: 'BLOCK', reason: '[F1] Non-Kraken agent ' + ctx.agentName + ' called ' + ctx.toolName, correction: 'Switch to Kraken tab.' };
      },
    }];
  }

  synthesize(_state: EngineState): string {
    return '[KRAKEN T1] F1: ' + this.f1Blocks + ' blocks | Tools: ' + Array.from(KRAKEN_ONLY_TOOLS).join(', ');
  }

  diagnose(): WarheadDiagnosis {
    return { name: this.name, healthy: KRAKEN_ONLY_TOOLS.size >= 4, hooksRegistered: 1, blocksIssued: this.f1Blocks, knowledgeLoaded: true, lastSynthesized: Date.now(), errors: [] };
  }

  recordBlock(_e: BlockEvent): void { this.f1Blocks++; }

  getState(): Record<string, unknown> {
    return { blocks: this.f1Blocks };
  }
}
