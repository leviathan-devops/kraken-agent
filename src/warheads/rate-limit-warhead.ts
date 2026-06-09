/**
 * src/warheads/rate-limit-warhead.ts — W23: Call Frequency Control
 *
 * Enforces max 15 tool calls per 60-second window.
 * Prevents runaway tool usage.
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

const MAX_CALLS = 15;
const WINDOW_MS = 60000;

export class RateLimitWarhead implements Warhead {
  readonly name = 'rateLimitWarhead';
  readonly priority = 'LOW' as const;
  readonly knowledgeDependencies: KnowledgePath[] = [];

  private timestamps: number[] = [];
  private blocks = 0;

  loadKnowledge(_base: KnowledgeBase): void {}

  getHooks(): EnforcementHook[] {
    return [{
      hookPoint: 'tool.before', priority: 45, layer: 'RATE_LIMIT',
      description: 'Enforces max ' + MAX_CALLS + ' tool calls per ' + (WINDOW_MS / 1000) + 's window',
      handler: (ctx: HookContext): HookResult => {
        const now = Date.now();
        this.timestamps = this.timestamps.filter(t => now - t < WINDOW_MS);
        if (this.timestamps.length >= MAX_CALLS) {
          this.blocks++;
          return { verdict: 'BLOCK', reason: '[RATE_LIMIT] ' + this.timestamps.length + ' calls in ' + (WINDOW_MS / 1000) + 's', correction: 'Wait for rate window reset.' };
        }
        this.timestamps.push(now);
        return { verdict: 'PASS', reason: 'Rate OK' };
      },
    }];
  }

  synthesize(_state: EngineState): string {
    return '[KRAKEN T1] RATE: ' + this.timestamps.length + '/' + MAX_CALLS + ' in window | Blocks: ' + this.blocks;
  }

  diagnose(): WarheadDiagnosis {
    return { name: this.name, healthy: true, hooksRegistered: 1, blocksIssued: this.blocks, knowledgeLoaded: true, lastSynthesized: Date.now(), errors: [] };
  }

  recordBlock(_e: BlockEvent): void { this.blocks++; }

  getState(): Record<string, unknown> {
    return { currentCalls: this.timestamps.length, blocks: this.blocks };
  }
}
