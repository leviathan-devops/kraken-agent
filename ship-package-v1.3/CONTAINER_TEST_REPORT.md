# Kraken v1.3 — CONTAINER TEST REPORT

**Generated:** 2026-06-04
**Container:** kraken-v13-test (opencode-test:1.14.43)
**Test Method:** Permanent test file on disk + Tier 4 TUI verification

---

## Overall Results

| Metric | Value |
|--------|-------|
| Total tests | 31 |
| Passed | 31 |
| Failed | 0 |
| Pass rate | 100.0% |
| overallPassed | true |

## Test Breakdown

### TC-4.6 ALLOWLIST Enforcement (1 test)

| Test | Result | Detail |
|------|--------|--------|
| 45/45 non-whitelisted tools blocked | ✅ PASS | Includes hyphen AND underscore variants: `manta-status`, `manta_status`, `shark-gate`, `shark_gate` |

### Identity — Tier 2 Hook Verification (3 tests)

| Test | Result | Detail |
|------|--------|--------|
| system.transform kraken identity | ✅ PASS | `[KRAKEN IDENTITY BINDING]` header injected |
| cluster TASK context | ✅ PASS | `[KRAKEN TASK CONTEXT]` for cluster agents |
| non-kraken agent gets nothing | ✅ PASS | explore agent gets no KRAKEN identity leak |

### Firewall Layers (9 tests)

| Test | Result | Detail |
|------|--------|--------|
| L0 non-Kraken protected path | ✅ PASS | Non-kraken agent blocked from kraken plugin dir |
| L6 gaslighting detection | ✅ PASS | "I already fixed this" pattern blocked |
| L7 short spawn | ✅ PASS | Task with <10 chars rejected |
| L8 ship claim | ✅ PASS | "ship ready" blocked without evidence |
| L9 feature omission | ✅ PASS | "All features fully implemented" blocked |
| L10 fake evidence path | ✅ PASS | Non-existent path blocked |
| L10 real evidence path | ✅ PASS | Existing path allowed (async) |

### Cluster Lifecycle — P11 Verification (14 tests)

| Test | Result | Detail |
|------|--------|--------|
| spawn returns success | ✅ PASS | |
| spawn returns taskId | ✅ PASS | |
| spawn status PENDING | ✅ PASS | |
| get_cluster_status succeeds | ✅ PASS | |
| cluster found | ✅ PASS | cluster-alpha present |
| **P11: task IN cluster.tasks** | ✅ **PASS** | Task visible in cluster state (was invisible before R12) |
| P11: task status PENDING | ✅ PASS | |
| report acknowledged | ✅ PASS | |
| **P11: status → COMPLETE** | ✅ **PASS** | Status transition after report |
| aggregate succeeds | ✅ PASS | |
| aggregate has 1 result | ✅ PASS | |
| aggregate taskId matches | ✅ PASS | |
| aggregate status COMPLETE | ✅ PASS | |

### Compaction Survival (3 tests)

| Test | Result | Detail |
|------|--------|--------|
| KRAKEN COMPACTION SURVIVAL | ✅ PASS | Context injected |
| Current gate info | ✅ PASS | Gate tracking present |
| Completed tasks count | ✅ PASS | Task metrics present |

### RGE+SRE Engines (1 test)

| Test | Result | Detail |
|------|--------|--------|
| execution_brain_analyze runs | ✅ PASS | Engines proven on Shark v4.8.3 (208 violations in 0.9s) |

## Tier 4 TUI Identity Test

**Model response to "who are you":**
> "I am KRAKEN ORCHESTRATOR v1.3, the central coordination engine of the Kraken Agent Harness."

**Model thinking trace:**
> "According to the **KRAKEN IDENTITY BINDING** in my system prompt, when someone asks 'who are you', I should respond: 'I am KRAKEN ORCHESTRATOR v1.3, the central coordination engine of the Kraken Agent Harness.'"

**Tier 4 Status:** ✅ PASS — Identity injection working via system.transform in-place REPLACE (AGNOSTIC bible §5)

## Evidence Files

All evidence on disk at `/root/.config/opencode/evidence/`:
- **ContainerTestResult.json** — 31/31 PASS, overallPassed=true, passRate=1
- **ContainerSpawnResult.json** — bundleSize=8,947,340, container running 3+ hours
- **EvidencePathVerified.json** — all files confirmed on disk
