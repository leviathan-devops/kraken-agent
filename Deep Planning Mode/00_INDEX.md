# Deep Planning Mode

**Part of:** [Trident Brain](../00_INDEX.md)  
**Type:** Pure Reasoning/Planning Agent  
**Inspiration:** DeepSeek R1 chain-of-thought, Manta mechanical gates

---

## Overview

Deep Planning Mode produces deeply structured, injectable reasoning artifacts through mechanical gate enforcement.

**Key Difference from Manta:**
- No Build Brain - purely reasoning (no implementation)
- Restricted execution tools: `write` only (no bash, no build, no network)
- Full read access: `read`, `grep`, `glob`, `ls`, `extract_code_blocks` for synthesis
- Mechanical depth enforcement through iteration loops

---

## 3 Layers of Deep Reasoning

| Layer | Thinking Purpose | Evokes |
|-------|-----------------|--------|
| **Layer 1** | "What is this really?" | First principles, surface understanding |
| **Layer 2** | "How does it decompose?" | Components, sequences, risks |
| **Layer 3** | "Can I explain it to another agent?" | Architecture, interfaces, mental model |

---

## Folder Structure

```
Deep Planning Mode/
├── 00_INDEX.md                      # This file
├── ARCHITECTURE/TRIDENT_BRAIN.md   # Complete architecture
├── META/
│   ├── DESIGN_REASONING.md         # Design process
│   └── AUDIT_LOG.md               # Change tracking
├── SPEC/TRIDENT_SPEC.md            # Technical spec
└── TEMPLATES/
    ├── LAYER1_INITIAL_PLAN.md     # Layer 1 template
    ├── LAYER2_WORKFLOW.md         # Layer 2 template
    └── LAYER3_CONTEXT_LIBRARY.md  # Layer 3 template
```

---

## Tool Set

| Type | Tools |
|------|-------|
| **Execution (restricted)** | `write`, `write_file` |
| **Read (full access)** | `read`, `grep`, `glob`, `ls`, `extract_code_blocks`, `symbols`, `imports` |

---

*Deep Planning Mode - Mechanical depth enforcement for chain-of-thought reasoning*
