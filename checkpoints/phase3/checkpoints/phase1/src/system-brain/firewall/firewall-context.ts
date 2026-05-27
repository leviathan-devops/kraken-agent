/**
 * src/system-brain/firewall/firewall-context.ts
 *
 * Normalizes raw hook data into FirewallContext.
 * This is the SINGLE POINT where raw hook input is transformed
 * into the structured context consumed by all layer engines.
 *
 * NO logic happens here — only data extraction and transformation.
 */

import {
  FirewallContext,
  KrakenOperationType,
  SessionState,
  GateTargets,
} from './types.ts';
import { IntentClassifier } from './intent-classifier.ts';

// ============================================================
// INPUT/OUTPUT TYPES
// ============================================================

export interface FirewallHookInput {
  tool: string;
  args: Record<string, unknown>;
}

export interface FirewallHookOutput {
  args: Record<string, unknown>;
}

export interface AgentStateInput {
  brainInitialized: boolean;
  evidencePath: string | null;
  currentGate: string | null;
}

// ============================================================
// TOKENIZATION (same logic as intent-classifier.ts)
// ============================================================

function tokenize(command: string): string[] {
  const trimmed = command.trim();
  if (!trimmed) return [];

  const tokens: string[] = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];

    if (inSingle) {
      if (ch === "'") {
        inSingle = false;
      } else {
        current += ch;
      }
    } else if (inDouble) {
      if (ch === '"') {
        inDouble = false;
      } else {
        current += ch;
      }
    } else if (ch === "'") {
      inSingle = true;
    } else if (ch === '"') {
      inDouble = true;
    } else if (ch === ' ' || ch === '\t') {
      if (current.length > 0) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += ch;
    }
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}

function detectPipeChain(command: string): { hasPipe: boolean; pipeChain: string[] } {
  if (!command) return { hasPipe: false, pipeChain: [] };

  const parts = command.split('|');

  if (parts.length < 2) {
    const redirectMatch = command.match(/>/);
    if (redirectMatch) {
      const redirectParts = command.split(/>+/);
      return {
        hasPipe: true,
        pipeChain: redirectParts.map(p => p.trim()).filter(Boolean),
      };
    }
    return { hasPipe: false, pipeChain: [] };
  }

  return {
    hasPipe: true,
    pipeChain: parts.map(p => p.trim()).filter(Boolean),
  };
}

// ============================================================
// FIELD EXTRACTORS
// ============================================================

/**
 * extractCommand — extracts command string from args.
 * Checks common field names in order of preference.
 */
function extractCommand(args: Record<string, unknown>): string | null {
  if (typeof args.command === 'string') return args.command;
  if (typeof args.cmd === 'string') return args.cmd;
  if (typeof args.script === 'string') return args.script;
  return null;
}

/**
 * extractTextField — extracts any text field from args.
 * Checks multiple possible field names.
 * Used for descriptions, notes, messages, etc.
 */
function extractTextField(args: Record<string, unknown>): string {
  // Priority order for text fields
  const fields = [
    'description',
    'notes',
    'message',
    'body',
    'text',
    'reason',
    'content',
    'summary',
    'title',
  ];

  for (const field of fields) {
    if (typeof args[field] === 'string' && (args[field] as string).length > 0) {
      return args[field] as string;
    }
  }

  return '';
}

/**
 * extractPathField — extracts path from args.
 * Checks multiple possible field names with fallbacks.
 */
function extractPathField(args: Record<string, unknown>): string {
  if (typeof args.path === 'string') return args.path;
  if (typeof args.file_path === 'string') return args.file_path;
  if (typeof args.filePath === 'string') return args.filePath;
  if (typeof args.file === 'string') return args.file;
  return '';
}

/**
 * extractFileTargets — extracts all file targets from args.
 * Returns array because some operations have multiple targets.
 */
function extractFileTargets(args: Record<string, unknown>): string[] {
  const targets: string[] = [];

  if (typeof args.file_path === 'string') targets.push(args.file_path);
  if (typeof args.path === 'string') targets.push(args.path);
  if (typeof args.filePath === 'string') targets.push(args.filePath);
  if (typeof args.file === 'string') targets.push(args.file);

  if (Array.isArray(args.files)) {
    for (const f of args.files) {
      if (typeof f === 'string') targets.push(f);
    }
  }

  return targets;
}

/**
 * extractGateTargets — extracts gate-related fields from args.
 * These are used by brain state hooks.
 */
function extractGateTargets(args: Record<string, unknown>): GateTargets {
  return {
    gate: typeof args.gate === 'string' ? args.gate : '',
    action: typeof args.action === 'string' ? args.action : '',
    passed: typeof args.passed === 'boolean' ? args.passed : undefined,
    notes: typeof args.notes === 'string' ? args.notes : undefined,
  };
}

/**
 * extractSessionState — extracts session state from args if present.
 */
function extractSessionState(args: Record<string, unknown>): Partial<SessionState> {
  const state: Partial<SessionState> = {};

  if (typeof args.brainInitialized === 'boolean') {
    state.brainInitialized = args.brainInitialized;
  }
  if (typeof args.evidencePath === 'string') {
    state.evidencePath = args.evidencePath;
  }
  if (typeof args.currentGate === 'string') {
    state.currentGate = args.currentGate;
  }

  return state;
}

// ============================================================
// CONTEXT BUILDER
// ============================================================

/**
 * buildContext — creates a FirewallContext from raw hook data.
 *
 * This is the single point of normalization.
 * All layers receive the same structured context.
 *
 * @param input - Raw hook input (tool, args)
 * @param output - Raw hook output (args)
 * @param intentClassifier - Classifier instance for operation typing
 * @param agentState - Current brain/evidence state
 * @param sessionId - Session identifier
 * @param agent - Agent name
 */
export function buildContext(
  input: FirewallHookInput,
  output: FirewallHookOutput,
  intentClassifier: IntentClassifier,
  agentState: AgentStateInput,
  sessionId: string = '',
  agent: string = '',
): FirewallContext {
  const tool = input.tool || '';
  const command = extractCommand(output.args);
  const commandTokens = command ? tokenize(command) : [];
  const { hasPipe, pipeChain } = command ? detectPipeChain(command) : { hasPipe: false, pipeChain: [] };
  const fileTargets = extractFileTargets(output.args);
  const gateTargets = extractGateTargets(output.args);

  // Classify operation type using intent classifier
  const operationType = intentClassifier.classifyIntent(command, tool, output.args);

  return {
    agent,
    sessionId,
    tool,
    operationType,
    command,
    commandTokens,
    hasPipe,
    pipeChain,
    args: output.args,
    fileTargets,
    gateTargets,
    sessionState: {
      brainInitialized: agentState.brainInitialized,
      evidencePath: agentState.evidencePath,
      currentGate: agentState.currentGate,
    },
  };
}
