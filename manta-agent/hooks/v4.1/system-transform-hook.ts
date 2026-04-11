/**
 * System Transform Hook — manta enforcement context injection
 * 
 * ONLY fires for manta agent sessions.
 */
import type { Hooks } from '@opencode-ai/plugin';
import { GateManager } from '../shared/gates.js';
import type { MantaCoordinator } from '../manta/coordinator.js';
import { isMantaAgent } from '../../shared/agent-identity';

export function createSystemTransformHook(
  gateManager: GateManager,
  coordinator?: MantaCoordinator
): Hooks['experimental.chat.system.transform'] {
  return async (input, output) => {
    // CRITICAL: Only inject context for manta agents
    const agentName = (input as any).agent ?? (output as any).agent;
    if (!isMantaAgent(agentName)) {
      return;  // Skip for non-manta agents
    }

    const state = gateManager.getState();
    const criteria = gateManager.getCriteria(state.currentGate as any);

    const enforcementContext = `
[MANT A ENFORCEMENT CONTEXT]
Current Gate: ${(state.currentGate as string).toUpperCase()}
Iteration: ${state.currentIteration}
Verify Attempts: ${state.verifyAttempts}/3

Blocking Criteria for ${state.currentGate}:
${criteria.blockingCriteria.map((c: string) => `  - ${c}`).join('\n')}

Evidence Required:
${criteria.evidenceRequired.map((e: string) => `  - ${e}`).join('\n')}
`.trim();

    const systemOutput = output as { system: string[]; agent?: string };
    if (Array.isArray(systemOutput.system)) {
      systemOutput.system.push(enforcementContext);

      // Inject brain context
      if (coordinator) {
        const currentBrain = coordinator.getCurrentBrain();
        const brainContext = `
[MANT A BRAIN CONTEXT]
Active Brain: ${currentBrain.toUpperCase()}
Brain switching is MECHANICAL — the Coordinator controls which brain is active.
Do NOT switch brains manually. Wait for Coordinator signals.
`.trim();
        systemOutput.system.push(brainContext);
      }
    }
  };
}
