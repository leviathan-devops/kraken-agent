# Remaining Issues: Auditor's Rebuild → True Runtime Grade

**Baseline:** Auditor's rebuild at `/home/leviathan/Downloads/kraken-v1.3/`
**Status:** All 13 fixes applied and verified in container. R1-R10 (code quality) + R11-R13 (runtime defects).
**Standard:** P2 (runtime checks), P4 (no sync I/O), P7 (os.homedir()), P11 (no theatrical code), Bible §19 (ALLOWLIST).

---

## Phase 0: Code Quality Fixes (R1-R10) — ALL FIXED

| # | Issue | File | Severity | Status |
|---|-------|------|----------|--------|
| R1 | Non-null assertions (7x) | index.ts | CRITICAL | ✅ FIXED — getClusterManager() guard |
| R2 | Double cast AuditEntry | audit.ts | HIGH | ✅ FIXED — isObjectWithKeys validates before cast |
| R3 | Double cast Record | audit.ts | HIGH | ✅ FIXED — keyof AuditEntry iteration |
| R4 | Unchecked JSON cast | semantic-anti-bullshit.ts | HIGH | ✅ FIXED — typeof/raw validation |
| R5 | Sync readdirSync | execution-brain/index.ts | MEDIUM | ✅ FIXED — async fs.promises.readdir |
| R6 | Sync existsSync/readFileSync | index.ts | MEDIUM | ✅ FIXED — fs.promises.readFile with ENOENT |
| R7 | Sync I/O in evidence | evidence-collector.ts | MEDIUM | ✅ FIXED — async persist() |
| R8 | Sync appendFileSync | audit.ts | MEDIUM | ✅ FIXED — fs.promises.appendFile with .catch() |
| R9 | Firewall fail-open | firewall/index.ts | MEDIUM | ✅ FIXED — blocked result on layer error |
| R10 | Unchecked JSON cast | evidence-gate.ts | MEDIUM | ✅ FIXED — typeof/raw validation |

---

## Phase 2: Runtime Defect Fixes (R11-R13) — ALL FIXED

Found during honest re-audit (Build 4). These were NOT code quality issues — they were runtime-grade defects discovered by running the Bible's actual test protocols.

| # | Issue | File | Severity | Discovery | Status |
|---|-------|------|----------|-----------|--------|
| R11 | **No ALLOWLIST in tool.execute.before** — 34/36 non-whitelisted tools leaked through | index.ts | CRITICAL (Spider F1) | Bible §19 TC-4.6 verbatim | ✅ FIXED — explicit Set of 8 tools, throws FIREWALL_BLOCKED |
| R12 | **Tasks not in cluster status** — getAllClusters() had no tasks field | clusters/index.ts | HIGH (Spider F2) | Bible P11 verification | ✅ FIXED — tasks included in cluster response |
| R13 | **Hyphen/underscore bypass** — no prefix-agnostic blocking | (Automatic) | HIGH (Spider F1) | Bible §23 dual-variant test | ✅ FIXED — ALLOWLIST blocks everything regardless of prefix |

### R11 Detail: ALLOWLIST Enforcement

**Root cause:** The `tool.execute.before` hook ran firewall layers (L0-L10) which check identity, theatrical patterns, protected paths, etc. But NONE of these layers checked "is this tool one of the 8 tools I registered?" The hook only blocked `kraken_*` prefixed tools for non-Kraken agents. Everything else — `bash`, `write`, `edit`, `manta-status`, `shark-gate` — passed through unchallenged.

**Fix:** Added an explicit `ALLOWED_TOOLS` Set at the top of `tool.execute.before`. First thing the hook does: check if the tool is in the set. If not, throw `FIREWALL_BLOCKED` immediately. No prefix matching, no blacklist, no pattern matching — just a Set lookup.

**Bible reference:** §19 TC-4.6 — "THE MOST IMPORTANT and was THE MOST MISSING in Hydra + Spider builds"

### R12 Detail: Real Task State

**Root cause:** `ClusterState` type had no `tasks` field. `getAllClusters()` returned cluster metadata (status, agent count, task counts) but not the actual tasks. Tasks existed in `this.tasks` Map but were invisible in the API response. This made `spawn_cluster_task` appear theatrical — it returned `{success:true, taskId}` but the task was unqueryable.

**Fix:** `getAllClusters()` now iterates `this.tasks` Map and attaches matching tasks to each cluster object.

**Bible reference:** §4 P11 — "Output IS The Work — if a function claims work was done, the work MUST have been done"

### R13 Detail: Hyphen/Underscore

**Root cause:** No fix was needed. The ALLOWLIST from R11 automatically handles this because it doesn't do prefix matching at all. `manta-status` is not in the 8-tool set → blocked. `manta_status` is not in the 8-tool set → blocked.

**Bible reference:** §23 — "Both underscore AND hyphen prefixes blocked"

---

## Summary

| Phase | Issues | Severity Range | All Fixed |
|-------|--------|---------------|-----------|
| Phase 0 (R1-R10) | 10 code quality issues | CRITICAL→MEDIUM | ✅ ALL DONE |
| Phase 2 (R11-R13) | 3 runtime defects | CRITICAL→HIGH | ✅ ALL DONE |
| **Total** | **13 fixes** | | **✅ ALL VERIFIED IN CONTAINER** |
