# Kraken v1.2 Firewall — Ship Package v10

## Overview
Dual-layer firewall system for OpenCode plugins. Enforces L0-L7 + AR security rules at both system prompt level (model self-policing) and hook/tool level (execution blocking).

## Architecture
```
┌─────────────────────────────────────────────────┐
│ Layer 1: System Prompt                          │
│ experimental.chat.system.transform hook         │
│ - Identity injection                            │
│ - L0-L7 + AR rules in model's system prompt     │
│ - Model self-polices                            │
├─────────────────────────────────────────────────┤
│ Layer 2: Hook/Tool                              │
│ tool.execute.before + chat.message hooks        │
│ - L0-L7 firewall enforced at tool level         │
│ - Blocks execution (prevents tool calls)        │
│ - Agent tracking via session state              │
└─────────────────────────────────────────────────┘
```

## Quick Start
```bash
# 1. Copy bundle to plugins dir
cp dist/kraken-firewall.js ~/.config/opencode/plugins/kraken-firewall/dist/index.js

# 2. Add to opencode.json
# "plugin": ["file:///root/.config/opencode/plugins/kraken-firewall/dist/index.js"]

# 3. Restart OpenCode TUI
```

## Files
- `dist/kraken-firewall.js` — Built plugin bundle (673KB)
- `src/` — Full TypeScript source (84 files)
- `checkpoints/` — Phase 1 (system prompt), Phase 2 (hook/tool), Phase 3 (merged)
- `reports/` — Trident code review + compaction survival
- `tests/` — Unit tests (11 tests, 10 pass)
- `docs/` — Deploy, build, and architecture docs

## Verified
- ✅ L6 blocks rm-rf opencode config
- ✅ L6 blocks write to kraken-hive
- ✅ L0 blocks non-kraken Hive access
- ✅ L2 blocks false completion
- ✅ L4 blocks wrong-cluster tasks
- ✅ Multi-plugin compatible (tested with shark-agent)
- ✅ Vanilla agents unaffected (Plan, Build tested)
- ✅ Config survives rm-rf attempts
