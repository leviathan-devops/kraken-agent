/**
 * src/warheads/identity-warhead.ts — W2: Identity Enforcement
 *
 * Blocks identity drift in agent arguments.
 * P2: typeof guard. P6: Verified imports. P10/P11: Real state.
 */

import type {
  Warhead, EnforcementHook, HookResult, HookContext,
  EngineState, WarheadDiagnosis, BlockEvent, KnowledgePath,
} from '../engine/types.js';
import type { KnowledgeBase } from '../knowledge/knowledge-base.js';

const IDENTITY_DRIFT_PATTERN = /i am opencode|i'm opencode|as an ai assistant|as an ai model/i;

export class IdentityWarhead implements Warhead {
  readonly name = 'identityWarhead';
  readonly priority = 'CRITICAL' as const;
  readonly knowledgeDependencies: KnowledgePath[] = [
    { library: 'AGENT_IDENTITY', files: ['AGENT_IDENTITY_ARCHITECTURE_BIBLE.md'], rules: ['PART 1: Mechanism', 'PART 2: Identity Scoping'] },
  ];

  private selfIdBlocks = 0;
  private identityScopingRules: readonly string[] = [];

  loadKnowledge(base: KnowledgeBase): void {
    this.identityScopingRules = base.getLibrary('AGENT_IDENTITY').extractRules(
      'AGENT_IDENTITY_ARCHITECTURE_BIBLE.md',
      ['PART 2: Identity Scoping'],
    );
  }

  getHooks(): EnforcementHook[] {
    return [{
      hookPoint: 'tool.before', priority: 20, layer: 'IDENTITY_ENFORCEMENT',
      description: 'Blocks identity drift — detects self-identification as opencode or AI assistant',
      handler: (ctx: HookContext): HookResult => {
        for (const val of Object.values(ctx.args)) {
          if (typeof val === 'string' && IDENTITY_DRIFT_PATTERN.test(val)) {
            this.selfIdBlocks++;
            return { verdict: 'BLOCK', reason: '[IDENTITY_BLOCKED] Identity drift. You are KRAKEN ORCHESTRATOR v1.4.', correction: 'KRAKEN ORCHESTRATOR v1.4. Mechanically enforced.' };
          }
        }
        return { verdict: 'PASS', reason: 'Identity intact' };
      },
    }];
  }

  synthesize(_state: EngineState): string {
    return '[KRAKEN T1] IDENTITY: KRAKEN ORCHESTRATOR v1.4 | NOT opencode | Blocks: ' + this.selfIdBlocks;
  }

  diagnose(): WarheadDiagnosis {
    return { name: this.name, healthy: true, hooksRegistered: 1, blocksIssued: this.selfIdBlocks, knowledgeLoaded: this.identityScopingRules.length > 0, lastSynthesized: Date.now(), errors: [] };
  }

  recordBlock(_e: BlockEvent): void { this.selfIdBlocks++; }
  getState(): Record<string, unknown> { return { blocks: this.selfIdBlocks }; }
}
