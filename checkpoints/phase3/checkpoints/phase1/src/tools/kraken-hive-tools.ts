/**
 * src/tools/kraken-hive-tools.ts
 * 
 * Kraken-Hive Tools (Kraken Only)
 * 
 * Tools for accessing Kraken Hive Mind - ONLY accessible to Kraken orchestrator.
 * These tools are NOT available to Shark or Manta agents.
 */

import { tool } from '@opencode-ai/plugin';
import { z } from 'zod';
import { KrakenHiveEngine, type HivememoryResult, type Pattern, type FailureRecord } from '../kraken-hive/index.js';

export interface KrakenHiveToolsContext {
  krakenHive: KrakenHiveEngine;
  isKrakenAgent: (agentName: string) => boolean;
}

export function createKrakenHiveTools(ctx: KrakenHiveToolsContext) {
  return {
    /**
     * kraken_hive_search - Search Kraken Hive Mind for relevant memories
     * ONLY accessible to Kraken orchestrator
     */
    kraken_hive_search: tool({
      description: 'Search the Kraken Hive Mind for relevant memories, patterns, and past decisions. Only accessible to Kraken orchestrator.',
      args: {
        query: z.string().describe('What to search for'),
        category: z.enum(['all', 'clusters', 'sessions', 'patterns', 'decisions', 'failures']).default('all').describe('Category to search'),
        limit: z.number().default(5).describe('Maximum results to return'),
      },
      execute: async (args) => {
        const results = await ctx.krakenHive.search(args.query, {
          category: args.category,
          limit: args.limit,
        });

        if (results.length === 0) {
          return 'No relevant memories found in Kraken Hive.';
        }

        const formatted = results.map(r => 
          `## [${r.type.toUpperCase()}] ${r.title}\nURI: ${r.uri}\nRelevance: ${r.relevance}\n${r.content ? `\n${r.content.slice(0, 200)}...` : ''}`
        ).join('\n\n---\n\n');

        return `Found ${results.length} relevant memories:\n\n${formatted}`;
      },
    }),

    /**
     * kraken_hive_remember - Store a memory to Kraken Hive Mind
     * ONLY accessible to Kraken orchestrator
     */
    kraken_hive_remember: tool({
      description: 'Store a memory, decision, or pattern to Kraken Hive Mind. Only accessible to Kraken orchestrator.',
      args: {
        key: z.string().describe('Short key/summary for this memory'),
        content: z.string().describe('Full content to remember'),
        category: z.enum(['cluster', 'session', 'pattern', 'decision', 'failure', 'breakthrough']).describe('Category for this memory'),
        targetId: z.string().optional().describe('Cluster or session ID if category requires it'),
      },
      execute: async (args) => {
        try {
          switch (args.category) {
            case 'cluster':
              if (!args.targetId) {
                return 'Error: targetId (cluster ID) required for cluster category';
              }
              await ctx.krakenHive.rememberCluster(args.targetId, args.key, args.content);
              break;
            case 'session':
              if (!args.targetId) {
                return 'Error: targetId (session ID) required for session category';
              }
              await ctx.krakenHive.rememberSession(args.targetId, args.key, args.content);
              break;
            case 'pattern':
              const pattern: Pattern = {
                type: 'pattern',
                id: args.key.replace(/[^a-zA-Z0-9]/g, '_'),
                description: args.key,
                content: args.content,
                createdAt: Date.now(),
              };
              await ctx.krakenHive.rememberPattern(pattern);
              break;
            case 'failure':
              const failure: FailureRecord = {
                id: args.key.replace(/[^a-zA-Z0-9]/g, '_'),
                pattern: args.key,
                cause: args.content,
                createdAt: Date.now(),
              };
              await ctx.krakenHive.rememberFailure(failure);
              break;
            default:
              // Generic remember - store in all relevant categories
              if (args.targetId) {
                await ctx.krakenHive.rememberCluster(args.targetId, args.key, args.content);
              }
              await ctx.krakenHive.rememberSession(`general_${Date.now()}`, args.key, args.content);
          }

          return `Stored to Kraken Hive: [${args.category}] ${args.key}`;
        } catch (error) {
          return `Error storing to Kraken Hive: ${error}`;
        }
      },
    }),

    /**
     * kraken_hive_get_cluster_context - Get all memories for a specific cluster
     * ONLY accessible to Kraken orchestrator
     */
    kraken_hive_get_cluster_context: tool({
      description: 'Get all memories related to a specific cluster. Only accessible to Kraken orchestrator.',
      args: {
        clusterId: z.string().describe('Cluster ID to get context for'),
      },
      execute: async (args) => {
        const context = await ctx.krakenHive.getClusterContext(args.clusterId);

        return JSON.stringify({
          clusterId: context.clusterId,
          recentTasks: context.recentTasks,
          commonPatterns: context.commonPatterns,
          knownFailures: context.knownFailures,
        }, null, 2);
      },
    }),

    /**
     * kraken_hive_inject_context - Inject relevant Hive context into a task
     * ONLY accessible to Kraken architect
     */
    kraken_hive_inject_context: tool({
      description: 'Inject relevant Hive context into a task for an agent. Only accessible to Kraken architect.',
      args: {
        taskId: z.string().describe('Task to inject context into'),
        taskDescription: z.string().describe('Description of the task to get relevant context'),
        includePatterns: z.boolean().default(true).describe('Include pattern memories'),
        includeFailures: z.boolean().default(true).describe('Include failure memories'),
        includePreviousWork: z.boolean().default(true).describe('Include previous work'),
      },
      execute: async (args) => {
        const context = await ctx.krakenHive.getContextForTask(args.taskDescription);

        const injected = {
          taskId: args.taskId,
          injected: true,
          context: {
            patterns: args.includePatterns ? context.patterns : [],
            failures: args.includeFailures ? context.failures : [],
            previousWork: args.includePreviousWork ? context.previousWork : [],
            clusterContext: context.clusterContext,
          },
          summary: `Injected ${context.patterns.length} patterns, ${context.failures.length} failures, ${context.previousWork.length} previous works`,
        };

        return JSON.stringify(injected, null, 2);
      },
    }),
  };
}
