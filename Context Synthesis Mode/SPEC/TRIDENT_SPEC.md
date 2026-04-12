# TRIDENT BRAIN - Context Synthesis Mode Technical Specification

**Version:** 1.0.0  
**Type:** Technical Implementation Specification

---

## Overview

Context Synthesis Mode is a dynamically triggerable context management agent that consolidates T1/T2/T3/T4 context and injects synthesized context into agent thought stream.

---

## Input Sources

```typescript
interface ContextSource {
  type: 'T1' | 'T2' | 'T3' | 'T4';
  name: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  fetchMethod: () => Promise<ContextData>;
}

const CONTEXT_SOURCES: ContextSource[] = [
  { type: 'T1', name: 'Session State', priority: 'HIGH', fetchMethod: getSessionState },
  { type: 'T2', name: 'Hermes Memory', priority: 'HIGH', fetchMethod: getHermesMemory },
  { type: 'T2', name: 'Hive Context', priority: 'HIGH', fetchMethod: getHiveContext },
  { type: 'T2', name: 'Kraken Hive', priority: 'MEDIUM', fetchMethod: getKrakenHive },
  { type: 'T3', name: 'Active Files', priority: 'MEDIUM', fetchMethod: getActiveFiles },
  { type: 'T4', name: 'Tool History', priority: 'LOW', fetchMethod: getToolHistory },
];
```

---

## Scoring Algorithm

```typescript
interface ScoredContext {
  source: string;
  content: string;
  urgencyScore: number;
  importanceScore: number;
  finalScore: number;
}

function scoreContext(context: ContextData): number {
  const urgencyFactors = {
    currentBlocker: 10,
    gateTransition: 8,
    activeDebugging: 7,
    recentError: 6,
    staleContext: 1,
  };
  
  const importanceFactors = {
    decisionPoint: 10,
    hivePattern: 8,
    configArchitecture: 7,
    documentation: 3,
    logFiles: 2,
  };
  
  return (urgencyScore * 0.6) + (importanceScore * 0.4);
}
```

---

## Compression Rules

```typescript
interface CompressionRules {
  decisionPoints: 'preserve-full';
  files: 'summarize-key';
  logs: 'prune-errors-only';
  patterns: 'deduplicate';
  stale: 'truncate-summary';
}

const TOKEN_BUDGET = 2000;
const DECISION_POINT_BUDGET = 500;
const GENERAL_BUDGET = 1500;
```

---

## Injection Output

```typescript
interface ContextInjection {
  timestamp: string;
  sessionId: string;
  currentPosition: {
    gate: string;
    task: string;
    blockers: string[];
  };
  priorities: ScoredContext[];
  injectedKnowledge: string;
  activeFiles: string[];
  executionPatterns: string[];
  synthesizedInsight: string;
  tokenCount: number;
  sourceCount: number;
}
```

---

## Triggers

```typescript
type TriggerType = 'manual' | 'gate-transition' | 'error-detected' | 'token-threshold' | 'stale-context';

interface Trigger {
  type: TriggerType;
  condition: () => boolean;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

const TRIGGERS: Trigger[] = [
  { type: 'manual', condition: () => agentRequestsSynthesis, priority: 'HIGH' },
  { type: 'gate-transition', condition: () => gateIsChanging, priority: 'HIGH' },
  { type: 'error-detected', condition: () => toolFailed, priority: 'MEDIUM' },
  { type: 'token-threshold', condition: () => tokens > 0.70, priority: 'MEDIUM' },
  { type: 'stale-context', condition: () => noProgressInMessages(10), priority: 'LOW' },
];
```

---

## Layer Transition Requirements

| From | To | Requires |
|------|-----|----------|
| Layer 1 | Layer 2 | All sources checked |
| Layer 2 | Layer 3 | All context scored |
| Layer 3 | Layer 4 | Under 2k tokens |

---

## Output Artifacts

- `01_COLLECTION.md` - Raw context from all sources
- `02_SCORING.md` - Ranked context with scores
- `03_COMPRESSION.md` - Synthesized content
- `04_INJECTION.md` - T0-ready format

---

*Context Synthesis Mode - Technical Specification*