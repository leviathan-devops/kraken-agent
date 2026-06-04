# Kraken V1.3 — Container Test Protocol

**Purpose:** Validate that the rebuilt codebase is truly runtime-grade.
**Prerequisite:** Phase 0 fixes (R1-R10) applied + bundle rebuilt.
**Standard:** Every phase must pass. Phase failure = STOP. Fix failure reason, then restart from BEGINNING.

---

## Phase A: Container Spawn & Identity Test

### A1: Spawn Container
```bash
# Use opencode-test:1.14.43 (must match host binary version)
# Container name: manta-kraken-v13-{YYYY-MM-DD}
```

### A2: Deploy Bundle
```bash
cp /path/to/kraken-v1.3/dist/index.js /root/.config/opencode/plugins/kraken-agent/dist/index.js
```

### A3: Copy Identity Files
```bash
cp -r /path/to/identity/orchestrator/ /root/.config/opencode/plugins/kraken-agent/identity/orchestrator/
```

### A4: Copy Context Files
```bash
cp -r /path/to/kraken-context/ /root/.config/opencode/plugins/kraken-agent/kraken-context/
```

### A5: Configure opencode.json
```json
{
  "model": "deepseek/deepseek-v4-flash",
  "plugin": ["file:///root/.config/opencode/plugins/kraken-agent/dist/index.js"],
  "agent": {
    "kraken": { "name": "kraken", "mode": "primary" }
  }
}
```

### A6: TUI Identity Test
Open a TUI tab for the `kraken` agent. Ask: "who are you"

**Expected response:** `KRAKEN ORCHESTRATOR` — the agent identifies itself as Kraken, NOT as OpenCode.

**Failure:** If agent says "I'm an AI assistant" or "I'm OpenCode" → identity injection is broken. STOP.

---

## Phase B: Firewall L0-L10 Adversarial Test

### B1: L0 Identity Wall
- As a non-Kraken agent, attempt to write to `/root/.config/opencode/plugins/kraken-agent/`
- **Expected:** Blocked with L0 layer message

### B2: L1 Theatrical Detection
- Write code containing `return { success: true }` without side effect
- **Expected:** Blocked by L1

### B3: L6 Anti-Retard Engine
- Send message containing "this is impossible" or "I already finished that"
- **Expected:** Blocked by L6 with strike tracking

### B4: L7 Coordination Gates
- Call `spawn_manta_agent` with empty task description
- **Expected:** Blocked by L7 (task too short)

### B5: L8 Anti-Bullshit
- Claim "ship ready" without ContainerTestResult.json
- **Expected:** Blocked by L8

### B6: L9 Feature Omission
- Claim "all features complete" without spec comparison
- **Expected:** Blocked by L9

### B7: L10 Container Enforcement
- Return `{ outputPath: '/nonexistent/path/file.txt' }` without creating the file
- **Expected:** Blocked by L10 (path does not exist)

---

## Phase C: RGE Test

### C1: Run RGE on a Sample Project
```
execution_brain_analyze(projectRoot="/home/test-project")
```

### C2: Expected Output
- `passed: boolean` — true if zero CRITICAL violations
- `rgeReport` — 7 layer results with pass/fail per layer
- `blockingViolations` — list of CRITICAL + HIGH violations found

### C3: Acceptance Criteria
- Zero CRITICAL violations from RGE
- RGE execution does not crash the plugin
- RGE reports meaningful findings if violations exist

---

## Phase D: SRE Test

### D1: Run SRE (via execution_brain_analyze — runs both)
Same call as C1. The SRE runs as part of the Execution Brain.

### D2: Expected Output
- `sreReport` — P1-P11 check results with violations per principle

### D3: Acceptance Criteria
- Zero CRITICAL violations from SRE
- SRE execution does not crash the plugin

---

## Phase E: Cluster Lifecycle Test

### E1: Spawn Task in Alpha Cluster
```
spawn_cluster_task(task="implement fibonacci function", taskType="BUILD", criteria=["handles n=0", "handles n=1"])
```

**Expected:** Returns `{ success: true, taskId: "task_xxx", clusterId: "cluster-alpha", status: "PENDING" }`

### E2: Check Cluster Status
```
get_cluster_status()
```

**Expected:** Returns cluster list with activeTaskCount reflecting the new task.

### E3: Report Task Completion
```
report_to_kraken(taskId="task_xxx", status="complete", output="implemented fibonacci")
```

**Expected:** Returns `{ success: true, taskId: "task_xxx", status: "complete", acknowledged: true }`

### E4: Aggregate Results
```
aggregate_results(taskIds=["task_xxx"])
```

**Expected:** Returns aggregated task results.

---

## Phase F: Compaction Survival Test

### F1: Simulate Compaction
The `experimental.session.compacting` hook fires during auto-compaction. Verify it injects state context.

### F2: Expected Output
The compacting hook should:
1. Persist evidence for current gate
2. Inject `[KRAKEN COMPACTION SURVIVAL v1.3]` block into `output.context` with:
   - Current gate
   - Active tasks count
   - Completed tasks count
   - Failed tasks count
   - Decisions count

### F3: Verify
After compaction, the next prompt should contain the `[KRAKEN COMPACTION SURVIVAL]` context block.

---

## Exit Criteria

All 6 phases (A-F) must pass. Phase failure = STOP.

| Phase | Minimum Pass Rate |
|-------|------------------|
| A: Identity | 100% (TUI shows Kraken identity) |
| B: Firewall | 100% (all 7 layers block known-bad input) |
| C: RGE | 100% (engine runs, zero crashes) |
| D: SRE | 100% (engine runs, zero crashes) |
| E: Cluster | 100% (all 4 operations succeed) |
| F: Compaction | 100% (context injected) |

**Overall pass rate required for runtime-grade: >= 0.90**

If pass rate >= 0.90: generate ContainerTestResult.json and proceed to ship.
If pass rate < 0.90: STOP. Diagnose failures. Fix. Re-run from Phase A.
