/**
 * Agent Session State
 * 
 * Tracks which agent is currently active in the session.
 * Used by hooks to determine if they should process.
 */

let currentAgentName: string | undefined = undefined;

export function setCurrentAgent(agent: string | undefined): void {
  currentAgentName = agent;
}

export function getCurrentAgent(): string | undefined {
  return currentAgentName;
}

export function clearCurrentAgent(): void {
  currentAgentName = undefined;
}