# Build — Kraken v1.2 Firewall v11

## Build Command
```bash
bun build src/index.ts --outdir dist --target bun --format esm --bundle --external @opencode-ai/plugin
```

## Build Stats
| Metric | Value |
|--------|-------|
| Modules | 146 |
| Size | 752,786 bytes (0.75 MB) |
| Format | ESM |
| Target | bun |
| External | @opencode-ai/plugin |
| Errors | 0 |

## Source Structure
```
src/
├── index.ts                     # Plugin entry (agents, hooks, identity)
├── brains/
│   ├── system/
│   │   ├── system-brain.ts     # System brain with smart error detector
│   │   └── firewall/
│   │       ├── index.ts        # enforceFirewall pipeline
│   │       ├── l0-identity.ts  # Identity wall
│   │       ├── l1-orchestration-theater.ts
│   │       ├── l2-false-completion.ts
│   │       ├── l3-output-inspection.ts
│   │       ├── l4-wrong-cluster.ts
│   │       ├── l5-macro-derailment.ts
│   │       ├── l6-anti-retard.ts   # Re-export from system-brain
│   │       ├── l6-kraken-protection.ts
│   │       └── l7-coordination-gates.ts
│   ├── planning/
│   ├── execution/
│   └── SubagentManagerBrain.ts
├── system-brain/
│   └── firewall/
│       ├── index.ts            # Public exports
│       ├── types.ts            # LayerRule, BlockResult types
│       ├── layer-engine.ts     # Strike escalation engine
│       ├── intent-classifier.ts # O(1) token-set classification
│       ├── evidence-gate.ts    # Mechanical proof verification
│       ├── firewall-context-bridge.ts # Firewall→Hive injection
│       ├── smart-error-detector.ts    # 8 failure categories
│       ├── l6-anti-retard.ts   # 14-arm multi-signal fusion (691 lines)
│       ├── l6-kraken-protection.ts
│       ├── l7-coordination-gates.ts
│       └── layers/
│           ├── index.ts        # DEFAULT_LAYERS (16 layers)
│           ├── l0-identity.ts
│           ├── l1-theatrical.ts
│           ├── l2-hive-poison.ts
│           ├── l3-delegation-abuse.ts
│           ├── l4-context-theft.ts
│           ├── l5-1-assumptions.ts
│           ├── l5-2-skip-verification.ts
│           ├── l5-3-output-fabrication.ts
│           ├── l5-4-retard-logic.ts
│           ├── l5-5-scope-creep.ts
│           ├── l8-anti-bullshit.ts
│           ├── l9-feature-omission.ts
│           └── l10-container-enforcement.ts
└── identity/
    └── orchestrator/           # 5 KRAKEN identity files (566 lines)
```

## Test Command
```bash
bun test
```
Output: 11 passed, 0 failed.

## Dependencies
```json
{
  "peerDependencies": {"@opencode-ai/plugin": "^1.3.6"},
  "devDependencies": {
    "@types/bun": "latest",
    "@types/node": "^22.0.0",
    "typescript": "^5.0.0"
  }
}
```

## Key Build Decisions
1. **External @opencode-ai/plugin** — Plugin API provided by OpenCode runtime, not bundled
2. **Target bun** — Bun runtime in container image
3. **Format ESM** — ES modules for modern runtime
4. **Single bundle** — All firewall layers bundled into one file for drop-in deployment
