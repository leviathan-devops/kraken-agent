# Kraken Agent v1.4 — Session Handover

**Session:** 2026-06-08 — Container Copilot Tile Infrastructure Build
**Status:** Complete — 4 copilot tiles deployed, Bible v5.0 finalized

---

## Current State

### Kraken Copilot Tile
- **Container:** `kraken-container` — running (Up ~2 hours)
- **Tmux session:** `kraken-container` — alive, NEVER killed
- **Copilot tile TTY:** `/dev/pts/16`
- **Agent:** Kraken v1.4
- **Model:** `google/gemma-4-26b-a4b-it`
- **Config:** `/tmp/kraken-container-snap/opencode.json`
- **Plugin:** `kraken/dist/index.js` (from Kraken Agent v1.4 project)
- **Sidecar session ID:** `89fa75630f3e9edc`
- **Anchor:** Stored in `~/.config/ct-run/anchors.json`

### What Was Built Today

1. **4 Copilot Tiles** (Kraken, Trident, Spider, Shark) — each with persistent container + tmux session + collaborator terminal tile. All running independently.

2. **Runtime-Grade Container Sandbox** — `runtime-grade-container-sandbox:latest` — single image (opencode 1.14.43 + Node.js 20.20.2 + @ai-sdk/google@0.0.55) used by ALL containers. Zero plugins baked in — everything injects at runtime via bind mount.

3. **RUNTIME_GRADE_CONTAINER_TESTING_BIBLE_v5.0.md** — 1421-line precision document covering:
   - §0: Live system status with all 4 tile states
   - §1-6: Copilot tile setup, operation, plugin management, identification, recovery
   - §7: 26 anti-patterns (death patterns, identification failures, config mistakes, infrastructure failures, race conditions, corruption, API key issues)
   - §8-9: Command reference, architecture
   - §10: Persistence & testing patterns (SQLite, Merkle, event sourcing, property/mutation/negative testing)
   - §11: Evidence template

4. **T1 Injectable** — `T1b_COPILOT_TILE_PROTOCOL.md` — quick reference for kill/relaunch

5. **Kraken v1.4** — fully built and running in its copilot tile. Kraken agent loaded via bind mount plugin.

### How to Resume Work on Kraken

```python
import json, os, subprocess, socket, time

# Step 1: Find the kraken tile
anchor = json.load(open(os.path.expanduser("~/.config/ct-run/anchors.json")))
k = anchor["kraken"]
sid, pid, tty = k["sidecar_session_id"], k["tile_pid"], k["tile_pty"]

# Step 2: Verify alive
assert os.path.exists(f"/proc/{pid}"), "Kraken tile is dead"
clients = subprocess.run(["tmux", "list-clients", "-t", "kraken-container", "-F", "#{client_tty}"],
                         capture_output=True, text=True)
if tty not in clients.stdout:
    # Reconnect via sidecar socket
    sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    sock.settimeout(5)
    sock.connect(os.path.expanduser(f"~/.collaborator/pty-sessions/{sid}.sock"))
    sock.sendall(b"tmux attach -t kraken-container\n")
    sock.close()
    time.sleep(2)

# Step 3: Verify opencode is running
opencode = subprocess.run(["docker", "exec", "kraken-container", "pgrep", "opencode"],
                          capture_output=True, text=True)
if not opencode.stdout.strip():
    print("Opencode dead — relaunching...")
    subprocess.run(["docker", "exec", "kraken-container", "sh", "-c",
                    "kill -9 $(pgrep -f /usr/local/bin/opencode)"], capture_output=True)
    time.sleep(3)
    subprocess.run(["tmux", "send-keys", "-t", "kraken-container:0",
                    "docker exec -it kraken-container /usr/local/bin/opencode --agent kraken 2>&1", "Enter"])
    time.sleep(8)

# Step 4: Verify TUI
result = subprocess.run(["tmux", "capture-pane", "-t", "kraken-container:0", "-p"],
                        capture_output=True, text=True)
assert "Kraken" in result.stdout, "Kraken agent not loaded"
assert "Gemma" in result.stdout, "Wrong model"
print("Kraken copilot tile is ready")
```

### Key Files

| File | Location | Purpose |
|------|----------|---------|
| Kraken v1.4 dist | `...Kraken Agent/Active Projects/Kraken Agent v1.4/dist/index.js` | Kraken agent plugin binary |
| Container config | `/tmp/kraken-container-snap/opencode.json` | Model + provider + plugin list |
| Container plugins | `/tmp/kraken-container-snap/plugins/` | All plugin binaries for kraken |
| Anchor database | `~/.config/ct-run/anchors.json` | Maps project names to tile session IDs |
| Bible v5.0 | `~/.local/share/opencode/hive-mind/T2_RUNTIME_GRADE_CONTAINER_TESTING_BIBLE_v5.0.md` | Full copilot tile documentation |
| Quick reference | `~/.local/share/opencode/hive-mind/T1b_COPILOT_TILE_PROTOCOL.md` | Quick kill/relaunch reference |

### The Three Rules (Never Violate)

1. **NEVER kill the tmux session** (`tmux kill-session -t kraken-container`) — disconnects the copilot tile. Kill opencode INSIDE the container instead.
2. **NEVER write to the per-session socket** (`~/.collaborator/pty-sessions/{id}.sock`) — corrupts terminal state. Use `tmux send-keys` instead.
3. **Config MUST be written BEFORE opencode starts** — the plugin list and model must be in the bind mount before `tmux new-session` runs.

### Anti-Pattern Quick Reference for Kraken

| If you see... | The problem is... | Do this... |
|---------------|-------------------|------------|
| Tile shows bash instead of TUI | opencode crashed | `tmux send-keys -t kraken-container:0 "docker exec -it kraken-container /usr/local/bin/opencode --agent kraken 2>&1" Enter` |
| Tile says "Build" instead of "Kraken" | Config was written AFTER opencode started, or plugin not first | Rewrite config with kraken first, kill, relaunch |
| tmux pane command is "bash" not "docker" | Race condition on first start | Relaunch once (see §2.3) |
| "API key invalid" / model errors | Key rotated or provider issue | Update key in auth.json + all configs + docker run commands |
| No copilot tile appears | Tile was closed or xdotool hit wrong window | Recreate via xdotool with main Collaborator window |
| Tile exists but shows disconnected | tmux session was killed | Recreate tmux session, reconnect tile via socket |
