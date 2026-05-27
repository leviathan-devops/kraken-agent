import {
  FirewallContext,
  OperationType,
} from './types.js';
import { IntentClassifier } from './intent-classifier.js';

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
  if (current.length > 0) tokens.push(current);
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
        pipeChain: redirectParts.map((p) => p.trim()).filter(Boolean),
      };
    }
    return { hasPipe: false, pipeChain: [] };
  }
  return {
    hasPipe: true,
    pipeChain: parts.map((p) => p.trim()).filter(Boolean),
  };
}

function extractCommand(outputArgs: Record<string, unknown>): string | null {
  if (typeof outputArgs.command === 'string') {
    return outputArgs.command;
  }
  if (typeof outputArgs.cmd === 'string') {
    return outputArgs.cmd;
  }
  if (typeof outputArgs.script === 'string') {
    return outputArgs.script;
  }
  return null;
}

function extractFileTargets(tool: string, outputArgs: Record<string, unknown>): string[] {
  const targets: string[] = [];
  if (typeof outputArgs.file_path === 'string') {
    targets.push(outputArgs.file_path);
  }
  if (typeof outputArgs.path === 'string') {
    targets.push(outputArgs.path);
  }
  if (typeof outputArgs.filePath === 'string') {
    targets.push(outputArgs.filePath);
  }
  if (typeof outputArgs.file === 'string') {
    targets.push(outputArgs.file);
  }
  if (Array.isArray(outputArgs.files)) {
    for (const f of outputArgs.files) {
      if (typeof f === 'string') targets.push(f);
    }
  }
  return targets;
}

function extractGateTargets(outputArgs: Record<string, unknown>): {
  gate: string;
  action: string;
  passed?: boolean;
  notes?: string;
} {
  return {
    gate: typeof outputArgs.gate === 'string' ? outputArgs.gate : '',
    action: typeof outputArgs.action === 'string' ? outputArgs.action : '',
    passed: typeof outputArgs.passed === 'boolean' ? outputArgs.passed : undefined,
    notes: typeof outputArgs.notes === 'string' ? outputArgs.notes : undefined,
  };
}

/**
 * buildContext constructs a FirewallContext from raw hook data.
 * This is the single point where raw hook input/output is normalized
 * into the structured context consumed by all layer engines and pattern matchers.
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
  const fileTargets = extractFileTargets(tool, output.args);
  const gateTargets = extractGateTargets(output.args);

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
