/**
 * Deep Planning Mode
 *
 * 3-layer reasoning for creating project plans from first principles.
 * Layer 1: Initial Plan - What is this really?
 * Layer 2: Detailed Workflow - How does it decompose?
 * Layer 3: Context Library - Can I explain to another agent?
 */
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
export declare class PlanningMode {
    name: string;
    private state;
    getLayer(layer: number): string;
    setLayerOutput(layer: number, output: any): void;
    getAllOutputs(): {
        layer1: any;
        layer2: any;
        layer3: any;
    };
    reset(): void;
}
declare const _default: PlanningMode;
export default _default;
