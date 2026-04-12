# LAYER 1: CONTEXT COLLECTION - Template

**Purpose:** Gather all available context sources

---

## Template

```markdown
# LAYER 1: CONTEXT COLLECTION

## Session Info
- **Session ID:** [Session ID]
- **Current Gate:** [PLAN/BUILD/TEST/VERIFY/AUDIT/DELIVERY]
- **Active Task:** [What agent is working on]

---

## T1: Session Context

**Method:** Kraken brain state API
**Status:** [Available/Unavailable]

| State | Value |
|-------|-------|
| Current Gate | [Gate] |
| Active Task | [Task] |
| Blockers | [List] |

---

## T2: Knowledge Context

**Method:** hermes_remember, hive_context, kraken_hive_search
**Status:** [Available/Unavailable]

### From hermes_remember
[Recent remembered items]

### From hive_context
[Relevant past sessions]

### From kraken_hive
[Patterns, decisions]

---

## T3: File Context

**Method:** Read active files
**Status:** [Available/Unavailable]

| File | Relevance |
|------|-----------|
| [File 1] | [High/Med/Low] |
| [File 2] | [High/Med/Low] |

---

## T4: Tool Context

**Method:** Recent commands
**Status:** [Available/Unavailable]

| Recent Tool | Count |
|------------|-------|
| [Tool 1] | [N] |
| [Tool 2] | [N] |

---

## Collection Summary

| Source | Status | Content Size |
|--------|--------|--------------|
| T1: Session | [✅/❌] | [Tokens] |
| T2: Knowledge | [✅/❌] | [Tokens] |
| T3: Files | [✅/❌] | [Tokens] |
| T4: Tools | [✅/❌] | [Tokens]

---

## Anti-Derailment Check

- [ ] All 4 source types checked
- [ ] Available sources identified
- [ ] Unavailable sources noted
- [ ] Collection is COMPLETE
```

---

## Structural Requirements

| Field | Requirement | Enforces |
|-------|-------------|----------|
| Session State | Gate, task, blockers | Current position known |
| T2 Knowledge | hermes/hive/kraken | Past patterns captured |
| Active Files | Files + relevance | Working context known |
| Tool History | Recent commands | Execution pattern known |

---

## Example

```markdown
# LAYER 1: CONTEXT COLLECTION

## Session Info
- Session ID: sess_20260412_001
- Current Gate: BUILD
- Active Task: Implement authentication middleware

---

## T1: Session Context (✅ Available)

| State | Value |
|-------|-------|
| Current Gate | BUILD |
| Active Task | Implement auth middleware |
| Blockers | None |

---

## T2: Knowledge Context (✅ Available)

### From hermes_remember
- "auth should be JWT-based, not session" (2026-04-10)

### From kraken_hive
- Decision: Use JWT with short expiry
- Pattern: Always validate tokens at middleware level

---

## T3: File Context (✅ Available)

| File | Relevance |
|------|-----------|
| src/auth/middleware.ts | HIGH |
| src/config/auth.ts | HIGH |
| package.json | MEDIUM |

---

## T4: Tool Context (✅ Available)

| Recent Tool | Count |
|------------|-------|
| read | 15 |
| write | 8 |
| grep | 3 |

---

## Collection Summary

| Source | Status | Content Size |
|--------|--------|--------------|
| T1: Session | ✅ | ~50 tokens |
| T2: Knowledge | ✅ | ~200 tokens |
| T3: Files | ✅ | ~500 tokens |
| T4: Tools | ✅ | ~100 tokens |
```