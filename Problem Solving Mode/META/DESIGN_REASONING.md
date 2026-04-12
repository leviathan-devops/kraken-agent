# Design Reasoning - Problem Solving Mode

**Date:** 2026-04-12  
**Designer:** Manta Agent (Trident Brain)

---

## Why This Mode Exists

The debug logs showed 14 categories of failure patterns when agents try to solve problems. These aren't random - they're predictable derailments that happen when agents don't have structural enforcement.

The GOLD STANDARD docs (AGENT_BUILD_LOGIC_CHAIN.md, SHARK_AGENT_1ST_BUILD_REPORT.md, SPACE_INVADERS_BUILD_LOG.md) showed us HOW successful agents actually solve problems - it's NOT intuition, it's a specific iteration pattern.

---

## Design Process

### Step 1: Analyze Gold Standards

**AGENT_BUILD_LOGIC_CHAIN.md** (Mattermost slash command):
- Iteration 1: Database insertion → didn't work → logs showed no HTTP request
- Iteration 2: API creation → didn't work → config blocked internal IPs
- Iteration 3: Config update → didn't work → file permissions
- Each failure added information for next attempt

**Key Pattern:** `ASSUMPTION → ACTION → OBSERVATION → COMPARISON → ADJUSTMENT → META-REFLECTION`

### Step 2: Identify What Made It Work

1. **Explicit assumptions** - State what you believe before action
2. **Expected output** - Define what success looks like BEFORE testing
3. **Raw evidence** - Copy actual output, don't describe it
4. **Logs check** - Check logs not just API responses
5. **Gap analysis** - Each failure is information
6. **Pattern extraction** - "What I Should Have Done" sections
7. **Verification** - Test in target environment, not just syntax

### Step 3: Map to Anti-Derailment

| Success Pattern | Prevents Which Failure? |
|-----------------|------------------------|
| Explicit assumption | Confusion Pretense |
| Expected output defined | Blind trying |
| Raw evidence required | Success Claims Without Proof |
| Logs checked | Host Fallback |
| Gap analysis | Repetitive Failure |
| Pattern extraction | Same mistake repeated |
| Target env verification | Mock/Stub suggestions |

### Step 4: Convert to Mechanical Gates

Each pattern became a gate with structural requirements:
- Layer 1: Assumption Statement (requires explicit assumption + reasoning)
- Layer 2: Action with Prediction (requires exact command + expected output)
- Layer 3: Observation & Evidence (requires raw evidence + logs + comparison)
- Layer 4: Gap Analysis & Adjustment (requires gap analysis + updated hypothesis)
- Layer 5: Meta-Cognitive Reflection (requires pattern extraction + systemic issue)
- Layer 6: Verification & Confirmation (requires target env execution)

---

## Why 6 Layers?

Not arbitrary - each layer corresponds to a step in the GOLD STANDARD iteration pattern:
1. Assumption (start of iteration)
2. Action (before doing)
3. Observation (after doing)
4. Gap Analysis (processing the gap)
5. Meta-Reflection (learning from iteration)
6. Verification (confirming fix works)

---

## Why No "Minimum Chars"?

Quantitative requirements (min 500 chars) don't enforce thinking. Structural requirements (must show raw evidence, must check logs) enforce the actual cognitive pattern.

---

## Key Insight

Problem Solving is INVERTED from Planning:
- Planning: Start simple, add complexity
- Problem Solving: Start complex (symptom), strip away layers to find root cause

But both need mechanical enforcement to prevent derailment.