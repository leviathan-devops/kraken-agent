/**
 * src/warheads/l5-antiderailment-warhead.ts — W12: 9-Class Derailment Detection
 *
 * Scans tool call args for derailment patterns across 9 classes.
 * Blocks or warns based on pattern severity.
 *
 * P2: typeof guards on arg values.
 * P3: No catch needed — pure pattern matching.
 * P6: Verified imports.
 * P9: Sync.
 * P11: Real state with per-class counters.
 */

import type {
  Warhead, EnforcementHook, HookResult, HookContext,
  EngineState, WarheadDiagnosis, BlockEvent, KnowledgePath,
} from '../engine/types.js';
import type { KnowledgeBase } from '../knowledge/knowledge-base.js';

interface DerailmentPattern {
  readonly name: string;
  readonly regex: RegExp;
  readonly level: 'BLOCK' | 'WARN';
}

const PATTERNS: readonly DerailmentPattern[] = [
  { name: 'L5.1 HOST_FALLBACK', regex: /on the host it works|host testing proves|on my machine/i, level: 'BLOCK' },
  { name: 'L5.2 SUCCESS_CLAIM', regex: /trust me it works|take my word for it/i, level: 'BLOCK' },
  { name: 'L5.3 MODEL_USAGE', regex: /switch to (claude|gpt|glm|deepseek)/i, level: 'BLOCK' },
  { name: 'L5.4 MOCK_STUB', regex: /use a mock|mock this|stub it out|fake implementation/i, level: 'BLOCK' },
  { name: 'L5.5 SIMPLIFICATION', regex: /basically it's just|it's trivial|it's simple/i, level: 'WARN' },
  { name: 'L5.7 SCOPE_CREEP', regex: /while (i'm|i am) at it|might as well|since we're here/i, level: 'BLOCK' },
  { name: 'L5.8 UNDERMINING', regex: /not worth the effort|overkill|waste of time|unnecessary/i, level: 'BLOCK' },
  { name: 'L5.10 SELF_REFERENCE', regex: /i have verified|i already tested|i confirm it works/i, level: 'BLOCK' },
  { name: 'L5.11 AGENT_RESISTANCE', regex: /too many agents|i can handle this|don't need that many/i, level: 'BLOCK' },
];

export class L5AntiDerailmentWarhead implements Warhead {
  readonly name = 'l5AntiDerailmentWarhead';
  readonly priority = 'CRITICAL' as const;
  readonly knowledgeDependencies: KnowledgePath[] = [];

  private totalBlocks = 0;
  private byClass: Record<string, number> = {};

  loadKnowledge(_base: KnowledgeBase): void {}

  getHooks(): EnforcementHook[] {
    return [{
      hookPoint: 'tool.before', priority: 15, layer: 'L5',
      description: '9-class derailment pattern detection',
      handler: (ctx: HookContext): HookResult => {
        for (const val of Object.values(ctx.args)) {
          if (typeof val !== 'string') continue;
          for (const p of PATTERNS) {
            if (p.regex.test(val)) {
              this.totalBlocks++;
              this.byClass[p.name] = (this.byClass[p.name] ?? 0) + 1;
              if (p.level === 'BLOCK') {
                return { verdict: 'BLOCK', reason: '[' + p.name + '] Derailment detected', correction: 'Remove derailment pattern.' };
              }
            }
          }
        }
        return { verdict: 'PASS', reason: 'No derailment' };
      },
    }];
  }

  synthesize(_state: EngineState): string {
    const classStr = Object.entries(this.byClass).map(([k, v]) => k + '=' + v).join(' ');
    return '[KRAKEN T1] L5: ' + this.totalBlocks + ' blocks | Classes: ' + classStr;
  }

  diagnose(): WarheadDiagnosis {
    return { name: this.name, healthy: true, hooksRegistered: 1, blocksIssued: this.totalBlocks, knowledgeLoaded: true, lastSynthesized: Date.now(), errors: [] };
  }

  recordBlock(_e: BlockEvent): void { this.totalBlocks++; }

  getState(): Record<string, unknown> {
    return { total: this.totalBlocks, byClass: this.byClass };
  }
}
