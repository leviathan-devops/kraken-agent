# LAYER 3: COMPRESSION - Template

**Purpose:** Synthesize ranked context into <2k tokens

---

## Template

```markdown
# LAYER 3: COMPRESSION

## Scored Context (From Layer 2)
[Top priorities summary]

---

## Compression Rules Applied

| Rule | Applied To | Result |
|------|------------|--------|
| Decision Points: PRESERVE FULL | [Decision items] | [Tokens kept] |
| Files: SUMMARIZE KEY | [File contexts] | [Tokens saved] |
| Logs: PRUNE ERRORS ONLY | [Log contexts] | [Tokens saved] |
| Patterns: DEDUPLICATE | [Similar patterns] | [Items merged] |
| Stale: TRUNCATE SUMMARY | [Old context] | [Tokens saved] |

---

## Budget Allocation

| Category | Budget | Used | Remaining |
|----------|--------|------|-----------|
| Decision Points | 500 tokens | [X] | [Y] |
| General Context | 1500 tokens | [X] | [Y] |
| **TOTAL** | **2000 tokens** | **[X]** | **[Y]** |

---

## Compressed Content

### Decisions Preserved (Full)
[Exact decision text - no summarization]

### Key Files Summarized
- **[File 1]:** [Key function/class only]
- **[File 2]:** [Key function/class only]

### Patterns Merged
[Unique patterns after deduplication]

### Errors (Pruned)
[Only recent errors, not full logs]

---

## Token Count

**Total:** [X] tokens (target: <2000)

---

## Anti-Derailment Check

- [ ] Under 2k token limit
- [ ] Decision points intact
- [ ] Key insights preserved
- [ ] No critical information lost
```

---

## Structural Requirements

| Field | Requirement | Enforces |
|-------|-------------|----------|
| Token Limit | <2k tokens | No overflow |
| Decisions Preserved | Full detail | No summarization |
| Insights Intact | Key points kept | Comprehension |

---

## Example

```markdown
# LAYER 3: COMPRESSION

## Budget Allocation

| Category | Budget | Used | Remaining |
|----------|--------|------|-----------|
| Decision Points | 500 tokens | 320 | 180 |
| General Context | 1500 tokens | 1180 | 320 |
| **TOTAL** | **2000 tokens** | **1500** | **500** |

---

## Compressed Content

### Decisions Preserved (Full) - 320 tokens
- "Use JWT with short expiry (15 min)"
- "Validate tokens at middleware level"
- "Store refresh tokens in httpOnly cookie"

### Key Files Summarized - 450 tokens
- middleware.ts: authMiddleware function, validateToken function
- auth.ts: JWT_SECRET, tokenExpiry, refreshExpiry

### Patterns Merged - 280 tokens
- Pattern: Always validate at middleware (2 instances merged)

### Errors (Pruned) - 150 tokens
- Error: "Token expired" at 14:32 - user needs re-auth
- Error: "Invalid signature" at 14:45 - suspicious

---

## Token Count

**Total:** 1500 tokens (target: <2000) ✅
```