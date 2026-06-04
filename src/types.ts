/**
 * src/types.ts
 *
 * Kraken v1.3 — Core Type Definitions
 *
 * Architecture: RGE + SRE = Execution Brain
 * RGE = Runtime Grade Engine (7 semantic layers, TypeScript Compiler API)
 * SRE = Slop Removal Engine (P1-P11 principle checks)
 * Combined they form the Execution Brain — algorithmic enforcement, zero subjective gates.
 *
 * All types are strict. No `any`. No unchecked casts. No escape hatches.
 */

// Re-export ViolationSeverity from canonical source
export type { ViolationSeverity } from './execution-brain/rge/types.js';
import type { ViolationSeverity } from './execution-brain/rge/types.js';

// ============================================================
// PLUGIN TYPES
// ============================================================

/** Input received from the opencode plugin runtime */
export interface PluginInput {
  /** The opencode configuration object */
  config?: Record<string, unknown>;
  /** The session ID for this plugin instance */
  sessionId?: string;
}

/** Output returned from the plugin factory function */
export interface PluginOutput {
  name: string;
  tool: Record<string, ToolDefinition>;
  permission: PluginPermission;
  config: (opencodeConfig: Record<string, unknown>) => void;
  [hookName: string]: unknown;
}

export interface PluginPermission {
  tool: 'allow' | 'deny';
  command: 'allow' | 'deny';
}

export interface ToolDefinition {
  description: string;
  parameters: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<ToolResult>;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  evidence?: EvidenceData[];
}

// ============================================================
// AGENT TYPES
// ============================================================

export enum AgentRole {
  ORCHESTRATOR = 'ORCHESTRATOR',
  EXECUTOR = 'EXECUTOR',
  SHARK = 'SHARK',
  MANTA = 'MANTA',
}

export enum AgentMode {
  PRIMARY = 'PRIMARY',
  SUBAGENT = 'SUBAGENT',
}

export interface AgentDefinition {
  id: string;
  role: AgentRole;
  mode: AgentMode;
  description: string;
  instructions: string;
  tools: string[];
  clusterId?: string;
}

export interface PluginIdentity {
  name: string;
  prefix: string;
  orchestrator: string;
  agents: Set<string>;
  primaryAgents: Set<string>;
  krakenAgents: Set<string>;
  clusterAgents: Set<string>;
}

// ============================================================
// BRAIN TYPES
// ============================================================

export enum BrainType {
  PLANNING = 'PLANNING',
  EXECUTION = 'EXECUTION',
  SYSTEM = 'SYSTEM',
}

export interface BrainState {
  type: BrainType;
  initialized: boolean;
  lastTick: number;
  errorCount: number;
  decisionCount: number;
}

export type MessagePriority = 'critical' | 'high' | 'normal' | 'low';
export type MessageType = 'context-inject' | 'gate-failure' | 'checkpoint' | 'override' | 'sync';

export interface BrainMessage {
  id: string;
  from: string;
  to: string;
  type: MessageType;
  priority: MessagePriority;
  payload: Record<string, unknown>;
  requiresAck: boolean;
  timestamp: number;
  acked: boolean;
}

// ============================================================
// RGE TYPES (Runtime Grade Engine — 7 Semantic Layers)
// P1 FIX: Re-export from canonical source to avoid duplicate definitions
// ============================================================

import { RGELayer } from './execution-brain/rge/types.js';
export { RGELayer };

export interface RGEInput {
  sourceFiles: string[];
  projectRoot: string;
  compilerOptions?: Record<string, unknown>;
}

export interface RGEViolation {
  principle: string;
  layer: RGELayer;
  message: string;
  file: string;
  line: number;
  severity: ViolationSeverity;
  fix?: string;
  nodeText?: string;
}

// ViolationSeverity is re-exported from execution-brain/rge/types.js

export interface RGELayerResult {
  layer: RGELayer;
  passed: boolean;
  violations: RGEViolation[];
  checksRun: number;
  checksPassed: number;
  durationMs: number;
}

export interface RGEResult {
  passed: boolean;
  layers: RGELayerResult[];
  totalViolations: number;
  criticalCount: number;
  highCount: number;
  timestamp: string;
  projectRoot: string;
  filesAnalyzed: number;
}

// ============================================================
// SRE TYPES (Slop Removal Engine — P1-P11)
// P1 FIX: Re-export from canonical source to avoid duplicate definitions
// ============================================================

import { SREPrinciple } from './execution-brain/sre/types.js';
export { SREPrinciple };

export interface SREInput {
  sourceFiles: string[];
  projectRoot: string;
  enabledPrinciples?: SREPrinciple[];
}

export interface SREViolation {
  principle: SREPrinciple;
  file: string;
  line: number;
  column?: number;
  severity: ViolationSeverity;
  description: string;
  codeSnippet?: string;
  fix?: string;
}

export interface SRECheckResult {
  principle: SREPrinciple;
  passed: boolean;
  violations: SREViolation[];
  filesChecked: number;
  durationMs: number;
}

export interface SREResult {
  passed: boolean;
  principles: SRECheckResult[];
  totalViolations: number;
  criticalCount: number;
  highCount: number;
  timestamp: string;
  filesAnalyzed: number;
}

// ============================================================
// EXECUTION BRAIN TYPES (RGE + SRE = Execution Brain)
// ============================================================

export interface ExecutionBrainState {
  rgeResults: RGEResult | null;
  sreResults: SREResult | null;
  overallPassed: boolean;
  gateReady: boolean;
  lastAnalysis: string | null;
  totalCritical: number;
  totalHigh: number;
}

export interface ExecutionBrainOutput {
  passed: boolean;
  rgeReport: RGEResult | null;
  sreReport: SREResult | null;
  blockingViolations: Array<{
    source: 'RGE' | 'SRE';
    principle: string;
    severity: ViolationSeverity;
    message: string;
    file: string;
    line: number;
  }>;
}

// ============================================================
// FIREWALL TYPES (Consolidated — system-brain only)
// P1 FIX: Re-export from canonical source to avoid duplicate definitions
// ============================================================

import { OperationType } from './system-brain/firewall/types.js';
export { OperationType };

export interface FirewallContext {
  agent: string;
  sessionId: string;
  tool: string;
  operationType: OperationType;
  command: string | null;
  commandTokens: string[];
  hasPipe: boolean;
  pipeChain: string[];
  args: Record<string, unknown>;
  fileTargets: string[];
  sessionState: FirewallSessionState;
}

export interface FirewallSessionState {
  brainInitialized: boolean;
  evidencePath: string | null;
  currentGate: string | null;
  lastBlockedLayer: string | null;
  recentActions: Array<{ tool: string; timestamp: number; blocked: boolean }>;
}

export interface BlockResult {
  blocked: true;
  layer: string;
  reason: string;
  detected: string;
  correction: string;
  evidenceRequired?: string;
}

export interface AllowResult {
  blocked: false;
  layer: string;
  reason: string;
}

export type FirewallResult = BlockResult | AllowResult;

export interface AuditEntry {
  timestamp: string;
  agent: string;
  tool: string;
  operationType: OperationType;
  layer: string;
  blocked: boolean;
  reason: string;
  command: string | null;
  correction: string;
  sessionId: string;
}

// ============================================================
// CLUSTER TYPES
// ============================================================

export enum ClusterStatus {
  IDLE = 'IDLE',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  FAILED = 'FAILED',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  PLANNED = 'PLANNED',
  ASSIGNED = 'ASSIGNED',
  RUNNING = 'RUNNING',
  OUTPUT_READY = 'OUTPUT_READY',
  VERIFIED = 'VERIFIED',
  COMPLETE = 'COMPLETE',
  ABORTED = 'ABORTED',
}

export enum TaskType {
  BUILD = 'BUILD',
  DEBUG = 'DEBUG',
  TEST = 'TEST',
}

export interface ClusterConfig {
  id: string;
  name: string;
  description: string;
  agents: string[];
  intraClusterDelegation: boolean;
  interClusterDelegation: boolean;
  sharedContext: boolean;
}

export interface ClusterState {
  id: string;
  status: ClusterStatus;
  agents: string[];
  activeTasks: number;
  completedTasks: number;
  failedTasks: number;
}

export interface TaskDefinition {
  id: string;
  type: TaskType;
  description: string;
  criteria: string[];
  clusterId: string;
  status: TaskStatus;
  assignee?: string;
  createdAt: number;
  updatedAt: number;
  retryCount: number;
  maxRetries: number;
}

export interface TaskResult {
  taskId: string;
  success: boolean;
  outputs: string[];
  evidence: EvidenceData[];
  duration: number;
  error?: string;
}

// ============================================================
// GATE TYPES
// ============================================================

export type GateName = 'plan' | 'build' | 'test' | 'verify' | 'audit' | 'delivery';

export const GATE_ORDER: GateName[] = ['plan', 'build', 'test', 'verify', 'audit', 'delivery'];

export interface GateState {
  currentGate: GateName;
  passed: Record<GateName, boolean>;
  evidence: Record<GateName, string[]>;
}

export interface GateEvaluation {
  gate: GateName;
  allPassed: boolean;
  criteria: string[];
  missing: string[];
}

// ============================================================
// IDENTITY TYPES
// ============================================================

export interface IdentityBundle {
  role: string;
  files: Map<string, string>;
  prompt: string;
}

// ============================================================
// EVIDENCE TYPES
// ============================================================

export interface EvidenceData {
  gate: string;
  type: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

// ============================================================
// HOOK TYPES
// ============================================================

export interface HookContext {
  sessionID: string;
  agentName: string;
  isMyAgent: (name: string) => boolean;
  getSessionState: () => Record<string, unknown>;
  setSessionState: (state: Record<string, unknown>) => void;
}

export interface SessionStateData {
  lastAgent?: string;
  lastTool?: string;
  lastToolTime?: number;
  firewallBlock?: {
    layer: string;
    reason: string;
    tool: string;
    timestamp: number;
  };
  gateContext?: string;
}

// ============================================================
// SHARED UTILITY TYPES
// ============================================================

export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export interface Logger {
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
  debug: (message: string, data?: Record<string, unknown>) => void;
}
