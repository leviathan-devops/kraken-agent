# LAYER 3: OBSERVATION & EVIDENCE - Template

**Purpose:** Document what actually happened - show raw evidence, don't describe

---

## Template

```markdown
# LAYER 3: OBSERVATION & EVIDENCE

## Problem Being Solved
[Brief statement of the problem]

---

## 3.1 Raw Evidence
[Copy ACTUAL output here. Don't describe - show. Raw, unedited output.]

**Actual output:**
```
[PASTE ACTUAL OUTPUT HERE - exactly what happened]
```

---

## 3.2 Logs Checked
[Did you check logs? What did they show? Logs often reveal what API responses don't.]

| Log Source | What Checked | Result |
|------------|--------------|--------|
| [Log 1] | [What looked for] | [What found] |
| [Log 2] | [What looked for] | [What found] |
| [Log 3] | [What looked for] | [What found] |

---

## 3.3 Expected vs Actual Comparison
[Compare what you expected vs what actually happened]

| Aspect | Expected | Actual | Difference |
|--------|----------|--------|------------|
| [Aspect 1] | [What you expected] | [What happened] | [Gap] |
| [Aspect 2] | [What you expected] | [What happened] | [Gap] |
| [Aspect 3] | [What you expected] | [What happened] | [Gap] |

---

## 3.4 Evidence Source Validation
[Is this evidence valid? Evidence from external system (logs, API) is valid. Evidence created by agent (JSON you wrote) is NOT valid.]

| Evidence | Source | Valid? |
|----------|--------|--------|
| [Evidence 1] | [External/Agent-created] | Yes/No |
| [Evidence 2] | [External/Agent-created] | Yes/No |

**Rule:** Evidence created by agent = invalid. Only external system logs/API responses count.

---

## Anti-Derailment Check

- [ ] Raw output is COPY-PASTED, not described
- [ ] Logs were CHECKED (not just API responses)
- [ ] Expected vs Actual is in TABLE format
- [ ] No self-referencing proofs (agent-created files don't count)
```

---

## Structural Requirements

| Field | Requirement | Enforces |
|-------|-------------|----------|
| Raw Evidence | Copy-paste actual output, don't describe | Prevents "it worked" without proof |
| Logs Checked | Explicit log checks documented | Prevents assuming from API only |
| Expected vs Actual | Side-by-side comparison table | Clear gap identification |
| Evidence Validation | External vs agent-created distinguished | Prevents self-referencing proofs |

---

## Example

```markdown
## 3.1 Raw Evidence
**Actual output:**
```
INSERT 0 1
```

## 3.2 Logs Checked
| Log Source | What Checked | Result |
|------------|--------------|--------|
| Bridge logs | Tail 20 lines for POST to /execute | No recent POST requests |
| Mattermost logs | Recent errors | No errors related to commands |

## 3.3 Expected vs Actual Comparison
| Aspect | Expected | Actual | Difference |
|--------|----------|--------|------------|
| Command created | "INSERT 0 1" | "INSERT 0 1" | ✅ Match |
| Bridge receives request | HTTP POST to /execute | NO request received | ❌ Gap |
| Command in list | Visible in /commands | Query returned no results | ❌ Gap |

## 3.4 Evidence Validation
| Evidence | Source | Valid? |
|----------|--------|--------|
| "INSERT 0 1" | PostgreSQL response | Yes |
| Bridge logs | Docker logs | Yes |
| Command query | API response | Yes |
```