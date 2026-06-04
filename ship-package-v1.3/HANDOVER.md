# Kraken v1.3 — HANDOVER CONTEXT

**Generated:** 2026-06-04
**Status:** ✅ SHIP READY — All gates pass, evidence on disk

---

## Project Location

- **Source:** `/home/leviathan/Downloads/kraken-v1.3/` (37 TS files, 6,289 LOC)
- **Ship Package:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Projects/Kraken Agent v1.3/ship-package-v1.3/`
- **Compaction Survival:** `.../Kraken Agent v1.3/compaction_survival/` (13 files)
- **Bundle:** `.../Kraken Agent v1.3/ship-package-v1.3/kraken-agent-v1.3-bundle.js` (8,947,340 bytes)

## Build Summary

| Gate | Status | Key Evidence |
|------|--------|--------------|
| PLAN | ✅ | Compaction survival docs |
| BUILD | ✅ | 16 fixes (R1-R16), bundle 8.95MB |
| TEST | ✅ | 31/31 (100.0%) — ContainerTestResult.json |
| VERIFY | ✅ | RGE+SRE proven on real projects |
| AUDIT | ✅ | Zero code quality issues |
| DELIVERY | ✅ | This ship package |

## Critical Fixes Applied

| R# | Fix | Why It Matters |
|----|-----|----------------|
| R11 | ALLOWLIST enforcement | Prevents Spider F1 — tool leakage |
| R12 | Real cluster state | Prevents Spider F2 — theatrical spawning |
| R14 | L10 async (existsSync → fs.promises) | P4 async discipline in firewall hot path |
| R16 | Identity REPLACE approach | Uses IDENTITY_ARCHITECTURE_BIBLE_AGNOSTIC §5 pattern |
| R17-R22 | T3 Runtime-Grade audit fixes | P2 type guards, P3 circuit breaker, P4 TTL cleanup, P5 atomic state |

## Key Derailments Avoided (for next agent)

1. **D1:** Don't fight the runtime — `chat.message` is NOT for identity. System.transform IS.
2. **D2:** Don't replace `output.system` array or use `unshift` alone. Use in-place REPLACE of runtime defaults.
3. **D3:** Event hook (`Hooks['event']`) doesn't work in 1.14.43 — events never carry agent/sessionId.
4. **D4:** Config callback `instructions` field is ignored — runtime appends its own defaults after.
5. **D5:** Don't declare success with broken features. Run Tier 4 TUI test before declaring identity working.
6. **D6:** The REPLACE approach from IDENTITY_ARCHITECTURE_BIBLE_AGNOSTIC.md §5 is THE correct identity mechanism.

## Remaining Work

- [ ] DELIVERY gate complete (this ship package accomplishes it)
- [ ] GitHub push (if desired)

## Container State

- **Container:** kraken-v13-test (e1fc33bd0320)
- **Image:** opencode-test:1.14.43
- **Status:** RUNNING (3+ hours verified)
- **Test file:** `/tmp/final-test.mjs` inside container
- **Evidence:** `/root/.config/opencode/evidence/` inside container
