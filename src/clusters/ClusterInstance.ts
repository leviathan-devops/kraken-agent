/**
 * src/clusters/ClusterInstance.ts
 * 
 * Cluster Instance for Kraken
 * 
 * Individual cluster runtime with async task queue and parallel execution.
 * Each cluster processes tasks asynchronously with its pool of agents.
 */

import type { 
  ClusterConfig, 
  ClusterLoad,
  KrakenDelegationRequest, 
  KrakenDelegationResult,
  ClusterAgentInstance 
} from '../factory/kraken-types.js';

export class ClusterInstance {
  private config: ClusterConfig;
  private agents: Map<string, ClusterAgentInstance>;
  private taskQueue: Array<{
    request: KrakenDelegationRequest;
    resolve: (result: KrakenDelegationResult) => void;
    reject: (error: Error) => void;
  }>;
  private completedTasks: KrakenDelegationResult[];
  private failedTasks: KrakenDelegationResult[];
  private processing: boolean;
  private load: ClusterLoad;
  private shutdownFlag: boolean;

  constructor(config: ClusterConfig) {
    this.config = config;
    this.agents = new Map();
    this.taskQueue = [];
    this.completedTasks = [];
    this.failedTasks = [];
    this.processing = false;
    this.shutdownFlag = false;

    // Initialize load tracking
    this.load = {
      clusterId: config.id,
      activeTasks: 0,
      pendingTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      lastActivity: Date.now(),
    };

    // Initialize agents from config
    this.initializeAgents();

    // Start async processing
    this.startProcessing();
  }

  private initializeAgents(): void {
    for (const agentId of this.config.agents) {
      const agentType = agentId.startsWith('shark-') ? 'shark' : 'manta';
      this.agents.set(agentId, {
        id: agentId,
        agentType,
        busy: false,
        clusterId: this.config.id,
      });
    }
  }

  private startProcessing(): void {
    if (this.processing) return;
    this.processing = true;

    // Non-blocking async processing loop
    this.processLoop();
  }

  private async processLoop(): Promise<void> {
    const pendingOps: Promise<void>[] = [];

    while (!this.shutdownFlag) {
      // Find available agents and dequeue tasks
      const availableAgents = this.getAvailableAgents();
      const tasksToRun = Math.min(availableAgents.length, this.taskQueue.length);

      if (tasksToRun === 0 && pendingOps.length === 0) {
        // No work to do and no pending ops, wait before checking again
        await this.sleep(100);
        continue;
      }

      // Wait for any pending operations if queue is empty but ops are in flight
      if (tasksToRun === 0 && pendingOps.length > 0) {
        await Promise.all(pendingOps);
        pendingOps.length = 0;
        continue;
      }

      // Dequeue tasks and execute
      for (let i = 0; i < tasksToRun; i++) {
        const task = this.taskQueue.shift();
        if (!task) break;

        const agent = availableAgents[i];
        if (agent) {
          // Execute task and track the pending operation
          const op = this.executeTaskAsync(agent, task.request)
            .then(result => {
              task.resolve(result);
            })
            .catch(error => {
              task.reject(error instanceof Error ? error : new Error(String(error)));
            });
          pendingOps.push(op);
        }
      }
    }

    // Wait for all pending operations before exiting
    if (pendingOps.length > 0) {
      await Promise.all(pendingOps);
    }

    this.processing = false;
  }

  private async executeTaskAsync(
    agent: ClusterAgentInstance,
    request: KrakenDelegationRequest
  ): Promise<KrakenDelegationResult> {
    // Mark agent as busy
    agent.busy = true;
    agent.currentTaskId = request.taskId;
    this.load.activeTasks++;
    this.load.pendingTasks = Math.max(0, this.load.pendingTasks - 1);
    this.load.lastActivity = Date.now();

    try {
      // Execute the task
      // In v1, we simulate task execution
      // In full implementation, this would spawn the actual agent
      const result = await this.simulateTaskExecution(agent, request);

      // Record result
      if (result.success) {
        this.completedTasks.push(result);
        this.load.completedTasks++;
      } else {
        this.failedTasks.push(result);
        this.load.failedTasks++;
      }

      return result;
    } finally {
      // Mark agent as available
      agent.busy = false;
      agent.currentTaskId = undefined;
      this.load.activeTasks = Math.max(0, this.load.activeTasks - 1);
      this.load.lastActivity = Date.now();
    }
  }

  private async simulateTaskExecution(
    agent: ClusterAgentInstance,
    request: KrakenDelegationRequest
  ): Promise<KrakenDelegationResult> {
    // In v1, we just return a success result
    // Full implementation would actually execute the agent with the task
    
    return new Promise(resolve => {
      // Simulate some processing time
      setTimeout(() => {
        resolve({
          success: true,
          taskId: request.taskId,
          clusterId: this.config.id,
          agentId: agent.id,
          status: 'completed',
          completedAt: Date.now(),
        });
      }, 100);
    });
  }

  private getAvailableAgents(): ClusterAgentInstance[] {
    const available: ClusterAgentInstance[] = [];
    
    for (const agent of this.agents.values()) {
      if (!agent.busy) {
        available.push(agent);
      }
    }

    return available;
  }

  /**
   * Enqueue a task for async execution
   */
  enqueueTask(request: KrakenDelegationRequest): Promise<KrakenDelegationResult> {
    this.load.pendingTasks++;
    this.load.lastActivity = Date.now();

    return new Promise((resolve, reject) => {
      this.taskQueue.push({ request, resolve, reject });
    });
  }

  /**
   * Get current load
   */
  getLoad(): ClusterLoad {
    return {
      ...this.load,
      clusterId: this.config.id,
    };
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): ClusterAgentInstance | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all agents in this cluster
   */
  getAllAgents(): ClusterAgentInstance[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get cluster config
   */
  getConfig(): ClusterConfig {
    return this.config;
  }

  /**
   * Get completed tasks
   */
  getCompletedTasks(): KrakenDelegationResult[] {
    return [...this.completedTasks];
  }

  /**
   * Get failed tasks
   */
  getFailedTasks(): KrakenDelegationResult[] {
    return [...this.failedTasks];
  }

  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.taskQueue.length;
  }

  /**
   * Shutdown the cluster gracefully
   */
  async shutdown(): Promise<void> {
    this.shutdownFlag = true;

    // Wait for active tasks to complete (with timeout)
    const startTime = Date.now();
    const timeout = 5000; // 5 second timeout

    while (this.load.activeTasks > 0 && Date.now() - startTime < timeout) {
      await this.sleep(100);
    }

    // Cancel remaining queued tasks
    for (const task of this.taskQueue) {
      task.reject(new Error('Cluster shutting down'));
    }
    this.taskQueue = [];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
