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
export class ContextSynthesisMode {
    name = 'Context Synthesis Mode';
    TOKEN_BUDGET = 2000;
    DECISION_BUDGET = 500;
    state = {
        layer1: null,
        layer2: null,
        layer3: null,
        layer4: null
    };
    getLayer(layer) {
        const layers = ['Context Collection', 'Relevance Scoring', 'Compression', 'Injection Format'];
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
        }
    }
    getAllOutputs() {
        return { ...this.state };
    }
    calculateScore(urgency, importance) {
        return (urgency * 0.6) + (importance * 0.4);
    }
    getUrgencyScore(context) {
        if (context.hasBlocker)
            return 10;
        if (context.gateTransitionPending)
            return 8;
        if (context.isDebugging)
            return 7;
        if (context.hasRecentError)
            return 6;
        if (context.isStale)
            return 1;
        return 3; // Default
    }
    getImportanceScore(context) {
        if (context.isDecisionPoint)
            return 10;
        if (context.isFromPattern)
            return 8;
        if (context.isConfigOrArchitecture)
            return 7;
        if (context.isDocumentation)
            return 3;
        if (context.isLogFile)
            return 2;
        return 5; // Default
    }
    checkTriggers(triggerData) {
        const triggers = [];
        if (triggerData.manualRequested) {
            triggers.push({ type: 'manual', priority: 'HIGH' });
        }
        if (triggerData.gateChanging) {
            triggers.push({ type: 'gate-transition', priority: 'HIGH' });
        }
        if (triggerData.toolFailed) {
            triggers.push({ type: 'error-detected', priority: 'MEDIUM' });
        }
        if (triggerData.tokenPercentage > 0.70) {
            triggers.push({ type: 'token-threshold', priority: 'MEDIUM' });
        }
        if (triggerData.messagesSinceProgress > 10) {
            triggers.push({ type: 'stale-context', priority: 'LOW' });
        }
        return triggers;
    }
    generateInjection() {
        const output = this.state.layer4;
        if (!output)
            return '';
        return `# CONTEXT INJECTION — ${output.timestamp}

---

## 📍 CURRENT POSITION
**Gate:** ${output.currentPosition.gate}
**Task:** ${output.currentPosition.task}
**Blockers:** ${output.currentPosition.blockers.length > 0 ? output.currentPosition.blockers.join(', ') : 'None'}

---

## 🎯 IMMEDIATE PRIORITIES (Ranked)
${output.priorities.slice(0, 5).map((p, i) => `${i + 1}. **${p.name}** (${p.finalScore.toFixed(1)}) - ${p.content.substring(0, 100)}...`).join('\n')}

---

## 🧠 INJECTED KNOWLEDGE
${output.injectedKnowledge}

---

## 📁 ACTIVE FILES
${output.activeFiles.map(f => `- ${f}`).join('\n')}

---

## 🔧 RECENT EXECUTION
${output.executionPatterns.map(p => `- ${p}`).join('\n')}

---

## 💡 SYNTHESIZED INSIGHT
${output.synthesizedInsight}

---

---
**Token Count:** ${output.tokenCount} | **Sources:** ${output.sourceCount}
`;
    }
    reset() {
        this.state = { layer1: null, layer2: null, layer3: null, layer4: null };
    }
}
export default new ContextSynthesisMode();
