# TRIDENT BRAIN - Technical Specification

**Version:** 2.0.0  
**Type:** Technical Implementation Specification

---

## Overview

Trident Brain is a pure reasoning agent implemented as an OpenCode plugin. It uses mechanical gate enforcement to produce deeply structured reasoning artifacts.

---

## Plugin Structure

```
trident-brain/
├── src/
│   ├── index.ts                    # Plugin entry
│   ├── trident/
│   │   ├── coordinator.ts          # Gate state machine
│   │   ├── gates.ts               # Layer definitions + requirements
│   │   ├── validator.ts           # Structural validation
│   │   ├── artifacts.ts          # Path resolution + templates
│   │   └── state.ts              # State management
│   ├── hooks/
│   │   └── trident-hook.ts        # Tool hooks
│   └── tools/
│       └── write-artifact.ts      # Primary write tool
├── dist/
│   └── index.js
└── package.json
```

---

## State Machine

```typescript
enum TridentLayer {
  LAYER_1 = 1,
  LAYER_2 = 2,
  LAYER_3 = 3,
  COMPLETE = 4
}

interface TridentState {
  currentLayer: TridentLayer;
  iteration: string;        // V1.0, V1.1, V1.2...
  layerAttempts: number;
  artifacts: Map<string, string>;
  
  layer1: { complete: boolean; files: string[] };
  layer2: { complete: boolean; files: string[] };
  layer3: { complete: boolean; files: string[] };
}
```

---

## Gate Transitions

```typescript
const GATE_TRANSITIONS = [
  {
    from: TridentLayer.LAYER_1,
    to: TridentLayer.LAYER_2,
    requires: {
      files: ['01_INITIAL_PLAN.md'],
      structural: {
        'Surface Understanding': true,
        'First Principles': 3,
        'Constraints': 3,
        'Success Criteria': 1,
        'Open Questions': 2,
      },
      minChars: 500
    }
  },
  {
    from: TridentLayer.LAYER_2,
    to: TridentLayer.LAYER_3,
    requires: {
      files: ['01_COMPONENTS.md', '02_SEQUENCE.md', '03_DEPENDENCIES.md', '04_FAILURE_MODES.md', '05_VERIFICATION.md'],
      structural: {
        components: 5,
        failure_modes: 3,
        dependencies: 3,
      },
      minChars: 2000
    }
  },
  {
    from: TridentLayer.LAYER_3,
    to: TridentLayer.COMPLETE,
    requires: {
      files: ['00_INDEX.md', '01_SURFACE_ANALYSIS.md', '02_ARCHITECTURE.md', '03_COMPONENTS.md', '04_DATA_FLOW.md', '05_INTERFACES.md', '06_STATE_MANAGEMENT.md', '07_ERROR_HANDLING.md', '08_TESTING.md', '09_DEPLOYMENT.md', '10_MENTAL_MODEL.md'],
      structural: { 'all_required_sections': true },
      minChars: 5000
    }
  }
];
```

---

## Validation Logic

```typescript
function validateThinking(content: string, requirements: StructuralRequirements): ValidationResult {
  const reasons: string[] = [];
  
  for (const [key, value] of Object.entries(requirements.structural)) {
    if (typeof value === 'boolean' && value) {
      if (!content.includes(key)) {
        reasons.push(`Missing required section: ${key}`);
      }
    } else if (typeof value === 'number') {
      const count = countOccurrences(content, key);
      if (count < value) {
        reasons.push(`Insufficient ${key}: found ${count}, need ${value}`);
      }
    }
  }
  
  if (content.length < requirements.minChars) {
    reasons.push(`Content too short: ${content.length} chars, need ${requirements.minChars}`);
  }
  
  return { passed: reasons.length === 0, reasons };
}
```

---

## Tool Registration

```typescript
config: async (opencodeConfig) => {
  if (!opencodeConfig.agent) opencodeConfig.agent = {};
  
  Object.assign(opencodeConfig.agent, {
    'trident': {
      name: 'trident',
      description: 'DEEP REASONING — Three-layer chain-of-thought planning',
      mode: 'primary',
      permission: { task: 'allow' },
      tools: { 
        // Write (execution - restricted)
        'write': true,
        'write_file': true,
        // Read (reasoning - full access)
        'read': true,
        'grep': true,
        'glob': true,
        'ls': true,
        'extract_code_blocks': true,
        'symbols': true,
        'imports': true,
      },
    }
  });
}
```

---

## Artifact Paths

```typescript
function getArtifactPath(layer: number, section: string): string {
  const base = path.join(process.cwd(), '.trident');
  switch (layer) {
    case 1: return path.join(base, '01_INITIAL_PLAN.md');
    case 2: return path.join(base, '02_WORKFLOW', `${section}.md`);
    case 3: return path.join(base, '03_CONTEXT_LIBRARY', `${section}.md`);
    default: throw new Error(`Invalid layer: ${layer}`);
  }
}
```

---

## State Persistence

State persists in `.trident/state.json`:

```json
{
  "currentLayer": 1,
  "iteration": "V1.0",
  "layerAttempts": 0,
  "layer1": { "complete": false, "files": [] },
  "layer2": { "complete": false, "files": [] },
  "layer3": { "complete": false, "files": [] }
}
```

---

## Iteration Loop

```typescript
const MAX_LAYER_ATTEMPTS = 3;

function handleFailure(state: TridentState): TridentState {
  state.layerAttempts++;
  
  if (state.layerAttempts >= MAX_LAYER_ATTEMPTS) {
    const [major, minor] = state.iteration.split('.').map(Number);
    state.iteration = `V${major}.${minor + 1}`;
    state.layerAttempts = 0;
  }
  
  return state;
}
```

---

*Technical Specification v2.0.0*
