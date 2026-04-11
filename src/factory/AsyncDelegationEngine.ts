/**
 * src/factory/AsyncDelegationEngine.ts
 * 
 * Async Delegation Engine for Kraken
 * 
 * Handles Promise-based async task delegation across clusters.
 * Tasks are queued and executed asynchronously with priority support.
 */

import type {
  KrakenDelegationRequest,
  KrakenDelegationResult,
  TaskPriority,
  QueuedTask,
} from './kraken-types.js';
import { ClusterScheduler } from './ClusterScheduler.js';
import { ClusterManager } from '../clusters/ClusterManager.js';

export class AsyncDelegationEngine {
  private pendingTasks: Map<string, KrakenDelegationRequest>;
  private activeTasks: Map<string, KrakenDelegationResult>;
  private taskQueue: QueuedTask[];
  private clusterScheduler: ClusterScheduler;
  private clusterManager: ClusterManager;
  private processing: boolean;

  constructor(
    clusterConfigs: import('./kraken-types.js').ClusterConfig[], 
    clusters: ClusterManager,
    scheduler?: ClusterScheduler
  ) {
    this.pendingTasks = new Map();
    this.activeTasks = new Map();
    this.taskQueue = [];
    this.clusterManager = clusters;
    this.clusterScheduler = scheduler || new ClusterScheduler(clusterConfigs);
    this.processing = false;

    // Start the async processing loop
    this.startProcessingLoop();
  }

  /**
   * Queue a task for async execution
   */
  async delegate(request: KrakenDelegationRequest): Promise<KrakenDelegationResult> {
    // Generate taskId if empty
    if (!request.taskId) {
      request.taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }

    // Add to pending
    this.pendingTasks.set(request.taskId, request);

    // Determine cluster assignment
    const clusterId = request.targetCluster || await this.clusterScheduler.assignCluster(request);
    if (!request.targetCluster) {
      request.targetCluster = clusterId;
    }


    let resolvePromise: (result: KrakenDelegationResult) => void;
    let rejectPromise: (error: Error) => void;
    const resultPromise = new Promise<KrakenDelegationResult>((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });

    // Enqueue with priority
    this.enqueueWithPriority({
      request,
      resolve: resolvePromise!,
      reject: rejectPromise!,
      enqueuedAt: Date.now(),
    }, request.priority);

    return resultPromise;
  }

  /**
   * Enqueue task with priority ordering
   */
  private enqueueWithPriority(task: QueuedTask, priority: TaskPriority): void {
    const priorityOrder: Record<TaskPriority, number> = {
      critical: 0,
      high: 1,
      normal: 2,
      low: 3,
    };

    const taskPriority = priorityOrder[priority];

    // Find insertion point based on priority
    let insertIndex = this.taskQueue.findIndex(q => {
      const qPriority = priorityOrder[q.request.priority];
      return qPriority > taskPriority;
    });

    if (insertIndex === -1) {
      insertIndex = this.taskQueue.length;
    }

    this.taskQueue.splice(insertIndex, 0, task);

    // Trigger processing if not already running
    if (!this.processing) {
      this.processQueue();
    }
  }

  /**
   * Process queued tasks asynchronously
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift();
      if (!task) break;

      // Execute task without awaiting it here to allow parallel processing
      this.executeTask(task.request)
        .then(result => {
          task.resolve(result);
        })
        .catch(error => {
          task.reject(error instanceof Error ? error : new Error(String(error)));
        });
    }

    this.processing = false;
  }

  /**
   * Start the processing loop (non-blocking)
   */
  private startProcessingLoop(): void {
    // Ensure processing flag starts as false
    this.processing = false;
  }

  /**
   * Execute a single task
   */
  private async executeTask(request: KrakenDelegationRequest): Promise<KrakenDelegationResult> {
    // Move from pending to active
    this.pendingTasks.delete(request.taskId);

    const result: KrakenDelegationResult = {
      success: false,
      taskId: request.taskId,
      clusterId: request.targetCluster,
      status: 'in_progress',
    };

    this.activeTasks.set(request.taskId, result);

    // Increment cluster load
    this.clusterScheduler.incrementLoad(request.targetCluster);

     try {
       // Execute via cluster manager
       const execResult = await this.clusterManager.executeTask(
         request.targetCluster,
         request
       );

       result.success = execResult.success;
       result.agentId = execResult.agentId;
       result.clusterId = execResult.clusterId;
       result.status = execResult.success ? 'completed' : 'failed';
       result.completedAt = Date.now();

       if (execResult.error) {
         result.error = execResult.error;
       }

       // Record completion and decrement cluster load
       this.clusterScheduler.recordCompletion(request.targetCluster, execResult.success);
       
       // Keep in activeTasks with completed/failed status so waitForCompletion can find it
       this.activeTasks.set(request.taskId, result);

       return result;
     } catch (error) {
       result.success = false;
       result.status = 'failed';
       result.error = String(error);
       result.completedAt = Date.now();

       // Record completion (as failure) and decrement cluster load
       this.clusterScheduler.recordCompletion(request.targetCluster, false);
       
       // Keep in activeTasks with failed status so waitForCompletion can find it
       this.activeTasks.set(request.taskId, result);

       return result;
     }
  }

  /**
   * Wait for a specific task to complete
   */
  async waitForCompletion(taskId: string, timeoutMs: number = 60000): Promise<KrakenDelegationResult | null> {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      const result = this.activeTasks.get(taskId);
      if (result && (result.status === 'completed' || result.status === 'failed')) {
        return result;
      }
      // Check pending queue too
      if (this.pendingTasks.has(taskId)) {
        await this.sleep(50);
        continue;
      }
      // Check if still queued
      const queued = this.taskQueue.find(t => t.request.taskId === taskId);
      if (queued) {
        await this.sleep(50);
        continue;
      }
      break;
    }

    // If we have a result, return it
    const existing = this.activeTasks.get(taskId);
    if (existing && existing.status !== 'in_progress') {
      return existing;
    }

    // Timed out
    return null;
  }

  /**
   * Wait for multiple tasks to complete
   */
  async waitForAll(taskIds: string[], timeoutMs: number = 60000): Promise<(KrakenDelegationResult | null)[]> {
    const promises = taskIds.map(id => this.waitForCompletion(id, timeoutMs));
    return Promise.all(promises);
  }

  /**
   * Get current pending tasks
   */
  getPendingTasks(): KrakenDelegationRequest[] {
    return Array.from(this.pendingTasks.values());
  }

  /**
   * Get active tasks
   */
  getActiveTasks(): Map<string, KrakenDelegationResult> {
    return new Map(this.activeTasks);
  }

  /**
   * Get queued tasks count
   */
  getQueuedCount(): number {
    return this.taskQueue.length;
  }

  /**
   * Cancel a pending or in-progress task
   */
  cancelTask(taskId: string): boolean {
    // Remove from pending
    if (this.pendingTasks.has(taskId)) {
      this.pendingTasks.delete(taskId);
      return true;
    }

    // Remove from queue
    const queueIndex = this.taskQueue.findIndex(t => t.request.taskId === taskId);
    if (queueIndex !== -1) {
      const task = this.taskQueue.splice(queueIndex, 1)[0];
      task.resolve({
        success: false,
        taskId,
        clusterId: task.request.targetCluster,
        status: 'cancelled',
      });
      return true;
    }

    // Remove from active tasks - mark as cancelled
    if (this.activeTasks.has(taskId)) {
      const activeTask = this.activeTasks.get(taskId);
      if (activeTask) {
        activeTask.status = 'cancelled';
        activeTask.completedAt = Date.now();
      }
      return true;
    }

    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
