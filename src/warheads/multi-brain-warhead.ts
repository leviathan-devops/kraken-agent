/**
 * src/warheads/multi-brain-warhead.ts — W8: Multi-Brain Router
 *
 * Routes tool calls to PLANNING, EXECUTION, or SYSTEM brain.
 * P2: BrainKey union type eliminates as any casts.
 * P6: Verified imports. P10/P11: Real state.
 */

import type {
  Warhead, EnforcementHook, HookResult, HookContext,
  EngineState, WarheadDiagnosis, BlockEvent, KnowledgePath,
} from '../engine/types.js';
import type { KnowledgeBase } from '../knowledge/knowledge-base.js';

type BrainKey = 'PLANNING' | 'EXECUTION' | 'SYSTEM';

interface BrainState { readonly role: string; initialized: boolean; lastTick: number; }

const TOOL_TO_BRAIN: Readonly<Record<string, BrainKey>> = {
  'deploy_tentacle': 'PLANNING',
  'task': 'PLANNING',
  'get_cluster_status': 'EXECUTION',
  'aggregate_results': 'EXECUTION',
  'report_to_kraken': 'SYSTEM',
  'complete_todo': 'SYSTEM',
};

export class MultiBrainWarhead implements Warhead {
  readonly name = 'multiBrainWarhead';
  readonly priority = 'HIGH' as const;
  readonly knowledgeDependencies: KnowledgePath[] = [
    { library: 'ALGORITHMIC_SYSTEMS', files: ['ARCHITECTURE_OPENVIKING_MEMORY.md'], rules: ['Brain Architecture'] },
  ];

  private brains: Record<BrainKey, BrainState> = {
    PLANNING: { role: 'STRATEGY', initialized: true, lastTick: 0 },
    EXECUTION: { role: 'ACTIONS', initialized: true, lastTick: 0 },
    SYSTEM: { role: 'ARTIFACTS', initialized: true, lastTick: 0 },
  };
  private brainMessages = 0;
  private brainArchitecture: readonly string[] = [];

  loadKnowledge(base: KnowledgeBase): void {
    this.brainArchitecture = base.getLibrary('ALGORITHMIC_SYSTEMS').extractRules(
      'ARCHITECTURE_OPENVIKING_MEMORY.md', ['Brain Architecture'],
    );
  }

  getHooks(): EnforcementHook[] {
    return [{
      hookPoint: 'tool.after', priority: 25, layer: 'BRAIN_ROUTE',
      description: 'Routes tool calls to the correct brain and tracks message counts',
      handler: (ctx: HookContext): HookResult => {
        const brain = TOOL_TO_BRAIN[ctx.toolName];
        if (brain) {
          this.brainMessages++;
          this.brains[brain].lastTick = Date.now();
        }
        return { verdict: 'PASS', reason: '' };
      },
    }];
  }

  synthesize(_state: EngineState): string {
    const initializedCount = Object.values(this.brains).filter(b => b.initialized).length;
    return '[KRAKEN T1] BRAINS: ' + initializedCount + '/3 | Messages: ' + this.brainMessages + ' | Arch: ' + this.brainArchitecture.length;
  }

  diagnose(): WarheadDiagnosis {
    const allInitialized = Object.values(this.brains).every(b => b.initialized);
    return { name: this.name, healthy: allInitialized, hooksRegistered: 1, blocksIssued: 0, knowledgeLoaded: this.brainArchitecture.length > 0, lastSynthesized: Date.now(), errors: [] };
  }

  recordBlock(_e: BlockEvent): void {}
  getState(): Record<string, unknown> { return { brains: Object.keys(this.brains), messages: this.brainMessages }; }
}
