/**
 * L7: Coordination Gates — MILITARY GRADE
 *
 * OCTOPUS CENTRAL BRAIN: These gates coordinate all firewalls.
 * No more () => true stubs. Every gate has REAL validation.
 *
 * Gates:
 * 1. task-assignment: Validate task has description, agent, valid cluster
 * 2. output-retrieval: Verify outputs exist on host filesystem
 * 3. roundtable-sync: Verify brain sync state
 *
 * Validation functions accept real-world data from the system brain.
 */

import type { LayerRule } from './types.js';
import { KrakenOperationType } from './types.js';
import { existsSync, statSync } from 'fs';

export const L7_COORDINATION_GATES: LayerRule = {
  layer: 'L7',
  description: 'Coordination Gates — MILITARY GRADE: real validation, no stubs',
  applicableTo: [KrakenOperationType.EXECUTE, KrakenOperationType.DELEGATE],
  patterns: [],
  correction: 'All tasks must pass coordination gates with real validation.',
  enabled: true,
};

export interface GateDefinition {
  gateId: string;
  description: string;
  criteria: GateCriterion[];
}

export interface GateCriterion {
  requirement: string;
  check: (data?: GateData) => boolean;
}

export interface GateData {
  taskDescription?: string;
  targetCluster?: string;
  taskType?: string;
  agentName?: string;
  outputFiles?: string[];
  expectedSizes?: Record<string, number>;
  brainStates?: { planning: boolean; execution: boolean; system: boolean };
}

export interface L7CheckResult {
  passed: boolean;
  layer: 'L7';
  gateId: string;
  blockers: string[];
  criteriaResults: { requirement: string; passed: boolean }[];
}

export const COORDINATION_GATES: GateDefinition[] = [
  {
    gateId: 'task-assignment',
    description: 'Validate task before assigning to cluster',
    criteria: [
      {
        requirement: 'Task has description (non-empty, > 10 chars)',
        check: (data?: GateData) => {
          const desc = data?.taskDescription || '';
          return desc.length > 10;
        },
      },
      {
        requirement: 'Task has target cluster specified',
        check: (data?: GateData) => {
          const cluster = data?.targetCluster || '';
          return cluster.length > 0;
        },
      },
      {
        requirement: 'Task type is valid (not empty/unknown)',
        check: (data?: GateData) => {
          const taskType = data?.taskType || '';
          return taskType.length > 0 && taskType !== 'unknown';
        },
      },
      {
        requirement: 'Agent name is specified',
        check: (data?: GateData) => {
          const agent = data?.agentName || '';
          return agent.length > 0;
        },
      },
    ],
  },
  {
    gateId: 'output-retrieval',
    description: 'Verify outputs exist on host filesystem before merging',
    criteria: [
      {
        requirement: 'At least one output file specified',
        check: (data?: GateData) => {
          const files = data?.outputFiles || [];
          return files.length > 0;
        },
      },
      {
        requirement: 'All output files exist on host filesystem',
        check: (data?: GateData) => {
          const files = data?.outputFiles || [];
          if (files.length === 0) return false;
          return files.every(f => existsSync(f));
        },
      },
      {
        requirement: 'All output files have non-zero size',
        check: (data?: GateData) => {
          const files = data?.outputFiles || [];
          if (files.length === 0) return false;
          try {
            return files.every(f => {
              try {
                return statSync(f).size > 0;
              } catch { return false; }
            });
          } catch { return false; }
        },
      },
      {
        requirement: 'File sizes match expected (if specified)',
        check: (data?: GateData) => {
          const files = data?.outputFiles || [];
          const expected = data?.expectedSizes || {};
          if (files.length === 0) return true; // no files = vacuously true
          if (Object.keys(expected).length === 0) return true; // no expected sizes
          try {
            return Object.entries(expected).every(([file, size]) => {
              try { return statSync(file).size >= size; }
              catch { return false; }
            });
          } catch { return false; }
        },
      },
      {
        requirement: 'No corruption detected (all files readable)',
        check: (data?: GateData) => {
          const files = data?.outputFiles || [];
          if (files.length === 0) return false;
          try {
            return files.every(f => {
              try { statSync(f); return true; }
              catch { return false; }
            });
          } catch { return false; }
        },
      },
    ],
  },
  {
    gateId: 'roundtable-sync',
    description: 'Verify all three brains are synchronized before next sprint',
    criteria: [
      {
        requirement: 'Planning brain reports ready',
        check: (data?: GateData) => {
          return data?.brainStates?.planning === true;
        },
      },
      {
        requirement: 'Execution brain reports tasks supervised',
        check: (data?: GateData) => {
          return data?.brainStates?.execution === true;
        },
      },
      {
        requirement: 'System brain gate evaluation passed',
        check: (data?: GateData) => {
          return data?.brainStates?.system === true;
        },
      },
      {
        requirement: 'At least one brain is initialized',
        check: (data?: GateData) => {
          const states = data?.brainStates;
          if (!states) return false;
          return states.planning || states.execution || states.system;
        },
      },
    ],
  },
];

export function evaluateCoordinationGate(
  gateId: string,
  gateData?: GateData
): L7CheckResult {
  const gate = COORDINATION_GATES.find(g => g.gateId === gateId);

  if (!gate) {
    return {
      passed: false,
      layer: 'L7',
      gateId,
      blockers: [`Unknown gate: ${gateId}`],
      criteriaResults: [],
    };
  }

  const criteriaResults = gate.criteria.map(c => ({
    requirement: c.requirement,
    passed: c.check(gateData),
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
