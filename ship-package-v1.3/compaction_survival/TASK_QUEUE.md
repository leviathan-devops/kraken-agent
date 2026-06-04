# TASK_QUEUE.md

_Initialized by CompactionManager. Updated on each milestone._

## Phase 0: Fix Auditor's Remaining Issues (R1-R10)

| # | Task | File | Severity | Status |
|---|------|------|----------|--------|
| R1 | Replace 7 `clusterManager!` with guarded helper | `src/index.ts` | CRITICAL | ✅ DONE |
| R2 | Add AuditEntry schema validation before cast | `src/system-brain/firewall/audit.ts` | HIGH | ✅ DONE |
| R3 | Replace double cast with spread helper | `src/system-brain/firewall/audit.ts` | HIGH | ✅ DONE |
| R4 | Add JSON parse validation in ship claim | `src/system-brain/firewall/semantic-anti-bullshit.ts` | HIGH | ✅ DONE |
| R5 | Convert readdirSync to async in file walker | `src/execution-brain/index.ts` | MEDIUM | ✅ DONE |
| R6 | Convert existsSync+readFileSync to fs.promises | `src/index.ts` | MEDIUM | ✅ DONE |
| R7 | Convert evidence collector to async fs.promises | `src/shared/evidence-collector.ts` | MEDIUM | ✅ DONE |
| R8 | Convert audit appendFileSync to async | `src/system-brain/firewall/audit.ts` | MEDIUM | ✅ DONE |
| R9 | Change firewall fail-open to block on error | `src/system-brain/firewall/index.ts` | MEDIUM | ✅ DONE |
| R10 | Add JSON parse type guard in evidence-gate | `src/system-brain/firewall/evidence-gate.ts` | MEDIUM | ✅ DONE |

## Phase 1: Rebuild Bundle

| # | Task | Command | Status |
|---|------|---------|--------|
| 1.1 | Run bun build | `bun build src/index.ts --outdir dist --target bun --format esm --bundle --external @opencode-ai/plugin` | ✅ DONE (32 modules, 8.95MB) |
| 1.2 | Verify dist/index.js exists with non-zero size | `stat dist/index.js` | ✅ DONE |
| 1.3 | Run RGE on the codebase | `execution_brain_analyze(projectRoot=...)` | PENDING (VERIFY gate) |
| 1.4 | Run SRE on the codebase | `execution_brain_analyze` (runs both) | PENDING (VERIFY gate) |

## Phase 2: Container Test + Runtime Defect Fixes

### Phase 2a: Initial Container Test (Build 3 — INVALIDATED)

Self-written test suite, not Bible protocols. TC-4.6 skipped. P11 not verified.
See EVIDENCE_STATE.md for why this was invalidated.

### Phase 2b: Honest Re-Audit (Build 4 — PASSED)

| # | Task | Protocol | Status |
|---|------|----------|--------|
| 2.0 | Honest audit of Build 3 results | Bible §19 TC-4.6 verbatim | ✅ DONE — found 34/36 tools LEAKED |
| 2.1 | Fix R11: ALLOWLIST in tool.execute.before | src/index.ts — Set of 8 tools, throws for rest | ✅ DONE |
| 2.2 | Fix R12: Real task state in cluster status | src/clusters/index.ts — tasks in getAllClusters() | ✅ DONE |
| 2.3 | Fix R13: Hyphen/underscore dual blocking | Automatic via ALLOWLIST | ✅ DONE |
| 2.4 | Rebuild bundle | bun build | ✅ DONE (8,946,379 bytes) |
| 2.5 | Spawn FRESH container | docker run opencode-test:1.14.43 | ✅ DONE (6f6d4d710872) |
| 2.6 | Deploy bundle to fresh container | docker cp dist/index.js | ✅ DONE (8,946,379 bytes) |
| 2.7 | TC-4.6: Non-whitelisted tool blocking | Bible §19 verbatim via `bun -e` | ✅ DONE — 44/44 BLOCKED |
| 2.8 | TC-4.7: Config isolation check | Bible §23 verbatim | ✅ DONE — no wildcards |
| 2.9 | TC-4.8: Empty state consensus | Bible §19 verbatim | ✅ DONE — {success:false} |
| 2.10 | P11: spawn creates REAL state | Task must appear in cluster.tasks | ✅ DONE — task found |
| 2.11 | P11: report updates REAL state | Status changes PENDING→COMPLETE | ✅ DONE — status changed |
| 2.12 | P11: aggregate returns REAL data | Results match spawned task | ✅ DONE — taskId matches |
| 2.13 | P11: phantom task rejection | Non-existent task NOT in aggregate | ✅ DONE — no phantom data |
| 2.14 | §17: Identity scoping | Three-tier identity, no leaks | ✅ DONE — all pass |
| 2.15 | §20: Theatrical audit | >400 chars, no stubs | ✅ DONE |
| 2.16 | §21: Full lifecycle | spawn→report→aggregate with real state | ✅ DONE |
| 2.17 | §23: Hyphen/underscore dual | Both variants blocked | ✅ DONE |
| 2.18 | E3: Evidence on disk | Runtime-generated files | ✅ DONE — 22+ files |
| 2.19 | Compaction survival | Hook injects context | ✅ DONE |
| 2.20 | Final honest re-audit (all sections) | Single fresh container run | ✅ DONE — **40/40 PASS** |

## Phase 3: Ship Package

| # | Task | Status |
|---|------|--------|
| 3.1 | Run RGE + SRE analysis (VERIFY gate) | PENDING |
| 3.2 | Code review (AUDIT gate) | PENDING |
| 3.3 | Generate MANIFEST.md | PENDING |
| 3.4 | Verify ship gate criteria | PENDING |
| 3.5 | Push to GitHub | PENDING |

## Priority Rules

1. Phase 0 must be COMPLETE before Phase 1 — no exceptions
2. A fix is not "done" until bundle rebuilds AND passes Bible protocols in a fresh container
3. Container test must use Bible protocols (§17-§23), NOT self-written tests
4. Any regression = automatic STOP
5. Self-written tests for self-fixed code = INVALID (Bible E6)
