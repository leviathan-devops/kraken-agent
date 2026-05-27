/**
 * src/v4.1/context/hook-context.ts
 * 
 * HookContext — The safety layer passed to every hook handler.
 * Provides agent awareness, phase awareness, session isolation, and logging.
 */

import type { Logger } from '../utils/logger.js';
import { createLogger } from '../utils/logger.js';
import { createAgentAwareness, type AgentAwareness } from './agent-awareness.js';

export interface SessionState {
  phase?: string;
  activeAgent?: string;
  [key: string]: unknown;
}

export interface HookContext {
  // Identity
  readonly sessionID: string;
  readonly agentName: string | undefined;
  readonly phase: string | undefined;

  // Agent checking
  isMyAgent(agent?: string): boolean;
  isMyOrchestrator(agent?: string): boolean;
  isVanillaAgent(agent?: string): boolean;
  isOtherPluginAgent(agent?: string): boolean;

  // Phase
  getPhase(): string | undefined;

  // Session state (per-session isolation)
  getSessionState(): SessionState;

  // Logging
  log: Logger;
}

// Vanilla agents that should never be affected by plugin hooks
const VANILLA_AGENTS = new Set(['plan', 'build', 'general', 'explore']);

/**
 * Create agent awareness utilities.
 * MUST be configured with plugin-specific constants.
 */
export function createAgentAwarenessContext(
  pluginName: string,
  agentPrefix: string,
  orchestratorName: string,
  managedAgents: Set<string>
): AgentAwareness {
  return {
    isMyAgent(agentName: string | undefined): boolean {
      if (!agentName) return false;
      // Check if it's one of our managed agents
      if (managedAgents.has(agentName)) return true;
      // Check prefix
      if (agentName.startsWith(agentPrefix)) return true;
      // Check orchestrator
      if (agentName === orchestratorName) return true;
      return false;
    },

    isMyOrchestrator(agentName: string | undefined): boolean {
      return agentName === orchestratorName;
    },

    isVanillaAgent(agentName: string | undefined): boolean {
      return VANILLA_AGENTS.has(agentName ?? '');
    },

    isOtherPluginAgent(agentName: string | undefined): boolean {
      if (!agentName) return false;
      // Not vanilla, not mine = other plugin's agent
      return (
        !VANILLA_AGENTS.has(agentName) &&
        !managedAgents.has(agentName) &&
        !agentName.startsWith(agentPrefix) &&
        agentName !== orchestratorName
      );
    },
  };
}

/**
 * Create a HookContext from hook input.
 * Extracts sessionID, agentName, and phase from OpenCode's hook input.
 */
export function createHookContext(
  input: any,
  awareness: AgentAwareness,
  sessionGetter: (id: string) => SessionState,
  logger: Logger
): HookContext {
  const sessionID = input?.sessionID ?? input?.session?.sessionId ?? 'unknown';
  const agentName = input?.session?.agentName ?? input?.agent ?? undefined;
  const phase = input?.phase ?? undefined;

  return {
    sessionID,
    agentName,
    phase,

    isMyAgent: (agent?: string) => awareness.isMyAgent(agent ?? agentName),
    isMyOrchestrator: (agent?: string) => awareness.isMyOrchestrator(agent ?? agentName),
    isVanillaAgent: (agent?: string) => awareness.isVanillaAgent(agent ?? agentName),
    isOtherPluginAgent: (agent?: string) => awareness.isOtherPluginAgent(agent ?? agentName),

    getPhase: () => phase,

    getSessionState: () => sessionGetter(sessionID),

    log: logger,
  };
}
