/**
 * Manta Agent — Standalone Plugin
 * 
 * Dual-brain sequential (Plan ↔ Build) with mechanical coordinator.
 * Isolated state: manta-state domain.
 */
import type { Plugin, PluginInput, Hooks } from '@opencode-ai/plugin';
import * as path from 'node:path';
import { createStateStore } from './shared/state-store.js';
import { createMantaMessenger } from './shared/messenger.js';
import { Guardian } from './shared/guardian.js';
import { GateManager } from './shared/gates.js';
import { EvidenceCollector } from './shared/evidence.js';
import { MantaCoordinator } from './manta/coordinator.js';
import { PLAN_BRAIN_T1, BUILD_BRAIN_T1, COORDINATOR_T1 } from './manta/brains.js';
import { createSharkStatusTool } from './tools/shark-status.js';
import { createSharkGateTool } from './tools/shark-gate.js';
import { createSharkEvidenceTool } from './tools/shark-evidence.js';
import { createCheckpointTool } from './tools/checkpoint.js';
import { createSharkHooks } from './hooks/v4.1/index.js';

// Lighter Midnight Purple — #6B4C9A
const mantaColor = '#6B4C9A';

export default async function MantaAgent(input: PluginInput): Promise<Hooks> {
  const { directory } = input;
  const workspacePath = process.cwd();

  // ISOLATED instances — NOT shared with any other plugin
  const stateStore = createStateStore();
  const messenger = createMantaMessenger();
  const guardian = new Guardian({ level: 'SANDBOX' });
  const gm = new GateManager(path.join(workspacePath, '.manta'));
  const ec = new EvidenceCollector(path.join(workspacePath, '.manta'));

  // Manta-specific coordinator
  const coordinator = new MantaCoordinator({
    stateStore,
    messenger,
    gateManager: gm,
  });

  // Tools
  const statusTool = createSharkStatusTool(stateStore, gm);
  const gateTool = createSharkGateTool(gm, guardian);
  const evidenceTool = createSharkEvidenceTool(ec);
  const checkpointTool = createCheckpointTool(stateStore, gm);

  // Hooks with manta coordinator and session cleanup
  const hooks = createSharkHooks(guardian, gm, ec, coordinator, stateStore, messenger);

  return {
    ...hooks,

    tool: {
      'manta-status': statusTool,
      'manta-gate': gateTool,
      'manta-evidence': evidenceTool,
      'checkpoint': checkpointTool,
    },

    config: async (cfg: any) => {
      if (!cfg.agent) cfg.agent = {};
      Object.assign(cfg.agent, {
        'manta': {
          name: 'manta',
          description: 'MANTA — Dual-brain sequential (Plan ↔ Build) with mechanical coordinator',
          instructions: `${PLAN_BRAIN_T1}\n\n${COORDINATOR_T1}`,
          mode: 'primary',
          permission: { task: 'allow' },
          color: mantaColor,
          tools: {
            'manta-status': true,
            'manta-gate': true,
            'manta-evidence': true,
            'checkpoint': true,
          },
        },
      });
    },
  };
}
