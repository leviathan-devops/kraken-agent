/**
 * Kraken L0-L7 Firewall + L6 Anti-Retard + L8 Anti-Bullshit + V10 Theatrical Firewalls
 * MILITARY GRADE Combined Enforcement Pipeline
 *
 * OCTOPUS ARCHITECTURE:
 * - Each layer is an autonomous ARM with local intelligence
 * - System brain coordinates ALL layers via DEFAULT_LAYERS
 * - Context bridge injects Hive context on every block
 * - Consequence escalation via strike system
 * - NO more toolName gates — layers apply to ALL tools
 * - L5 now BLOCKS (no more weak warn-only)
 *
 * EXECUTION ORDER:
 * 1. L0: Identity wall
 * 2. AR: ANTI-RETARD (multi-signal fusion, instant block)
 * 3. L1-L7: Enforcement layers (ALL tools, no toolName gates)
 * 4. Context bridge: Hive context injection on every block
 */

import { checkKrakenIdentityWall, type L0CheckResult } from './l0-identity.js';
import { checkOrchestrationTheater, type L1CheckResult } from './l1-orchestration-theater.js';
import { checkFalseCompletion, type L2CheckResult } from './l2-false-completion.js';
import { checkOutputInspection, type L3CheckResult } from './l3-output-inspection.js';
import { checkWrongCluster, type L4CheckResult } from './l4-wrong-cluster.js';
import { checkMacroDerailment, type L5CheckResult } from './l5-macro-derailment.js';
import { checkKrakenProtection, checkProtectionPatterns, type L6CheckResult } from './l6-kraken-protection.js';

import { DEFAULT_LAYERS } from '../../../system-brain/firewall/layers/index.js';
import { LayerEngine } from '../../../system-brain/firewall/layer-engine.js';
import { IntentClassifier } from '../../../system-brain/firewall/intent-classifier.js';
import { EvidenceGate } from '../../../system-brain/firewall/evidence-gate.js';
import { checkAntiRetardPattern, recordActionResult } from './l6-anti-retard.js';
import { evaluateCoordinationGate } from '../../../system-brain/firewall/l7-coordination-gates.js';
import {
  bridgeFirewallToHive,
  extractCategoriesFromReason,
  type BlockContext,
  type ContextInjection,
} from '../../../system-brain/firewall/firewall-context-bridge.js';

export type FirewallLayer = 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6' | 'L7' | 'L8' | 'L9' | 'L10' | 'AR' | 'STRIKE' | 'L6-AR';

export interface FirewallResult {
  allowed: boolean;
  blockedBy?: FirewallLayer;
  reason?: string;
  details: Record<string, unknown>;
  hiveContextInjection?: string;
  layerResults: {
    l0: L0CheckResult;
    l1: L1CheckResult;
    l2: L2CheckResult;
    l3?: L3CheckResult;
    l4?: L4CheckResult;
    l5?: L5CheckResult;
    l6?: L6CheckResult;
    l7?: { passed: boolean; layer: string; gateId: string; blockers: string[] };
    antiRetard?: { blocked: boolean; reason?: string; correction?: string };
    theatrical?: { allowed: boolean; blockedBy?: string; reason?: string };
  };
}

export interface FirewallContext {
  agentName?: string;
  toolName: string;
  toolArgs: Record<string, unknown>;
  message?: string;
  taskType?: string;
  targetCluster?: string;
  outputsRetrieved?: boolean;
  filesOnHost?: string[];
  sessionId?: string;
}

interface AntiRetardResult {
  blocked: boolean;
  reason?: string;
  correction?: string;
}

interface TheatricalResult {
  allowed: boolean;
  blockedBy?: string;
  reason?: string;
  layer?: string;
}

// V10 Theatrical Firewall singleton
const intentClassifier = new IntentClassifier();
const evidenceGate = new EvidenceGate(process.env.KRAKEN_WORKSPACE || process.cwd());
const layerEngine = new LayerEngine(evidenceGate);

// Hive base paths for context injection
const HIVE_BASE_PATHS = [
  process.env.HIVE_MIND_PATH || '',
  '/root/.local/share/opencode/hive-mind',
  '/home/leviathan/.local/share/opencode/hive-mind',
].filter(Boolean);

function injectHiveContext(
  layer: string,
  reason: string,
  sessionId: string,
  agentName: string,
  confidence: number,
): string | undefined {
  try {
    const categories = extractCategoriesFromReason(reason);
    if (categories.length === 0) return undefined;

    const block: BlockContext = {
      layer,
      category: categories[0],
      confidence,
      reason,
      sessionId,
      agentName,
    };

    const injection = bridgeFirewallToHive(block, HIVE_BASE_PATHS);
    return injection.synthesizedCorrection;
  } catch {
    return undefined;
  }
}

function checkAntiRetard(ctx: FirewallContext): AntiRetardResult {
  const { toolName, toolArgs, sessionId } = ctx;
  const task = (toolArgs.task || toolArgs.command || toolArgs.description || '') as string;

  const result = checkAntiRetardPattern(toolName, task, ctx.taskType, sessionId || 'default');
  if (result.blocked) {
    return { blocked: true, reason: result.reason, correction: result.correction };
  }

  recordActionResult(toolName, 'attempted');
  return { blocked: false };
}

function checkTheatricalFirewall(ctx: FirewallContext): TheatricalResult {
  const tool = ctx.toolName || '';
  const args = ctx.toolArgs || {};
  // Include description for full context — not just command/content
  const command = (args.command || args.task || args.content || args.description || '') as string;

  const fwCtx = {
    agent: ctx.agentName || 'kraken',
    sessionId: ctx.sessionId || '',
    tool,
    operationType: intentClassifier.classifyIntent(command, tool, args),
    command: command || null,
    commandTokens: command ? command.split(/\s+/) : [],
    hasPipe: command.includes('|'),
    pipeChain: command ? command.split('|').map(s => s.trim()) : [],
    args,
    fileTargets: [],
    gateTargets: { gate: '', action: '' },
    sessionState: { brainInitialized: true, evidencePath: null, currentGate: null },
  };

  const blocked = layerEngine.evaluate(fwCtx, DEFAULT_LAYERS, new Set());

  if (blocked) {
    return {
      allowed: false,
      blockedBy: blocked.layer,
      reason: `${blocked.reason} | ${blocked.correction || ''}`,
      layer: blocked.layer,
    };
  }

  return { allowed: true };
}

export function enforceFirewall(ctx: FirewallContext): FirewallResult {
  const {
    agentName = 'unknown', toolName, toolArgs,
    message = '', taskType, targetCluster,
    outputsRetrieved = false, filesOnHost = [],
    sessionId = 'default',
  } = ctx;

  const result: FirewallResult = {
    allowed: true,
    details: {},
    layerResults: {} as FirewallResult['layerResults'],
  };

  // ========== L0: IDENTITY WALL ==========
  const l0 = checkKrakenIdentityWall(agentName, toolName, toolArgs);
  result.layerResults.l0 = l0;
  if (!l0.allowed) {
    result.allowed = false;
    result.blockedBy = 'L0';
    result.reason = l0.reason;
    return result;
  }

  // ========== AR: ANTI-RETARD (MULTI-SIGNAL FUSION) ==========
  const antiRetard = checkAntiRetard(ctx);
  result.layerResults.antiRetard = antiRetard;
  if (antiRetard.blocked) {
    result.allowed = false;
    result.blockedBy = 'AR';
    result.reason = antiRetard.reason;

    const hiveInjection = injectHiveContext('AR', antiRetard.reason || '', sessionId, agentName, 0.9);
    if (hiveInjection) {
      result.reason = `${antiRetard.reason}\n${hiveInjection}`;
      result.hiveContextInjection = hiveInjection;
    }

    return result;
  }

  // ========== V10 THEATRICAL: L8 ANTI-BULLSHIT, L9 FEATURE OMISSION, L10 CONTAINER ENFORCEMENT ==========
  const theatrical = checkTheatricalFirewall(ctx);
  result.layerResults.theatrical = theatrical;
  if (!theatrical.allowed) {
    result.allowed = false;
    result.blockedBy = (theatrical.layer || 'L8') as FirewallLayer;
    result.reason = theatrical.reason;

    const hiveInjection = injectHiveContext(theatrical.layer || 'V10', theatrical.reason || '', sessionId, agentName, 0.85);
    if (hiveInjection) {
      result.reason = `${theatrical.reason}\n${hiveInjection}`;
      result.hiveContextInjection = hiveInjection;
    }

    return result;
  }

  // ========== L1: ORCHESTRATION THEATER (ALL tools, no gate) ==========
  const l1Text = message || (toolArgs.task as string) || (toolArgs.description as string) || '';
  const l1 = checkOrchestrationTheater(l1Text, toolArgs.status as string);
  result.layerResults.l1 = l1;
  if (!l1.passed) {
    result.allowed = false;
    result.blockedBy = 'L1';
    result.reason = l1.reason || 'Orchestration theater detected';

    const hiveInjection = injectHiveContext('L1', result.reason, sessionId, agentName, 0.8);
    if (hiveInjection) { result.reason += `\n${hiveInjection}`; result.hiveContextInjection = hiveInjection; }

    return result;
  }

  // ========== L2: FALSE COMPLETION (ALL tools, no gate) ==========
  const l2 = checkFalseCompletion(message, outputsRetrieved, filesOnHost);
  result.layerResults.l2 = l2;
  if (!l2.passed) {
    result.allowed = false;
    result.blockedBy = 'L2';
    result.reason = l2.reason || 'False completion detected';

    const hiveInjection = injectHiveContext('L2', result.reason, sessionId, agentName, 0.8);
    if (hiveInjection) { result.reason += `\n${hiveInjection}`; result.hiveContextInjection = hiveInjection; }

    return result;
  }

  // ========== L3: OUTPUT INSPECTION ==========
  if (filesOnHost.length > 0) {
    const l3 = checkOutputInspection(filesOnHost, message);
    result.layerResults.l3 = l3;
  }

  // ========== L4: WRONG CLUSTER (ALL tools, no spawn gate) ==========
  if (taskType && targetCluster) {
    const l4 = checkWrongCluster(message, taskType, targetCluster);
    result.layerResults.l4 = l4;
    if (!l4.valid) {
      result.allowed = false;
      result.blockedBy = 'L4';
      result.reason = l4.reason || 'Wrong cluster assignment';

      const hiveInjection = injectHiveContext('L4', result.reason, sessionId, agentName, 0.7);
      if (hiveInjection) { result.reason += `\n${hiveInjection}`; result.hiveContextInjection = hiveInjection; }

      return result;
    }
  }

  // ========== L5: MACRO DERAILMENT (NOW BLOCKS — no more warn-only) ==========
  if (message) {
    const l5 = checkMacroDerailment(message);
    result.layerResults.l5 = l5;
    if (!l5.passed) {
      // MILITARY GRADE: L5 now BLOCKS, not warns
      result.allowed = false;
      result.blockedBy = 'L5';
      result.reason = l5.reason || 'Macro derailment detected';

      const hiveInjection = injectHiveContext('L5', result.reason, sessionId, agentName, 0.7);
      if (hiveInjection) { result.reason += `\n${hiveInjection}`; result.hiveContextInjection = hiveInjection; }

      return result;
    }
  }

  // ========== L6: KRAKEN PROTECTION ==========
  const filePath = (toolArgs.filePath || toolArgs.path || toolArgs.target || '') as string;
  const command = (toolArgs.command || toolArgs.content || '') as string;
  if (filePath || command) {
    let operation: 'read' | 'write' | 'delete' = 'write';
    if (toolName === 'read' || toolName === 'grep' || toolName === 'glob') operation = 'read';
    if (toolName === 'bash') {
      const cmd = command as string;
      if (cmd.includes('rm ') || cmd.includes('delete')) operation = 'delete';
    }

    const l6a = checkKrakenProtection(filePath, operation);
    const l6b = checkProtectionPatterns(command);
    result.layerResults.l6 = l6a.allowed ? l6b : l6a;
    if (!result.layerResults.l6!.allowed) {
      result.allowed = false;
      result.blockedBy = 'L6';
      result.reason = result.layerResults.l6!.reason || 'Kraken protection violation';

      const hiveInjection = injectHiveContext('L6', result.reason, sessionId, agentName, 0.9);
      if (hiveInjection) { result.reason += `\n${hiveInjection}`; result.hiveContextInjection = hiveInjection; }

      return result;
    }
  }

  // ========== L7: COORDINATION GATES ==========
  // Only evaluate for spawn/report/execute tools where coordination matters
  const l7Relevant = toolName.includes('spawn') || toolName.includes('report') || toolName.includes('kraken_hive');
  const hasL7Data = (message && message.length > 0) || filesOnHost.length > 0;
  if (l7Relevant && (taskType || hasL7Data)) {
    try {
      const l7 = evaluateCoordinationGate('task-assignment', {
        taskDescription: message || (toolArgs.task as string),
        targetCluster,
        taskType,
        agentName,
        outputFiles: filesOnHost,
      });
      (result.layerResults as Record<string, unknown>).l7 = l7;
      if (!l7.passed) {
        result.allowed = false;
        result.blockedBy = 'L7';
        result.reason = `Coordination gate failed: ${l7.blockers.join(', ')}`;
        return result;
      }
    } catch {
      // L7 evaluation failed — don't block on evaluation error
    }
  }

  return result;
}

// Re-exports
export { checkKrakenIdentityWall, checkOrchestrationTheater, checkFalseCompletion,
         checkOutputInspection, checkWrongCluster, checkMacroDerailment,
         checkKrakenProtection, checkProtectionPatterns,
         checkAntiRetardPattern, recordActionResult };

export { DEFAULT_LAYERS, LayerEngine, IntentClassifier, EvidenceGate };
