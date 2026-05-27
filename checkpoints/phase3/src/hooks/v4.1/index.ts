/**
 * Shark Hooks v4.9 — Triple-Brain Parallel Architecture
 */
import type { Hooks } from '@opencode-ai/plugin';
import { Guardian } from '../shared/guardian.js';
import { GateManager } from '../shared/gates.js';
import { EvidenceCollector } from '../shared/evidence.js';
import { createGuardianHook } from './guardian-hook.js';
import { createGateHook } from './gate-hook.js';
import { createChatMessageHook } from './chat-message-hook.js';
import { createMessagesTransformHook } from './messages-transform-hook.js';
import { createCommandExecuteHook } from './command-execute-hook.js';
import { createToolSummarizerHook } from './tool-summarizer-hook.js';
import { createSessionHook } from './session-hook.js';
import { createCompactingHook } from './compacting-hook.js';
import { createSystemTransformHook } from './system-transform-hook.js';
import type { StateStore } from '../shared/state-store.js';
import type { SharkMessenger } from '../shared/messenger.js';

export function createSharkHooks(
  guardian: Guardian,
  gateManager: GateManager,
  evidenceCollector: EvidenceCollector,
  stateStore: StateStore,
  messenger: SharkMessenger,
  _sharkIdentityPrompt?: string,
  _sharkPluginIdentity?: { sharkAgents: Set<string> }
): Hooks {
  return {
    event: createSessionHook(gateManager, evidenceCollector, undefined, stateStore, messenger),
    'chat.message': createChatMessageHook(),
    'command.execute.before': createCommandExecuteHook(),
    'experimental.chat.messages.transform': createMessagesTransformHook(),
    'tool.execute.before': createGuardianHook(guardian, gateManager),
    'tool.execute.after': (input, output) => {
      createToolSummarizerHook()(input, output);
      createGateHook(gateManager, evidenceCollector, undefined)(input, output);
    },
    'experimental.session.compacting': createCompactingHook(gateManager),
    // agentFilter: null is set inside createSystemTransformHook (hook input has no agent field)
    'experimental.chat.system.transform': createSystemTransformHook(gateManager, undefined),
  };
}