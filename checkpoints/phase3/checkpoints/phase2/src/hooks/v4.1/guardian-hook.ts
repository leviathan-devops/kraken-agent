/**
 * Guardian Hook — tool.execute.before integration
 * 
 * V4.8.4: Contextual Firewall with Agent Isolation
 * Blocks dangerous tools for Shark agents only, fails open for others.
 */

import type { Hooks } from '@opencode-ai/plugin';
import { Guardian } from '../../shared/guardian.js';
import { extractCommandFromArgs } from './utils.js';
import { getCurrentAgent, setCurrentAgent } from './agent-state.js';
import { CROSS_AGENT_TOOLS, CONTEXTUAL_FIREWALL_RULES, type Gate } from '../../shared/firewall-patterns.js';

import * as path from 'node:path';
import { IntentClassifier } from '../firewall/intent-classifier.js';
import { buildContext } from '../firewall/firewall-context.js';
import { LayerEngine } from '../firewall/layer-engine.js';
import { EvidenceGate } from '../firewall/evidence-gate.js';
import { FirewallAudit } from '../firewall/firewall-audit.js';
import { createBlockResponse, StructuredBlockError } from '../firewall/block-response.js';
import { DEFAULT_LAYERS } from '../firewall/layers/index.js';

const DANGEROUS_TOOLS = new Set([
  'terminal', 'mcp_terminal', 'bash', 'mcp_bash',
  'write_file', 'mcp_write_file',
  'patch', 'mcp_patch',
  'edit', 'mcp_edit',
  'delete_file', 'mcp_delete_file'
]);

const THEATRICAL_PATTERNS = [
  /\|.*wc\s+-l/i, /wc\s+-l.*\|/i, /cat.*\|.*wc/i, /grep.*\|.*wc/i,
  /\|.*tee/i, /\|.*>.*\./i, /wc\s+-l.*dist\//i, /wc\s+-l.*src\//i,
  /wc\s+-l.*build\//i, /grep.*setCurrentAgent.*src/i,
  /grep.*isSharkAgent.*src/i, /grep.*guardian.*src/i,
];

const LEGITIMATE_PATTERNS = [
  /mkdir\s+-p/i, /cp\s+-r/i, /mv\s+/i, /cat\s+[^\|>]+$/i,
  /head\s+-[0-9]+\s+/i, /tail\s+-[0-9]+\s+/i,
  /grep\s+-[rEn]+.*[^\|]$/i, /find\s+.*-name/i, /test\s+-d/i, /test\s+-x/i,
];

const FAKE_TEST_PATTERNS = [
  /node\s+run-tests?\.js/i, /node\s+verify.*\.mjs/i,
  /npm\s+(run\s+)?test/i, /yarn\s+(run\s+)?test/i,
  /jest/i, /vitest/i, /mocha/i, /jasmine/i,
  /bun\s+test/i, /pytest/i, /python.*-m.*pytest/i,
  /go\s+test/i, /cargo\s+test/i, /ruby\s+-Itest/i, /rspec/i,
];

const SOURCE_INSPECTION_PATTERNS = [
  /^\s*(echo|cat|printf).*>.*src\//i,
  /^\s*sed\s+-i.*src\//i,
  /^\s*tee\s+.*src\//i,
  />\s*.*src\//i,
  /&\s*>>\s*.*src\//i,
];

const WRONG_CONTAINER_PATTERNS = [
  /opencode\s+container\s+(run|start|exec)/i, /opencode\s+run\s+/i,
];

// v4.8.4 Firewall lazy singletons
let _classifier: IntentClassifier | null = null;
let _layerEngine: LayerEngine | null = null;
let _auditLogger: FirewallAudit | null = null;

function getClassifier(): IntentClassifier { if (!_classifier) _classifier = new IntentClassifier(); return _classifier; }
function getLayerEngine(): LayerEngine { if (!_layerEngine) _layerEngine = new LayerEngine(new EvidenceGate(process.cwd())); return _layerEngine; }
function getAuditLogger(): FirewallAudit { if (!_auditLogger) _auditLogger = new FirewallAudit(process.cwd()); return _auditLogger; }

// Helper functions
function checkCrossAgentTools(tool: string): void {
  if (CROSS_AGENT_TOOLS.has(tool)) {
    throw new Error(`[L5.7 BLOCKED] Tool ${tool} is restricted to administrative agents.`);
  }
}

function checkSourceInspection(command: string): void {
  for (const pattern of SOURCE_INSPECTION_PATTERNS) {
    if (pattern.test(command)) {
      throw new Error(`[GUARDIAN] SOURCE_INSPECTION_BLOCKED: ${command}`);
    }
  }
}

function checkWrongContainer(command: string): void {
  for (const pattern of WRONG_CONTAINER_PATTERNS) {
    if (pattern.test(command)) {
      throw new Error(`[GUARDIAN] WRONG_CONTAINER_COMMAND_BLOCKED: ${command}`);
    }
  }
}

function evaluateContextualRule(command: string | null, currentGate: Gate): void {
  if (!command) return;
  for (const rule of CONTEXTUAL_FIREWALL_RULES) {
    if (rule.pattern.test(command)) {
      if (rule.forbiddenIn.includes(currentGate)) {
        throw new Error(`[C-FIREWALL ${rule.label}] This action is forbidden during the ${currentGate} phase. ${rule.description}`);
      }
      if (rule.allowedIn.includes(currentGate)) continue;
      const highStakesGates: Gate[] = ['verify', 'audit', 'delivery'];
      if (highStakesGates.includes(currentGate)) {
        throw new Error(`[C-FIREWALL ${rule.label}] Ambiguous action blocked during high-stakes phase: ${currentGate}. ${rule.description}`);
      }
    }
  }
}

export function createGuardianHook(guardian: Guardian, gateManager: GateManager): Hooks['tool.execute.before'] {
  return async (input, output) => {
    const { tool, sessionID } = input as { tool: string; sessionID?: string; callID?: string };
    const args = (output as { args?: Record<string, unknown> })?.args ?? (input as any)?.args;
    const command = extractCommandFromArgs(args);

    const sessionAgent = getCurrentAgent(sessionID);
    if (!sessionAgent) return;
    if (!sessionAgent) return;

    const isShark = sessionAgent === 'shark' || sessionAgent?.startsWith('shark_');
    const currentAgent = sessionAgent;
    const currentGate = gateManager.getCurrentGate() as Gate;

    // 1. Contextual Firewall (L1-L4) - only for Shark
    if (isShark) {
      evaluateContextualRule(command, currentGate);
    }

    // 2. L5.7: Cross-agent tool blocking - for all agents
    checkCrossAgentTools(tool);

    // L0 REMOVED: Shark is a software engineering juggernaut — no device-based execution restrictions

    // L2: Fake Test Runner - only for Shark agents
    if (isShark && command) {
      for (const pattern of FAKE_TEST_PATTERNS) {
        if (pattern.test(command)) {
          throw new Error(`[FIREWALL L2] npm test / run test / exec test bypass`);
        }
      }
    }

    // For Shark agents: additional checks
    if (isShark) {
      // Dangerous command blocking
      if (command && guardian.isDangerousCommand(command)) {
        throw new Error(`[GUARDIAN] DANGEROUS_COMMAND_BLOCKED: ${command}`);
      }

      // Zone-based write protection
      if ((tool.includes('write_file') || tool.includes('patch')) && args) {
        const a = args as Record<string, unknown>;
        const writePath = (a.path as string) || null;
        if (writePath && !guardian.canWrite(writePath, currentGate)) {
          throw new Error(`[GUARDIAN] ZONE_VIOLATION: ${guardian.classifyZone(writePath)} zone — ${writePath} is forbidden during ${currentGate} phase.`);
        }
        if (writePath) guardian.registerCreate(writePath);
      }

      // Source file edit protection
      if ((tool === 'edit' || tool === 'mcp_edit') && args) {
        const ea = args as { filePath?: string };
        if (ea?.filePath) {
          if (!guardian.canEdit(ea.filePath, currentGate)) throw new Error(`[GUARDIAN] Edit blocked: ${ea.filePath} is forbidden during ${currentGate} phase.`);
          guardian.registerEdit(ea.filePath);
        }
      }

      // Source file modify check
      if (command) {
        const mc = guardian.canModifyFile(command);
        if (!mc.allowed) throw new Error(`[GUARDIAN] SOURCE_FILE_MODIFY_BLOCKED: ${mc.filePath}`);
      }

      checkSourceInspection(command);
      checkWrongContainer(command);
    }

    // v4.8.4 Firewall Layer Engine - only for Shark
    if (isShark && (command || (args && Object.keys(args).length > 0))) {
      try {
        const classifier = getClassifier();
        const layerEngine = getLayerEngine();
        const auditLogger = getAuditLogger();

        const fwCtx = buildContext(
          { tool, args: args || {} },
          { args: args || {} },
          classifier,
          { brainInitialized: !!currentAgent, evidencePath: path.join(process.cwd(), '.shark', 'evidence'), currentGate: null },
          sessionID || '',
          currentAgent || 'shark',
        );

        const blockResult = layerEngine.evaluate(fwCtx, DEFAULT_LAYERS);
        if (blockResult) {
          auditLogger.log({
            timestamp: new Date().toISOString(), agent: currentAgent || 'shark', tool,
            operationType: fwCtx.operationType, layer: blockResult.layer, reason: blockResult.reason,
            command: command || null, correction: blockResult.correction, sessionId: sessionID || '',
          });
          throw createBlockResponse(blockResult);
        }
      } catch (err) {
        if (err instanceof StructuredBlockError) throw err;
        // Silently absorb firewall engine errors
      }
    }
  };
}