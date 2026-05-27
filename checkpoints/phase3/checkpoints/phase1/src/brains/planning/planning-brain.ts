/**
 * src/brains/planning/planning-brain.ts
 * 
 * V1.2 Planning Brain
 * 
 * Owns: planning-state, context-bridge
 * 
 * Responsibilities:
 * - T2 Master context loading
 * - T1 dynamic generation from SPEC.md
 * - Task decomposition for cluster assignment
 * - Domain designation
 */

import { getStateStore, type StateStore } from '../../shared/state-store.js';
import { getBrainMessenger, type BrainMessenger } from '../../shared/brain-messenger.js';
import type { DomainId } from '../../shared/domain-ownership.js';

export interface TaskSpec {
  id: string;
  type: 'build' | 'debug' | 'test' | 'refactor' | 'analyze' | 'audit';
  description: string;
  targetCluster: 'alpha' | 'beta' | 'gamma';
  outputs?: { path: string; type: 'file' | 'directory'; required: boolean }[];
  priority?: 'critical' | 'high' | 'normal' | 'low';
}

export interface PlanningState {
  t2MasterLoaded: boolean;
  t1Generated: boolean;
  tasksDecomposed: boolean;
  domainsDesignated: boolean;
}

export class PlanningBrain {
  private initialized = false;
  private state: PlanningState = {
    t2MasterLoaded: false,
    t1Generated: false,
    tasksDecomposed: false,
    domainsDesignated: false,
  };
  private stateStore: StateStore;
  private messenger: BrainMessenger;

  constructor(stateStore?: StateStore, messenger?: BrainMessenger) {
    this.stateStore = stateStore || getStateStore();
    this.messenger = messenger || getBrainMessenger();
  }

  initialize(): void {
    if (this.initialized) return;
    
    console.log('[PlanningBrain] Initializing...');
    this.initialized = true;
    
    // Set initial state
    this.stateStore.set('planning-state', 'initialized', true, ['kraken-planning']);
    this.stateStore.set('planning-state', 'brain-id', 'kraken-planning', ['kraken-planning']);
    
    // T2 Master loads from static kraken-context on init
    // Fire-and-forget async load — generateT1 doesn't block on it
    this.loadT2Master().catch(err => {
      console.error('[PlanningBrain] T2 Master load failed:', err);
    });
    
    console.log('[PlanningBrain] Initialized - owns planning-state, context-bridge');
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  // =========================================================================
  // T2 MASTER CONTEXT
  // =========================================================================

  async loadT2Master(): Promise<void> {
    console.log('[PlanningBrain] Loading T2 Master context...');
    
    // Load T2 Master context from kraken-context
    // In real implementation, this loads from kraken-context library
    const t2Context = await this.loadKrakenContext();
    
    this.stateStore.set('planning-state', 't2-master', t2Context, ['kraken-planning']);
    this.state.t2MasterLoaded = true;
    
    // Notify other brains that T2 is loaded
    this.messenger.deliverMessage('kraken-planning', 'kraken-execution', 'context-inject', {
      type: 't2-master-loaded',
      data: { t2MasterLoaded: true }
    }, 'high');
    
    console.log('[PlanningBrain] T2 Master loaded');
  }

  isT2MasterLoaded(): boolean {
    return this.state.t2MasterLoaded;
  }

  private async loadKrakenContext(): Promise<Record<string, unknown>> {
    try {
      const fs = await import('node:fs/promises');
      const path = await import('node:path');
      const contextDir = path.resolve(process.cwd(), 'kraken-context');
      
      const context: Record<string, unknown> = {
        version: '1.2',
        loadedAt: Date.now(),
        sourceDir: contextDir,
      };

      // Load T2 context files from kraken-context/ directory
      try {
        const entries = await fs.readdir(contextDir);
        for (const entry of entries) {
          if (entry.endsWith('.md')) {
            const content = await fs.readFile(path.join(contextDir, entry), 'utf-8');
            context[entry.replace('.md', '')] = content.substring(0, 1000);
          }
        }
        console.log(`[PlanningBrain] Loaded ${entries.length} T2 context files from ${contextDir}`);
      } catch {
        console.log(`[PlanningBrain] No kraken-context/ directory at ${contextDir}, using defaults`);
      }

      // Fallback: check alternative paths
      if (Object.keys(context).length <= 3) {
        const altPaths = [
          path.resolve(process.cwd(), '../kraken-context'),
          path.resolve(process.cwd(), '../../kraken-context'),
        ];
        for (const altDir of altPaths) {
          try {
            const entries = await fs.readdir(altDir);
            for (const entry of entries) {
              if (entry.endsWith('.md')) {
                const content = await fs.readFile(path.join(altDir, entry), 'utf-8');
                context[entry.replace('.md', '')] = content.substring(0, 1000);
              }
            }
            console.log(`[PlanningBrain] Loaded ${entries.length} T2 files from ${altDir}`);
            break;
          } catch { /* try next */ }
        }
      }

      // Always include core capabilities
      context.capabilities = ['planning', 'execution', 'system', 'hive'];
      context.clusterTypes = ['alpha', 'beta', 'gamma'];
      
      return context;
    } catch {
      return {
        version: '1.2',
        loadedAt: Date.now(),
        capabilities: ['planning', 'execution', 'system', 'hive'],
        clusterTypes: ['alpha', 'beta', 'gamma'],
      };
    }
  }

  // =========================================================================
  // T1 DYNAMIC GENERATION
  // =========================================================================

  async generateT1(userRequest: string = ''): Promise<{
    tasks: TaskSpec[];
    context: Record<string, unknown>;
  }> {
    console.log('[PlanningBrain] Generating T1...');
    
    // Try reading SPEC.md from workspace first (blueprint: MUST generate from SPEC.md)
    let specContent = userRequest;
    try {
      const fs = await import('node:fs/promises');
      const path = await import('node:path');
      const specPaths = [
        path.resolve(process.cwd(), 'SPEC.md'),
        path.resolve(process.cwd(), 'spec.md'),
        path.resolve(process.cwd(), 'plan.md'),
      ];
      for (const specPath of specPaths) {
        try {
          await fs.access(specPath);
          specContent = await fs.readFile(specPath, 'utf-8');
          console.log(`[PlanningBrain] Loaded T1 from ${specPath} (${specContent.length} chars)`);
          break;
        } catch { /* try next */ }
      }
    } catch { /* fall back to user request text */ }
    
    // Parse request into tasks — handles markdown headings AND plain text
    const tasks = this.parseRequestIntoTasks(specContent);
    
    const t1 = {
      tasks,
      context: {
        specSource: userRequest.substring(0, 200),
        generatedAt: new Date().toISOString(),
        phases: ['PLAN', 'BUILD', 'TEST', 'VERIFY', 'AUDIT', 'DELIVERY'],
        planningBrain: 'kraken-planning',
      },
    };
    
    this.state.t1Generated = true;
    this.stateStore.set('planning-state', 't1-generated', true, ['kraken-planning']);
    this.stateStore.set('planning-state', 't1-context', t1, ['kraken-planning']);
    
    console.log(`[PlanningBrain] T1 generated: ${tasks.length} tasks`);
    
    return t1;
  }

  private parseRequestIntoTasks(userRequest: string): TaskSpec[] {
    if (!userRequest || userRequest.trim().length === 0) {
      return [];
    }

    const tasks: TaskSpec[] = [];
    let id = 0;
    
    // Strategy 1: Parse markdown headings as task descriptions
    const headingRegex = /^#{1,3}\s+(.+)$/gm;
    let match;
    while ((match = headingRegex.exec(userRequest)) !== null) {
      const description = match[1].trim();
      const type = this.inferTaskType(description);
      tasks.push({
        id: `task-${++id}-${Date.now()}`,
        type,
        description,
        targetCluster: this.assignCluster(type),
        outputs: [],
        priority: 'normal',
      });
    }

    // Strategy 2: If no markdown headings found, create a single task from the user request
    if (tasks.length === 0) {
      // Split by sentences or newlines for multi-step requests
      const steps = userRequest
        .split(/\n+/)
        .map(s => s.trim())
        .filter(s => s.length > 10 && !s.startsWith('#'));

      if (steps.length > 1) {
        // Multiple steps — create individual tasks
        for (const step of steps) {
          const type = this.inferTaskType(step);
          tasks.push({
            id: `task-${++id}-${Date.now()}`,
            type,
            description: step.substring(0, 200),
            targetCluster: this.assignCluster(type),
            outputs: [],
            priority: 'normal',
          });
        }
      } else {
        // Single request — create one task
        const type = this.inferTaskType(userRequest);
        tasks.push({
          id: `task-${++id}-${Date.now()}`,
          type,
          description: userRequest.substring(0, 200),
          targetCluster: this.assignCluster(type),
          outputs: [],
          priority: 'normal',
        });
      }
    }

    return tasks;
  }

  private inferTaskType(description: string): TaskSpec['type'] {
    const lower = description.toLowerCase();
    if (lower.includes('build') || lower.includes('create') || lower.includes('implement') || lower.includes('write')) return 'build';
    if (lower.includes('debug') || lower.includes('fix') || lower.includes('bug') || lower.includes('resolve')) return 'debug';
    if (lower.includes('test') || lower.includes('verify') || lower.includes('validate')) return 'test';
    if (lower.includes('refactor') || lower.includes('restructure')) return 'refactor';
    if (lower.includes('analyze') || lower.includes('review') || lower.includes('examine')) return 'analyze';
    if (lower.includes('audit') || lower.includes('inspect') || lower.includes('assess')) return 'audit';
    return 'build';
  }

  isT1Generated(): boolean {
    return this.state.t1Generated;
  }

  // =========================================================================
  // TASK DECOMPOSITION
  // =========================================================================

  async decomposeTasks(tasks: TaskSpec[]): Promise<TaskSpec[]> {
    console.log('[PlanningBrain] Decomposing tasks for cluster assignment...');
    
    const decomposed = tasks.map(task => ({
      ...task,
      // V1.2: Output declarations are REQUIRED for execution verification
      outputs: task.outputs || [],
      // Assign to cluster based on task type
      targetCluster: this.assignCluster(task.type),
    }));
    
    this.state.tasksDecomposed = true;
    this.stateStore.set('planning-state', 'decomposed-tasks', decomposed, ['kraken-planning']);
    
    console.log(`[PlanningBrain] Decomposed ${decomposed.length} tasks`);
    
    return decomposed;
  }

  assignCluster(taskType: TaskSpec['type']): 'alpha' | 'beta' | 'gamma' {
    // Alpha: steamroll builds - from-scratch, feature, implement
    // Beta: precision tasks - debug, fix, refactor, patch, analyze
    // Gamma: testing - test, verify, audit, integration
    
    const clusterMap: Record<TaskSpec['type'], 'alpha' | 'beta' | 'gamma'> = {
      'build': 'alpha',
      'test': 'gamma',
      'audit': 'gamma',
      'debug': 'beta',
      'refactor': 'beta',
      'analyze': 'beta',
    };
    
    return clusterMap[taskType] || 'alpha';
  }

  isTasksDecomposed(): boolean {
    return this.state.tasksDecomposed;
  }

  // =========================================================================
  // DOMAIN DESIGNATION
  // =========================================================================

  async designateDomains(tasks: TaskSpec[]): Promise<void> {
    console.log('[PlanningBrain] Designating domains for task execution...');
    
    const domainMap: Record<string, DomainId> = {
      'build': 'execution-state',
      'debug': 'thinking-state',
      'test': 'quality-state',
      'refactor': 'execution-state',
      'analyze': 'thinking-state',
      'audit': 'security-state',
    };
    
    const designations = tasks.map(task => ({
      taskId: task.id,
      primaryDomain: domainMap[task.type] || 'execution-state',
      secondaryDomain: 'workflow-state' as DomainId,
    }));
    
    this.state.domainsDesignated = true;
    this.stateStore.set('planning-state', 'domain-designations', designations, ['kraken-planning']);
    
    console.log(`[PlanningBrain] Designated domains for ${designations.length} tasks`);
  }

  isDomainsDesignated(): boolean {
    return this.state.domainsDesignated;
  }

  // =========================================================================
  // CONTEXT BRIDGE
  // =========================================================================

  async createContextBridge(sourceTask: string, targetTask: string): Promise<void> {
    console.log(`[PlanningBrain] Creating context bridge: ${sourceTask} → ${targetTask}`);
    
    const bridge = {
      source: sourceTask,
      target: targetTask,
      createdAt: Date.now(),
      type: 'planning-context',
    };
    
    this.stateStore.set('context-bridge', `${sourceTask}-${targetTask}`, bridge, ['kraken-planning']);
    
    // Inject context into target task's planning
    this.messenger.deliverMessage('kraken-planning', 'kraken-execution', 'context-inject', {
      type: 'context-bridge',
      sourceTask,
      targetTask,
      bridge,
    }, 'normal');
  }

  // =========================================================================
  // STATE ACCESS
  // =========================================================================

  getState(): PlanningState {
    return { ...this.state };
  }

  getSnapshot(): Record<string, unknown> {
    return this.stateStore.snapshot('planning-state');
  }
}

// Singleton instance
let planningBrainInstance: PlanningBrain | null = null;

export function createPlanningBrain(stateStore?: StateStore, messenger?: BrainMessenger): PlanningBrain {
  if (!planningBrainInstance) {
    planningBrainInstance = new PlanningBrain(stateStore, messenger);
  }
  return planningBrainInstance;
}

export function getPlanningBrain(): PlanningBrain {
  if (!planningBrainInstance) {
    planningBrainInstance = new PlanningBrain();
  }
  return planningBrainInstance;
}