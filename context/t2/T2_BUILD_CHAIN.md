# T2_BUILD_CHAIN.md
# Successful Build Chains from Kraken Hive
## Source: Kraken Hive - sessions/
## Last Updated: 2026-06-01 (V1.3 100% Runtime Grade Verified)

## Overview
This is the T2 reference library for successful build chains. These are proven sequences of steps that have worked well for past tasks. Use these as templates for similar work.

## Build Chain Templates

### Build Chain: New Feature (Shark Steamroll)
```
1. RECEIVE_TASK(task) → Kraken assigns with context injection
2. READ_SPEC(spec) → If SPEC.md exists, read it first
3. CREATE_STRUCTURE() → Scaffold files/directories
4. IMPLEMENT_CORE() → Write core logic
5. ADD_ERROR_HANDLING() → Wrap in try/catch, add validation
6. RUN_TESTS() → Execute test suite
7. VERIFY_BUILD() → Run lint/typecheck
8. REPORT_COMPLETE() → report_to_kraken taskId=X status=complete
```

### Build Chain: Debug Task (Manta Precision)
```
1. RECEIVE_TASK(task) → Kraken assigns debug task
2. REPRODUCE_ERROR() → Get consistent reproduction
3. ISOLATE_ROOT_CAUSE() → Binary search through code
4. APPLY_FIX() → Minimal targeted fix
5. VERIFY_FIX() → Run tests, check error gone
6. CHECK_SIDE_EFFECTS() → Run related tests
7. REPORT_COMPLETE() → report_to_kraken taskId=X status=complete
```

### Build Chain: Test Implementation
```
1. RECEIVE_TASK(task) → Kraken assigns test writing
2. READ_IMPLEMENTATION() → Understand what to test
3. WRITE_HAPPY_PATH() → Test the main success case
4. WRITE_EDGE_CASES() → Test boundary conditions
5. WRITE_ERROR_CASES() → Test error handling
6. RUN_TEST_SUITE() → Verify all tests pass
7. REPORT_COMPLETE() → report_to_kraken taskId=X status=complete
```

### Build Chain: API Implementation
```
1. RECEIVE_TASK(task) → Kraken assigns API task
2. DEFINE_INTERFACE() → Write TypeScript interfaces first
3. IMPLEMENT_VALIDATION() → Add input validation
4. IMPLEMENT_HANDLER() → Write the actual logic
5. ADD_ERROR_RESPONSES() → Structured error responses
6. WRITE_TESTS() → Test success and error paths
7. VERIFY_WITH_LINT() → Run lint and typecheck
8. REPORT_COMPLETE() → report_to_kraken taskId=X status=complete
```

## Context Injection Guide

When Kraken injects context, it provides:

### Pattern Context
Previous patterns that match the current task. Apply these patterns to your implementation.

### Failure Context  
Known failures to avoid. Review these before implementing to prevent repeating mistakes.

### Previous Work Context
Similar past tasks and how they were solved. Use these as reference implementations.

## Best Practices

### Before You Start
1. Check T2_PATTERNS.md for relevant patterns
2. Check T2_FAILURE_MODES.md for failures to avoid
3. Read injected context from Kraken
4. Clarify any ambiguities with Kraken via report_to_kraken

### During Implementation
1. Follow the appropriate build chain template
2. Report progress via report_to_kraken if blocked
3. Don't deviate from spec without Kraken approval
4. Keep code simple and focused

### After Completion
1. Verify against acceptance criteria
2. Run lint and typecheck
3. Report completion to Kraken
4. Document any patterns/failures you discovered

---

## Workflow States

- **PENDING**: Task assigned, not started
- **IN_PROGRESS**: Actively working on task
- **BLOCKED**: Encountered issue, waiting for Kraken
- **COMPLETE**: Task finished and verified
- **FAILED**: Task failed, reported to Kraken

Report state changes to Kraken via `report_to_kraken status=X`.

---

## Build Chain: Container Adversarial Test (5-Phase Protocol)

**Reference:** TESTING_FRAMEWORK_ADVERSARIAL_PRESSURE.md, T2_TUI_TESTING_BIBLE.md

This is the ONLY valid test method. Banned: `opencode run`, grep-based verification, hand-written JSON.

### Step 1: Build Plugin
```bash
cd ".../Ship Packages/KRAKEN_V1.2_V12_PRODUCTION"
bun build src/index.ts --outfile dist/kraken-agent.js --target bun --format esm --bundle --external @opencode-ai/plugin
```

### Step 2: Create Isolated Snapshot
```bash
PROJECT="kraken-adv-$(date +%m%d%H%M%S)"
SNAP="/tmp/snap-${PROJECT}"
rm -rf "$SNAP"
mkdir -p "$SNAP/plugins/kraken-agent/dist"
mkdir -p "$SNAP/plugins/kraken-agent/identity/orchestrator"
cp dist/kraken-agent.js "$SNAP/plugins/kraken-agent/dist/index.js"
cp -r identity/* "$SNAP/plugins/kraken-agent/identity/"  # CRITICAL: identity files required
cat > "$SNAP/opencode.json" << 'EOF'
{
  "model": "xiaomi-token-plan-sgp/mimo-v2.5-pro",
  "provider": {
    "xiaomi-token-plan-sgp": {
      "npm": "@ai-sdk/openai-compatible",
      "options": {
        "baseURL": "https://token-plan-sgp.xiaomimimo.com/v1",
        "apiKey": "tp-ssy5nlzfc5vccack4ccierszbs0fojjp0lp3uj37hlp328ci"
      }
    }
  },
  "plugin": ["file:///root/.config/opencode/plugins/kraken-agent/dist/index.js"],
  "agent": {"kraken": {"name": "kraken", "mode": "primary", "tools": {}}},
  "permission": {"*": {"*": "allow"}}
}
EOF
```

### Step 3: Start Container
```bash
CONTAINER="test-${PROJECT}"
docker run -d --rm --name "$CONTAINER" --entrypoint "" --network host \
  -v "$SNAP:/root/.config/opencode" \
  opencode-test:1.14.34 \
  /bin/sh -c '/usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64-baseline/bin/opencode --agent kraken 2>&1; sleep 3600'
sleep 30  # DB migration wait
docker ps | grep "$CONTAINER" || { echo "DIED"; docker logs "$CONTAINER"; exit 1; }
```

### Step 4: Run 5-Phase Adversarial Test
```bash
docker exec "$CONTAINER" node --input-type=module -e '
import("/root/.config/opencode/plugins/kraken-agent/dist/index.js").then(async (mod) => {
  const hooks = await mod.default({directory: "/tmp"});
  // Phase 1-5 test cases...
  // See TESTING_FRAMEWORK_ADVERSARIAL_PRESSURE.md for full test script
  process.exit(failed > 0 ? 1 : 0);
}).catch(e => { console.error("FATAL:", e.message); process.exit(2); });
'
```

### Step 5: Capture Mechanical Evidence
```bash
EVIDENCE_DIR="/tmp/kraken-test-evidence-$(date +%s)"
mkdir -p "$EVIDENCE_DIR"
echo "{\"success\":true,\"containerId\":\"$(docker ps -q --filter name=$CONTAINER)\"}" > "$EVIDENCE_DIR/ContainerSpawnResult.json"
# ContainerTestResult.json written from test exit code
# TuiInteraction.json from tmux capture-pane (for TUI tests)
```

### P2 Violations Found (2026-06-01)

These patterns caused runtime crashes in the adversarial test. All are P2 (Type Certainty) violations.

| Pattern | Example | Fix |
|---------|---------|-----|
| Unguarded `.args` access | `output.args` when output is undefined | Use `(output as any)?.args \|\| {}` |
| Unguarded string method | `args.task.toLowerCase()` when task is undefined | Use `(args.task \|\| '').toLowerCase()` |
| Missing input fallback | `output.message` only, ignoring `input.message.content` | Check both paths |
| Missing agent fallback | `sessionState.lastAgent` only, ignoring `input.agent` | Chain: `inputAgent \|\| lastAgent \|\| mapAgent` |
| **require() in ESM** | `require('../../brains/planning/planning-brain.js')` | **Replace with static `import` at module top** |
| Missing args guard in tools | `execute({})` crashes on undefined args | **Add null check at execute entry, return JSON error** |
| Cross-session state leak | `lastAgent` from prior test contaminates next test | **Always check input.agent FIRST before session state** |

### Test Anti-Patterns (BANNED)
- `echo '{"overallPassed":true}' > ContainerTestResult.json` — hand-written evidence
- `grep "functionName" dist/index.js` — proves text exists, not execution
- `opencode run --agent kraken "test"` — hooks NEVER fire in run mode
- "I verified it" without disk evidence — claims without proof are fiction
