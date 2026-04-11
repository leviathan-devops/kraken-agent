/**
 * Session Hook — manta session lifecycle
 * 
 * ONLY fires for manta agent sessions.
 */
import type { Hooks } from '@opencode-ai/plugin';
import { GateManager } from '../../shared/gates.js';
import { EvidenceCollector } from '../../shared/evidence.js';
import type { MantaCoordinator } from '../../manta/coordinator.js';
import { isMantaAgent } from '../../shared/agent-identity.js';
import type { StateStore } from '../../shared/state-store.js';
import type { MantaMessenger } from '../../shared/messenger.js';
import * as path from 'node:path';
import * as fs from 'node:fs';

let dirCreationAttempted = false;

export function createSessionHook(
  gateManager: GateManager,
  _evidenceCollector: EvidenceCollector,
  coordinator: MantaCoordinator | undefined,
  stateStore: StateStore,
  messenger: MantaMessenger
): Hooks['event'] {
  return async (input) => {
    const event = input.event as { type?: string; sessionId?: string; agent?: string };
    
    if (!event?.type) return;
    
    // CRITICAL: Only handle manta agent sessions
    if (!isMantaAgent(event.agent)) {
      return;  // Skip for non-manta agents
    }

    switch (event.type) {
      case 'session.created':
        await handleSessionCreated(event.sessionId || 'unknown', gateManager, coordinator);
        break;
      case 'session.ended':
        handleSessionEnded(stateStore, messenger);
        break;
    }
  };
}

async function handleSessionCreated(
  sessionID: string,
  gateManager: GateManager,
  coordinator?: MantaCoordinator
): Promise<void> {
  // Initialize fresh gate state
  gateManager.restore({
    currentGate: 'plan',
    gateStatus: {
      plan: 'pending',
      build: 'pending',
      test: 'pending',
      verify: 'pending',
      audit: 'pending',
      delivery: 'pending',
    },
    verifyAttempts: 0,
    currentIteration: 'V1.0',
    iterationAttempts: {},
  });

  // Initialize ONLY manta coordinator
  if (coordinator) {
    coordinator.initialize();
  }

  // Ensure .manta directory exists
  const mantaDir = path.join(process.cwd(), '.manta');
  try {
    await fs.promises.mkdir(mantaDir, { recursive: true });
    await fs.promises.mkdir(path.join(mantaDir, 'evidence'), { recursive: true });
    await fs.promises.mkdir(path.join(mantaDir, 'checkpoints'), { recursive: true });
  } catch (err) {
    console.error(`[Manta] Failed to create .manta directory: ${err}`);
  }

  if (!dirCreationAttempted) {
    dirCreationAttempted = true;
  }
}

function handleSessionEnded(
  stateStore: StateStore,
  messenger: MantaMessenger
): void {
  stateStore.cleanup();
  messenger.cleanup();
  dirCreationAttempted = false;
}

function handleSessionEnded(
  stateStore: StateStore,
  messenger: MantaMessenger
): void {
  stateStore.cleanup();
  messenger.cleanup();
  dirCreationAttempted = false;
}
