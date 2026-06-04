/**
 * src/system-brain/firewall/layers/l0-identity.ts
 *
 * L0: Identity Wall — Only Kraken-managed agents can access Kraken resources.
 * Zone-based file protection.
 */

import type { FirewallContext, BlockResult, AllowResult, FirewallResult } from '../types.js';

const KRAKEN_AGENTS = new Set(['kraken', 'kraken-executor']);
const KRAKEN_PREFIX = 'kraken-';

const PROTECTED_PATHS = [
  { pattern: /\/\.config\/opencode\/plugins\/kraken-agent\//, allowAgents: KRAKEN_AGENTS, reason: 'Kraken plugin directory' },
  { pattern: /\/\.openviking\//, allowAgents: KRAKEN_AGENTS, reason: 'OpenViking data directory' },
  { pattern: /\/kraken-context\//, allowAgents: null, reason: 'Kraken context files' },
];

const ORCHESTRATOR_ONLY_TOOLS = new Set([
  'kraken_hive_search', 'kraken_hive_remember', 'kraken_hive_inject_context',
  'spawn_shark_agent', 'spawn_manta_agent', 'spawn_cluster_task',
  'aggregate_results',
]);

export function checkL0Identity(ctx: FirewallContext): FirewallResult {
  const { agent, tool, args, fileTargets } = ctx;
  const isKrakenAgent = agent.startsWith(KRAKEN_PREFIX) || KRAKEN_AGENTS.has(agent);

  // Check 1: Protected paths — only Kraken agents can access
  for (const target of fileTargets) {
    for (const protectedPath of PROTECTED_PATHS) {
      if (protectedPath.pattern.test(target)) {
        if (!isKrakenAgent) {
          return {
            blocked: true,
            layer: 'L0',
            reason: `Non-Kraken agent '${agent}' attempted to access protected path: ${protectedPath.reason}`,
            detected: target,
            correction: `Only Kraken agents can access ${protectedPath.reason}. Use Kraken tools instead.`,
          };
        }
      }
    }
  }

  // Check 2: Orchestrator-only tools — cluster agents cannot use these
  const isClusterAgent = !KRAKEN_AGENTS.has(agent) && isKrakenAgent;
  if (isClusterAgent && ORCHESTRATOR_ONLY_TOOLS.has(tool)) {
    return {
      blocked: true,
      layer: 'L0',
      reason: `Cluster agent '${agent}' attempted to use orchestrator-only tool '${tool}'`,
      detected: `Tool: ${tool}, Agent: ${agent}`,
      correction: 'Only kraken and kraken-executor can use this tool. Report results via report_to_kraken instead.',
    };
  }

  // Check 3: Non-Kraken agents cannot use Kraken tools at all
  if (!isKrakenAgent && tool.startsWith('kraken_')) {
    return {
      blocked: true,
      layer: 'L0',
      reason: `Non-Kraken agent '${agent}' attempted to use Kraken tool '${tool}'`,
      detected: `Tool: ${tool}, Agent: ${agent}`,
      correction: 'This tool is only available to Kraken agents.',
    };
  }

  return {
    blocked: false,
    layer: 'L0',
    reason: 'Identity check passed',
  };
}
