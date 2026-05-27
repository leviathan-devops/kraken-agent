/**
 * Shark Agent v4.9 — Standalone Linear Execution Plugin
 *
 * Triple-Brain Parallel Architecture: Execution + Reasoning + System brains
 * running concurrently, synchronized only at workflow gates.
 *
 * NOT a swarm. NOT an orchestrator. Standalone linear execution agent.
 */
import type { Plugin, PluginInput, Hooks } from '@opencode-ai/plugin';
import * as path from 'node:path';
import { createStateStore } from './shared/state-store.js';
import { createSharkMessenger } from './shared/messenger.js';
import { Guardian } from './shared/guardian.js';
import { GateManager } from './shared/gates.js';
import { EvidenceCollector } from './shared/evidence.js';
import { createSharkHooks } from './hooks/v4.1/index.js';
import { createSharkStatusTool } from './tools/shark-status.js';
import { createSharkGateTool } from './tools/shark-gate.js';
import { createSharkEvidenceTool } from './tools/shark-evidence.js';
import { createCheckpointTool } from './tools/checkpoint.js';
import { createSharkTestRunnerTool } from './tools/shark-test-runner.js';
import { createFirewallStatusTool } from './tools/firewall-status.js';
import { createFirewallAuditTool } from './tools/firewall-audit-tool.js';
import { createSharkDiagnosticTool } from './tools/shark-diagnose.js';
import { createSharkSpawnContainerTool } from './tools/shark-spawn-container.js';
import { createSharkRunTridentTool } from './tools/shark-run-trident.js';
import { initializeTripleBrain } from './shark/brains/index.js';
import { getSharkIdentityPrompt, SHARK_PLUGIN_IDENTITY } from './shared/identity-loader.js';

const sharkColor = '#228B22';

export default async function SharkAgent(input: PluginInput): Promise<Hooks> {
  const { directory } = input;
  const workspacePath = process.cwd();

  const stateStore = createStateStore();
  const messenger = createSharkMessenger();
  const guardian = new Guardian({ level: 'SANDBOX' });
  const gm = new GateManager(path.join(workspacePath, '.shark'));
  const ec = new EvidenceCollector(path.join(workspacePath, '.shark'));

  // Initialize triple-brain parallel architecture
  const {
    executionBrain,
    reasoningBrain,
    systemBrain,
    concurrencyManager,
  } = initializeTripleBrain(workspacePath);

  // Load Shark identity
  const sharkIdentityPrompt = getSharkIdentityPrompt();

  // Linear hooks setup with identity injection
  const hooks = createSharkHooks(
    guardian,
    gm,
    ec,
    stateStore,
    messenger,
    sharkIdentityPrompt,
    SHARK_PLUGIN_IDENTITY
  );

  // Start triple-brain concurrency (200ms/200ms/500ms polling loops)
  concurrencyManager.startAll();

  return {
    ...hooks,

    tools: {
      'shark-status': createSharkStatusTool(stateStore, gm),
      'shark-gate': createSharkGateTool(gm, guardian),
      'shark-evidence': createSharkEvidenceTool(ec),
      'shark-test-runner': createSharkTestRunnerTool(),
      'checkpoint': createCheckpointTool(stateStore, gm),
      'firewall-status': createFirewallStatusTool(),
      'firewall-audit': createFirewallAuditTool(),
      'shark-diagnose': createSharkDiagnosticTool(),
      'shark-health': createSharkHealthCheckTool(),
      'shark-spawn-container': createSharkSpawnContainerTool(),
      'shark-run-trident': createSharkRunTridentTool(),
    },

    config: async (cfg: any) => {
      if (!cfg.agent) cfg.agent = {};
      Object.assign(cfg.agent, {
        'shark': {
          name: 'shark',
          description: 'SHARK v4.9 — Triple-Brain Parallel Architecture — Plan with Trident. Execute the plan. Never yield.',
          mode: 'primary',
          permission: { task: 'allow', tool: 'allow' },
          color: sharkColor,
          tools: {
            'shark-status': true,
            'shark-gate': true,
            'shark-evidence': true,
            'shark-test-runner': true,
            'checkpoint': true,
            'firewall-status': true,
            'firewall-audit': true,
            'shark-diagnose': true,
            'shark-health': true,
            'shark-spawn-container': true,
            'shark-run-trident': true,
          },
        },
      });
    },
  };
}