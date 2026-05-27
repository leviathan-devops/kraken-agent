/**
 * src/clusters/ClusterManager.ts
 * 
 * Cluster Manager for Kraken
 * 
 * Manages 3 concurrent clusters, each with async task execution.
 * Provides unified interface for task assignment and status monitoring.
 */

import type { 
  ClusterConfig, 
  ClusterStatus, 
  ClusterLoad,
  KrakenDelegationRequest, 
  KrakenDelegationResult,
  ClusterAgentInstance 
} from '../factory/kraken-types.js';
import { ClusterInstance } from './ClusterInstance.js';

export class ClusterManager {
  private clusters: Map<string, ClusterInstance>;
  private clusterConfigs: Map<string, ClusterConfig>;

  constructor(clusterConfigs: ClusterConfig[]) {
    this.clusters = new Map();
    this.clusterConfigs = new Map();

    // Initialize all 3 clusters
    for (const config of clusterConfigs) {
      this.clusterConfigs.set(config.id, config);
      this.clusters.set(config.id, new ClusterInstance(config));
    }
  }

  /**
   * Execute a task on a specific cluster
   */
  async executeTask(
    clusterId: string, 
    request: KrakenDelegationRequest
  ): Promise<KrakenDelegationResult> {
    const cluster = this.clusters.get(clusterId);
    
    if (!cluster) {
      return {
        success: false,
        taskId: request.taskId,
        clusterId,
        status: 'failed',
        error: `Cluster ${clusterId} not found`,
      };
    }

    return cluster.enqueueTask(request);
  }

  /**
   * Get status of a specific cluster
   */
  getClusterStatus(clusterId: string): ClusterStatus | null {
    const cluster = this.clusters.get(clusterId);
    const config = this.clusterConfigs.get(clusterId);
    
    if (!cluster || !config) {
      return null;
    }

    const load = cluster.getLoad();

    return {
      clusterId,
      active: true,
      load,
      agents: config.agents,
    };
  }

  /**
   * Get status of all clusters
   */
  getAllClusterStatuses(): Map<string, ClusterStatus> {
    const statuses = new Map<string, ClusterStatus>();
    
    for (const [id, cluster] of this.clusters) {
      const config = this.clusterConfigs.get(id);
      if (config) {
        statuses.set(id, {
          clusterId: id,
          active: true,
          load: cluster.getLoad(),
          agents: config.agents,
        });
      }
    }

    return statuses;
  }

  /**
   * Get least loaded cluster
   */
  getLeastLoadedCluster(): string {
    let bestCluster = 'cluster-alpha';
    let minLoad = Infinity;

    for (const [id, cluster] of this.clusters) {
      const load = cluster.getLoad();
      if (load.activeTasks < minLoad) {
        minLoad = load.activeTasks;
        bestCluster = id;
      }
    }

    return bestCluster;
  }

  /**
   * Get cluster by ID
   */
  getCluster(clusterId: string): ClusterInstance | undefined {
    return this.clusters.get(clusterId);
  }

  /**
   * Get all cluster IDs
   */
  getClusterIds(): string[] {
    return Array.from(this.clusters.keys());
  }

  /**
   * Get cluster config
   */
  getClusterConfig(clusterId: string): ClusterConfig | undefined {
    return this.clusterConfigs.get(clusterId);
  }

  /**
   * Get all agents across all clusters
   */
  getAllAgents(): ClusterAgentInstance[] {
    const agents: ClusterAgentInstance[] = [];

    for (const [clusterId, cluster] of this.clusters) {
      const config = this.clusterConfigs.get(clusterId);
      if (config) {
        for (const agentId of config.agents) {
          const agentType = agentId.startsWith('shark-') ? 'shark' : 'manta';
          const instance = cluster.getAgent(agentId);
          
          agents.push({
            id: agentId,
            agentType,
            busy: instance?.busy ?? false,
            currentTaskId: instance?.currentTaskId,
            clusterId,
          });
        }
      }
    }

    return agents;
  }

  /**
   * Get agents by cluster
   */
  getClusterAgents(clusterId: string): ClusterAgentInstance[] {
    const config = this.clusterConfigs.get(clusterId);
    const cluster = this.clusters.get(clusterId);
    
    if (!config || !cluster) {
      return [];
    }

    return config.agents.map(agentId => {
      const agentType = agentId.startsWith('shark-') ? 'shark' : 'manta';
      const instance = cluster.getAgent(agentId);

      return {
        id: agentId,
        agentType,
        busy: instance?.busy ?? false,
        currentTaskId: instance?.currentTaskId,
        clusterId,
      };
    });
  }

  /**
   * Get total system load across all clusters
   */
  getTotalSystemLoad(): ClusterLoad {
    let activeTasks = 0;
    let pendingTasks = 0;
    let completedTasks = 0;
    let failedTasks = 0;
    let lastActivity = Date.now();

    for (const cluster of this.clusters.values()) {
      const load = cluster.getLoad();
      activeTasks += load.activeTasks;
      pendingTasks += load.pendingTasks;
      completedTasks += load.completedTasks;
      failedTasks += load.failedTasks;
      lastActivity = Math.max(lastActivity, load.lastActivity);
    }

    return {
      clusterId: 'system',
      activeTasks,
      pendingTasks,
      completedTasks,
      failedTasks,
      lastActivity,
    };
  }

  /**
   * Shutdown all clusters gracefully
   */
  async shutdown(): Promise<void> {
    const shutdownPromises: Promise<void>[] = [];

    for (const cluster of this.clusters.values()) {
      shutdownPromises.push(cluster.shutdown());
    }

    await Promise.all(shutdownPromises);
  }
}
