# Problem Solving Mode

**Part of:** [Trident Brain](../00_INDEX.md)  
**Type:** Pure Reasoning/Analysis Agent  
**Inspiration:** AGENT_BUILD_LOGIC_CHAIN.md iterative debugging, SHARK_AGENT_1ST_BUILD_REPORT.md 6-phase pipeline

---

## Overview

Problem Solving Mode produces deeply structured debugging and root cause analysis artifacts through mechanical gate enforcement.

**Key Difference from Deep Planning:**
- Planning = Synthetic (creating new things)
- Problem Solving = Analytical (understanding existing things)
- Inverted process: Start complex (symptom) → strip away layers → find root cause
- Iteration pattern: ASSUMPTION → ACTION → OBSERVATION → COMPARISON → ADJUSTMENT → META-REFLECTION

---

## 6 Layers of Problem Solving

| Layer | Thinking Purpose | Enforces |
|-------|-----------------|----------|
| **Layer 1** | "What do I assume?" | Explicit assumption + reasoning chain + success criteria |
| **Layer 2** | "What action + expected output?" | Exact command + expected output + environment state |
| **Layer 3** | "What actually happened?" | Raw evidence, logs checked, expected vs actual comparison |
| **Layer 4** | "What does the gap tell me?" | Gap analysis, updated hypothesis, next action tied to insight |
| **Layer 5** | "What should I have done differently?" | Pattern extraction, systemic issue identification |
| **Layer 6** | "How do I confirm fix works?" | Target environment execution, behavior matches requirement |

---

## Folder Structure

```
Problem Solving Mode/
├── 00_INDEX.md                      # This file
├── ARCHITECTURE/TRIDENT_BRAIN.md   # Complete architecture
├── META/
│   ├── DESIGN_REASONING.md         # Design process
│   └── AUDIT_LOG.md               # Change tracking
├── SPEC/TRIDENT_SPEC.md            # Technical spec
└── TEMPLATES/
    ├── LAYER1_ASSUMPTION.md        # Layer 1 template
    ├── LAYER2_ACTION.md            # Layer 2 template
    ├── LAYER3_OBSERVATION.md       # Layer 3 template
    ├── LAYER4_GAP_ANALYSIS.md      # Layer 4 template
    ├── LAYER5_META_REFLECTION.md   # Layer 5 template
    └── LAYER6_VERIFICATION.md      # Layer 6 template
```

---

## Tool Set

| Type | Tools |
|------|-------|
| **Execution (restricted)** | `write`, `write_file` |
| **Read (full access)** | `read`, `grep`, `glob`, `ls`, `extract_code_blocks`, `symbols`, `imports` |

---

*Problem Solving Mode - Mechanical evidence-based debugging through iteration gates*