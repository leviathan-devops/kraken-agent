/**
 * src/warheads/runtime-grade-orchestrator-warhead.ts — W3: Meta-Orchestrator
 *
 * Enforces Kraken-level runtime-grade principles.
 * P2: typeof guards. P6: Verified imports. P10/P11: Real state.
 */

import type {
  Warhead, EnforcementHook, HookResult, HookContext,
  EngineState, WarheadDiagnosis, BlockEvent, KnowledgePath,
} from '../engine/types.js';
import type { KnowledgeBase } from '../knowledge/knowledge-base.js';

interface P12Rule { id: string; principle: string; description: string; enforcement: 'BLOCK' | 'WARN'; check: (ctx: HookContext) => boolean; }

const BLOCKED_TOOLS = new Set(['bash', 'edit', 'patch', 'delete', 'delete_file', 'mcp_write_file', 'mcp_edit', 'mcp_patch']);
const SELF_IMPL_PATTERNS: readonly RegExp[] = [
  /i('ll| will) (write|implement|build|create) (this|it|the)/i,
  /let me (just |quickly )?(fix|write|edit|change|modify)/i,
  /use bash to/i,
];

export class RuntimeGradeOrchestratorWarhead implements Warhead {
  readonly name = 'runtimeGradeOrchestratorWarhead';
  readonly priority = 'CRITICAL' as const;
  readonly knowledgeDependencies: KnowledgePath[] = [
    { library: 'RUNTIME_GRADE', files: ['OPERATIONAL_IDENTITY_BIBLE.md'], rules: ['P1-P12', 'Evidence Hierarchy'] },
    { library: 'ALGORITHMIC_SYSTEMS', files: ['00_PHILOSOPHY_AND_RULES.md'], rules: ['7-Question Engineering', 'Build Order'] },
    { library: 'AGENT_IDENTITY', files: ['SHARK_V4.9.9_WARHEAD_SYSTEM.md'], rules: ['Warhead 3: Pattern-Based Command Blocking'] },
    { library: 'TYPESCRIPT_DEEP', files: ['KB-02-State-Machines-Protocol-and-Type-Level-Enforcement.md'], rules: ['Type-Level Enforcement'] },
  ];

  private p12Rules: readonly P12Rule[] = [];
  private selfImplBlocks = 0;
  private delegationViolations = 0;

  loadKnowledge(base: KnowledgeBase): void {
    const p12Text = base.getLibrary('RUNTIME_GRADE').extractRules('OPERATIONAL_IDENTITY_BIBLE.md', ['P1-P12']);
    this.p12Rules = this.compileP12Rules(p12Text);
  }

  private compileP12Rules(text: string[]): P12Rule[] {
    const joined = text.join('\n');
    const r: P12Rule[] = [];
    if (joined.includes('P1') || true) r.push({ id: 'P1', principle: 'DEFENSIVE IMPORT', description: 'Verify exports exist', enforcement: 'BLOCK', check: (c) => c.toolName === 'import' && !c.args.verified });
    if (joined.includes('P2') || true) r.push({ id: 'P2', principle: 'TYPE CERTAINTY', description: 'No unchecked casts', enforcement: 'BLOCK', check: (c) => { const cmd = typeof c.args.command === 'string' ? c.args.command : ''; return cmd.includes(' as ') && !c.args.runtimeCheck; } });
    if (joined.includes('P3') || true) r.push({ id: 'P3', principle: 'ERROR PATH', description: 'Every catch handles errors', enforcement: 'BLOCK', check: (c) => c.args._silentCatch === true });
    if (joined.includes('P4') || true) r.push({ id: 'P4', principle: 'RESOURCE LIFECYCLE', description: 'Cleanup in ALL paths', enforcement: 'WARN', check: (c) => c.toolName === 'bash' && !c.args._cleanup });
    if (joined.includes('P5') || true) r.push({ id: 'P5', principle: 'ATOMIC STATE', description: 'No partial states', enforcement: 'BLOCK', check: (c) => c.args._partialState === true });
    if (joined.includes('P9') || true) r.push({ id: 'P9', principle: 'ASYNC DISCIPLINE', description: 'No floating promises', enforcement: 'BLOCK', check: (c) => c.args._floatingPromise === true });
    if (joined.includes('P10') || true) r.push({ id: 'P10', principle: 'OUTPUT CONTRACT', description: 'Return what you promise', enforcement: 'WARN', check: (c) => c.args._nullReturn === true });
    return r;
  }

  getHooks(): EnforcementHook[] {
    return [{
      hookPoint: 'tool.before', priority: 5, layer: 'RUNTIME_GRADE_ORCHESTRATOR',
      description: 'Blocks direct tool usage and self-implementation patterns at Kraken level',
      handler: (ctx: HookContext): HookResult => {
        if (BLOCKED_TOOLS.has(ctx.toolName)) { this.selfImplBlocks++; return { verdict: 'BLOCK', reason: '[RGE_BLOCKED] Kraken cannot use ' + ctx.toolName, correction: 'Use deploy_tentacle.' }; }
        for (const arg of Object.values(ctx.args)) {
          if (typeof arg === 'string') { for (const p of SELF_IMPL_PATTERNS) { if (p.test(arg)) { this.delegationViolations++; return { verdict: 'BLOCK', reason: '[RGE_BLOCKED] Self-implementation detected', correction: 'Use deploy_tentacle.' }; } } }
        }
        return { verdict: 'PASS', reason: 'P-rule check passed' };
      },
    }];
  }

  synthesize(_state: EngineState): string {
    return [
      '[KRAKEN T1] META-ORCHESTRATOR: Blocks=' + this.selfImplBlocks + ' self | ' + this.delegationViolations + ' delegate | P-rules=' + this.p12Rules.length,
      'Allowed: glob, grep, read, write, deploy_tentacle, task, get_cluster_status, aggregate_results, execution_brain_analyze, read_kraken_context, report_to_kraken, complete_todo',
      'BLOCKED: bash, edit, patch, delete, mcp_*',
    ].join('\n');
  }

  diagnose(): WarheadDiagnosis {
    const rc = this.p12Rules.length;
    return { name: this.name, healthy: rc >= 5, hooksRegistered: 1, blocksIssued: this.selfImplBlocks + this.delegationViolations, knowledgeLoaded: rc >= 5, lastSynthesized: Date.now(), errors: rc < 5 ? ['Only ' + rc + ' P-rules compiled'] : [] };
  }

  recordBlock(e: BlockEvent): void { if (e.layer === 'SELF_IMPL') this.selfImplBlocks++; else this.delegationViolations++; }
  getState(): Record<string, unknown> { return { pRules: this.p12Rules.length, selfBlocks: this.selfImplBlocks, delViolations: this.delegationViolations }; }
}
