/**
 * src/v4.1/state/global-state.ts
 * 
 * Plugin-wide global state.
 * Use for: cumulative metrics, plugin config, read-mostly data.
 * DO NOT use for: per-session state (use session-state.ts instead).
 */

import { createStateStore, DOMAIN_OWNERSHIP, type StateStore, type StateDomain } from '../../factory/index.js';

// Tool metrics — cumulative across all sessions
const toolMetrics = new Map<string, { calls: number; failures: number; totalDuration: number }>();

// Plugin config — set once, read many
let pluginConfig: Record<string, unknown> = {};

/**
 * Initialize plugin config.
 * Called once at plugin initialization.
 */
export function initPluginConfig(config: Record<string, unknown>): void {
  pluginConfig = { ...config };
}

/**
 * Get plugin config.
 */
export function getPluginConfig(): Record<string, unknown> {
  return { ...pluginConfig };
}

/**
 * Record a tool metric.
 * Called after each tool execution.
 */
export function recordToolMetric(
  toolName: string,
  durationMs: number,
  success: boolean
): void {
  const metrics = toolMetrics.get(toolName) ?? {
    calls: 0,
    failures: 0,
    totalDuration: 0,
  };
  metrics.calls++;
  if (!success) metrics.failures++;
  metrics.totalDuration += durationMs;
  toolMetrics.set(toolName, metrics);
}

/**
 * Get all tool metrics.
 */
export function getToolMetrics(): Record<
  string,
  { calls: number; failures: number; totalDuration: number }
> {
  return Object.fromEntries(toolMetrics);
}

/**
 * Get a specific tool's metrics.
 */
export function getToolMetric(toolName: string): { calls: number; failures: number; totalDuration: number } | undefined {
  return toolMetrics.get(toolName);
}

/**
 * Reset tool metrics (for testing).
 */
export function resetToolMetrics(): void {
  toolMetrics.clear();
}

// Re-export StateStore for convenience
export { createStateStore, DOMAIN_OWNERSHIP } from '../../factory/index.js';
export type { StateStore, StateDomain } from '../../factory/index.js';

// Global state store instance
let globalStateStore: StateStore | null = null;

/**
 * Get or create the global state store.
 * Domain ownership enforced per-brain.
 */
export function getStateStore(): StateStore {
  if (!globalStateStore) {
    globalStateStore = createStateStore();
  }
  return globalStateStore;
}
