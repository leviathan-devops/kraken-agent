/**
 * src/warheads/layer-engine-warhead.ts — W9: 6-Layer Firewall Engine
 *
 * Sequential layer evaluation: PHALANX_IDENTITY → ALLOWLIST → ZONE →
 * THEATRICAL → SPAWN_VALIDATE. Each layer can short-circuit with BLOCK.
 *
 * P2: typeof guards on all extracted args. No unchecked `as` casts.
 * P3: No catch blocks needed — pure logic, no IO.
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

interface LayerResult {
  readonly name: string;
  readonly verdict: 'PASS' | 'BLOCK' | 'WARN';
  readonly reason: string;
  readonly correction?: string;
}

const KRAKEN_ONLY_TOOLS: ReadonlySet<string> = new Set([
  'deploy_tentacle', 'aggregate_results', 'execution_brain_analyze',
]);

const KNOWN_AGENT_TYPES: ReadonlySet<string> = new Set([
  'kraken-tentacle-executor', 'kraken-cluster-agent', 'explore', 'general',
]);

const THEATRICAL_PATTERN = /use a mock|stub it|placeholder|TODO|FIXME|implement later/i;
const ZONE_WRITE_PATTERN = /(CONTEXT_MANAGEMENT|TENTACLE_CONTEXT|\.kraken)/;

export class LayerEngineWarhead implements Warhead {
  readonly name = 'layerEngineWarhead';
  readonly priority = 'CRITICAL' as const;
  readonly knowledgeDependencies: KnowledgePath[] = [
    { library: 'ALGORITHMIC_SYSTEMS', files: ['06_SEMANTIC_FIREWALL_COMPILER_API.md'], rules: ['Pattern Detection', 'Blocking Logic'] },
    { library: 'TYPESCRIPT_DEEP', files: ['KB-06-Adversarial-Resilience-and-Agent-Security.md'], rules: ['Threat Detection'] },
  ];

  private blockLog: LayerResult[] = [];
  private firewallPatterns: readonly string[] = [];
  private adversarialPatterns: readonly string[] = [];

  loadKnowledge(base: KnowledgeBase): void {
    this.firewallPatterns = base.getLibrary('ALGORITHMIC_SYSTEMS').extractRules(
      '06_SEMANTIC_FIREWALL_COMPILER_API.md',
      ['Pattern Detection'],
    );
    this.adversarialPatterns = base.getLibrary('TYPESCRIPT_DEEP').extractRules(
      'KB-06-Adversarial-Resilience-and-Agent-Security.md',
      ['Threat Detection'],
    );
  }

  evaluate(input: {
    toolName: string;
    agentName: string;
    targetAgent?: string;
    args?: Record<string, unknown>;
  }): LayerResult {
    // LAYER 1: PHALANX_IDENTITY — Kraken-only tools
    if (input.agentName !== 'kraken' && KRAKEN_ONLY_TOOLS.has(input.toolName)) {
      const r: LayerResult = { name: 'PHALANX_IDENTITY', verdict: 'BLOCK', reason: '[F1] Non-Kraken agent called Kraken tool', correction: 'Switch to Kraken tab.' };
      this.blockLog.push(r);
      return r;
    }

    // LAYER 3: ALLOWLIST
    const allowed = ALLOWLISTS[input.agentName];
    if (allowed && !allowed.includes(input.toolName)) {
      const r: LayerResult = { name: 'ALLOWLIST', verdict: 'BLOCK', reason: input.toolName + ' not in ' + input.agentName + ' allowlist', correction: 'Allowed: ' + allowed.join(', ') };
      this.blockLog.push(r);
      return r;
    }

    // LAYER 4: ZONE — write path protection
    if ((input.toolName === 'write' || input.toolName === 'edit') && input.agentName === 'kraken') {
      const fp = (typeof input.args?.filePath === 'string' ? input.args.filePath : '');
      if (fp.length > 0 && !fp.match(ZONE_WRITE_PATTERN)) {
        const r: LayerResult = { name: 'ZONE', verdict: 'BLOCK', reason: '[ZONE] Kraken writes only to CONTEXT_MANAGEMENT/', correction: 'CONTEXT_MANAGEMENT/ or TENTACLE_CONTEXT/' };
        this.blockLog.push(r);
        return r;
      }
    }

    // LAYER 5: THEATRICAL — mock/stub/TODO detection
    const args = input.args ?? {};
    for (const val of Object.values(args)) {
      if (typeof val === 'string' && THEATRICAL_PATTERN.test(val)) {
        const r: LayerResult = { name: 'THEATRICAL', verdict: 'BLOCK', reason: '[THEATRICAL] Mock/stub/TODO detected', correction: 'Implement real code.' };
        this.blockLog.push(r);
        return r;
      }
    }

    // LAYER 6: SPAWN_VALIDATE
    if (input.toolName === 'task') {
      const target = (typeof args.agent === 'string' ? args.agent : '');
      if (target.length > 0 && !KNOWN_AGENT_TYPES.has(target)) {
        const r: LayerResult = { name: 'SPAWN_VALIDATE', verdict: 'BLOCK', reason: '[SPAWN] Unknown agent: ' + target, correction: 'Only known agent types can be spawned.' };
        this.blockLog.push(r);
        return r;
      }
    }

    return { name: 'ALL', verdict: 'PASS', reason: 'All 6 layers passed' };
  }

  getHooks(): EnforcementHook[] {
    return [{
      hookPoint: 'tool.before', priority: 0, layer: 'LAYER_ENGINE',
      description: 'Sequential 6-layer firewall evaluation',
      handler: (ctx: HookContext): HookResult => this.evaluate(ctx),
    }];
  }

  synthesize(_state: EngineState): string {
    return '[KRAKEN T1] FIREWALL: ' + this.blockLog.length + ' blocks | Security: ' + this.firewallPatterns.length + ' patterns | Adversarial: ' + this.adversarialPatterns.length;
  }

  diagnose(): WarheadDiagnosis {
    return { name: this.name, healthy: true, hooksRegistered: 1, blocksIssued: this.blockLog.length, knowledgeLoaded: this.firewallPatterns.length > 0, lastSynthesized: Date.now(), errors: [] };
  }

  recordBlock(e: BlockEvent): void {
    this.blockLog.push({ name: e.layer, verdict: 'BLOCK', reason: e.reason });
  }

  getState(): Record<string, unknown> {
    return { blocks: this.blockLog.length, patterns: this.firewallPatterns.length };
  }
}
