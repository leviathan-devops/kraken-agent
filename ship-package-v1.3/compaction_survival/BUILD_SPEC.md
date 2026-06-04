# Kraken V1.3 — BUILD SPEC (New Baseline)

**Date:** 2026-06-03
**Status:** Auditor's rebuild adopted as baseline. 10 remaining issues to fix.
**Authority:** This document replaces the old BUILD_SPEC.md (which described fixing 44 defects in the broken v1.3).

---

## SECTION 1: Architecture Overview

### What Kraken Is
Kraken is a multi-brain orchestrator with RGE + SRE = Execution Brain (100% algorithmic enforcement), consolidated firewall (L0-L10, no split directories), 3 clusters (alpha/beta/gamma), and 9 specialized agents.

**Architecture:** RGE + SRE = Execution Brain
- RGE: 7-layer semantic analysis via TypeScript Compiler API
- SRE: P1-P11 principle checks via AST analysis
- Combined: Zero subjective gates, mechanical evidence transitions

### Source Layout (37 files, 6,289 lines)
```
src/
├── index.ts                    927 lines  — Main plugin entry
├── types.ts                    454 lines  — All type definitions
├── clusters/index.ts           152 lines  — Cluster manager
├── execution-brain/
│   ├── index.ts                237 lines  — RGE+SRE orchestrator
│   ├── rge/                    9 files    — Runtime Grade Engine
│   └── sre/                    6 files    — Slop Removal Engine
├── system-brain/firewall/
│   ├── index.ts                167 lines  — Consolidated orchestrator
│   ├── types.ts                89 lines   — Firewall types
│   ├── audit.ts                108 lines  — JSONL audit logger
│   ├── evidence-gate.ts        131 lines  — Mechanical verification
│   ├── intent-classifier.ts    171 lines  — Intent classification
│   ├── semantic-anti-theater.ts 340 lines — Stake analysis
│   ├── semantic-anti-bullshit.ts 296 lines — Claim validation
│   └── layers/                 7 files    — L0-L10 enforcement
└── shared/
    ├── state-store.ts          141 lines  — State management
    ├── brain-messenger.ts      86 lines   — Inter-brain messaging
    ├── evidence-collector.ts   76 lines   — Evidence persistence
    └── logger.ts               40 lines   — Structured logging
```

### Firewall Layers (Consolidated — No Split)
| Layer | Name | Type | Enforcement |
|-------|------|------|-------------|
| L0 | Identity Wall | Identity | Non-kraken agent access control |
| L1 | Theatrical Detection | Regex | `{success:true}` without side effects |
| L6 | Anti-Retard Engine | 14 categories | Excuses, gaslighting, completion theater |
| L7 | Coordination Gates | State | Gate violations, spawn without description |
| L8 | Anti-Bullshit | Filesystem | Blame shifting, ship claims without evidence |
| L9 | Feature Omission | Structural | "All features complete" without spec |
| L10 | Container Enforcement | Filesystem | Evidence path fabrication |

### Agent Identity Tiers
| Tier | Agents | Injected |
|------|--------|----------|
| **Orchestrator** | kraken, kraken-executor | Full orchestrator identity + gate context |
| **Cluster agents** | shark-*, manta-* (9) | Task context only — own identity preserved |
| **Non-Kraken** | All others | Nothing — skip entirely |

---

## SECTION 2: What the Auditor Built Correctly

### Correct: RGE Implementation (7 layers)
- L0: Regex pre-filter — acceptable ONLY here
- L1: Type contract enforcement via `checker.getSignatureFromDeclaration()`
- L2: Control flow analysis — resource leak, torn state, floating promise detection
- L3: Symbol resolution via `checker.getSymbolAtLocation()` — import verification
- L4: Side-effect truth — P11 theatrical return detection via AST
- L5: Pattern database — known anti-pattern detection
- L6: Compliance verdict — zero CRITICAL = pass

### Correct: SRE Implementation (P1-P11)
- P1: Defensive import — full import resolution + export extraction via AST
- P2: Type certainty — validation marker tracking within function scope
- P3: Error completeness — 3-level catch analysis (empty/comment-only/non-meaningful)
- P4-P11: Additional principle checkers — all AST-based

### Correct: Consolidated Firewall
- Single directory: `src/system-brain/firewall/`
- `src/brains/` is EMPTY — no duplicate implementations
- L6 has 14 categories with strike+severity system
- L10 verifies filesystem claims mechanically

### Correct: Engineering Discipline
- Zero FIXMEs, zero empty catches, zero hardcoded paths
- P2-compliant type guards at every boundary
- P3-compliant error handling in every catch block
- P7-compliant path resolution (all use os.homedir())
- Clean singleton pattern (one per abstraction)
- Clean types (zero `any`, discriminated unions)

---

## SECTION 3: Remaining Issues (Phase 0 — Must Fix)

| # | Issue | Severity | File(s) | Fix |
|---|-------|----------|---------|-----|
| R1 | Non-null assertions (7x) | CRITICAL | index.ts | Guard with getClusterManager() |
| R2 | Double cast AuditEntry | HIGH | audit.ts | Add schema validation before cast |
| R3 | Double cast Record | HIGH | audit.ts | Use typed keyof iteration |
| R4 | Unchecked JSON cast | HIGH | semantic-anti-bullshit.ts | Add object validation before cast |
| R5 | Sync readdirSync | MEDIUM | execution-brain/index.ts | Convert to fs.promises |
| R6 | Sync existsSync+readFileSync | MEDIUM | index.ts | Use fs.promises |
| R7 | Sync I/O in evidence | MEDIUM | evidence-collector.ts | Convert to fs.promises |
| R8 | Sync appendFileSync | MEDIUM | audit.ts | Use fs.promises with .catch() |
| R9 | Firewall fail-open | MEDIUM | firewall/index.ts | Block on layer error |
| R10 | Unchecked JSON cast | MEDIUM | evidence-gate.ts | Add object validation |

**Total fix time:** ~1.5 hours  
**Fixes required before container test:** All 10

---

## SECTION 4: Implementation Plan

### Phase 0: Fix Remaining Issues
1. Apply all 10 fixes (R1-R10) following FIX_PLAN.md
2. Rebuild with `bun build`
3. Verify zero regression: grep for `!`, `as unknown as`, `Sync`, `continue` in layer error paths

### Phase 1: Container Test
1. Spawn container with matching image (opencode-test:1.14.43)
2. Deploy bundle + identity files + context files
3. Run Phases A-F per CONTAINER_TEST_PROTOCOL.md
4. Collect evidence files

### Phase 2: Ship Package
1. Verify ContainerTestResult.json passRate >= 0.90
2. Generate MANIFEST.md
3. Package with all evidence files
4. Push to GitHub

---

## SECTION 5: Non-Negotiable Standards

1. **Zero FIXMEs in production code.** Every placeholder is a time bomb.
2. **Zero empty catch blocks.** Every catch must log with context.
3. **Zero unchecked casts.** Every `as` must have a preceding runtime check.
4. **Zero hardcoded paths.** All user paths via `os.homedir()` + `path.join()`.
5. **Zero floating promises.** Every promise awaited or caught.
6. **Zero sync I/O in hot paths.** Use `fs.promises` API.
7. **Default-deny on error.** When uncertain, block. Never allow.
8. **Mechanical evidence for gates.** Files on disk with verifiable content.
9. **One concept = one implementation.** No split directories, no duplicates.
10. **Run before claiming.** "Runtime grade" requires a passing container test.

---

## SECTION 6: File Inventory

| File in compaction_survival/ | Purpose |
|------------------------------|---------|
| `COMPACTION_SURVIVAL.md` | Core identity + architecture |
| `BUG_LIST.md` | 10 remaining issues to fix |
| `FIX_PLAN.md` | Precise fix implementations |
| `BUILD_SPEC.md` | This file |
| `BUILD_STATE.md` | Current phase tracking |
| `CHANGELOG.md` | Build history |
| `CONTAINER_TEST_PROTOCOL.md` | Container test procedure |
| `DEBUG_LOG.md` | Root cause analysis |
| `DECISION_CHAIN.md` | Key architecture decisions |
| `EVIDENCE_STATE.md` | Evidence tracking |
| `POST-COMPACTION_PROMPT.md` | Recovery instructions |
| `SoC_PRESERVATION.md` | Patterns and lessons |
| `TASK_QUEUE.md` | Implementation backlog |

---

## SECTION 7: Deploy Config

```json
{
  "model": "deepseek/deepseek-v4-flash",
  "plugin": ["file:///root/.config/opencode/plugins/kraken-agent/dist/index.js"],
  "agent": {
    "kraken": { "name": "kraken", "mode": "primary" },
    "kraken-executor": { "name": "kraken-executor", "mode": "subagent" },
    "shark-alpha-1": { "name": "shark-alpha-1", "mode": "subagent" },
    "manta-alpha-1": { "name": "manta-alpha-1", "mode": "subagent" },
    "shark-beta-1": { "name": "shark-beta-1", "mode": "subagent" },
    "manta-beta-1": { "name": "manta-beta-1", "mode": "subagent" },
    "manta-beta-2": { "name": "manta-beta-2", "mode": "subagent" },
    "manta-gamma-1": { "name": "manta-gamma-1", "mode": "subagent" },
    "manta-gamma-2": { "name": "manta-gamma-2", "mode": "subagent" },
    "shark-gamma-1": { "name": "shark-gamma-1", "mode": "subagent" }
  }
}
```

- Single plugin: kraken-agent only
- Container image: opencode-test:1.14.43
- Bundle: bun build (NOT tsc)
