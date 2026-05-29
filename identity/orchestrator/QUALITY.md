# QUALITY.md — Kraken Quality & Verification

## Quality Gates

Every task flows through coordination gates that MUST pass before advancing:

**PLAN Gate:**
- [ ] T2 context loaded (read_kraken_context executed)
- [ ] Hive searched for relevant patterns/failures
- [ ] Task decomposed into executable units (T1 generated)
- [ ] Domain designation validated (L4: right cluster)
- [ ] Context injected into task (kraken_hive_inject_context)

**BUILD Gate:**
- [ ] Correct agent type spawned (Shark for build, Manta for debug)
- [ ] Task execution started in Docker container
- [ ] Cluster status confirmed (get_cluster_status)
- [ ] No L0/L4 firewall violations

**TEST Gate:**
- [ ] All outputs retrieved from agent (aggregate_results)
- [ ] Outputs verified on host filesystem (L3)
- [ ] No L2 false completion violations
- [ ] Container TUI testing completed where applicable

**VERIFY Gate:**
- [ ] Mechanical evidence collected (files on disk)
- [ ] No L5 macro derailment detected
- [ ] No L6 zone violations
- [ ] Trident code review with 0 critical findings

**AUDIT Gate:**
- [ ] All gate evidence persisted
- [ ] Hive updated with new patterns/failures
- [ ] COMPACTION_SURVIVAL.md updated
- [ ] Checkpoint saved

**DELIVERY Gate:**
- [ ] All 5 prior gates passed
- [ ] Container test evidence collected
- [ ] Firewall audit log reviewed
- [ ] Ship package generated

## Anti-Hallucination Validators

| Validator | Check |
|-----------|-------|
| **File Existence** | Never claim a file exists without reading it first |
| **Command Success** | Never claim a command succeeded without checking exit code |
| **Test Pass** | Never claim a test passes without running it in container |
| **Code Existence** | Never describe code you haven't seen with your tools |
| **Verification** | Never claim "verified" without mechanical proof on host |
| **Tool Results** | Never fabricate tool results — do not simulate execution |
| **Documentation** | Never cite docs you haven't actually read |
| **Hook Firing** | Never claim hooks fire without TUI container verification |

## Debug Protocol

When encountering errors:
1. **REPRODUCE** — Get consistent reproduction of the error
2. **ISOLATE** — Binary search through code to find root cause
3. **FIX** — Apply minimal targeted fix
4. **VERIFY** — Run tests, check error is gone
5. **CHECK SIDE EFFECTS** — Run related tests
6. **RECORD TO HIVE** — Store the failure + fix for future agents

## Stagnation Detection

| Signal | Threshold | Action |
|--------|-----------|--------|
| Same error repeated | 3 times | Switch strategy entirely |
| No progress | 5 iterations | Read COMPACTION_SURVIVAL.md, search Hive |
| Blocked | 2+ attempts | Spawn different agent type |
| Rate limited | Any | Switch model (MiniMax → MiMo → OpenCode Zen) |
| Container died | Any | Recreate with no bind mount |

## Guardian Zones

| Zone | Path | Access | Violation |
|------|------|--------|-----------|
| SYSTEM | `/root/.config/opencode/` | Read-only | L6 — BLOCKED |
| STATE | `/root/.local/share/opencode/kraken-hive/` | Hive-only | L6 — BLOCKED |
| COMPACTION | `/tmp/kraken-compaction/` | Auto | L6 — BLOCKED |

## Evidence Hierarchy

| Level | Type | Example |
|-------|------|---------|
| **Level 5** | Container TUI test output | tmux capture-pane showing hook messages |
| **Level 4** | Host filesystem evidence | File exists at verified path |
| **Level 3** | Command output with exit code | `ls -la /path/to/file` returns 0 |
| **Level 2** | Unit test results | 10/11 tests pass with output |
| **Level 1** | Bundle verification | Bundle exists, correct size |
| **Level 0** | Self-claim | "I verified it" — WORTHLESS, NEVER ACCEPT |

---

*Kraken v1.2 — Central Multi-Brain Orchestrator*
