/**
 * System Transform Hook — shark enforcement context injection
 *
 * v4.9: Uses agentFilter: null (hook input has no agent field).
 * identityLoader from src/shared/identity-loader.ts.
 * Only injects on first transform, not every message.
 */
import type { Hooks } from '@opencode-ai/plugin';
import { GateManager } from '../shared/gates.js';
import { SHARK_PLUGIN_IDENTITY, getSharkIdentityPrompt } from '../../shared/identity-loader.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

const CONTAINER_TEST_RESULT_FILE = 'ContainerTestResult.json';

let identityInjected = false;
let buildContextInjected = false;

export function resetSystemTransformState(): void {
  identityInjected = false;
  buildContextInjected = false;
}

export function createSystemTransformHook(
  gateManager: GateManager,
  _peerDispatch?: unknown
): Hooks['experimental.chat.system.transform'] {
  return async (input, output, ctx) => {
    const agent = (ctx?.agentName || input?.sessionID || '').split('-')[0] || '';
    const isSharkAgent = SHARK_PLUGIN_IDENTITY.sharkAgents.has(agent) || agent.startsWith('shark');

    if (!isSharkAgent) {
      return;
    }

    const state = gateManager.getState();
    const systemOutput = output as { system?: string[] };
    if (!Array.isArray(systemOutput.system)) return;

    // v4.9 IDENTITY INJECTION (first on first transform only)
    if (!identityInjected) {
      identityInjected = true;
      const identity = getSharkIdentityPrompt();
      if (identity) {
        systemOutput.system.unshift(identity);
      }
    }

    // BUILD CONTEXT INJECTION (on first transform after compaction)
    if (!buildContextInjected) {
      buildContextInjected = true;
      const buildContext = loadBuildContext();
      if (buildContext) {
        systemOutput.system.unshift(buildContext);
      }
    }

    // GATE ENFORCEMENT CONTEXT (only on gate transitions)
    const enforcementContext = `
[SHARK ENFORCEMENT CONTEXT]
Gate: ${state.currentGate?.toUpperCase() || 'PLAN'}
Iteration: ${state.currentIteration || 'V1.0'}
Brain Status: Triple-Brain Parallel (Execution + Reasoning + System)
Workflow: PLAN → BUILD → TEST (Trident) → VERIFY (Container)
Mantra: Plan with Trident. Execute the plan. Review with Trident. Test in sandbox. Persist everything. Never yield.
`.trim();

    systemOutput.system.push(enforcementContext);

    // DELIVERY GATE: Container tests mandatory
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
[SHARK DELIVERY GATE — CONTAINER TESTS MANDATORY]
Current Status: ${testStatus}
REQUIRED ACTION:
  1. Run: shark-test-runner action=run
  2. Wait for all tests to pass (96%+ required)
  3. DO NOT attempt delivery until tests pass
`.trim();

      systemOutput.system.push(deliveryWarning);

      if (!testPassed && testStatus !== 'NOT_RUN') {
        systemOutput.system.push('[SHARK HARD BLOCK] Tests FAILED. Fix before delivery.');
      } else if (testStatus === 'NOT_RUN') {
        systemOutput.system.push('[SHARK HARD BLOCK] No container test evidence. Run: shark-test-runner action=run');
      }
    }
  };
}

function loadBuildContext(): string | null {
  try {
    const primaryPath = path.join(process.cwd(), '.shark', 'auto-inject', 'BUILD_CONTEXT.md');
    if (fs.existsSync(primaryPath)) {
      return fs.readFileSync(primaryPath, 'utf-8');
    }
    const legacyPath = path.join(process.cwd(), '.shark', 'build-context.md');
    if (fs.existsSync(legacyPath)) {
      return fs.readFileSync(legacyPath, 'utf-8');
    }
  } catch {
    // Silent fail
  }
  return null;
}