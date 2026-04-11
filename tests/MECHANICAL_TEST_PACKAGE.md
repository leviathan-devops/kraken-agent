# KRAKEN AGENT — MECHANICAL TEST PACKAGE
## Algorithmic Verification System

**Version:** 1.0  
**Date:** 2026-04-08  
**Philosophy:** If we can write a test for it mechanically, we should. Reserve models only for verification that requires understanding.

---

## Test Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    KRAKEN TEST HARNESS                                  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                      TEST ORCHESTRATOR                               │ │
│  │   Sequential test runner with failure isolation                    │ │
│  │   - Runs each test in isolation                                    │ │
│  │   - Captures all output/data                                       │ │
│  │   - Reports pass/fail/fail-fast                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                      │
│  ┌────────────────────────────────▼────────────────────────────────────┐ │
│  │                    TEST COMPONENTS                                  │ │
│  │                                                                      │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │ │
│  │  │ Cluster Tests │  │  Hive Tests  │  │ Delegation  │            │ │
│  │  │              │  │              │  │   Tests     │            │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘            │ │
│  │                                                                      │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │ │
│  │  │  Tool Tests  │  │  Hook Tests │  │  Isolation  │            │ │
│  │  │              │  │              │  │   Tests    │            │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘            │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                      │
│                                    ▼                                      │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                      TEST ARTIFACTS                                 │ │
│  │   Every test captures: input, output, timing, state, evidence     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Test Categories

### Category 1: CLUSTER MECHANICAL TESTS
**Purpose:** Verify cluster operations work without model involvement

#### Test 1.1: Cluster Initialization
```
Test:         Cluster initialization creates 3 clusters with correct configs
Input:        None (initialization test)
Expected:     3 clusters created, each with 3 agents
Mechanical:   Verify clusterManager.getClusterIds().length === 3
Capture:      Cluster IDs, agent counts, initial state
```

#### Test 1.2: Cluster Status Reporting
```
Test:         get_cluster_status returns correct structure
Input:        get_cluster_status()
Expected:     { clusterId, active, load: { activeTasks, pendingTasks, ... }, agents }
Mechanical:   Verify response structure matches schema
Capture:      Response JSON, timestamp, cluster loads
```

#### Test 1.3: Task Queue Per Cluster
```
Test:         Tasks queue and execute asynchronously within cluster
Input:        5 tasks to cluster-alpha
Expected:     All 5 complete, agents don't idle
Mechanical:   Track task completion times, verify parallelism
Capture:      Task IDs, start/end times, completion order
```

#### Test 1.4: Cross-Cluster Independence
```
Test:         Clusters execute independently (no blocking between clusters)
Input:        3 tasks (one per cluster) simultaneously
Expected:     All 3 complete in parallel, no sequential blocking
Mechanical:   Compare completion times - should overlap, not sequence
Capture:      Parallel execution timestamps
```

#### Test 1.5: Least-Load Scheduling
```
Test:         ClusterScheduler assigns to least loaded cluster
Input:        New task, cluster-alpha has 2 active, beta has 0
Expected:     Task assigned to beta
Mechanical:   Verify scheduler.assignCluster() returns beta
Capture:      Load states before/after assignment
```

#### Test 1.6: Cluster Shutdown
```
Test:         Cluster shutdown is graceful
Input:        cluster.shutdown()
Expected:     Active tasks complete, queued tasks cancelled
Mechanical:   Verify no hanging promises, state cleanup
Capture:      Shutdown time, task states after shutdown
```

---

### Category 2: HIVE MIND MECHANICAL TESTS
**Purpose:** Verify Kraken Hive operates without model involvement

#### Test 2.1: Hive Namespace Isolation
```
Test:         Kraken Hive uses separate namespace from Hive Mind
Input:        Store pattern to kraken-hive
Expected:     File exists at viking://resources/kraken-hive/ NOT hive-mind
Mechanical:   Verify filesystem path, not viking:// URI
Capture:      File path, namespace verification
```

#### Test 2.2: Pattern Storage
```
Test:         kraken_hive_remember stores pattern correctly
Input:        { key: "test-pattern", content: "...", category: "pattern" }
Expected:     File at /home/leviathan/.local/share/opencode/kraken-hive/patterns/test_pattern.md
Mechanical:   fs.existsSync check, content verification
Capture:      File content, hash, timestamp
```

#### Test 2.3: Pattern Search
```
Test:         kraken_hive_search finds stored patterns
Input:        Search query matching stored pattern
Expected:     Pattern returned with relevance > 0
Mechanical:   Verify search returns expected pattern, correct type
Capture:      Search results, relevance scores, latency
```

#### Test 2.4: Pattern Retrieval
```
Test:         kraken_hive_search returns full content on request
Input:        Search for "typescript"
Expected:     Returns pattern content, not just metadata
Mechanical:   Verify returned content matches stored content
Capture:      Retrieved content vs stored content
```

#### Test 2.5: Category Filtering
```
Test:         kraken_hive_search filters by category correctly
Input:        Search category="patterns" vs category="failures"
Expected:     Only patterns returned when filtering patterns
Mechanical:   Verify result types match filter
Capture:      Filter results, category verification
```

#### Test 2.6: Failure Storage
```
Test:         kraken_hive_remember stores failure records
Input:        { key: "test-failure", category: "failure", content: "..." }
Expected:     File at /home/leviathan/.local/share/opencode/kraken-hive/failures/
Mechanical:   fs.existsSync check in failures directory
Capture:      File path, content structure
```

#### Test 2.7: Session Memory
```
Test:         Session memories stored with session isolation
Input:        Store to session-123, search without session filter
Expected:     Stored in session-123 directory
Mechanical:   Verify directory structure, session ID in path
Capture:      Directory structure, session isolation
```

#### Test 2.8: Search Relevance Ordering
```
Test:         Search results ordered by relevance
Input:        Store 3 patterns, search that matches 2
Expected:     Higher relevance matches first
Mechanical:   Verify results[0].relevance >= results[1].relevance
Capture:      Relevance scores, ordering verification
```

---

### Category 3: DELEGATION MECHANICAL TESTS
**Purpose:** Verify async delegation works correctly

#### Test 3.1: Delegation Request Creation
```
Test:         delegate() accepts request and returns promise
Input:        Valid KrakenDelegationRequest
Expected:     Promise<KrakenDelegationResult> returned
Mechanical:   instanceof Promise check
Capture:      Request ID, promise state
```

#### Test 3.2: Task ID Generation
```
Test:         Each delegate() call generates unique task ID
Input:        10 concurrent delegate() calls
Expected:     10 unique taskIds
Mechanical:   Set.size === 10 after all complete
Capture:      Task IDs, uniqueness verification
```

#### Test 3.3: Priority Ordering
```
Test:         High priority tasks execute before normal
Input:        Queue 5 normal + 2 high priority
Expected:     High priority tasks in first 2 completions
Mechanical:   Compare completion order to priority
Capture:      Task priorities, completion order
```

#### Test 3.4: Task Cancellation
```
Test:         cancelTask() removes pending task
Input:        delegate() then cancelTask(taskId)
Expected:     Task not in active or completed
Mechanical:   Verify taskId not in getActiveTasks()
Capture:      Cancellation time, task states
```

#### Test 3.5: waitForCompletion Timeout
```
Test:         waitForCompletion times out correctly
Input:        Task that takes 5s, timeout 1s
Expected:     Returns null after timeout
Mechanical:   Verify returns null, doesn't hang
Capture:      Timeout behavior, elapsed time
```

#### Test 3.6: waitForAll Resolution
```
Test:         waitForAll waits for all tasks
Input:        3 tasks with different durations
Expected:     Returns array of 3 results
Mechanical:   Verify all 3 in returned array
Capture:      All task results, completion times
```

---

### Category 4: TOOL ACCESS MECHANICAL TESTS
**Purpose:** Verify tool access is properly isolated

#### Test 4.1: Kraken Tools Available to Kraken Agent
```
Test:         kraken, kraken-executor have kraken_hive_* tools
Input:        Call kraken_hive_remember from kraken agent
Expected:     Success, no access denied
Mechanical:   Tool executes successfully
Capture:      Tool call result, access verification
```

#### Test 4.2: Hive Tools NOT Available to Shark Agents
```
Test:         Shark agents cannot call kraken_hive_* tools
Input:        Tool call from shark-* agent
Expected:     Access denied or tool not visible
Mechanical:   Tool not in shark's tool registry
Capture:      Tool registry for shark, denial verification
```

#### Test 4.3: Hive Tools NOT Available to Manta Agents
```
Test:         Manta agents cannot call kraken_hive_* tools
Input:        Tool call from manta-* agent
Expected:     Access denied or tool not visible
Mechanical:   Tool not in manta's tool registry
Capture:      Tool registry for manta, denial verification
```

#### Test 4.4: T2 Tools Available to Shark/Manta
```
Test:         read_kraken_context available to cluster agents
Input:        Call read_kraken_context from shark agent
Expected:     Success (T2 is read-only for cluster agents)
Mechanical:   Tool executes successfully
Capture:      Tool call result, access verification
```

#### Test 4.5: T2 Tools NOT Available to Kraken
```
Test:         T2 tools are cluster-agent-only
Input:        Check if read_kraken_context in kraken tools
Expected:     Tool NOT in kraken tool registry (kraken has full Hive access)
Mechanical:   Tool registry verification
Capture:      Kraken tool list, T2 tool presence
```

#### Test 4.6: spawn_* Tools NOT Available to Cluster Agents
```
Test:         spawn_cluster_task NOT available to shark/manta
Input:        Try spawn_cluster_task from shark
Expected:     Access denied
Mechanical:   Tool not in cluster agent registry
Capture:      Tool registry verification
```

---

### Category 5: HOOK MECHANICAL TESTS
**Purpose:** Verify hooks fire correctly and track state

#### Test 5.1: Cluster State Hook Fires
```
Test:         Hook fires on chat message
Input:        Send message from kraken agent
Expected:     Hook called, session state updated
Mechanical:   Verify sessionState.clusterActivity exists
Capture:      Hook call count, session state
```

#### Test 5.2: Activity Persistence
```
Test:         Activity persisted to filesystem
Input:        Tool call from shark
Expected:     Activity file created in activity dir
Mechanical:   fs.existsSync check in activity directory
Capture:      Activity file path, content
```

#### Test 5.3: Agent-to-Cluster Mapping
```
Test:         Hook correctly maps agent to cluster
Input:        shark-alpha-1 calls tool
Expected:     Activity logged to cluster-alpha
Mechanical:   Parse activity file, verify clusterId
Capture:      Activity cluster mapping
```

---

### Category 6: ISOLATION MECHANICAL TESTS
**Purpose:** Verify zero context spillover

#### Test 6.1: Session Isolation
```
Test:         Shark session cannot see Kraken's Hive data directly
Input:        Kraken stores pattern, shark searches
Expected:     Shark search returns nothing (no direct Hive access)
Mechanical:   Shark's kraken_hive_search returns access denied or tool unavailable
Capture:      Tool availability, access verification
```

#### Test 6.2: Namespace Isolation
```
Test:         kraken-hive namespace doesn't leak to hive-mind
Input:        Store to kraken-hive
Expected:     Not visible in hive-mind namespace
Mechanical:   Filesystem check - kraken files in kraken dir only
Capture:      Directory listing verification
```

#### Test 6.3: Agent Isolation
```
Test:         Agent A cannot see Agent B's pending tasks
Input:        shark-alpha-1 has task pending
Expected:     shark-beta-1 cannot see it via get_task_status
Mechanical:   Task visibility verification
Capture:      Task visibility across agents
```

---

### Category 7: INTEGRATION TESTS
**Purpose:** Full pipeline tests

#### Test 7.1: Full Task Lifecycle
```
Test:         User → Kraken → Hive → Cluster → Result
Input:        "Store pattern X, spawn task Y, check status Z"
Expected:     All steps complete, data flows correctly
Mechanical:   Verify each step in chain
Capture:      Full execution trace
```

#### Test 7.2: Concurrent Operations
```
Test:         Multiple Kraken operations in parallel
Input:        10 simultaneous operations
Expected:     All complete, no race conditions
Mechanical:   All promises resolve, no errors
Capture:      Concurrency test results, timing
```

#### Test 7.3: Error Recovery
```
Test:         System recovers from errors gracefully
Input:        Introduce failure mid-operation
Expected:     Error caught, state consistent, operations continue
Mechanical:   Verify no hung promises, state valid
Capture:      Error handling verification
```

---

## Test Runner Implementation

```typescript
// src/tests/kraken-test-runner.ts

interface TestResult {
  name: string;
  category: string;
  status: 'pass' | 'fail' | 'error';
  durationMs: number;
  input: any;
  expected: any;
  actual: any;
  evidence: Record<string, any>;
  timestamp: string;
}

interface TestCase {
  name: string;
  category: string;
  test: () => Promise<TestResult>;
}

export class KrakenTestRunner {
  private results: TestResult[] = [];
  private startTime: number = 0;
  
  async runAll(tests: TestCase[]): Promise<TestResult[]> {
    this.startTime = Date.now();
    this.results = [];
    
    for (const testCase of tests) {
      const result = await this.runTest(testCase);
      this.results.push(result);
      
      // Fail-fast on critical failures
      if (result.status === 'fail' && testCase.category === 'ISOLATION') {
        console.log(`CRITICAL FAILURE in ${testCase.name} - stopping`);
        break;
      }
    }
    
    return this.results;
  }
  
  private async runTest(testCase: TestCase): Promise<TestResult> {
    const start = Date.now();
    
    try {
      const result = await testCase.test();
      return {
        ...result,
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: testCase.name,
        category: testCase.category,
        status: 'error',
        durationMs: Date.now() - start,
        input: null,
        expected: null,
        actual: error,
        evidence: { error: String(error) },
        timestamp: new Date().toISOString(),
      };
    }
  }
  
  generateReport(): string {
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const errors = this.results.filter(r => r.status === 'error').length;
    const total = this.results.length;
    const duration = Date.now() - this.startTime;
    
    let report = `# KRAKEN TEST REPORT
Generated: ${new Date().toISOString()}
Duration: ${duration}ms

## SUMMARY
| Status | Count |
|--------|-------|
| PASS   | ${passed} |
| FAIL   | ${failed} |
| ERROR  | ${errors} |
| TOTAL  | ${total} |

## BY CATEGORY
`;
    
    const byCategory = new Map<string, TestResult[]>();
    for (const result of this.results) {
      const existing = byCategory.get(result.category) || [];
      existing.push(result);
      byCategory.set(result.category, existing);
    }
    
    for (const [category, results] of byCategory) {
      const categoryPassed = results.filter(r => r.status === 'pass').length;
      report += `\n### ${category} (${categoryPassed}/${results.length} passed)\n`;
      
      for (const result of results) {
        const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '💥';
        report += `${icon} ${result.name} (${result.durationMs}ms)\n`;
        
        if (result.status !== 'pass') {
          report += `   Input: ${JSON.stringify(result.input)}\n`;
          report += `   Expected: ${JSON.stringify(result.expected)}\n`;
          report += `   Actual: ${JSON.stringify(result.actual)}\n`;
          report += `   Evidence: ${JSON.stringify(result.evidence)}\n`;
        }
      }
    }
    
    return report;
  }
  
  saveArtifacts(outputDir: string): void {
    const fs = require('fs');
    const path = require('path');
    
    // Save JSON results
    const jsonPath = path.join(outputDir, 'test-results.json');
    fs.writeFileSync(jsonPath, JSON.stringify(this.results, null, 2));
    
    // Save markdown report
    const mdPath = path.join(outputDir, 'test-report.md');
    fs.writeFileSync(mdPath, this.generateReport());
    
    // Save individual evidence files
    for (const result of this.results) {
      if (result.evidence && Object.keys(result.evidence).length > 0) {
        const evidencePath = path.join(outputDir, 'evidence', `${result.name}.json`);
        fs.writeFileSync(evidencePath, JSON.stringify(result.evidence, null, 2));
      }
    }
  }
}
```

---

## Test Execution Commands

```bash
# Run all tests
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent
bun run test:mechanical

# Run specific category
bun run test:cluster
bun run test:hive
bun run test:delegation
bun run test:isolation

# Run with verbose output
bun run test:mechanical --verbose

# Generate report
bun run test:mechanical --report

# Continuous monitoring (watch mode)
bun run test:watch
```

---

## Test Output Artifacts

Each test run generates:

```
tests/artifacts/
├── test-results.json      # All test results in JSON
├── test-report.md         # Human-readable report
├── evidence/
│   ├── cluster-initialization.json
│   ├── hive-pattern-storage.json
│   ├── delegation-priority.json
│   └── ...
└── logs/
    └── test-run-2026-04-08T17-00-00.log
```

---

## Acceptance Criteria

For a test run to PASS:

| Category | Required | Notes |
|----------|----------|-------|
| Cluster Tests | 6/6 pass | Critical for parallel execution |
| Hive Tests | 8/8 pass | Critical for memory isolation |
| Delegation Tests | 6/6 pass | Critical for async operations |
| Tool Access Tests | 6/6 pass | Critical for security isolation |
| Hook Tests | 3/3 pass | Critical for state tracking |
| Isolation Tests | 3/3 pass | CRITICAL - fail-fast on these |
| Integration Tests | 3/3 pass | Critical for end-to-end |

**Overall: 35/35 tests must pass for GREEN status**

---

## Running Tests in OpenCode

To run mechanical tests within OpenCode:

```
@kraken run full mechanical test suite
```

Kraken will execute the test runner and report results.

---

## Test Discovery

Tests are auto-discovered from:

```
src/tests/categories/
├── cluster-*.test.ts
├── hive-*.test.ts
├── delegation-*.test.ts
├── tool-access-*.test.ts
├── hooks-*.test.ts
├── isolation-*.test.ts
└── integration-*.test.ts
```

Each test file exports a `tests: TestCase[]` array.

---

*Test package for Kraken Agent v1.0*
*Philosophy: If we can test it mechanically, we should. Reserve models for verification only.*
