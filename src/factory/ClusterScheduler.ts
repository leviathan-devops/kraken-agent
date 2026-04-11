/**
 * src/factory/ClusterScheduler.ts
 * 
 * Cluster Scheduler for Kraken
 * 
 * Implements least-load scheduling across clusters.
 * Tracks cluster load and assigns tasks to least loaded cluster.
 */

import type { KrakenDelegationRequest, ClusterLoad, ClusterConfig } from './kraken-types.js';

export class ClusterScheduler {
  private clusterConfigs: ClusterConfig[];
  private clusterLoad: Map<string, ClusterLoad>;

  constructor(clusters: ClusterConfig[]) {
    this.clusterConfigs = clusters;
    this.clusterLoad = new Map();

    // Initialize load tracking for each cluster
    for (const cluster of clusters) {
      this.clusterLoad.set(cluster.id, {
        clusterId: cluster.id,
        activeTasks: 0,
        pendingTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        lastActivity: Date.now(),
      });
    }
  }

  /**
   * Assign a cluster based on least-load strategy
   */
  async assignCluster(request: KrakenDelegationRequest): Promise<string> {
    // If specific cluster requested, use it
    if (request.targetCluster) {
      return request.targetCluster;
    }

    // Find least loaded cluster
    let bestCluster = this.clusterConfigs[0]?.id || 'cluster-alpha';
    let minLoad = Infinity;

    for (const cluster of this.clusterConfigs) {
      const load = this.clusterLoad.get(cluster.id);
      const activeLoad = load?.activeTasks ?? 0;
      
      if (activeLoad < minLoad) {
        minLoad = activeLoad;
        bestCluster = cluster.id;
      }
    }

    return bestCluster;
  }

  /**
   * Assign cluster based on task type
   */
  assignClusterForTaskType(task: string, taskType?: string): string {
    const taskLower = task.toLowerCase();

    // Shark-heavy tasks: steamroll, build from scratch
    if (taskLower.includes('build') || 
        taskLower.includes('create') || 
        taskLower.includes('implement') ||
        taskLower.includes('steamroll')) {
      return 'cluster-alpha';
    }

    // Manta precision tasks: debug, fix, test, linear
    if (taskLower.includes('debug') || 
        taskLower.includes('fix') || 
        taskLower.includes('test') ||
        taskLower.includes('verify') ||
        taskLower.includes('lint')) {
      return 'cluster-gamma';
    }

    // Default to balanced beta cluster
    return 'cluster-beta';
  }

  /**
   * Increment load for a cluster (task started)
   */
  incrementLoad(clusterId: string): void {
    const load = this.clusterLoad.get(clusterId);
    if (load) {
      load.activeTasks++;
      load.pendingTasks++;
      load.lastActivity = Date.now();
    }
  }

  /**
   * Decrement load for a cluster (task completed)
   */
  decrementLoad(clusterId: string): void {
    const load = this.clusterLoad.get(clusterId);
    if (load) {
      load.activeTasks = Math.max(0, load.activeTasks - 1);
      load.pendingTasks = Math.max(0, load.pendingTasks - 1);
      load.lastActivity = Date.now();
    }
  }

  /**
   * Record task completion
   */
  recordCompletion(clusterId: string, success: boolean): void {
    const load = this.clusterLoad.get(clusterId);
    if (load) {
      if (success) {
        load.completedTasks++;
      } else {
        load.failedTasks++;
      }
      load.activeTasks = Math.max(0, load.activeTasks - 1);
      load.lastActivity = Date.now();
    }
  }

  /**
   * Get load for a specific cluster
   */
  getClusterLoad(clusterId: string): ClusterLoad | undefined {
    return this.clusterLoad.get(clusterId);
  }

  /**
   * Get load for all clusters
   */
  getAllClusterLoads(): Map<string, ClusterLoad> {
    return new Map(this.clusterLoad);
  }

  /**
   * Get least loaded cluster
   */
  getLeastLoadedCluster(): string {
    let bestCluster = this.clusterConfigs[0]?.id || 'cluster-alpha';
    let minLoad = Infinity;

    for (const [clusterId, load] of this.clusterLoad) {
      if (load.activeTasks < minLoad) {
        minLoad = load.activeTasks;
        bestCluster = clusterId;
      }
    }

    return bestCluster;
  }

  /**
   * Get cluster by ID
   */
  getClusterConfig(clusterId: string): ClusterConfig | undefined {
    return this.clusterConfigs.find(c => c.id === clusterId);
  }

  /**
   * Get all cluster configs
   */
  getAllClusterConfigs(): ClusterConfig[] {
    return this.clusterConfigs;
  }

  /**
   * Get total system load
   */
  getTotalLoad(): { active: number; pending: number; completed: number; failed: number } {
    let active = 0;
    let pending = 0;
    let completed = 0;
    let failed = 0;

    for (const load of this.clusterLoad.values()) {
      active += load.activeTasks;
      pending += load.pendingTasks;
      completed += load.completedTasks;
      failed += load.failedTasks;
    }

    return { active, pending, completed, failed };
  }
}
