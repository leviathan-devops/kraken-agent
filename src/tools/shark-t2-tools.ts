/**
 * src/tools/shark-t2-tools.ts
 * 
 * Shark/Manta T2 Read-Only Tools
 * 
 * Sharks and Mantas get read-only access to T2 reference library.
 * They do NOT have direct Hive access - they read from curated T2 files.
 */

import { tool } from '@opencode-ai/plugin';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

const T2_LIBRARY_DIR = path.join(__dirname, '..', '..', 'kraken-context');

export interface T2ToolsContext {
  isSharkOrMantaAgent: (agentName: string) => boolean;
}

export function createSharkT2Tools(_ctx: T2ToolsContext) {
  return {
    /**
     * read_kraken_context - Read T2 reference from Kraken context library
     * Available to Sharks and Mantas (read-only, no Hive access)
     */
    read_kraken_context: tool({
      description: 'Read Kraken T2 context library for patterns and best practices. This is read-only reference, not Hive access. Available to Sharks and Mantas.',
      args: {
        topic: z.enum(['patterns', 'failures', 'build-chain', 'architecture']).describe('Topic to get context for'),
      },
      execute: async (args) => {
        const fileName = `T2_${args.topic.toUpperCase()}.md`;
        const filePath = path.join(T2_LIBRARY_DIR, fileName);

        try {
          if (!fs.existsSync(filePath)) {
            return `T2 reference not found for topic: ${args.topic}. This topic may not have been populated yet.`;
          }

          const content = fs.readFileSync(filePath, 'utf-8');
          
          return `## Kraken T2 Reference: ${args.topic}\n\n${content}`;
        } catch (error) {
          return `Error reading T2 context: ${error}`;
        }
      },
    }),

    /**
     * report_to_kraken - Report completion or issue to Kraken orchestrator
     * How Sharks/Mantas communicate back (they don't access Hive directly)
     */
    report_to_kraken: tool({
      description: 'Report completion, issue, or request to Kraken orchestrator. This is how Sharks and Mantas communicate - they write to Kraken, not to each other or directly to Hive.',
      args: {
        taskId: z.string().describe('Task being reported on'),
        status: z.enum(['complete', 'blocked', 'error', 'request']).describe('Task status'),
        details: z.string().describe('Details of completion, issue, or request'),
        files: z.array(z.string()).optional().describe('Files created or modified'),
        errorDetails: z.string().optional().describe('Error details if status is error'),
      },
      execute: async (args) => {
        // In v1, we just format the report
        // In full implementation, this would go through the cluster-state-hook
        // which would then be processed by Kraken
        
        const report = {
          type: 'agent_report',
          taskId: args.taskId,
          status: args.status,
          details: args.details,
          files: args.files || [],
          errorDetails: args.errorDetails,
          timestamp: new Date().toISOString(),
          // Agent info would be added by the hook
        };

        // Store to local fallback for Kraken to pick up
        const reportPath = `/home/leviathan/.local/share/opencode/kraken-hive/pending-reports/${args.taskId}_${Date.now()}.json`;
        const reportDir = path.dirname(reportPath);
        
        if (!fs.existsSync(reportDir)) {
          fs.mkdirSync(reportDir, { recursive: true });
        }
        
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

        return JSON.stringify({
          success: true,
          message: `Report sent to Kraken orchestrator for task ${args.taskId}`,
          reportId: path.basename(reportPath),
        }, null, 2);
      },
    }),

    /**
     * get_task_context - Get context injected by Kraken for current task
     * Sharks/Mantas use this to access the context Kraken injected
     */
    get_task_context: tool({
      description: 'Get the context that Kraken orchestrator has injected into your current task. Use this to understand what context and patterns are relevant to your work.',
      args: {
        taskId: z.string().describe('Task ID to get context for'),
      },
      execute: async (args) => {
        // In v1, read from the injected context file
        // In full implementation, this would be stored in session state by the hook
        const contextPath = `/home/leviathan/.local/share/opencode/kraken-hive/task-context/${args.taskId}.json`;

        try {
          if (!fs.existsSync(contextPath)) {
            return JSON.stringify({
              taskId: args.taskId,
              context: null,
              message: 'No injected context found for this task. Kraken may not have injected context yet.',
            }, null, 2);
          }

          const content = fs.readFileSync(contextPath, 'utf-8');
          return content;
        } catch (error) {
          return JSON.stringify({
            taskId: args.taskId,
            error: `Error reading task context: ${error}`,
          }, null, 2);
        }
      },
    }),
  };
}
