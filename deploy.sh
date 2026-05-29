#!/bin/bash
# KRAKEN v1.2 FIREWALL v11 — Production Deploy
# Usage: bash deploy.sh [opencode-config-dir]
# Default: ~/.config/opencode

set -e
CONFIG_DIR="${1:-$HOME/.config/opencode}"
PLUGIN_DIR="$CONFIG_DIR/plugins/kraken-firewall"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "╔══════════════════════════════════════╗"
echo "║  KRAKEN v1.2 FIREWALL v11 — DEPLOY  ║"
echo "║  16 layers | 14 arms | 220+ patterns ║"
echo "╚══════════════════════════════════════╝"
echo ""
echo "Target: $CONFIG_DIR"
echo "Plugin: $PLUGIN_DIR"

# Create directories
mkdir -p "$PLUGIN_DIR/dist" "$PLUGIN_DIR/identity/orchestrator"

# Deploy bundle
if [ -f "$SCRIPT_DIR/dist/kraken-firewall.js" ]; then
  cp "$SCRIPT_DIR/dist/kraken-firewall.js" "$PLUGIN_DIR/dist/index.js"
  echo "  Bundle: $(wc -c < "$PLUGIN_DIR/dist/index.js") bytes"
else
  echo "  ERROR: dist/kraken-firewall.js not found"
  echo "  Run: bun build src/index.ts --outdir dist --target bun --format esm --bundle --external @opencode-ai/plugin"
  exit 1
fi

# Deploy identity
if [ -d "$SCRIPT_DIR/identity/orchestrator" ]; then
  cp "$SCRIPT_DIR/identity/orchestrator/"*.md "$PLUGIN_DIR/identity/orchestrator/" 2>/dev/null || true
  echo "  Identity: $(ls "$PLUGIN_DIR/identity/orchestrator/" 2>/dev/null | wc -l) files"
fi

# Generate minimal config if none exists
if [ ! -f "$CONFIG_DIR/opencode.json" ]; then
  cat > "$CONFIG_DIR/opencode.json" << 'EOFJSON'
{
  "model": "opencode/big-pickle",
  "provider": {"opencode": {}},
  "plugin": ["file:///root/.config/opencode/plugins/kraken-firewall/dist/index.js"],
  "agent": {"kraken": {"mode": "primary", "hidden": false}},
  "permission": {"*": {"*": "allow"}}
}
EOFJSON
  echo "  Config: created opencode.json"
else
  echo "  Config: existing opencode.json preserved"
fi

echo ""
echo "╔══════════════════════════════════════╗"
echo "║  DEPLOY COMPLETE                     ║"
echo "╠══════════════════════════════════════╣"
echo "║  Agent: kraken (mode: primary)       ║"
echo "║  Layers: L0-L10 + AR (16 layers)     ║"
echo "║  Arms: 14 octopus fusion arms        ║"
echo "║  Patterns: 220+ bullshit detectors   ║"
echo "║  Strikes: WARNING→BLOCK→COOLDOWN→LOCK║"
echo "╚══════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. Verify: opencode --agent kraken"
echo "  2. Test: 'who are you' → 'I am KRAKEN v1.2'"
echo "  3. Check: kraken_brain_status → brains operational"
echo ""
echo "To use in container:"
echo "  docker cp $PLUGIN_DIR container:$PLUGIN_DIR"
echo "  docker exec -it container /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64-baseline/bin/opencode --agent kraken"
