export enum OperationType {
  READ = 'READ',
  WRITE = 'WRITE',
  EXECUTE = 'EXECUTE',
  TEST = 'TEST',
  INSPECT = 'INSPECT',
  CONTAINER = 'CONTAINER',
  BUILD = 'BUILD',
  CROSS_AGENT = 'CROSS_AGENT',
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
  gateTargets: { gate: string; action: string; passed?: boolean; notes?: string };
  sessionState: {
    brainInitialized: boolean;
    evidencePath: string | null;
    currentGate: string | null;
  };
}

export interface IntentPattern {
  intent: OperationType;
  pattern: RegExp;
  field: 'command' | 'args.notes' | 'args.path' | 'commandTokens[0]';
  description: string;
}

export interface LayerRule {
  layer: string;
  description: string;
  applicableTo: OperationType[];
  toolGate?: string[];
  patterns: IntentPattern[];
  requireEvidence?: string;
  correction: string;
  enabled: boolean;
}

export interface BlockResult {
  blocked: true;
  layer: string;
  reason: string;
  detected: string;
  correction: string;
  evidenceRequired?: string;
}

export interface AuditEntry {
  timestamp: string;
  agent: string;
  tool: string;
  operationType: OperationType;
  layer: string;
  reason: string;
  command: string | null;
  correction: string;
  sessionId: string;
}

export interface Threshold {
  overallPassed: boolean;
  passRate: number;
}

export type WiredHook = (
  input: { tool: string; args: Record<string, unknown> },
  output: { args: Record<string, unknown> }
) => Promise<void> | void;
