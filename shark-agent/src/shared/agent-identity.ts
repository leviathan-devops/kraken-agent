/**
 * Agent Identity — shark shared
 * 
 * Distinguishes shark agents from vanilla and other plugin agents.
 */

const VANILLA_AGENTS = new Set(['plan', 'build', 'general', 'explore']);

const SHARK_AGENTS = new Set(['shark']);
const SHARK_PREFIX = 'shark_';

/**
 * Check if agent is a Shark agent
 */
export function isSharkAgent(agentName: string | undefined): boolean {
  if (!agentName) return false;
  if (SHARK_AGENTS.has(agentName)) return true;
  if (agentName.startsWith(SHARK_PREFIX)) return true;
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
  return !VANILLA_AGENTS.has(agentName) && !isSharkAgent(agentName);
}