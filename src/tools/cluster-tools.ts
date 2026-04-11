/**
 * src/tools/cluster-tools.ts
 * 
 * Cluster Tools for Kraken
 * 
 * Tools for spawning tasks in clusters:
 * - spawn_cluster_task: Generic task spawning
 * - spawn_shark_agent: Spawn Shark agent (aggressive/steamroll)
 * - spawn_manta_agent: Spawn Manta agent (precise/linear)
 */

import { tool, type ToolContext } from '@opencode-ai/plugin';
import { z } from 'zod';
import type { KrakenDelegationRequest, TaskPriority } from '../factory/kraken-types.js';

const spawnClusterTaskSchema = z.object({
  task: z.string().describe('Task description to execute'),
  clusterId: z.string().optional().describe('Target cluster ID (auto-selected if not specified)'),
  targetAgent: z.string().optional().describe('Specific agent ID to target'),
  context: z.record(z.string(), z.unknown()).optional().describe('Additional context for the task'),
  acceptanceCriteria: z.array(z.string()).default([]).describe('Acceptance criteria for task completion'),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal').describe('Task priority'),
});

const spawnSharkAgentSchema = z.object({
  task: z.string().describe('Task description for Shark agent'),
  clusterId: z.string().optional().describe('Target cluster (auto-selected if not specified)'),
  instructions: z.string().optional().describe('Additional instructions for the Shark'),
  context: z.record(z.string(), z.unknown()).optional().describe('Additional context'),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('high').describe('Task priority'),
});

const spawnMantaAgentSchema = z.object({
  task: z.string().describe('Task description for Manta agent'),
  clusterId: z.string().optional().describe('Target cluster (auto-selected if not specified)'),
  instructions: z.string().optional().describe('Additional instructions for the Manta'),
  context: z.record(z.string(), z.unknown()).optional().describe('Additional context'),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal').describe('Task priority'),
});

export interface ClusterToolsContext {
  delegationEngine: {
    delegate(request: KrakenDelegationRequest): Promise<any>;
  };
  clusterScheduler: {
    assignCluster(request: KrakenDelegationRequest): Promise<string>;
    assignClusterForTaskType(task: string, taskType?: string): string;
    resolveClusterRequest(clusterIdOrFocus: string): string;
    anchorClusterToFocus(clusterId: string, focusName: string): void;
    getFocusAnchors(): Map<string, string>;
  };
  clusterManager: {
    getClusterStatus(clusterId: string): any;
    getAllClusterStatuses(): Map<string, any>;
  };
}

export function createClusterTools(ctx: ClusterToolsContext) {
  return {
    /**
     * anchor_cluster - Anchor a cluster to a project/task focus
     * The cluster will be associated with this focus name for smart routing
     */
    anchor_cluster: tool({
      description: 'Anchor a cluster to a focus/project name. The cluster will be renamed to reflect its current focus. Use this when starting a new project to establish cluster identity.',
      args: {
        clusterId: z.string().describe('Cluster ID (e.g., cluster-alpha) or focus name to anchor'),
        focusName: z.string().describe('Focus/project name to anchor (e.g., "shark-firewall-build", "my-api-project")'),
      },
      execute: async (args) => {
        // Resolve the actual cluster ID first
        const resolvedClusterId = ctx.clusterScheduler.resolveClusterRequest(args.clusterId);
        
        // Anchor it to the focus
        ctx.clusterScheduler.anchorClusterToFocus(resolvedClusterId, args.focusName);

        return JSON.stringify({
          success: true,
          clusterId: resolvedClusterId,
          focusName: args.focusName,
          message: `Cluster ${resolvedClusterId} anchored to "${args.focusName}"`,
        }, null, 2);
      },
    }),

    /**
     * spawn_cluster_task - Spawn a generic task in a cluster for async execution
     */
    spawn_cluster_task: tool({
      description: 'Spawn a task in a cluster for async execution. Cluster ID is auto-resolved from focus names. Tasks are queued and executed asynchronously by available agents.',
      args: {
        task: z.string().describe('Task description to execute'),
        clusterId: z.string().optional().describe('Target cluster ID or focus name (auto-selected if not specified)'),
        targetAgent: z.string().optional().describe('Specific agent ID to target'),
        context: z.record(z.string(), z.unknown()).optional().describe('Additional context for the task'),
        acceptanceCriteria: z.array(z.string()).default([]).describe('Acceptance criteria for task completion'),
        priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal').describe('Task priority'),
      },
      execute: async (args, directory) => {
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Smart cluster resolution - handles focus names, partial matches
        const resolvedCluster = args.clusterId 
          ? ctx.clusterScheduler.resolveClusterRequest(args.clusterId)
          : await ctx.clusterScheduler.assignCluster({ taskId, task: args.task, targetCluster: '', context: args.context, acceptanceCriteria: [], priority: 'normal', createdAt: Date.now() });

        // Build the request
        const request: KrakenDelegationRequest = {
          taskId,
          task: args.task,
          targetCluster: resolvedCluster,
          targetAgent: args.targetAgent,
          context: args.context,
          acceptanceCriteria: args.acceptanceCriteria,
          priority: args.priority as TaskPriority,
          createdAt: Date.now(),
        };

        // Queue the task
        const result = await ctx.delegationEngine.delegate(request);

        return JSON.stringify({
          success: result.success,
          taskId: result.taskId,
          clusterId: result.clusterId,
          agentId: result.agentId,
          status: result.status,
          error: result.error,
        }, null, 2);
      },
    }),

    /**
     * spawn_shark_agent - Spawn a Shark agent for aggressive/steamroll tasks
     */
    spawn_shark_agent: tool({
      description: 'Spawn a Shark agent for aggressive, steamroll-style tasks. Sharks are best for building from scratch and tackling complex problems head-on.',
      args: {
        task: z.string().describe('Task description for Shark agent'),
        clusterId: z.string().optional().describe('Target cluster (auto-selected if not specified)'),
        targetAgent: z.string().optional().describe('Specific agent ID to target'),
        instructions: z.string().optional().describe('Additional instructions for the Shark'),
        context: z.record(z.string(), z.unknown()).optional().describe('Additional context'),
        priority: z.enum(['low', 'normal', 'high', 'critical']).default('high').describe('Task priority'),
      },
      execute: async (args, directory) => {
        const taskId = `shark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Build Shark-specific prompt
        const sharkPrompt = `You are SHARK - Ferrari V12 turbo vibecoding engineer.

CHARACTER:
- Aggressive, steamrolls through problems
- Figures shit out and builds it
- Builds from scratch at a solid level
- Full speed ahead, no hesitation

TASK: ${args.task}

${args.instructions ? `\nADDITIONAL INSTRUCTIONS:\n${args.instructions}` : ''}

Execute with maximum aggression and confidence.`;

        // Smart cluster resolution - handles focus names, partial matches
        const resolvedCluster = args.clusterId 
          ? ctx.clusterScheduler.resolveClusterRequest(args.clusterId)
          : ctx.clusterScheduler.assignClusterForTaskType(args.task, 'steamroll');

        const request: KrakenDelegationRequest = {
          taskId,
          task: sharkPrompt,
          targetCluster: resolvedCluster,
          targetAgent: args.targetAgent,
          context: {
            ...args.context,
            agentType: 'shark',
          },
          acceptanceCriteria: [],
          priority: args.priority as TaskPriority,
          createdAt: Date.now(),
        };

        const result = await ctx.delegationEngine.delegate(request);

        return JSON.stringify({
          success: result.success,
          taskId: result.taskId,
          clusterId: result.clusterId,
          agentId: result.agentId,
          agentType: 'shark',
          status: result.status,
          error: result.error,
        }, null, 2);
      },
    }),

    /**
     * spawn_manta_agent - Spawn a Manta agent for precise/linear tasks
     */
    spawn_manta_agent: tool({
      description: 'Spawn a Manta agent for precise, linear tasks. Mantas are best for debugging, testing, and methodical work.',
      args: {
        task: z.string().describe('Task description for Manta agent'),
        clusterId: z.string().optional().describe('Target cluster (auto-selected if not specified)'),
        targetAgent: z.string().optional().describe('Specific agent ID to target'),
        instructions: z.string().optional().describe('Additional instructions for the Manta'),
        context: z.record(z.string(), z.unknown()).optional().describe('Additional context'),
        priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal').describe('Task priority'),
      },
      execute: async (args, directory) => {
        const taskId = `manta_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Build Manta-specific prompt
        const mantaPrompt = `You are MANTA - Tesla Model S agent.

CHARACTER:
- Fast, reliable, linear, precise
- Mechanically oriented
- Perfect for debugging and linear tasks
- Methodical, follows specs exactly

TASK: ${args.task}

${args.instructions ? `\nADDITIONAL INSTRUCTIONS:\n${args.instructions}` : ''}

Execute with precision and methodical care.`;

        // Smart cluster resolution - handles focus names, partial matches
        const resolvedCluster = args.clusterId 
          ? ctx.clusterScheduler.resolveClusterRequest(args.clusterId)
          : ctx.clusterScheduler.assignClusterForTaskType(args.task, 'debug');

        const request: KrakenDelegationRequest = {
          taskId,
          task: mantaPrompt,
          targetCluster: resolvedCluster,
          targetAgent: args.targetAgent,
          context: {
            ...args.context,
            agentType: 'manta',
          },
          acceptanceCriteria: [],
          priority: args.priority as TaskPriority,
          createdAt: Date.now(),
        };

        const result = await ctx.delegationEngine.delegate(request);

        return JSON.stringify({
          success: result.success,
          taskId: result.taskId,
          clusterId: result.clusterId,
          agentId: result.agentId,
          agentType: 'manta',
          status: result.status,
          error: result.error,
        }, null, 2);
      },
    }),
  };
}
