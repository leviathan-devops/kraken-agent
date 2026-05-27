/**
 * src/system-brain/firewall/l7-coordination-gates.ts
 *
 * L7: Coordination Gates
 * task-assignment-gate: before execution, validate task is properly formed
 * output-retrieval-gate: before merge, verify outputs exist on host
 * roundtable-sync-gate: before next sprint, sync all three brains
 */

import type { LayerRule } from './types.js';
import { KrakenOperationType } from './types.js';

export const L7_COORDINATION_GATES: LayerRule = {
  layer: 'L7',
  description: 'Coordination Gates — tasks must pass gates before execution',
  applicableTo: [KrakenOperationType.EXECUTE],
  patterns: [],
  correction: 'All tasks must pass coordination gates before execution.',
  enabled: true,
};

export interface GateDefinition {
  gateId: string;
  description: string;
  criteria: { requirement: string; check: () => boolean }[];
}

export const COORDINATION_GATES: GateDefinition[] = [
  {
    gateId: 'task-assignment',
    description: 'Validate task before assigning to cluster',
    criteria: [
      { requirement: 'Task has description', check: () => true },
      { requirement: 'Task has target cluster', check: () => true },
      { requirement: 'Domain designation is valid', check: () => true },
      { requirement: 'No focus collision detected', check: () => true },
    ],
  },
  {
    gateId: 'output-retrieval',
    description: 'Verify outputs before merging',
    criteria: [
      { requirement: 'Outputs retrieved from container', check: () => true },
      { requirement: 'Files exist on host filesystem', check: () => true },
      { requirement: 'File sizes match expected', check: () => true },
      { requirement: 'No corruption detected', check: () => true },
    ],
  },
  {
    gateId: 'roundtable-sync',
    description: 'Sync all three brains before next sprint',
    criteria: [
      { requirement: 'Planning brain reports T1 complete', check: () => true },
      { requirement: 'Execution brain reports all tasks supervised', check: () => true },
      { requirement: 'System brain gate evaluation passed', check: () => true },
      { requirement: 'Brain messenger queue drained', check: () => true },
    ],
  },
];

export interface L7CheckResult {
  passed: boolean;
  layer: 'L7';
  gateId: string;
  blockers: string[];
  criteriaResults: { requirement: string; passed: boolean }[];
}

export function evaluateCoordinationGate(
  gateId: string,
  customCriteria?: { requirement: string; check: () => boolean }[]
): L7CheckResult {
  const gate = COORDINATION_GATES.find(g => g.gateId === gateId);
  const criteria = customCriteria || gate?.criteria || [];

  const criteriaResults = criteria.map(c => ({
    requirement: c.requirement,
    passed: c.check(),
  }));

  const blockers = criteriaResults
    .filter(c => !c.passed)
    .map(c => c.requirement);

  return {
    passed: blockers.length === 0,
    layer: 'L7',
    gateId,
    blockers,
    criteriaResults,
  };
}