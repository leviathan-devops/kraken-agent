/**
 * Gate + Evidence Hook — tool.execute.after integration
 * 
 * Collects evidence after tool execution and advances gates when criteria met.
 * Wires coordinator for brain switching on build complete.
 * 
 * MECHANICAL ENFORCEMENT: Delivery gate requires container test evidence.
 * Agent CANNOT skip tests - evidence of passing test run is mandatory.
 * 
 * CRITICAL: Only fires for shark agents.
 * OPTIMIZED: No console logs, cached stringify, minimal allocations.
 */

import type { Hooks } from '@opencode-ai/plugin';
import { GateManager } from '../../shared/gates.js';
import { EvidenceCollector, type GateEvidence, type GateName } from '../../shared/evidence.js';
import { extractCommandFromArgs } from './utils.js';
import type { SharkPeerDispatch } from '../../shark/macro/peer-dispatch.js';
import { isSharkAgent } from '../../shared/agent-identity.js';
import { getCurrentAgent } from './agent-state.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

const CONTAINER_TEST_RESULT_FILE = 'ContainerTestResult.json';

let lastDeliveryBlocked = false;

export function resetGateHookState(): void {
  lastDeliveryBlocked = false;
}

export function createGateHook(
  gateManager: GateManager,
  evidenceCollector: EvidenceCollector,
  peerDispatch?: SharkPeerDispatch
): Hooks['tool.execute.after'] {
  return async (input, output) => {
    const { tool, sessionID } = input;
    
    if (!isSharkAgent(getCurrentAgent())) {
      return;
    }
    
    const args = (input as { args: unknown }).args;
    const result = (output as { output: unknown }).output;
    const currentGate = gateManager.getCurrentGate();

    if (tool === 'shark-test-runner') {
      const testResult = parseTestRunnerResult(result);
      if (testResult) {
        const evidencePath = path.join(process.cwd(), '.shark', 'evidence', currentGate, CONTAINER_TEST_RESULT_FILE);
        try {
          fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
          fs.writeFileSync(evidencePath, JSON.stringify(testResult));
        } catch {
          // Silent fail
        }
        
        const gateEvidence: GateEvidence = {
          gate: currentGate,
          timestamp: Date.now(),
          passed: testResult.overallPassed,
          files: [evidencePath],
          metadata: {
            tool: 'shark-test-runner',
            sessionID,
            testSuite: testResult.suite,
            passedTests: testResult.passedTests,
            totalTests: testResult.totalTests,
            overallPassed: testResult.overallPassed,
          },
        };
        evidenceCollector.collectEvidence(gateEvidence);
      }
    }

    const evidence = buildEvidenceRecord(tool, args, result);
    if (evidence) {
      const gateEvidence: GateEvidence = {
        gate: currentGate,
        timestamp: Date.now(),
        passed: true,
        files: evidence.files || [],
        metadata: { tool, sessionID, workEvidence: evidence.workEvidence },
      };
      evidenceCollector.collectEvidence(gateEvidence);
    }

    if (currentGate === 'delivery' && !lastDeliveryBlocked) {
      const deliveryBlocked = checkDeliveryGateBlocked();
      lastDeliveryBlocked = deliveryBlocked;
      
      if (deliveryBlocked) {
        if (tool === 'terminal' || tool === 'bash') {
          const cmd = extractCommandFromArgs(args) || '';
          if (/git.*commit|ship|release|deploy|deliver/i.test(cmd)) {
            throw new Error(`[SHARK DELIVERY BLOCKED] You MUST run 'shark-test-runner' with action='run' before delivery.`);
          }
        }
      }
    }

    const shouldAdvance = checkGateAdvance(tool, args, result, currentGate);
    if (shouldAdvance && gateManager.canTransition(shouldAdvance)) {
      gateManager.passCurrentGate();
      gateManager.transitionTo(shouldAdvance);

      if (shouldAdvance === 'test' && currentGate === 'build' && peerDispatch) {
        peerDispatch.onBuildComplete();
      }
    }

    if (currentGate === 'verify') {
      const verifyResultStr = String(result || '');
      const verifyHasFailure = verifyResultStr.includes('"error"') || 
                               verifyResultStr.includes('"status":"error"') ||
                               verifyResultStr.includes('fail') || 
                               verifyResultStr.includes('FAIL');

      if (verifyHasFailure) {
        const verifyLoopResult = gateManager.handleVerifyFailure();
        const state = gateManager.getState() as { verifyAttempts: number };

        if (peerDispatch && state.verifyAttempts >= 3) {
          peerDispatch.onGateFailed('verify', state.verifyAttempts);
        }

        if (verifyLoopResult.action === 'escalate') {
          // Silent state transition - no console spam
        }
      }
    }
  };
}

function parseTestRunnerResult(result: unknown): { suite: string; overallPassed: boolean; passedTests: number; totalTests: number } | null {
  if (!result) return null;
  
  try {
    const parsed = typeof result === 'string' ? JSON.parse(result) : result;
    if (parsed && typeof parsed === 'object') {
      return {
        suite: parsed.suite || 'shark-e2e',
        overallPassed: parsed.overallPassed === true,
        passedTests: parsed.passedTests || 0,
        totalTests: parsed.totalTests || 0,
      };
    }
  } catch {
    // Fall through to null
  }
  
  return null;
}

function checkDeliveryGateBlocked(): boolean {
  const evidencePath = path.join(process.cwd(), '.shark', 'evidence', 'delivery', CONTAINER_TEST_RESULT_FILE);
  
  try {
    const content = fs.readFileSync(evidencePath, 'utf-8');
    const testResult = JSON.parse(content);
    return !testResult.overallPassed;
  } catch {
    return true;
  }
}

function buildEvidenceRecord(tool: string, args: unknown, result: unknown): { files: string[]; workEvidence: string } | null {
  if (!args) return null;
  const a = args as Record<string, unknown>;

  switch (tool) {
    case 'write_file':
    case 'mcp_write_file': {
      const filePath = a.path as string;
      return { files: filePath ? [filePath] : [], workEvidence: `wrote:${filePath}` };
    }
    case 'patch':
    case 'mcp_patch': {
      const filePath = a.path as string;
      return { files: filePath ? [filePath] : [], workEvidence: `patched:${filePath}` };
    }
    case 'terminal':
    case 'mcp_terminal': {
      const cmd = extractCommandFromArgs(args) || '';
      return { files: [], workEvidence: `ran:${cmd.slice(0, 100)}` };
    }
    default:
      return null;
  }
}

function checkGateAdvance(
  tool: string,
  args: unknown,
  result: unknown,
  currentGate: GateName
): GateName | null {
  const resultStr = String(result || '');
  const cmd = extractCommandFromArgs(args) || '';

  if (currentGate === 'build') {
    if (['write_file', 'mcp_write_file', 'patch', 'mcp_patch'].includes(tool)) {
      return 'test';
    }
  }

  if (currentGate === 'test') {
    if (/test.*(pass|success|ok)/i.test(resultStr) || /passed.*tests?/i.test(cmd)) {
      return 'verify';
    }
  }

  if (currentGate === 'audit') {
    if (/npm.*audit|yarn.*audit.*0.*vulnerab/i.test(resultStr) ||
        /sast|SAST.*clean|no.*issues/i.test(resultStr) ||
        /0.*critical|0.*high.*vulnerab/i.test(resultStr)) {
      return 'delivery';
    }
  }

  return null;
}