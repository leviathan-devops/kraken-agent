# Design Reasoning - Context Synthesis Mode

**Date:** 2026-04-12  
**Designer:** Manta Agent (Trident Brain)

---

## Why This Mode Exists

Trident Brain has:
- **Deep Planning Mode** - For creating plans from first principles
- **Problem Solving Mode** - For debugging with evidence-based iteration

But both modes suffer from **context management issues**:
1. Context accumulates and becomes stale
2. Important knowledge from T2 gets lost
3. No real-time context injection mechanism
4. Post-compaction recovery is manual

---

## Design Process

### Step 1: Analyze Kraken V2.0

**What Kraken does well:**
- Token budget monitoring (65%/75%/85% thresholds)
- Pre-compaction export (chat, decisions, state)
- Post-compaction injection (INJECTION.md)
- Four-tier system (T0→T1→T2→T3)

**What's missing:**
- On-demand synthesis (only auto at 85%)
- Real-time scoring (batch at compaction)
- T0 direct injection (file-based, not stream)

### Step 2: Analyze Hermes Memory

**What Hermes does well:**
- L0 (scent) → L1 (map) → L2 (truth) hierarchy
- Path-based retrieval (not semantic guess)
- Hard siloing (profile-isolated)

**What's missing:**
- Dynamic synthesis (static retrieval only)
- Real-time relevance scoring
- Token budget management

### Step 3: Combine for Context Synthesis

**The synthesis:**
- Kraken's token budget + triggers → Real-time synthesis
- Hermes's structured tiers → Input/output formats
- Trident's mechanical gates → Structural requirements

---

## Key Design Decisions

### 1. 4 Layers (Not 3)

Hermes has L0/L1/L2, but we needed Layer 4 for **injection format** (T0-ready output).

### 2. Relevance Scoring Formula

```Final Score = (Urgency × 0.6) + (Importance × 0.4)```

Urgency weighted higher because **current blockers** matter more than **past patterns**.

### 3. Token Budget: <2k tokens

2k chosen because:
- Large enough for useful context
- Small enough to not overwhelm
- Fits in most LLM context windows

### 4. Multiple Triggers

Not just auto at 85% - manual + gate + error triggers allow real-time intervention.

---

## Integration with Other Modes

### Problem Solving Mode
- **Layer 4 (Gap Analysis):** "I'm stuck, what was the decision here?"
- **Layer 6 (Verification):** "What patterns should I verify against?"

### Deep Planning Mode
- **Layer 1 (Initial Plan):** "What's the project history?"
- **Layer 2 (Workflow):** "What constraints exist?"

---

## Comparison

| Feature | Kraken V2.0 | Hermes Memory | Context Synthesis |
|---------|-------------|---------------|-------------------|
| Trigger | Auto 85% | Search-based | Manual + Auto |
| Scope | Compaction | Static retrieval | Dynamic synthesis |
| Output | INJECTION.md | L0→L1→L2 chain | T0 stream |
| Size | Variable | Per-tier limits | <2k fixed |
| Timing | Post-compaction | On-demand | Real-time |

---

## Why This Fits Trident

Trident Brain is about **mechanical enforcement** of thinking patterns. Context Synthesis enforces:
- Complete context collection (no missing sources)
- Relevance scoring (no priority confusion)
- Token limits (no context overflow)
- Structured injection (no incoherent output