/**
 * Deep Planning Mode
 * 
 * 3-layer reasoning for creating project plans from first principles.
 * Layer 1: Initial Plan - What is this really?
 * Layer 2: Detailed Workflow - How does it decompose?
 * Layer 3: Context Library - Can I explain to another agent?
 */

import type { TridentBrainState } from '../../index.js';

export interface Layer1Output {
  surfaceUnderstanding: string;
  firstPrinciples: string[];
  constraints: string[];
  successCriteria: string[];
  openQuestions: string[];
  direction: string;
}

export interface Layer2Output {
  components: string[];
  sequences: string[];
  dependencies: string[];
  failureModes: string[];
  verificationPlan: string;
}

export interface Layer3Output {
  contextLibrary: string;
  injectableOutput: string;
  architecture: string;
  interfaces: string;
  stateManagement: string;
}

export class PlanningMode {
  name = 'Deep Planning Mode';
  
  private state: {
    layer1: Layer1Output | null;
    layer2: Layer2Output | null;
    layer3: Layer3Output | null;
  } = {
    layer1: null,
    layer2: null,
    layer3: null
  };

  getLayer(layer: number): string {
    switch (layer) {
      case 1: return 'Initial Plan';
      case 2: return 'Detailed Workflow';
      case 3: return 'Context Library';
      default: return 'Unknown';
    }
  }

  setLayerOutput(layer: number, output: any): void {
    switch (layer) {
      case 1:
        this.state.layer1 = output as Layer1Output;
        break;
      case 2:
        this.state.layer2 = output as Layer2Output;
        break;
      case 3:
        this.state.layer3 = output as Layer3Output;
        break;
    }
  }

  getAllOutputs(): { layer1: any, layer2: any, layer3: any } {
    return {
      layer1: this.state.layer1,
      layer2: this.state.layer2,
      layer3: this.state.layer3
    };
  }

  reset(): void {
    this.state = { layer1: null, layer2: null, layer3: null };
  }
}

export default new PlanningMode();