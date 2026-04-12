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

export class StatePersistence {
  private storage: Map<string, PersistedState> = new Map();

  save(key: string, state: PersistedState): void {
    this.storage.set(key, {
      ...state,
      timestamp: new Date().toISOString()
    });
  }

  load(key: string): PersistedState | null {
    return this.storage.get(key) || null;
  }

  list(): Array<{ key: string; state: PersistedState }> {
    return Array.from(this.storage.entries()).map(([key, state]) => ({ key, state }));
  }

  delete(key: string): boolean {
    return this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }

  // For iteration tracking
  saveIteration(mode: string, iteration: string, layerOutputs: any): void {
    const key = `${mode}:${iteration}`;
    this.save(key, {
      mode,
      layer: 0,
      iteration,
      timestamp: new Date().toISOString(),
      data: layerOutputs
    });
  }

  loadIteration(mode: string, iteration: string): any | null {
    const key = `${mode}:${iteration}`;
    const state = this.load(key);
    return state?.data || null;
  }

  getIterationHistory(mode: string): Array<{ iteration: string; timestamp: string }> {
    const history: Array<{ iteration: string; timestamp: string }> = [];
    
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