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
    logsChecked: Array<{
        source: string;
        checked: string;
        result: string;
    }>;
    expectedVsActual: Array<{
        aspect: string;
        expected: string;
        actual: string;
        difference: string;
    }>;
    evidenceValidation: Array<{
        evidence: string;
        source: string;
        valid: boolean;
    }>;
}
export interface Layer4GapAnalysisOutput {
    gapStatement: string;
    gaps: Array<{
        gap: string;
        analysis: string;
    }>;
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
export declare class ProblemSolvingMode {
    name: string;
    private currentIteration;
    private iterationHistory;
    private state;
    getLayer(layer: number): string;
    setLayerOutput(layer: number, output: any): void;
    getAllOutputs(): typeof this.state;
    newIteration(): void;
    getCurrentIteration(): string;
    getIterationHistory(): Map<string, any>;
    reset(): void;
}
declare const _default: ProblemSolvingMode;
export default _default;
