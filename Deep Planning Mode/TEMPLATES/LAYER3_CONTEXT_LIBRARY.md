# LAYER 3: CONTEXT LIBRARY - Template

**Purpose:** Create injectable reasoning chain - another agent can read and execute

---

## Directory Structure

```
CONTEXT_LIBRARY/
├── 00_INDEX.md                    # What this project is
├── 01_SURFACE_ANALYSIS.md        # Problem statement
├── 02_ARCHITECTURE.md             # How it fits together
├── 03_COMPONENTS.md              # Parts and jobs
├── 04_DATA_FLOW.md              # How data moves
├── 05_INTERFACES.md             # API contracts
├── 06_STATE_MANAGEMENT.md       # What persists
├── 07_ERROR_HANDLING.md         # Failure recovery
├── 08_TESTING.md               # Verification approach
├── 09_DEPLOYMENT.md           # How it ships
└── 10_MENTAL_MODEL.md         # Simplest explanation
```

---

## File Templates

### 00_INDEX.md

```markdown
# [PROJECT NAME] - Context Library

## What Is This Project?
[Brief 2-3 sentence description]

## How To Use This Library
[Read these files in order. They build on each other.]

## Quick Start
[What another agent needs to know to get started]
```

---

### 01_SURFACE_ANALYSIS.md

```markdown
# Surface Analysis

## Problem Statement
[What problem does this solve?]

## Scope
- **In Scope:** [What we're building]
- **Out of Scope:** [What's explicitly NOT included]
```

---

### 02_ARCHITECTURE.md

```markdown
# Architecture

## High-Level Design
[ASCII diagram or description]

## Key Architectural Decisions
1. [Decision 1] - [Why]
2. [Decision 2] - [Why]
```

---

### 03_COMPONENTS.md

```markdown
# Components

## Component: [NAME]
- **Purpose:** [What it does]
- **API:** [How to interact]
- **Dependencies:** [What it needs]
```

---

### 04_DATA_FLOW.md

```markdown
# Data Flow

## Entry Points
[How data enters]

## Processing Pipeline
[Step 1] → [Step 2] → [Step 3]

## Storage
[Where data lives]
```

---

### 05_INTERFACES.md

```markdown
# Interfaces

## External API
[Public endpoints]

## Internal API
[How components talk]

## Contracts
[Data formats, protocols]
```

---

### 06_STATE_MANAGEMENT.md

```markdown
# State Management

## What Persists
[Database, files]

## State Machine
[States and transitions]
```

---

### 07_ERROR_HANDLING.md

```markdown
# Error Handling

## Error Types
| Type | Cause | Response |

## Recovery Strategies
[How system recovers]
```

---

### 08_TESTING.md

```markdown
# Testing Strategy

## Unit Tests
[What's tested at unit level]

## Integration Tests
[What's tested end-to-end]
```

---

### 09_DEPLOYMENT.md

```markdown
# Deployment

## Environments
[dev, staging, prod]

## Build Process
[How to build]

## Deployment Steps
[How to deploy]
```

---

### 10_MENTAL_MODEL.md

```markdown
# Mental Model

## One-Sentence Explanation
[If someone asks "what is this?" - one sentence answer]

## Key Abstraction
[The most important concept]

## How To Think About It
[The simplest way to understand how it works]
```

---

## Structural Requirements

| File | Purpose | Injection Readiness |
|------|---------|---------------------|
| 00_INDEX.md | Orientation | How to use library |
| 01_SURFACE_ANALYSIS.md | Problem | What's being built |
| 02_ARCHITECTURE.md | Design | How it fits together |
| 03_COMPONENTS.md | Parts | What the pieces are |
| 04_DATA_FLOW.md | Movement | How data moves |
| 05_INTERFACES.md | Contracts | How things talk |
| 06_STATE_MANAGEMENT.md | Persistence | What persists |
| 07_ERROR_HANDLING.md | Reliability | What can go wrong |
| 08_TESTING.md | Quality | How to verify |
| 09_DEPLOYMENT.md | Shipping | How to deploy |
| 10_MENTAL_MODEL.md | Understanding | Simplest explanation |

---

## Injection Readiness Checklist

- [ ] Another agent can read 00_INDEX and know what to read next
- [ ] 01_SURFACE explains problem without assuming prior knowledge
- [ ] 02_ARCHITECTURE shows how ALL pieces fit together
- [ ] Each component in 03 is self-contained
- [ ] Data flow in 04 is TRACEABLE from input to output
- [ ] Interfaces in 05 have complete parameter documentation
- [ ] Error handling in 07 covers all failure modes
- [ ] 10_MENTAL_MODEL fits in one paragraph but conveys essential understanding
