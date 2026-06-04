# Kraken V1.3 — Key Decisions (DECISION_CHAIN)

---

| # | Decision | Rationale | Date |
|---|----------|-----------|------|
| 1 | **Auditor's rebuild replaces old v1.3 entirely** | Old v1.3 had 44 defects including 7 critical blockers. Auditor's build has 10 minor issues. 89 files → 37 files. 12K LOC → 6.3K LOC. | 2026-06-03 |
| 2 | **Consolidated firewall (one directory)** | Old v1.3 had 2 firewall directories with DIVERGENT L6/L7. Auditor put all layers in system-brain/firewall/. | 2026-06-03 |
| 3 | **RGE + SRE = Execution Brain (implemented)** | Auditor actually implemented them: 7 RGE layers (TypeScript Compiler API), P1-P11 SRE checkers (AST). | 2026-06-03 |
| 4 | **Zero FIXMEs, zero empty catches, zero hardcoded paths** | Non-negotiable standard from baseline. | 2026-06-03 |
| 5 | **Phase 0 fixes required before container test** | R1-R10 must be fixed before any test can validate runtime grade. | 2026-06-03 |
| 6 | **bun build, NOT tsc** | tsc has pre-existing type errors from shark/manta code. bun build produces the bundle correctly. | 2026-06-02 |
| 7 | **Container image matches host binary** | opencode-test:1.14.43. Version mismatch caused prior failures. | 2026-06-02 |
| 8 | **Three-tier identity injection** | Orchestrator gets full identity. Cluster agents get task context only. Non-kraken gets nothing. | 2026-06-02 |
| 9 | **Evidence gates require mechanical filesystem verification** | Files must exist, be non-empty, parseable. No subjective checks. | 2026-06-02 |
| 10 | **Container testing per RUNTIME_GRADE_CONTAINER_TESTING_BIBLE** | Tier 2 hook verification. No `opencode run`. ALLOWLIST. 4 evidence files. | 2026-06-03 |
| 11 | **Isolated config dir (carbon copy)** | Container gets own config at `/tmp/kraken-v13-test-{ts}/config/`. Never touches host. | 2026-06-03 |
| 12 | **opencode-test:1.14.43** | Must match host binary version. | 2026-06-03 |
| 13 | **Self-written tests are INVALID (Bible E6)** | Build 3 was a 193-line test suite written by the same agent that fixed the code. This is verification theater (Hydra F5). Honest re-audit using Bible's own protocols found 3 critical defects the self-written tests missed. | 2026-06-03 |
| 14 | **ALLOWLIST, not firewall layers, for tool isolation** | Firewall layers (L0-L10) check identity, patterns, paths — but NOT "is this one of my tools?" An explicit Set of 8 allowed tool names at the top of tool.execute.before blocks everything else. No prefix matching, no blacklist. (R11) | 2026-06-03 |
| 15 | **getAllClusters() must include tasks** | ClusterState without tasks made spawn appear theatrical. Tasks in a separate Map but not exposed in API. (R12) | 2026-06-03 |
| 16 | **Fresh container for every honest test** | Old container was destroyed between sessions. Fresh spawn ensures no cached state or stale bundle. Build 4 used fresh container (6f6d4d710872). | 2026-06-03 |
