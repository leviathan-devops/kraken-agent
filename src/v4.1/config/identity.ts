/**
 * src/v4.1/config/identity.ts
 * 
 * Plugin identity constants — MUST be customized per plugin.
 * 
 * This is the single source of truth for:
 * - Who our agents are
 * - What prefix we use
 * - What our orchestrator is called
 */

/**
 * Plugin identity configuration.
 * Override these values for your plugin.
 */
export interface PluginIdentity {
  /** Unique plugin identifier (e.g., 'shark', 'hermes', 'spider') */
  name: string;
  /** Agent name prefix (e.g., 'shark_' for shark_coder) */
  prefix: string;
  /** Orchestrator agent name (e.g., 'architect', 'shark-architect') */
  orchestrator: string;
  /** All agents managed by this plugin */
  agents: Set<string>;
  /** Primary agents (visible in tab toggle) */
  primaryAgents: Set<string>;
  /** Subagent names (hidden from tab toggle) */
  subagents: Set<string>;
}

// TEMPLATE — Replace with your plugin's identity
export const PLUGIN_IDENTITY: PluginIdentity = {
  name: 'FIXME',           // e.g., 'shark'
  prefix: 'FIXME_',       // e.g., 'shark_'
  orchestrator: 'FIXME',   // e.g., 'shark-architect'
  
  agents: new Set([
    // Add your agent names here
    'FIXME-architect',
    'FIXME-coder',
    'FIXME-reviewer',
    'FIXME-tester',
  ]),
  
  primaryAgents: new Set([
    // Only orchestrator should be primary (visible in tab toggle)
    'FIXME-architect',
  ]),
  
  subagents: new Set([
    // All other agents are subagents
    'FIXME-coder',
    'FIXME-reviewer',
    'FIXME-tester',
  ]),
};

/**
 * Check if an agent is managed by this plugin.
 */
export function isMyAgent(agentName: string | undefined): boolean {
  if (!agentName) return false;
  return PLUGIN_IDENTITY.agents.has(agentName);
}

/**
 * Check if an agent is the orchestrator.
 */
export function isMyOrchestrator(agentName: string | undefined): boolean {
  return agentName === PLUGIN_IDENTITY.orchestrator;
}

/**
 * Check if an agent is a primary agent (visible in tab toggle).
 */
export function isPrimary(agentName: string | undefined): boolean {
  return PLUGIN_IDENTITY.primaryAgents.has(agentName ?? '');
}

/**
 * Check if an agent is a subagent (hidden from tab toggle).
 */
export function isSubagent(agentName: string | undefined): boolean {
  return PLUGIN_IDENTITY.subagents.has(agentName ?? '');
}

/**
 * Get all agents as an array.
 */
export function getAllAgents(): string[] {
  return Array.from(PLUGIN_IDENTITY.agents);
}

/**
 * Get primary agents as an array.
 */
export function getPrimaryAgents(): string[] {
  return Array.from(PLUGIN_IDENTITY.primaryAgents);
}

/**
 * Get subagents as an array.
 */
export function getSubagents(): string[] {
  return Array.from(PLUGIN_IDENTITY.subagents);
}
