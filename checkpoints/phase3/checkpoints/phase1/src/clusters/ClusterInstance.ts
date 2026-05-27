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
import { spawn } from 'node:child_process';
import path from 'node:path';

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
      // If no pending operations, try to process tasks
      if (pendingOps.length === 0) {
        // Try to assign tasks to agents
        let madeProgress = false;
        
        for (let i = this.taskQueue.length - 1; i >= 0; i--) {
          const task = this.taskQueue[i];
          if (!task) continue;

          // Get required agent type from task context (if specified)
          const requiredAgentType = task.request.context?.agentType as string | undefined;
          
          // Get available agents filtered by type (if type specified)
          const availableAgents = this.getAvailableAgents(requiredAgentType);
          
          if (availableAgents.length > 0) {
            // Remove task from queue
            this.taskQueue.splice(i, 1);
            
            // Assign to first available agent
            const agent = availableAgents[0];
            
            // Execute task and track the pending operation
            const op = this.executeTaskAsync(agent, task.request)
              .then(result => {
                task.resolve(result);
              })
              .catch(error => {
                task.reject(error instanceof Error ? error : new Error(String(error)));
              });
            pendingOps.push(op);
            madeProgress = true;
          }
        }

        if (!madeProgress) {
          // No tasks could be assigned, wait
          await new Promise(r => setTimeout(r, 100));
        }
      } else {
        // Wait for pending operations to complete
        await Promise.all(pendingOps);
        pendingOps.length = 0;
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
      // REAL execution via Docker container spawning using subagent-manager
      const result = await this.executeOnAgent(agent, request);

      // Record result
      if (result.success) {
        this.completedTasks.push(result);
        this.load.completedTasks++;
      } else {
        this.failedTasks.push(result);
        this.load.failedTasks++;
      }

      return result;
    } catch (error) {
      const failedResult: KrakenDelegationResult = {
        success: false,
        taskId: request.taskId,
        clusterId: this.config.id,
        agentId: agent.id,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        completedAt: Date.now(),
      };
      this.failedTasks.push(failedResult);
      this.load.failedTasks++;
      return failedResult;
    } finally {
      // Mark agent as available
      agent.busy = false;
      agent.currentTaskId = undefined;
      this.load.activeTasks = Math.max(0, this.load.activeTasks - 1);
      this.load.lastActivity = Date.now();
    }
  }

  /**
   * Execute task on agent via REAL Docker container
   * Uses subagent-manager Python wrapper to spawn containers
   */
  private async executeOnAgent(
    agent: ClusterAgentInstance,
    request: KrakenDelegationRequest,
    retryCount: number = 0
  ): Promise<KrakenDelegationResult> {
    const MAX_RETRIES = 2;
    
    const result = await this.spawnAgentTask(agent, request);
    
    // Retry on failure (max 2 retries)
    if (!result.success && retryCount < MAX_RETRIES) {
      console.log(`[ClusterInstance] Retrying failed task ${request.taskId} (attempt ${retryCount + 2}/${MAX_RETRIES + 1})`);
      await new Promise(r => setTimeout(r, 1000)); // Wait 1s before retry
      return this.executeOnAgent(agent, request, retryCount + 1);
    }
    
    return result;
  }

  private spawnAgentTask(
    agent: ClusterAgentInstance,
    request: KrakenDelegationRequest
  ): Promise<KrakenDelegationResult> {
    return new Promise((resolve) => {
      const HOME = process.env.HOME || process.env.USERPROFILE || '/root';
      const KRAKEN_PLUGIN_NAME = process.env.KRAKEN_PLUGIN_NAME || 'kraken-agent';
      const pluginBase = path.join(HOME, '.config', 'opencode', 'plugins', KRAKEN_PLUGIN_NAME);
      const wrapperPath = path.join(pluginBase, 'wrappers', 'opencode_agent.py');

      // Build command args
      const args = [
        '--task', request.task,
        '--model', 'minimax/MiniMax-M2.7',
        '--workspace', process.env.OPENCODE_WORKSPACE || process.cwd() || '/home/leviathan/OPENCODE_WORKSPACE',
        '--timeout', '120',
        '--cleanup',
      ];

      console.log(`[ClusterInstance] Spawning container for agent ${agent.id}`);
      console.log(`[ClusterInstance] Task: ${request.task.substring(0, 100)}...`);

      const proc = spawn('python3', [wrapperPath, ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env },
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      // Timeout after 2 minutes
      const timeout = setTimeout(() => {
        proc.kill('SIGTERM');
        resolve({
          success: false,
          taskId: request.taskId,
          clusterId: this.config.id,
          agentId: agent.id,
          status: 'failed',
          error: 'Task execution timeout after 120 seconds',
          completedAt: Date.now(),
        });
      }, 120000);

      proc.on('close', (exitCode: number | null) => {
        clearTimeout(timeout);

        try {
          let result;
          if (stdout.trim()) {
            result = JSON.parse(stdout.trim());
          } else {
            result = { success: false, error: stderr || 'No output from wrapper' };
          }

          console.log(`[ClusterInstance] Task ${request.taskId} completed: ${result.success ? 'SUCCESS' : 'FAILED'}`);

          resolve({
            success: result.success !== false,
            taskId: request.taskId,
            clusterId: this.config.id,
            agentId: agent.id,
            status: result.success ? 'completed' : 'failed',
            error: result.error,
            completedAt: Date.now(),
          });
        } catch (parseError) {
          console.error(`[ClusterInstance] Parse error: ${parseError}`);
          console.error(`[ClusterInstance] stdout: ${stdout.substring(0, 500)}`);
          console.error(`[ClusterInstance] stderr: ${stderr.substring(0, 500)}`);

          resolve({
            success: false,
            taskId: request.taskId,
            clusterId: this.config.id,
            agentId: agent.id,
            status: 'failed',
            error: `Parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
            completedAt: Date.now(),
          });
        }
      });

      proc.on('error', (error: Error) => {
        clearTimeout(timeout);
        console.error(`[ClusterInstance] Spawn error: ${error.message}`);

        resolve({
          success: false,
          taskId: request.taskId,
          clusterId: this.config.id,
          agentId: agent.id,
          status: 'failed',
          error: `Failed to spawn Python wrapper: ${error.message}`,
          completedAt: Date.now(),
        });
      });
    });
  }

  private getAvailableAgents(agentType?: string): ClusterAgentInstance[] {
    const available: ClusterAgentInstance[] = [];
    
    for (const agent of this.agents.values()) {
      if (!agent.busy) {
        if (agentType === undefined || agent.agentType === agentType) {
          available.push(agent);
        }
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
      await new Promise(r => setTimeout(r, 100));
    }

    // Cancel remaining queued tasks
    for (const task of this.taskQueue) {
      task.reject(new Error('Cluster shutting down'));
    }
    this.taskQueue = [];
  }
}
