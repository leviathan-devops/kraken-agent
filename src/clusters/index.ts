/**
 * src/clusters/index.ts
 *
 * Cluster management for Kraken v1.3.
 * 3 clusters: Alpha (steamroll), Beta (balanced), Gamma (precision).
 */

import * as crypto from 'crypto';
import type { ClusterConfig, ClusterState, TaskDefinition, TaskResult, TaskStatus, TaskType } from '../types.js';
import { ClusterStatus, TaskStatus as TaskStatusEnum } from '../types.js';
import { createLogger } from '../shared/logger.js';

const logger = createLogger('ClusterManager');

const DEFAULT_CLUSTERS: ClusterConfig[] = [
  {
    id: 'cluster-alpha',
    name: 'Alpha Cluster',
    description: 'Primary build cluster — Shark agents for steamroll tasks',
    agents: ['shark-alpha-1', 'shark-alpha-2', 'manta-alpha-1'],
    intraClusterDelegation: true,
    interClusterDelegation: true,
    sharedContext: true,
  },
  {
    id: 'cluster-beta',
    name: 'Beta Cluster',
    description: 'Secondary build cluster — balanced Shark/Manta',
    agents: ['shark-beta-1', 'manta-beta-1', 'manta-beta-2'],
    intraClusterDelegation: true,
    interClusterDelegation: true,
    sharedContext: true,
  },
  {
    id: 'cluster-gamma',
    name: 'Gamma Cluster',
    description: 'Precision cluster — Manta agents for debugging/linear tasks',
    agents: ['manta-gamma-1', 'manta-gamma-2', 'shark-gamma-1'],
    intraClusterDelegation: true,
    interClusterDelegation: true,
    sharedContext: true,
  },
];

export class ClusterManager {
  private clusters: Map<string, ClusterState> = new Map();
  private tasks: Map<string, TaskDefinition> = new Map();

  constructor(configs?: ClusterConfig[]) {
    const clusterConfigs = configs ?? DEFAULT_CLUSTERS;
    for (const config of clusterConfigs) {
      this.clusters.set(config.id, {
        id: config.id,
        status: ClusterStatus.IDLE,
        agents: config.agents,
        activeTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
      });
    }
  }

  createTask(type: TaskType, description: string, criteria: string[], clusterId: string): TaskDefinition | null {
    const cluster = this.clusters.get(clusterId);
    if (!cluster) {
      logger.error(`Cluster not found: ${clusterId}`);
      return null;
    }

    const task: TaskDefinition = {
      id: `task-${crypto.randomUUID().slice(0, 8)}`,
      type,
      description,
      criteria,
      clusterId,
      status: TaskStatusEnum.PENDING,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      retryCount: 0,
      maxRetries: 3,
    };

    this.tasks.set(task.id, task);
    cluster.activeTasks++;
    cluster.status = ClusterStatus.ACTIVE;

    logger.info(`Task created: ${task.id} → ${clusterId} [${type}]`);
    return task;
  }

  getTask(taskId: string): TaskDefinition | null {
    return this.tasks.get(taskId) ?? null;
  }

  updateTaskStatus(taskId: string, status: TaskStatus): boolean {
    const task = this.tasks.get(taskId);
    if (!task) {
      logger.error(`Task not found: ${taskId}`);
      return false;
    }

    const previousStatus = task.status;
    task.status = status;
    task.updatedAt = Date.now();

    // Update cluster counters
    const cluster = this.clusters.get(task.clusterId);
    if (cluster) {
      if (status === TaskStatusEnum.COMPLETE) {
        cluster.completedTasks++;
        cluster.activeTasks = Math.max(0, cluster.activeTasks - 1);
      } else if (status === TaskStatusEnum.ABORTED) {
        cluster.failedTasks++;
        cluster.activeTasks = Math.max(0, cluster.activeTasks - 1);
      }

      if (cluster.activeTasks === 0) {
        cluster.status = ClusterStatus.IDLE;
      }
    }

    logger.info(`Task ${taskId}: ${previousStatus} → ${status}`);
    return true;
  }

  getClusterStatus(clusterId: string): ClusterState | null {
    return this.clusters.get(clusterId) ?? null;
  }

  getClusterForTask(taskType: TaskType): string {
    switch (taskType) {
      case 'BUILD': return 'cluster-alpha';
      case 'DEBUG': return 'cluster-beta';
      case 'TEST': return 'cluster-gamma';
      default: return 'cluster-beta';
    }
  }

  /**
   * P11 FIX: getAllClusters() now includes the actual tasks in each cluster.
   * Previously returned cluster metadata WITHOUT tasks — making spawn appear theatrical
   * because the created task was invisible in cluster status output.
   */
  getAllClusters(): Array<ClusterState & { tasks: TaskDefinition[] }> {
    return Array.from(this.clusters.values()).map((cluster) => {
      // Find all tasks belonging to this cluster
      const clusterTasks: TaskDefinition[] = [];
      for (const task of this.tasks.values()) {
        if (task.clusterId === cluster.id) {
          clusterTasks.push(task);
        }
      }
      return { ...cluster, tasks: clusterTasks };
    });
  }

  getActiveTaskCount(): number {
    let count = 0;
    for (const task of this.tasks.values()) {
      if (task.status === TaskStatusEnum.RUNNING || task.status === TaskStatusEnum.ASSIGNED) {
        count++;
      }
    }
    return count;
  }
}
