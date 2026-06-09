# T2_COMPACTION_SURVIVAL — Context Persistence Protocol
## V1.3 Runtime Grade Verified — 2026-06-01 — 100% Adversarial Pass

## 3-Tier Token Budget

| Tier | Threshold | Action |
|---|---|---|
| **65%** (~110K tokens) | WARNING | Begin pre-compaction export. Save current state. Stop starting new parallel tasks. |
| **75%** (~127K tokens) | CRITICAL | Halt all new work. Complete in-flight writes. Export ALL state to disk. Create HANDOVER_PACKAGE. |
| **85%** (~144K tokens) | IMMINENT | Compaction will trigger any moment. Final flush. Write BUILD_STATE.txt. |

## Pre-Compaction Export Protocol

When token budget hits 65%, IMMEDIATELY:

```bash
# 1. Export current BUILD_STATE
cat > "Compaction Survival/HANDOVER_PACKAGES/$(date +%Y%m%d_%H%M%S)_precompact.md" << 'STATE'
## BUILD STATE
Phase: {PLAN|BUILD|TEST|VERIFY|SHIP}
Last completed: {task description}
In-flight: {task description}
Next: {task description}
Unsolved errors: {list}
STATE

# 2. Save brain state to evidence
mkdir -p ~/.local/share/opencode/kraken-hive/evidence/$(date +%Y%m%d_%H%M%S)/
# Copy all current gate states, evidence files, checkpoint data

# 3. Write compaction survival marker
echo "COMPACTION_READY $(date -u +%Y-%m-%dT%H:%M:%SZ)" > "Compaction Survival/.compaction-marker"
```

## Post-Compaction Recovery Steps

After session restarts (compaction truncated context):

```bash
# 1. Read the survival doc (ALWAYS FIRST)
cat "Compaction Survival/COMPACTION_SURVIVAL.md"

# 2. Find most recent handover
ls -t "Compaction Survival/HANDOVER_PACKAGES/" | head -1

# 3. Check what's real on disk
ls -la ~/.config/opencode/plugins/kraken-agent/dist/index.js
ls -la "dist/index.js"

# 4. Verify build state
cat "Compaction Survival/CHECKPOINTS/"*/BUILD_STATE.txt

# 5. Rebuild if mismatch detected
bun run build && cp dist/index.js ~/.config/opencode/plugins/kraken-agent/dist/index.js

# 6. Resume from last completed checkpoint
```

## Checkpoint Hygiene

### Save after EVERY milestone:
- Source file changes committed/written
- Bundle built successfully
- TUI test passed
- Gate advanced
- Bug fixed and verified in TUI

### What to save:
```
CHECKPOINTS/{YYYYMMDD_HHMMSS}-{milestone-name}/
├── BUILD_STATE.txt      ← Phase, last done, next, errors
├── source-snapshot/     ← Full src/ copy
├── bundle/              ← dist/index.js
```

### Checkpoint command:
```bash
CKPT="CHECKPOINTS/$(date +%Y%m%d_%H%M%S)-{name}"
mkdir -p "$CKPT"/{source-snapshot,bundle}
cp -r src/* "$CKPT/source-snapshot/"
cp dist/index.js "$CKPT/bundle/"
# Write BUILD_STATE.txt with current phase and status
```

## Evidence Persistence

```bash
# All evidence survives in:
~/.local/share/opencode/kraken-hive/evidence/
  ├── gate-progress.json       ← Current gate chain state
  ├── evidence-{gate}.json     ← Per-gate collected evidence
  ├── task-outputs/            ← Retrieved task outputs
  └── fire-and-forget-log.json ← L1/L2 violations detected
```

## Survival Filesystem Layout

```
v1.2 Rebuild/
├── Compaction Survival/
│   ├── COMPACTION_SURVIVAL.md       ← THIS FILE (read first)
│   ├── HANDOVER_PACKAGES/           ← Pre-compact exports
│   └── .compaction-marker           ← Write before compaction imminent
├── CHECKPOINTS/
│   └── {timestamp}-{milestone}/
│       ├── BUILD_STATE.txt
│       ├── source-snapshot/
│       └── bundle/
├── artifacts/
│   ├── BUILD_LOG.md                 ← APPEND ONLY action log
│   ├── CHANGE_LOG.md                ← What changed
│   └── DEBUG_LOG.md                 ← Errors and fixes
├── dist/index.js                    ← Built bundle
└── src/                             ← TypeScript source
```

## Ship Package: KRAKEN_V1.3_RUNTIME_GRADE_VERIFIED_20260601

**Status:** 14/14 adversarial = 100% PASS. 21/21 tools real. Runtime Grade Engineering Bible §16.3 verified.

### Final Test Results

| Phase | Result | Details |
|-------|--------|---------|
| Phase 1: Module Load | PASS | 140 modules, 21 tools, 11 agents via config hook |
| Phase 2: Identity | PASS | chat.message injects for kraken. system.transform injects 2 entries. All cross-agent (shark/general/build/plan) clean. |
| Phase 4: Firewall | PASS | read/grep/glob allowed. Cross-agent passthrough (shark can edit/write/bash). |
| Phase 5: Theatrical | PASS | 21/21 tools return real strings >10 chars. ZERO stubs. |
| **TOTAL** | **14/14 = 100%** | **All Runtime Grade §16 gates satisfied.** |

### Critical Fixes Applied

1. **L7 require() eliminated** — 7 `require()` calls across `brains/system/firewall/index.ts` and `l7-coordination-gates.ts` replaced with static `import`. Previously caused `Cannot require module` in bundled ESM.
2. **sys.transform inputAgent priority** — `input.agent` now checked FIRST, preventing cross-session contamination when multiple agents were tested sequentially on the same 'unknown' session.
3. **5 tool null-safety fixes** — `anchor_cluster`, `spawn_shark_agent`, `spawn_manta_agent`, `aggregate_results`, `browser_open` all return descriptive JSON errors instead of crashing on missing args.

### Post-Compaction Recovery

If you wake up after compaction and need to continue:
1. Read **this doc** (you're doing it)
2. Ship package is at `Ship Packages/KRAKEN_V1.3_RUNTIME_GRADE_VERIFIED_20260601/`
3. Container recipe is in MANIFEST.md (one-line deploy)
4. Evidence files are in `test-evidence/`
5. Run `test-adversarial.sh <container>` to re-verify

### Container Recipe

```
Image:     opencode-test:1.14.34
Binary:    /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64-baseline/bin/opencode
Model:     xiaomi-token-plan-sgp/mimo-v2.5-pro
API:       https://token-plan-sgp.xiaomimimo.com/v1
Key:       tp-ssy5nlzfc5vccack4ccierszbs0fojjp0lp3uj37hlp328ci
Build:     bun build src/index.ts --outfile dist/kraken-agent.js --target bun --format esm --bundle --external @opencode-ai/plugin
Network:   --network host (for OpenViking at localhost:1933)
```

### P2 Violation Catalog (documented for next iteration)

| Pattern | Example | Fix |
|---------|---------|------|
| require() in ESM | `require('../../shared/state-store.js')` | Replace with static `import` at module top |
| Unguarded args access | `args.task.toLowerCase()` | `(args.task \|\| '').toLowerCase()` |
| Missing input fallback | `output.message` only | Check `input.message.content` too |
| Missing agent fallback | `sessionState.lastAgent` only | Chain: `inputAgent \|\| lastAgent \|\| mapAgent` |
| Session state bleed | `agentFilter` on 'unknown' session | Always check `input.agent` explicitly
