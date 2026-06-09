/**
 * src/warheads/tentacle-manager-warhead.ts — W5: Concurrency Manager
 *
 * Manages tentacle concurrency limits, backpressure queuing,
 * and circuit breaker state for failed tentacles.
 *
 * BUG FIX: diagnose() referenced `open` variable not in scope.
 * Fixed: compute open circuits inline within diagnose().
 *
 * P2: typeof guards. P6: Verified imports. P10/P11: Real state.
 */

import type {
  Warhead, EnforcementHook, HookResult, HookContext,
  EngineState, WarheadDiagnosis, BlockEvent, KnowledgePath,
} from '../engine/types.js';
import type { KnowledgeBase } from '../knowledge/knowledge-base.js';

interface CircuitBreakerState { tentacleId: string; failures: number; threshold: number; lastFailure: number; cooldownMs: number; open: boolean; }

export class TentacleManagerWarhead implements Warhead {
  readonly name = 'tentacleManagerWarhead';
  readonly priority = 'HIGH' as const;
  readonly knowledgeDependencies: KnowledgePath[] = [
    { library: 'ALGORITHMIC_SYSTEMS', files: ['03_CONCURRENCY_AND_BACKPRESSURE.md'], rules: ['Backpressure', 'Circuit Breaker'] },
  ];

  private activeTentacles = 0;
  private totalActiveAgents = 0;
  private readonly MAX_TENTACLES = 8;
  private readonly MAX_AGENTS = 16;
  private circuitBreakers = new Map<string, CircuitBreakerState>();
  private queue: Array<{ tentacleId: string; macroTask: string }> = [];
  private circuitBreakerPatterns: readonly string[] = [];

  loadKnowledge(base: KnowledgeBase): void {
    this.circuitBreakerPatterns = base.getLibrary('ALGORITHMIC_SYSTEMS').extractRules(
      '03_CONCURRENCY_AND_BACKPRESSURE.md', ['Circuit Breaker'],
    );
  }

  getHooks(): EnforcementHook[] {
    return [
      {
        hookPoint: 'tool.before', priority: 3, layer: 'BACKPRESSURE',
        description: 'Enforces max tentacle and agent concurrency limits',
        handler: (ctx: HookContext): HookResult => {
          if (ctx.toolName !== 'deploy_tentacle') return { verdict: 'PASS', reason: '' };
          if (this.totalActiveAgents >= this.MAX_AGENTS) return { verdict: 'BLOCK', reason: '[BACKPRESSURE] ' + this.totalActiveAgents + ' agents running', correction: 'Wait for tentacles.' };
          if (this.activeTentacles >= this.MAX_TENTACLES) return { verdict: 'BLOCK', reason: '[BACKPRESSURE] ' + this.activeTentacles + ' tentacles active', correction: 'Queue: ' + (this.queue.length + 1) };
          return { verdict: 'PASS', reason: 'Deploy OK. ' + this.activeTentacles + '/' + this.MAX_TENTACLES + ' tentacles.' };
        },
      },
      {
        hookPoint: 'tool.after', priority: 3, layer: 'BACKPRESSURE_MAINT',
        description: 'Maintains tentacle/agent counters on deploy and aggregate',
        handler: (ctx: HookContext): HookResult => {
          if (ctx.toolName === 'deploy_tentacle') {
            this.activeTentacles++;
            const slots = (ctx.metadata && typeof ctx.metadata.slots === 'number') ? ctx.metadata.slots : 2;
            this.totalActiveAgents += slots;
          }
          if (ctx.toolName === 'aggregate_results') {
            const completedSlots = (ctx.metadata && typeof ctx.metadata.completedSlots === 'number') ? ctx.metadata.completedSlots : 2;
            this.activeTentacles = Math.max(0, this.activeTentacles - 1);
            this.totalActiveAgents = Math.max(0, this.totalActiveAgents - completedSlots);
            if (this.queue.length > 0) this.queue.shift();
          }
          return { verdict: 'PASS', reason: 'Counters: ' + this.activeTentacles + 'T/' + this.totalActiveAgents + 'A' };
        },
      },
      {
        hookPoint: 'tool.after', priority: 3, layer: 'CIRCUIT_BREAKER',
        description: 'Tracks tentacle failures and opens circuit breakers at threshold',
        handler: (ctx: HookContext): HookResult => {
          if (ctx.toolName !== 'report_to_kraken') return { verdict: 'PASS', reason: '' };
          const id = typeof ctx.args.tentacleId === 'string' ? ctx.args.tentacleId : '';
          const status = typeof ctx.args.status === 'string' ? ctx.args.status : '';
          if (!id || status !== 'failed') return { verdict: 'PASS', reason: '' };
          let cb = this.circuitBreakers.get(id);
          if (!cb) { cb = { tentacleId: id, failures: 0, threshold: 3, lastFailure: Date.now(), cooldownMs: 30000, open: false }; this.circuitBreakers.set(id, cb); }
          cb.failures++;
          cb.lastFailure = Date.now();
          if (cb.failures >= cb.threshold) { cb.open = true; return { verdict: 'BLOCK', reason: '[CIRCUIT_OPEN] ' + id + ': ' + cb.failures + ' failures', correction: 'Report failed. Cooldown: 30s.' }; }
          return { verdict: 'PASS', reason: 'Circuit: ' + cb.failures + '/' + cb.threshold + ' failures' };
        },
      },
    ];
  }

  synthesize(_state: EngineState): string {
    const openCircuits = Array.from(this.circuitBreakers.values()).filter(cb => cb.open);
    return '[KRAKEN T1] CONCURRENCY: ' + this.activeTentacles + '/' + this.MAX_TENTACLES + ' tentacles | ' + this.totalActiveAgents + '/' + this.MAX_AGENTS + ' agents | Open circuits: ' + openCircuits.length;
  }

  diagnose(): WarheadDiagnosis {
    const openCircuitCount = Array.from(this.circuitBreakers.values()).filter(cb => cb.open).length;
    return { name: this.name, healthy: true, hooksRegistered: 3, blocksIssued: openCircuitCount, knowledgeLoaded: this.circuitBreakerPatterns.length > 0, lastSynthesized: Date.now(), errors: [] };
  }

  recordBlock(_e: BlockEvent): void {}
  getState(): Record<string, unknown> { return { activeTentacles: this.activeTentacles, activeAgents: this.totalActiveAgents, queue: this.queue.length }; }
}
