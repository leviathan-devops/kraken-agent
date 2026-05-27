/**
 * Shark Evidence Tool — V4.1
 * 
 * V4.1 fix: Uses zod for args validation (zod is available in environment).
 */

import { tool, tool as toolFn } from '@opencode-ai/plugin';
import { EvidenceCollector, type GateName } from '../shared/evidence.js';

const VALID_GATES: GateName[] = ['plan', 'build', 'test', 'verify', 'audit', 'delivery'];

export function createSharkEvidenceTool(evidenceCollector: EvidenceCollector) {
  return toolFn({
    description: 'View evidence collection status and debug logs',
    args: {
      action: tool.schema.enum(['status', 'gate-evidence', 'iteration-logs', 'complete']),
      gate: tool.schema.enum(['plan', 'build', 'test', 'verify', 'audit', 'delivery']).optional(),
      iteration: tool.schema.string().optional(),
    },
    execute: async (args: any) => {
      const { action, gate, iteration } = args;

      if (action === 'status') {
        const complete = evidenceCollector.hasCompleteEvidence();
        const gateStatuses: Record<string, { count: number; latest: string | null }> = {};

        for (const g of VALID_GATES) {
          const evidence = evidenceCollector.getGateEvidence(g);
          gateStatuses[g] = {
            count: evidence.length,
            latest: evidence[0]?.timestamp
              ? new Date(evidence[0].timestamp).toISOString()
              : null,
          };
        }

        return JSON.stringify({ complete, gates: gateStatuses }, null, 2);
      }

      if (action === 'gate-evidence') {
        if (!gate) {
          return JSON.stringify({ error: 'Gate required' });
        }
        const evidence = evidenceCollector.getGateEvidence(gate);
        return JSON.stringify({ gate, evidence }, null, 2);
      }

      if (action === 'iteration-logs') {
        if (!iteration) {
          return JSON.stringify({ error: 'Iteration required' });
        }
        const logs = evidenceCollector.getIterationLogs(iteration);
        return JSON.stringify({ iteration, logs }, null, 2);
      }

      if (action === 'complete') {
        const complete = evidenceCollector.hasCompleteEvidence();
        return JSON.stringify({ complete }, null, 2);
      }

      return JSON.stringify({ error: 'Unknown action' });
    },
  });
}
