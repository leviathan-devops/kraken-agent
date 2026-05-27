# Build Instructions — Kraken v1.2 Firewall

## Prerequisites
- Bun v1.0+ (for TypeScript compilation and bundling)
- Node.js v18+ (for OpenCode runtime)

## Build Command

```bash
cd /path/to/SHIP_KRAKEN_V12_FIREWALL_v10

# Build with @opencode-ai/plugin bundled inline (REQUIRED)
bun build src/index.ts --outdir dist --target bun --format esm --bundle
```

**CRITICAL**: Do NOT use `--external @opencode-ai/plugin`. The plugin module must be bundled inline for container testing.

## Build Output
- `dist/index.js` — 673KB, 144 modules, ESM format
- Contains all dependencies inlined (including @opencode-ai/plugin)

## Source Structure
```
src/
├── index.ts                    — Main entry, hook registration
├── brains/
│   └── system/
│       └── firewall/
│           ├── index.ts        — enforceFirewall function
│           ├── l0-identity.ts  — L0 identity wall
│           ├── l1-orchestration-theater.ts
│           ├── l2-false-completion.ts
│           ├── l3-output-inspection.ts
│           ├── l4-wrong-cluster.ts
│           ├── l5-macro-derailment.ts
│           ├── l6-kraken-protection.ts
│           ├── l6-anti-retard.ts
│           └── l7-coordination-gates.ts
├── system-brain/
│   └── firewall/
│       ├── l6-kraken-protection.ts  — V10 L6 patterns
│       ├── l7-coordination-gates.ts — V10 L7 gates
│       └── layers/
│           └── index.ts        — DEFAULT_LAYERS
└── v4.1/
    ├── hooks/
    │   └── safe-hook.ts        — Hook wrapper with agent filtering
    └── context/
        └── hook-context.ts     — Hook context creation
```

## Key Build Decisions

1. **Inline @opencode-ai/plugin**: Required for container testing. External import fails at runtime.
2. **ESM format**: OpenCode plugins must be ESM.
3. **Bun target**: Optimized for Bun runtime.
4. **No minification**: Preserves debug logging for troubleshooting.

## Rebuilding After Changes

```bash
# Edit source files
vim src/brains/system/firewall/l6-kraken-protection.ts

# Rebuild
bun build src/index.ts --outdir dist --target bun --format esm --bundle

# Deploy
cp dist/index.js ~/.config/opencode/plugins/kraken-firewall/dist/index.js
```

## Testing

```bash
# Unit tests
bun run tests/__firewall_test.ts

# Container test (see docs/DEPLOY.md)
```
