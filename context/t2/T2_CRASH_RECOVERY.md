# T2_CRASH_RECOVERY — Session Continuation Protocol

## Golden Rule

**Every session start = Read COMPACTION_SURVIVAL.md FIRST. Always.**

```bash
cat "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Projects/v1.2 Rebuild/Compaction Survival/COMPACTION_SURVIVAL.md"
```

## The Prime Directive

> **IF IT'S NOT REAL, IT'S NOT DONE.**
> File on disk = real. Claim in chat = fiction.
> Bundle built and deployed = real. "The code is there" = fiction.

## Session Recovery Protocol

### Step 1: Identify Build Phase
```
Read CHECKPOINTS/*/BUILD_STATE.txt → find highest checkpoint number → determine phase: PLAN|BUILD|TEST|VERIFY|SHIP
```

### Step 2: Verify What's Real
```bash
# Check bundle exists
ls -la ~/.config/opencode/plugins/kraken-agent/dist/index.js
# Check source matches bundle
ls -la "Shared Workspace Context/Kraken Agent/Active Projects/v1.2 Rebuild/dist/index.js"
# Check OpenCode version
opencode --version
```

### Step 3: Rebuild if Needed
```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Projects/v1.2 Rebuild"
bun run build
cp dist/index.js ~/.config/opencode/plugins/kraken-agent/dist/index.js
```

### Step 4: Resume from Last Checkpoint
- Read `CHECKPOINTS/*/BUILD_STATE.txt` for last completed task
- Read `artifacts/BUILD_LOG.md` for action history
- Read `artifacts/DEBUG_LOG.md` for unsolved issues
- Skip already-completed steps

## Checkpoint Hygiene

### When to checkpoint (after EVERY milestone):
- Source changes committed
- Bundle built successfully
- TUI test passed
- Gate advanced
- Bug fixed and verified

### What to save per checkpoint:
```
CHECKPOINTS/{timestamp}-{milestone}/
├── BUILD_STATE.txt    ← Phase, last completed task, next task
├── source-snapshot/   ← Copy of src/ at this point
└── bundle/            ← dist/index.js built at this point
```

### Checkpoint command:
```bash
mkdir -p "CHECKPOINTS/$(date +%Y%m%d_%H%M%S)-{milestone}"
cp BUILD_STATE.txt "CHECKPOINTS/$(date +%Y%m%d_%H%M%S)-{milestone}/"
cp -r src/ "CHECKPOINTS/$(date +%Y%m%d_%H%M%S)-{milestone}/source-snapshot/"
cp dist/index.js "CHECKPOINTS/$(date +%Y%m%d_%H%M%S)-{milestone}/bundle/"
```

## Key File Locations

| Purpose | Path |
|---|---|
| Compaction survival | `.../v1.2 Rebuild/Compaction Survival/COMPACTION_SURVIVAL.md` |
| Build logs | `.../v1.2 Rebuild/artifacts/BUILD_LOG.md` |
| Debug logs | `.../v1.2 Rebuild/artifacts/DEBUG_LOG.md` |
| Checkpoints | `.../v1.2 Rebuild/CHECKPOINTS/` |
| Deployed plugin | `~/.config/opencode/plugins/kraken-agent/dist/index.js` |
| Source | `.../v1.2 Rebuild/src/` |
