# TRIDENT BRAIN

**Status:** ⚠️ ARCHITECTURE SPECIFICATION ONLY — NOT YET IMPLEMENTED  
**Version:** 1.0.0  
**Created:** 2026-04-12

---

## ⚠️ IMPORTANT: This is an Architecture Spec, Not Code

**This repository contains architecture specifications and design documents only.**  
There is no `src/` or `dist/` folder because this has not been built yet.

The purpose of this repo is to document the reasoning architecture that can be used to build agents with deep, structured thinking patterns.

---

## What is Trident Brain?

Trident Brain is a **multi-mode reasoning architecture** for OpenCode agents. It provides specialized reasoning processes for different thinking tasks, each with mechanical gate enforcement to prevent shallow reasoning and derailment.

**Core Philosophy:**
- **Mechanical Gates** - Evidence-based transitions (can't advance without proof)
- **Structural Enforcement** - Requirements that force deep thinking
- **Injectable Output** - Artifacts designed for other agents to consume
- **Layered Depth** - Each layer goes deeper into the problem

---

## Modes Implemented

| Mode | Purpose | Layers | Status |
|------|---------|--------|--------|
| **Deep Planning Mode** | Generate complete project plans from first principles | 3 | Architecture Complete |
| **Problem Solving Mode** | Evidence-based debugging and root cause analysis | 6 | Architecture Complete |
| **Context Synthesis Mode** | Dynamically synthesize context into <2k token injection | 4 | Architecture Complete |

---

## Directory Structure

```
trident-brain/
├── Deep Planning Mode/           # Project planning mode
│   ├── 00_INDEX.md              # Mode entry point
│   ├── ARCHITECTURE/            # Full architecture
│   │   └── TRIDENT_BRAIN.md
│   ├── SPEC/                    # Technical specification
│   │   └── TRIDENT_SPEC.md
│   ├── META/                    # Design reasoning + audit
│   │   ├── DESIGN_REASONING.md
│   │   └── AUDIT_LOG.md
│   └── TEMPLATES/               # Layer enforcement templates
│       ├── LAYER1_INITIAL_PLAN.md
│       ├── LAYER2_WORKFLOW.md
│       └── LAYER3_CONTEXT_LIBRARY.md
│
├── Problem Solving Mode/         # Debugging/RCA mode
│   ├── 00_INDEX.md
│   ├── ARCHITECTURE/
│   │   └── TRIDENT_BRAIN.md
│   ├── SPEC/
│   │   └── TRIDENT_SPEC.md
│   ├── META/
│   │   ├── DESIGN_REASONING.md
│   │   └── AUDIT_LOG.md
│   └── TEMPLATES/               # 6 layer templates
│       ├── LAYER1_ASSUMPTION.md
│       ├── LAYER2_ACTION.md
│       ├── LAYER3_OBSERVATION.md
│       ├── LAYER4_GAP_ANALYSIS.md
│       ├── LAYER5_META_REFLECTION.md
│       └── LAYER6_VERIFICATION.md
│
├── Context Synthesis Mode/      # Context injection mode
│   ├── 00_INDEX.md
│   ├── ARCHITECTURE/
│   │   └── TRIDENT_BRAIN.md
│   ├── SPEC/
│   │   └── TRIDENT_SPEC.md
│   ├── META/
│   │   ├── DESIGN_REASONING.md
│   │   └── AUDIT_LOG.md
│   └── TEMPLATES/               # 4 layer templates
│       ├── LAYER1_COLLECTION.md
│       ├── LAYER2_SCORING.md
│       ├── LAYER3_COMPRESSION.md
│       └── LAYER4_INJECTION.md
│
├── 00_INDEX.md                  # Main index (this file links to modes)
├── README.md                    # You are here
├── COMPACTION_SURVIVAL.md       # Session recovery guide
└── TRIDENT_BRAIN_Knowledge.md   # Quick reference for injection
```

---

## Mode Details

### 1. Deep Planning Mode

**Purpose:** Generate complete, injectable project plans from first principles

**Layers:**
1. **Initial Plan** — "What is this really?" → First principles, surface understanding
2. **Detailed Workflow** — "How does it decompose?" → Components, sequences, risks
3. **Context Library** — "Can I explain to another agent?" → Architecture, interfaces, mental model

**Output:** Self-contained context library another agent can read and execute

**Use when:** You need a complete project specification with deep reasoning

---

### 2. Problem Solving Mode

**Purpose:** Evidence-based debugging and root cause analysis

**Layers:**
1. **Assumption Statement** — "What do I assume?" → Explicit assumption + reasoning chain
2. **Action with Prediction** — "What action + expected output?" → Exact command + expected
3. **Observation & Evidence** — "What actually happened?" → Raw evidence, logs, comparison
4. **Gap Analysis & Adjustment** — "What does the gap tell me?" → Updated hypothesis
5. **Meta-Cognitive Reflection** — "What should I have done differently?" → Pattern extraction
6. **Verification & Confirmation** — "How do I confirm fix works?" → Target environment test

**Output:** Injectable debugging chain with iteration tracking (V1.0 → V1.1 → V1.2)

**Use when:** You need to solve a problem systematically with evidence-based iteration

**Key Feature:** Prevents 14 categories of derailment (Host Fallback, Success Claims Without Proof, Mock/Stub, etc.)

**Derived from:** Analyzing GOLD STANDARD docs (AGENT_BUILD_LOGIC_CHAIN.md, SHARK_AGENT_1ST_BUILD_REPORT.md, SPACE_INVADERS_BUILD_LOG.md)

---

### 3. Context Synthesis Mode

**Purpose:** Dynamically synthesize T1/T2/T3/T4 context into <2k token injection stream

**Layers:**
1. **Context Collection** — "What context exists?" → Gather all sources
2. **Relevance Scoring** — "What matters most?" → Score by urgency × importance
3. **Compression** — "How to compress?" → Synthesize into <2k tokens
4. **Injection Format** — "How to inject?" → T0-ready format output

**Output:** T0-ready context injection for real-time thought stream

**Use when:** You need to consolidate context, manage token budget, or inject relevant knowledge

**Key Feature:** Combines Kraken V2.0 token management + Hermes Memory tiers + on-demand triggers

---

## How It Works

### Mechanical Gate Enforcement

Each mode uses **mechanical gates** - you cannot advance to the next layer without meeting structural requirements. This prevents:
- Skipping important thinking steps
- Claiming success without proof
- Making assumptions without justification
- Testing without clear expected outcomes

### Example: Problem Solving Mode Flow

```
PROBLEM
    │
    ▼
Layer 1: Assumption Statement
├── Must state explicit assumption
├── Must document reasoning chain
├── Must define success criteria
└── Cannot advance without these
    │
    ▼
Layer 2: Action with Prediction
├── Must specify exact command
├── Must document expected output
├── Must capture environment state
└── Cannot advance without these
    │
    ▼
Layer 3: Observation & Evidence
├── Must show raw evidence (copy-paste)
├── Must check logs
├── Must show expected vs actual table
└── Cannot claim "it worked" without proof
    │
    ▼
... and so on for all 6 layers
```

### Iteration Loops

Problem Solving Mode supports iteration (V1.0 → V1.1 → V1.2) for complex problems. Each iteration deepens understanding:
- V1.0: Initial hypothesis → test → observe gap
- V1.1: Adjusted hypothesis → test → observe gap
- V1.2: Root cause identified → fix → verify

---

## Design Sources

### Problem Solving Mode
Reverse-engineered from analyzing:
- `AGENT_BUILD_LOGIC_CHAIN.md` — Mattermost slash command debugging
- `SHARK_AGENT_1ST_BUILD_REPORT.md` — Space Invaders build
- `SPACE_INVADERS_BUILD_LOG.md` — 13-agent parallel execution

### Context Synthesis Mode
Inspired by:
- Kraken V2.0 `compaction-manager.ts` — Token budget management
- Hermes Memory Overhaul — L0/L1/L2 tier structure

---

## Tool Set (When Implemented)

All modes share a restricted tool set:

| Type | Tools |
|------|-------|
| **Execution (restricted)** | `write`, `write_file` |
| **Read (full access)** | `read`, `grep`, `glob`, `ls`, `extract_code_blocks`, `symbols`, `imports` |

This ensures pure reasoning — no execution, only thinking artifacts.

---

## Building This

To implement this as an OpenCode plugin, you would need:

1. **Plugin Structure:**
   ```
   trident-brain/
   ├── src/
   │   ├── index.ts              # Plugin entry
   │   ├── coordinator.ts        # Mode selector
   │   ├── modes/
   │   │   ├── planning/         # Deep Planning Mode
   │   │   ├── problem-solving/ # Problem Solving Mode
   │   │   └── context-synthesis/# Context Synthesis Mode
   │   ├── gates.ts              # Layer definitions + requirements
   │   └── validator.ts          # Structural validation
   └── package.json
   ```

2. **State Machine:** Each mode needs a state machine to track layer progress

3. **Gate Transitions:** Define what requirements must be met to advance

4. **Output Generation:** Templates produce standardized artifacts

---

## Comparison to Other Systems

| Feature | Manta Agent | Kraken V2.0 | Trident Brain |
|---------|-------------|-------------|----------------|
| Mode Types | Single (Build Brain) | Multi-brain orchestrator | Multi-mode reasoning |
| Gate System | PLAN/BUILD/TEST | PLAN/BUILD/TEST/VERIFY/AUDIT/DELIVERY | Per-mode layers |
| Context | Direct execution | Compaction management | Mode-specific synthesis |
| Output | Implementation | Orchestration | Thinking artifacts |

---

## Notes

- **Not yet implemented** — This is architecture specification only
- **For OpenCode** — Designed as OpenCode plugin
- **Mechanical enforcement** — Key differentiator from other agent architectures
- **Injectable artifacts** — Designed for cross-agent communication

---

## License

Internal use — Architecture specification from Leviathan's OpenCode workspace

---

*Trident Brain — Modular reasoning architecture with mechanical gate enforcement*
*Last updated: 2026-04-12*