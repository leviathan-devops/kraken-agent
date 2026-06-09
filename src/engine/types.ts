/**
 * src/engine/types.ts
 *
 * Canonical type definitions for the Kraken v1.4 Warhead Engine.
 * All warheads import from this file. Zero runtime behavior.
 *
 * P2: All types use strict unions. No `any`. No unchecked casts.
 * P6: No runtime imports — pure type definitions.
 * P11: Every type is used by at least one warhead.
 */

// ============================================================
// HOOK TYPES
// ============================================================

/** Hook point identifiers matching opencode plugin hook names */
export type HookPoint = 'tool.before' | 'tool.after' | 'system.transform' | 'chat.message' | 'compacting';

/** Verdict returned by every hook handler */
export type Verdict = 'PASS' | 'BLOCK' | 'WARN';

/** Context passed to every hook handler */
export interface HookContext {
  toolName: string;
  agentName: string;
  args: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/** Result returned by every hook handler */
export interface HookResult {
  verdict: Verdict;
  reason: string;
  correction?: string;
}

/** A single enforcement hook registered by a warhead */
export interface EnforcementHook {
  hookPoint: HookPoint;
  priority: number;
  layer: string;
  description: string;
  handler: (ctx: HookContext) => HookResult;
}

// ============================================================
// ENGINE STATE
// ============================================================

/** Engine-level state snapshot passed to synthesize() */
export interface EngineState {
  activeTentacles: number;
  activeAgents: number;
  totalBlocks: number;
  lastGate?: string;
  timestamp: number;
  [key: string]: unknown;
}

// ============================================================
// DIAGNOSTICS
// ============================================================

/** Diagnostic output from a warhead's self-check */
export interface WarheadDiagnosis {
  name: string;
  healthy: boolean;
  hooksRegistered: number;
  blocksIssued: number;
  knowledgeLoaded: boolean;
  lastSynthesized: number;
  errors: string[];
}

/** Event recorded when a warhead blocks a tool call */
export interface BlockEvent {
  layer: string;
  reason: string;
  toolName: string;
  agentName: string;
  timestamp: string;
}

// ============================================================
// KNOWLEDGE
// ============================================================

/** Knowledge library identifier */
export type KnowledgeLibraryName = 'AGENT_IDENTITY' | 'ALGORITHMIC_SYSTEMS' | 'RUNTIME_GRADE' | 'TYPESCRIPT_DEEP';

/** Path to knowledge content within a library */
export interface KnowledgePath {
  library: KnowledgeLibraryName;
  files: string[];
  rules: string[];
}

// ============================================================
// WARHEAD INTERFACE
// ============================================================

/** Warhead priority classification */
export type WarheadPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * THE WARHEAD INTERFACE — every warhead must implement this.
 * No partial implementations. No stubs. No empty handlers.
 */
export interface Warhead {
  readonly name: string;
  readonly priority: WarheadPriority;
  readonly knowledgeDependencies: KnowledgePath[];
  loadKnowledge(base: import('../knowledge/knowledge-base.js').KnowledgeBase): void;
  synthesize(state: EngineState): string;
  getHooks(): EnforcementHook[];
  diagnose(): WarheadDiagnosis;
  recordBlock(event: BlockEvent): void;
  getState(): Record<string, unknown>;
}
