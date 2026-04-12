# TRIDENT BRAIN - Deep Reasoning Agent

**Version:** 2.0.0 (Overhauled)  
**Type:** Pure Reasoning/Planning Agent  
**Architecture:** Mechanical Gate Chain (Manta-inspired)  
**Inspiration:** DeepSeek R1 chain-of-thought reasoning, Manta agent mechanics

---

## META: Design Alignment

This architecture was designed with the following reasoning process:

1. **Input**: User wanted "deep reasoning brain" with mechanical enforcement, 3 layers default, purely reasoning (no implementation), `write` as primary execution tool with full read access
2. **Key insight**: The "Injectable Reasoning Chain E2E" and "Full Project Map" are NOT separate layers - they are the OUTPUT FORMAT of the context library
3. **Enforcement philosophy**: STRUCTURAL requirements (must think about X) not quantitative (wrote Y chars)
4. **Iteration concept**: Iterations deepen each layer, not skip between layers
5. **Toolset correction**: "Only write tool" was wrong - planning brain needs READ tools to synthesize. Restricted EXECUTION (no shell/build/network), full READ access.

---

## Core Concept

Trident Brain forces **structured deep thinking** through mechanical gate enforcement. You cannot advance until you have truly reasoned through each aspect.

```
TRIDENT BRAIN
│
├── GATE 1: INITIAL PLAN
│   └── THINKING: "What is this really?"
│       Evokes: First principles, surface understanding
│
├── GATE 2: DETAILED BUILD WORKFLOW
│   └── THINKING: "How does it decompose?"
│       Evokes: Components, sequences, dependencies, risks
│
└── GATE 3: SELF-CONTAINED CONTEXT LIBRARY
    └── THINKING: "Can I explain it to another agent?"
        Evokes: Architecture, interfaces, states, error handling
        
        ↓ OUTPUT FORMAT ↓
        
    INJECTABLE REASONING CHAIN E2E
    FULL PROJECT MAP: IDEA → PRODUCTION GRADE
```

**The 3 layers are DEPTH, not separate phases.** Each layer goes deeper into the same problem.

---

## The 3 Gates with Thinking Purpose

### GATE 1: INITIAL PLAN

**Thinking Purpose:** "What is this really? What are we trying to solve?"

**Evokes:**
- First principles analysis (3+ principles that are non-negotiable)
- Surface understanding (what's being asked, in my own words)
- Constraints (what must be true)
- Success criteria (how do we know we're done)
- Open questions (what do we not know yet)

**Cannot advance until you can answer:**
- What is the CORE problem, not the symptoms?
- What 3 principles govern this domain?
- What would make this succeed or fail?

---

### GATE 2: DETAILED BUILD WORKFLOW

**Thinking Purpose:** "How does this decompose? What are the parts?"

**Evokes:**
- Decomposition (break into 5+ components)
- Sequencing (what must come before what)
- Dependencies (what relies on what)
- Risk identification (3+ ways this could fail)
- Verification strategy (how do we verify each part)

**Cannot advance until you can answer:**
- What are the 5 main components?
- What is the critical path?
- What 3 things could derail this?
- How do we verify each component works?

---

### GATE 3: SELF-CONTAINED CONTEXT LIBRARY

**Thinking Purpose:** "Can I explain this so another agent can execute it?"

**Evokes:**
- Architecture (how it fits together)
- Interfaces (what talks to what)
- State management (what persists, how)
- Error handling (what can go wrong, how recovered)
- Testing strategy (how do we know it works)
- Mental model (the simplest way to think about this)

**Output is an INJECTABLE REASONING CHAIN:**
- Another agent reads these files
- Has complete context to execute
- No ambiguity, no missing pieces

**Cannot complete until you can:**
- Write the architecture section such that another agent understands
- Define interfaces precisely
- Map the complete data flow
- Identify all failure modes

---

## Mechanical Enforcement

### Structural Requirements (Not Just Char Counts)

The key insight: **you can write 500 chars of shallow nonsense, but you cannot write 500 chars that doesn't address the required thinking points.**

#### Gate 1 Requirements

| Requirement | What It Enforces |
|------------|------------------|
| 3+ first principles | Must identify FUNDAMENTAL truths |
| Surface understanding section | Must explain in YOUR words |
| 3+ constraints | Must identify LIMITS |
| Success criteria | Must define DONE |
| 2+ open questions | Must acknowledge UNKNOWNS |

#### Gate 2 Requirements

| Requirement | What It Enforces |
|------------|------------------|
| 5+ components | Must DECOMPOSE properly |
| Sequence diagram | Must understand ORDER |
| 3+ dependencies | Must understand RELATIONSHIPS |
| 3+ failure modes | Must think about RISK |
| Verification for each component | Must think about TESTING |

#### Gate 3 Requirements

| Requirement | What It Enforces |
|------------|------------------|
| Complete architecture section | Must see WHOLE SYSTEM |
| All interfaces defined | Must PRECISE CONTRACTS |
| Data flow mapped | Must understand MOVEMENT |
| Error handling for each layer | Must think about FAILURE |
| Mental model that fits in one paragraph | Must SIMPLIFY |

---

## Iteration Loop: Depth Through Iteration

**Key interpretation:** The iterations deepen EACH LAYER, not skip between layers.

```
V1.0: Layer 1 (Initial Plan)
    ↓ 3 VERIFY failures
V1.1: Layer 1 DEEPER (same gate, more depth)
    ↓ 3 VERIFY failures
V1.2: Layer 2 (Detailed Workflow) ← now we move to next gate
    ↓ 3 VERIFY failures
V1.3: Layer 2 DEEPER
    ↓ 3 VERIFY failures
V1.4: Layer 3 (Context Library)
    ↓ ...
V1.6: COMPLETE - Full Injectable Reasoning Chain
```

**Why this matters:** You might need 6 iterations total to deeply think through all 3 layers.

---

## Artifact Structure

### Layer 1: Initial Plan (`01_INITIAL_PLAN.md`)

```markdown
# INITIAL PLAN: [TASK NAME]

## Surface Understanding
[Explain what is being asked in YOUR OWN WORDS]

## First Principles
[3+ fundamental truths]
1. [Principle 1]
2. [Principle 2]
3. [Principle 3]

## Constraints
[3+ limits]
- [Constraint 1]
- [Constraint 2]
- [Constraint 3]

## Success Criteria
[How do we know we've succeeded?]

## Open Questions
[2+ things we don't yet know]

## Direction
[Initial approach]
```

### Layer 2: Detailed Workflow (`02_WORKFLOW/`)

```
02_WORKFLOW/
├── 00_INDEX.md              # Overview
├── 01_COMPONENTS.md         # 5+ components
├── 02_SEQUENCE.md           # How it unfolds
├── 03_DEPENDENCIES.md       # What depends on what
├── 04_FAILURE_MODES.md      # 3+ failure modes
└── 05_VERIFICATION.md       # How to verify
```

### Layer 3: Context Library (`03_CONTEXT_LIBRARY/`)

```
CONTEXT_LIBRARY/
├── 00_INDEX.md                    # How to use this library
├── 01_SURFACE_ANALYSIS.md        # Problem
├── 02_ARCHITECTURE.md             # How it fits
├── 03_COMPONENTS.md              # Parts
├── 04_DATA_FLOW.md              # Movement
├── 05_INTERFACES.md             # Contracts
├── 06_STATE_MANAGEMENT.md       # Persistence
├── 07_ERROR_HANDLING.md         # Failures
├── 08_TESTING.md               # Verification
├── 09_DEPLOYMENT.md           # Shipping
└── 10_MENTAL_MODEL.md         # Simplest explanation
```

---

## Tool Set

### Execution Tools (WRITE ONLY - No Shell/Build)

| Tool | Purpose |
|------|---------|
| `write` | Write reasoning artifacts |
| `write_file` | Write individual files |

### Reasoning Tools (READ - Full Access)

| Tool | Purpose |
|------|---------|
| `read` | Read existing files, context |
| `grep` | Search for patterns |
| `glob` | Find files |
| `ls` | List directory |
| `extract_code_blocks` | Parse code |
| `symbols` | Extract functions/classes |
| `imports` | Map dependencies |

### Why This Separation?

**Execution restriction** ensures Trident is a pure reasoning engine:
- No `bash` / `shell` - cannot execute commands
- No `npm` / `pip` - cannot install dependencies
- No `curl` / `wget` - cannot make network calls

**READ access** enables synthesis:
- Must read existing context to build on it
- Must search codebase to understand architecture
- Must extract code structure to reason about components

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
  layerAttempts: number;   // Failures at current layer
  artifacts: Map<string, string>;
}
```

---

## Enforcement Rules

1. **No Skipping** - Cannot advance until requirements met
2. **Structural Validation** - Must address required thinking points
3. **Depth Through Iteration** - Iterations add refinement
4. **Context Preservation** - Each iteration preserves previous artifacts

---

## Comparison

| Aspect | Shallow Agent | Trident Brain |
|--------|--------------|---------------|
| Planning | "I'll build a REST API" | Surface understanding documented |
| Decomposition | "I'll figure it out as I go" | 5+ components defined |
| Risk | "That won't happen" | 3+ failure modes identified |
| Explanation | "Look at the code" | Mental model written |
| Context | Lost in implementation | Library injectable |

---

*Trident Brain v2.0 - Mechanical depth enforcement for chain-of-thought reasoning*
