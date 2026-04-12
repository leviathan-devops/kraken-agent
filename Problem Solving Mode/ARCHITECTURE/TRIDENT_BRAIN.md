# TRIDENT BRAIN - Problem Solving Agent

**Version:** 1.0.0  
**Type:** Pure Reasoning/Analysis Agent  
**Architecture:** Iterative Evidence-Based Debugging (Manta-inspired)  
**Inspiration:** AGENT_BUILD_LOGIC_CHAIN.md, SHARK_AGENT_1ST_BUILD_REPORT.md, SPACE_INVADERS_BUILD_LOG.md

---

## META: Design Alignment

This architecture was designed with the following reasoning process:

1. **Input**: User wanted to reverse-engineer HOW successful agents solve problems from GOLD STANDARD docs
2. **Key insight**: Successful problem solving is NOT "try X" - it's evidence-based iteration where each failure adds information
3. **Core pattern extracted**: `ASSUMPTION → ACTION → OBSERVATION → COMPARISON → ADJUSTMENT → META-REFLECTION`
4. **Enforcement philosophy**: STRUCTURAL requirements (must show evidence) not quantitative (wrote Y chars)
5. **Anti-derailment**: Prevents 14 failure categories from debug logs (Host Fallback, Success Claims Without Proof, Mock/Stub, etc.)

---

## Core Concept

Problem Solving Mode forces **evidence-based debugging** through mechanical gate enforcement. You cannot claim success without showing proof, cannot advance without analyzing the gap.

```
PROBLEM SOLVING MODE
│
├── GATE 1: ASSUMPTION STATEMENT
│   └── THINKING: "What do I assume? Why do I believe it?"
│       Evokes: Explicit assumption, reasoning chain, success criteria
│
├── GATE 2: ACTION WITH PREDICTION
│   └── THINKING: "What action will I take? What output do I expect?"
│       Evokes: Exact command, expected output, environment state
│
├── GATE 3: OBSERVATION & EVIDENCE
│   └── THINKING: "What actually happened? Show me the proof."
│       Evokes: Raw output, logs checked, expected vs actual comparison
│
├── GATE 4: GAP ANALYSIS & ADJUSTMENT
│   └── THINKING: "The gap tells me what? Adjust hypothesis."
│       Evokes: Gap analysis, updated hypothesis, next action tied to insight
│
├── GATE 5: META-COGNITIVE REFLECTION
│   └── THINKING: "What should I have done differently?"
│       Evokes: Pattern extraction, systemic issue identification
│
└── GATE 6: VERIFICATION & CONFIRMATION
    └── THINKING: "How do I know the fix actually worked?"
        Evokes: Target environment execution, behavior matches requirement
```

**The 6 layers form ONE iteration cycle.** Multiple iterations may be needed for complex problems.

---

## The 6 Gates with Thinking Purpose

### GATE 1: ASSUMPTION STATEMENT

**Thinking Purpose:** "What do I assume? What do I believe will happen?"

**Evokes:**
- Explicit assumption stated in one sentence
- Reasoning chain (why you believe it)
- Success criteria defined upfront
- What would confirm/disprove the assumption

**Cannot advance until you can answer:**
- What is my explicit assumption?
- Why do I believe this is true?
- What does success look like?
- What would prove this wrong?

---

### GATE 2: ACTION WITH PREDICTION

**Thinking Purpose:** "What action will I take? What specific output do I expect?"

**Evokes:**
- Exact command/steps to execute
- Expected output documented BEFORE execution
- Environment state captured (versions, config, etc.)
- No vague "test it" - specific observation to make

**Cannot advance until you can answer:**
- What exact command will I run?
- What output do I expect to see?
- What is the current environment state?

---

### GATE 3: OBSERVATION & EVIDENCE

**Thinking Purpose:** "What actually happened? Show me the proof."

**Evokes:**
- Copy ACTUAL output, don't describe it
- Check LOGS not just API responses
- Compare expected vs actual side-by-side
- Evidence from EXTERNAL system (not self-referencing)

**Cannot advance until you can answer:**
- What was the actual output? (raw, not paraphrased)
- Did I check logs for side effects?
- What is the expected vs actual comparison?

**ANTI-DERAILMENT:** Prevents "it worked" claims without evidence, self-referencing proofs

---

### GATE 4: GAP ANALYSIS & ADJUSTMENT

**Thinking Purpose:** "The gap between expected and actual tells me what?"

**Evokes:**
- Each failure IS information
- Adjust the hypothesis, don't just retry
- State the new understanding
- Next action tied to this insight

**Cannot advance until you can answer:**
- I expected X, got Y, therefore Z...
- How has my hypothesis changed?
- What is my next action and why?

---

### GATE 5: META-COGNITIVE REFLECTION

**Thinking Purpose:** "What should I have done differently? What pattern can I extract?"

**Evokes:**
- Retroactive pattern recognition
- Generalizable insight extracted
- What systemic issue does this reveal?
- "What I Should Have Done" per major step

**Cannot advance until you can answer:**
- What should I have done differently?
- What pattern applies to future problems?
- Is there a systemic issue here?

---

### GATE 6: VERIFICATION & CONFIRMATION

**Thinking Purpose:** "How do I know the fix actually worked?"

**Evokes:**
- Test in target environment, not just check syntax
- Look for console errors, not just "no crash"
- Confirm behavior matches original requirement
- No regressions introduced

**Cannot advance until you can answer:**
- Does behavior match documented requirement?
- Are there any console errors?
- What other parts might be affected?

---

## Output Format: INJECTABLE DEBUGGING CHAIN

Each iteration produces:

```
## Iteration N: [Problem Statement]

### 1. Assumption
[Explicit assumption + reasoning chain]

### 2. Action
[Exact command + expected output]

### 3. Observation
[Raw evidence: expected vs actual table]

### 4. Gap Analysis
["Expected X, got Y, therefore Z"]

### 5. Meta-Reflection
["What I should have done..."]

### 6. Verification
[Target environment check, behavior match]
```

---

## Anti-Derailment Mapping

| Failure Category | How Mode Prevents It |
|------------------|---------------------|
| Host Fallback | Layer 3 requires logs showing HTTP request sent to bridge |
| Success Claims Without Proof | Layer 3 requires raw evidence, not "assessment" |
| Mock/Stub Suggestions | Layer 6 requires actual environment execution |
| Confusion Pretense | Layer 1 requires explicit assumption statement |
| Self-Referencing Proof | Layer 3 requires evidence from external system (logs, API) |
| Simplification Derailment | Layer 4 requires gap analysis, can't just simplify |
| Repetitive Failure | Layer 5 requires pattern extraction to prevent repeats |

---

## Iteration Concept

For complex problems, iterate through the 6 gates multiple times:
- Iteration 1: Initial hypothesis → test → observe gap
- Iteration 2: Adjusted hypothesis → test → observe gap
- Iteration 3: Root cause identified → fix → verify

Each iteration goes deeper or tries a different angle. V1.0 → V1.1 → V1.2

---

*Problem Solving Mode - Evidence-based debugging through mechanical iteration gates*