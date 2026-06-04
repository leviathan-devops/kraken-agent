/**
 * src/system-brain/firewall/layers/l7-coordination.ts
 *
 * L7: Coordination Gates — Validate Real State
 * NO hollow checks. Every check must verify actual state.
 * No catch { return true } allowed.
 */

import type { FirewallContext, FirewallResult } from '../types.js';

/** P2-compliant safe string extraction from args record */
function extractArgString(args: Record<string, unknown>, key: string, defaultValue: string = ''): string {
  const value = args[key];
  return typeof value === 'string' ? value : defaultValue;
}

export function checkL7Coordination(ctx: FirewallContext): FirewallResult {
  const { agent, tool, sessionState, args } = ctx;

  // Check 1: Verify brain is actually initialized before allowing brain-dependent operations
  if (tool.startsWith('kraken_') || tool.startsWith('spawn_') || tool === 'aggregate_results') {
    if (!sessionState.brainInitialized) {
      return {
        blocked: true,
        layer: 'L7',
        reason: `Agent '${agent}' attempting brain-dependent operation but brains are not initialized`,
        detected: `Tool: ${tool}, brainInitialized: ${sessionState.brainInitialized}`,
        correction: 'Wait for brain initialization to complete before using this tool',
      };
    }
  }

  // Check 2: Verify current gate allows the operation
  const currentGate = sessionState.currentGate;
  if (currentGate) {
    const gateRestrictions = getGateRestrictions(currentGate);
    if (gateRestrictions.blockedTools.has(tool)) {
      return {
        blocked: true,
        layer: 'L7',
        reason: `Tool '${tool}' is blocked at gate '${currentGate}': ${gateRestrictions.reason}`,
        detected: `Gate: ${currentGate}, Tool: ${tool}`,
        correction: gateRestrictions.correction,
      };
    }
  }

  // Check 3: Verify task assignment exists for spawn operations
  if (tool.startsWith('spawn_')) {
    const taskDesc = extractArgString(args, 'task') || extractArgString(args, 'description');
    if (!taskDesc || taskDesc.length < 10) {
      return {
        blocked: true,
        layer: 'L7',
        reason: `Spawn operation without meaningful task description — delegation abuse risk`,
        detected: `Task: '${taskDesc}'`,
        correction: 'Provide a detailed task description with clear acceptance criteria',
      };
    }
  }

  // Check 4: Rate limit spawn operations (max 10 per minute)
  const recentSpawns = sessionState.recentActions.filter(
    (a) => a.tool.startsWith('spawn_') && Date.now() - a.timestamp < 60000,
  );
  if (recentSpawns.length >= 10) {
    return {
      blocked: true,
      layer: 'L7',
      reason: `Spawn rate limit exceeded: ${recentSpawns.length} spawns in the last minute`,
      detected: `Agent: ${agent}, Spawns: ${recentSpawns.length}`,
      correction: 'Wait before spawning more agents. Aggregate existing results first.',
    };
  }

  return {
    blocked: false,
    layer: 'L7',
    reason: 'Coordination checks passed',
  };
}

interface GateRestriction {
  blockedTools: Set<string>;
  reason: string;
  correction: string;
}

function getGateRestrictions(gate: string): GateRestriction {
  switch (gate) {
    case 'plan':
      return {
        blockedTools: new Set(['spawn_shark_agent', 'spawn_manta_agent', 'spawn_cluster_task']),
        reason: 'No code execution during PLAN gate',
        correction: 'Complete planning first, then advance to BUILD gate',
      };
    case 'test':
      return {
        blockedTools: new Set(['write', 'edit']),
        reason: 'No code modifications during TEST gate',
        correction: 'Fix issues found during testing, then advance back to BUILD gate',
      };
    case 'delivery':
      return {
        blockedTools: new Set(['write', 'edit', 'bash']),
        reason: 'No code modifications during DELIVERY gate',
        correction: 'Ship package is locked for delivery',
      };
    default:
      return {
        blockedTools: new Set(),
        reason: '',
        correction: '',
      };
  }
}
