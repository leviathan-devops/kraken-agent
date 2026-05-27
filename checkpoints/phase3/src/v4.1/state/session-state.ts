/**
 * src/v4.1/state/session-state.ts
 * 
 * Per-session state isolation.
 * Critical: State is keyed by sessionID, NOT stored globally.
 */

export interface SessionData {
  sessionId: string;
  phase?: string;
  activeAgent?: string;
  createdAt: number;
  lastActivity: number;
  // Plugin-specific fields
  [key: string]: unknown;
}

// Per-session state — session-scoped, NOT global
const sessionStates = new Map<string, SessionData>();

/**
 * Get or create session state for a session.
 * State is automatically cleaned up when session ends (if OpenCode emits session.end).
 */
export function getSessionState(sessionId: string): SessionData {
  let state = sessionStates.get(sessionId);
  if (!state) {
    state = {
      sessionId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
    };
    sessionStates.set(sessionId, state);
  }
  state.lastActivity = Date.now();
  return state;
}

/**
 * Clear session state (called when session ends).
 */
export function clearSessionState(sessionId: string): void {
  sessionStates.delete(sessionId);
}

/**
 * Get all active session IDs.
 * For debugging/monitoring.
 */
export function getActiveSessions(): string[] {
  return Array.from(sessionStates.keys());
}

/**
 * Get session count.
 * For health monitoring.
 */
export function getSessionCount(): number {
  return sessionStates.size;
}

/**
 * Check if a session exists.
 */
export function hasSession(sessionId: string): boolean {
  return sessionStates.has(sessionId);
}
