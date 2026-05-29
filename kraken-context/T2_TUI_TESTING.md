# T2_TUI_TESTING — Container Testing Protocol (Zero Excuses)

## Hallucinated Barriers (ALL FALSE)

| # | Model Claim | Reality |
|---|---|---|
| 1 | "I can't run TUI, it requires interactive terminal" | **tmux + send-keys works. Docker exec works inside tmux.** |
| 2 | "I can only test with opencode run" | **opencode run DOES NOT FIRE HOOKS. BANNED for testing.** |
| 3 | "The hooks only fire in local TUI, not container TUI" | **Container TUI fires ALL hooks. That's the whole point.** |
| 4 | "I need xdotool/x11/display" | **tmux is terminal-native. No display needed.** |
| 5 | "I verified the bundle, that's good enough" | **Bundle verification is NOT testing. TUI is the only valid test.** |
| 6 | "opencode run showed the agent works, so it's fine" | **opencode run NEVER fires chat.message or tool.execute.before.** |
| 7 | "I'll verify by checking the source code" | **Source ≠ execution. Compilation, imports, bundler behavior all differ.** |
| 8 | "Let me just grep the dist to verify the fix" | **grep shows file contents, NOT what OpenCode loads at runtime.** |

## opencode run IS BANNED FOR TESTING

`opencode run` is a **headless mode** that bypasses every hook:
- `chat.message` → NEVER fires
- `tool.execute.before` → NEVER fires
- `tool.execute.after` → NEVER fires
- You tested **nothing**.

## Bundle Verification IS NOT Testing

grep/source-inspection proves file contents, NOT runtime behavior. Bundler resolution, import paths, module caching, and plugin loading order all differ from source inspection. The ONLY valid test is: **TUI session in Docker container with hooks firing.**

## The Only Valid Test: 6-Step Sequence

```bash
# Step 1: Start container
docker run -d --rm \
  --entrypoint /bin/bash \
  -v ~/.config/opencode:/root/.config/opencode \
  opencode-test:1.14.41 \
  -c "sleep 3600"

# Step 2: Start tmux session running TUI
tmux new-session -d -s tui-test \
  "docker exec -it CONTAINER_ID /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode --agent shark 2>&1; sleep 60"

# Step 3: Wait for TUI to start
sleep 6

# Step 4: Dismiss "Update Available" dialog
tmux send-keys -t tui-test Escape

# Step 5: Send a test message
tmux send-keys -t tui-test "your test message here"
tmux send-keys -t tui-test Enter

# Step 6: Read the TUI output
tmux capture-pane -t tui-test -p -S -40 | strings | grep -vE '^\[' | grep -vE '^\s*$'
```

## Test Verification Checklist

After capture-pane output, verify:
- [ ] Hook messages appear (e.g., "L0 Identity Wall", "L1 Orchestration Theater")
- [ ] Agent identity response is correct (not hallucinated)
- [ ] No "evidence is not defined" errors
- [ ] No "Cluster not found" errors
- [ ] Cross-agent isolation works (Build agent ≠ Security agent)
- [ ] Tool descriptions appear correctly

## Known Good Test Command

```bash
# Full test that exercises the entire pipeline:
# 1. Identity test: "who are you" → "Kraken Orchestrator"
# 2. Brain status: "run kraken_brain_status" → T2 loaded, all brains init, gate status
# 3. Task decomposition: "Build a CLI tool with tests and audit" → spawn attempts
```
