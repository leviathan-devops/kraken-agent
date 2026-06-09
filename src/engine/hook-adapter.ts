/**
 * src/engine/hook-adapter.ts
 *
 * Converts raw opencode SDK hook (input, output) tuples into
 * WarheadEngine HookContext structs.
 *
 * The SDK fires hooks with (input: Record<string, unknown>, output: Record<string, unknown>).
 * The WarheadEngine expects HookContext { toolName, agentName, args, metadata }.
 * This adapter is the bridge between the two.
 *
 * P2: Every field extracted with typeof guard before use.
 * P3: Returns safe defaults on extraction failure — never crashes.
 * P6: Only imports from ./types.js (zero external deps).
 * P9: All functions are synchronous — pure data transformation.
 * P11: Returns real extracted values, not placeholders or empty strings when data exists.
 */

import type { HookContext } from './types.js';

// ============================================================
// TYPE GUARDS (P2 — every `as` cast guarded by runtime check)
// ============================================================

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// ============================================================
// EXTRACTION HELPERS
// ============================================================

function extractString(obj: Record<string, unknown>, key: string, fallback: string = ''): string {
  const val = obj[key];
  return isString(val) ? val : fallback;
}

function extractNestedString(root: Record<string, unknown>, ...path: string[]): string {
  let current: unknown = root;
  for (const key of path) {
    if (!isObject(current)) return '';
    current = current[key];
  }
  return isString(current) ? current : '';
}

// ============================================================
// AGENT NAME EXTRACTION
// ============================================================

/**
 * Extract agent name from the hook input.
 * Checks: input.session.agentName → input.agent → fallback to empty string.
 * Matches the extraction pattern in index.ts tool.execute.before hook.
 */
export function extractAgentName(input: Record<string, unknown>): string {
  // Check session.agentName first (primary path for tool.execute.before)
  const session = input.session;
  if (isObject(session)) {
    const sessionAgent = extractString(session, 'agentName');
    if (sessionAgent) return sessionAgent;
  }
  // Fallback to input.agent (system.transform and other hooks)
  return extractString(input, 'agent');
}

// ============================================================
// TOOL EXECUTION EXTRACTION
// ============================================================

/**
 * Extract tool name from hook input.
 * Reads input.tool (set by the runtime before tool.execute.before fires).
 */
export function extractToolName(input: Record<string, unknown>): string {
  return extractString(input, 'tool');
}

/**
 * Extract tool arguments from the hook.
 * The runtime puts parsed args in output.args for recognized tools,
 * and input.args for unrecognized ones.
 */
export function extractToolArgs(
  input: Record<string, unknown>,
  output: Record<string, unknown>,
): Record<string, unknown> {
  if (isObject(output.args) && Object.keys(output.args).length > 0) {
    return output.args;
  }
  if (isObject(input.args)) {
    return input.args;
  }
  return {};
}

/**
 * Extract session ID from input.
 */
export function extractSessionId(input: Record<string, unknown>): string {
  return extractNestedString(input, 'sessionID');
}

// ============================================================
// HOOK-SPECIFIC ADAPTERS
// ============================================================

/**
 * Convert a tool.execute.before (input, output) pair into a Warhead HookContext.
 * This is the PRIMARY adapter — used for all tool enforcement.
 */
export function adaptToolBeforeContext(
  input: Record<string, unknown>,
  output: Record<string, unknown>,
): HookContext {
  return {
    toolName: extractToolName(input),
    agentName: extractAgentName(input),
    args: extractToolArgs(input, output),
    metadata: {
      sessionId: extractSessionId(input),
      hasOutput: isObject(output) && Object.keys(output).length > 0,
      timestamp: Date.now(),
    },
  };
}

/**
 * Convert a tool.execute.after (input, output) pair into a Warhead HookContext.
 *
 * SDK tool.execute.after signature:
 *   input: { tool: string, sessionID: string, callID: string, args: any }
 *   output: { title: string, output: string, metadata: any }
 *
 * Agent name is NOT available in tool.after input — must be passed through
 * from tool.before via the callAgentMap side channel.
 *
 * P2: typeof guards on all extractions.
 * P3: Returns safe defaults on failure.
 * P6: Only imports from ./types.js.
 * P9: Synchronous.
 * P11: Returns real extracted values — output.metadata contains REAL tool results.
 */
export function adaptToolAfterContext(
  input: Record<string, unknown>,
  output: Record<string, unknown>,
  agentName: string,
): HookContext {
  const toolArgs = isObject(input.args) ? input.args : {};
  const resultMetadata = isObject(output.metadata) ? output.metadata : {};

  return {
    toolName: extractToolName(input),
    agentName,
    args: toolArgs,
    metadata: {
      sessionId: extractNestedString(input, 'sessionID'),
      resultTitle: isString(output.title) ? output.title : '',
      resultOutput: isString(output.output) ? output.output : '',
      ...resultMetadata,
      timestamp: Date.now(),
    },
  };
}

/**
 * Convert a system.transform (input, output) pair into a Warhead HookContext.
 * system.transform hooks care about identity injection tracking, not tool enforcement.
 */
export function adaptTransformContext(
  input: Record<string, unknown>,
  output: Record<string, unknown>,
): HookContext {
  return {
    toolName: 'system.transform',
    agentName: extractAgentName(input),
    args: {
      input,
      output,
      system: Array.isArray(output.system) ? output.system : [],
      sessionId: extractSessionId(input),
    },
    metadata: {
      sessionId: extractSessionId(input),
      timestamp: Date.now(),
    },
  };
}

/**
 * Convert a compacting hook (input, output) pair into a Warhead HookContext.
 */
export function adaptCompactingContext(
  input: Record<string, unknown>,
  output: Record<string, unknown>,
): HookContext {
  return {
    toolName: 'compacting',
    agentName: extractAgentName(input),
    args: {
      input,
      output,
      sessionId: extractSessionId(input),
    },
    metadata: {
      sessionId: extractSessionId(input),
      timestamp: Date.now(),
    },
  };
}

/**
 * Convert a chat.message (input, output) pair into a Warhead HookContext.
 */
export function adaptChatMessageContext(
  input: Record<string, unknown>,
  output: Record<string, unknown>,
): HookContext {
  // Extract user message for chat hooks
  let userMessage = '';
  const outMsg = output.message;
  if (isObject(outMsg)) {
    userMessage = extractString(outMsg, 'content') || extractString(outMsg, 'text');
  } else if (isString(outMsg)) {
    userMessage = outMsg;
  }
  if (!userMessage) {
    const inMsg = input.message;
    if (isString(inMsg)) {
      userMessage = inMsg;
    } else if (isObject(inMsg)) {
      userMessage = extractString(inMsg, 'text') || extractString(inMsg, 'content');
    }
  }

  return {
    toolName: 'chat.message',
    agentName: extractAgentName(input),
    args: {
      userMessage,
      sessionId: extractSessionId(input),
    },
    metadata: {
      sessionId: extractSessionId(input),
      timestamp: Date.now(),
    },
  };
}
