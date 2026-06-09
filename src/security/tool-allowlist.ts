/**
 * src/security/tool-allowlist.ts
 *
 * SINGLE SOURCE OF TRUTH for per-agent tool allowlists.
 * Extracted from inline Sets in index.ts tool.execute.before hook.
 *
 * Imported by:
 *   - W6: AllowlistWarhead (enforcement)
 *   - W9: LayerEngineWarhead (6-layer firewall)
 *   - W21: PerAgentAllowlistWarhead (diagnostic)
 *   - index.ts (backward-compatible inline enforcement during migration)
 *
 * P2: Readonly types. All function parameters validated with truthy checks.
 * P3: No catch blocks needed — no exceptions possible in this module.
 * P6: No imports — this is a leaf module.
 * P7: No hardcoded paths.
 * P9: No promises — synchronous.
 * P11: isToolAllowed returns a boolean, not a string pretending to be boolean.
 */

// All tools each agent type is allowed to use.
// Changes here are reflected EVERYWHERE — engine, hooks, T1 context.
export const ALLOWLISTS: Readonly<Record<string, readonly string[]>> = {
  'kraken': [
    'deploy_tentacle', 'get_cluster_status', 'aggregate_results',
    'execution_brain_analyze', 'read_kraken_context', 'report_to_kraken',
    'complete_todo', 'task',
  ],
  'kraken-tentacle-executor': [
    'task', 'get_cluster_status', 'read_kraken_context', 'report_to_kraken',
    'glob', 'grep', 'read', 'write',
  ],
  'kraken-cluster-agent': [
    'bash', 'write', 'read', 'edit', 'glob', 'grep',
    'task', 'read_kraken_context', 'report_to_kraken',
  ],
} as const;

// Pre-computed Sets for O(1) lookup
const allowlistSets = new Map<string, ReadonlySet<string>>();

function getAllowlistSet(agent: string): ReadonlySet<string> {
  const cached = allowlistSets.get(agent);
  if (cached) return cached;

  const list = ALLOWLISTS[agent];
  const set = list ? new Set(list) : new Set<string>();
  allowlistSets.set(agent, set);
  return set;
}

/**
 * Check if a tool is allowed for a given agent.
 * Returns true only if the agent has an explicit allowlist AND the tool is in it.
 * Agents without allowlists return false — they are not managed by Kraken.
 */
export function isToolAllowed(agent: string, tool: string): boolean {
  if (!agent || !tool) return false;
  return getAllowlistSet(agent).has(tool);
}

/**
 * Get the full allowlist for an agent.
 * Returns empty array for unknown agents.
 */
export function getAllowedTools(agent: string): readonly string[] {
  return ALLOWLISTS[agent] ?? [];
}

/**
 * Get all known agent names that have allowlists.
 */
export function getManagedAgents(): readonly string[] {
  return Object.keys(ALLOWLISTS);
}
