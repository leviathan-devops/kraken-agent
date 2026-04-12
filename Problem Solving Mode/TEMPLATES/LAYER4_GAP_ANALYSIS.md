# LAYER 4: GAP ANALYSIS & ADJUSTMENT - Template

**Purpose:** Analyze the gap between expected and actual, adjust your hypothesis

---

## Template

```markdown
# LAYER 4: GAP ANALYSIS & ADJUSTMENT

## Problem Being Solved
[Brief statement of the problem]

---

## 4.1 Gap Analysis
[The gap between expected and actual tells you WHAT? Use the format: "I expected X, got Y, therefore Z"]

**Gap Statement:** 
I expected [what you expected] but got [what happened], therefore [what this tells you about the problem]

| Gap | Analysis |
|-----|----------|
| [Gap 1 from Layer 3] | [What this gap tells you] |
| [Gap 2 from Layer 3] | [What this gap tells you] |
| [Gap 3 from Layer 3] | [What this gap tells you] |

---

## 4.2 Updated Hypothesis
[Based on the gap analysis, what is your NEW hypothesis? How has your understanding changed?]

**Previous assumption:** [What you assumed before]
**Updated hypothesis:** [What you now believe based on evidence]

---

## 4.3 Next Action
[What is your next action? It must be TIED TO this insight - not just "try again", but "try X because gap Y told me Z"]

**Next action:** [What you'll do]
**Why:** [How this addresses the gap insight]
**What you'll observe:** [What you expect to see this time]

---

## 4.4 Iteration Tracking
[What iteration is this? Track your progress through the problem]

| Iteration | Previous Hypothesis | Gap Found | Updated Hypothesis |
|-----------|---------------------|-----------|---------------------|
| V1.0 | [Initial assumption] | [Gap from testing] | [Updated based on V1.0] |
| V1.1 | [V1.1 hypothesis] | [Gap from testing] | [Updated based on V1.1] |

---

## Anti-Derailment Check

- [ ] Gap analysis uses "expected X, got Y, therefore Z" format
- [ ] Updated hypothesis is DISTINCT from previous
- [ ] Next action is TIED TO the insight (not blind retry)
- [ ] Iteration tracking shows progression
```

---

## Structural Requirements

| Field | Requirement | Enforces |
|-------|-------------|----------|
| Gap Analysis | "Expected X, got Y, therefore Z" format | Prevents just noting "didn't work" |
| Updated Hypothesis | New hypothesis distinct from previous | Prevents same failed approach |
| Next Action Tied to Insight | Action based on gap analysis | Prevents blind retry |
| Iteration Tracking | Progress through iterations documented | Shows deepening understanding |

---

## Example

```markdown
## 4.1 Gap Analysis
**Gap Statement:** 
I expected the database-inserted command to trigger an HTTP request to the bridge, but no request was received, therefore the database insertion alone does not activate slash commands.

| Gap | Analysis |
|-----|----------|
| Command created but no HTTP request | Mattermost doesn't send requests to database-only commands |
| Query returned no results | Trigger was stored with '/' prefix (should be 'opencode', not '/opencode') |

## 4.2 Updated Hypothesis
**Previous assumption:** Database insertion would make command functional
**Updated hypothesis:** Database insertion creates record but Mattermost requires proper command registration through API or UI to activate the HTTP callback

## 4.3 Next Action
**Next action:** Create command via Mattermost REST API instead of direct database insertion
**Why:** The gap shows database insertion alone doesn't trigger the HTTP callback - need proper registration path
**What you'll observe:** Check bridge logs for incoming POST request after API creation

## 4.4 Iteration Tracking
| Iteration | Previous Hypothesis | Gap Found | Updated Hypothesis |
|-----------|---------------------|-----------|---------------------|
| V1.0 | Database insertion works | No HTTP request received | Need API registration |
| V1.1 | API registration works | 500 error - NULL pluginid | Fix schema issue first |
```