/**
 * State Persistence - Handles saving/loading mode state for iteration tracking
 */
export class StatePersistence {
    storage = new Map();
    save(key, state) {
        this.storage.set(key, {
            ...state,
            timestamp: new Date().toISOString()
        });
    }
    load(key) {
        return this.storage.get(key) || null;
    }
    list() {
        return Array.from(this.storage.entries()).map(([key, state]) => ({ key, state }));
    }
    delete(key) {
        return this.storage.delete(key);
    }
    clear() {
        this.storage.clear();
    }
    // For iteration tracking
    saveIteration(mode, iteration, layerOutputs) {
        const key = `${mode}:${iteration}`;
        this.save(key, {
            mode,
            layer: 0,
            iteration,
            timestamp: new Date().toISOString(),
            data: layerOutputs
        });
    }
    loadIteration(mode, iteration) {
        const key = `${mode}:${iteration}`;
        const state = this.load(key);
        return state?.data || null;
    }
    getIterationHistory(mode) {
        const history = [];
        this.storage.forEach((state, key) => {
            if (key.startsWith(`${mode}:`)) {
                history.push({
                    iteration: state.iteration,
                    timestamp: state.timestamp
                });
            }
        });
        return history.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    }
}
export default new StatePersistence();
