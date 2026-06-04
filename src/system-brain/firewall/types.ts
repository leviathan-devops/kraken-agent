/**
 * src/system-brain/firewall/types.ts
 *
 * Consolidated Firewall Type Definitions
 *
 * ALL firewall layers live here. No split directories.
 * This replaces the previous split between src/brains/system/firewall/ and src/system-brain/firewall/.
 */

export enum OperationType {
  READ = 'READ',
  WRITE = 'WRITE',
  EXECUTE = 'EXECUTE',
  TEST = 'TEST',
  INSPECT = 'INSPECT',
  CONTAINER = 'CONTAINER',
  BUILD = 'BUILD',
  CROSS_AGENT = 'CROSS_AGENT',
  HIVE_READ = 'HIVE_READ',
  HIVE_WRITE = 'HIVE_WRITE',
  DELEGATE = 'DELEGATE',
  SYSTEM = 'SYSTEM',
}

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

/** Layer check function signature */
export type FirewallLayer = {
  name: string;
  description: string;
  check: (ctx: FirewallContext) => FirewallResult;
};

/** Protected path rule */
export interface ProtectedPath {
  pattern: RegExp;
  allowAgents: Array<string | RegExp>;
  reason: string;
}
