/**
 * src/factory/ArchitectureFactory.ts
 *
 * V4 Architecture Factory
 *
 * Assembles the complete architecture from config.
 */

import type {
  ArchitectureConfig,
  ArchitectureInstance,
  AgentDefinition,
  StateMachine,
} from './types.js';
import { createStateStore, createBrainMessenger } from './index.js';
import { AgentFactory } from './AgentFactory.js';
import { BrainFactory } from './BrainFactory.js';
import { ClusterFactory } from './ClusterFactory.js';
import { runValidators } from './validators.js';

export class ArchitectureFactory {
  private agentFactory: AgentFactory;
  private brainFactory: BrainFactory;
  private clusterFactory: ClusterFactory;

  constructor() {
    this.agentFactory = new AgentFactory();
    this.brainFactory = new BrainFactory();
    this.clusterFactory = new ClusterFactory();
  }

  registerAgentTemplate(template: import('./types.js').AgentTemplate): void {
    this.agentFactory.registerTemplate(template);
  }

  createArchitecture(config: ArchitectureConfig): ArchitectureInstance | null {
    // Validate first
    const validation = runValidators(config);
    if (!validation.valid) {
      console.error('[ArchitectureFactory] Validation failed:', validation.errors);
      return null;
    }

    // Create agents
    const agents = new Map<string, AgentDefinition>();
    for (const [id, agentDef] of Object.entries(config.agents)) {
      if (typeof agentDef === 'string') {
        // Template reference
        const agent = this.agentFactory.createAgent(id, agentDef);
        if (!agent) {
          console.error(`[ArchitectureFactory] Failed to create agent "${id}" from template`);
          return null;
        }
        agents.set(id, agent);
      } else {
        // Full definition
        const agent = this.agentFactory.createFromConfig(id, agentDef);
        agents.set(id, agent);
      }
    }

    // Create brain
    const brain = this.brainFactory.createBrain(config.brain);
    if (!brain) {
      console.error('[ArchitectureFactory] Failed to create brain');
      return null;
    }

    // Create clusters
    const clusters = new Map<string, import('./types.js').ClusterConfig>();
    for (const clusterConfig of config.clusters) {
      clusters.set(clusterConfig.id, clusterConfig);
    }

    // Create coordination
    const coordination = this.createCoordination(agents, config);

    // Create state store and messenger
    const stateStore = createStateStore();
    const messenger = createBrainMessenger();

    return {
      config,
      agents,
      clusters,
      brains: {
        type: brain.type,
        primary: brain.primary,
        all: brain.all,
        workflows: brain.workflows,
        syncMode: brain.syncMode,
      },
      coordination,
      stateStore,
      messenger,
    };
  }

  private createCoordination(
    agents: Map<string, AgentDefinition>,
    _config: ArchitectureConfig
  ): ArchitectureInstance['coordination'] {
    // Create registry
    const registry: import('./types.js').AgentRegistry = {
      getAgent: (agentId: string) => agents.get(agentId) ?? null,
      getAgentsByMode: (mode: string) =>
        Array.from(agents.values()).filter(a => a.mode === mode),
      getAgentsByCluster: (clusterId: string) =>
        Array.from(agents.values()).filter(a => a.cluster === clusterId),
      isAgentAllowedTool: (agentId: string, toolName: string) => {
        const agent = agents.get(agentId);
        return agent?.allowedTools.includes(toolName) ?? false;
      },
      listAgents: () => Array.from(agents.values()),
    };

    // Create delegation engine (placeholder)
    const delegation: import('./types.js').DelegationEngine = {
      delegate: async (request) => {
        console.log('[DelegationEngine] Delegating:', request);
        return { success: true, taskId: `task_${Date.now()}` };
      },
      canDelegate: (fromAgent: string, toAgent: string) => {
        const from = agents.get(fromAgent);
        const to = agents.get(toAgent);
        if (!from || !to) return false;
        return from.capabilities.includes('delegate');
      },
      getClusterAgents: (clusterId: string) =>
        Array.from(agents.values()).filter(a => a.cluster === clusterId),
      enforceGate: (request) => ({ allowed: true }),
    };

    // Create state machine (placeholder)
    const taskStore = new Map<string, import('./types.js').Task>();

    const stateMachine: StateMachine = {
      createTask: (input) => {
        const task: import('./types.js').Task = {
          id: input.id,
          status: 'pending',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          assignedAgent: input.assignedAgent,
          context: input.context,
        };
        taskStore.set(input.id, task);
        return task;
      },
      transition: (taskId, to) => {
        const task = taskStore.get(taskId);
        if (!task) return null;
        task.status = to;
        task.updatedAt = Date.now();
        return task;
      },
      getTask: (taskId) => taskStore.get(taskId) ?? null,
      getTasksByState: (state) =>
        Array.from(taskStore.values()).filter((t) => t.status === state),
      getTasksByAgent: (agentId) =>
        Array.from(taskStore.values()).filter((t) => t.assignedAgent === agentId),
      canTransition: (taskId, _to) => {
        const task = taskStore.get(taskId);
        return task !== undefined;
      },
    };

    return { registry, delegation, stateMachine };
  }

  getAgentFactory(): AgentFactory {
    return this.agentFactory;
  }

  getBrainFactory(): BrainFactory {
    return this.brainFactory;
  }

  getClusterFactory(): ClusterFactory {
    return this.clusterFactory;
  }
}

export function createArchitectureFactory(): ArchitectureFactory {
  return new ArchitectureFactory();
}
