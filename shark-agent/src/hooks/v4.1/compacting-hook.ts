/**
 * Session Compacting Hook — truncate history, not inject
 * 
 * CRITICAL: Only fires for shark agents.
 * OPTIMIZED: No context injection, no file writes during compaction.
 */

import type { Hooks } from '@opencode-ai/plugin';
import { GateManager } from '../../shared/gates.js';
import { isSharkAgent } from '../../shared/agent-identity';

export function createCompactingHook(
  gateManager: GateManager
): Hooks['experimental.session.compacting'] {
  return async (input) => {
    const { agent } = input;
    
    if (!isSharkAgent(agent)) return;
    
    // Silent - just return. OpenCode handles truncation.
  };
}