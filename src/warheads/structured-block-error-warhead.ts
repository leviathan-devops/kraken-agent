/**
 * src/warheads/structured-block-error-warhead.ts — W10: Passive Block Logger
 *
 * Passive utility warhead — no hooks. Other warheads call recordBlock()
 * which maintains a capped history of block events for synthesis.
 *
 * P2: No casts needed.
 * P3: No catch needed — no IO.
 * P6: Verified imports.
 * P9: Sync.
 * P11: Real state.
 */

import type {
  Warhead, EnforcementHook, HookResult, HookContext,
  EngineState, WarheadDiagnosis, BlockEvent, KnowledgePath,
} from '../engine/types.js';
import type { KnowledgeBase } from '../knowledge/knowledge-base.js';

const MAX_HISTORY = 100;

interface BlockRecord {
  readonly layer: string;
  readonly reason: string;
  readonly toolName: string;
  readonly timestamp: string;
}

export class StructuredBlockErrorWarhead implements Warhead {
  readonly name = 'structuredBlockErrorWarhead';
  readonly priority = 'CRITICAL' as const;
  readonly knowledgeDependencies: KnowledgePath[] = [];

  private blockHistory: BlockRecord[] = [];

  loadKnowledge(_base: KnowledgeBase): void {}

  getHooks(): EnforcementHook[] {
    // Passive — called by other warheads' recordBlock()
    return [];
  }

  recordBlock(event: BlockEvent): void {
    this.blockHistory.push({
      layer: event.layer,
      reason: event.reason,
      toolName: event.toolName,
      timestamp: new Date().toISOString(),
    });
    if (this.blockHistory.length > MAX_HISTORY) {
      this.blockHistory.shift();
    }
  }

  synthesize(_state: EngineState): string {
    const recent = this.blockHistory.slice(-3);
    const recentStr = recent.length > 0
      ? ' | Recent: ' + recent.map(b => '[' + b.layer + '] ' + b.reason.substring(0, 30)).join(' ')
      : '';
    return '[KRAKEN T1] BLOCKS: ' + this.blockHistory.length + ' total' + recentStr;
  }

  diagnose(): WarheadDiagnosis {
    return { name: this.name, healthy: true, hooksRegistered: 0, blocksIssued: this.blockHistory.length, knowledgeLoaded: true, lastSynthesized: Date.now(), errors: [] };
  }

  getState(): Record<string, unknown> {
    return { total: this.blockHistory.length, recent: this.blockHistory.slice(-5) };
  }
}
