/**
 * src/factory/AgentFactory.ts
 *
 * V4 Agent Factory
 *
 * Creates agent instances from templates or configs.
 */

import type { AgentDefinition, AgentTemplate, AgentOverride } from './types.js';

export class AgentFactory {
  private templates: Map<string, AgentTemplate>;

  constructor(templates: AgentTemplate[] = []) {
    this.templates = new Map(templates.map(t => [t.id, t]));
  }

  registerTemplate(template: AgentTemplate): void {
    this.templates.set(template.id, template);
  }

  createAgent(
    id: string,
    templateId: string,
    overrides?: AgentOverride
  ): AgentDefinition | null {
    const template = this.templates.get(templateId);
    if (!template) {
      console.error(`[AgentFactory] Template "${templateId}" not found`);
      return null;
    }

    return {
      id,
      name: id,
      mode: 'subagent',
      description: template.description,
      capabilities: [...template.capabilities],
      allowedTools: [...template.tools],
      maxConcurrentTasks: overrides?.maxConcurrentTasks ?? 1,
      prompt: overrides?.prompt ?? template.prompt,
      model: overrides?.model ?? template.defaultModel,
      temperature: overrides?.temperature ?? template.defaultTemperature,
    };
  }

  createFromConfig(
    id: string,
    config: Partial<AgentDefinition>
  ): AgentDefinition {
    return {
      id,
      name: config.name ?? id,
      mode: config.mode ?? 'subagent',
      description: config.description ?? '',
      capabilities: config.capabilities ?? [],
      allowedTools: config.allowedTools ?? [],
      maxConcurrentTasks: config.maxConcurrentTasks ?? 1,
      prompt: config.prompt,
      model: config.model,
      temperature: config.temperature,
    };
  }

  listTemplates(): AgentTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplate(id: string): AgentTemplate | undefined {
    return this.templates.get(id);
  }
}
