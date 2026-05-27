/**
 * Chat Message Hook — ctx.agentName detection + identity query
 *
 * FIXED for v4.9: Uses ctx.agentName (not input.agent) for proper detection.
 * Identity query pattern for "who are you" responses.
 */
import type { Hooks } from '@opencode-ai/plugin';
import { setCurrentAgent } from './agent-state.js';
import { SHARK_PLUGIN_IDENTITY, getSharkIdentityPrompt } from '../../shared/identity-loader.js';

const identityQueryPattern = /\b(who are you|what are you|identify yourself|your name|what is your purpose)\b/i;

export function createChatMessageHook(): Hooks['chat.message'] {
  return async (input, output) => {
    // v4.9: Use ctx.agentName (not input.agent — doesn't exist in OpenCode 1.14)
    const ctx = input as { agentName?: string; sessionID?: string; agent?: string };
    const agent = ctx.agentName || ctx.agent || '';

    const isSharkAgent = SHARK_PLUGIN_IDENTITY.sharkAgents.has(agent) || agent.startsWith('shark-');

    if (isSharkAgent) {
      setCurrentAgent(agent, ctx.sessionID);
    }

    // v4.9: Identity query response — inject sharkIdentityPrompt on "who are you"
    if (identityQueryPattern.test(output.message?.content || '')) {
      if (isSharkAgent) {
        const systemOutput = output as { system?: string[] };
        const identityPrompt = getSharkIdentityPrompt();
        if (identityPrompt && systemOutput.system) {
          systemOutput.system.unshift(identityPrompt);
        }
      }
    }
  };
}