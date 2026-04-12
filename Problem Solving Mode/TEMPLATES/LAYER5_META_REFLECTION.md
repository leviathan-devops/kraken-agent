# LAYER 5: META-COGNITIVE REFLECTION - Template

**Purpose:** Extract patterns from this iteration - what should you have done differently?

---

## Template

```markdown
# LAYER 5: META-COGNITIVE REFLECTION

## Problem Being Solved
[Brief statement of the problem]

---

## 5.1 What I Should Have Done Differently
[Retroactive analysis: what should you have done at each major step?]

| Step | What I Did | What I Should Have Done |
|------|------------|-------------------------|
| [Step 1] | [What actually happened] | [What would have been better] |
| [Step 2] | [What actually happened] | [What would have been better] |
| [Step 3] | [What actually happened] | [What would have been better] |

---

## 5.2 Pattern Extracted
[What general pattern can you extract from this experience? Something that applies to future problems.]

**Pattern:** [Name of the pattern]
**Description:** [What the pattern is]
**When to apply:** [What situations should trigger this pattern]

---

## 5.3 Systemic Issue Identification
[Is there a systemic issue here? Something about the approach, tools, or process that needs fixing?]

**Systemic issue:** [What needs to change at a system level]
**Why it's systemic:** [Why this isn't just one-off but affects broader work]
**Fix needed:** [What would need to change to prevent this]

---

## 5.4 Root Cause vs Symptom Distinction
[Have you found the ROOT cause or just a symptom?]

| Finding | Type | Explanation |
|---------|------|-------------|
| [Finding 1] | Root cause / Symptom | [Why] |
| [Finding 2] | Root cause / Symptom | [Why] |

**Current assessment:** [Have you reached root cause or still at symptom level?]

---

## Anti-Derailment Check

- [ ] "What I Should Have Done" documented for each major step
- [ ] Pattern extracted is GENERALIZABLE (not just this problem)
- [ ] Systemic issue identified if applicable
- [ ] Root cause vs symptom explicitly distinguished

---

## Structural Requirements

| Field | Requirement | Enforces |
|-------|-------------|----------|
| What I Should Have Done | Per major step, retroactive analysis | Prevents repeating same mistakes |
| Pattern Extracted | Generalizable insight | Builds reusable knowledge |
| Systemic Issue | System-level problem if any | Prevents treating symptoms |
| Root Cause vs Symptom | Explicit distinction | Ensures true problem solving |

---

## Example

```markdown
## 5.1 What I Should Have Done Differently
| Step | What I Did | What I Should Have Done |
|------|------------|-------------------------|
| Initial approach | Database insertion | Researched Mattermost documentation first |
| Testing | Only checked API response | Checked bridge logs for HTTP requests |
| Failure | Retried same approach | Analyzed gap to adjust hypothesis |

## 5.2 Pattern Extracted
**Pattern:** Check downstream logs before declaring success
**Description:** When testing integrations, check the destination system's logs, not just the source's API response
**When to apply:** Any time testing API calls or HTTP requests to external systems

## 5.3 Systemic Issue Identification
**Systemic issue:** No standard practice for checking destination logs
**Why it's systemic:** Agent only checked source API responses in previous attempts
**Fix needed:** Add "check destination logs" to standard debugging procedure

## 5.4 Root Cause vs Symptom Distinction
| Finding | Type | Explanation |
|---------|------|-------------|
| Database insertion didn't work | Symptom | What's visible - command exists but doesn't fire |
| Commands need API/UI registration | Root cause | Actual activation mechanism for HTTP callbacks |
| Current assessment: Still at symptom level - need to verify API registration actually works
```