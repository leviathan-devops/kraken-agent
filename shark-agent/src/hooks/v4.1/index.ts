/**
 * Shark Hooks (v4.8.4 — HOTFIX)
 */
import type { Hooks } from '@opencode-ai/plugin';
import { Guardian } from '../shared/guardian.js';
import { GateManager } from '../shared/gates.js';
import { EvidenceCollector } from '../shared/evidence.js';
import { createGuardianHook } from './guardian-hook.js';
import { createGateHook } from './gate-hook.js';
import { createChatMessageHook } from './chat-message-hook.js';
import { createToolSummarizerHook } from './tool-summarizer-hook.js';
import { createSessionHook } from './session-hook.js';
import { createCompactingHook } from './compacting-hook.js';
import { createSystemTransformHook } from './system-transform-hook.js';
import type { SharkPeerDispatch } from '../shark/macro/peer-dispatch.js';
import type { StateStore } from '../shared/state-store.js';
import type { SharkMessenger } from '../shared/messenger.js';

export function createSharkHooks(
  guardian: Guardian,
  gateManager: GateManager,
  evidenceCollector: EvidenceCollector,
  peerDispatch: SharkPeerDispatch | undefined,
  stateStore: StateStore,
  messenger: SharkMessenger
): Hooks {
  return {
    event: createSessionHook(gateManager, evidenceCollector, peerDispatch, stateStore, messenger),
    'chat.message': createChatMessageHook(),
    'tool.execute.before': createGuardianHook(guardian),
    'tool.execute.after': (input, output) => {
      createToolSummarizerHook()(input, output);
      createGateHook(gateManager, evidenceCollector, peerDispatch)(input, output);
    },
    'experimental.session.compacting': createCompactingHook(gateManager),
    'experimental.chat.system.transform': createSystemTransformHook(gateManager, peerDispatch),
  };
}