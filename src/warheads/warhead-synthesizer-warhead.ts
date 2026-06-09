/**
 * src/warheads/warhead-synthesizer-warhead.ts — W20: T1 Compilation Engine
 *
 * Compiles all warhead synthesize() outputs into a single injectable string.
 * Enforces 4K character budget — excludes warheads that exceed it.
 *
 * P2: No casts needed.
 * P3: No catch needed — pure string operations.
 * P6: Verified imports.
 * P9: Sync.
 * P10: compile() returns real string, never empty.
 * P11: Real state with performance tracking.
 */

import type {
  Warhead, EnforcementHook, HookResult, HookContext,
  EngineState, WarheadDiagnosis, BlockEvent, KnowledgePath,
} from '../engine/types.js';
import type { KnowledgeBase } from '../knowledge/knowledge-base.js';

const MAX_CHARS = 4000;

export class WarheadSynthesizerWarhead implements Warhead {
  readonly name = 'warheadSynthesizerWarhead';
  readonly priority = 'CRITICAL' as const;
  readonly knowledgeDependencies: KnowledgePath[] = [];

  private runs = 0;
  private lastMs = 0;
  private totalChars = 0;

  loadKnowledge(_base: KnowledgeBase): void {}

  compile(warheads: readonly Warhead[], state: EngineState): string {
    const start = Date.now();
    this.runs++;
    const parts: string[] = ['\n---\n[KRAKEN T1 WARHEADS — COMPILED]\n'];
    let chars = 0;
    for (const w of warheads) {
      const t1 = w.synthesize(state);
      if (chars + t1.length > MAX_CHARS) {
        parts.push('[' + w.name + '] EXCEEDED BUDGET');
        continue;
      }
      parts.push(t1);
      parts.push('');
      chars += t1.length;
    }
    parts.push('\n[KRAKEN T1 END — ' + warheads.length + ' warheads, ' + chars + ' chars]\n---\n');
    this.lastMs = Date.now() - start;
    this.totalChars += chars;
    return parts.join('\n');
  }

  getHooks(): EnforcementHook[] {
    return [];
  }

  synthesize(_state: EngineState): string {
    return '[KRAKEN T1] SYNTHESIZER: ' + this.runs + ' runs | ' + this.lastMs + 'ms last | ' + this.totalChars + ' total chars | Budget: ' + MAX_CHARS;
  }

  diagnose(): WarheadDiagnosis {
    return {
      name: this.name,
      healthy: this.runs > 0,
      hooksRegistered: 0,
      blocksIssued: 0,
      knowledgeLoaded: true,
      lastSynthesized: Date.now(),
      errors: this.runs === 0 ? ['Never compiled'] : [],
    };
  }

  recordBlock(_e: BlockEvent): void {}

  getState(): Record<string, unknown> {
    return { runs: this.runs, totalChars: this.totalChars };
  }
}
