/**
 * src/warheads/phalanx-warhead.ts — W1: Phalanx Depth Enforcement
 *
 * Validates every task() call against phalanx depth rules.
 * Enforces spawn hierarchy: Kraken -> Tentacle -> Cluster -> Leaf.
 *
 * P2: typeof guards on all extracted args.
 * P6: Verified imports.
 * P9: Sync.
 * P10: synthesize returns non-empty string.
 * P11: Real state.
 */

import type {
  Warhead, EnforcementHook, HookResult, HookContext,
  EngineState, WarheadDiagnosis, BlockEvent, KnowledgePath,
} from '../engine/types.js';
import type { KnowledgeBase } from '../knowledge/knowledge-base.js';

const PHALANX_DEPTHS: Readonly<Record<string, number>> = {
  'kraken': 1,
  'kraken-tentacle-executor': 2,
  'kraken-cluster-agent': 3,
};

const SPAWN_PERMISSIONS: Readonly<Record<string, readonly string[]>> = {
  'kraken': ['kraken-tentacle-executor'],
  'kraken-tentacle-executor': ['kraken-cluster-agent'],
  'kraken-cluster-agent': ['explore', 'general'],
};

const MAX_DEPTH = 4;

export class PhalanxWarhead implements Warhead {
  readonly name = 'phalanxWarhead';
  readonly priority = 'CRITICAL' as const;
  readonly knowledgeDependencies: KnowledgePath[] = [
    { library: 'ALGORITHMIC_SYSTEMS', files: ['02_STATE_MACHINES_AND_GATES.md'], rules: ['1. XState FSMs', '5. Guard Functions'] },
    { library: 'AGENT_IDENTITY', files: ['AGENT_IDENTITY_ARCHITECTURE_BIBLE.md'], rules: ['PART 1: Session Lifecycle', 'PART 2: Identity Scoping'] },
  ];

  private permissions: Record<string, readonly string[]> = { ...SPAWN_PERMISSIONS };
  private blocksIssued = 0;
  private stateMachineRules: readonly string[] = [];
  private identityScopingRules: readonly string[] = [];

  loadKnowledge(base: KnowledgeBase): void {
    this.stateMachineRules = base.getLibrary('ALGORITHMIC_SYSTEMS').extractRules(
      '02_STATE_MACHINES_AND_GATES.md',
      ['Guard Functions', 'State Transition Validation'],
    );
    this.identityScopingRules = base.getLibrary('AGENT_IDENTITY').extractRules(
      'AGENT_IDENTITY_ARCHITECTURE_BIBLE.md',
      ['PART 2: Identity Scoping'],
    );
  }

  getHooks(): EnforcementHook[] {
    return [{
      hookPoint: 'tool.before', priority: 1, layer: 'PHALANX_DEPTH',
      description: 'Validates every task() call against phalanx depth rules',
      handler: (ctx: HookContext): HookResult => {
        if (ctx.toolName !== 'task') return { verdict: 'PASS', reason: 'Not a task call' };
        const target =
          (typeof ctx.args.agent === 'string' ? ctx.args.agent : '') ||
          (typeof ctx.args.agentType === 'string' ? ctx.args.agentType : '') ||
          '';
        if (!target) return { verdict: 'PASS', reason: 'No target agent' };
        const depth = PHALANX_DEPTHS[ctx.agentName] ?? MAX_DEPTH;
        if (depth >= MAX_DEPTH) return { verdict: 'BLOCK', reason: '[PHALANX_BLOCKED] ' + ctx.agentName + ' at max depth ' + depth, correction: 'Cannot spawn from this depth.' };
        const allowed = this.permissions[ctx.agentName];
        if (!allowed) return { verdict: 'BLOCK', reason: '[PHALANX_BLOCKED] ' + ctx.agentName + ' has no spawn permissions', correction: 'Not in phalanx map.' };
        if (!allowed.includes(target)) return { verdict: 'BLOCK', reason: '[PHALANX_BLOCKED] ' + ctx.agentName + ' can only spawn [' + allowed.join(',') + ']', correction: 'Spawn only: ' + allowed.join(', ') };
        return { verdict: 'PASS', reason: ctx.agentName + ' (d' + depth + ') -> ' + target + ' (d' + (depth + 1) + ')' };
      },
    }];
  }

  getDepth(agentName: string): number { return PHALANX_DEPTHS[agentName] ?? MAX_DEPTH; }

  synthesize(_state: EngineState): string {
    return [
      '[KRAKEN T1] PHALANX: ' + Object.entries(PHALANX_DEPTHS).map(([k, v]) => k + '=d' + v).join(' '),
      'Max: d' + MAX_DEPTH + ' | Blocks: ' + this.blocksIssued + ' | Rules: ' + this.stateMachineRules.length,
    ].join('\n');
  }

  diagnose(): WarheadDiagnosis {
    const errors: string[] = [];
    for (const a of ['kraken', 'kraken-tentacle-executor', 'kraken-cluster-agent'] as const) {
      if (!this.permissions[a]) errors.push('Missing ' + a);
    }
    return { name: this.name, healthy: errors.length === 0, hooksRegistered: 1, blocksIssued: this.blocksIssued, knowledgeLoaded: this.stateMachineRules.length > 0, lastSynthesized: Date.now(), errors };
  }

  recordBlock(_e: BlockEvent): void { this.blocksIssued++; }
  getState(): Record<string, unknown> { return { permissions: this.permissions, blocks: this.blocksIssued }; }
}
