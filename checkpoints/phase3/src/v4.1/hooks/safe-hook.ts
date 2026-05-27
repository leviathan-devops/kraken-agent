/**
 * src/v4.1/hooks/safe-hook.ts
 * 
 * Agent-aware safe hook wrapper with mandatory safety checks.
 * Every hook MUST check agent identity before executing plugin logic.
 */

import { HOOK_EXECUTION_TIMEOUT_MS } from '../config/constants.js';
import type { HookContext } from '../context/hook-context.js';
import { createHookContext } from '../context/hook-context.js';
import { getSessionState } from '../state/session-state.js';
import { createLogger } from '../utils/logger.js';

// Default plugin name for when identity is not configured
const DEFAULT_PLUGIN_NAME = 'v4-boilerplate';

export interface HookOptions {
  /** 
   * Agent filter — only fire for these agents.
   * null = fire for all agents (opt-out, use carefully)
   * [] = fire for no agents (disable)
   */
  agentFilter?: string[] | null;
  /** Required phase to fire. null = any phase */
  requiredPhase?: string | null;
  /** Timeout in ms. Default from constants */
  timeout?: number;
  /** Plugin name for logging */
  pluginName?: string;
  /** Managed agents for identity check */
  managedAgents?: Set<string>;
  /** Agent prefix */
  agentPrefix?: string;
  /** Orchestrator name */
  orchestratorName?: string;
}

export type HookHandler<I = unknown, O = unknown> = (
  input: I,
  output: O,
  ctx: HookContext
) => Promise<void>;

export function safeHook<I = unknown, O = unknown>(
  handler: HookHandler<I, O>,
  options: HookOptions = {}
): (input: I, output: O) => Promise<void> {
  const {
    agentFilter = [],
    requiredPhase = null,
    timeout = HOOK_EXECUTION_TIMEOUT_MS,
    pluginName = DEFAULT_PLUGIN_NAME,
    managedAgents = new Set(),
    agentPrefix = '',
    orchestratorName = '',
  } = options;

  const logger = createLogger(pluginName);

  // Create agent awareness for this plugin
  const awareness = {
    isMyAgent(agentName: string | undefined): boolean {
      if (!agentName) return false;
      if (managedAgents.has(agentName)) return true;
      if (agentName.startsWith(agentPrefix)) return true;
      if (agentName === orchestratorName) return true;
      return false;
    },
    isMyOrchestrator(agentName: string | undefined): boolean {
      return agentName === orchestratorName;
    },
    isVanillaAgent(agentName: string | undefined): boolean {
      return ['plan', 'build', 'general', 'explore'].includes(agentName ?? '');
    },
    isOtherPluginAgent(agentName: string | undefined): boolean {
      if (!agentName) return false;
      return (
        !['plan', 'build', 'general', 'explore'].includes(agentName) &&
        !managedAgents.has(agentName) &&
        !agentName.startsWith(agentPrefix) &&
        agentName !== orchestratorName
      );
    },
  };

  return async (input: I, output: O): Promise<void> => {
    // Create context (includes session state)
    const ctx = createHookContext(
      input,
      awareness,
      getSessionState,
      logger
    );

    // AGENT FILTER — Critical safety check
    if (agentFilter !== null && agentFilter.length > 0) {
      if (!ctx.isMyAgent()) {
        return; // Not our agent, skip
      }
      if (!agentFilter.includes(ctx.agentName ?? '')) {
        return; // Not in filter list, skip
      }
    }

    // PHASE FILTER — Optional phase awareness
    if (requiredPhase !== null && ctx.phase !== requiredPhase) {
      return; // Wrong phase, skip
    }

    // Inject session state into context
    const sessionState = getSessionState(ctx.sessionID);
    ctx.getSessionState = () => sessionState;

    // TIMEOUT + ERROR HANDLING
    const startTime = Date.now();
    try {
      await Promise.race([
        handler(input, output, ctx),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error(`Hook timeout after ${timeout}ms`)),
            timeout
          )
        ),
      ]);
    } catch (err) {
      ctx.log.error(`Hook error in ${handler.name ?? 'anonymous'}`, {
        error: err instanceof Error ? err.message : String(err),
        duration: Date.now() - startTime,
        sessionID: ctx.sessionID,
        agentName: ctx.agentName,
      });
      // Never propagate — hook errors are silent failures
    }
  };
}

export function safeHookInputOnly<I = unknown>(
  handler: (input: I, ctx: HookContext) => Promise<void>,
  options: HookOptions = {}
): (input: I, output: unknown) => Promise<void> {
  return safeHook(async (input: I, _output: unknown, ctx: HookContext) => {
    await handler(input, ctx);
  }, options);
}

export function safeHookSync<I = unknown, O = unknown>(
  handler: (input: I, output: O, ctx: HookContext) => void,
  options: HookOptions = {}
): (input: I, output: O) => Promise<void> {
  return safeHook(async (input: I, output: O, ctx: HookContext) => {
    handler(input, output, ctx);
  }, options);
}
