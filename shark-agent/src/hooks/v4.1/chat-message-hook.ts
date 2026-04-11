/**
 * Chat Message Hook — brain initialization
 * 
 * CRITICAL: session.created does NOT have agent field.
 * Brain MUST be initialized via chat.message which DOES have agent field.
 */
import type { Hooks } from '@opencode-ai/plugin';
import { setCurrentAgent, getCurrentAgent } from './agent-state.js';
import { isSharkAgent } from '../../shared/agent-identity.js';

export function createChatMessageHook(): Hooks['chat.message'] {
  return async (input) => {
    if (getCurrentAgent()) return;
    
    const agentName = input.agent;
    if (agentName && isSharkAgent(agentName)) {
      setCurrentAgent(agentName);
    }
  };
}