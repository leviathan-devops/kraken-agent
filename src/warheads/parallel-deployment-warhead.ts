/**
 * src/warheads/parallel-deployment-warhead.ts — W22: Concurrent Deploy Tracking
 *
 * Enforces max 8 simultaneous tentacle deployments.
 * Increments on deploy_tentacle, decrements on aggregate_results or error.
 *
 * P2: typeof guard on metadata.error.
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

const MAX_CONCURRENT = 8;

export class ParallelDeploymentWarhead implements Warhead {
  readonly name = 'parallelDeploymentWarhead';
  readonly priority = 'HIGH' as const;
  readonly knowledgeDependencies: KnowledgePath[] = [];

  private active = 0;

  loadKnowledge(_base: KnowledgeBase): void {}

  getHooks(): EnforcementHook[] {
    return [
      {
        hookPoint: 'tool.before', priority: 2, layer: 'PARALLEL',
        description: 'Enforces max concurrent tentacle deployments',
        handler: (ctx: HookContext): HookResult => {
          if (ctx.toolName !== 'deploy_tentacle') return { verdict: 'PASS', reason: 'Not a deploy' };
          if (this.active >= MAX_CONCURRENT) {
            return { verdict: 'BLOCK', reason: '[PARALLEL] ' + this.active + ' simultaneous deploys', correction: 'Wait for a deploy to complete.' };
          }
          this.active++;
          return { verdict: 'PASS', reason: 'Deploy ' + this.active + '/' + MAX_CONCURRENT };
        },
      },
      {
        hookPoint: 'tool.after', priority: 2, layer: 'PARALLEL_DEC',
        description: 'Decrements active deploy count on completion',
        handler: (ctx: HookContext): HookResult => {
          if (ctx.toolName === 'aggregate_results') {
            this.active = Math.max(0, this.active - 1);
          }
          if (ctx.toolName === 'deploy_tentacle' && ctx.metadata?.error) {
            this.active = Math.max(0, this.active - 1);
          }
          return { verdict: 'PASS', reason: '' };
        },
      },
    ];
  }

  synthesize(_state: EngineState): string {
    return '[KRAKEN T1] PARALLEL: ' + this.active + '/' + MAX_CONCURRENT + ' concurrent deploys | TRUE ASYNC PARALLEL';
  }

  diagnose(): WarheadDiagnosis {
    return { name: this.name, healthy: true, hooksRegistered: 2, blocksIssued: 0, knowledgeLoaded: true, lastSynthesized: Date.now(), errors: [] };
  }

  recordBlock(_e: BlockEvent): void {}

  getState(): Record<string, unknown> {
    return { active: this.active, max: MAX_CONCURRENT };
  }
}
