/**
 * src/v4.1/index.ts
 * 
 * V4.1 Plugin Isolation Framework — Re-exports
 * 
 * Use this module to access v4.1 guardrail infrastructure.
 */

// Hooks
export {
  safeHook,
  safeHookInputOnly,
  safeHookSync,
  type HookOptions,
  type HookHandler,
} from './hooks/safe-hook.js';

export {
  composeHandlers,
  composeHandlersSync,
} from './hooks/compose-handlers.js';

// Context
export {
  createAgentAwareness,
  DEFAULT_AWARENESS,
  type AgentAwareness,
} from './context/agent-awareness.js';

export {
  createHookContext,
  createAgentAwarenessContext,
  type HookContext,
  type SessionState,
} from './context/hook-context.js';

// State
export {
  getSessionState,
  clearSessionState,
  getActiveSessions,
  getSessionCount,
  hasSession,
  type SessionData,
} from './state/session-state.js';

export {
  initPluginConfig,
  getPluginConfig,
  recordToolMetric,
  getToolMetrics,
  getToolMetric,
  resetToolMetrics,
  getStateStore,
  createStateStore,
  DOMAIN_OWNERSHIP,
} from './state/global-state.js';

// Config
export {
  PLUGIN_IDENTITY,
  isMyAgent,
  isMyOrchestrator,
  isPrimary,
  isSubagent,
  getAllAgents,
  getPrimaryAgents,
  getSubagents,
  type PluginIdentity,
} from './config/identity.js';

export {
  toSDKConfig,
  registerAgents,
  registerAgent,
  type AgentSDKConfig,
} from './config/agent-registration.js';

export {
  HOOK_EXECUTION_TIMEOUT_MS,
  HEALTH_CHECK_TIMEOUT_MS,
  FALLBACK_DIR,
  MAX_FALLBACK_FILE_SIZE,
} from './config/constants.js';

// Utils
export { createLogger, type Logger } from './utils/logger.js';
