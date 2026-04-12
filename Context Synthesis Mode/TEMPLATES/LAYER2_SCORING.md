# LAYER 2: RELEVANCE SCORING - Template

**Purpose:** Score and rank context by urgency and importance

---

## Template

```markdown
# LAYER 2: RELEVANCE SCORING

## Collection Summary
[From Layer 1]

---

## Scoring Formula

```
Urgency Score (×0.6) + Importance Score (×0.4) = Final Score
```

---

## Scored Context Items

| Item | Source | Urgency | Importance | Final Score | Rank |
|------|--------|---------|------------|-------------|------|
| [Context 1] | [T1/T2/T3/T4] | [0-10] | [0-10] | [0-10] | [1] |
| [Context 2] | [T1/T2/T3/T4] | [0-10] | [0-10] | [0-10] | [2] |
| [Context 3] | [T1/T2/T3/T4] | [0-10] | [0-10] | [0-10] | [3] |
| ... | ... | ... | ... | ... | ... |

---

## Urgency Factors Applied

| Factor | Score | Justification |
|--------|-------|---------------|
| Current Blocker | 10 | [If present] |
| Gate Transition | 8 | [If pending] |
| Active Debugging | 7 | [If debugging] |
| Recent Error | 6 | [If error occurred] |
| Stale Context | 1 | [Default] |

---

## Importance Factors Applied

| Factor | Score | Justification |
|--------|-------|---------------|
| Decision Point | 10 | [If needs decision] |
| Hive Pattern | 8 | [If from pattern] |
| Config/Architecture | 7 | [If critical config] |
| Documentation | 3 | [If docs] |
| Log Files | 2 | [If logs] |

---

## Top 5 Priorities

1. **[Highest scored]** - [Brief description]
2. **[Second]** - [Brief description]
3. **[Third]** - [Brief description]
4. **[Fourth]** - [Brief description]
5. **[Fifth]** - [Brief description]

---

## Anti-Derailment Check

- [ ] All collected context scored
- [ ] Ranked by final score
- [ ] Top priorities identified
- [ ] Scores have justifications
```

---

## Structural Requirements

| Field | Requirement | Enforces |
|-------|-------------|----------|
| All Items Scored | Every context item gets a score | No skipped context |
| Ranked Order | Sorted by final score | Clear priorities |
| Justifications | Score rationales documented | Explainable scoring |

---

## Example

```markdown
# LAYER 2: RELEVANCE SCORING

## Collection Summary
Total context: ~850 tokens from 4 sources

---

## Scored Context Items

| Item | Source | Urgency | Importance | Final Score | Rank |
|------|--------|---------|------------|-------------|------|
| Auth middleware incomplete | T1 | 10 | 10 | 10.0 | 1 |
| JWT pattern from hive | T2 | 4 | 8 | 5.6 | 2 |
| Middleware file | T3 | 5 | 7 | 5.8 | 3 |
| Recent read count | T4 | 1 | 2 | 1.4 | 4 |
| Config file | T3 | 3 | 7 | 4.6 | 5 |

---

## Top 3 Priorities

1. **Auth middleware incomplete** (10.0) - Must complete before build can proceed
2. **Middleware file** (5.8) - Active file being worked on
3. **JWT pattern from hive** (5.6) - Past decision guides implementation
```