/**
 * Manta Hooks
 */
import type { Hooks } from '@opencode-ai/plugin';
import { Guardian } from '../shared/guardian.js';
import { GateManager } from '../shared/gates.js';
import { EvidenceCollector } from '../shared/evidence.js';
import { createGuardianHook } from './guardian-hook.js';
import { createGateHook } from './gate-hook.js';
import { createSessionHook } from './session-hook.js';
import { createCompactingHook } from './compacting-hook.js';
import { createSystemTransformHook } from './system-transform-hook.js';
import type { MantaCoordinator } from '../manta/coordinator.js';
import type { StateStore } from '../shared/state-store.js';
import type { MantaMessenger } from '../shared/messenger.js';

export function createSharkHooks(
  guardian: Guardian,
  gateManager: GateManager,
  evidenceCollector: EvidenceCollector,
  coordinator: MantaCoordinator | undefined,
  stateStore: StateStore,
  messenger: MantaMessenger
): Hooks {
  return {
    event: createSessionHook(gateManager, evidenceCollector, coordinator, stateStore, messenger),
    'tool.execute.before': createGuardianHook(guardian),
    'tool.execute.after': createGateHook(gateManager, evidenceCollector, coordinator),
    'experimental.session.compacting': createCompactingHook(gateManager),
    'experimental.chat.system.transform': createSystemTransformHook(gateManager, coordinator),
  };
}
