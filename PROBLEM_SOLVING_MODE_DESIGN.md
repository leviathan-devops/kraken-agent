# PROBLEM SOLVING MODE - Trident Brain Mode Design

**Created:** 2026-04-12  
**Status:** Being Overhauled  
**Reference:** Derived from GOLD STANDARD docs (AGENT_BUILD_LOGIC_CHAIN.md, SHARK_AGENT_1ST_BUILD_REPORT.md, SPACE_INVADERS_BUILD_LOG.md)

---

## Mode Inventory (Complete)

| Mode | Purpose | Status |
|------|---------|--------|
| Deep Planning Mode | Project planning from first principles | ✅ Implemented |
| Problem Solving Mode | Debugging, root cause analysis, problem solving | 🔄 Being Overhauled |
| Architecture Review Mode | Codebase analysis | 🔜 Future |
| Test Generation Mode | Comprehensive test specs | 🔜 Future |
| Code Review Mode | Thorough code analysis | 🔜 Future |

---

## REVERSE-ENGINEERED PROBLEM SOLVING ARCHITECTURE

### Core Insight from Gold Standards

The successful builds don't just "solve problems" - they use a specific **cognitive iteration pattern**:

```
ASSUMPTION → ACTION → OBSERVATION → COMPARISON → ADJUSTMENT → META-REFLECTION
```

Every step has **evidence** backing the next decision. This is NOT in the original 4-layer design.

---

## REVISED LAYERS FOR PROBLEM SOLVING

### Layer 1: ASSUMPTION STATEMENT

**Thinking:** "What do I think will happen? What am I assuming?"

**From AGENT_BUILD_LOGIC_CHAIN.md pattern:**
- State the assumption explicitly
- State WHY you believe it (reasoning chain)
- State what would confirm/disprove it

**Structural Requirements:**
- Explicit assumption stated in one sentence
- Reasoning chain documented (why you believe it)
- Explicit success criteria defined upfront

**Anti-Derailment:** Prevents "I'll try X" without defining what success looks like

---

### Layer 2: ACTION WITH PREDICTION

**Thinking:** "What action will I take? What specific output do I expect?"

**From GOLD STANDARD pattern:**
- Don't just "test" - specify what you'll observe
- Log the exact command/API call being made
- State the expected output explicitly

**Structural Requirements:**
- Exact command/steps to execute
- Expected output documented BEFORE execution
- Environment state captured (versions, config, etc.)

---

### Layer 3: OBSERVATION & EVIDENCE

**Thinking:** "What actually happened? Show me the proof."

**Critical Pattern from AGENT_BUILD_LOGIC_CHAIN.md:**
- Copy ACTUAL output, don't describe it
- Check LOGS not just API responses
- Compare expected vs actual side-by-side

**Structural Requirements:**
- Raw output captured (not paraphrased)
- Logs checked for side effects
- Expected vs Actual comparison in table format

**Anti-Derailment:** Prevents "it worked" without showing evidence. Prevents self-referencing proofs (created by agent = invalid).

---

### Layer 4: GAP ANALYSIS & ADJUSTMENT

**Thinking:** "The gap between expected and actual tells me what?"

**From GOLD STANDARD pattern:**
- Each failure IS information
- Adjust the hypothesis, not just retry
- State the new understanding

**Structural Requirements:**
- Gap analysis: "I expected X, got Y, therefore Z"
- Updated hypothesis documented
- Next action tied to this insight

---

### Layer 5: META-COGNITIVE REFLECTION

**Thinking:** "What should I have done differently? What pattern can I extract?"

**From AGENT_BUILD_LOGIC_CHAIN.md - the "What I Should Have Done" sections:**
- Retroactive pattern recognition
- Generalizable insight extracted
- What systemic issue does this reveal?

**Structural Requirements:**
- "What I Should Have Done" documented per major step
- Pattern extracted that applies to future problems
- Root cause vs symptom distinction reinforced

---

### Layer 6: VERIFICATION & CONFIRMATION

**Thinking:** "How do I know the fix actually worked?"

**From SPACE_INVADERS_BUILD_LOG.md - Verification Phase:**
- Test in target environment, not just check syntax
- Look for console errors, not just "no crash"
- Confirm behavior matches original requirement

**Structural Requirements:**
- Actual execution in target environment
- Behavior matches documented requirement
- No regressions introduced

---

## PROBLEM SOLVING MODE: ENFORCEMENT CHECKLIST

| Layer | Requirement | Prevents |
|-------|--------------|-----------|
| Assumption | State expected outcome before action | Blind trying |
| Action | Specify exact command + expected output | Vague testing |
| Observation | Raw evidence, logs checked | "It works" claims |
| Gap Analysis | Adjust hypothesis, don't just retry | Repetitive failure |
| Meta-Reflection | Extract pattern from each failure | Same mistake repeated |
| Verification | Test in actual environment | Assumptions = reality |

---

## EXAMPLE: How This Would Have Prevented Debug Log Failures

| Failure Category | How This Mode Prevents It |
|------------------|---------------------------|
| Host Fallback | Layer 3 requires logs showing HTTP request sent to bridge |
| Success Claims Without Proof | Layer 3 requires raw evidence, not "assessment" |
| Mock/Stub Suggestions | Layer 6 requires actual environment execution |
| Confusion Pretense | Layer 1 requires explicit assumption statement |
| Self-Referencing Proof | Layer 3 requires evidence from external system (logs, API) |

---

## DERIVED FROM GOLD STANDARD EXAMPLES

### From AGENT_BUILD_LOGIC_CHAIN.md (Mattermost Integration)
- Iteration 1: Database insertion → didn't work → logs showed no HTTP request
- Iteration 2: API creation → didn't work → config blocked internal IPs
- Iteration 3: Config update → didn't work → file permissions
- Each failure added information for next attempt

### From SHARK_AGENT_1ST_BUILD_REPORT.md
- 6-phase pipeline: Requirements → Architecture → Spec → Implementation → Verification → Delivery
- Each phase has explicit outputs and checkpoints

### From SPACE_INVADERS_BUILD_LOG.md
- 13-agent parallel execution with clear dependencies
- Strategic decomposition BEFORE implementation

---

**Status:** This design extracted from actual successful problem solving traces. Ready for implementation.