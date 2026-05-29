# Plugin Ship Common Sense — Kraken v1.2 Firewall v11

## CRITICAL: Container Testing Rule

`opencode run` has BROKEN hooks. TUI mode is the ONLY valid test method.

| Command | Hook Support |
|---------|-------------|
| TUI (opencode /workspace) | ✅ FULL — all hooks fire |
| opencode run "message" | ❌ BROKEN — hooks don't fire |

### Correct Container Test Command
```bash
/usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64-baseline/bin/opencode --agent kraken --model opencode/big-pickle
```

---

## 5 Mandatory Plugin Architecture Rules

### Rule 1: Agent Identity Wall
Every hook must check agent identity. Non-Kraken agents should never reach hook logic.
```typescript
agentFilter: null, // tool.execute.before has no agent field (v1.14.48)
// Handler checks internally via sessionState or ctx.isMyAgent()
```

### Rule 2: Config Copy-In (NOT Bind Mount)
Bind mounting config exposes host files to `rm -rf`.
```bash
docker cp config.json container:/root/.config/opencode/  # CORRECT
docker run -v ./config:/root/.config/opencode ...         # WRONG
```

### Rule 3: Baseline Binary
The `/usr/local/bin/opencode` wrapper picks wrong binary (musl vs glibc).
```bash
# CORRECT — explicit baseline
/usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64-baseline/bin/opencode
# WRONG — wrapper
/usr/local/bin/opencode
```

### Rule 4: Primary Agent Mode
```json
{"agent": {"kraken": {"mode": "primary", "hidden": false}}}
```
Without `mode: "primary"`, agent won't appear in tab toggle.

### Rule 5: Permission Allow-All for Testing
```json
{"permission": {"*": {"*": "allow"}}}
```
Restrict in production.

---

## Pre-Ship Checklist

- [ ] Bundle builds with 0 errors
- [ ] Unit tests pass (11/11)
- [ ] Identity verified in container ("I am KRAKEN v1.2")
- [ ] L6 rm -rf blocked in container
- [ ] L6 write to /root/.config/opencode blocked
- [ ] Normal /tmp writes allowed
- [ ] chat.message firewall blocks 7/7 session-191e patterns
- [ ] No diagnostic/console.log in production code
- [ ] Deploy script functional
- [ ] All docs included (DEPLOY, BUILD, SHIP_MANIFEST)

---

## Hook Gotchas (v1.14.48)

| Hook | Gotcha | Fix |
|------|--------|-----|
| tool.execute.before | agentFilter must be null (no agent field in input) | agentFilter: null |
| tool.execute.before | Args in output.args, not input.args | Read from output |
| tool.execute.before | write/glob strip description from args | Bash preserves it; use chat.message + L10 content |
| chat.message | Fires on user messages, not model tool calls | Model self-polices via identity |
| system.transform | Must check sessionState.currentAgent | 4-source fallback |

---

## Migration from v10 → v11

| Change | Reason |
|--------|--------|
| L6-AR: 5→14 arms | Session-191e analysis revealed 70% pattern gap |
| MIN_CONFIDENCE: 0.60→0.30 | Single-arm matches now block |
| ALL layers throw | No more silent blocking |
| L7: ()→true stubs replaced | Real fs validation |
| L5: warn→block | No more paper tigers |
| L2: mechanical→pattern-first | Reduces false positives |
| Smart error detector added | 8 failure categories |
| Context bridge added | Category→Hive mapping |
| V10 theatrical wired | Was defined but never called |
