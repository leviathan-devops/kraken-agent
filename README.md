# Kraken Agent v1.2 — Multi-Brain Orchestration Framework

> **⚠️ ALPHA**: Kraken is under active development. APIs, architecture, and behavior are subject to change.

---

## What Is Kraken?

Kraken is a **central macro orchestrator** for AI agents. It transforms a single AI coding assistant into a coordinated system of specialized agents — each optimized for a specific task type — enforced by mechanical security layers that prevent the catastrophic failures that plague all AI agents today.

### The Problem

Every AI agent fails in the same predictable ways:

| Failure Mode | What Happens | Frequency |
|--------------|--------------|-----------|
| **Fake Completion** | Agent says "done" but never executed the task | Very High |
| **Fire-and-Forget** | Spawns subprocess, immediately forgets about it | High |
| **Wrong Specialist** | Debug task sent to a build agent | Medium |
| **Config Destruction** | rm -rf on critical paths | Medium |
| **Excuse Making** | "It's not my fault" instead of fixing | High |
| **Theatrical Code** | Stub implementations that look complete | Very High |
| **Focus Collision** | Multiple agents working on same file | Medium |
| **Premature Completion** | Declares done before verification | Very High |

These aren't edge cases — they're the **default behavior** of every AI agent. Kraken prevents ALL of them through mechanical enforcement.

### The Solution

Kraken doesn't rely on instructions that the AI can ignore. It uses **code-level enforcement** — hooks, firewalls, and gates that block bad behavior before it happens. The AI literally cannot bypass these checks because they execute at the plugin level, not the prompt level.

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

**State**: `planning-state`, `context-bridge`

#### Execution Brain
**Role**: Supervisor and output retriever

**Responsibilities**:
- Monitors task execution across all clusters
- Retrieves outputs from completed tasks
- Catches false completion claims (L2 enforcement)
- Overrides stuck or misbehaving agents
- Tracks task momentum and progress

**State**: `execution-state`, `quality-state`

#### System Brain
**Role**: Enforcer and gate manager

**Responsibilities**:
- Manages L0-L7 security firewalls
- Evaluates coordination gates (task-assignment, output-retrieval, roundtable-sync)
- Detects macro derailment in real-time
- Protects critical paths (Kraken zones)
- Auto-advances gates when conditions are met

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

---

## Agent Types

### Shark — Steamroll Builder

**Personality**: Ferrari V12 turbo. Aggressive, parallel, fast.

**Cluster**: Alpha (primary), Beta/Gamma (secondary)

**Specialty**: Building from scratch, new features, implementation

**Behavior**:
- Reads T2 patterns before starting
- Executes aggressively with parallel tool calls
- Reports progress via `report_to_kraken`
- Gets Gamma approval before declaring done
- Never attempts precision tasks (debug, test)

**Spawn Tool**: `spawn_shark_agent`

**Build Chain**:
```
RECEIVE_TASK → READ_SPEC → CREATE_STRUCTURE → IMPLEMENT_CORE
→ ADD_ERROR_HANDLING → RUN_TESTS → VERIFY_BUILD → REPORT_COMPLETE
```

### Manta — Precision Engineer

**Personality**: Tesla Model S. Methodical, evidence-based, precise.

**Cluster**: Beta (primary), Gamma (testing)

**Specialty**: Debugging, testing, verification, analysis

**Behavior**:
- Reproduces errors consistently before fixing
- Isolates root cause through binary search
- Applies minimal targeted fixes
- Verifies with comprehensive test runs
- Never attempts steamroll tasks (build, implement)

**Spawn Tool**: `spawn_manta_agent`

**Debug Chain**:
```
RECEIVE_TASK → REPRODUCE_ERROR → ISOLATE_ROOT_CAUSE → APPLY_FIX
→ VERIFY_FIX → CHECK_SIDE_EFFECTS → REPORT_COMPLETE
```

---

## Cluster Architecture

### Alpha Cluster (Steamroll)

| Agent | Role | Specialty |
|-------|------|-----------|
| Shark-Alpha-1 | Primary builder | Full-stack implementation |
| Shark-Alpha-2 | Secondary builder | Parallel execution |
| Manta-Alpha-1 | Precision support | Edge case handling |

**Domain**: `from-scratch`, `new-feature`, `implement`, `build`

**Brain**: Execution Brain

### Beta Cluster (Balanced)

| Agent | Role | Specialty |
|-------|------|-----------|
| Shark-Beta-1 | Versatile builder | Mixed tasks |
| Manta-Beta-1 | Primary debugger | Root cause analysis |
| Manta-Beta-2 | Secondary debugger | Side effect detection |

**Domain**: Mixed tasks, moderate complexity

**Brain**: Reasoning Brain

### Gamma Cluster (Precision)

| Agent | Role | Specialty |
|-------|------|-----------|
| Manta-Gamma-1 | Primary tester | Test implementation |
| Manta-Gamma-2 | Secondary tester | Verification |
| Shark-Gamma-1 | Steamroll testing | Performance testing |

**Domain**: `test`, `verify`, `audit`, `gates`

**Brain**: System Brain

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

| Layer | Name | What It Blocks | Enforcement |
|-------|------|----------------|-------------|
| **L0** | Identity Wall | Non-Kraken agents accessing Hive tools | Hook + Prompt |
| **L1** | Orchestration Theater | "spawned" = "complete", "assigned" = "done" | Hook |
| **L2** | False Completion | Claims without output verification | Hook |
| **L3** | Output Inspection | Missing host filesystem evidence | Hook |
| **L4** | Wrong Cluster | Debug tasks to build cluster | Hook |
| **L5** | Macro Derailment | Focus collisions, planner/executor desync | Hook |
| **L6** | Kraken Protection | rm -rf config, overwrite Hive state | Hook + Prompt |
| **L7** | Coordination Gates | Tasks must pass gates before execution | Hook |
| **AR** | Anti-Retard | Excuses, denial, theatrical deletion | Hook |

### Kraken Zones (L6)

| Zone | Paths | Access Level |
|------|-------|--------------|
| SYSTEM | `/root/.config/opencode/` | Read-only |
| STATE | `/root/.local/share/opencode/kraken-hive/` | Hive-only |
| COMPACTION | `/tmp/kraken-compaction/` | Auto-managed |

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

### Agent Tools (Shark/Manta)

| Tool | Description |
|------|-------------|
| `read_kraken_context` | Read T2 reference patterns and best practices (read-only) |
| `report_to_kraken` | Report completion, issues, or requests back to Kraken |
| `get_task_context` | Get injected context from Kraken orchestrator |

### Tool Details

#### spawn_shark_agent
```
Args:
  task: string — Description of the task
  clusterId: string — Target cluster (alpha, beta, gamma)
  taskType: string — Type of task (build, debug, test)
  
Example:
  spawn_shark_agent({
    task: "Build a REST API for user management",
    clusterId: "cluster-alpha",
    taskType: "build"
  })
```

#### spawn_manta_agent
```
Args:
  task: string — Description of the task
  clusterId: string — Target cluster (alpha, beta, gamma)
  taskType: string — Type of task (build, debug, test)
  
Example:
  spawn_manta_agent({
    task: "Debug the authentication failure in login endpoint",
    clusterId: "cluster-beta",
    taskType: "debug"
  })
```

#### report_to_kraken
```
Args:
  taskId: string — ID of the task being reported
  status: string — "complete", "blocked", "error", or "request"
  details: string — Details of completion, issue, or request
  files: string[] — Files created or modified (optional)
  
Example:
  report_to_kraken({
    taskId: "task_123",
    status: "complete",
    details: "REST API implemented with 5 endpoints",
    files: ["src/api/users.ts", "src/api/auth.ts"]
  })
```

#### kraken_hive_search
```
Args:
  query: string — Search query
  category: string — "all", "patterns", "failures", "decisions"
  limit: number — Max results (default 5)
  
Example:
  kraken_hive_search({
    query: "TypeScript build errors",
    category: "failures",
    limit: 3
  })
```

#### kraken_hive_remember
```
Args:
  key: string — Short summary
  content: string — Full content
  category: string — "pattern", "failure", "decision", "breakthrough"
  
Example:
  kraken_hive_remember({
    key: "bun external plugin requirement",
    content: "When building OpenCode plugins with bun, must NOT use --external @opencode-ai/plugin. The plugin module must be bundled inline for container testing.",
    category: "pattern"
  })
```

---

## Adjacent Systems

### Trident — Code Review Engine

**Repo**: [github.com/leviathan-devops/trident-brain](https://github.com/leviathan-devops/trident-brain)

Algorithmic code review system that scans source code for:
- **Security vulnerabilities** (hardcoded secrets, unsafe patterns)
- **Theatrical code** (fake completions, stub implementations)
- **Quality issues** (missing error handling, dead code)
- **Hook isolation** (cross-plugin conflicts)

**Commands**:
```
trident audit [path]     — Scan and document findings
trident status           — Current state and findings summary
trident report           — Full audit report with details
```

**Output**: `TRIDENT_CODE_REVIEW_*.md` reports with findings categorized by severity (CRITICAL, HIGH, MEDIUM, LOW).

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

## Hook System

Kraken registers 5 hooks that fire at different points in the execution lifecycle:

| Hook | When Fires | Blocking? | Purpose |
|------|------------|-----------|---------|
| `tool.execute.before` | Before any tool execution | **Yes** | L0-L7 firewall enforcement |
| `chat.message` | On user message | No | Identity detection, T1 generation, routing |
| `experimental.chat.system.transform` | Before LLM call | No | System prompt injection (identity + rules) |
| `experimental.session.compacting` | Before auto-compaction | No | State preservation, handover package |
| `event` | On session events | No | Cleanup on session end |

### Hook Flow

```
User Message
    ↓
chat.message hook
    → Identity detection
    → T1 generation (Planning Brain)
    → Agent routing
    ↓
experimental.chat.system.transform hook
    → Inject identity into system prompt
    → Inject L0-L7 + AR rules
    ↓
Model processes message
    ↓
tool.execute.before hook (for each tool call)
    → L0-L7 firewall check
    → Block if violation detected
    ↓
Tool execution
    ↓
experimental.session.compacting hook (if needed)
    → Preserve brain state
    → Generate handover package
```

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

# Expected output:
# PASS: L6: rm-rf opencode config should block
# PASS: L6: write to kraken-hive should block
# PASS: L6: write to /tmp should pass
# PASS: L0: non-kraken agent accessing Hive should block
# PASS: L0: kraken agent accessing Hive should pass
# FAIL: L1: report_to_kraken spawned-implies-complete should block
#   (L2 catches instead — correct behavior)
# PASS: L2: report complete without output verification should block
# PASS: L4: debug task sent to alpha should block
# PASS: L4: build task sent to alpha should pass
# PASS: L5: simple tool call passes
# PASS: L7: standard tool call passes gates
# 
# 10 passed, 1 failed (L1→L2 redirect is correct)
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

## Key Design Decisions

1. **Mechanical > Textual**: 90% enforcement via code (firewalls, gates), 10% via text matching
2. **Execution > Initiation**: Spawning ≠ complete. Track → Retrieve → Verify → Merge
3. **Isolation > Integration**: Every component independently testable
4. **Dual-Layer Defense**: System prompt (model self-polices) + Hook/tool (mechanical enforcement)
5. **Learning Loop**: Hive Mind stores patterns/failures, agents get smarter over time

---

## Failure Modes (From Hive)

| # | Failure Mode | Root Cause | Fix |
|---|--------------|------------|-----|
| 1 | Fake Task Execution | `simulateTaskExecution()` returned success without real execution | Always verify Docker process exists after spawn |
| 2 | Dual Plugin Breakdown | Adding v1.2 plugin without removing v1.1 | Explicit removal of old plugin before adding new |
| 3 | Evidence Variable Ordering | `evidence` referenced before definition | Define `evidence` before any usage |
| 4 | Config Corruption | Plugin agents modified `opencode.json` incorrectly | Never modify agents block programmatically |
| 5 | Parallel Tools All Failed | 3 different tools, 3 different bugs | Each tool independently tested in TUI |
| 6 | Hook Format Misunderstanding | Hooks returned arrays instead of functions | Hooks are functions, not arrays |
| 7 | Experimental Hooks Crash | Used `experimental.*` hooks that changed API | Pin to stable hooks only |
| 8 | Memory Leaks | Global state accumulated without cleanup | Scoped state per session |
| 9 | Wrong Agent Versions | GitHub shipped with Python wrapper (never called) | Verify version by git tag + bundle hash |
| 10 | No Container Testing | Shipped without ever running TUI in Docker | Mandatory Docker container TUI test |

---

## License

MIT

---

## Links

- [OpenCode](https://opencode.ai)
- [Trident Brain](https://github.com/leviathan-devops/trident-brain)
- [Shark Agent](https://github.com/leviathan-devops/shark-agent)
- [Manta Agent](https://github.com/leviathan-devops/manta-agent)
