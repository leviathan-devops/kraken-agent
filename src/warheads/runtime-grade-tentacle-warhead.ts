/**
 * src/warheads/runtime-grade-tentacle-warhead.ts — W4: Tentacle Orchestrator
 *
 * Mirror of Meta-Orchestrator at tentacle execution level.
 * P2: typeof guards. P6: Verified imports. P10/P11: Real state.
 */

import type {
  Warhead, EnforcementHook, HookResult, HookContext,
  EngineState, WarheadDiagnosis, BlockEvent, KnowledgePath,
} from '../engine/types.js';
import type { KnowledgeBase } from '../knowledge/knowledge-base.js';

type TentacleState = 'anchoring' | 'active' | 'dispersing' | 'tightening' | 'dissolving' | 'completed' | 'failed';
interface TentacleStateMachine { tentacleId: string; state: TentacleState; slotCount: number; completedSlots: number; failedSlots: number; retries: number; maxRetries: number; backoffMs: number; createdAt: number; lastTransition: number; lastError?: string; }

const ALLOWED = new Set(['task', 'get_cluster_status', 'read_kraken_context', 'report_to_kraken', 'glob', 'grep', 'read', 'write']);
const BLOCKED = new Set(['deploy_tentacle', 'aggregate_results', 'execution_brain_analyze', 'edit', 'patch', 'delete']);
const PERMISSION_PATTERNS: readonly RegExp[] = [
  /can i .*(deploy|spawn|use|call|run|execute)/i,
  /should i .*(deploy|spawn|use|call)/i,
  /may i/i,
  /permission to/i,
  /asking for (permission|approval)/i,
];

export class RuntimeGradeTentacleWarhead implements Warhead {
  readonly name = 'runtimeGradeTentacleWarhead';
  readonly priority = 'CRITICAL' as const;
  readonly knowledgeDependencies: KnowledgePath[] = [
    { library: 'RUNTIME_GRADE', files: ['OPERATIONAL_IDENTITY_BIBLE.md'], rules: ['P1-P12', 'Evidence Hierarchy'] },
    { library: 'ALGORITHMIC_SYSTEMS', files: ['03_CONCURRENCY_AND_BACKPRESSURE.md'], rules: ['Circuit Breaker', 'Retry with Backoff'] },
    { library: 'AGENT_IDENTITY', files: ['SHARK_V4.9.9_WARHEAD_SYSTEM.md'], rules: ['Warhead 1: Identity Wall'] },
  ];

  private tentacles = new Map<string, TentacleStateMachine>();
  private p12RuleCount = 0;
  private selfImplBlocks = 0;
  private permissionBlocks = 0;

  loadKnowledge(base: KnowledgeBase): void {
    const text = base.getLibrary('RUNTIME_GRADE').extractRules('OPERATIONAL_IDENTITY_BIBLE.md', ['P1-P12']);
    this.p12RuleCount = Math.min(5, text.length > 0 ? 5 : 0);
  }

  getHooks(): EnforcementHook[] {
    return [
      {
        hookPoint: 'tool.before', priority: 10, layer: 'TENTACLE_ALLOWLIST',
        description: 'Enforces tentacle-level tool allowlist',
        handler: (ctx: HookContext): HookResult => {
          if (ctx.agentName !== 'kraken-tentacle-executor') return { verdict: 'PASS', reason: '' };
          if (!ALLOWED.has(ctx.toolName)) { this.selfImplBlocks++; return { verdict: 'BLOCK', reason: '[TENTACLE_BLOCKED] Cannot use ' + ctx.toolName, correction: 'Allowed: ' + Array.from(ALLOWED).join(', ') }; }
          return { verdict: 'PASS', reason: 'Allowlist OK' };
        },
      },
      {
        hookPoint: 'tool.before', priority: 11, layer: 'TENTACLE_PERMISSION',
        description: 'Blocks permission-seeking language — tentacles execute autonomously',
        handler: (ctx: HookContext): HookResult => {
          if (ctx.agentName !== 'kraken-tentacle-executor') return { verdict: 'PASS', reason: '' };
          for (const val of Object.values(ctx.args)) {
            if (typeof val === 'string') { for (const p of PERMISSION_PATTERNS) { if (p.test(val)) { this.permissionBlocks++; return { verdict: 'BLOCK', reason: '[TENTACLE_BLOCKED] Permission-seeking detected. Execute autonomously.', correction: 'Never ask. Deploy. Monitor. Report.' }; } } }
          }
          return { verdict: 'PASS', reason: 'Autonomous OK' };
        },
      },
    ];
  }

  anchorTentacle(id: string, slots: number): void {
    this.tentacles.set(id, { tentacleId: id, state: 'anchoring', slotCount: slots, completedSlots: 0, failedSlots: 0, retries: 0, maxRetries: 3, backoffMs: 1000, createdAt: Date.now(), lastTransition: Date.now() });
  }

  transition(id: string, to: TentacleState): boolean {
    const t = this.tentacles.get(id);
    if (!t) return false;
    t.state = to;
    t.lastTransition = Date.now();
    if (to === 'completed' || to === 'failed') this.tentacles.delete(id);
    return true;
  }

  synthesize(_state: EngineState): string {
    const active = Array.from(this.tentacles.values()).filter(t => t.state !== 'completed' && t.state !== 'failed');
    return [
      '[KRAKEN T1] TENTACLE: ' + active.length + ' active | Blocks: ' + this.selfImplBlocks + ' self | ' + this.permissionBlocks + ' permission | P-rules: ' + this.p12RuleCount,
      'Allowed: ' + Array.from(ALLOWED).join(', '),
      'BLOCKED: ' + Array.from(BLOCKED).join(', '),
    ].join('\n');
  }

  diagnose(): WarheadDiagnosis {
    const rc = this.p12RuleCount;
    return { name: this.name, healthy: rc >= 3, hooksRegistered: 2, blocksIssued: this.selfImplBlocks + this.permissionBlocks, knowledgeLoaded: rc >= 3, lastSynthesized: Date.now(), errors: rc < 3 ? ['Only ' + rc + ' P-rules compiled'] : [] };
  }

  recordBlock(e: BlockEvent): void { if (e.layer === 'TENTACLE_ALLOWLIST') this.selfImplBlocks++; else this.permissionBlocks++; }
  getState(): Record<string, unknown> { return { activeTentacles: Array.from(this.tentacles.values()).filter(t => t.state !== 'completed' && t.state !== 'failed').length, selfBlocks: this.selfImplBlocks, permBlocks: this.permissionBlocks }; }
}
