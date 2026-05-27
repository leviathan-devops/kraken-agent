/**
 * src/system-brain/firewall/layers/l3-delegation-abuse.ts
 *
 * L3: Delegation Abuse Detection
 *
 * Catches unauthorized spawning attempts.
 * Kraken agents can ONLY spawn via:
 * - spawn_shark_agent
 * - spawn_manta_agent
 * - spawn_cluster_task
 * - run_parallel_tasks
 *
 * Any other spawn pattern is BLOCKED.
 */

import type { LayerRule } from '../types.ts';
import { KrakenOperationType } from '../types.ts';

export const L3_DELEGATION_ABUSE: LayerRule = {
  layer: 'L3',
  description: 'Delegation Abuse — catches unauthorized spawning',
  applicableTo: [KrakenOperationType.DELEGATE],
  patterns: [
    // Unauthorized spawn patterns
    {
      intent: KrakenOperationType.DELEGATE,
      pattern: /^spawn_(?!shark_|manta_|cluster_)/i,
      field: 'tool',
      description: 'Unauthorized spawn tool — must use spawn_shark_agent, spawn_manta_agent, or spawn_cluster_task',
    },
    // Direct agent spawning without proper tool
    {
      intent: KrakenOperationType.DELEGATE,
      pattern: /\b(delegate|spawn|create).*agent\b/i,
      field: 'args.task',
      description: 'Ambiguous delegation language',
    },
  ],
  correction: 'Only use spawn_shark_agent, spawn_manta_agent, spawn_cluster_task, or run_parallel_tasks.',
  enabled: true,
};
