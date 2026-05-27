# Deployment Instructions — Kraken v1.2 Firewall

## Prerequisites
- OpenCode v1.14.34+ (tested on v1.14.34 and v1.14.48)
- Bun v1.0+ (for building from source)
- Docker (for container testing)

## Option 1: Deploy Pre-built Bundle

```bash
# Create plugin directory
mkdir -p ~/.config/opencode/plugins/kraken-firewall/dist

# Copy bundle
cp dist/kraken-firewall.js ~/.config/opencode/plugins/kraken-firewall/dist/index.js

# Add to opencode.json (merge with existing plugins)
# Example opencode.json:
cat > ~/.config/opencode/opencode.json << 'EOF'
{
  "model": "minimax/MiniMax-M2.7",
  "provider": {
    "minimax": {
      "options": {
        "apiKey": "YOUR_API_KEY"
      }
    }
  },
  "plugin": [
    "file:///root/.config/opencode/plugins/kraken-firewall/dist/index.js"
  ],
  "agent": {
    "kraken": {"mode": "primary"}
  },
  "permission": {"*": {"*": "allow"}}
}
EOF
```

## Option 2: Build from Source

```bash
# Install dependencies
cd /path/to/SHIP_KRAKEN_V12_FIREWALL_v10
bun install

# Build (bundles @opencode-ai/plugin inline)
bun build src/index.ts --outdir dist --target bun --format esm --bundle

# Deploy
cp dist/index.js ~/.config/opencode/plugins/kraken-firewall/dist/index.js
```

## Option 3: Container Testing

```bash
# Create container
CID=$(docker run -d --name kraken-fw-test --entrypoint /bin/bash opencode-test:1.14.34 -c "sleep 3600")

# Copy config and bundle into container
docker exec kraken-fw-test mkdir -p /root/.config/opencode /tmp/snap/plugins/kraken-firewall/dist
docker cp opencode.json kraken-fw-test:/root/.config/opencode/opencode.json
docker cp dist/kraken-firewall.js kraken-fw-test:/tmp/snap/plugins/kraken-firewall/dist/index.js
docker exec kraken-fw-test chown -R root:root /root/.config/opencode /tmp/snap

# Start TUI (use baseline binary for v1.14.34)
tmux new-session -d -s fw-test \
  "docker exec -it kraken-fw-test /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64-baseline/bin/opencode --agent kraken 2>&1; sleep 60"

# Wait for TUI, dismiss dialog
sleep 10
tmux send-keys -t fw-test Escape
```

## Multi-Plugin Setup

To load alongside other plugins (e.g., shark-agent):

```json
{
  "plugin": [
    "file:///root/.config/opencode/plugins/kraken-firewall/dist/index.js",
    "file:///root/.config/opencode/plugins/shark-agent/dist/index.js"
  ],
  "agent": {
    "kraken": {"mode": "primary"},
    "shark": {"mode": "subagent"}
  }
}
```

## Verification

```bash
# Run unit tests
cd /path/to/SHIP_KRAKEN_V12_FIREWALL_v10
bun run tests/__firewall_test.ts

# Expected: 10 passed, 1 failed (L1→L2 redirect, correct behavior)
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Plugin not loading | Check `opencode.json` has `"permission": {"*": {"*": "allow"}}` |
| Hooks not firing | Use TUI, not `opencode run` (headless mode bypasses hooks) |
| Module not found | Bundle was built with `--external @opencode-ai/plugin`. Rebuild without it. |
| Agent name undefined | Expected in v1.14.48. Agent name comes from session state. |
| Config destroyed | Use copy-in (no bind mount) for container testing. |

## Rollback

```bash
# Remove plugin from opencode.json
# Delete plugin directory
rm -rf ~/.config/opencode/plugins/kraken-firewall
```
