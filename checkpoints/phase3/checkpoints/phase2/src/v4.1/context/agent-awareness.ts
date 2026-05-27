/**
 * src/v4.1/context/agent-awareness.ts
 * 
 * Agent identity utilities — "is this my agent?"
 * Single source of truth for plugin agent identification.
 */

export interface AgentAwareness {
  isMyAgent(agentName: string | undefined): boolean;
  isMyOrchestrator(agentName: string | undefined): boolean;
  isVanillaAgent(agentName: string | undefined): boolean;
  isOtherPluginAgent(agentName: string | undefined): boolean;
}

// Vanilla agents — never touched by plugin hooks
const VANILLA_AGENTS = new Set(['plan', 'build', 'general', 'explore']);

/**
 * Create agent awareness for a plugin.
 * 
 * @param managedAgents - Set of agent names managed by this plugin
 * @param agentPrefix - Prefix for agents (e.g., 'shark_' for shark_coder)
 * @param orchestratorName - The orchestrator agent name (e.g., 'architect')
 */
export function createAgentAwareness(
  managedAgents: Set<string>,
  agentPrefix: string,
  orchestratorName: string
): AgentAwareness {
  return {
    isMyAgent(agentName: string | undefined): boolean {
      if (!agentName) return false;
      
      // Direct match in managed agents
      if (managedAgents.has(agentName)) return true;
      
      // Prefix match
      if (agentName.startsWith(agentPrefix)) return true;
      
      // Orchestrator match
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
 * Default awareness — override with your plugin's identity.
 * This is a template that MUST be customized.
 */
export const DEFAULT_AWARENESS = createAgentAwareness(
  new Set(['FIXME_SetYourAgentsHere']),
  'FIXME_',
  'FIXME_orchestrator'
);
