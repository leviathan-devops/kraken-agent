/**
 * Guardian Hook — tool.execute.before integration
 * 
 * V4.7: Source file edit protection with mechanical enforcement.
 * 
 * Guardian blocks:
 * 1. Direct edits to source files (must duplicate first)
 * 2. Dangerous terminal commands (rm -rf /, dd, mkfs, etc.)
 * 3. In-place modifications via terminal (sed -i, echo >, etc.)
 * 
 * Grace period: Files created < 60 minutes ago can be edited freely.
 */

import type { Hooks } from '@opencode-ai/plugin';
import { Guardian } from '../../shared/guardian.js';
import { extractCommandFromArgs } from './utils.js';
import { getCurrentAgent } from './agent-state.js';

export function createGuardianHook(guardian: Guardian): Hooks['tool.execute.before'] {
  return async (input, output) => {
    const { tool } = input;
    
    // CRITICAL: Only process for shark agent sessions
    // Use shared agent state set by session-hook
    if (!getCurrentAgent()) {
      return;
    }
    
    const args = output as { args: unknown };

    // V4.7: SOURCE FILE EDIT BLOCK - MECHANICAL ENFORCEMENT
    if (tool === 'edit' && args.args) {
      const editArgs = args.args as { filePath?: string };
      if (editArgs?.filePath) {
        const filePath = editArgs.filePath;
        const editCheck = guardian.canEdit(filePath);
        
        if (!editCheck.allowed) {
          throw new Error(`[GUARDIAN] SOURCE_FILE_EDIT_BLOCKED: ${filePath} — Use: terminal command="cp ${filePath} ${filePath}.v1.0.0" then edit the COPY`);
        }
        
        // Register the edit so future edits are allowed
        guardian.registerEdit(filePath);
      }
    }

    // Only check tools that execute commands or write files
    const watchedTools = [
      'terminal', 'mcp_terminal',
      'write_file', 'mcp_write_file',
      'patch', 'mcp_patch'
    ];

    if (!watchedTools.includes(tool)) {
      return;
    }

    // Check for dangerous commands (terminal tools)
    if (tool === 'terminal' || tool === 'mcp_terminal') {
      const command = extractCommandFromArgs(args.args);
      if (command && guardian.isDangerousCommand(command)) {
        throw new Error(`[GUARDIAN] DANGEROUS_COMMAND_BLOCKED`);
      }
      
      if (command) {
        const modifyCheck = guardian.canModifyFile(command);
        if (!modifyCheck.allowed) {
          throw new Error(`[GUARDIAN] SOURCE_FILE_MODIFY_BLOCKED: ${modifyCheck.filePath} — Use edit tool on COPY instead`);
        }
      }
    }

    // Check path-based write permissions (advisory only for non-edit tools)
    if (tool.includes('write_file') || tool.includes('patch')) {
      const a = args.args as Record<string, unknown>;
      const writePath = (a.path as string) || null;
      if (writePath && !guardian.canWrite(writePath)) {
        const zone = guardian.classifyZone(writePath);
        throw new Error(`[GUARDIAN] ZONE_VIOLATION: ${zone} zone — ${writePath}`);
      }
      
      // Register newly created files
      if (writePath) {
        guardian.registerCreate(writePath);
      }
    }

    return;
  };
}