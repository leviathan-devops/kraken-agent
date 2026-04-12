# LAYER 1: ASSUMPTION STATEMENT - Template

**Purpose:** State what you assume and why you believe it

---

## Template

```markdown
# LAYER 1: ASSUMPTION STATEMENT

## Problem Being Solved
[Brief statement of the problem]

---

## 1.1 Explicit Assumption
[State your assumption in ONE clear sentence. What do you believe will happen?]

**Assumption:** [Your explicit assumption]

---

## 1.2 Reasoning Chain
[Why do you believe this assumption is true? Document your reasoning chain.]

1. [Reason 1]
2. [Reason 2]
3. [Reason 3]

---

## 1.3 Success Criteria
[What does success look like? How will you know if this assumption is correct?]

1. [Criteria 1 - specific, observable]
2. [Criteria 2 - specific, observable]

---

## 1.4 Confirmation / Disproof Criteria
[What would prove this assumption right OR wrong? What evidence would confirm or deny?]

**Would confirm:** [What evidence would prove this true]
**Would disprove:** [What evidence would prove this false]

---

## Anti-Derailment Check

- [ ] Assumption is EXPLICIT, not vague
- [ ] Reasoning chain shows WHY you believe it
- [ ] Success criteria are OBSERVABLE, not subjective
- [ ] You acknowledge what would disprove your assumption
```

---

## Structural Requirements

| Field | Requirement | Enforces |
|-------|-------------|----------|
| Explicit Assumption | One clear sentence stating what you believe | Prevents vague "I'll try X" |
| Reasoning Chain | 3+ reasons why you believe this | Prevents unexamined assumptions |
| Success Criteria | Specific, observable outcomes | Prevents "I think it worked" |
| Confirmation/Disproof | What would prove right/wrong | Prevents confirmation bias |

---

## Example

```markdown
## 1.1 Explicit Assumption
**Assumption:** Inserting a command directly into the Mattermost `commands` table will make the slash command functional.

## 1.2 Reasoning Chain
1. The command record exists in the database with the correct trigger and URL
2. Mattermost reads from this table for registered commands
3. The API creates commands by writing to the same table

## 1.3 Success Criteria
1. Bridge service receives an HTTP POST request when user types /opencode
2. Command appears in Mattermost slash command list

## 1.4 Confirmation/Disproof
**Would confirm:** Bridge logs show incoming POST request
**Would disprove:** Bridge logs show NO incoming request after user invokes command
```