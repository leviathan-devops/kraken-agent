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
export class ProblemSolvingMode {
    name = 'Problem Solving Mode';
    currentIteration = 'V1.0';
    iterationHistory = new Map();
    state = {
        layer1: null,
        layer2: null,
        layer3: null,
        layer4: null,
        layer5: null,
        layer6: null
    };
    getLayer(layer) {
        const layers = ['Assumption Statement', 'Action with Prediction', 'Observation & Evidence',
            'Gap Analysis & Adjustment', 'Meta-Cognitive Reflection', 'Verification & Confirmation'];
        return layers[layer - 1] || 'Unknown';
    }
    setLayerOutput(layer, output) {
        switch (layer) {
            case 1:
                this.state.layer1 = output;
                break;
            case 2:
                this.state.layer2 = output;
                break;
            case 3:
                this.state.layer3 = output;
                break;
            case 4:
                this.state.layer4 = output;
                break;
            case 5:
                this.state.layer5 = output;
                break;
            case 6:
                this.state.layer6 = output;
                break;
        }
    }
    getAllOutputs() {
        return { ...this.state };
    }
    newIteration() {
        // Save current iteration
        this.iterationHistory.set(this.currentIteration, { ...this.state });
        // Increment version
        const [major, minor] = this.currentIteration.split('.');
        const newMinor = parseInt(minor) + 1;
        this.currentIteration = `${major}.${newMinor}`;
        // Reset state for new iteration
        this.state = {
            layer1: null,
            layer2: null,
            layer3: null,
            layer4: null,
            layer5: null,
            layer6: null
        };
    }
    getCurrentIteration() {
        return this.currentIteration;
    }
    getIterationHistory() {
        return this.iterationHistory;
    }
    reset() {
        this.state = { layer1: null, layer2: null, layer3: null, layer4: null, layer5: null, layer6: null };
        this.currentIteration = 'V1.0';
        this.iterationHistory.clear();
    }
}
export default new ProblemSolvingMode();
