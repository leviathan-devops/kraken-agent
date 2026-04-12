# CONTEXT SYNTHESIS MODE - Trident Brain Mode Design

**Created:** 2026-04-12  
**Status:** Design Complete  
**Reference:** Kraken V2.0 compaction-manager.ts, Hermes Memory Overhaul L0/L1/L2

---

## Purpose

A **dynamically triggerable** context synthesis process that:
1. **Consolidates** T1 (session) + T2 (knowledge/memory) context
2. **Synthesizes** into a compact <2k token context stream
3. **Injects** directly into agent's thought stream at T0 level

Unlike Kraken's auto-compaction at 85%, this is **on-demand** — can be triggered anytime.

---

## Architecture

```
CONTEXT SYNTHESIS MODE
│
├── INPUT SOURCES
│   ├── T1: Session Context (current task, state, gate)
│   ├── T2: Knowledge Context (hermes_remember, decisions, patterns)
│   ├── T3: File Context (active files, recent changes)
│   └── T4: Tool Context (recent commands, patterns)
│
├── SYNTHESIS ENGINE (4 Layers)
│   ├── L1: Context Collection (gather all sources)
│   ├── L2: Relevance Scoring (rank by urgency/importance)
│   ├── L3: Compression (LLM-style synthesis into <2k tokens)
│   └── L4: Format Injection (T0-ready stream)
│
└── OUTPUT
    └── Context Injection Stream (T0 thought insertion)
```

---

## 4 Synthesis Layers

### Layer 1: CONTEXT COLLECTION

**Purpose:** Gather all available context sources

**Inputs gathered:**
| Source | Method | Content |
|--------|--------|---------|
| Session State | Kraken brain state | Current gate, active task |
| T2 Knowledge | hermes_remember/hive_context | Decisions, patterns |
| Active Files | read recent files | Content context |
| Tool History | Last N commands | Execution pattern |

**Requirement:** Must identify ALL available sources before proceeding

---

### Layer 2: RELEVANCE SCORING

**Purpose:** Rank context by urgency and importance

**Scoring Algorithm:**
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
- Log files = 2

Final Score = Urgency × 0.6 + Importance × 0.4
```

**Requirement:** Must score and rank ALL collected context

---

### Layer 3: COMPRESSION

**Purpose:** Synthesize ranked context into <2k tokens

**Compression Rules:**
1. **Keep decision points** (full detail)
2. **Summarize files** (key functions/classes only)
3. **Prune logs** (only errors/relevant lines)
4. **Merge patterns** (deduplicate similar insights)

**Target:** 1500-2000 tokens max

**Requirement:** Must fit within token budget

---

### Layer 4: INJECTION FORMAT

**Purpose:** Format for direct T0 thought stream insertion

**Output Format:**
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
TOTAL: ~950 tokens (well under 2k)
```

---

## Triggers

| Trigger | When | Priority |
|---------|------|----------|
| **Manual** | Agent calls `synthesize_context` | HIGH |
| **Gate Transition** | Moving PLAN→BUILD, etc. | HIGH |
| **Error Detected** | Tool execution fails | MEDIUM |
| **Token Threshold** | 70% tokens (earlier than Kraken) | MEDIUM |
| **Stale Context** | No progress in N messages | LOW |

---

## Comparison to Existing Systems

| Feature | Kraken V2.0 | Hermes Memory | Context Synthesis Mode |
|---------|-------------|---------------|------------------------|
| Trigger | Auto 85% | OpenViking search | Manual + Auto |
| Scope | Compaction only | Static retrieval | Dynamic synthesis |
| Output | INJECTION.md file | L0→L1→L2 chain | T0 stream injection |
| Size | Variable | Per-tier limits | <2k tokens fixed |
| Timing | Post-compaction | On-demand search | Real-time |

---

## Usage in Trident Brain

**Problem Solving Mode Integration:**
- At Layer 4 (Gap Analysis): Trigger synthesis to get decision context
- At Layer 6 (Verification): Trigger synthesis to get verification patterns

**Deep Planning Mode Integration:**
- At Layer 1 (Initial Plan): Trigger synthesis to get project history
- At Layer 2 (Workflow): Trigger synthesis to get constraints

---

## Anti-Derailment

This mode **prevents:**
- Context overflow (hard token limit)
- Missing critical context (scoring ensures priority)
- Incoherent context (synthesized, not just concatenated)
- Wrong context injection (relevance scoring)

---

## Output Artifact

```markdown
# CONTEXT SYNTHESIS — [SESSION_ID] — [TIMESTAMP]

## 📍 CURRENT POSITION
**Gate:** [PLAN/BUILD/TEST/VERIFY/AUDIT/DELIVERY]
**Task:** [Active task description]
**Blockers:** [Current blockers]

## 🎯 IMMEDIATE PRIORITIES (Ranked)
1. [Highest scored context]
2. [Second highest]
3. ...

## 🧠 INJECTED KNOWLEDGE
[Synthesized from T2 - decisions, patterns]

## 📁 ACTIVE FILES
[Files with highest relevance]

## 🔧 RECENT EXECUTION
[Tool patterns, errors to avoid]

## 💡 SYNTHESIZED INSIGHT
[Cross-cutting analysis from all sources]

---
**Token Count:** [X] | **Sources:** [N] | **Synthesis Time:** [MS]
```

---

**Status:** Ready for implementation as Trident Brain Mode