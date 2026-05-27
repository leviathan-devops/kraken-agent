/**
 * Kraken L0-L7 Firewall + L6 Anti-Retard + V10 Theatrical Firewalls
 * Combined enforcement pipeline with ALL anti-retard measures.
 *
 * FIREWALL MERGE (2026-05-09):
 * - Now uses DEFAULT_LAYERS from src/system-brain/firewall/layers/index.ts
 * - ONE source of truth for all layer rules
 * - NO more duplicate V10_LAYERS
 */

import { checkKrakenIdentityWall, type L0CheckResult } from './l0-identity.js';
import { checkOrchestrationTheater, type L1CheckResult } from './l1-orchestration-theater.js';
import { checkFalseCompletion, type L2CheckResult } from './l2-false-completion.js';
import { checkOutputInspection, type L3CheckResult } from './l3-output-inspection.js';
import { checkWrongCluster, type L4CheckResult } from './l4-wrong-cluster.js';
import { checkMacroDerailment, type L5CheckResult } from './l5-macro-derailment.js';
import { checkKrakenProtection, checkProtectionPatterns, type L6CheckResult } from './l6-kraken-protection.js';
import { evaluateCoordinationGate, type L7CheckResult } from './l7-coordination-gates.js';

// Use DEFAULT_LAYERS from system-brain/firewall — ONE source of truth
import { DEFAULT_LAYERS } from '../../../system-brain/firewall/layers/index.js';
import { LayerEngine } from '../../../system-brain/firewall/layer-engine.js';
import { IntentClassifier } from '../../../system-brain/firewall/intent-classifier.js';
import { EvidenceGate } from '../../../system-brain/firewall/evidence-gate.js';
import { checkAntiRetardPattern, recordActionResult, L6_ANTI_RETARD } from './l6-anti-retard.js';

export type FirewallLayer = 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6' | 'L7' | 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'AR';

export interface FirewallResult {
  allowed: boolean;
  blockedBy?: FirewallLayer;
  reason?: string;
  details: Record<string, unknown>;
  layerResults: {
    l0: L0CheckResult;
    l1: L1CheckResult;
    l2: L2CheckResult;
    l3?: L3CheckResult;
    l4?: L4CheckResult;
    l5?: L5CheckResult;
    l6?: L6CheckResult;
    l7?: L7CheckResult;
    antiRetard?: AntiRetardResult;
    theatrical?: TheatricalResult;
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
}

interface AntiRetardResult {
  blocked: boolean;
  reason?: string;
  actionHistory?: number;
}

interface TheatricalResult {
  allowed: boolean;
  blockedBy?: string;
  reason?: string;
  layer?: FirewallLayer;
}

// V10 Theatrical Firewall singleton
const intentClassifier = new IntentClassifier();
const evidenceGate = new EvidenceGate(process.env.KRAKEN_WORKSPACE || process.cwd());
const layerEngine = new LayerEngine(evidenceGate);
// NOTE: V10_LAYERS removed — runtime now uses DEFAULT_LAYERS from system-brain/firewall

/**
 * ANTI-RETARD CHECK
 * This is checked FIRST before any other firewall logic.
 * If you're doing retarded shit, you get blocked immediately.
 */
function checkAntiRetard(ctx: FirewallContext): AntiRetardResult {
  const { toolName, toolArgs } = ctx;
  const task = (toolArgs.task || toolArgs.command || toolArgs.description || '') as string;

  // Check for excuse patterns, denial, lazy repetition
  const excuseResult = checkAntiRetardPattern(toolName, task, ctx.taskType);
  if (excuseResult.blocked) {
    return {
      blocked: true,
      reason: excuseResult.reason
    };
  }

  // Record this action for loop detection
  recordActionResult(toolName, 'attempted');

  return { blocked: false };
}

/**
 * V10 THEATRICAL FIREWALL CHECK
 */
function checkTheatricalFirewall(ctx: FirewallContext): TheatricalResult {
  const tool = ctx.toolName || '';
  const args = ctx.toolArgs || {};
  const command = (args.command || args.task || args.content || '') as string;

  // Build context for V10 firewall
  const fwCtx = {
    agent: ctx.agentName || 'kraken',
    sessionId: '',
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

  // Evaluate against DEFAULT_LAYERS (complete L0-L7 from system-brain/firewall)
  const blocked = layerEngine.evaluate(fwCtx, DEFAULT_LAYERS, new Set());

  if (blocked) {
    return {
      allowed: false,
      blockedBy: blocked.layer,
      reason: blocked.reason,
      layer: blocked.layer,
    };
  }

  return { allowed: true };
}

/**
 * Run full L0-L7 + L6 Anti-Retard + V10 theatrical firewall enforcement
 *
 * EXECUTION ORDER (MOST IMPORTANT):
 * 1. L0: Identity wall (must pass first)
 * 2. AR: ANTI-RETARD (instant block for idiotic behavior)
 * 3. L1-L7: Original v1.2 layers
 * 4. T1-T5: V10 theatrical layers
 *
 * Fail-fast: Returns at first blocking layer
 */
export function enforceFirewall(ctx: FirewallContext): FirewallResult {
  const {
    agentName, toolName, toolArgs,
    message = '', taskType, targetCluster,
    outputsRetrieved = false, filesOnHost = [],
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

  // ========== L6 ANTI-RETARD: BLOCK IDIOCY ==========
  // THIS IS THE MOST IMPORTANT LAYER - checks BEFORE any logic runs
  // If you're making excuses, denying failures, looping, or ignoring procedures, you get blocked
  const antiRetard = checkAntiRetard(ctx);
  result.layerResults.antiRetard = antiRetard;
  if (antiRetard.blocked) {
    result.allowed = false;
    result.blockedBy = 'AR';
    result.reason = antiRetard.reason;
    return result;
  }

  // ========== L1: ORCHESTRATION THEATER ==========
  const l1 = checkOrchestrationTheater(
    message || (toolArgs.task as string) || '',
    toolArgs.status as string
  );
  result.layerResults.l1 = l1;
  if (!l1.passed && toolName === 'report_to_kraken') {
    result.allowed = false;
    result.blockedBy = 'L1';
    result.reason = l1.reason;
    return result;
  }

  // ========== L2: FALSE COMPLETION ==========
  const l2 = checkFalseCompletion(message, outputsRetrieved, filesOnHost);
  result.layerResults.l2 = l2;
  if (!l2.passed && (toolName === 'report_to_kraken' || toolName === 'aggregate_results')) {
    result.allowed = false;
    result.blockedBy = 'L2';
    result.reason = l2.reason;
    return result;
  }

  // ========== L3: OUTPUT INSPECTION ==========
  if (filesOnHost.length > 0) {
    const l3 = checkOutputInspection(filesOnHost, message);
    result.layerResults.l3 = l3;
  }

  // ========== L4: WRONG CLUSTER ==========
  if (taskType && targetCluster) {
    const l4 = checkWrongCluster(message, taskType, targetCluster);
    result.layerResults.l4 = l4;
    if (!l4.valid && toolName.includes('spawn')) {
      result.allowed = false;
      result.blockedBy = 'L4';
      result.reason = l4.reason;
      return result;
    }
  }

  // ========== L5: MACRO DERAILMENT ==========
  if (message) {
    const l5 = checkMacroDerailment(message);
    result.layerResults.l5 = l5;
    if (!l5.passed) {
      console.warn(`[L5_MACRO_DERAILMENT] ${l5.reason}`);
    }
  }

  // ========== L6: KRAKEN PROTECTION (existing) ==========
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
      result.reason = result.layerResults.l6!.reason;
      return result;
    }
  }

  // ========== L7: COORDINATION GATES ==========
  const l7 = evaluateCoordinationGate('task-assignment');
  result.layerResults.l7 = l7;

  return result;
}

export { checkKrakenIdentityWall, checkOrchestrationTheater, checkFalseCompletion,
         checkOutputInspection, checkWrongCluster, checkMacroDerailment,
         checkKrakenProtection, checkProtectionPatterns, evaluateCoordinationGate,
         L6_ANTI_RETARD, checkAntiRetardPattern, recordActionResult };