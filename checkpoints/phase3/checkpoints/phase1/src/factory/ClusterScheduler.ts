/**
 * src/factory/ClusterScheduler.ts
 * 
 * Cluster Scheduler for Kraken
 * 
 * Implements least-load scheduling across clusters.
 * Supports focus anchoring - clusters can be anchored to project/task focus
 * and auto-renamed to reflect their current focus.
 */

import type { KrakenDelegationRequest, ClusterLoad, ClusterConfig } from './kraken-types.js';

export class ClusterScheduler {
  private clusterConfigs: ClusterConfig[];
  private clusterLoad: Map<string, ClusterLoad>;
  private focusAnchors: Map<string, string>; // focus name -> cluster ID

  constructor(clusters: ClusterConfig[]) {
    this.clusterConfigs = clusters;
    this.clusterLoad = new Map();
    this.focusAnchors = new Map();

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
   * Anchor a cluster to a focus/project
   * The cluster will be associated with this focus name
   */
  anchorClusterToFocus(clusterId: string, focusName: string): void {
    // Normalize focus name (lowercase, replace spaces with hyphens)
    const normalizedFocus = focusName.toLowerCase().replace(/\s+/g, '-');
    this.focusAnchors.set(normalizedFocus, clusterId);
  }

  /**
   * Get the cluster ID for a focus name
   * Returns the anchored cluster or resolves via patterns
   */
  resolveFocusToCluster(focusName: string): string | undefined {
    const normalizedFocus = focusName.toLowerCase().replace(/\s+/g, '-');
    
    // Direct match
    if (this.focusAnchors.has(normalizedFocus)) {
      return this.focusAnchors.get(normalizedFocus);
    }

    // Partial match - check if any anchor starts with this focus
    for (const [anchor, clusterId] of this.focusAnchors) {
      if (anchor.includes(normalizedFocus) || normalizedFocus.includes(anchor)) {
        return clusterId;
      }
    }

    return undefined;
  }

  /**
   * Get focus anchor mappings
   */
  getFocusAnchors(): Map<string, string> {
    return new Map(this.focusAnchors);
  }

  /**
   * Clear all focus anchors
   */
  clearFocusAnchors(): void {
    this.focusAnchors.clear();
  }

  /**
   * Assign a cluster based on least-load strategy
   * Now with smart focus resolution
   */
  async assignCluster(request: KrakenDelegationRequest): Promise<string> {
    // If specific cluster requested, resolve it first
    if (request.targetCluster) {
      return this.resolveClusterRequest(request.targetCluster);
    }

    // Check if task has focus context
    if (request.context?.focus) {
      const focusCluster = this.resolveFocusToCluster(request.context.focus as string);
      if (focusCluster) {
        return focusCluster;
      }
    }

    // Find least loaded cluster
    return this.getLeastLoadedCluster();
  }

  /**
   * Resolve cluster request - handles focus names, partial matches
   */
  resolveClusterRequest(clusterIdOrFocus: string): string {
    const normalized = clusterIdOrFocus.toLowerCase().replace(/\s+/g, '-');
    
    // Direct cluster ID match
    for (const config of this.clusterConfigs) {
      if (config.id.toLowerCase() === normalized) {
        return config.id;
      }
      // Also check name field
      if (config.name?.toLowerCase().replace(/\s+/g, '-') === normalized) {
        return config.id;
      }
    }

    // Try focus resolution
    const focusCluster = this.resolveFocusToCluster(clusterIdOrFocus);
    if (focusCluster) {
      return focusCluster;
    }

    // Try partial match on cluster IDs
    for (const config of this.clusterConfigs) {
      if (config.id.toLowerCase().includes(normalized) || 
          normalized.includes(config.id.toLowerCase())) {
        return config.id;
      }
    }

    // DEFAULT: Return least loaded cluster instead of failing
    return this.getLeastLoadedCluster();
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
