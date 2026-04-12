# LAYER 4: INJECTION FORMAT - Template

**Purpose:** Format synthesized context for direct T0 thought stream injection

---

## Template

```markdown
# CONTEXT INJECTION — [SESSION_ID] — [TIMESTAMP]

---

## 📍 CURRENT POSITION
**Gate:** [PLAN/BUILD/TEST/VERIFY/AUDIT/DELIVERY]
**Task:** [Active task]
**Blockers:** [Current blockers - if any]

---

## 🎯 IMMEDIATE PRIORITIES (Ranked)
1. **[Highest Score]** - [Context]
2. **[Second]** - [Context]
3. **[Third]** - [Context]

---

## 🧠 INJECTED KNOWLEDGE
[Synthesized from T2 - decisions, patterns, constraints]

---

## 📁 ACTIVE FILES
- [File 1]: [Brief summary]
- [File 2]: [Brief summary]

---

## 🔧 RECENT EXECUTION
- Recent errors to avoid: [List]
- Tool patterns: [Pattern]

---

## 💡 SYNTHESIZED INSIGHT
[Cross-cutting analysis from all sources]

---

---
**Token Count:** [X] | **Sources:** [N] | **Synthesis Time:** [MS]
```

---

## Anti-Derailment Check

- [ ] Under 2k tokens total
- [ ] All sections populated
- [ ] Ready for T0 injection
- [ ] No placeholder text

---

## Structural Requirements

| Field | Requirement | Enforces |
|-------|-------------|----------|
| Current Position | Gate + task + blockers | Context known |
| Priorities | Top 3 ranked | Clear focus |
| Injected Knowledge | From T2 | Past patterns |
| Active Files | Relevant files | Working context |
| Synthesized Insight | Cross-cutting | Deep analysis |

---

## Example

```markdown
# CONTEXT INJECTION — sess_20260412_001 — 2026-04-12T14:32:00Z

---

## 📍 CURRENT POSITION
**Gate:** BUILD
**Task:** Implement JWT authentication middleware
**Blockers:** None

---

## 🎯 IMMEDIATE PRIORITIES (Ranked)
1. **Auth middleware incomplete** (10.0) - Must complete before build proceeds
2. **Middleware file** (5.8) - src/auth/middleware.ts being actively edited
3. **JWT pattern** (5.6) - Past decision: "Validate at middleware level"

---

## 🧠 INJECTED KNOWLEDGE
- Decision: Use JWT with short expiry (15 min)
- Constraint: Validate at middleware level, not route level
- Pattern: Always return 401 on token failure

---

## 📁 ACTIVE FILES
- src/auth/middleware.ts: authMiddleware, validateToken, generateToken
- src/config/auth.ts: JWT_SECRET, tokenExpiry (15m), refreshExpiry (7d)

---

## 🔧 RECENT EXECUTION
- Recent errors: "Token expired" at 14:32 (expected, needs re-auth)
- Tool pattern: Heavy read usage (15 reads), moderate writes (8 writes)

---

## 💡 SYNTHESIZED INSIGHT
The JWT pattern decision from 2026-04-10 directly impacts current middleware implementation. The middleware should validate tokens AND handle refresh flow, not just validation. Current blocker: None, but test coverage is incomplete.

---

---
**Token Count:** 850 | **Sources:** 4 | **Synthesis Time:** 45ms
```

---

## Output for T0 Injection

This output is ready for direct injection into the agent's thought stream. The agent reads this at the start of each message cycle and uses it to inform its thinking.