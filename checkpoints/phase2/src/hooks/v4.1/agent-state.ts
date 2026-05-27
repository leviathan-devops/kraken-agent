/**
 * Agent Session State
 * 
 * Tracks which agent is currently active in the session.
 * Uses session-based Map to persist across hook invocations.
 * 
 * V4.8.3 FIX: Module-level variable didn't persist between hooks
 * in containerized environment. Using Map keyed by session ID.
 */

interface AgentState {
  agent: string | undefined;
  timestamp: number;
  slopScore: number;
}

const DEFAULT_SESSION = 'default';
const agentBySession = new Map<string, AgentState>();
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

function cleanupStaleSessions(): void {
  const now = Date.now();
  for (const [sessionId, state] of agentBySession.entries()) {
    if (now - state.timestamp > SESSION_TTL_MS) {
      agentBySession.delete(sessionId);
    }
  }
}

export function setCurrentAgent(agent: string | undefined, sessionId?: string): void {
  const sid = sessionId || DEFAULT_SESSION;
  const currentState = agentBySession.get(sid);
  agentBySession.set(sid, {
    agent,
    timestamp: Date.now(),
    slopScore: currentState?.slopScore || 0,
  });
}

export function getCurrentAgent(sessionId?: string): string | undefined {
  cleanupStaleSessions();
  const sid = sessionId || DEFAULT_SESSION;
  const state = agentBySession.get(sid);
  return state?.agent;
}

export function getSlopScore(sessionId?: string): number {
  const sid = sessionId || DEFAULT_SESSION;
  return agentBySession.get(sid)?.slopScore || 0;
}

export function incrementSlopScore(sessionId?: string, amount: number = 1): number {
  const sid = sessionId || DEFAULT_SESSION;
  const state = agentBySession.get(sid);
  if (!state) return 0;
  
  const newScore = state.slopScore + amount;
  agentBySession.set(sid, { ...state, slopScore: newScore });
  return newScore;
}

export function clearCurrentAgent(sessionId?: string): void {
  const sid = sessionId || DEFAULT_SESSION;
  agentBySession.delete(sid);
}

export function getSessionIds(): string[] {
  return Array.from(agentBySession.keys());
}
