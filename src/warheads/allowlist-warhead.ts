/**
 * src/warheads/allowlist-warhead.ts — W6: Tool Allowlist Enforcement
 *
 * Enforces single source of truth from tool-allowlist.ts.
 * P2: Delegates to isToolAllowed(). P6: Verified imports.
 * P9: Sync. P10/P11: Real state.
 */

import type {
  Warhead, EnforcementHook, HookResult, HookContext,
  EngineState, WarheadDiagnosis, BlockEvent, KnowledgePath,
} from '../engine/types.js';
import type { KnowledgeBase } from '../knowledge/knowledge-base.js';
import { ALLOWLISTS, isToolAllowed } from '../security/tool-allowlist.js';

export class AllowlistWarhead implements Warhead {
  readonly name = 'allowlistWarhead';
  readonly priority = 'CRITICAL' as const;
  readonly knowledgeDependencies: KnowledgePath[] = [];

  private blocksLogged = 0;

  loadKnowledge(_base: KnowledgeBase): void {}

  getHooks(): EnforcementHook[] {
    return [{
      hookPoint: 'tool.before', priority: 4, layer: 'ALLOWLIST',
      description: 'Blocks tools not in the agent allowlist (single source of truth)',
      handler: (ctx: HookContext): HookResult => {
        if (!isToolAllowed(ctx.agentName, ctx.toolName)) {
          this.blocksLogged++;
          const allowed = ALLOWLISTS[ctx.agentName] ?? [];
          return { verdict: 'BLOCK', reason: '[ALLOWLIST_BLOCKED] ' + ctx.toolName + ' not allowed for ' + ctx.agentName, correction: 'Allowed: ' + allowed.join(', ') };
        }
        return { verdict: 'PASS', reason: 'Tool allowed' };
      },
    }];
  }

  synthesize(_state: EngineState): string {
    return '[KRAKEN T1] ALLOWLIST: ' + this.blocksLogged + ' blocks';
  }

  diagnose(): WarheadDiagnosis {
    return { name: this.name, healthy: true, hooksRegistered: 1, blocksIssued: this.blocksLogged, knowledgeLoaded: true, lastSynthesized: Date.now(), errors: [] };
  }

  recordBlock(_e: BlockEvent): void { this.blocksLogged++; }
  getState(): Record<string, unknown> { return { blocks: this.blocksLogged }; }
}
