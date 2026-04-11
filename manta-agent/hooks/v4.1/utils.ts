/**
 * Hook utilities for Shark V4 V4.1
 * 
 * Helper functions for extracting data from OpenCode hook inputs.
 */

export function extractPathFromToolArgs(args: unknown): string | null {
  if (!args) return null;
  const a = args as Record<string, unknown>;
  return (a.path as string) || (a.workdir as string) || null;
}

export function extractCommandFromArgs(args: unknown): string | null {
  if (!args) return null;
  const a = args as Record<string, unknown>;
  return (a.command as string) || (a.cmd as string) || null;
}

export function isBuildTool(tool: string): boolean {
  const buildTools = ['write_file', 'mcp_write_file', 'patch', 'mcp_patch', 'terminal', 'mcp_terminal', 'cp', 'mv', 'mkdir'];
  return buildTools.includes(tool);
}

export function isTestTool(tool: string, args: unknown): boolean {
  if (tool !== 'terminal' && tool !== 'mcp_terminal') return false;
  const cmd = extractCommandFromArgs(args) || '';
  return /\b(test|jest|vitest|pytest|ruby|rspec)\b/.test(cmd);
}
