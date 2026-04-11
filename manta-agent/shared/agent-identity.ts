/**
 * Agent Identity — manta shared
 * 
 * Distinguishes manta agents from vanilla and other plugin agents.
 */

const VANILLA_AGENTS = new Set(['plan', 'build', 'general', 'explore']);

const MANTA_AGENTS = new Set(['manta']);
const MANTA_PREFIX = 'manta_';

/**
 * Check if agent is a Manta agent
 */
export function isMantaAgent(agentName: string | undefined): boolean {
  if (!agentName) return false;
  if (MANTA_AGENTS.has(agentName)) return true;
  if (agentName.startsWith(MANTA_PREFIX)) return true;
  return false;
}

/**
 * Check if agent is a vanilla OpenCode agent
 */
export function isVanillaAgent(agentName: string | undefined): boolean {
  return VANILLA_AGENTS.has(agentName ?? '');
}

/**
 * Check if agent belongs to another plugin
 */
export function isOtherPluginAgent(agentName: string | undefined): boolean {
  if (!agentName) return false;
  return !VANILLA_AGENTS.has(agentName) && !isMantaAgent(agentName);
}