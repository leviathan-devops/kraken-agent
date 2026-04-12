/**
 * Mode Coordinator - Routes between modes and validates transitions
 */
export type ModeType = 'planning' | 'problem-solving' | 'context-synthesis';
export interface LayerRequirement {
    name: string;
    description: string;
    validate: (artifacts: Map<string, string>) => ValidationResult;
}
export interface ValidationResult {
    valid: boolean;
    missing?: string[];
    reason?: string;
}
export interface ModeDefinition {
    name: string;
    maxLayer: number;
    layerNames: string[];
    requirements: Map<number, LayerRequirement[]>;
    allowedTools: string[];
    blockedTools: string[];
}
export declare class ModeCoordinator {
    private modes;
    constructor();
    private initializeModes;
    private checkArtifact;
    private checkPrincipleCount;
    getMaxLayer(mode: ModeType): number;
    getModeDefinition(mode: ModeType): ModeDefinition | undefined;
    validateTool(tool: string, mode: ModeType): ValidationResult;
    canAdvance(mode: ModeType, currentLayer: number, artifacts: Map<string, string>): boolean;
    getRequirements(mode: ModeType, layer: number): LayerRequirement[];
}
