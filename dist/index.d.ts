/**
 * TRIDENT BRAIN - Main Plugin Entry
 *
 * Multi-mode reasoning architecture with mechanical gate enforcement.
 * Provides specialized reasoning processes for different thinking tasks.
 */
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
export declare class TridentBrainPlugin implements TridentPlugin {
    name: string;
    version: string;
    private coordinator;
    private planningMode;
    private problemSolvingMode;
    private contextSynthesisMode;
    private state;
    constructor();
    initialize(): void;
    createHooks(): Record<string, Function>;
    private handleTridentCommand;
    private getStatus;
    private evaluateGateProgression;
    createTools(): any[];
}
declare const _default: TridentBrainPlugin;
export default _default;
