/**
 * src/clusters/cluster-types.ts
 *
 * Kraken v1.4 ClusterTentacle Type Definitions.
 *
 * Architecture: Octopus model — each tentacle operates independently.
 *   - 1-8 tentacles active simultaneously
 *   - 2-8 AgentSlots per tentacle
 *   - Each tentacle anchored to a MACRO task
 *   - Each AgentSlot gets a decomposed MICRO task
 *
 * Agent Types:
 *   SHARK   (build)    — ACTIVE: steamroll build tasks
 *   MANTA   (debug)    — FUTURE: precision debug tasks
 *   SPIDER  (build)    — FUTURE: verification web (different architecture)
 *   TRIDENT (debug)    — FUTURE: structured debug (different architecture)
 *
 * Currently only SHARK is active. Structure exists for future types.
 */

/** Cluster agent types — 4 options, only SHARK active currently */
export enum ClusterAgentType {
  SHARK = 'shark',
  MANTA = 'manta',
  SPIDER = 'spider',
  TRIDENT = 'trident',
}

/** Currently active agent types (only SHARK for now) */
export const ACTIVE_AGENT_TYPES: ClusterAgentType[] = [ClusterAgentType.SHARK];

/** Tentacle lifecycle status */
export type TentacleStatus = 'anchoring' | 'active' | 'tightening' | 'dissolving' | 'completed';

/** Agent slot lifecycle status */
export type AgentSlotStatus = 'pending' | 'spawning' | 'running' | 'completed' | 'failed';

/** Task modes for tentacle */
export type TentacleMode = 'build' | 'debug' | 'analyze';

/**
 * A ClusterTentacle is Kraken's version of a SpiderWeb.
 * Each tentacle is anchored to a macro task and contains 2-8 AgentSlots.
 */
export interface ClusterTentacle {
  tentacleId: string;
  macroTask: string;
  acceptanceCriteria: string[];
  mode: TentacleMode;
  agentType: ClusterAgentType;
  agentSlots: AgentSlot[];
  anchorState: TentacleAnchorState;
  status: TentacleStatus;
  createdAt: number;
  completedAt?: number;

  /** Optional AgentCoordinator for inter-agent coordination (ACP) */
  coordinator?: import('./acp.js').AgentCoordinator;

  /** Optional TentacleSandbox for resource isolation */
  sandbox?: TentacleSandbox;
}

/**
 * An AgentSlot represents a single subagent within a tentacle.
 * Each slot has a micro task decomposed from the macro task.
 */
export interface AgentSlot {
  slotId: string;
  agentType: ClusterAgentType;
  microTask: string;
  assignedFiles: string[];
  status: AgentSlotStatus;
  output: string;
  taskId?: string;
  startedAt: number;
  completedAt?: number;
  exitCode?: number;
}

/**
 * Anchor state tracks the tentacle's execution progress.
 */
export interface TentacleAnchorState {
  totalSlots: number;
  activeAgents: number;
  completedAgents: number;
  failedAgents: number;
  lastTightening: number;
}

/**
 * Aggregated results from a dissolved tentacle.
 */
export interface TentacleResult {
  tentacleId: string;
  macroTask: string;
  totalSlots: number;
  completedSlots: number;
  failedSlots: number;
  outputs: Array<{ slotId: string; microTask: string; output: string }>;
  mergedOutput: string;
  dissolvedAt: number;
}

/**
 * ACP — Agent Coordination Protocol.
 * Messages exchanged between agent slots within a tentacle.
 */
export interface CoordinationMessage {
  msgId: string;
  fromSlot: string;       // slotId of sender
  toSlot: string;         // slotId of receiver (or 'broadcast')
  type: 'dependency' | 'handoff' | 'sync' | 'result';
  payload: string;
  timestamp: number;
}

/**
 * TentacleSandbox — resource isolation boundary for a tentacle.
 * Defines what paths, tools, env vars, and concurrency limits apply.
 */
export interface TentacleSandbox {
  tentacleId: string;
  allowedPaths: string[];      // Paths the tentacle can read/write
  allowedTools: string[];      // Tools the tentacle can use
  environmentVars: Record<string, string>;  // Isolated env vars
  maxConcurrentAgents: number;
}

/** Tentacle caps */
export const TENTACLE_CAPS = {
  minTentacles: 1,
  maxTentacles: 8,
  minAgents: 2,
  maxAgents: 8,
} as const;
