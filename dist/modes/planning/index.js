/**
 * Deep Planning Mode
 *
 * 3-layer reasoning for creating project plans from first principles.
 * Layer 1: Initial Plan - What is this really?
 * Layer 2: Detailed Workflow - How does it decompose?
 * Layer 3: Context Library - Can I explain to another agent?
 */
export class PlanningMode {
    name = 'Deep Planning Mode';
    state = {
        layer1: null,
        layer2: null,
        layer3: null
    };
    getLayer(layer) {
        switch (layer) {
            case 1: return 'Initial Plan';
            case 2: return 'Detailed Workflow';
            case 3: return 'Context Library';
            default: return 'Unknown';
        }
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
        }
    }
    getAllOutputs() {
        return {
            layer1: this.state.layer1,
            layer2: this.state.layer2,
            layer3: this.state.layer3
        };
    }
    reset() {
        this.state = { layer1: null, layer2: null, layer3: null };
    }
}
export default new PlanningMode();
