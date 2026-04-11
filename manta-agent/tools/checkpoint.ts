/**
 * Checkpoint Tool — State persistence
 */
import { tool } from '@opencode-ai/plugin';
import { z } from 'zod';
import type { StateStore } from '../shared/state-store.js';
import type { GateManager } from '../shared/gates.js';
import * as path from 'node:path';
import * as fs from 'node:fs';

export function createCheckpointTool(
  stateStore: StateStore,
  _gateManager: GateManager
) {
  return tool({
    description: 'Create a checkpoint of current Shark state for recovery',
    args: {
      message: z.string().optional().describe('Checkpoint message/description'),
    },
    execute: async (args) => {
      const { message } = args;
      const checkpointId = `cp_${Date.now()}`;
      
      // Create checkpoint in .manta directory
      const checkpointDir = path.join(process.cwd(), '.manta', 'checkpoints');
      await fs.promises.mkdir(checkpointDir, { recursive: true });
      
      const checkpointData = {
        id: checkpointId,
        timestamp: new Date().toISOString(),
        message: message || 'checkpoint',
        state: stateStore.snapshot(),
      };
      
      await fs.promises.writeFile(
        path.join(checkpointDir, `${checkpointId}.json`),
        JSON.stringify(checkpointData, null, 2)
      );

      return `Checkpoint created: \`${checkpointId}\``;
    },
  });
}
