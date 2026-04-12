# Context Synthesis Mode

**Part of:** [Trident Brain](../00_INDEX.md)  
**Type:** Dynamic Context Management Agent  
**Inspiration:** Kraken V2.0 compaction-manager.ts, Hermes Memory Overhaul L0/L1/L2

---

## Overview

Context Synthesis Mode is a **dynamically triggerable** context synthesis process that consolidates T1/T2/T3/T4 context and injects it directly into the agent's thought stream at T0 level.

**Key Difference from Kraken:**
- Kraken: Auto-triggers at 85% token threshold (post-compaction)
- Context Synthesis: On-demand trigger at any time + automatic triggers

**Key Difference from Hermes Memory:**
- Hermes: Static L0→L1→L2 retrieval (search-based)
- Context Synthesis: Real-time synthesis + injection (dynamic)

---

## 4 Layers of Synthesis

| Layer | Thinking Purpose | Enforces |
|-------|-----------------|----------|
| **Layer 1** | "What context exists?" | Complete collection of all sources |
| **Layer 2** | "What matters most?" | Relevance scoring and ranking |
| **Layer 3** | "How to compress?" | Synthesis into <2k tokens |
| **Layer 4** | "How to inject?" | T0-ready format output |

---

## Folder Structure

```
Context Synthesis Mode/
├── 00_INDEX.md                      # This file
├── ARCHITECTURE/
│   └── TRIDENT_BRAIN.md            # Complete architecture
├── META/
│   ├── DESIGN_REASONING.md         # Design process
│   └── AUDIT_LOG.md               # Change tracking
├── SPEC/
│   └── TRIDENT_SPEC.md             # Technical spec
└── TEMPLATES/
    ├── LAYER1_COLLECTION.md        # Layer 1 template
    ├── LAYER2_SCORING.md           # Layer 2 template
    ├── LAYER3_COMPRESSION.md       # Layer 3 template
    └── LAYER4_INJECTION.md         # Layer 4 template
```

---

## Tool Set

| Type | Tools |
|------|-------|
| **Execution (restricted)** | `write`, `write_file` |
| **Read (full access)** | `read`, `grep`, `glob`, `ls`, `hermes_remember`, `hive_context`, `memread_session`, `kraken_hive_search` |

---

*Context Synthesis Mode — Real-time context injection for Trident Brain*