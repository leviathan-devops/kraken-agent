# Kraken V1.3 — Fix Plan: Phase 0 Issues

**Purpose:** Precise fix implementations for R1-R10.
**Baseline:** `/home/leviathan/Downloads/kraken-v1.3/`
**Fix Order:** R1 → R2 → R3 → R4 → R5 → R6 → R7 → R8 → R9 → R10
**Total Estimated Time:** ~1.5 hours

---

## R1: Guard Non-Null Assertions

### File: `src/index.ts`

**Add this function** (near the existing type guards, around line 58):
```typescript
/** Get cluster manager with null check (P2 compliance for non-null assertions) */
function getClusterManager(): ClusterManager {
  if (!clusterManager) {
    throw new Error('[KRAKEN] ClusterManager not initialized before use — initialization order violation');
  }
  return clusterManager;
}
```

**Replace 7 occurrences:**

```typescript
// Line 384: const resolvedClusterId = clusterId || clusterManager!.getClusterForTask(taskType);
→ const resolvedClusterId = clusterId || getClusterManager().getClusterForTask(taskType);

// Line 386: const taskDef = clusterManager!.createTask(taskType, task, criteria, resolvedClusterId);
→ const taskDef = getClusterManager().createTask(taskType, task, criteria, resolvedClusterId);

// Line 420: const taskDef = clusterManager!.createTask(TaskType.BUILD, task, criteria, 'cluster-alpha');
→ const taskDef = getClusterManager().createTask(TaskType.BUILD, task, criteria, 'cluster-alpha');

// Line 448: const taskDef = clusterManager!.createTask(TaskType.DEBUG, task, criteria, 'cluster-beta');
→ const taskDef = getClusterManager().createTask(TaskType.DEBUG, task, criteria, 'cluster-beta');

// Line 461: const clusters = clusterManager!.getAllClusters();
→ const clusters = getClusterManager().getAllClusters();

// Line 462: return { success: true, clusters, activeTaskCount: clusterManager!.getActiveTaskCount() };
→ const activeTaskCount = getClusterManager().getActiveTaskCount();
   return { success: true, clusters, activeTaskCount };

// Line 484: const task = clusterManager!.getTask(id);
→ const task = getClusterManager().getTask(id);
```

**Verification:**
- Build: `bun build` — should succeed
- Grep: `grep -n "clusterManager!" src/index.ts` — should return ZERO results

---

## R2: Add AuditEntry Schema Validation

### File: `src/system-brain/firewall/audit.ts`

**Add validator function** (after imports, around line 12):
```typescript
/** Runtime validator for AuditEntry shape — ensures JSON.parse result matches interface */
function isValidAuditEntry(obj: unknown): obj is Required<AuditEntry> {
  if (typeof obj !== 'object' || obj === null) return false;
  const record = obj as Record<string, unknown>;
  return (
    typeof record.timestamp === 'string' &&
    typeof record.agent === 'string' &&
    typeof record.tool === 'string' &&
    typeof record.operationType === 'string' &&
    typeof record.layer === 'string' &&
    typeof record.blocked === 'boolean' &&
    typeof record.reason === 'string' &&
    typeof record.correction === 'string' &&
    typeof record.sessionId === 'string'
  );
}
```

**Replace lines 58-68** (the JSON.parse and cast):
```typescript
try {
  const parsed = JSON.parse(line);
  if (!isValidAuditEntry(parsed)) {
    console.error(`[FirewallAudit] Malformed audit entry: missing required fields`);
    continue;
  }
  const entry = parsed;  // Validated above — no cast needed
  if (this.matchesFilter(entry, filter)) {
    entries.push(entry);
  }
} catch (err: unknown) {
```

**Verification:**
- Build: `bun build` — should succeed
- Grep: `grep -n "as unknown as AuditEntry" src/system-brain/firewall/audit.ts` — ZERO results

---

## R3: Replace Double Cast with Spread

### File: `src/system-brain/firewall/audit.ts`

**Replace lines 83-86** (the matchesFilter function and its usage):

The `matchesFilter` method takes `AuditEntry` and casts to `Record<string, unknown>`. Instead, use a spread:

```typescript
private matchesFilter(entry: AuditEntry, filter: Partial<AuditEntry>): boolean {
  for (const [key, value] of Object.entries(filter)) {
    if (value !== undefined && (entry as Record<string, unknown>)[key] !== value) {
      return false;
    }
  }
  return true;
}
```

Wait — this still has a cast. Better approach: remove the cast entirely by accessing properties directly:

Actually, `matchesFilter` is called with Partial<AuditEntry> where key/value types match. The simplest fix that eliminates the double cast:

```typescript
private matchesFilter(entry: AuditEntry, filter: Partial<AuditEntry>): boolean {
  for (const key of Object.keys(filter) as (keyof AuditEntry)[]) {
    if (filter[key] !== undefined && entry[key] !== filter[key]) {
      return false;
    }
  }
  return true;
}
```

This uses `keyof AuditEntry` which is type-safe. The `as` cast is from `string[]` to `(keyof AuditEntry)[]`, which is acceptable since we're iterating keys of the filter.

**Verification:**
- Build: `bun build` — should succeed
- Grep: `grep -n "as unknown as Record" src/system-brain/firewall/audit.ts` — ZERO results

---

## R4: Add JSON Parse Validation

### File: `src/system-brain/firewall/semantic-anti-bullshit.ts`

**Replace lines 247-253** (the JSON.parse block):
```typescript
// Parse the file
try {
  const fileContent = fs.readFileSync(resultPath, 'utf-8');
  const raw = JSON.parse(fileContent);
  
  // Validate parsed result is a non-null object
  if (typeof raw !== 'object' || raw === null) {
    result.valid = false;
    result.detail = `ContainerTestResult.json is not a valid JSON object`;
    return result;
  }
  
  const parsed = raw as Record<string, unknown>;  // Safe: validated above
  result.evidenceExists = true;

  // Extract passRate
  if (typeof parsed.passRate === 'number') {
    result.passRate = parsed.passRate;
  } else if (typeof parsed.total === 'number' && typeof parsed.passed === 'number') {
    result.passRate = parsed.total > 0 ? parsed.passed / parsed.total : 0;
  }
  // ... rest unchanged
```

**Verification:**
- Build: `bun build` — should succeed
- Grep: `grep -n "JSON.parse.*as Record" src/system-brain/firewall/semantic-anti-bullshit.ts` — ZERO results

---

## R5: Convert readdirSync to Async

### File: `src/execution-brain/index.ts`

**Replace the `collectSourceFiles` method:**

```typescript
private async collectSourceFiles(projectRoot: string): Promise<string[]> {
  const extensions = ['.ts', '.tsx'];
  const files: string[] = [];

  async function walk(dir: string): Promise<void> {
    let entries: fs.Dirent[];
    try {
      entries = await fs.promises.readdir(dir, { withFileTypes: true });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[ExecutionBrain] Cannot read directory ${dir}: ${errMsg}`);
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (['node_modules', 'dist', '.git', 'coverage', '.turbo'].includes(entry.name)) continue;
        await walk(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) files.push(fullPath);
      }
    }
  }

  await walk(projectRoot);
  return files;
}
```

**Update the analyze method to use await:**

Line 49: `const sourceFiles = this.collectSourceFiles(projectRoot);`
→ `const sourceFiles = await this.collectSourceFiles(projectRoot);`

**Verification:**
- Build: `bun build` — should succeed
- Grep: `grep -n "readdirSync\|readFileSync\|writeFileSync\|existsSync\|mkdirSync" src/execution-brain/index.ts` — ZERO results

---

## R6: Convert Tool I/O to Async

### File: `src/index.ts` — `read_kraken_context` tool

**Replace lines 548-567:**
```typescript
execute: async (args: Record<string, unknown>) => {
  const contextFile = extractString(args, 'contextFile', '');
  if (!contextFile) {
    return { success: false, error: 'contextFile parameter is required' };
  }

  const fs = await import('fs');
  const path = await import('path');
  const os = await import('os');

  const contextDir = path.join(os.homedir(), '.kraken', 'kraken-context');
  const candidatePath = path.resolve(contextDir, `${contextFile}.md`);

  try {
    // fs.promises.readFile throws if file doesn't exist — this replaces existsSync + readFileSync
    const content = await fs.promises.readFile(candidatePath, 'utf-8');
    return { success: true, contextFile, content, path: candidatePath };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    // Distinguish between "file not found" and "IO error"
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return { success: false, error: `Context file '${contextFile}' not found in ${contextDir}` };
    }
    logger.error(`Failed to read context file ${contextFile}: ${errMsg}`);
    return { success: false, error: `Failed to read context file: ${errMsg}` };
  }
},
```

**Verification:**
- Build: `bun build` — should succeed
- Grep: `grep -n "existsSync\|readFileSync" src/index.ts` — check if only remaining ones are in proper places

---

## R7: Convert Evidence Collector to Async

### File: `src/shared/evidence-collector.ts`

**Replace the entire class:**

```typescript
class EvidenceCollector {
  private evidence: Map<string, EvidenceData[]> = new Map();
  private evidenceDir: string;

  constructor(evidenceDir?: string) {
    this.evidenceDir = evidenceDir ?? path.join(os.homedir(), '.kraken', 'evidence');
  }

  collect(gate: string, type: string, payload: Record<string, unknown>): void {
    const data: EvidenceData = {
      gate,
      type,
      payload,
      timestamp: Date.now(),
    };
    const existing = this.evidence.get(gate) || [];
    existing.push(data);
    this.evidence.set(gate, existing);
  }

  async persist(gate: string): Promise<void> {
    const entries = this.evidence.get(gate);
    if (!entries || entries.length === 0) {
      logger.warn(`No evidence to persist for gate: ${gate}`);
      return;
    }

    try {
      const gateDir = path.join(this.evidenceDir, gate);
      await fs.promises.mkdir(gateDir, { recursive: true });
      const filePath = path.join(gateDir, `evidence-${Date.now()}.json`);
      await fs.promises.writeFile(filePath, JSON.stringify(entries, null, 2), 'utf-8');
      logger.info(`Evidence persisted for gate ${gate}: ${filePath}`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to persist evidence for gate ${gate}: ${errMsg}`);
    }
  }

  getEvidence(gate: string): EvidenceData[] {
    return this.evidence.get(gate) || [];
  }
}
```

**Update caller in `src/index.ts`** (lines 809-825 in `tool.execute.before`):

```typescript
// Collect evidence after firewall passes
try {
  const evidence = getEvidenceCollector();
  const state = getStateStore().getState();
  if (state.initialized) {
    evidence.collect(state.currentGate, 'output', {
      tool: toolName,
      agent: agentName,
      timestamp: Date.now(),
    });
    await evidence.persist(state.currentGate);  // Added await
  }
} catch (err: unknown) { ... }
```

Also update the `experimental.session.compacting` hook (line 909):

```typescript
// Persist evidence for current gate
await evidence.persist(state.currentGate);  // Added await
```

**Verification:**
- Build: `bun build` — should succeed
- Grep: `grep -n "existsSync\|mkdirSync\|writeFileSync\|readFileSync" src/shared/evidence-collector.ts` — ZERO results

---

## R8: Convert Audit Log to Async

### File: `src/system-brain/firewall/audit.ts`

**Replace the `log` method:**

```typescript
async log(entry: AuditEntry): Promise<void> {
  try {
    const line = JSON.stringify(entry) + '\n';
    await fs.promises.appendFile(this.logPath, line, 'utf-8');
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[FirewallAudit] Failed to write audit entry: ${errMsg}`);
  }
}
```

**Update caller in `src/system-brain/firewall/index.ts`** (line 132-147 in `logDecision`):

```typescript
private async logDecision(context: FirewallContext, result: FirewallResult): Promise<void> {
  const entry: AuditEntry = {
    timestamp: new Date().toISOString(),
    agent: context.agent,
    tool: context.tool,
    operationType: context.operationType,
    layer: result.layer,
    blocked: result.blocked,
    reason: result.reason,
    command: context.command,
    correction: result.blocked ? (result as BlockResult).correction : '',
    sessionId: context.sessionId,
  };
  await this.audit.log(entry);  // Added await
}
```

Also update the `enforce` method to await the log:

```typescript
// Line 69: this.logDecision(context, result);
await this.logDecision(context, result);  // Added await
```

And update `enforceFirewall` to handle the fact that `enforce` is now async... wait. If `enforce` becomes async, it propagates to `enforceFirewall` which propagates to the hook handler. That's fine since the hook handler is already async.

Actually, let me think about this more carefully. Making `enforce` async is a bigger change. Let me make `log` fire-and-forget (with `.catch()`) instead, to minimize propagation while still fixing the I/O:

```typescript
log(entry: AuditEntry): void {
  try {
    const line = JSON.stringify(entry) + '\n';
    fs.promises.appendFile(this.logPath, line, 'utf-8').catch((err: unknown) => {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[FirewallAudit] Failed to write audit entry: ${errMsg}`);
    });
  } catch (err: unknown) {
    // Sync catch only handles JSON.stringify errors
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[FirewallAudit] Failed to serialize audit entry: ${errMsg}`);
  }
}
```

This is fire-and-forget but with proper `.catch()` handling (P9 compliant). The `enforce` method stays synchronous. The audit write happens in the background.

**Verification:**
- Build: `bun build` — should succeed
- Grep: `grep -n "appendFileSync\|writeFileSync\|readFileSync\|existsSync\|mkdirSync" src/system-brain/firewall/audit.ts` — check

---

## R9: Firewall Fail-Open → Fail-Closed

### File: `src/system-brain/firewall/index.ts`

**Replace the enforce loop (lines 58-75):**

```typescript
for (const layer of this.layers) {
  try {
    result = layer.check(context);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Firewall] Layer ${layer.name} threw error: ${errMsg}`);
    // Default-deny: block when a layer throws (safest option)
    result = {
      blocked: true,
      layer: `${layer.name}_ERROR`,
      reason: `Firewall layer ${layer.name} threw exception: ${errMsg}`,
      correction: 'Firewall layer error — contact Kraken administrator',
    } as BlockResult;
  }

  // Log the decision
  this.logDecision(context, result);

  // If blocked, return immediately
  if (result.blocked) {
    return result;
  }
}
```

**Verification:**
- Build: `bun build` — should succeed
- Test: Cause a firewall layer to throw (e.g., by providing invalid input) and verify it blocks

---

## R10: Add JSON Parse Type Guard

### File: `src/system-brain/firewall/evidence-gate.ts`

**Replace the JSON.parse block (lines 99-117):**

```typescript
// Special check for test/verify/audit/delivery: verify ContainerTestResult.json passRate
if (['test', 'verify', 'audit', 'delivery'].includes(gate)) {
  const resultPath = this.resolvePath('ContainerTestResult.json');
  if (fs.existsSync(resultPath)) {
    try {
      const content = fs.readFileSync(resultPath, 'utf-8');
      const raw = JSON.parse(content);
      
      // Validate parsed result is a non-null object
      if (typeof raw !== 'object' || raw === null) {
        missing.push('ContainerTestResult.json (not a valid JSON object)');
        return;
      }
      
      const parsed = raw as Record<string, unknown>;  // Safe: validated above
      const overallPassed = typeof parsed.overallPassed === 'boolean' ? parsed.overallPassed : undefined;
      const passRate = typeof parsed.passRate === 'number' ? parsed.passRate : undefined;
      
      if (overallPassed === false && (passRate ?? 0) < 0.90) {
        missing.push('ContainerTestResult.json (passRate < 0.90)');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      missing.push(`ContainerTestResult.json (cannot parse: ${errMsg})`);
    }
  }
}
```

Note: R10 also has `existsSync` which is P4-violating sync I/O. For the evidence-gate, this is acceptable because it's a one-time check at gate advancement (not a hot path). The old codebase has the same pattern. We document this as an acceptably narrow exception.

**Verification:**
- Build: `bun build` — should succeed

---

## Post-Fix Verification

After all 10 fixes are applied:

### 1. Build
```bash
cd /home/leviathan/Downloads/kraken-v1.3
bun build src/index.ts --outdir dist --target bun --format esm --bundle --external @opencode-ai/plugin
```
Expected: "Bundled 32 modules in ~400ms"

### 2. Verify No Remaining Issues
```bash
# Check non-null assertions
grep -n "clusterManager!" src/index.ts
# Expected: 0 results

# Check double casts
grep -n "as unknown as" src/system-brain/firewall/audit.ts
# Expected: 0 results

# Check sync I/O in hot paths
grep -n "readdirSync\|existsSync\|writeFileSync\|appendFileSync" src/ --include="*.ts" | grep -v "test\|\.d\.ts\|node_modules"
# Expected: 0 results in execution-brain/index.ts, index.ts, evidence-collector.ts, audit.ts
# Acceptable: evidence-gate.ts (one-time check, not hot path)
```

### 3. Proceed to Container Test
See `CONTAINER_TEST_PROTOCOL.md` for full test procedure.
