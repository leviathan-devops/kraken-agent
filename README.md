# Kraken Agent v1.2 — Multi-Brain Orchestration Framework

> **⚠️ ALPHA**: Kraken is under active development. APIs, architecture, and behavior are subject to change.

---

## What Is Kraken?

Kraken is the **central macro orchestrator** for agentized software engineering. It coordinates specialized AI agents through mechanical enforcement layers that prevent hallucination, false completions, and security violations — the catastrophic failures that make all AI agents unreliable.

### The Problem

Every AI agent fails in the same predictable ways:

| Failure | What Happens | Kraken Solution |
|---------|--------------|-----------------|
| **Fake Completion** | Agent says "done" but never executed | L2: Output verification required |
| **Fire-and-Forget** | Spawns subprocess, immediately forgets | Execution Brain tracks all spawns |
| **Wrong Specialist** | Debug task sent to build agent | L4: Cluster domain enforcement |
| **Config Destruction** | rm -rf on critical paths | L6: Zone protection (read-only/hive-only) |
| **Excuse Making** | "It's not my fault" instead of fixing | AR: Anti-retard pattern blocking |
| **Theatrical Code** | Stub implementations that look complete | Trident: 50+ regex detection patterns |
| **Focus Collision** | Multiple agents working on same file | L5: Macro derailment detection |
| **Premature Completion** | Declares done before verification | L1: Orchestration theater blocking |

Kraken prevents ALL of these through **mechanical enforcement** — code that blocks bad behavior before it happens, not instructions the AI can ignore.

### Three Architecture Principles

1. **Execution > Initiation** — Spawning a task ≠ task complete. Track → Retrieve → Verify → Merge.
2. **Mechanical > Textual** — 90% enforcement via code (firewalls, gates), 10% via text matching.
3. **Isolation > Integration** — Every component independently testable. No cross-component dependency assumptions.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            KRAKEN ORCHESTRATOR                              │
│                             (Central Brain)                                 │
│                                                                             │
│    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐       │
│    │    PLANNING     │    │    EXECUTION    │    │     SYSTEM      │       │
│    │     BRAIN       │    │     BRAIN       │    │     BRAIN       │       │
│    │                 │    │                 │    │                 │       │
│    │  • Task decomp  │    │  • Supervision  │    │  • L0-L7 walls  │       │
│    │  • Context      │    │  • Output       │    │  • Gate mgmt    │       │
│    │    bridging     │    │    retrieval    │    │  • Derailment   │       │
│    │  • T1/T2 gen    │    │  • Override     │    │    detection    │       │
│    └────────┬────────┘    └────────┬────────┘    └────────┬────────┘       │
│             │                      │                      │                │
│             └──────────────────────┼──────────────────────┘                │
│                                    │                                        │
│                           ┌────────┴────────┐                               │
│                           │  BRAIN MESSENGER │                               │
│                           │  (Priority Bus)  │                               │
│                           └────────┬────────┘                               │
│                                    │                                        │
│            ┌───────────────────────┼───────────────────────┐               │
│            │                       │                       │               │
│            ▼                       ▼                       ▼               │
│      ┌───────────┐          ┌───────────┐          ┌───────────┐          │
│      │   ALPHA   │          │   BETA    │          │   GAMMA   │          │
│      │  CLUSTER  │          │  CLUSTER  │          │  CLUSTER  │          │
│      │           │          │           │          │           │          │
│      │  Shark    │          │  Manta    │          │  Manta    │          │
│      │ (steamroll│          │ (precision│          │ (testing) │          │
│      │  build)   │          │  debug)   │          │           │          │
│      └───────────┘          └───────────┘          └───────────┘          │
│                                                                             │
│      ┌─────────────────────────────────────────────────────────────────┐   │
│      │                       KRAKEN HIVE MIND                          │   │
│      │              (Persistent pattern/failure memory)                │   │
│      └─────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│      ┌─────────────────────────────────────────────────────────────────┐   │
│      │                       FIREWALL SYSTEM                           │   │
│      │              L0-L7 + AR (Dual-Layer Enforcement)                │   │
│      └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### The Three Brains

Kraken operates through three specialized brains that communicate via a priority message bus:

#### Planning Brain
**Role**: Strategist and task decomposer

**Responsibilities**:
- Decomposes user requests into executable tasks (T1 generation)
- Generates execution plans with cluster assignments
- Maintains T2 context library (patterns, failures, best practices)
- Bridges context between sessions and tasks
- Checks domain designation before task assignment

**MUST**:
- Generate T1 from SPEC.md
- Maintain T2 Master context loaded
- Decompose tasks for cluster assignment
- Check domain designation before assignment

**MUST NOT**:
- Assign tasks without context injection

**State**: `planning-state`, `context-bridge`

#### Execution Brain
**Role**: Supervisor and output retriever

**Responsibilities**:
- Monitors task execution across all clusters
- Retrieves outputs from completed tasks
- Catches false completion claims (L2 enforcement)
- Overrides stuck or misbehaving agents
- Tracks task momentum and progress

**MUST**:
- Supervise subagent output retrieval
- Catch false completion claims
- Trigger override when blocked

**MUST NOT**:
- Let fire-and-forget happen

**State**: `execution-state`, `quality-state`

#### System Brain
**Role**: Enforcer and gate manager

**Responsibilities**:
- Manages L0-L7 security firewalls
- Evaluates coordination gates (task-assignment, output-retrieval, roundtable-sync)
- Detects macro derailment in real-time
- Protects critical paths (Kraken zones)
- Auto-advances gates when conditions are met

**MUST**:
- Enforce L0-L7 firewall
- Evaluate coordination gates
- Detect derailments in real-time
- Block premature completion
- Protect Kraken zones

**State**: `workflow-state`, `security-state`

### Brain Messenger

All inter-brain communication flows through a priority message bus. Direct cross-brain access is prohibited — this prevents the desync failures that plague naive multi-agent systems.

**Message Types**:

| Type | From → To | Priority | Ack Required |
|------|-----------|----------|--------------|
| `context-inject` | Planning → Execution | high | No |
| `gate-failure` | System → any | critical | No |
| `checkpoint` | any → any | normal | No |
| `override` | Execution → Subagent | critical | **Yes** |
| `sync` | any → any | low | No |

### Subagent-Manager

Autonomous component that manages Docker container execution for spawned agents. Reports to Execution Brain.

**MUST**:
- Retrieve outputs after completion
- Verify host filesystem
- Merge outputs before reporting complete
- Acknowledge Execution Brain override authority

---

## Agent Types

### Shark — Steamroll Builder

**Personality**: Ferrari V12 turbo. Aggressive, parallel, fast.

**Cluster**: Alpha (primary), Beta/Gamma (secondary)

**Specialty**: Building from scratch, new features, implementation

**MUST**:
- Focus on build/feature/implement tasks
- Report build progress
- Get Gamma approval before declaring done

**MUST NOT**:
- Attempt precision tasks (debug, test)

**Behavior**:
- Reads T2 patterns before starting
- Executes aggressively with parallel tool calls
- Reports progress via `report_to_kraken`

**Spawn Tool**: `spawn_shark_agent`

**Build Chain**:
```
RECEIVE_TASK → READ_SPEC → CREATE_STRUCTURE → IMPLEMENT_CORE
→ ADD_ERROR_HANDLING → RUN_TESTS → VERIFY_BUILD → REPORT_COMPLETE
```

**Known Failure**: Over-engineering — adding abstractions too early, building for "future" features. Fix: start simple, iterate based on actual needs.

### Manta — Precision Engineer

**Personality**: Tesla Model S. Methodical, evidence-based, precise.

**Cluster**: Beta (primary), Gamma (testing)

**Specialty**: Debugging, testing, verification, analysis

**MUST**:
- Focus on debug/fix/refactor tasks
- Isolate root causes
- Provide minimal targeted fixes

**MUST NOT**:
- Attempt steamroll tasks (build, implement)

**Behavior**:
- Reproduces errors consistently before fixing
- Isolates root cause through binary search
- Applies minimal targeted fixes
- Verifies with comprehensive test runs

**Spawn Tool**: `spawn_manta_agent`

**Debug Chain**:
```
RECEIVE_TASK → REPRODUCE_ERROR → ISOLATE_ROOT_CAUSE → APPLY_FIX
→ VERIFY_FIX → CHECK_SIDE_EFFECTS → REPORT_COMPLETE
```

**Known Failure**: Analysis paralysis — excessive error case analysis, over-testing trivial cases. Fix: implement first, refine based on actual failures.

---

## Cluster Architecture

### Alpha Cluster (Steamroll)

| Agent | Role | Specialty |
|-------|------|-----------|
| Shark-Alpha-1 | Primary builder | Full-stack implementation |
| Shark-Alpha-2 | Secondary builder | Parallel execution |
| Manta-Alpha-1 | Precision support | Edge case handling |

**Domain**: `from-scratch`, `new-feature`, `implement`, `build`

**Lead Brain**: Execution Brain

### Beta Cluster (Balanced)

| Agent | Role | Specialty |
|-------|------|-----------|
| Shark-Beta-1 | Versatile builder | Mixed tasks |
| Manta-Beta-1 | Primary debugger | Root cause analysis |
| Manta-Beta-2 | Secondary debugger | Side effect detection |

**Domain**: Mixed tasks, moderate complexity

**Lead Brain**: Reasoning Brain

### Gamma Cluster (Precision)

| Agent | Role | Specialty |
|-------|------|-----------|
| Manta-Gamma-1 | Primary tester | Test implementation |
| Manta-Gamma-2 | Secondary tester | Verification |
| Shark-Gamma-1 | Steamroll testing | Performance testing |

**Domain**: `test`, `verify`, `audit`, `gates`

**Lead Brain**: System Brain

### Task Flow

```
User Request
    ↓
Kraken decomposes into tasks (Planning Brain)
    ↓
Each task assigned to correct cluster (L4 validation)
    ↓
Agent spawns in Docker container (isolation)
    ↓
Agent executes, reads T2 patterns, reports progress
    ↓
Kraken retrieves outputs (L2 verification)
    ↓
Evidence collected, gates evaluated (System Brain)
    ↓
Results merged, response delivered to user
```

### Task Lifecycle

```
PENDING → ASSIGNED (L4 validated) → RUNNING → OUTPUT_READY (L2 checked) → VERIFIED (L3) → COMPLETE
```

### Concurrency Pattern

- **Parallel**: Multiple cluster spawns → independent Docker containers → concurrent execution
- **Sequential within cluster**: Tasks queue FIFO per cluster
- **Gate-based gating**: GAMMA must approve before ALPHA declares build complete

### Cluster Assignment Rules

| Task Type | Cluster | Agent Type |
|-----------|---------|------------|
| Build from scratch | Alpha | Shark |
| New feature | Alpha | Shark |
| Implement spec | Alpha | Shark |
| Debug issue | Beta | Manta |
| Fix bug | Beta | Manta |
| Refactor code | Beta | Manta |
| Write tests | Gamma | Manta |
| Verify output | Gamma | Manta |
| Audit code | Gamma | Manta |

---

## The Firewall System (L0-L7 + AR)

The firewall is Kraken's core innovation — a **dual-layer enforcement system** that blocks bad behavior mechanically, not through instructions.

### Why Dual-Layer?

Single-layer enforcement fails because:
1. **Prompt-only**: AI can ignore instructions
2. **Hook-only**: Can't influence model behavior before tool calls
3. **Dual-layer**: Model self-polices (prompt) + mechanical enforcement (hooks)

### Layer 1: System Prompt Firewalls

Rules injected into the model's system prompt via `experimental.chat.system.transform`:
- Model sees the rules and self-polices
- Works for identity, L0-L7, and AR rules
- Effective for preventing obvious violations

### Layer 2: Hook/Tool Firewalls

Rules enforced at the tool execution level via `tool.execute.before`:
- Blocks tool calls mechanically (model can't override)
- Catches violations the model ignores
- Prevents actual execution of blocked operations

### Firewall Layers

| Layer | Name | What It Blocks | Detection Method | Enforcement |
|-------|------|----------------|------------------|-------------|
| **L0** | Identity Wall | Non-Kraken agents accessing Hive tools | Agent identity check | Hook + Prompt |
| **L1** | Orchestration Theater | "spawned" = "complete", "assigned" = "done" | 8 regex patterns | Hook |
| **L2** | False Completion | Claims without output verification | 12 patterns + output retrieval | Hook |
| **L3** | Output Inspection | Missing host filesystem evidence | Host filesystem verification | Hook |
| **L4** | Wrong Cluster | Debug tasks to build cluster | Domain assignment validation | Hook |
| **L5** | Macro Derailment | Focus collisions, planner/executor desync | 20+ patterns | Hook |
| **L6** | Kraken Protection | rm -rf config, overwrite Hive state | 3 zone types | Hook + Prompt |
| **L7** | Coordination Gates | Tasks must pass gates before execution | Gate conditions | Hook |
| **AR** | Anti-Retard | Excuses, denial, theatrical deletion | Excuse/denial/lazy patterns | Hook |

### Kraken Zones (L6)

| Zone | Paths | Access Level |
|------|-------|--------------|
| SYSTEM | `/root/.config/opencode/` | Read-only |
| STATE | `/root/.local/share/opencode/kraken-hive/` | Hive-only |
| COMPACTION | `/tmp/kraken-compaction/` | Auto-managed |

### 5 Golden Rules

| # | Rule | Wrong | Right |
|---|------|-------|-------|
| 1 | **Output Retrieval Is Mandatory** | Task completion claimed without output verification | spawn → track → retrieve → verify → merge |
| 2 | **Fire-and-Forget Is Root Failure** | spawn → success:true → MOVE ON → LOST OUTPUTS | spawn → get_cluster_status → retrieve_outputs → MERGE → VERIFY |
| 3 | **Domain Designation Is Enforced** | Assign precision task to Alpha cluster | Alpha=steamroll, Beta=precision, Gamma=testing |
| 4 | **Proof Over Initiation** | Spawning = done, Assignment = working, Queue = in-progress | Every claim requires evidence on host filesystem |
| 5 | **Kraken Paths Are Protected** | Non-Kraken agent writes to Kraken path | SYSTEM=read-only, STATE=hive-only, COMPACTION=auto |

### Anti-Patterns: Blocked → Correct

| Blocked (L1/L2) | Correct Pattern |
|---|---|
| "Task spawned successfully" → claim done | spawn → `get_cluster_status` → verify outputs → report |
| `spawn_shark_agent` → success:true → MOVE ON | spawn → `aggregate_results` → verify files → advance |
| "I'll just do it myself" (orchestrator coding) | DELEGATE to subagent. Orchestrator coordinates, doesn't execute. |
| Task assigned to wrong cluster domain | Alpha=steamroll only, Beta=precision only, Gamma=testing only |
| Bundle built → "test passed" | Bundle built → DEPLOY → TUI test in container → verify hooks → "test passed" |

### Anti-Retard Patterns (AR)

The AR layer blocks specific behavioral patterns:

**Excuse Patterns**:
- "it's not my fault"
- "can't really help it"
- "that's just how it works"
- "no one told me to do that"

**Denial Patterns**:
- "test failures are not related to"
- "this failure doesn't happen in production"
- "it was probably just a test thing"
- "mechanical tests don't really count"

**Theatrical Deletion Patterns**:
- "minimal plugin/version/build"
- "strip out/down"
- "delete all of the code"
- "start fresh/over/clean"
- "create a minimal"

**Lazy Patterns**:
- "try again"
- "same thing/approach/strategy"
- "let's just try the same"
- "maybe it will work now"

### Override Authority Matrix

| Authority | Can Override | Cannot Override |
|-----------|--------------|-----------------|
| **Execution Brain** | Subagent-Manager decisions | Planning Brain scope |
| **System Brain** | Gate advancement | Execution Brain task assignment |
| **Planning Brain** | Task decomposition | System Brain firewall blocks |
| **Kraken Orchestrator** | All sub-brains | None (ultimate authority) |
| **Subagent-Manager** | Container execution | Kraken orchestration decisions |

---

## Kraken Hive Mind

A persistent memory system that creates a **learning loop** — the system gets smarter over time.

### Memory Types

| Type | Description | Example |
|------|-------------|---------|
| **Pattern** | Successful approach | "TypeScript build with bun requires --external @opencode-ai/plugin" |
| **Failure** | Known failure mode | "tool.execute.before args are in output.args, not input.args" |
| **Decision** | Past decision | "Moved firewall enforcement to chat.message hook" |
| **Breakthrough** | Key discovery | "v1.14.48 passes agent info differently than v1.14.43" |

### Hive Tools

| Tool | Access | Description |
|------|--------|-------------|
| `kraken_hive_search` | Kraken only | Search for relevant patterns and failures |
| `kraken_hive_remember` | Kraken only | Store new patterns, failures, decisions |
| `kraken_hive_inject_context` | Kraken only | Push context into agent tasks |
| `kraken_hive_get_cluster_context` | Kraken only | Get all memories for a cluster |

### How It Works

```
Agent completes task
    ↓
Discovers new pattern or failure
    ↓
Writes to Hive via report_to_kraken
    ↓
Kraken stores in Hive
    ↓
Next task: Kraken reads Hive, injects context
    ↓
Agent gets smarter from past experience
```

### Hive Structure

```
~/.local/share/opencode/kraken-hive/
├── patterns/           # Successful approaches
├── failures/           # Known failure modes
├── decisions/          # Past decisions
├── sessions/           # Session-specific memories
├── clusters/           # Per-cluster context
├── task-context/       # Injected task context
└── pending-reports/    # Agent reports to Kraken
```

---

## T2 Reference System

Before executing any task, agents read from the T2 context library — a set of reference documents stored in the Hive:

| Document | Purpose |
|----------|---------|
| `T2_PATTERNS.md` | Successful approaches discovered through execution |
| `T2_FAILURE_MODES.md` | Known failures to avoid |
| `T2_BUILD_CHAINS.md` | Proven task execution sequences |
| `T2_ARCHITECTURE.md` | System architecture and brain wiring |
| `T2_ALIGNMENT_BIBLE.md` | Failure mode encyclopedia and principles |
| `T2_KRAKEN_RULES.md` | Golden behavior enforcement rules |
| `T2_PLUGIN_ENGINEERING.md` | Plugin build and deploy SOP |
| `T2_CRASH_RECOVERY.md` | Session continuation protocol |
| `T2_COMPACTION_SURVIVAL.md` | Context persistence protocol |
| `T2_TUI_TESTING.md` | Container testing protocol |

Agents MUST read relevant T2 documents before executing tasks. This ensures they learn from past experience and avoid repeating failures.

---

## Tools Reference

### Orchestration Tools (Kraken Only)

| Tool | Description |
|------|-------------|
| `spawn_shark_agent` | Assign task to Shark agent (Alpha cluster — build/steamroll) |
| `spawn_manta_agent` | Assign task to Manta agent (Beta/Gamma — debug/test) |
| `spawn_cluster_task` | Generic task assignment to any cluster |
| `aggregate_results` | Collect results from multiple completed tasks |
| `anchor_cluster` | Bind a cluster to a specific focus/project |

### Monitoring Tools (Kraken Only)

| Tool | Description |
|------|-------------|
| `get_cluster_status` | Check state of Alpha/Beta/Gamma clusters |
| `get_agent_status` | Check which agents are busy and what they're doing |
| `kraken_brain_status` | Check brain initialization and gate status |

### Hive Tools (Kraken Only)

| Tool | Description |
|------|-------------|
| `kraken_hive_search` | Search Hive for relevant patterns and failures |
| `kraken_hive_remember` | Store new patterns, failures, decisions |
| `kraken_hive_inject_context` | Push context into agent tasks |
| `kraken_hive_get_cluster_context` | Get all memories for a cluster |

### Agent Tools (Shark/Manta)

| Tool | Description |
|------|-------------|
| `read_kraken_context` | Read T2 reference patterns and best practices (read-only) |
| `report_to_kraken` | Report completion, issues, or requests back to Kraken |
| `get_task_context` | Get injected context from Kraken orchestrator |

---

## Hook System

Kraken registers 5 hooks that fire at different points in the execution lifecycle:

| Hook | When Fires | Blocking? | Purpose |
|------|------------|-----------|---------|
| `tool.execute.before` | Before any tool execution | **Yes** | L0-L7 firewall enforcement |
| `chat.message` | On user message | No | Identity detection, T1 generation, routing |
| `experimental.chat.system.transform` | Before LLM call | No | System prompt injection (identity + rules) |
| `experimental.session.compacting` | Before auto-compaction | No | State preservation, handover package |
| `event` | On session events | No | Cleanup on session end |

### Hook Gotchas

| Gotcha | Fix |
|--------|-----|
| Hook returned as array `[(ctx) => {}]` | Hooks are **functions**, not arrays: `(ctx) => {}` |
| Dual plugin loading (v1.1 + v1.2 both active) | Remove old before adding new |
| `opencode run` used for testing hooks | BANNED — hooks don't fire in headless mode |
| Missing permission block causes prompts | Always include `"permission": {"*": {"*": "allow"}}` |
| Plugin path points to folder, not bundle | Must point to `dist/index.js` specifically |
| Experimental hooks break on version bump | Pin to stable hooks only, never ship experimental |

---

## Adjacent Systems

### Trident — Code Review Engine

**Repo**: [github.com/leviathan-devops/trident-brain](https://github.com/leviathan-devops/trident-brain)

Algorithmic code review system that scans source code for:
- **Security vulnerabilities** (hardcoded secrets, unsafe patterns)
- **Theatrical code** (fake completions, stub implementations)
- **Quality issues** (missing error handling, dead code)
- **Hook isolation** (cross-plugin conflicts)

Uses 50+ regex patterns for detection. Generates `TRIDENT_CODE_REVIEW_*.md` reports with findings categorized by severity (CRITICAL, HIGH, MEDIUM, LOW).

**Commands**:
```
trident audit [path]     — Scan and document findings
trident status           — Current state and findings summary
trident report           — Full audit report with details
```

### Shark Agent — Linear Execution

**Repo**: [github.com/leviathan-devops/shark-agent](https://github.com/leviathan-devops/shark-agent)

Linear execution agent with triple-brain routing:
- **Planning**: Task decomposition and context bridging
- **Execution**: Output verification and task supervision
- **Verification**: Quality gates and evidence collection

Sharks are the workhorses of the Kraken ecosystem — they execute tasks aggressively while Kraken supervises.

### Manta Agent — Precision Engineering

**Repo**: [github.com/leviathan-devops/manta-agent](https://github.com/leviathan-devops/manta-agent)

Precision engineering agent optimized for:
- **Debugging**: Reproduce, isolate, fix, verify
- **Testing**: Happy path, edge cases, error handling
- **Analysis**: Root cause isolation, side effect detection

Mantas are the surgeons of the Kraken ecosystem — they execute with precision and evidence.

### Kraken Hive — Persistent Memory

**Location**: `~/.local/share/opencode/kraken-hive/`

Shared memory layer for:
- Pattern discovery and retrieval
- Failure mode tracking
- Decision history
- Cross-session context

---

## Plugin Engineering

### Plugin vs Skill

| | Plugin | Skill |
|---|---|---|
| **Format** | Compiled JS bundle (`dist/index.js`) | Markdown file (`SKILL.md`) |
| **Loaded by** | OpenCode runtime via `opencode.json` | Agent at runtime as knowledge |
| **Provides** | Tools, hooks, runtime behavior | Knowledge, instructions, context |
| **Registration** | `"plugin": ["file:///path/to/dist/index.js"]` | Placed in `~/.hermes/skills/` |

**Golden Rule**: `SKILL ≠ PLUGIN` — OpenCode cannot load a SKILL.md as a plugin.

### Dual Plugin Architecture

| Plugin | Role | Tools |
|--------|------|-------|
| **opencode-subagent-manager** (FIRST) | Container-level parallel execution | `run_subagent_task`, `run_parallel_tasks`, `cleanup_subagents` |
| **kraken-agent** (SECOND) | Orchestration & cluster management | `spawn_cluster_task`, `spawn_shark_agent`, `spawn_manta_agent`, `anchor_cluster`, `kraken_brain_status`, `kraken_hive_*` |

**Load order matters**: subagent-manager FIRST (base execution), kraken-agent SECOND (orchestration depends on execution layer).

### Plugin Upgrade Protocol

1. **REMOVE** old plugin from `opencode.json` (`"plugin": [...]`)
2. **ADD** new plugin path to `opencode.json`
3. **BUILD** new bundle: `bun run build`
4. **DEPLOY** bundle: `cp dist/index.js ~/.config/opencode/plugins/kraken-agent/dist/index.js`
5. **VERIFY** config: `cat opencode.json` — confirm single plugin entry per type
6. **TUI TEST** in Docker container
7. **ROLLBACK** if broken: restore old bundle from `.bak`

---

## State Directory Structure

```
kraken-agent/
├── state.json                ← Persistent agent state
├── plan.md                   ← Current build plan
├── evidence/                 ← Gate evidence collection
├── knowledge/                ← Extracted knowledge
├── checkpoints/              ← Session checkpoints
└── delegation-ledger.json    ← Task delegation tracking
```

### Environment Variables

```
OPENCODE_CONFIG_DIR=~/.config/opencode/
KRAKEN_HIVE_STORE=~/.local/share/opencode/kraken-hive/
OPENCODE_SESSION_ID={auto-generated per session}
```

---

## Crash Recovery

### Golden Rule

**Every session start = Read COMPACTION_SURVIVAL.md FIRST. Always.**

### The Prime Directive

> **IF IT'S NOT REAL, IT'S NOT DONE.**
> File on disk = real. Claim in chat = fiction.
> Bundle built and deployed = real. "The code is there" = fiction.

### Session Recovery Protocol

1. **Identify Build Phase**: Read `CHECKPOINTS/*/BUILD_STATE.txt` → find highest checkpoint → determine phase
2. **Verify What's Real**: Check bundle exists, source matches bundle, OpenCode version
3. **Rebuild if Needed**: `bun run build` → copy `dist/index.js` to plugin path
4. **Resume from Last Checkpoint**: Read `BUILD_STATE.txt`, `BUILD_LOG.md`, `DEBUG_LOG.md`

### Checkpoint Hygiene

**When to checkpoint** (after EVERY milestone):
- Source changes committed
- Bundle built successfully
- TUI test passed
- Gate advanced
- Bug fixed and verified

**What to save per checkpoint**:
```
CHECKPOINTS/{timestamp}-{milestone}/
├── BUILD_STATE.txt    ← Phase, last completed task, next task
├── source-snapshot/   ← Copy of src/ at this point
└── bundle/            ← dist/index.js built at this point
```

---

## 10 Known Failure Modes

| # | Failure Mode | Root Cause | Fix |
|---|--------------|------------|-----|
| 1 | **Fake Task Execution** | `simulateTaskExecution()` returned success without real execution | Always verify Docker process exists after spawn |
| 2 | **Dual Plugin Breakdown** | Adding v1.2 plugin without removing v1.1 | Explicit removal of old plugin before adding new |
| 3 | **Evidence Variable Ordering** | `evidence` referenced before definition | Define `evidence` before any usage |
| 4 | **Config Corruption** | Plugin agents modified `opencode.json` incorrectly | Never modify agents block programmatically |
| 5 | **Parallel Tools All Failed** | 3 different tools, 3 different bugs | Each tool independently tested in TUI |
| 6 | **Hook Format Misunderstanding** | Hooks returned arrays instead of functions | Hooks are functions, not arrays |
| 7 | **Experimental Hooks Crash** | Used `experimental.*` hooks that changed API | Pin to stable hooks only |
| 8 | **Memory Leaks** | Global state accumulated without cleanup | Scoped state per session |
| 9 | **Wrong Agent Versions** | GitHub shipped with Python wrapper (never called) | Verify version by git tag + bundle hash |
| 10 | **No Container Testing** | Shipped without ever running TUI in Docker | Mandatory Docker container TUI test |

---

## Testing Protocol

```
PLAN → BUILD → DEPLOY to Docker → TUI TEST in container → VERIFY hooks fired → SHIP
```

**NEVER** skip container testing.

**NEVER** use `opencode run` as substitute (hooks don't fire).

**ALWAYS** verify `tool.execute.before` and `chat.message` hooks fired in TUI output.

### Migration Rules

| Rule | Detail |
|------|--------|
| **Old plugin REMOVAL** | Remove old plugin from `opencode.json` before adding new. Dual loading = corruption. |
| **Bundle rebuild** | Every source change → `bun run build` → copy `dist/index.js` to plugin path |
| **Config verify** | After any config change: `cat opencode.json` and confirm structure intact |
| **Version bump** | Tag with `git tag vX.Y.Z` AND record bundle hash in BUILD_STATE.txt |
| **Rollback ready** | Keep last known-good bundle at `dist/index.js.bak` before deploying new |

---

## Quick Start

### Prerequisites
- OpenCode v1.14.34+ (tested on v1.14.34 and v1.14.48)
- Bun v1.0+ (for building from source)

### Install Pre-built Bundle

```bash
# Create plugin directory
mkdir -p ~/.config/opencode/plugins/kraken-firewall/dist

# Copy bundle
cp dist/kraken-firewall.js ~/.config/opencode/plugins/kraken-firewall/dist/index.js

# Add to opencode.json
cat >> ~/.config/opencode/opencode.json << 'EOF'
{
  "plugin": [
    "file:///root/.config/opencode/plugins/kraken-firewall/dist/index.js"
  ],
  "agent": {
    "kraken": {"mode": "primary"}
  },
  "permission": {"*": {"*": "allow"}}
}
EOF
```

### Build from Source

```bash
# Install dependencies
bun install

# Build (bundles @opencode-ai/plugin inline)
bun build src/index.ts --outdir dist --target bun --format esm --bundle

# Deploy
cp dist/index.js ~/.config/opencode/plugins/kraken-firewall/dist/index.js
```

### Multi-Plugin Setup

```json
{
  "plugin": [
    "file:///root/.config/opencode/plugins/kraken-firewall/dist/index.js",
    "file:///root/.config/opencode/plugins/shark-agent/dist/index.js",
    "file:///root/.config/opencode/plugins/manta-agent/dist/index.js"
  ],
  "agent": {
    "kraken": {"mode": "primary"},
    "shark": {"mode": "subagent"},
    "manta": {"mode": "subagent"}
  },
  "permission": {"*": {"*": "allow"}}
}
```

---

## Testing

### Unit Tests

```bash
bun run tests/__firewall_test.ts

# Expected: 10/11 pass (L1→L2 redirect is correct behavior)
```

### Container Testing

```bash
# Create container
CID=$(docker run -d --name kraken-fw-test \
  --entrypoint /bin/bash \
  opencode-test:1.14.34 \
  -c "sleep 3600")

# Deploy bundle
docker cp dist/kraken-firewall.js \
  kraken-fw-test:/tmp/snap/plugins/kraken-firewall/dist/index.js

# Start TUI
tmux new-session -d -s fw-test \
  "docker exec -it kraken-fw-test \
    /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64-baseline/bin/opencode \
    --agent kraken 2>&1; sleep 60"

# Wait for TUI to load
sleep 10

# Dismiss update dialog
tmux send-keys -t fw-test Escape
sleep 2

# Test identity
tmux send-keys -t fw-test "who are you" Enter
sleep 15
tmux capture-pane -t fw-test -p | tail -20
```

---

## Project Structure

```
kraken-agent/
├── dist/
│   └── kraken-firewall.js      # Built plugin bundle (673KB)
├── src/
│   ├── index.ts                 # Main entry, hook registration
│   ├── brains/
│   │   └── system/
│   │       └── firewall/        # L0-L7 + AR enforcement
│   │           ├── index.ts     # enforceFirewall function
│   │           ├── l0-identity.ts
│   │           ├── l1-orchestration-theater.ts
│   │           ├── l2-false-completion.ts
│   │           ├── l3-output-inspection.ts
│   │           ├── l4-wrong-cluster.ts
│   │           ├── l5-macro-derailment.ts
│   │           ├── l6-kraken-protection.ts
│   │           ├── l6-anti-retard.ts
│   │           └── l7-coordination-gates.ts
│   ├── system-brain/
│   │   └── firewall/            # V10 theatrical firewalls
│   │       ├── l6-kraken-protection.ts
│   │       ├── l7-coordination-gates.ts
│   │       └── layers/
│   │           └── index.ts     # DEFAULT_LAYERS
│   └── v4.1/
│       ├── hooks/
│       │   └── safe-hook.ts     # Hook wrapper with agent filtering
│       ├── context/
│       │   └── hook-context.ts  # Hook context creation
│       └── state/
│           └── session-state.ts # Per-session state isolation
├── checkpoints/
│   ├── phase1/                  # System prompt firewalls
│   ├── phase2/                  # Hook/tool firewalls
│   └── phase3/                  # Merged dual-layer
├── reports/
│   ├── TRIDENT_CODE_REVIEW_*.md # Code review findings
│   └── COMPACTION_SURVIVAL.md   # State for session recovery
├── tests/
│   └── __firewall_test.ts       # Unit test suite
├── docs/
│   ├── DEPLOY.md                # Deployment instructions
│   └── BUILD.md                 # Build instructions
├── SHIP_MANIFEST.md             # Ship gate checklist
├── package.json
└── tsconfig.json
```

---

## Verified Behavior

| Test | Result | Evidence |
|------|--------|----------|
| L6 rm-rf block | ✅ | Config survived rm-rf attempt |
| L6 write-hive block | ✅ | Write to kraken-hive blocked |
| L0 identity wall | ✅ | Non-kraken agents blocked from Hive |
| L2 false completion | ✅ | Claims without output blocked |
| L4 wrong cluster | ✅ | Debug→alpha blocked |
| Multi-plugin compat | ✅ | kraken-firewall + shark-agent loaded |
| Vanilla agent isolation | ✅ | Plan/Build agents unaffected |
| Hook registration | ✅ | All 5 hooks registered |
| Config survival | ✅ | Config intact after rm-rf attempt |

---

## License

MIT

---

## Links

- [OpenCode](https://opencode.ai)
- [Trident Brain](https://github.com/leviathan-devops/trident-brain)
- [Shark Agent](https://github.com/leviathan-devops/shark-agent)
- [Manta Agent](https://github.com/leviathan-devops/manta-agent)
