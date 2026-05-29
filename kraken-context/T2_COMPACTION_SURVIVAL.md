# T2_COMPACTION_SURVIVAL — Context Persistence Protocol

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
