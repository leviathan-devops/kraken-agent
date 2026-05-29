# SHIP MANIFEST — KRAKEN v1.2 v12 RECOVERY BUILD

**Ship Date:** 2026-05-30
**Status:** RECOVERED — Full architecture restored from V10_FINAL
**Bundle:** 755,681 bytes | 146 modules | ESM bun target
**Tests:** 11/11 pass
**Plugin Type:** OpenCode Plugin (drop-in)
**Previous:** v11 was FIREWALL-ONLY (40 source files) — catastrophic code strip discovered during audit

---

## Package Contents

| Path | Description |
|------|-------------|
| `dist/kraken-firewall.js` | Production bundle (756KB — full architecture) |
| `src/brains/` | ALL 3 brains: PlanningBrain, ExecutionBrain, SystemBrain, SubagentManagerBrain, BrainConcurrencyManager |
| `src/clusters/` | Cluster infrastructure: ClusterManager, ClusterInstance, opencode_agent.py |
| `src/factory/` | Delegation engine: AsyncDelegationEngine, ClusterScheduler, AgentFactory, +7 more |
| `src/shared/` | State coordination: StateStore, EvidenceCollector, BrainMessenger, domain-ownership |
| `src/tools/` | Agent tools: cluster-tools (4 tools), kraken-hive-tools (4 tools), monitoring-tools (5 tools), shark-t2-tools |
| `src/kraken-hive/` | Persistent Hive Mind: KrakenHiveEngine, KrakenHiveSeeder |
| `src/v4.1/` | Boilerplate framework: safeHook, session-state, agent-awareness, +8 more |
| `src/identity/` | File-based identity: loader, injector, types |
| `src/system-brain/firewall/` | Firewall engine (16 layers + bundle-integrity checker) |
| `src/brains/system/firewall/` | Brain enforcement pipeline |
| `identity/orchestrator/` | 5 KRAKEN identity files (566 lines) |
| `reports/` | 8 reports: BUILD_LOG, DEBUG_LOG, CONTAINER_TEST, COMPACTION_SURVIVAL, DEEP_PRESSURE_TEST, FIREWALL_AUDIT, MANTA_BUILD_COMPLETE, TRIDENT review |
| `docs/` | 4 docs: DEPLOY, BUILD, PLUGIN_SHIP_COMMON_SENSE, DUAL_PLUGIN_ARCHITECTURE |
| `deploy.sh` | Self-contained deploy script |
| `SHIP_MANIFEST.md` | This file |

## v12 Recovery Changes

| Change | Why |
|--------|-----|
| **All 57 missing source files restored** | v11 was firewall-only — entire orchestration architecture was stripped |
| **Bundle integrity checker** (`bundle-integrity.ts`) | Algorithmically verifies ALL core subsystems present in bundle — prevents recurrence |
| **L6 ARCHITECTURE zone** | Blocks deletion of ANY Kraken source directory (src/brains/, src/clusters/, etc.) |
| **9 architecture deletion patterns added to L6** | Catches rm, find -delete, rsync --delete, git rm, truncate, cp /dev/null overwrite |
| **Source count pre-build verification** | 10 subsystems × minimum file count check before `bun build` |
| **Export verification post-build** | 22+ core exports checked in bundle output after build |

## Container Verification (2026-05-30)

| Test | Result |
|------|--------|
| Identity injection (who are you) | ✅ "Kraken · Gemini 3.1 Flash Lite" — multi-brain architecture described |
| Tool registration (get_cluster_status) | ✅ `⚙ get_cluster_status` — returned 3 clusters (Alpha, Beta, Gamma) |
| Hive tools (kraken_hive_search) | ✅ `⚙ kraken_hive_search` — returned real patterns from disk |
| L6 SYSTEM zone (write to /root/.config/opencode/) | ✅ BLOCKED — file not created |
| L6 ARCHITECTURE zone (rm -rf src/brains/) | ✅ BLOCKED — file still exists after deletion attempt |
| Unit tests (11/11) | ✅ All pass |

---

## Firewall Architecture

| Layer | Name | Arms/Patterns | Key Feature |
|-------|------|--------------|-------------|
| L0 | Identity Wall | Agent allowlist | Hive gate, Kraken-only |
| L1 | Theatrical | 14 patterns | Pipe-to-wc detection |
| L2 | Hive Poison | 3 patterns | Corruption detection |
| L3 | Delegation Abuse | 2 patterns | Spawn authorization |
| L4 | Context Theft | 3 patterns | Hive access audit |
| L5-1 | Assumptions | 3 patterns | Evidence-gated |
| L5-2 | Skip Verification | 3 patterns | Evidence-gated |
| L5-3 | Output Fabrication | 3 patterns | Evidence-gated |
| L5-4 | Retard Logic | 40+ patterns | Self-contradiction, circular |
| L5-5 | Scope Creep | 3 patterns | Expansion detection |
| L6-AR | Anti-Retard | 14 arms, 220+ patterns | Multi-signal fusion, strikes |
| L6-KP | Kraken Protection | 8 patterns | Zone-based access control |
| L7 | Coordination Gates | 13 criteria | Real fs validation |
| L8 | Anti-Bullshit | 80+ patterns | Environment-blaming, honesty |
| L9 | Feature Omission | 45+ patterns | Blueprint skipping |
| L10 | Container Enforcement | 45+ patterns | No ship without container |

---

## Production Verification

| Component | Verdict | Evidence |
|-----------|---------|----------|
| Identity injection | ✅ Bulletproof | 3 models: MiMo, Gemini, DeepSeek |
| L6 rm -rf protection | ✅ Bulletproof | Dual-layer (identity + hook) |
| chat.message firewall | ✅ Bulletproof | 7/7 session-191e patterns |
| 14-arm multi-signal fusion | ✅ Verified | Direct function tests |
| L6 write state zone | ✅ Verified | Container audit log |
| Unit tests | ✅ 11/11 | All layers exercised |
| Smart error detector | ✅ Wired | 8 failure categories |
| Context bridge | ✅ Operational | Category-to-hive mapping |
| Trident Enhanced Manta build | ✅ Verified | 109 modules, 617KB, 49ms |

---

## Known Gaps (Honest)

| Gap | Severity | Mitigation |
|-----|----------|------------|
| Write tool description stripped in v1.14.48 | Medium | Identity + chat.message + L10 content checks |
| Subagent wrappers not in container | Medium | Fix in v12 |
| L2 false positive risk on "complete" | Low | Conservatively tuned, monitor |

---

## Ship Gate Checklist

- [x] Bundle builds clean (146 modules, 0 errors)
- [x] Unit tests pass (11/11)
- [x] Identity verified in container (3 models)
- [x] L6 destructive test passes
- [x] Container deep build verified (Trident Enhanced Manta)
- [x] Anti-retard patterns verified (14 arms, 7/7 session-191e)
- [x] Strike escalation verified
- [x] Smart error detector wired
- [x] Chat message blocking verified
- [x] Deploy script functional
- [x] All reports included
- [x] No diagnostic code in production bundle
- [ ] Subagent orchestration test (next version)

## v11.1 — Post-Audit Fixes (2026-05-29)
- **safeHook silent blocking FIXED** — [FIREWALL_BLOCKED] errors now propagate, preventing tool execution
- **CURRENT_AGENT ReferenceError FIXED** — replaced with '' in system.transform
- **Identity loader path FIXED** — added kraken-firewall/identity and /opt/opencode/identity search paths
- **l6-kraken-protection deduplication** — brains version now re-exports from system-brain source of truth
