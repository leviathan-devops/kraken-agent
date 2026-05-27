# Kraken v1.2 Firewall Ship Package
## Phase 3: Merged Dual-Layer Firewalls

### Architecture
```
┌─────────────────────────────────────────────────┐
│ Layer 1: System Prompt (experimental.chat.      │
│           system.transform)                     │
│ - Identity injection                            │
│ - L0-L7 + AR rules in model's system prompt     │
│ - Model self-polices                            │
├─────────────────────────────────────────────────┤
│ Layer 2: Hook/Tool (tool.execute.before +       │
│           chat.message)                         │
│ - tool.execute.before: L0-L7 firewall enforced  │
│ - chat.message: agent tracking + brain wiring   │
│ - Blocks at tool level (prevents execution)     │
└─────────────────────────────────────────────────┘
```

### Verified
- [x] Layer 1: System prompt rules injected and model knows them
- [x] Layer 1: Model self-polices L6 (refuses rm -rf)
- [x] Layer 2: L6 blocks rm -rf at tool level (config survived)
- [x] Layer 2: L6 blocks write to hive at tool level
- [x] Layer 2: L0 blocks non-kraken Hive access
- [x] Layer 2: L2 blocks false completion claims
- [x] Layer 2: L4 blocks wrong-cluster task assignment
- [x] Agent name resolution via session state
- [x] Error propagation ([FIREWALL_BLOCKED] re-throw)
- [x] Bundle builds (0.67MB, 144 modules)
- [x] Container TUI: MiniMax-M2.7 model working
- [x] Container TUI: All hooks fire (chat.message, tool.execute.before, system.transform)

### Files
- src/: Full TypeScript source
- dist/index.js: Built bundle
- checkpoints/phase1/: System prompt firewall phase
- checkpoints/phase2/: Hook/tool firewall phase
