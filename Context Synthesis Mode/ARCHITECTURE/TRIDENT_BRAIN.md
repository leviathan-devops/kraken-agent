# TRIDENT BRAIN - Context Synthesis Agent

**Version:** 1.0.0  
**Type:** Dynamic Context Management Agent  
**Architecture:** Multi-tier Context Consolidation (Kraken + Hermes inspired)  
**Inspiration:** Kraken V2.0 compaction-manager.ts, Hermes Memory Overhaul L0/L1/L2

---

## META: Design Alignment

This architecture combines:
1. **Kraken V2.0** - Token budget management, pre/post compaction logic
2. **Hermes Memory** - L0/L1/L2 retrieval discipline, structured tiers
3. **Trident Brain** - Mechanical gate enforcement philosophy

---

## Core Concept

Context Synthesis Mode **dynamically synthesizes** context from multiple sources and **injects** directly into the agent's thought stream at T0 level.

```
CONTEXT SYNTHESIS MODE
│
├── INPUT SOURCES
│   ├── T1: Session Context (gate, task, state)
│   ├── T2: Knowledge Context (hermes_remember, hive_context, kraken_hive)
│   ├── T3: File Context (active files, recent changes)
│   └── T4: Tool Context (recent commands, patterns)
│
├── SYNTHESIS ENGINE (4 Layers)
│   ├── LAYER 1: CONTEXT COLLECTION
│   │   └── Gather all sources, identify what's available
│   │
│   ├── LAYER 2: RELEVANCE SCORING
│   │   └── Score by urgency (0-10) × importance (0-10)
│   │
│   ├── LAYER 3: COMPRESSION
│   │   └── Synthesize into <2k tokens (deduplicate, summarize)
│   │
│   └── LAYER 4: INJECTION FORMAT
│       └── T0-ready stream with sections
│
└── OUTPUT → Direct thought stream injection (<2k tokens)
```

---

## The 4 Layers with Thinking Purpose

### LAYER 1: CONTEXT COLLECTION

**Thinking:** "What context exists? What sources are available?"

**Sources:**
| Source | Method | Priority |
|--------|--------|----------|
| Session State | Kraken brain state | HIGH |
| T2 Knowledge | hermes_remember, hive_context | HIGH |
| Active Files | read recent files | MEDIUM |
| Tool History | Recent commands | LOW |

**Cannot advance until:**
- All 4 source types checked
- Available context identified
- Unavailable sources noted

---

### LAYER 2: RELEVANCE SCORING

**Thinking:** "What matters most right now?"

**Scoring Formula:**
```
Urgency Score (0-10):
- Current task blocker = 10
- Gate transition pending = 8
- Active debugging = 7
- Recent error = 6
- Stale context = 1

Importance Score (0-10):
- Decision point = 10
- Pattern from hive_remember = 8
- Config/architecture = 7
- Documentation = 3

Final Score = (Urgency × 0.6) + (Importance × 0.4)
```

**Cannot advance until:**
- All collected context scored
- Ranked by final score
- Top priorities identified

---

### LAYER 3: COMPRESSION

**Thinking:** "How to fit everything into <2k tokens?"

**Compression Rules:**
1. **Keep decision points** - Full detail preserved
2. **Summarize files** - Key functions/classes only
3. **Prune logs** - Only errors/relevant lines
4. **Merge patterns** - Deduplicate similar insights
5. **Truncate stale** - Old context summarized

**Target:** 1500-2000 tokens max

**Cannot advance until:**
- Under 2k token limit
- Decision points intact
- Key insights preserved

---

### LAYER 4: INJECTION FORMAT

**Thinking:** "How to format for direct T0 insertion?"

**Output Structure:**
```markdown
# CONTEXT INJECTION — [TIMESTAMP]

## CRITICAL STATE
[Current gate, active task, blockers - 50 tokens]

## DECISION POINTS
[What needs deciding now - 100 tokens]

## INJECTED KNOWLEDGE
[From T2: patterns, past decisions - 300 tokens]

## ACTIVE FILES
[Currently relevant files - 200 tokens]

## RECENT EXECUTION
[Tool patterns, errors - 100 tokens]

## SYNTHESIZED INSIGHT
[Cross-cutting analysis - 200 tokens]

---
TOTAL: ~950 tokens
```

**Output:** Ready for T0 thought stream injection

---

## Triggers

| Trigger | When | Priority |
|---------|------|----------|
| **Manual** | Agent calls synthesize_context | HIGH |
| **Gate Transition** | Moving PLAN→BUILD | HIGH |
| **Error Detected** | Tool execution fails | MEDIUM |
| **Token Threshold** | 70% tokens | MEDIUM |
| **Stale Context** | No progress in 10 messages | LOW |

---

## Integration Points

### With Problem Solving Mode
- Layer 4 (Gap Analysis): Trigger synthesis to get decision context
- Layer 6 (Verification): Trigger synthesis to get verification patterns

### With Deep Planning Mode
- Layer 1 (Initial Plan): Trigger synthesis to get project history
- Layer 2 (Workflow): Trigger synthesis to get constraints

---

## Anti-Derailment

| Failure Category | Prevention |
|-----------------|------------|
| Context overflow | Hard <2k token limit |
| Missing critical context | Scoring ensures priority |
| Incoherent context | Synthesized, not concatenated |
| Wrong context injection | Relevance scoring |

---

## Output Format: INJECTABLE CONTEXT STREAM

```markdown
# CONTEXT SYNTHESIS — [SESSION_ID]

## 📍 CURRENT POSITION
Gate: [PLAN/BUILD/TEST/VERIFY/AUDIT/DELIVERY]
Task: [Active task]
Blockers: [Blockers]

## 🎯 PRIORITIES (Ranked)
1. [Highest scored context]
2. [Second highest]
3. ...

## 🧠 INJECTED KNOWLEDGE
[Synthesized from T2]

## 📁 ACTIVE FILES
[Highest relevance files]

## 🔧 EXECUTION PATTERNS
[Recent tools, errors]

## 💡 SYNTHESIZED INSIGHT
[Cross-cutting analysis]

---
Tokens: [X] | Sources: [N]
```

---

*Context Synthesis Mode — Real-time context injection for Trident Brain*