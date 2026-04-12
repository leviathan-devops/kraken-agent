/**
 * Context Synthesis Mode
 *
 * 4-layer dynamic context synthesis for injecting context into agent thought stream.
 * Layer 1: Context Collection - What context exists?
 * Layer 2: Relevance Scoring - What matters most?
 * Layer 3: Compression - How to compress?
 * Layer 4: Injection Format - How to inject?
 *
 * Combines Kraken V2.0 token management + Hermes Memory tiers + on-demand triggers.
 */
export type ContextSourceType = 'T1' | 'T2' | 'T3' | 'T4';
export interface ContextItem {
    source: ContextSourceType;
    name: string;
    content: string;
    urgencyScore: number;
    importanceScore: number;
    finalScore: number;
    rank: number;
}
export interface Layer1CollectionOutput {
    sessionId: string;
    currentGate: string;
    activeTask: string;
    sources: {
        t1: {
            status: 'available' | 'unavailable';
            content: any;
        };
        t2: {
            status: 'available' | 'unavailable';
            hermes: any;
            hive: any;
            kraken: any;
        };
        t3: {
            status: 'available' | 'unavailable';
            files: Array<{
                path: string;
                relevance: 'HIGH' | 'MEDIUM' | 'LOW';
            }>;
        };
        t4: {
            status: 'available' | 'unavailable';
            tools: Array<{
                tool: string;
                count: number;
            }>;
        };
    };
    collectionSummary: Array<{
        source: string;
        status: string;
        size: number;
    }>;
}
export interface Layer2ScoringOutput {
    scoredItems: ContextItem[];
    urgencyFactors: Record<string, number>;
    importanceFactors: Record<string, number>;
    topPriorities: ContextItem[];
}
export interface Layer3CompressionOutput {
    tokenBudget: {
        decisionPoints: {
            budget: number;
            used: number;
        };
        general: {
            budget: number;
            used: number;
        };
        total: {
            budget: number;
            used: number;
            underLimit: boolean;
        };
    };
    compressedContent: {
        decisionsPreserved: string;
        keyFilesSummarized: string;
        patternsMerged: string;
        errorsPruned: string;
    };
    tokenCount: number;
}
export interface Layer4InjectionOutput {
    timestamp: string;
    currentPosition: {
        gate: string;
        task: string;
        blockers: string[];
    };
    priorities: ContextItem[];
    injectedKnowledge: string;
    activeFiles: string[];
    executionPatterns: string[];
    synthesizedInsight: string;
    tokenCount: number;
    sourceCount: number;
}
export type TriggerType = 'manual' | 'gate-transition' | 'error-detected' | 'token-threshold' | 'stale-context';
export declare class ContextSynthesisMode {
    name: string;
    private readonly TOKEN_BUDGET;
    private readonly DECISION_BUDGET;
    private state;
    getLayer(layer: number): string;
    setLayerOutput(layer: number, output: any): void;
    getAllOutputs(): typeof this.state;
    calculateScore(urgency: number, importance: number): number;
    getUrgencyScore(context: {
        hasBlocker: boolean;
        gateTransitionPending: boolean;
        isDebugging: boolean;
        hasRecentError: boolean;
        isStale: boolean;
    }): number;
    getImportanceScore(context: {
        isDecisionPoint: boolean;
        isFromPattern: boolean;
        isConfigOrArchitecture: boolean;
        isDocumentation: boolean;
        isLogFile: boolean;
    }): number;
    checkTriggers(triggerData: {
        manualRequested: boolean;
        gateChanging: boolean;
        toolFailed: boolean;
        tokenPercentage: number;
        messagesSinceProgress: number;
    }): Array<{
        type: TriggerType;
        priority: 'HIGH' | 'MEDIUM' | 'LOW';
    }>;
    generateInjection(): string;
    reset(): void;
}
declare const _default: ContextSynthesisMode;
export default _default;
