/**
 * Problem Solving Mode
 * 
 * 6-layer evidence-based debugging and root cause analysis.
 * Layer 1: Assumption Statement
 * Layer 2: Action with Prediction
 * Layer 3: Observation & Evidence
 * Layer 4: Gap Analysis & Adjustment
 * Layer 5: Meta-Cognitive Reflection
 * Layer 6: Verification & Confirmation
 * 
 * Supports iteration (V1.0 -> V1.1 -> V1.2) for complex problems.
 */

export interface Layer1AssumptionOutput {
  problemStatement: string;
  explicitAssumption: string;
  reasoningChain: string[];
  successCriteria: string[];
  confirmationCriteria: string;
  disproofCriteria: string;
}

export interface Layer2ActionOutput {
  exactCommand: string;
  expectedOutput: string;
  environmentState: Record<string, string>;
  observationToMake: string;
}

export interface Layer3ObservationOutput {
  rawEvidence: string;
  logsChecked: Array<{ source: string; checked: string; result: string }>;
  expectedVsActual: Array<{ aspect: string; expected: string; actual: string; difference: string }>;
  evidenceValidation: Array<{ evidence: string; source: string; valid: boolean }>;
}

export interface Layer4GapAnalysisOutput {
  gapStatement: string;
  gaps: Array<{ gap: string; analysis: string }>;
  previousAssumption: string;
  updatedHypothesis: string;
  nextAction: string;
  whyNextAction: string;
  whatToObserve: string;
  iterationHistory: Array<{
    iteration: string;
    previousHypothesis: string;
    gapFound: string;
    updatedHypothesis: string;
  }>;
}

export interface Layer5MetaReflectionOutput {
  whatIShouldHaveDone: Array<{
    step: string;
    whatIDid: string;
    whatIShouldHaveDone: string;
  }>;
  patternExtracted: {
    name: string;
    description: string;
    whenToApply: string;
  };
  systemicIssue: {
    issue: string;
    whySystemic: string;
    fixNeeded: string;
  };
  rootCauseVsSymptom: Array<{
    finding: string;
    type: 'Root Cause' | 'Symptom';
    explanation: string;
  }>;
  currentAssessment: string;
}

export interface Layer6VerificationOutput {
  targetEnvironment: string;
  execution: string;
  result: string;
  originalRequirement: string;
  currentBehavior: string;
  requirementsMet: Array<{
    requirement: string;
    met: boolean;
    evidence: string;
  }>;
  consoleErrors: string | null;
  sideEffects: string | null;
  regressionCheck: Array<{
    component: string;
    status: 'OK' | 'Affected';
    notes: string;
  }>;
  finalAssessment: {
    status: 'Resolved' | 'Partially Resolved' | 'Not Resolved';
    confidence: 'High' | 'Medium' | 'Low';
    remainingIssues: string[];
  };
}

export class ProblemSolvingMode {
  name = 'Problem Solving Mode';
  
  private currentIteration = 'V1.0';
  private iterationHistory: Map<string, any> = new Map();

  private state: {
    layer1: Layer1AssumptionOutput | null;
    layer2: Layer2ActionOutput | null;
    layer3: Layer3ObservationOutput | null;
    layer4: Layer4GapAnalysisOutput | null;
    layer5: Layer5MetaReflectionOutput | null;
    layer6: Layer6VerificationOutput | null;
  } = {
    layer1: null,
    layer2: null,
    layer3: null,
    layer4: null,
    layer5: null,
    layer6: null
  };

  getLayer(layer: number): string {
    const layers = ['Assumption Statement', 'Action with Prediction', 'Observation & Evidence', 
                    'Gap Analysis & Adjustment', 'Meta-Cognitive Reflection', 'Verification & Confirmation'];
    return layers[layer - 1] || 'Unknown';
  }

  setLayerOutput(layer: number, output: any): void {
    switch (layer) {
      case 1: this.state.layer1 = output as Layer1AssumptionOutput; break;
      case 2: this.state.layer2 = output as Layer2ActionOutput; break;
      case 3: this.state.layer3 = output as Layer3ObservationOutput; break;
      case 4: this.state.layer4 = output as Layer4GapAnalysisOutput; break;
      case 5: this.state.layer5 = output as Layer5MetaReflectionOutput; break;
      case 6: this.state.layer6 = output as Layer6VerificationOutput; break;
    }
  }

  getAllOutputs(): typeof this.state {
    return { ...this.state };
  }

  newIteration(): void {
    // Save current iteration
    this.iterationHistory.set(this.currentIteration, { ...this.state });
    
    // Increment version
    const [major, minor] = this.currentIteration.split('.');
    const newMinor = parseInt(minor) + 1;
    this.currentIteration = `${major}.${newMinor}`;
    
    // Reset state for new iteration
    this.state = {
      layer1: null,
      layer2: null,
      layer3: null,
      layer4: null,
      layer5: null,
      layer6: null
    };
  }

  getCurrentIteration(): string {
    return this.currentIteration;
  }

  getIterationHistory(): Map<string, any> {
    return this.iterationHistory;
  }

  reset(): void {
    this.state = { layer1: null, layer2: null, layer3: null, layer4: null, layer5: null, layer6: null };
    this.currentIteration = 'V1.0';
    this.iterationHistory.clear();
  }
}

export default new ProblemSolvingMode();