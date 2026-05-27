/**
 * Session Compacting Hook — inject build context on compaction
 * 
 * CRITICAL: Only fires for shark agents.
 * AUTO-INJECT: Writes context file for next session to read.
 * 
 * Context file location: .shark/build-context.md
 */

import type { Hooks } from '@opencode-ai/plugin';
import { GateManager } from '../../shared/gates.js';
import { isSharkAgent } from '../../shared/agent-identity.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

const BUILD_CONTEXT_FILE = 'build-context.md';

function generateBuildContext(gateManager: GateManager): string {
  const currentGate = gateManager.getCurrentGate();
  const iteration = gateManager.getCurrentIteration();
  const gateState = gateManager.getState();

  return `# SHARK AGENT v4.8.3 BUILD CONTEXT

## STATUS: ${currentGate.toUpperCase()}

### Current State
- Gate: ${currentGate}
- Iteration: ${iteration}
- Verify Attempts: ${gateState.verifyAttempts}/3

### Gate Status
${Object.entries(gateState.gateStatus as Record<string, string>).map(([gate, status]) => `- ${gate}: ${status}`).join('\n')}

---
Generated: ${new Date().toISOString()}
`.trim();
}

function getStatusSummary(): string {
  return `Gate: ${'unknown'} | Built: ${new Date().toISOString().split('T')[0]}`;
}

export function createCompactingHook(
  gateManager: GateManager
): Hooks['experimental.session.compacting'] {
  return async (input) => {
    const sessionId = input.sessionID;
    const agentName = (input as any).agent;

    if (!sessionId) return;
    if (!isSharkAgent(agentName)) return;

    // Write build context file for next session to read
    try {
      const sharkDir = path.join(process.cwd(), '.shark');
      const autoInjectDir = path.join(sharkDir, 'auto-inject');

      // Ensure directories exist
      if (!fs.existsSync(sharkDir)) {
        fs.mkdirSync(sharkDir, { recursive: true });
      }
      if (!fs.existsSync(autoInjectDir)) {
        fs.mkdirSync(autoInjectDir, { recursive: true });
      }

      const context = generateBuildContext(gateManager);

      // Write to PRIMARY location (for manual copy/paste reinject)
      const primaryPath = path.join(autoInjectDir, 'BUILD_CONTEXT.md');
      fs.writeFileSync(primaryPath, context, 'utf-8');

      // Write legacy location (for auto-inject system)
      const legacyPath = path.join(sharkDir, BUILD_CONTEXT_FILE);
      fs.writeFileSync(legacyPath, context, 'utf-8');

      // Also write a compact "reminder" for faster loading
      const reminderPath = path.join(sharkDir, 'build-reminder.txt');
      fs.writeFileSync(reminderPath, `Status: ${gateManager.getCurrentGate()} | Iteration: ${gateManager.getCurrentIteration()}`, 'utf-8');

    } catch (err) {
      // Silent fail - don't disrupt compaction
    }
  };
}