# Kraken V1.3 — Stream of Consciousness Preservation

**Purpose:** Patterns, lessons, and engineering insights that must survive compactions.

---

## Core Philosophy

### "It compiles" means nothing.
The old v1.3 compiled fine. It had 44 defects. Browser tools crashed on every call. The firewall used the weaker version. Disabled enforcement layers silently allowed agents to cheat.

Compilation is the MINIMUM bar. Runtime testing is the EVIDENCE bar.

### Code that looks right but hasn't run = code that's wrong.
The browser tools had complete JSDoc, correct error handling patterns, proper types. They used UNDECLARED VARIABLES that would crash on every call. Code review cannot catch this. Only execution can.

### Documentation describes reality, not the other way around.
The old BUILD_SPEC described RGE+SRE as "architectural components." They were never built. The documentation was fiction. The auditor built them first, then we documented what was built.

---

## Patterns That Must Survive

### 1. Consolidated Architecture
One directory per concept. One implementation per concept. No split directories, no duplicate files. The auditor's rebuild: `system-brain/firewall/` only, `brains/` is EMPTY.

### 2. RGE + SRE = Execution Brain
The Execution Brain is RGE (7-layer semantic analysis) + SRE (P1-P11 principle checks). Both use TypeScript Compiler API for AST analysis. Regex is ONLY for L0 syntactic pre-filtering. This is the CORRECT architecture.

### 3. Type Guards at Every Boundary
Every external input must pass through a type guard before use:
```typescript
function extractString(args, key, default): string {
  const value = args[key];
  if (isString(value)) return value;
  return defaultValue;
}
```
Never use `as string` directly. Never trust input shape.

### 4. Error Handling in Every Catch
Every catch block does:
```typescript
catch (err: unknown) {
  const errMsg = err instanceof Error ? err.message : String(err);
  logger.error(`Operation failed: ${errMsg}`);
  // Return error, throw, or rollback
}
```
No empty catches. No comment-only catches. Every error is logged with context.

### 5. Paths Use os.homedir()
All user directory paths use `os.homedir()`. All temp paths use `os.tmpdir()`. All path construction uses `path.join()`. Zero hardcoded `/root/`, `/home/`, or `/tmp/` paths.

### 6. Promises Are Awaited or Caught
Every promise is either awaited with try/catch or chained with .catch(). No fire-and-forget. No floating promises.

### 7. Empty Input = Failure
Every aggregate/consensus function handles empty input as failure. Empty set similarity = 0, not 1. Empty task queue = failure, not "all done."

### 8. Default-Deny on Error
When uncertain, block. When error, block. When timeout, block. Never assume "it's probably fine."

### 9. Mechanical Evidence
Every gate advancement requires files on disk with verifiable content. ContainterTestResult.json must exist with passRate >= 0.90. dist/index.js must exist with non-zero size. Claims are not evidence.

### 10. One Source of Truth
Agent lists, config values, identity data are defined ONCE and imported everywhere. No duplicates, no FIXME placeholders, no "temporary" values.

---

## Lessons from the Old v1.3 Failure

### The Root Cause Was Not Technical
The old v1.3 failed because of PROCESS, not technology:
1. **No execution testing** — code was reviewed but never run
2. **Premature labeling** — called "RUNTIME GRADE VERIFIED" before verification
3. **Documenting instead of building** — BUILD_SPEC described what should exist instead of existing code
4. **Accumulation instead of consolidation** — added new files instead of restructuring existing ones
5. **Disabling instead of fixing** — turned off enforcement layers instead of tuning them

### The Auditor Fixed It by Doing the Opposite:
1. Built working code first, documented second
2. Consolidated instead of accumulated (89 → 37 files)
3. Implemented what was only described (RGE, SRE, consolidated firewall)
4. Verified mechanically (evidence gates, L10 filesystem checks)
5. Enabled all enforcement (no disabled layers)

---

## Problem-Solving Approaches

### When You Find an Unchecked Cast
1. Identify the source: is it from JSON.parse, message payload, tool args?
2. Add a type guard function for the expected shape
3. Validate before the cast, not after
4. Prefer `unknown` to `any` — force validation

### When You Find an Empty Catch Block
1. Determine what action should happen: log, retry, return error, or throw
2. Add the action with `err instanceof Error ? err.message : String(err)` for context
3. Never leave a catch block empty

### When You Find a Hardcoded Path
1. Replace the path with `os.homedir()` + `path.join()` or `os.tmpdir()` + `path.join()`
2. If the path is in agent instructions, use environment-relative references
3. If the path is in tests, use `path.join(__dirname, ...)`

### When You Find Sync I/O in an Async Context
1. Replace `*Sync` methods with `fs.promises.*`
2. Add `await` keyword
3. Handle errors with try/catch
4. If the function is currently sync, make it async (this propagates — fix all callers)

### When You Need to Verify Runtime Grade
1. Run the RGE: `execution_brain_analyze(projectRoot=...)` — verify zero CRITICAL violations
2. Run the SRE (part of the same call): verify zero CRITICAL violations
3. Container test: TUI identity test, firewall adversarial test, cluster lifecycle test
4. Collect ContainerTestResult.json with passRate >= 0.90
5. Only then can you call it "runtime grade"
