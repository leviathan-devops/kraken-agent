/**
 * Artifact Generator - Produces final injectable artifacts from mode outputs
 */
import type { Layer1Output, Layer2Output, Layer3Output } from '../modes/planning/index.js';
import type { Layer1AssumptionOutput, Layer2ActionOutput, Layer3ObservationOutput, Layer4GapAnalysisOutput, Layer5MetaReflectionOutput, Layer6VerificationOutput } from '../modes/problem-solving/index.js';
export interface ArtifactResult {
    filename: string;
    content: string;
    tokenCount: number;
    injectable: boolean;
}
export declare class ArtifactGenerator {
    generatePlanningContextLibrary(outputs: {
        layer1: Layer1Output | null;
        layer2: Layer2Output | null;
        layer3: Layer3Output | null;
    }): ArtifactResult;
    generateProblemSolvingChain(outputs: {
        layer1: Layer1AssumptionOutput | null;
        layer2: Layer2ActionOutput | null;
        layer3: Layer3ObservationOutput | null;
        layer4: Layer4GapAnalysisOutput | null;
        layer5: Layer5MetaReflectionOutput | null;
        layer6: Layer6VerificationOutput | null;
    }, iteration: string): ArtifactResult;
    generateModeIndex(mode: 'planning' | 'problem-solving' | 'context-synthesis'): ArtifactResult;
    private getLayerIndex;
    private getQuickReference;
    private estimateTokens;
}
declare const _default: ArtifactGenerator;
export default _default;
