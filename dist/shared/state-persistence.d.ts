/**
 * State Persistence - Handles saving/loading mode state for iteration tracking
 */
export interface PersistedState {
    mode: string;
    layer: number;
    iteration: string;
    timestamp: string;
    data: any;
}
export declare class StatePersistence {
    private storage;
    save(key: string, state: PersistedState): void;
    load(key: string): PersistedState | null;
    list(): Array<{
        key: string;
        state: PersistedState;
    }>;
    delete(key: string): boolean;
    clear(): void;
    saveIteration(mode: string, iteration: string, layerOutputs: any): void;
    loadIteration(mode: string, iteration: string): any | null;
    getIterationHistory(mode: string): Array<{
        iteration: string;
        timestamp: string;
    }>;
}
declare const _default: StatePersistence;
export default _default;
