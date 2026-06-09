/**
 * src/engine/warhead-engine.ts — Kraken v1.4 Warhead Engine
 *
 * THE MECHANICAL ORCHESTRATION ENGINE.
 * Registers all 23 warheads, loads knowledge, enforces hooks,
 * synthesizes T1 context, and provides diagnostics.
 *
 * P2: No unchecked casts.
 * P3: catch blocks re-throw StructuredBlockError, log others.
 * P4: Knowledge loaded once at init.
 * P6: All imports verified — every warhead file exists.
 * P7: No hardcoded paths — delegates to KnowledgeBase.
 * P9: Sync enforcement — no floating promises.
 * P10: synthesizeAll returns real string.
 * P11: Real state — all counters, all warheads, all diagnostics.
 */

import { PhalanxWarhead } from '../warheads/phalanx-warhead.js';
import { RuntimeGradeOrchestratorWarhead } from '../warheads/runtime-grade-orchestrator-warhead.js';
import { RuntimeGradeTentacleWarhead } from '../warheads/runtime-grade-tentacle-warhead.js';
import { IdentityWarhead } from '../warheads/identity-warhead.js';
import { AllowlistWarhead } from '../warheads/allowlist-warhead.js';
import { TentacleManagerWarhead } from '../warheads/tentacle-manager-warhead.js';
import { ContextWarhead } from '../warheads/context-warhead.js';
import { MultiBrainWarhead } from '../warheads/multi-brain-warhead.js';
import { LayerEngineWarhead } from '../warheads/layer-engine-warhead.js';
import { L5AntiDerailmentWarhead } from '../warheads/l5-antiderailment-warhead.js';
import { F1IsolationWarhead } from '../warheads/f1-isolation-warhead.js';
import { EvidenceGateWarhead } from '../warheads/evidence-gate-warhead.js';
import { CompactionSurvivalWarhead } from '../warheads/compaction-survival-warhead.js';
import { RecoveryCheckpointWarhead } from '../warheads/recovery-checkpoint-warhead.js';
import { T2T1PyramidWarhead } from '../warheads/t2t1-pyramid-warhead.js';
import { TriplePathInjectionWarhead } from '../warheads/triple-path-injection-warhead.js';
import { PhalanxIdentityFilesWarhead } from '../warheads/phalanx-identity-files-warhead.js';
import { WarheadSynthesizerWarhead } from '../warheads/warhead-synthesizer-warhead.js';
import { PerAgentAllowlistWarhead } from '../warheads/per-agent-allowlist-warhead.js';
import { StructuredBlockErrorWarhead } from '../warheads/structured-block-error-warhead.js';
import { FirewallAuditWarhead } from '../warheads/firewall-audit-warhead.js';
import { ParallelDeploymentWarhead } from '../warheads/parallel-deployment-warhead.js';
import { RateLimitWarhead } from '../warheads/rate-limit-warhead.js';
import { KnowledgeBase } from '../knowledge/knowledge-base.js';
import { WarheadRegistry } from './warhead-registry.js';
import { StructuredBlockError } from '../firewall/structured-block-error.js';
import type { HookContext, EngineState, WarheadDiagnosis } from './types.js';

export class WarheadEngine {
  private registry: WarheadRegistry;
  private knowledgeBase: KnowledgeBase;
  private callCount = 0;
  private readonly diagnosisInterval = 100;

  constructor() {
    this.knowledgeBase = new KnowledgeBase();
    this.registry = new WarheadRegistry();

    // Register all 23 warheads in priority order
    this.registry.register(new PhalanxWarhead());                     // W1  CRITICAL
    this.registry.register(new RuntimeGradeOrchestratorWarhead());     // W3  CRITICAL
    this.registry.register(new RuntimeGradeTentacleWarhead());         // W4  CRITICAL
    this.registry.register(new IdentityWarhead());                     // W2  CRITICAL
    this.registry.register(new AllowlistWarhead());                    // W6  CRITICAL
    this.registry.register(new LayerEngineWarhead());                  // W9  CRITICAL
    this.registry.register(new L5AntiDerailmentWarhead());             // W12 CRITICAL
    this.registry.register(new F1IsolationWarhead());                  // W13 CRITICAL
    this.registry.register(new T2T1PyramidWarhead());                  // W17 CRITICAL
    this.registry.register(new TriplePathInjectionWarhead());          // W18 CRITICAL
    this.registry.register(new WarheadSynthesizerWarhead());           // W20 CRITICAL
    this.registry.register(new TentacleManagerWarhead());              // W5  HIGH
    this.registry.register(new ContextWarhead());                      // W7  HIGH
    this.registry.register(new MultiBrainWarhead());                   // W8  HIGH
    this.registry.register(new FirewallAuditWarhead());                // W11 HIGH
    this.registry.register(new EvidenceGateWarhead());                 // W14 HIGH
    this.registry.register(new CompactionSurvivalWarhead());           // W15 HIGH
    this.registry.register(new RecoveryCheckpointWarhead());           // W16 HIGH
    this.registry.register(new PerAgentAllowlistWarhead());            // W21 HIGH
    this.registry.register(new ParallelDeploymentWarhead());           // W22 HIGH
    this.registry.register(new PhalanxIdentityFilesWarhead());         // W19 MEDIUM
    this.registry.register(new RateLimitWarhead());                    // W23 LOW
    this.registry.register(new StructuredBlockErrorWarhead());         // W10 CRITICAL (passive)
  }

  /**
   * Initialize the engine: load knowledge, wire warheads, diagnose.
   * Must be called once before enforce() or synthesizeAll().
   */
  initialize(): void {
    // Load all 4 knowledge libraries
    this.knowledgeBase.loadLibrary('AGENT_IDENTITY');
    this.knowledgeBase.loadLibrary('ALGORITHMIC_SYSTEMS');
    this.knowledgeBase.loadLibrary('RUNTIME_GRADE');
    this.knowledgeBase.loadLibrary('TYPESCRIPT_DEEP');

    // Wire knowledge into every warhead
    for (const warhead of this.registry.getAll()) {
      warhead.loadKnowledge(this.knowledgeBase);
    }

    // Run initial diagnosis
    const failed = this.diagnoseAll().filter(d => !d.healthy);
    if (failed.length > 0) {
      const names = failed.map(d => d.name + ': ' + d.errors.join(', ')).join('; ');
      console.error('[WarheadEngine] ' + failed.length + ' warheads failed init: ' + names);
    }
    console.error('[WarheadEngine] ' + this.registry.count() + ' warheads initialized');
  }

  /**
   * Synthesize all warhead states into a single T1 injectable string.
   */
  synthesizeAll(state: EngineState): string {
    const parts: string[] = ['\n---\n[KRAKEN T1 WARHEADS — MECHANICAL STATE COMPILED]\n'];
    for (const warhead of this.registry.getByPriority()) {
      const t1 = warhead.synthesize(state);
      if (t1.length > 0) {
        parts.push(t1);
      }
    }
    parts.push('\n[KRAKEN T1 WARHEADS END — ' + this.registry.count() + ' active]\n---\n');
    return parts.join('\n');
  }

  /**
   * Run all tool.before hooks for a given context.
   * Throws StructuredBlockError if any hook returns BLOCK.
   * FIX 4: Uses getByPriority() so hook priorities are respected (p0 first, p45 last).
   */
  enforce(context: HookContext): void {
    // Periodic health check
    if (++this.callCount % this.diagnosisInterval === 0) {
      this.diagnoseAll();
    }

    for (const warhead of this.registry.getByPriority()) {
      for (const hook of warhead.getHooks()) {
        if (hook.hookPoint !== 'tool.before') continue;
        try {
          const result = hook.handler(context);
          if (result.verdict === 'BLOCK') {
            const err = new StructuredBlockError(
              hook.layer,
              result.reason,
              result.correction ?? '',
              context.toolName,
            );
            warhead.recordBlock({
              layer: hook.layer,
              reason: result.reason,
              toolName: context.toolName,
              agentName: context.agentName,
              timestamp: new Date().toISOString(),
            });
            throw err;
          }
        } catch (e) {
          // Re-throw structured blocks, suppress other hook errors
          if (e instanceof StructuredBlockError) {
            throw e;
          }
          console.error('[WarheadEngine] Hook error in ' + warhead.name + '.' + hook.layer + ': ' + (e instanceof Error ? e.message : String(e)));
        }
      }
    }
  }

  /**
   * Run all tool.after hooks for post-execution tracking.
   * FIX 3: New method — fires tool.after hooks for counter maintenance.
   * These hooks NEVER BLOCK — they only update counters/state.
   */
  runAfterHooks(context: HookContext): void {
    for (const warhead of this.registry.getByPriority()) {
      for (const hook of warhead.getHooks()) {
        if (hook.hookPoint !== 'tool.after') continue;
        try {
          hook.handler(context);
        } catch (e) {
          console.error('[WarheadEngine] tool.after error in ' + warhead.name + '.' + hook.layer + ': ' + (e instanceof Error ? e.message : String(e)));
        }
      }
    }
  }

  /**
   * Run hooks for a specific hook point (system.transform, compacting, etc).
   * Non-tool.before hooks don't throw — they just track state.
   */
  runHooks(hookPoint: string, context: HookContext): void {
    for (const warhead of this.registry.getAll()) {
      for (const hook of warhead.getHooks()) {
        if (hook.hookPoint !== hookPoint) continue;
        try {
          hook.handler(context);
        } catch (e) {
          console.error('[WarheadEngine] Hook error in ' + warhead.name + '.' + hook.layer + ': ' + (e instanceof Error ? e.message : String(e)));
        }
      }
    }
  }

  /**
   * Diagnose all warheads. Returns array of diagnoses.
   */
  diagnoseAll(): WarheadDiagnosis[] {
    return this.registry.getAll().map(w => w.diagnose());
  }

  /**
   * Get the registry for direct warhead access.
   */
  getRegistry(): WarheadRegistry {
    return this.registry;
  }

  /**
   * Get the knowledge base for direct library access.
   */
  getKnowledgeBase(): KnowledgeBase {
    return this.knowledgeBase;
  }

  /**
   * Get engine-level state snapshot.
   * P5/P11 FIX: Queries real warhead state instead of hardcoded zeros.
   * Falls back to 0 only when the warhead genuinely reports no active tentacles.
   */
  getState(): EngineState {
    const allDiag = this.diagnoseAll();

    // P5: Extract real tentacle/agent counts from TentacleManager and ParallelDeployment warheads
    const tentacleWarhead = this.registry.get('TentacleManagerWarhead');
    const parallelWarhead = this.registry.get('ParallelDeploymentWarhead');

    let activeTentacles = 0;
    let activeAgents = 0;

    if (tentacleWarhead) {
      try {
        const tState = tentacleWarhead.getState();
        if (typeof tState.activeTentacles === 'number') {
          activeTentacles = tState.activeTentacles;
        }
        if (typeof tState.activeAgents === 'number') {
          activeAgents = tState.activeAgents;
        }
      } catch (err) {
        console.error('[WarheadEngine] Failed to query TentacleManager state: ' + (err instanceof Error ? err.message : String(err)));
      }
    }

    if (parallelWarhead && activeTentacles === 0) {
      try {
        const pState = parallelWarhead.getState();
        if (typeof pState.active === 'number') {
          activeTentacles = pState.active;
        }
      } catch (err) {
        console.error('[WarheadEngine] Failed to query ParallelDeployment state: ' + (err instanceof Error ? err.message : String(err)));
      }
    }

    return {
      activeTentacles,
      activeAgents,
      totalBlocks: allDiag.reduce((sum, d) => sum + d.blocksIssued, 0),
      lastGate: '',
      timestamp: Date.now(),
      warheadCount: this.registry.count(),
      healthyCount: allDiag.filter(d => d.healthy).length,
    };
  }
}
