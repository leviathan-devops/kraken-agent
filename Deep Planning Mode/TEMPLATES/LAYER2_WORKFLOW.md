# LAYER 2: DETAILED WORKFLOW - Template

**Purpose:** Decompose into components, map dependencies, identify risks

---

## Directory Structure

```
02_WORKFLOW/
├── 00_INDEX.md              # Overview
├── 01_COMPONENTS.md         # 5+ components
├── 02_SEQUENCE.md           # How it unfolds in time
├── 03_DEPENDENCIES.md       # What depends on what
├── 04_FAILURE_MODES.md      # 3+ ways this could fail
└── 05_VERIFICATION.md       # How to verify each component
```

---

## 00_INDEX.md Template

```markdown
# WORKFLOW OVERVIEW: [PROJECT NAME]

## High-Level Decomposition
[Brief description of the 5+ components]

## Critical Path
[What MUST happen first? What is the bottleneck?]

## Key Milestones
1. [Milestone 1]
2. [Milestone 2]
3. [Milestone 3]
```

---

## 01_COMPONENTS.md Template

```markdown
# COMPONENT DECOMPOSITION

## Component 1: [NAME]
- **Responsibility:** [What this component does]
- **Inputs:** [What it receives]
- **Outputs:** [What it produces]
- **Boundaries:** [Where it starts/ends]

## Component 2: [NAME]
[...]

[Minimum 5 components required]
```

---

## 02_SEQUENCE.md Template

```markdown
# EXECUTION SEQUENCE

## Phase 1: [NAME]
**When:** [When does this happen?]
**What:** [What happens in this phase]
**Who:** [What component handles this]

## Phase 2: [NAME]
[...]

## Phase 3: [NAME]
[...]
```

---

## 03_DEPENDENCIES.md Template

```markdown
# DEPENDENCY MAP

## Component Dependencies
[A → B means A must complete before B]

- [Component A] → [Component B]
- [Component B] → [Component C]
- [Component C] → [Component D]

[Minimum 3 dependencies required]

## Data Flow
[How does data move through the system?]
```

---

## 04_FAILURE_MODES.md Template

```markdown
# FAILURE MODE ANALYSIS

## Failure Mode 1: [DESCRIPTION]
- **Probability:** [High/Medium/Low]
- **Impact:** [What breaks if this fails]
- **Detection:** [How do we know this happened?]
- **Mitigation:** [How do we prevent/recover?]

## Failure Mode 2: [DESCRIPTION]
[...]

## Failure Mode 3: [DESCRIPTION]
[...]
```

---

## 05_VERIFICATION.md Template

```markdown
# VERIFICATION STRATEGY

## Component 1 Verification
- **Test Approach:** [How do we verify this works?]
- **Success Metric:** [What does "working" look like?]

## Component 2 Verification
[...]

[Each component must have verification defined]
```

---

## Structural Requirements

| File | Requirements | Enforces |
|------|-------------|----------|
| 01_COMPONENTS.md | 5+ components with responsibilities | Proper decomposition |
| 02_SEQUENCE.md | Ordered phases | Understanding of time/flow |
| 03_DEPENDENCIES.md | 3+ explicit dependencies | Relationship understanding |
| 04_FAILURE_MODES.md | 3+ failure modes with mitigations | Risk awareness |
| 05_VERIFICATION.md | Verification per component | Quality thinking |

---

## Anti-Shallow Checklist

- [ ] Components are NOT just "frontend/backend/database"
- [ ] Sequence shows TRUE ordering constraints
- [ ] Dependencies are MECHANICAL, not arbitrary
- [ ] Failure modes are REAL risks, not obvious stuff
- [ ] Verification is TESTABLE, not "looks good"
