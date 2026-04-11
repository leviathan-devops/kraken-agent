/**
 * src/factory/ClusterFactory.ts
 *
 * V4 Cluster Factory
 *
 * Creates cluster instances from configurations.
 */

import type { ClusterConfig, ClusterInstance, AgentDefinition } from './types.js';

export class ClusterFactory {
  createCluster(
    config: ClusterConfig,
    agents: Map<string, AgentDefinition>
  ): ClusterInstance | null {
    const clusterAgents: AgentDefinition[] = [];

    for (const agentId of config.agents) {
      const agent = agents.get(agentId);
      if (!agent) {
        console.error(`[ClusterFactory] Agent "${agentId}" not found`);
        return null;
      }
      clusterAgents.push(agent);
    }

    const subOrchestrator = config.subOrchestrator
      ? agents.get(config.subOrchestrator) ?? undefined
      : undefined;

    return {
      config,
      agents: clusterAgents,
      subOrchestrator,
    };
  }

  validateClusterConfig(config: ClusterConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.id) errors.push('Cluster ID is required');
    if (!config.name) errors.push('Cluster name is required');
    if (!config.agents || config.agents.length === 0) {
      errors.push('Cluster must have at least one agent');
    }

    return { valid: errors.length === 0, errors };
  }

  getClusterAgents(cluster: ClusterInstance): AgentDefinition[] {
    return cluster.agents;
  }

  getPrimaryAgent(cluster: ClusterInstance): AgentDefinition | undefined {
    return cluster.subOrchestrator ?? cluster.agents[0];
  }
}
