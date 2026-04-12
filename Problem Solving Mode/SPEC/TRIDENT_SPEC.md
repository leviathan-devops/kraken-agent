# TRIDENT BRAIN - Problem Solving Mode Technical Specification

**Version:** 1.0.0  
**Type:** Technical Implementation Specification

---

## Overview

Problem Solving Mode is a pure reasoning agent for debugging and root cause analysis. It enforces evidence-based iteration through mechanical gates.

---

## State Machine

```typescript
enum ProblemSolvingLayer {
  LAYER_1 = 1,  // Assumption Statement
  LAYER_2 = 2,  // Action with Prediction
  LAYER_3 = 3,  // Observation & Evidence
  LAYER_4 = 4,  // Gap Analysis & Adjustment
  LAYER_5 = 5,  // Meta-Cognitive Reflection
  LAYER_6 = 6,  // Verification & Confirmation
  COMPLETE = 7
}

interface ProblemSolvingState {
  currentLayer: ProblemSolvingLayer;
  iteration: string;        // V1.0, V1.1, V1.2...
  layerAttempts: number;
  artifacts: Map<string, string>;
  
  layer1: { complete: boolean; assumption: string; reasoning: string };
  layer2: { complete: boolean; command: string; expected: string };
  layer3: { complete: boolean; rawEvidence: string; logsChecked: boolean };
  layer4: { complete: boolean; gapAnalysis: string; updatedHypothesis: string };
  layer5: { complete: boolean; patternExtracted: string; systemicIssue: string };
  layer6: { complete: boolean; verificationResult: string; behaviorMatch: boolean };
}
```

---

## Gate Transitions

```typescript
const GATE_TRANSITIONS = [
  {
    from: ProblemSolvingLayer.LAYER_1,
    to: ProblemSolvingLayer.LAYER_2,
    requires: {
      files: ['01_ASSUMPTION.md'],
      structural: {
        'Explicit Assumption': true,
        'Reasoning Chain': true,
        'Success Criteria': true,
        'Confirmation/Disproof Criteria': true,
      }
    }
  },
  {
    from: ProblemSolvingLayer.LAYER_2,
    to: ProblemSolvingLayer.LAYER_3,
    requires: {
      files: ['02_ACTION.md'],
      structural: {
        'Exact Command': true,
        'Expected Output': true,
        'Environment State': true,
      }
    }
  },
  {
    from: ProblemSolvingLayer.LAYER_3,
    to: ProblemSolvingLayer.LAYER_4,
    requires: {
      files: ['03_OBSERVATION.md'],
      structural: {
        'Raw Evidence': true,
        'Logs Checked': true,
        'Expected vs Actual Comparison': true,
      }
    }
  },
  {
    from: ProblemSolvingLayer.LAYER_4,
    to: ProblemSolvingLayer.LAYER_5,
    requires: {
      files: ['04_GAP_ANALYSIS.md'],
      structural: {
        'Gap Analysis': true,
        'Updated Hypothesis': true,
        'Next Action Tied to Insight': true,
      }
    }
  },
  {
    from: ProblemSolvingLayer.LAYER_5,
    to: ProblemSolvingLayer.LAYER_6,
    requires: {
      files: ['05_META_REFLECTION.md'],
      structural: {
        'What I Should Have Done': true,
        'Pattern Extracted': true,
        'Systemic Issue': true,
      }
    }
  },
  {
    from: ProblemSolvingLayer.LAYER_6,
    to: ProblemSolvingLayer.COMPLETE,
    requires: {
      files: ['06_VERIFICATION.md'],
      structural: {
        'Target Environment Execution': true,
        'Behavior Matches Requirement': true,
        'No Regressions': true,
      }
    }
  }
];
```

---

## Iteration Pattern

```typescript
interface Iteration {
  id: string;                    // "V1.0", "V1.1", etc.
  problemStatement: string;
  layers: {
    assumption: Layer1Output;
    action: Layer2Output;
    observation: Layer3Output;
    gapAnalysis: Layer4Output;
    metaReflection: Layer5Output;
    verification: Layer6Output;
  };
  outcome: 'resolved' | 'iterating' | 'escalate';
}
```

---

## Structural Requirements (Not Quantitative)

| Layer | Requirement | Type |
|-------|-------------|------|
| 1 | Explicit assumption stated | Boolean |
| 1 | Reasoning chain documented | Boolean |
| 1 | Success criteria defined | Boolean |
| 2 | Exact command specified | Boolean |
| 2 | Expected output documented | Boolean |
| 2 | Environment state captured | Boolean |
| 3 | Raw evidence (not paraphrased) | Boolean |
| 3 | Logs checked | Boolean |
| 3 | Expected vs Actual table | Boolean |
| 4 | Gap analysis ("expected X, got Y, therefore Z") | Boolean |
| 4 | Updated hypothesis | Boolean |
| 4 | Next action tied to insight | Boolean |
| 5 | "What I Should Have Done" | Boolean |
| 5 | Pattern extracted | Boolean |
| 5 | Systemic issue identified | Boolean |
| 6 | Target environment execution | Boolean |
| 6 | Behavior matches requirement | Boolean |
| 6 | No regressions | Boolean |

---

## Anti-Derailment Enforcement

```typescript
const ANTI_DERAILMENT_CHECKS = [
  {
    check: 'No self-referencing proofs',
    description: 'JSON/files created by agent = invalid evidence',
    enforcedAt: Layer3
  },
  {
    check: 'No "it works" without raw evidence',
    description: 'Must show actual output, not "my assessment"',
    enforcedAt: Layer3
  },
  {
    check: 'No vague testing',
    description: 'Must specify exact command + expected output',
    enforcedAt: Layer2
  },
  {
    check: 'No blind retry',
    description: 'Gap analysis must inform next action',
    enforcedAt: Layer4
  },
  {
    check: 'No pattern repeat without extraction',
    description: 'Layer 5 must extract pattern to prevent repeat',
    enforcedAt: Layer5
  },
  {
    check: 'No syntax-only verification',
    description: 'Must execute in target environment',
    enforcedAt: Layer6
  }
];
```

---

## Output Artifacts

Each iteration produces:
- `01_ASSUMPTION.md` - Layer 1 output
- `02_ACTION.md` - Layer 2 output
- `03_OBSERVATION.md` - Layer 3 output
- `04_GAP_ANALYSIS.md` - Layer 4 output
- `05_META_REFLECTION.md` - Layer 5 output
- `06_VERIFICATION.md` - Layer 6 output
- `00_INDEX.md` - Iteration summary

Final output is an **INJECTABLE DEBUGGING CHAIN** for other agents.

---

*Problem Solving Mode - Evidence-based debugging through mechanical gates*