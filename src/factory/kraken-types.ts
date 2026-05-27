/**
 * src/factory/types.ts
 * 
 * Kraken Agent Factory Types
 * 
 * Extended from v4.1 boilerplate with Kraken-specific types for:
 * - Async delegation engine
 * - Cluster management
 * - Task queue
 * - Hive integration
 */

import type { AgentDefinition, ClusterConfig } from './types.js';

// Re-export existing types
export {
  type BrainType,
  type BrainConfig,
  type SingleBrainConfig,
  type DualBrainConfig,
  type TrioBrainConfig,
  type OrchestratorWorkflow,
  type BrainHierarchy,
  type BrainInstance,
  type AgentDefinition,
  type AgentTemplate,
  type AgentOverride,
  type AgentMode,
  type ClusterConfig,
  type ClusterInstance,
  type ArchitectureConfig,
  type ArchitectureInstance,
  type StateDomain,
  type WriteResult,
  type Unsubscribe,
  type StateSnapshot,
  type StateStore,
  type BrainMessage,
  type BrainMessenger,
  type ValidationResult,
  type Validator,
  type DelegationRequest,
  type DelegationResult,
  type GateResult,
  type StateMachine,
  type TaskStatus,
  type Task,
  type CreateTaskInput,
} from './types.js';

// ============================================================
// KRAKEN SPECIFIC TYPES
// ============================================================

// Task priority levels
export type TaskPriority = 'low' | 'normal' | 'high' | 'critical';

// Task status within the delegation system
export type DelegationTaskStatus = 'pending' | 'queued' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

// Delegation request for async task execution
export interface KrakenDelegationRequest {
  taskId: string;
  task: string;
  targetCluster: string;
  targetAgent?: string;
  context?: Record<string, unknown>;
  acceptanceCriteria: string[];
  priority: TaskPriority;
  createdAt: number;
}

// Result of a delegation operation
export interface KrakenDelegationResult {
  success: boolean;
  taskId: string;
  clusterId: string;
  agentId?: string;
  status: DelegationTaskStatus;
  error?: string;
  completedAt?: number;
}

// Cluster load tracking
export interface ClusterLoad {
  clusterId: string;
  activeTasks: number;
  pendingTasks: number;
  completedTasks: number;
  failedTasks: number;
  lastActivity: number;
}

// Cluster status
export interface ClusterStatus {
  clusterId: string;
  active: boolean;
  load: ClusterLoad;
  agents: string[];
}

// Async task queue item
export interface QueuedTask {
  request: KrakenDelegationRequest;
  resolve: (result: KrakenDelegationResult) => void;
  reject: (error: Error) => void;
  enqueuedAt: number;
}

// Agent instance within a cluster
export interface ClusterAgentInstance {
  id: string;
  agentType: 'shark' | 'manta';
  busy: boolean;
  currentTaskId?: string;
  clusterId: string;
}

// Injected context for task assignment
export interface InjectedTaskContext {
  taskId: string;
  patterns: HivememoryResult[];
  failures: HivememoryResult[];
  previousWork: HivememoryResult[];
  clusterContext: ClusterContext;
}

// Cluster context summary
export interface ClusterContext {
  clusterId: string;
  recentTasks: string[];
  commonPatterns: string[];
  knownFailures: string[];
}

// Hivememory result from kraken-hive search
export interface HivememoryResult {
  uri: string;
  type: 'pattern' | 'failure' | 'session' | 'decision' | 'breakthrough';
  title: string;
  relevance: number;
  content?: string;
}

// Kraken-Hive engine interface
export interface KrakenHiveEngine {
  search(query: string, filters?: HiveSearchFilters): Promise<HivememoryResult[]>;
  rememberCluster(clusterId: string, key: string, content: string): Promise<void>;
  rememberSession(sessionId: string, key: string, content: string): Promise<void>;
  rememberPattern(pattern: Pattern): Promise<void>;
  rememberFailure(failure: FailureRecord): Promise<void>;
  getClusterContext(clusterId: string): Promise<ClusterContext>;
  getContextForTask(task: string): Promise<InjectedTaskContext>;
  synthesizeContext(memories: HivememoryResult[], taskType: string): InjectedTaskContext;
}

export interface HiveSearchFilters {
  category?: 'all' | 'clusters' | 'sessions' | 'patterns' | 'decisions' | 'failures';
  limit?: number;
  clusterId?: string;
}

export interface Pattern {
  type: 'pattern' | 'breakthrough';
  id: string;
  description: string;
  taskId?: string;
  clusterId?: string;
  content: string;
  createdAt: number;
}

export interface FailureRecord {
  id: string;
  pattern: string;
  cause: string;
  solution?: string;
  taskId?: string;
  clusterId?: string;
  createdAt: number;
}

// Cluster activity for tracking
export interface ClusterActivity {
  type: 'task_queued' | 'task_started' | 'task_completed' | 'task_failed' | 'file_written' | 'error';
  taskId?: string;
  clusterId: string;
  file?: string;
  error?: string;
  timestamp: number;
}

// Priority queue for task scheduling
export interface PriorityQueue<T> {
  enqueue(item: T, priority: number): void;
  dequeue(): T | undefined;
  dequeueMany(count: number): T[];
  size(): number;
  isEmpty(): boolean;
}

// Kraken agent identity
export interface KrakenAgentIdentity {
  name: string;
  prefix: string;
  orchestrator: string;
  agents: Set<string>;
  primaryAgents: Set<string>;
  subagents: Set<string>;
}

// Agent capability definitions
export type AgentCapability = 'delegate' | 'execute' | 'plan' | 'debug' | 'review';

// Shark agent template
export interface SharkAgentConfig {
  id: string;
  cluster: string;
  capabilities: AgentCapability[];
  instructions?: string;
}

// Manta agent template  
export interface MantaAgentConfig {
  id: string;
  cluster: string;
  capabilities: AgentCapability[];
  instructions?: string;
}
