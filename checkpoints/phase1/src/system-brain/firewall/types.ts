/**
 * src/system-brain/firewall/types.ts
 *
 * Complete type definitions for Kraken System Brain Firewall.
 * No stubs. No placeholders. Copy-paste ready.
 */

export enum KrakenOperationType {
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

/**
 * FirewallContext — normalized context consumed by all layers.
 * Built once from raw hook data in buildContext().
 */
export interface FirewallContext {
  /** The agent name (e.g., 'kraken', 'shark-alpha-1') */
  agent: string;
  /** Session ID for this conversation */
  sessionId: string;
  /** The tool being called (e.g., 'bash', 'write', 'kraken_hive_remember') */
  tool: string;
  /** Semantic operation type */
  operationType: KrakenOperationType;
  /** The command string if applicable (e.g., 'grep -r "TODO" src/ | wc -l') */
  command: string | null;
  /** Tokenized command for analysis */
  commandTokens: string[];
  /** Whether command contains pipe */
  hasPipe: boolean;
  /** Array of pipe chain segments */
  pipeChain: string[];
  /** Raw args passed to the tool */
  args: Record<string, unknown>;
  /** Extracted file targets from args */
  fileTargets: string[];
  /** Extracted gate targets from args */
  gateTargets: GateTargets;
  /** Session state at time of call */
  sessionState: SessionState;
}

export interface GateTargets {
  gate: string;
  action: string;
  passed?: boolean;
  notes?: string;
}

export interface SessionState {
  brainInitialized: boolean;
  evidencePath: string | null;
  currentGate: string | null;
}

/**
 * LayerRule — declarative rule consumed by LayerEngine.
 * Each layer defines which operationTypes it applies to,
 * which tools it gates, and what patterns to match.
 */
export interface LayerRule {
  /** Layer identifier (e.g., 'L0', 'L1', 'L5-1') */
  layer: string;
  /** Human-readable description */
  description: string;
  /** Which operationTypes this layer applies to */
  applicableTo: KrakenOperationType[];
  /** Optional: restrict to specific tools only */
  toolGate?: string[];
  /** Patterns to match against context fields */
  patterns: IntentPattern[];
  /** Optional: require mechanical evidence before allowing */
  requireEvidence?: string;
  /** Correction message shown when blocked */
  correction: string;
  /** Enable/disable this layer */
  enabled: boolean;
}

/**
 * IntentPattern — a single pattern match rule.
 */
export interface IntentPattern {
  /** The operationType this pattern applies to */
  intent: KrakenOperationType;
  /** RegExp to test against the field value */
  pattern: RegExp;
  /** Which field of FirewallContext to test */
  field: PatternField;
  /** Human-readable description of what this detects */
  description: string;
}

/**
 * Valid fields that patterns can match against.
 */
export type PatternField =
  | 'command'           // ctx.command
  | 'args.description'  // ctx.args.description
  | 'args.notes'        // ctx.args.notes
  | 'args.path'         // ctx.args.path (with fallbacks)
  | 'args.content'      // ctx.args.content
  | 'args.task'         // ctx.args.task
  | 'tool'              // ctx.tool
  | 'commandTokens[0]'; // ctx.commandTokens[0]

/**
 * BlockResult — returned when a layer blocks an operation.
 */
export interface BlockResult {
  blocked: true;
  /** Which layer blocked (e.g., 'L1', 'L5-2') */
  layer: string;
  /** Why it was blocked */
  reason: string;
  /** What was detected (truncated to 200 chars) */
  detected: string;
  /** How to fix the issue */
  correction: string;
  /** Which evidence file is required (if any) */
  evidenceRequired?: string;
}

/**
 * AuditEntry — a single entry in the JSONL audit log.
 */
export interface AuditEntry {
  /** ISO timestamp */
  timestamp: string;
  /** Agent name */
  agent: string;
  /** Tool name */
  tool: string;
  /** Operation type */
  operationType: KrakenOperationType;
  /** Which layer blocked (if blocked) */
  layer: string;
  /** Reason for block */
  reason: string;
  /** The command that was blocked */
  command: string | null;
  /** Correction message */
  correction: string;
  /** Session ID */
  sessionId: string;
}

/**
 * WiredHook — the hook function signature.
 */
export type WiredHook = (
  input: { tool: string; args: Record<string, unknown> },
  output: { args: Record<string, unknown> }
) => Promise<void> | void;
