/**
 * src/factory/validators.ts
 *
 * V4 Factory Validators
 *
 * Validates architecture, brain, agent, and cluster configurations.
 */

import type {
  ArchitectureConfig,
  BrainConfig,
  AgentDefinition,
  ClusterConfig,
  ValidationResult,
  Validator,
} from './types.js';

export function validateRequiredFields(
  config: ArchitectureConfig
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config.name) errors.push('Architecture name is required');
  if (!config.version) errors.push('Architecture version is required');
  if (!config.brain) errors.push('Brain configuration is required');
  if (!config.agents || Object.keys(config.agents).length === 0) {
    errors.push('At least one agent is required');
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateBrainReferences(
  config: ArchitectureConfig
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const agentIds = new Set(Object.keys(config.agents));

  if (config.brain.type === 'single') {
    const orchestrator = (config.brain as any).orchestrator;
    if (!agentIds.has(orchestrator)) {
      errors.push(`Orchestrator "${orchestrator}" not found in agents`);
    }
  }

  if (config.brain.type === 'dual' || config.brain.type === 'trio') {
    const orchestrators = (config.brain as any).orchestrators;
    for (const [id, agentId] of Object.entries(orchestrators)) {
      if (!agentIds.has(agentId as string)) {
        errors.push(`Orchestrator "${id}" references agent "${agentId}" not found`);
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateAgentReferences(config: ArchitectureConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const [agentId, agentDef] of Object.entries(config.agents)) {
    if (typeof agentDef === 'string') continue; // Template reference

    if (agentDef.cluster && !config.clusters.find(c => c.id === agentDef.cluster)) {
      errors.push(`Agent "${agentId}" references cluster "${agentDef.cluster}" not found`);
    }

    if (agentDef.brain && !config.brain) {
      errors.push(`Agent "${agentId}" references brain "${agentDef.brain}" not found`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateClusterIntegrity(config: ArchitectureConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const agentIds = new Set(Object.keys(config.agents));

  for (const cluster of config.clusters) {
    for (const agentId of cluster.agents) {
      if (!agentIds.has(agentId)) {
        errors.push(`Cluster "${cluster.id}" references agent "${agentId}" not found`);
      }
    }

    if (cluster.subOrchestrator && !agentIds.has(cluster.subOrchestrator)) {
      errors.push(`Cluster "${cluster.id}" references subOrchestrator "${cluster.subOrchestrator}" not found`);
    }

    if (cluster.parentCluster && !config.clusters.find(c => c.id === cluster.parentCluster)) {
      errors.push(`Cluster "${cluster.id}" references parentCluster "${cluster.parentCluster}" not found`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateToolPermissions(config: ArchitectureConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const [agentId, agentDef] of Object.entries(config.agents)) {
    if (typeof agentDef === 'string') continue;

    // Check for dangerous tool combinations
    const dangerousCombos = [
      { tools: ['write', 'bash'], reason: 'write + bash can execute arbitrary code' },
    ];

    for (const combo of dangerousCombos) {
      const hasAll = combo.tools.every(t => agentDef.allowedTools.includes(t));
      if (hasAll) {
        warnings.push(`Agent "${agentId}" has ${combo.tools.join(' + ')}: ${combo.reason}`);
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateStateOwnership(config: ArchitectureConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // This is a placeholder for domain ownership validation
  // In a real implementation, you would check that each brain
  // only writes to domains it owns

  return { valid: errors.length === 0, errors, warnings };
}

export function validateWorkflowGates(config: ArchitectureConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (config.brain.type === 'dual' || config.brain.type === 'trio') {
    const workflows = (config.brain as any).workflows;
    for (const [orchestratorId, workflow] of Object.entries(workflows)) {
      // Check that all delegation targets exist
      for (const delegateId of (workflow as any).delegatesTo) {
        if (!Object.keys(config.agents).includes(delegateId as string)) {
          errors.push(`Workflow "${orchestratorId}" delegates to "${delegateId}" not found`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateAgent(agent: AgentDefinition): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!agent.id) errors.push('Agent ID is required');
  if (!agent.name) errors.push('Agent name is required');
  if (!agent.description) warnings.push('Agent description is missing');

  if (agent.maxConcurrentTasks < 1) {
    errors.push('maxConcurrentTasks must be at least 1');
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateCluster(cluster: ClusterConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!cluster.id) errors.push('Cluster ID is required');
  if (!cluster.name) errors.push('Cluster name is required');
  if (!cluster.agents || cluster.agents.length === 0) {
    errors.push('Cluster must have at least one agent');
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateBrain(brain: BrainConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!brain.type) errors.push('Brain type is required');
  if (!brain.name) errors.push('Brain name is required');

  const validTypes = ['single', 'dual', 'trio', 'custom'];
  if (brain.type && !validTypes.includes(brain.type)) {
    errors.push(`Brain type must be one of: ${validTypes.join(', ')}`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function runValidators(
  config: ArchitectureConfig
): ValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  const validators: Validator<ArchitectureConfig>[] = [
    validateRequiredFields,
    validateBrainReferences,
    validateAgentReferences,
    validateClusterIntegrity,
    validateToolPermissions,
    validateStateOwnership,
    validateWorkflowGates,
  ];

  for (const validator of validators) {
    const result = validator(config);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

export const architectureValidators = {
  validateRequiredFields,
  validateBrainReferences,
  validateAgentReferences,
  validateClusterIntegrity,
  validateToolPermissions,
  validateStateOwnership,
  validateWorkflowGates,
  validateAgent,
  validateCluster,
  validateBrain,
  runValidators,
};
