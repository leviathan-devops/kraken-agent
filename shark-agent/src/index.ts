/**
 * Shark Agent — Standalone Plugin
 * 
 * Execution Brain with triple-brain coordination via PeerDispatch.
 * Isolated state: shark-state domain.
 */
import type { Plugin, PluginInput, Hooks } from '@opencode-ai/plugin';
import * as path from 'node:path';
import { createStateStore } from './shared/state-store.js';
import { createSharkMessenger } from './shared/messenger.js';
import { Guardian } from './shared/guardian.js';
import { GateManager } from './shared/gates.js';
import { EvidenceCollector } from './shared/evidence.js';
import { SharkPeerDispatch } from './shark/macro/peer-dispatch.js';
import { EXECUTION_BRAIN_T1 } from './shark/macro/brains.js';
import { createSharkStatusTool } from './tools/shark-status.js';
import { createSharkGateTool } from './tools/shark-gate.js';
import { createSharkEvidenceTool } from './tools/shark-evidence.js';
import { createCheckpointTool } from './tools/checkpoint.js';
import { createSharkTestRunnerTool } from './tools/shark-test-runner.js';
import { createSharkHooks } from './hooks/v4.1/index.js';

// Forest Green — #228B22
const sharkColor = '#228B22';

export default async function SharkAgent(input: PluginInput): Promise<Hooks> {
  const { directory } = input;
  const workspacePath = process.cwd();

  // ISOLATED instances — NOT shared with any other plugin
  const stateStore = createStateStore();
  const messenger = createSharkMessenger();
  const guardian = new Guardian({ level: 'SANDBOX' });
  const gm = new GateManager(path.join(workspacePath, '.shark'));
  const ec = new EvidenceCollector(path.join(workspacePath, '.shark'));

  // Shark-specific peer dispatch
  const peerDispatch = new SharkPeerDispatch({
    stateStore,
    messenger,
    gateManager: gm,
  });

  // Tools
  const statusTool = createSharkStatusTool(stateStore, gm);
  const gateTool = createSharkGateTool(gm, guardian);
  const evidenceTool = createSharkEvidenceTool(ec);
  const checkpointTool = createCheckpointTool(stateStore, gm);
  const testRunnerTool = createSharkTestRunnerTool();

  // Hooks with shark peer dispatch
  const hooks = createSharkHooks(guardian, gm, ec, peerDispatch, stateStore, messenger);

  return {
    ...hooks,

    tool: {
      'shark-status': statusTool,
      'shark-gate': gateTool,
      'shark-evidence': evidenceTool,
      'shark-test-runner': testRunnerTool,
      'checkpoint': checkpointTool,
    },

    config: async (cfg: any) => {
      if (!cfg.agent) cfg.agent = {};
      Object.assign(cfg.agent, {
        'shark': {
          name: 'shark',
          description: 'SHARK — Execution Brain with triple-brain coordination',
          instructions: `${EXECUTION_BRAIN_T1}`,
          mode: 'primary',
          permission: { task: 'allow' },
          color: sharkColor,
          tools: {
            'shark-status': true,
            'shark-gate': true,
            'shark-evidence': true,
            'shark-test-runner': true,
            'checkpoint': true,
          },
        },
      });
    },
  };
}
