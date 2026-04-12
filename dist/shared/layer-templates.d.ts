/**
 * Layer Templates - Markdown templates for each layer of each mode
 */
export interface LayerTemplate {
    mode: string;
    layer: number;
    name: string;
    content: string;
    antiDerailmentCheck: string[];
    structuralRequirements: Array<{
        field: string;
        requirement: string;
        enforces: string;
    }>;
}
export declare class LayerTemplateGenerator {
    private planningMode;
    private problemSolvingMode;
    private contextSynthesisMode;
    getPlanningLayer1(): LayerTemplate;
    getProblemSolvingLayer1(): LayerTemplate;
    getProblemSolvingLayer3(): LayerTemplate;
    getContextSynthesisLayer1(): LayerTemplate;
    getContextSynthesisLayer4(): LayerTemplate;
}
declare const _default: LayerTemplateGenerator;
export default _default;
