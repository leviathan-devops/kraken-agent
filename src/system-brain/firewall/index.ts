/**
 * src/system-brain/firewall/index.ts
 *
 * Kraken Firewall — Consolidated Orchestrator
 *
 * ALL firewall layers in ONE place. No split directories.
 * Runs L0 through L10 in sequence. First block wins.
 * Every decision logged to audit.
 *
 * Architecture: Intent Classifier → Layer Sequence → Audit Log
 * Layers: L0 Identity → L1 Theatrical → L6 Anti-Retard → L7 Coordination →
 *         L8 Anti-Bullshit → L9 Feature Omission → L10 Container
 */

import type { FirewallContext, FirewallResult, BlockResult, AuditEntry } from './types.js';
import { OperationType } from './types.js';
import { classifyIntent } from './intent-classifier.js';
import { checkL0Identity } from './layers/l0-identity.js';
import { checkL1Theatrical } from './layers/l1-theatrical.js';
import { checkL6AntiRetard } from './layers/l6-anti-retard.js';
import { checkL7Coordination } from './layers/l7-coordination.js';
import { checkL8AntiBullshit } from './layers/l8-anti-bullshit.js';
import { checkL9FeatureOmission } from './layers/l9-feature-omission.js';
import { checkL10Container } from './layers/l10-container.js';
import { FirewallAudit } from './audit.js';

export class KrakenFirewall {
  private audit: FirewallAudit;
  private layers: Array<{ name: string; check: (ctx: FirewallContext) => FirewallResult | Promise<FirewallResult> }>;

  constructor(auditLogPath?: string) {
    this.audit = new FirewallAudit(auditLogPath);

    // Layer execution order — first block wins
    this.layers = [
      { name: 'L0', check: checkL0Identity },
      { name: 'L1', check: checkL1Theatrical },
      { name: 'L6', check: checkL6AntiRetard },
      { name: 'L7', check: checkL7Coordination },
      { name: 'L8', check: checkL8AntiBullshit },
      { name: 'L9', check: checkL9FeatureOmission },
      { name: 'L10', check: checkL10Container },
    ];
  }

  /**
   * Run all firewall layers against the given context.
   * Supports both sync and async layer checks (L10 is async for P4 async discipline).
   * Returns the first block result, or the last allow result.
   * Logs every decision to audit.
   */
  async enforce(context: FirewallContext): Promise<FirewallResult> {
    let result: FirewallResult = {
      blocked: false,
      layer: 'INIT',
      reason: 'No layers executed',
    };

    for (const layer of this.layers) {
      try {
        // Await handles both sync (non-Promise) and async (Promise) layer checks
        result = await layer.check(context);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[Firewall] Layer ${layer.name} threw error: ${errMsg}`);
        // Default-deny: block when a layer throws (fail-closed — safest option)
        result = {
          blocked: true,
          layer: `${layer.name}_ERROR`,
          reason: `Firewall layer ${layer.name} threw exception: ${errMsg}`,
          correction: 'Firewall layer error — check layer implementation for bugs',
        } as BlockResult;
      }

      // Log the decision
      this.logDecision(context, result);

      // If blocked, return immediately
      if (result.blocked) {
        return result;
      }
    }

    return result;
  }

  /**
   * Convenience function for the tool.execute.before hook.
   * Takes raw hook input and returns a simple result.
   * Async to support async firewall layer checks (L10 with fs.promises).
   */
  async enforceFirewall(rawInput: {
    agentName: string;
    toolName: string;
    toolArgs: Record<string, unknown>;
    message: string;
    taskType: string;
    targetCluster: string;
  }): Promise<{ allowed: boolean; blockedBy?: string; reason?: string; correction?: string }> {
    const { agentName, toolName, toolArgs, message, taskType, targetCluster } = rawInput;

    // Build FirewallContext from raw input
    const command = typeof toolArgs.command === 'string' ? toolArgs.command : null;
    const commandTokens = command ? command.split(/\s+/) : [];

    const context: FirewallContext = {
      agent: agentName,
      sessionId: '',  // Will be populated by hook
      tool: toolName,
      operationType: classifyIntent(toolName, command, toolArgs),
      command,
      commandTokens,
      hasPipe: command ? command.includes('|') : false,
      pipeChain: command ? command.split('|').map((s: string) => s.trim()) : [],
      args: toolArgs,
      fileTargets: extractFileTargets(toolArgs),
      sessionState: {
        brainInitialized: true,
        evidencePath: null,
        currentGate: null,
        lastBlockedLayer: null,
        recentActions: [],
      },
    };

    const result = await this.enforce(context);

    if (result.blocked) {
      return {
        allowed: false,
        blockedBy: result.layer,
        reason: result.reason,
        correction: result.correction,
      };
    }

    return { allowed: true };
  }

  private logDecision(context: FirewallContext, result: FirewallResult): void {
    const entry: AuditEntry = {
      timestamp: new Date().toISOString(),
      agent: context.agent,
      tool: context.tool,
      operationType: context.operationType,
      layer: result.layer,
      blocked: result.blocked,
      reason: result.reason,
      command: context.command,
      correction: result.blocked ? (result as BlockResult).correction : '',
      sessionId: context.sessionId,
    };

    this.audit.log(entry);
  }

  getAudit(): FirewallAudit {
    return this.audit;
  }
}

/** Extract file target paths from tool arguments */
function extractFileTargets(args: Record<string, unknown>): string[] {
  const targets: string[] = [];
  const pathKeys = ['path', 'filePath', 'file_path', 'dir', 'directory', 'destination', 'outputPath', 'evidencePath'];

  for (const key of pathKeys) {
    const value = args[key];
    if (typeof value === 'string' && value.length > 0) {
      targets.push(value);
    }
  }

  return targets;
}
