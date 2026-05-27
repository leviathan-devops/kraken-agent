/**
 * src/factory/BrainFactory.ts
 *
 * V4 Brain Factory
 *
 * Creates brain instances from configurations.
 */

import type { BrainConfig, BrainInstance, BrainHierarchy } from './types.js';

export class BrainFactory {
  createBrain(config: BrainConfig): BrainInstance | null {
    switch (config.type) {
      case 'single':
        return this.createSingleBrain(config);
      case 'dual':
        return this.createDualBrain(config);
      case 'trio':
        return this.createTrioBrain(config);
      case 'custom':
        return this.createCustomBrain(config);
      default:
        console.error(`[BrainFactory] Unknown brain type: ${config.type}`);
        return null;
    }
  }

  private createSingleBrain(config: BrainConfig): BrainInstance {
    const singleConfig = config as any;
    return {
      type: 'single',
      primary: singleConfig.orchestrator,
      all: [singleConfig.orchestrator],
      hierarchy: {
        level: 0,
        children: [],
      },
    };
  }

  private createDualBrain(config: BrainConfig): BrainInstance {
    const dualConfig = config as any;
    const orchestratorAgents = Object.values(dualConfig.orchestrators) as string[];
    
    // Create child brain instances for each orchestrator
    const childInstances: BrainInstance[] = orchestratorAgents.map((agentId) => ({
      type: 'single' as const,
      primary: agentId,
      all: [agentId],
      hierarchy: {
        level: 1,
        children: [],
        parent: 'dual-brain',
      },
    }));
    
    return {
      type: 'dual',
      primary: orchestratorAgents[0],
      all: orchestratorAgents,
      hierarchy: {
        level: 0,
        children: childInstances,
      },
      workflows: dualConfig.workflows,
      syncMode: dualConfig.syncMode,
    };
  }

  private createTrioBrain(config: BrainConfig): BrainInstance {
    const trioConfig = config as any;
    const orchestratorAgents = Object.values(trioConfig.orchestrators) as string[];
    
    // Create child brain instances for each orchestrator
    const childInstances: BrainInstance[] = orchestratorAgents.map((agentId) => ({
      type: 'single' as const,
      primary: agentId,
      all: [agentId],
      hierarchy: {
        level: 1,
        children: [],
        parent: 'trio-brain',
      },
    }));
    
    return {
      type: 'trio',
      primary: orchestratorAgents[0],
      all: orchestratorAgents,
      hierarchy: {
        level: 0,
        children: childInstances,
      },
      workflows: trioConfig.workflows,
      syncMode: trioConfig.syncMode,
    };
  }

  private createCustomBrain(config: BrainConfig): BrainInstance {
    return {
      type: 'custom',
      primary: config.name,
      all: [config.name],
      hierarchy: {
        level: 0,
        children: [],
      },
    };
  }

  getBrainType(config: BrainConfig): string {
    return config.type;
  }

  isParallel(config: BrainConfig): boolean {
    return config.type === 'dual' || config.type === 'trio';
  }
}
