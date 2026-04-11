import { tool } from '@opencode-ai/plugin';
import { z } from 'zod';
import { executePythonWrapper, loggerObj } from '../utils/cli.js';
import path from 'path';

const WRAPPERS_DIR = path.join(__dirname, '..', '..', 'wrappers');

export function createSubagentTools() {
  return {
    run_subagent_task: tool({
      description: 'Spawn a single OpenCode container sub-agent to execute a task. Returns structured JSON result.',
      args: {
        task: z.string().describe('The task for the sub-agent'),
        model: z.string().default('minimax/MiniMax-M2.7').describe('Model to use'),
        workspace: z.string().describe('Host directory to mount at /workspace'),
        timeout: z.number().default(60).describe('Timeout in seconds'),
        cleanup: z.boolean().default(true).describe('Kill container after completion'),
      },
      execute: async (args) => {
        loggerObj.info(`Running sub-agent task: ${args.task.substring(0, 50)}...`);
        
        const cmdArgs = [
          '--task', args.task,
          '--model', args.model,
          '--workspace', args.workspace,
          '--timeout', args.timeout.toString(),
        ];

        if (args.cleanup) {
          cmdArgs.push('--cleanup');
        }

        try {
          const result = await executePythonWrapper(path.join(WRAPPERS_DIR, 'opencode_agent.py'), cmdArgs);
          
          if (result.exitCode !== 0) {
            return JSON.stringify({
              success: false,
              error: `CLI Error (Exit ${result.exitCode}): ${result.stderr}`,
            });
          }

          return result.stdout; // Already JSON from Python wrapper
        } catch (err) {
          return JSON.stringify({
            success: false,
            error: `Invocation Error: ${err instanceof Error ? err.message : String(err)}`,
          });
        }
      },
    }),

    run_parallel_tasks: tool({
      description: 'Run multiple tasks in parallel using a pool of OpenCode container sub-agents.',
      args: {
        tasks: z.array(z.object({
          task: z.string(),
          model: z.string().default('minimax/MiniMax-M2.7'),
          timeout: z.number().default(60),
        })).describe('List of tasks to execute in parallel'),
        workspace: z.string().describe('Host directory to mount at /workspace for all agents'),
        poolSize: z.number().default(3).describe('Number of containers to spawn'),
      },
      execute: async (args) => {
        loggerObj.info(`Running parallel sub-agents. Pool size: ${args.poolSize}`);
        
        const shim = `
import sys
sys.path.insert(0, '${WRAPPERS_DIR.replace(/\\/g, '\\\\')}')
from container_pool import ContainerPool
import json

pool = ContainerPool(size=${args.poolSize})
pool.start()
results = pool.run_all(json.loads('''${JSON.stringify(args.tasks)}'''))
pool.cleanup()
print(json.dumps(results))
`;
        
        try {
          const result = await executePythonWrapper('/usr/bin/python3', ['-c', shim]); 
          
          if (result.exitCode !== 0) {
            return JSON.stringify({
              success: false,
              error: `Parallel Error (Exit ${result.exitCode}): ${result.stderr}`,
            });
          }

          return result.stdout; // Already JSON from Python wrapper
        } catch (err) {
          return JSON.stringify({
            success: false,
            error: `Parallel Invocation Error: ${err instanceof Error ? err.message : String(err)}`,
          });
        }
      },
    }),

    cleanup_subagents: tool({
      description: 'Forcefully kill all active OpenCode sub-agent containers in the pool.',
      args: {},
      execute: async () => {
        try {
          const result = await executePythonWrapper(path.join(WRAPPERS_DIR, 'container_pool.py'), ['--kill-all']);
          return JSON.stringify({
            success: true,
            message: result.stdout || 'All sub-agent containers killed.'
          });
        } catch (err) {
          return JSON.stringify({
            success: false,
            error: String(err),
          });
        }
      },
    }),
  };
}
