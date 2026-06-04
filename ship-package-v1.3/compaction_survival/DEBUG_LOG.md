# Kraken V1.3 — Debug Log

## Session: Auditor's Rebuild Analysis (2026-06-03)

### The New Baseline: What Changed
The entire codebase was replaced with a correct implementation by an independent auditor (GLM 5.1 Macro Architect). The old codebase (89 files, 44 defects) is deprecated. All debugging now applies to the new baseline at `/home/leviathan/Downloads/kraken-v1.3/`.

### R1: Non-Null Assertions (clusterManager!)
- **Issue:** 7 locations in index.ts use `clusterManager!.method()`.
- **Root cause:** Developer assumed initialization always happens before tool execution. If initialization order changes (plugin refactoring, config loading changes), this silently throws.
- **Fix:** Guard all 7 with `getClusterManager()` helper that throws with clear message if null.
- **Prevention pattern:** All module-level state should be accessed through guards, not `!`.

### R2-R4: Unchecked JSON.parse Casts
- **Issue:** 3 locations cast JSON.parse results without schema validation:
  - `audit.ts:62`: `parsed as unknown as AuditEntry`
  - `audit.ts:85`: `entry as unknown as Record<string, unknown>`
  - `semantic-anti-bullshit.ts:249`: `parsed as Record<string, unknown>`
- **Root cause:** Auditor assumed JSON.parse output matches expected shape. Malformed JSON files produce silent garbage.
- **Fix:** Add runtime validation of the parsed object before casting.
- **Prevention pattern:** Every `JSON.parse` must be followed by a shape validation.

### R5-R8: Synchronous I/O in Hot Paths
- **Issue:** 4 locations use blocking sync I/O:
  - `execution-brain/index.ts:164`: `readdirSync` in recursive walk
  - `index.ts:556-557`: `existsSync` + `readFileSync` in tool
  - `evidence-collector.ts:46-51`: `existsSync` + `mkdirSync` + `writeFileSync`
  - `audit.ts:41`: `appendFileSync` on every decision
- **Root cause:** The auditor focused on structural correctness and didn't address runtime performance. All these should use `fs.promises`.
- **Fix:** Convert to async `fs.promises` API.
- **Prevention pattern:** Never use `*Sync` methods in async functions or hot paths.

### R9: Firewall Fail-Open on Layer Error
- **Issue:** `firewall/index.ts:64` — when a layer throws, error is logged and execution continues to next layer.
- **Root cause:** Design decision to be resilient to individual layer failures. But this violates "default-deny on error" principle.
- **Fix:** Block on layer error instead of continuing.
- **Prevention pattern:** Enforcement systems must default to the safest option on error.

### R10: Unchecked Cast in EvidenceGate
- **Issue:** `evidence-gate.ts:106-107` — JSON.parse result accessed with typeof checks but the cast from `any` to `untyped` is implicit.
- **Root cause:** Auditor used `parsed.overallPassed` directly from JSON.parse return value.
- **Fix:** Validate the parse result is an object before field access.
- **Prevention pattern:** All JSON.parse results should be typed through validation before use.

## Key Lessons from Auditor vs Old v1.3

1. **Build it, don't describe it.** The old v1.3 documented RGE+SRE in BUILD_SPEC. The auditor actually implemented them.
2. **One concept = one implementation.** The old v1.3 had 2 firewalls, 2 statestores, 3 agent lists. The auditor has 1 each.
3. **Run the code before claiming it works.** The old v1.3's browser tools would crash on every call. Zero testing.
4. **Test at runtime, not in review.** The old v1.3 passed code review but had 44 defects. The auditor's code has 10 (and they're runtime performance issues, not correctness issues).
5. **Every catch must handle errors.** Old v1.3: 15+ empty catches. Auditor: 0.
6. **Every cast needs a check.** Old v1.3: 30+ unchecked. Auditor: 0 in main paths.
7. **Every path needs os.homedir().** Old v1.3: 20+ hardcoded. Auditor: 0.
8. **Sync I/O blocks the event loop.** The auditor's biggest blind spot. Fixing in Phase 0.
