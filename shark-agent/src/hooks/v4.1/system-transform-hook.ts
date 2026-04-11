/**
 * System Transform Hook — shark enforcement context injection
 * 
 * ONLY fires for shark agent sessions.
 * FIXED: Only inject context on gate TRANSITIONS, not every message.
 */
import type { Hooks } from '@opencode-ai/plugin';
import { GateManager } from '../shared/gates.js';
import type { SharkPeerDispatch } from '../shark/macro/peer-dispatch.js';
import { isSharkAgent } from '../../shared/agent-identity.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

const CONTAINER_TEST_RESULT_FILE = 'ContainerTestResult.json';

let lastInjectedGate: string | null = null;

export function resetSystemTransformState(): void {
  lastInjectedGate = null;
}

export function createSystemTransformHook(
  gateManager: GateManager,
  peerDispatch?: SharkPeerDispatch
): Hooks['experimental.chat.system.transform'] {
  return async (input, output) => {
    const agentName = (input as any).agent ?? (output as any).agent;
    if (!isSharkAgent(agentName)) {
      return;
    }

    const state = gateManager.getState();
    const systemOutput = output as { system: string[]; agent?: string };
    if (!Array.isArray(systemOutput.system)) return;

    // ONLY inject on gate transition, not every message
    if (state.currentGate !== lastInjectedGate) {
      lastInjectedGate = state.currentGate;
      
      const criteria = gateManager.getCriteria(state.currentGate as any);
      
      const enforcementContext = `
[SHARK ENFORCEMENT CONTEXT]
Gate: ${(state.currentGate as string).toUpperCase()}
Iteration: ${state.currentIteration}
Blocking Criteria:
${criteria.blockingCriteria.map((c: string) => `  - ${c}`).join('\n')}
Evidence Required:
${criteria.evidenceRequired.map((e: string) => `  - ${e}`).join('\n')}
`.trim();

      systemOutput.system.push(enforcementContext);

      // MECHANICAL ENFORCEMENT: Delivery gate requires container tests
      if (state.currentGate === 'delivery') {
        const testEvidencePath = path.join(process.cwd(), '.shark', 'evidence', 'delivery', CONTAINER_TEST_RESULT_FILE);
        let testStatus = 'NOT_RUN';
        let testPassed = false;
        
        if (fs.existsSync(testEvidencePath)) {
          try {
            const testResult = JSON.parse(fs.readFileSync(testEvidencePath, 'utf-8'));
            testStatus = testResult.overallPassed ? 'PASSED' : 'FAILED';
            testPassed = testResult.overallPassed;
          } catch {
            testStatus = 'ERROR_READING';
          }
        }

        const deliveryWarning = `
[SHARK DELIVERY GATE WARNING]
Container tests are MANDATORY for delivery. You CANNOT ship, commit, release, or deploy without passing container tests.
Current Container Test Status: ${testStatus}
REQUIRED ACTION:
  1. Run: shark-test-runner action=run
  2. Wait for all tests to pass
  3. DO NOT attempt any delivery actions until tests pass
`.trim();

        systemOutput.system.push(deliveryWarning);
        
        if (!testPassed && testStatus !== 'NOT_RUN') {
          systemOutput.system.push(`[SHARK HARD BLOCK] Tests FAILED. You MUST fix the failing tests before delivery.`);
        } else if (testStatus === 'NOT_RUN') {
          systemOutput.system.push(`[SHARK HARD BLOCK] No container test evidence found. You MUST run: shark-test-runner action=run`);
        }
      }
    }

    // Inject brain context once at start
    if (peerDispatch && state.currentGate === 'plan' && state.currentIteration === 'V1.0') {
      const pState = peerDispatch.getState();
      const brainContext = `
[SHARK BRAIN CONTEXT]
Active Brains: ${pState.activeBrains.join(', ')}
Primary Brain: ${pState.primaryBrain}
Brain coordination is MECHANICAL.
`.trim();
      systemOutput.system.push(brainContext);
    }
  };
}