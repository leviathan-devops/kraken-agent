/**
 * src/tools/monitoring-tools.ts
 * 
 * Monitoring Tools for Kraken
 * 
 * Tools for checking cluster status and aggregating results:
 * - get_cluster_status: Check cluster or system status
 * - aggregate_results: Wait for and aggregate multiple task results
 */

import { tool } from '@opencode-ai/plugin';
import { z } from 'zod';

const getClusterStatusSchema = z.object({
  clusterId: z.string().optional().describe('Specific cluster ID to check (all clusters if not specified)'),
});

const aggregateResultsSchema = z.object({
  taskIds: z.array(z.string()).describe('List of task IDs to wait for and aggregate'),
  timeoutMs: z.number().default(60000).describe('Timeout in milliseconds to wait for all tasks'),
});

export interface MonitoringToolsContext {
  delegationEngine: {
    waitForCompletion(taskId: string, timeoutMs: number): Promise<any>;
    waitForAll(taskIds: string[], timeoutMs: number): Promise<any[]>;
    getActiveTasks(): Map<string, any>;
    getPendingTasks(): any[];
    getQueuedCount(): number;
  };
  clusterManager: {
    getClusterStatus(clusterId: string): any;
    getAllClusterStatuses(): Map<string, any>;
    getTotalSystemLoad(): any;
    getAllAgents(): any[];
  };
}

export function createMonitoringTools(ctx: MonitoringToolsContext) {
  return {
    /**
     * get_cluster_status - Check cluster status or system-wide status
     */
    get_cluster_status: tool({
      description: 'Get the status of clusters in the Kraken system. Can check a specific cluster or all clusters.',
      args: {
        clusterId: z.string().optional().describe('Specific cluster ID to check (all clusters if not specified)'),
      },
      execute: async (args) => {
        if (args.clusterId) {
          const status = ctx.clusterManager.getClusterStatus(args.clusterId);
          if (!status) {
            return JSON.stringify({
              error: `Cluster ${args.clusterId} not found`,
              availableClusters: Array.from(ctx.clusterManager.getAllClusterStatuses().keys()),
            }, null, 2);
          }
          return JSON.stringify(status, null, 2);
        }

        // Return all cluster statuses + system summary
        const allStatuses = ctx.clusterManager.getAllClusterStatuses();
        const systemLoad = ctx.clusterManager.getTotalSystemLoad();
        const agents = ctx.clusterManager.getAllAgents();

        const summary = {
          clusters: Object.fromEntries(allStatuses),
          system: systemLoad,
          agents: agents,
          delegationQueue: {
            queued: ctx.delegationEngine.getQueuedCount(),
            pending: ctx.delegationEngine.getPendingTasks().length,
            active: ctx.delegationEngine.getActiveTasks().size,
          },
        };

        return JSON.stringify(summary, null, 2);
      },
    }),

    /**
     * aggregate_results - Wait for multiple tasks and aggregate their results
     */
    aggregate_results: tool({
      description: 'Wait for multiple tasks to complete and aggregate their results. Useful for collecting results from parallel cluster execution.',
      args: {
        taskIds: z.array(z.string()).describe('List of task IDs to wait for and aggregate'),
        timeoutMs: z.number().default(60000).describe('Timeout in milliseconds to wait for all tasks'),
      },
      execute: async (args) => {
        const startTime = Date.now();

        // Wait for all tasks
        const results = await ctx.delegationEngine.waitForAll(args.taskIds, args.timeoutMs);

        // Calculate summary
        const successful = results.filter(r => r && r.success).length;
        const failed = results.filter(r => r && !r.success).length;
        const timedOut = results.filter(r => r === null).length;

        // Group by status
        const completed = results.filter(r => r && r.status === 'completed');
        const taskFailed = results.filter(r => r && r.status === 'failed');

        const summary = {
          total: args.taskIds.length,
          successful,
          failed,
          timedOut,
          durationMs: Date.now() - startTime,
          results: results.map((r, i) => ({
            taskId: args.taskIds[i],
            success: r?.success ?? false,
            status: r?.status ?? 'unknown',
            clusterId: r?.clusterId,
            agentId: r?.agentId,
            error: r?.error,
            completedAt: r?.completedAt,
          })),
        };

        return JSON.stringify(summary, null, 2);
      },
    }),

    /**
     * get_agent_status - Check status of agents across clusters
     */
    get_agent_status: tool({
      description: 'Get the status of all agents across all clusters. Shows which agents are busy and what they are working on.',
      args: {},
      execute: async () => {
        const agents = ctx.clusterManager.getAllAgents();

        const summary = {
          total: agents.length,
          busy: agents.filter(a => a.busy).length,
          available: agents.filter(a => !a.busy).length,
          byCluster: agents.reduce((acc, agent) => {
            if (!acc[agent.clusterId]) {
              acc[agent.clusterId] = { total: 0, busy: 0, available: 0, agents: [] };
            }
            acc[agent.clusterId].total++;
            acc[agent.clusterId].busy += agent.busy ? 1 : 0;
            acc[agent.clusterId].available += agent.busy ? 0 : 1;
            acc[agent.clusterId].agents.push({
              id: agent.id,
              type: agent.agentType,
              busy: agent.busy,
              currentTask: agent.currentTaskId,
            });
            return acc;
          }, {} as Record<string, any>),
        };

        return JSON.stringify(summary, null, 2);
      },
    }),
  };
}
