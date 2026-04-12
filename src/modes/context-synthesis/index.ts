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
    t1: { status: 'available' | 'unavailable'; content: any };
    t2: { status: 'available' | 'unavailable'; hermes: any; hive: any; kraken: any };
    t3: { status: 'available' | 'unavailable'; files: Array<{ path: string; relevance: 'HIGH' | 'MEDIUM' | 'LOW' }> };
    t4: { status: 'available' | 'unavailable'; tools: Array<{ tool: string; count: number }> };
  };
  collectionSummary: Array<{ source: string; status: string; size: number }>;
}

export interface Layer2ScoringOutput {
  scoredItems: ContextItem[];
  urgencyFactors: Record<string, number>;
  importanceFactors: Record<string, number>;
  topPriorities: ContextItem[];
}

export interface Layer3CompressionOutput {
  tokenBudget: {
    decisionPoints: { budget: number; used: number };
    general: { budget: number; used: number };
    total: { budget: number; used: number; underLimit: boolean };
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

export class ContextSynthesisMode {
  name = 'Context Synthesis Mode';
  
  private readonly TOKEN_BUDGET = 2000;
  private readonly DECISION_BUDGET = 500;
  
  private state: {
    layer1: Layer1CollectionOutput | null;
    layer2: Layer2ScoringOutput | null;
    layer3: Layer3CompressionOutput | null;
    layer4: Layer4InjectionOutput | null;
  } = {
    layer1: null,
    layer2: null,
    layer3: null,
    layer4: null
  };

  getLayer(layer: number): string {
    const layers = ['Context Collection', 'Relevance Scoring', 'Compression', 'Injection Format'];
    return layers[layer - 1] || 'Unknown';
  }

  setLayerOutput(layer: number, output: any): void {
    switch (layer) {
      case 1: this.state.layer1 = output as Layer1CollectionOutput; break;
      case 2: this.state.layer2 = output as Layer2ScoringOutput; break;
      case 3: this.state.layer3 = output as Layer3CompressionOutput; break;
      case 4: this.state.layer4 = output as Layer4InjectionOutput; break;
    }
  }

  getAllOutputs(): typeof this.state {
    return { ...this.state };
  }

  calculateScore(urgency: number, importance: number): number {
    return (urgency * 0.6) + (importance * 0.4);
  }

  getUrgencyScore(context: {
    hasBlocker: boolean;
    gateTransitionPending: boolean;
    isDebugging: boolean;
    hasRecentError: boolean;
    isStale: boolean;
  }): number {
    if (context.hasBlocker) return 10;
    if (context.gateTransitionPending) return 8;
    if (context.isDebugging) return 7;
    if (context.hasRecentError) return 6;
    if (context.isStale) return 1;
    return 3; // Default
  }

  getImportanceScore(context: {
    isDecisionPoint: boolean;
    isFromPattern: boolean;
    isConfigOrArchitecture: boolean;
    isDocumentation: boolean;
    isLogFile: boolean;
  }): number {
    if (context.isDecisionPoint) return 10;
    if (context.isFromPattern) return 8;
    if (context.isConfigOrArchitecture) return 7;
    if (context.isDocumentation) return 3;
    if (context.isLogFile) return 2;
    return 5; // Default
  }

  checkTriggers(triggerData: {
    manualRequested: boolean;
    gateChanging: boolean;
    toolFailed: boolean;
    tokenPercentage: number;
    messagesSinceProgress: number;
  }): Array<{ type: TriggerType; priority: 'HIGH' | 'MEDIUM' | 'LOW' }> {
    const triggers: Array<{ type: TriggerType; priority: 'HIGH' | 'MEDIUM' | 'LOW' }> = [];

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

  generateInjection(): string {
    const output = this.state.layer4;
    if (!output) return '';

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

  reset(): void {
    this.state = { layer1: null, layer2: null, layer3: null, layer4: null };
  }
}

export default new ContextSynthesisMode();