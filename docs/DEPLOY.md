# Deployment — Kraken v1.2 Firewall v11

## Plugin Ship Hygiene (MANDATORY)

### Rule 1: TUI Testing ONLY
`opencode run` has BROKEN hooks. TUI mode is the ONLY valid test method.
```bash
# CORRECT — TUI mode (hooks fire)
/usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64-baseline/bin/opencode --agent kraken

# WRONG — opencode run (hooks DON'T fire)  
opencode run "test message"
```

### Rule 2: Config Copy-In (NOT Bind Mount)
Bind mounting config into containers allows `rm -rf` to destroy host files.
```bash
# CORRECT — docker cp (container can't touch host)
docker cp opencode.json kraken:/root/.config/opencode/opencode.json

# WRONG — bind mount (rm -rf destroys host)
docker run -v ./config:/root/.config/opencode ...
```

### Rule 3: Baseline Binary (NOT Wrapper)
The wrapper picks wrong binary (musl vs glibc). Always use baseline.
```bash
# CORRECT
/usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64-baseline/bin/opencode

# WRONG — wrapper picks musl on glibc system
/usr/local/bin/opencode
```

### Rule 4: Agent Mode Must Be Primary
```json
{"agent": {"kraken": {"mode": "primary", "hidden": false}}}
```
Without `mode: "primary"`, the agent won't appear in tab toggle.

### Rule 5: Permission Allow-All for Testing
```json
{"permission": {"*": {"*": "allow"}}}
```

---

## Quick Deploy (Host)

```bash
bash deploy.sh ~/.config/opencode
```

Or manually:
```bash
PLUGIN_DIR="$HOME/.config/opencode/plugins/kraken-firewall"
mkdir -p "$PLUGIN_DIR/dist" "$PLUGIN_DIR/identity/orchestrator"
cp dist/kraken-firewall.js "$PLUGIN_DIR/dist/index.js"
cp identity/orchestrator/*.md "$PLUGIN_DIR/identity/orchestrator/"
```

Add to `~/.config/opencode/opencode.json`:
```json
{
  "model": "opencode/big-pickle",
  "provider": {"opencode": {}},
  "plugin": ["file:///root/.config/opencode/plugins/kraken-firewall/dist/index.js"],
  "agent": {"kraken": {"mode": "primary", "hidden": false}},
  "permission": {"*": {"*": "allow"}}
}
```

---

## Container Deploy

```bash
# 1. Copy config into container (copy-in, not bind mount)
CID=$(docker run -d --name kraken --entrypoint /bin/sh opencode-test:1.14.34 -c 'sleep 3600')

docker exec kraken mkdir -p /root/.config/opencode/plugins/kraken-firewall/dist
docker exec kraken mkdir -p /root/.config/opencode/plugins/kraken-firewall/identity/orchestrator
docker cp dist/kraken-firewall.js kraken:/root/.config/opencode/plugins/kraken-firewall/dist/index.js
docker cp identity/orchestrator/. kraken:/root/.config/opencode/plugins/kraken-firewall/identity/orchestrator/
docker cp opencode.json kraken:/root/.config/opencode/opencode.json

# 2. Mount Hive Mind (read-only) for context
# -v /home/leviathan/.local/share/opencode/hive-mind:/root/.local/share/opencode/hive-mind:ro

# 3. Mount auth for API models
# -v /home/leviathan/.local/share/opencode/auth.json:/root/.local/share/opencode/auth.json:ro

# 4. Start TUI
docker exec -it kraken /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64-baseline/bin/opencode --agent kraken
```

---

## Dual Plugin Setup

Kraken v1.2 requires TWO plugins for full orchestration:
```json
{
  "plugin": [
    "file:///root/.config/opencode/plugins/subagent-manager/dist/index.js",
    "file:///root/.config/opencode/plugins/kraken-firewall/dist/index.js"
  ]
}
```
- **subagent-manager FIRST** — container execution layer  
- **kraken-firewall SECOND** — orchestration + firewalls

Without subagent-manager, spawn_shark_agent/manta_agent tools register but can't execute (no wrapper scripts in container).

---

## Model Configuration

### Default (free, unlimited, built-in)
```json
{"model": "opencode/big-pickle", "provider": {"opencode": {}}}
```

### Fast (Google API)
```json
{"model": "google/gemini-3.1-flash-lite", "provider": {"google": {}}}
```

### Smart (Xiaomi Token Plan Singapore)
```json
{
  "model": "xiaomi-token-plan-sgp/mimo-v2.5-pro",
  "provider": {
    "xiaomi-token-plan-sgp": {
      "npm": "@ai-sdk/openai-compatible",
      "options": {
        "baseURL": "https://token-plan-sgp.xiaomimimo.com/v1",
        "apiKey": "YOUR_KEY_HERE"
      }
    }
  }
}
```
Note: Requires `npm install -g @ai-sdk/openai-compatible` in container.

---

## Verification Checklist

After deploy, verify:
- [ ] Agent shows in tab toggle as "Kraken"
- [ ] "who are you" → "I am KRAKEN v1.2 — the central multi-brain orchestrator"
- [ ] `kraken_brain_status` → all brains initialized, L0-L7 secure
- [ ] `write /root/.config/opencode/test.txt` → BLOCKED by L6
- [ ] `rm -rf /root/.config/opencode` → model refuses (identity) or BLOCKED by L6
- [ ] Normal file writes to /tmp → allowed
