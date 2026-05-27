/**
 * src/v4.1/config/agent-registration.ts
 * 
 * Agent registration utilities for OpenCode tab toggles.
 * Ensures agents appear correctly in the UI.
 */

import { PLUGIN_IDENTITY, isPrimary } from './identity.js';

export interface AgentSDKConfig {
  name: string;
  description: string;
  instructions: string;
  mode: 'primary' | 'subagent';
  permission: { task: 'allow' };
  tools: Record<string, unknown>;
  // NOTE: model field should NOT be set for primary agents
  // OpenCode resolves the model from user config
}

/**
 * Convert AgentDefinition to SDK-compatible config for OpenCode.
 */
export function toSDKConfig(
  id: string,
  description: string,
  instructions: string
): AgentSDKConfig {
  const isPrimaryAgent = isPrimary(id);
  
  const config: AgentSDKConfig = {
    name: id,
    description,
    instructions,
    mode: isPrimaryAgent ? 'primary' : 'subagent',
    permission: { task: 'allow' },
    tools: {},
  };
  
  // PRIMARY AGENTS: Do NOT set model — let OpenCode resolve it
  // SUBAGENTS: Can optionally set model
  
  return config;
}

/**
 * Register agents into OpenCode's config.
 * Called from the plugin's config callback.
 */
export function registerAgents(
  opencodeConfig: Record<string, unknown>,
  agents: Map<string, { description: string; instructions: string }>
): void {
  const sdkConfigs: Record<string, AgentSDKConfig> = {};
  
  for (const [id, agent] of agents) {
    sdkConfigs[id] = toSDKConfig(id, agent.description, agent.instructions);
  }
  
  if (!opencodeConfig.agent) {
    opencodeConfig.agent = { ...sdkConfigs };
  } else {
    Object.assign(opencodeConfig.agent, sdkConfigs);
  }
}

/**
 * Register a single agent.
 */
export function registerAgent(
  opencodeConfig: Record<string, unknown>,
  id: string,
  description: string,
  instructions: string
): void {
  const config = toSDKConfig(id, description, instructions);
  
  if (!opencodeConfig.agent) {
    opencodeConfig.agent = { [id]: config };
  } else {
    (opencodeConfig.agent as Record<string, unknown>)[id] = config;
  }
}
