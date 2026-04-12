/**
 * TRIDENT BRAIN - Main Plugin Entry
 * 
 * Multi-mode reasoning architecture with mechanical gate enforcement.
 * Provides specialized reasoning processes for different thinking tasks.
 */

import { ModeCoordinator } from './shared/mode-coordinator.js';
import { PlanningMode } from './modes/planning/index.js';
import { ProblemSolvingMode } from './modes/problem-solving/index.js';
import { ContextSynthesisMode } from './modes/context-synthesis/index.js';

export interface TridentBrainState {
  currentMode: 'planning' | 'problem-solving' | 'context-synthesis' | null;
  currentLayer: number;
  iteration: string;
  artifacts: Map<string, string>;
}

export interface TridentPlugin {
  name: string;
  version: string;
  initialize: () => void;
  createHooks: () => Record<string, Function>;
  createTools: () => any[];
}

export class TridentBrainPlugin implements TridentPlugin {
  name = 'trident-brain';
  version = '1.0.0';
  
  private coordinator: ModeCoordinator;
  private planningMode: PlanningMode;
  private problemSolvingMode: ProblemSolvingMode;
  private contextSynthesisMode: ContextSynthesisMode;
  
  private state: TridentBrainState = {
    currentMode: null,
    currentLayer: 0,
    iteration: 'V1.0',
    artifacts: new Map()
  };

  constructor() {
    this.coordinator = new ModeCoordinator();
    this.planningMode = new PlanningMode();
    this.problemSolvingMode = new ProblemSolvingMode();
    this.contextSynthesisMode = new ContextSynthesisMode();
  }

  initialize(): void {
    console.log('[Trident Brain] Initializing v1.0.0');
    console.log('[Trident Brain] Modes available: planning, problem-solving, context-synthesis');
  }

  createHooks(): Record<string, Function> {
    return {
      'session.created': (event: any) => {
        console.log('[Trident Brain] Session created, initializing brain state');
        this.state.currentMode = null;
        this.state.currentLayer = 0;
        this.state.iteration = 'V1.0';
        this.state.artifacts.clear();
      },
      
      'chat.message': (event: any) => {
        const message = (event.message || '').toLowerCase();
        
        if (message.includes('/trident')) {
          this.handleTridentCommand(event);
        }
      },

      'tool.execute.before': async (input: any, output: any) => {
        if (!this.state.currentMode) return;
        
        const tool = input.tool;
        const validation = this.coordinator.validateTool(tool, this.state.currentMode);
        
        if (!validation.valid) {
          console.log(`[Trident Brain] Tool blocked: ${tool} - ${validation.reason}`);
          output.blocked = true;
          output.blockReason = validation.reason;
        }
      },

      'tool.execute.after': async (input: any, output: any) => {
        if (!this.state.currentMode) return;
        
        this.evaluateGateProgression();
      }
    };
  }

  private handleTridentCommand(event: any): void {
    const message = event.message || '';
    
    if (message.includes('planning')) {
      this.state.currentMode = 'planning';
      this.state.currentLayer = 1;
      event.response = '[Trident Brain] Switched to Deep Planning Mode (Layer 1)';
    } else if (message.includes('problem-solving')) {
      this.state.currentMode = 'problem-solving';
      this.state.currentLayer = 1;
      event.response = '[Trident Brain] Switched to Problem Solving Mode (Layer 1)';
    } else if (message.includes('context-synthesis')) {
      this.state.currentMode = 'context-synthesis';
      this.state.currentLayer = 1;
      event.response = '[Trident Brain] Switched to Context Synthesis Mode (Layer 1)';
    } else if (message.includes('status')) {
      event.response = this.getStatus();
    }
  }

  private getStatus(): string {
    return `[Trident Brain] Status:
Mode: ${this.state.currentMode || 'None'}
Layer: ${this.state.currentLayer}
Iteration: ${this.state.iteration}
Artifacts: ${this.state.artifacts.size}`;
  }

  private evaluateGateProgression(): void {
    if (!this.state.currentMode) return;

    const mode = this.state.currentMode;
    const layer = this.state.currentLayer;
    
    const canAdvance = this.coordinator.canAdvance(mode, layer, this.state.artifacts);
    
    if (canAdvance && layer < this.coordinator.getMaxLayer(mode)) {
      this.state.currentLayer++;
      console.log(`[Trident Brain] Advanced to Layer ${this.state.currentLayer}`);
    } else if (canAdvance && layer === this.coordinator.getMaxLayer(mode)) {
      console.log(`[Trident Brain] Mode complete!`);
    }
  }

  createTools(): any[] {
    return [
      {
        name: 'trident-status',
        description: 'Get current Trident Brain status',
        execute: () => this.getStatus()
      },
      {
        name: 'trident-mode',
        description: 'Switch Trident Brain mode',
        execute: (mode: string) => {
          this.handleTridentCommand({ message: mode });
          return `Switched to ${mode}`;
        }
      },
      {
        name: 'trident-artifact',
        description: 'Get Trident Brain artifact',
        execute: (key: string) => {
          return this.state.artifacts.get(key) || 'Not found';
        }
      }
    ];
  }
}

export default new TridentBrainPlugin();