/**
 * src/shared/agent-identity.ts
 *
 * Kraken Agent Identity — distinguishes Kraken orchestrator agents from
 * cluster subagents, vanilla opencode agents, and other plugin agents.
 *
 * Pattern: Shark v4.7-hotfix-v2 (prefix + Set based detection).
 * This externalizes identity checks that were previously inline in index.ts.
 *
 * Tab toggle operates at PRIMARY AGENT LEVEL only (kraken in TUI dropdown).
 * Cluster subagents (shark-alpha-1, etc.) manage their OWN identity via
 * their embedded harness — Kraken does NOT inject identity into subagents.
 *
 * For system.transform hook:
 *   isKrakenOrchestrator(agent) → inject full 6-section identity + T1
 *   isClusterAgent(agent)       → inject lightweight [KRAKEN TASK CONTEXT] only
 *   neither                     → skip (other plugin's agent, e.g. Spider)
 */

const VANILLA_AGENTS = new Set(['plan', 'build', 'general', 'explore']);

const KRAKEN_ORCHESTRATORS = new Set([
  'kraken',
  'kraken-executor',
  'kraken-tentacle-executor',
]);

const KRAKEN_CLUSTER_PREFIXES = [
  'shark',
  'manta',
];

const KRAKEN_CLUSTER_AGENTS = new Set([
  'kraken-cluster-agent',
]);

/**
 * Check if agent is a Kraken orchestrator (primary or executor).
 * These agents get the full 6-section identity header + T1 injectables.
 */
export function isKrakenOrchestrator(agentName: string | undefined): boolean {
  if (!agentName) return false;
  return KRAKEN_ORCHESTRATORS.has(agentName);
}

/**
 * Check if agent is a Kraken cluster subagent (e.g., shark-alpha-1, manta-beta-2).
 * These agents get [KRAKEN TASK CONTEXT] only — their own harness manages identity.
 *
 * IMPORTANT: Requires a hyphen after the prefix to avoid matching primary agents
 * from other plugins. "shark" (Shark plugin primary) returns FALSE.
 * "shark-alpha-1" (Kraken cluster subagent) returns TRUE.
 * "trident" (Trident plugin primary) returns FALSE.
 * "trident-agent-1" would return TRUE (hyphen after prefix).
 */
export function isClusterAgent(agentName: string | undefined): boolean {
  if (!agentName) return false;
  // Check exact cluster agent names first
  if (KRAKEN_CLUSTER_AGENTS.has(agentName)) return true;
  // Check prefix-hyphen pattern for legacy cluster agents
  for (const prefix of KRAKEN_CLUSTER_PREFIXES) {
    // Require hyphen-suffix to distinguish from other plugin primary agents
    // e.g., "shark-alpha-1" -> cluster, "shark" -> NOT cluster (Shark agent)
    if (agentName.startsWith(prefix + '-')) return true;
  }
  return false;
}

/**
 * Check if agent is ANY Kraken-managed agent (orchestrator or cluster).
 */
export function isKrakenAgent(agentName: string | undefined): boolean {
  if (!agentName) return false;
  return isKrakenOrchestrator(agentName) || isClusterAgent(agentName);
}

/**
 * Check if agent is a vanilla opencode agent (plan, build, general, explore).
 */
export function isVanillaAgent(agentName: string | undefined): boolean {
  return VANILLA_AGENTS.has(agentName ?? '');
}

/**
 * Check if agent belongs to another plugin (not Kraken, not vanilla).
 */
export function isOtherPluginAgent(agentName: string | undefined): boolean {
  if (!agentName) return false;
  return !isVanillaAgent(agentName) && !isKrakenAgent(agentName);
}
