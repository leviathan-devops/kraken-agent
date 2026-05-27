/**
 * src/factory/types.ts
 *
 * V4 Factory Types
 *
 * Single source of truth for the config-driven multi-brain agent architecture.
 * Supports single (Spider), dual (Shark), and trio parallel orchestrator models.
 */

// ============================================================
// BRAIN TYPES
// ============================================================

export type BrainType = 'single' | 'dual' | 'trio' | 'custom';

export interface BrainConfig {
  type: BrainType;
  name: string;
  description?: string;
}

export interface SingleBrainConfig extends BrainConfig {
  type: 'single';
  orchestrator: string;
}

export interface DualBrainConfig extends BrainConfig {
  type: 'dual';
  orchestrators: {
    [key: string]: string; // orchestrator ID → agent ID
  };
  workflows: {
    [orchestratorId: string]: OrchestratorWorkflow;
  };
  syncMode: 'shared-state' | 'direct' | 'none';
}

export interface TrioBrainConfig extends BrainConfig {
  type: 'trio';
  orchestrators: {
    [key: string]: string;
  };
  workflows: {
    [orchestratorId: string]: OrchestratorWorkflow;
  };
  syncMode: 'shared-state' | 'direct' | 'none';
}

export interface OrchestratorWorkflow {
  name: string;
  description: string;
  owns: string[];
  delegatesTo: string[];
  readOnly?: string[];
  gates?: string[];
}

export interface BrainHierarchy {
  level: number;
  children: BrainInstance[];
  parent?: string;
}

export interface BrainInstance {
  type: BrainType;
  primary: string;
  all: string[];
  hierarchy: BrainHierarchy;
  workflows?: { [orchestratorId: string]: OrchestratorWorkflow };
  syncMode?: 'shared-state' | 'direct' | 'none';
}

// ============================================================
// AGENT TYPES
// ============================================================

export type AgentMode = 'primary' | 'subagent';

export interface AgentDefinition {
  id: string;
  name: string;
  mode: AgentMode;
  description: string;
  cluster?: string;
  capabilities: string[];
  allowedTools: string[];
  maxConcurrentTasks: number;
  prompt?: string;
  model?: string;
  temperature?: number;
  brain?: string;
}

export interface AgentTemplate {
  id: string;
  description: string;
  tools: string[];
  capabilities: string[];
  prompt: string;
  defaultModel?: string;
  defaultTemperature?: number;
}

export interface AgentOverride {
  prompt?: string;
  tools?: string[];
  model?: string;
  temperature?: number;
  maxConcurrentTasks?: number;
}

// ============================================================
// CLUSTER TYPES
// ============================================================

export interface ClusterConfig {
  id: string;
  name: string;
  description?: string;
  agents: string[];
  subOrchestrator?: string;
  intraClusterDelegation: boolean;
  interClusterDelegation: boolean;
  sharedContext: boolean;
  parentCluster?: string;
}

export interface ClusterInstance {
  config: ClusterConfig;
  agents: AgentDefinition[];
  subOrchestrator?: AgentDefinition;
}

// ============================================================
// ARCHITECTURE TYPES
// ============================================================

export interface ArchitectureConfig {
  name: string;
  version: string;
  description?: string;
  brain: SingleBrainConfig | DualBrainConfig | TrioBrainConfig | BrainConfig;
  clusters: ClusterConfig[];
  agents: Record<string, AgentDefinition | string>; // string = template reference
  delegation?: {
    allowCrossCluster?: boolean;
    requireGateApproval?: boolean;
    maxHops?: number;
  };
  hooks?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// Forward references to coordination types (avoid circular import)
export interface AgentRegistry {
  getAgent(agentId: string): AgentDefinition | null;
  getAgentsByMode(mode: string): AgentDefinition[];
  getAgentsByCluster(clusterId: string): AgentDefinition[];
  isAgentAllowedTool(agentId: string, toolName: string): boolean;
  listAgents(): AgentDefinition[];
}

export interface DelegationEngine {
  delegate(request: DelegationRequest): Promise<DelegationResult>;
  canDelegate(fromAgent: string, toAgent: string): boolean;
  getClusterAgents(clusterId: string): AgentDefinition[];
  enforceGate(request: DelegationRequest): GateResult;
}

export interface DelegationRequest {
  from: string;
  to: string;
  task: string;
  context?: Record<string, unknown>;
}

export interface DelegationResult {
  success: boolean;
  taskId?: string;
  error?: string;
}

export interface GateResult {
  allowed: boolean;
  reason?: string;
}

export interface StateMachine {
  createTask(input: CreateTaskInput): Task;
  transition(taskId: string, to: TaskStatus): Task | null;
  getTask(taskId: string): Task | null;
  getTasksByState(state: TaskStatus): Task[];
  getTasksByAgent(agentId: string): Task[];
  canTransition(taskId: string, to: TaskStatus): boolean;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';

export interface Task {
  id: string;
  status: TaskStatus;
  createdAt: number;
  updatedAt: number;
  assignedAgent?: string;
  context?: Record<string, unknown>;
}

export interface CreateTaskInput {
  id: string;
  assignedAgent?: string;
  context?: Record<string, unknown>;
}

export interface ArchitectureInstance {
  config: ArchitectureConfig;
  agents: Map<string, AgentDefinition>;
  clusters: Map<string, ClusterConfig>;
  brains: {
    type: BrainType;
    primary: string;
    all: string[];
    workflows?: { [key: string]: OrchestratorWorkflow };
    syncMode?: 'shared-state' | 'direct' | 'none';
  };
  coordination: {
    registry: AgentRegistry;
    delegation: DelegationEngine;
    stateMachine: StateMachine;
  };
  stateStore: StateStore;
  messenger: BrainMessenger;
}

// ============================================================
// STATE STORE TYPES
// ============================================================

export type StateDomain = 'plan-state' | 'execution-state' | 'quality-state';

export interface WriteResult {
  success: boolean;
  version: number;
  error?: string;
}

export interface Unsubscribe {
  (): void;
}

export interface StateSnapshot {
  data: Record<string, any>;
  versions: Record<string, number>;
  timestamp: number;
}

export interface StateStore {
  get<T>(key: string, domain?: StateDomain): T | undefined;
  set<T>(key: string, value: T, domain: StateDomain, ownerBrain?: string): WriteResult;
  watch(key: string, callback: (value: any, version: number) => void): Unsubscribe;
  snapshot(): StateSnapshot;
  restore(snapshot: StateSnapshot): void;
}

// Domain ownership map — which brain type owns which state domain
export const DOMAIN_OWNERSHIP: Record<StateDomain, string[]> = {
  'plan-state': ['architect'],
  'execution-state': ['executor'],
  'quality-state': ['guardian', 'executor'],
};

// ============================================================
// BRAIN MESSENGER TYPES
// ============================================================

export interface BrainMessage {
  id: string;
  from: string;
  to: string;
  type: 'handoff' | 'alert' | 'request' | 'ack';
  priority: 'low' | 'normal' | 'high' | 'critical';
  payload: unknown;
  timestamp: number;
  requiresAck: boolean;
}

export interface BrainMessenger {
  send(message: BrainMessage): void;
  receive(brainId: string): BrainMessage[];
  waitForAck(messageId: string, timeoutMs: number): Promise<boolean>;
}

// ============================================================
// VALIDATION TYPES
// ============================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export type Validator<T> = (config: T) => ValidationResult;
