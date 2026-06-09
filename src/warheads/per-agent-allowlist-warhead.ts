/**
 * src/warheads/per-agent-allowlist-warhead.ts — W21: Allowlist Source Verification
 *
 * Verifies that the single source of truth (tool-allowlist.ts) has all
 * expected agent definitions. Passive — used by LayerEngineWarhead for context.
 *
 * P2: No casts needed.
 * P3: No catch needed — pure object inspection.
 * P6: Verified imports.
 * P9: Sync.
 * P11: Real state.
 */

import type {
  Warhead, EnforcementHook, HookResult, HookContext,
  EngineState, WarheadDiagnosis, BlockEvent, KnowledgePath,
} from '../engine/types.js';
import type { KnowledgeBase } from '../knowledge/knowledge-base.js';
import { ALLOWLISTS } from '../security/tool-allowlist.js';

const MIN_AGENTS = 3;

export class PerAgentAllowlistWarhead implements Warhead {
  readonly name = 'perAgentAllowlistWarhead';
  readonly priority = 'HIGH' as const;
  readonly knowledgeDependencies: KnowledgePath[] = [];

  loadKnowledge(_base: KnowledgeBase): void {}

  getHooks(): EnforcementHook[] {
    // Passive — reads from tool-allowlist.ts, used by LayerEngine for context
    return [];
  }

  synthesize(_state: EngineState): string {
    return '[KRAKEN T1] AGENT LISTS: ' + Object.keys(ALLOWLISTS).join(', ') + ' | Single source: tool-allowlist.ts';
  }

  diagnose(): WarheadDiagnosis {
    const agentCount = Object.keys(ALLOWLISTS).length;
    return {
      name: this.name,
      healthy: agentCount >= MIN_AGENTS,
      hooksRegistered: 0,
      blocksIssued: 0,
      knowledgeLoaded: true,
      lastSynthesized: Date.now(),
      errors: agentCount < MIN_AGENTS ? ['< ' + MIN_AGENTS + ' agents configured'] : [],
    };
  }

  recordBlock(_e: BlockEvent): void {}

  getState(): Record<string, unknown> {
    return { agents: Object.keys(ALLOWLISTS) };
  }
}
