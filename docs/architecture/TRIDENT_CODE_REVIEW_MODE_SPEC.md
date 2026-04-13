# Trident Brain — Code Review Mode
## Context Library & Architecture Specification

**Version:** 1.0.0  
**Status:** PLANNED  
**Date:** 2026-04-13  
**Classification:** ARCHITECTURE DECISION  

---

## 1. EXECUTIVE SUMMARY

### Purpose
Code Review Mode is a **5-layer self-contained reasoning mode** for Trident Brain that provides on-demand injectable intelligence for deep code analysis. Triggered via `/trident review <target>`, it produces markdown artifacts designed for consumption by other agents.

### Design Philosophy
- **On-demand only** — Does not replace Shark infrastructure
- **Injectable output** — Artifacts designed for other agents to consume
- **Self-contained** — No external SAST dependencies
- **Mechanical enforcement** — Evidence-based layer progression

### Trigger
```bash
/trident review <target> [--depth=5] [--category=all]
```

---

## 2. FAILURE TAXONOMY (From 37+ Forensic Events)

### Category 1: SIMULATED EXECUTION
| Pattern | Detection |
|---------|-----------|
| `setTimeout(() => resolve({success:true}), 100)` | Regex: `setTimeout.*resolve.*success` |
| `// In v1, we just return success` | Comment detection |
| `// Full implementation would...` | TODO patterns in comments |
| Bundle size reduction >80% vs previous version | File size diff analysis |
| No actual work despite "success" | Execution trace verification |

**Source:** Kraken V2.0 catastrophic failure — entire Docker spawning removed, replaced with 100ms timeout returning success

### Category 2: HOOK SPILLOVER (Agent Isolation Failure)
| Pattern | Detection |
|---------|-----------|
| `isXxxAgent()` returning false when agent undefined | Hook input validation |
| Hooks firing for ALL agents instead of target | Agent field presence check |
| Module-level globals (`_currentPhase`) not syncing | Global state detection |
| `agent` field missing from hook inputs | Hook signature validation |
| Premature auto-registration before agent identification | Hook execution order analysis |

**Source:** Manta V4.5 hook bypass — all enforcement silently bypassed in CLI mode; Hermes blocking Spider due to `_currentPhase` global

### Category 3: VERIFICATION THEATER
| Pattern | Detection |
|---------|-----------|
| Tests pass without testing real functionality | Test coverage analysis |
| "All 373 tests passing" + broken core | Test success vs functional verification |
| Empty catch blocks | AST: `catch {}` or `catch(e) {}` |
| Missing error telemetry | Missing `console.error`, `events.emit` |

**Source:** Hive Mind plugin — 373 tests passing while core features completely inert

### Category 4: SILENT ERROR SWALLOWING
| Pattern | Detection |
|---------|-----------|
| `catch {}` - empty catch | AST analysis |
| `catch(e) {}` - swallow without logging | AST + log statement check |
| Returns normally despite error | Return statement analysis |
| No events on critical paths | Event emitter usage check |

**Source:** Multiple forensic reports — silent failures throughout codebase

### Category 5: RESOURCE LEAKS
| Pattern | Detection |
|---------|-----------|
| Module-level globals never reset | Global scope analysis |
| 5GB RAM/session vs 100MB benchmark | Memory footprint detection |
| 100k tokens/message vs 4k benchmark | Token count analysis |
| Stale Docker containers | Container lifetime analysis |
| Event listeners without cleanup | Listener registration check |

**Source:** Shark agent memory audit — 5GB RAM/session; Token bloat forensic — 100k tokens/message

### Category 6: FIREWALL BYPASS
| Pattern | Detection |
|---------|-----------|
| Guardian blocking ALL agents | Rule scope analysis |
| Missing vanilla agent entries in authority rules | Rules table completeness |
| Hook bypass when agent undefined | Guard clause verification |
| Missing anti-derailment layer | Firewall rule coverage |

**Source:** Spider agent write blocking — build/plan agents blocked; Guardian firewall over-blocking

### Category 7: CROSS-PLUGIN POLLUTION
| Pattern | Detection |
|---------|-----------|
| 9+ sub-agents each getting 100k tokens | Context distribution analysis |
| hermes_remember used for unrelated projects | Context source verification |
| Hooks injecting into other plugin responses | Phase/global state analysis |

**Source:** Cross-plugin architecture audit — `_currentPhase` globals, context injection

### Category 8: DERAILMENT BEHAVIORS
| Pattern | Detection |
|---------|-----------|
| "Host testing already proves it works" | Host fallback detection |
| "Use a mock approach" | Mock/stub suggestion detection |
| Using banned models (GLM, DeepSeek fallback) | Model usage verification |
| hermes_remember for unrelated projects | Scope creep detection |
| "Already Verified" claim without container test | Evidence completeness |

**Source:** Derailment forensic analysis — 37 events across 14 categories, 100% derailment success rate

### Category 9: ARCHITECTURAL FLAWS
| Pattern | Detection |
|---------|-----------|
| Circular dependencies | Import cycle detection |
| God files (>1000 lines) | File size analysis |
| Tight coupling | Import coupling analysis |
| Theatrical code (exists but never called) | Dead code detection |
| Bundle size 90% smaller than previous | Version diff analysis |

**Source:** Multiple forensic reports — theatrical code, architectural violations

### Category 10: CONFIG/INTEGRATION FAILURES
| Pattern | Detection |
|---------|-----------|
| Plugin fails to load silently | Startup verification |
| Missing @opencode-ai/plugin dependency | Import validation |
| Cluster not found | Cluster existence check |
| Tool "requires shim implementation" | Stub detection |

**Source:** Broken plugins audit — Hive Mind missing dependency; Kraken parallel execution — cluster not found

---

## 3. LAYER ARCHITECTURE

### Layer 1: STRUCTURE MAP
**Purpose:** "What is the architecture?"

**Outputs:**
- Complete file tree with size/bundle info
- Dependency graph (import/require relationships)
- Module boundaries and entry points
- Version diff vs previous version (bundle size, line counts)

**Detectors:**
| Detector | Purpose | Severity Thresholds |
|----------|---------|---------------------|
| `BundleSizeDetector` | Compares bundle to previous version | >50% reduction = WARNING, >80% = BLOCKER |
| `DependencyGraphDetector` | Maps import/require relationships | >10 imports = WARNING |
| `EntryPointDetector` | Identifies main/entry files | Missing main = WARNING |
| `FileSizeAnomalyDetector` | Flags files >1000 lines (god files) | >1000 lines = WARNING, >2000 = BLOCKER |

**Gate Criteria:** Target identified, files accessible, dependency graph complete

---

### Layer 2: EXECUTION VERIFICATION
**Purpose:** "Does the code actually execute?"

**Outputs:**
- Execution flow map
- Placeholder detection results
- Simulated execution patterns found
- Dead code identification

**Detectors:**
| Detector | Purpose | Patterns |
|----------|---------|----------|
| `SimulatedExecutionDetector` | Finds fake execution | `setTimeout.*resolve.*success`, `Promise.*100` |
| `PlaceholderCommentDetector` | Finds incomplete TODO comments | `In v1.*`, `Full implementation.*`, `would actually.*` |
| `StubFunctionDetector` | Finds empty implementations | `return new Promise.*setTimeout`, `// FAKE` |
| `DeadCodeDetector` | Finds unreachable code | Functions never imported, exports never used |

**Gate Criteria:** No simulated execution patterns found, all stubs resolved

---

### Layer 3: SECURITY & SAFETY ANALYSIS
**Purpose:** "What vulnerabilities exist?"

**Outputs:**
- Vulnerability list with severity (BLOCKER/WARNING/SUGGESTION)
- Injection vectors mapped
- Auth/authz issues identified
- Secret exposures flagged

**Detectors:**
| Detector | Purpose | Severity |
|----------|---------|----------|
| `SQLInjectionDetector` | String concatenation in SQL | BLOCKER |
| `XSSDetector` | innerHTML, document.write, dangerouslySetInnerHTML | BLOCKER |
| `CommandInjectionDetector` | exec(), spawn() with shell strings | BLOCKER |
| `EvalUsageDetector` | eval(), Function() with dynamic input | BLOCKER |
| `HardcodedSecretDetector` | API keys, passwords, tokens in code | BLOCKER |
| `PathTraversalDetector` | User input in file paths without validation | WARNING |

**Gate Criteria:** No BLOCKER vulnerabilities, HIGH vulnerabilities documented

---

### Layer 4: ARCHITECTURE & ISOLATION
**Purpose:** "How do components interact?"

**Outputs:**
- Coupling map
- Hook spillover risks
- Cross-plugin contamination risks
- Circular dependency chains

**Detectors:**
| Detector | Purpose | Severity |
|----------|---------|----------|
| `ImportCycleDetector` | Circular import chains | BLOCKER |
| `HookSpilloverDetector` | Missing `isXxxAgent()` checks | BLOCKER |
| `GlobalStateDetector` | Module-level globals not reset | WARNING |
| `AgentIsolationDetector` | Hooks firing for wrong agents | BLOCKER |
| `ContextLeakDetector` | Context bleeding between plugins | WARNING |

**Gate Criteria:** No import cycles, no hook spillover risks

---

### Layer 5: QUALITY & RESOURCE ANALYSIS
**Purpose:** "What are the resource implications?"

**Outputs:**
- Memory leak risks
- Token bloat risks
- Error swallowing patterns
- Quality hotspots
- Complexity analysis

**Detectors:**
| Detector | Purpose | Severity |
|----------|---------|----------|
| `EmptyCatchBlockDetector` | `catch {}` or `catch(e) {}` without logging | WARNING |
| `SilentFailureDetector` | Operations that return normally on error | WARNING |
| `MemoryLeakDetector` | Global state, event listeners without cleanup | WARNING |
| `TokenBloatDetector` | Large tool outputs without summarization | WARNING |
| `ComplexityHotspotDetector` | Cyclomatic complexity >10 | SUGGESTION |
| `TestCoverageDetector` | Missing tests for critical paths | WARNING |

**Gate Criteria:** No BLOCKER quality issues, memory risks documented

---

## 4. DETECTION ENGINE ARCHITECTURE

### Interface Definition
```typescript
interface Finding {
  severity: 'BLOCKER' | 'WARNING' | 'SUGGESTION';
  category: string;
  layer: 1 | 2 | 3 | 4 | 5;
  file: string;
  line?: number;
  pattern: string;
  evidence: string;
  remediation: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface Detector {
  name: string;
  layer: 1 | 2 | 3 | 4 | 5;
  patterns: RegExp[];
  detect(context: CodeReviewContext): Finding[];
}

interface CodeReviewContext {
  targetPath: string;
  fileTree: FileNode[];
  dependencyGraph: Map<string, string[]>;
  previousVersion?: {
    bundleSize: number;
    fileSizes: Map<string, number>;
  };
}
```

### Pattern Library

```typescript
// Layer 2: Execution Verification
const SIMULATED_EXECUTION_PATTERNS = [
  /setTimeout\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?resolve\s*\(\s*\{[^}]*success[^}]*\}/,
  /return\s+new\s+Promise\s*\(\s*resolve\s*=>\s*setTimeout/,
  /\/\/\s*In\s+v\d+.*?(simulate|fake|placeholder)/i,
  /\/\/\s*Full\s+implementation\s+would/,
];

// Layer 3: Security
const SQL_INJECTION_PATTERNS = [
  /['"`].*?SELECT.*?\+.*?['"`]/i,
  /['"`].*?INSERT.*?\+.*?['"`]/i,
  /['"`].*?UPDATE.*?\+.*?['"`]/i,
  /['"`].*?DELETE.*?\+.*?['"`]/i,
];

const XSS_PATTERNS = [
  /\.innerHTML\s*=/,
  /document\.write\s*\(/,
  /dangerouslySetInnerHTML/,
  /v-html\s*=/,
];

const COMMAND_INJECTION_PATTERNS = [
  /exec\s*\(\s*`/,
  /exec\s*\(\s*['"].*?\+/,
  /spawn\s*\(\s*['"].*?\+/,
];

const SECRET_PATTERNS = [
  /api[_-]?key\s*[=:]\s*['"][a-zA-Z0-9]{20,}/i,
  /password\s*[=:]\s*['"][^'"]{8,}/,
  /secret[_-]?key\s*[=:]\s*['"][a-zA-Z0-9]{20,}/i,
  /token\s*[=:]\s*['"][a-zA-Z0-9_-]{20,}/i,
];

// Layer 4: Architecture
const GLOBAL_STATE_PATTERNS = [
  /^const\s+_[A-Z]\w*\s*=/m,
  /^let\s+_[A-Z]\w*\s*=/m,
  /^var\s+_[A-Z]\w*\s*=/m,
];

const HOOK_SPILLOVER_PATTERNS = [
  /isSharkAgent\s*\(\s*\w+\s*\)/,
  /isMantaAgent\s*\(\s*\w+\s*\)/,
  /isReviewAgent\s*\(\s*\w+\s*\)/,
];

// Layer 5: Quality
const EMPTY_CATCH_PATTERNS = [
  /catch\s*\(\s*\)\s*\{\s*\}/,
  /catch\s*\(\s*\w+\s*\)\s*\{\s*\}/,
  /catch\s*\{\s*\}/,
];

const COMPLEXITY_PATTERNS = [
  /if\s*\(.*?\)\s*\{[\s\S]*?if\s*\(.*?\)/,  // Nested if
  /for\s*\([\s\S]*?\)[\s\S]*?for\s*\([\s\S]*?\)/,  // Nested loops
];
```

---

## 5. INJECTABLE ARTIFACT FORMAT

```markdown
# CODE REVIEW REPORT: {target}
**Generated:** {timestamp}  
**Trident Brain v1.0 | Code Review Mode**  
**Iteration:** {V1.0 | V1.1 | ...}  

---

## EXECUTIVE SUMMARY
| Metric | Count |
|--------|-------|
| Files Analyzed | {n} |
| Lines of Code | {n} |
| BLOCKERS | {n} |
| WARNINGS | {n} |
| SUGGESTIONS | {n} |
| Previous Version Bundle Size | {n} KB |
| Current Bundle Size | {n} KB |
| Bundle Size Change | {+/-n%} |

---

## LAYER 1: STRUCTURE MAP
### Files Analyzed
| File | Size | Lines | Type |
|------|------|-------|------|
| {file} | {n}KB | {n} | {js/ts/py} |

### Version Diff
- Previous bundle size: {n} KB
- Current bundle size: {n} KB
- Change: {+/-n%} {WARNING if >50% reduction / BLOCKER if >80%}

---

## LAYER 2: EXECUTION VERIFICATION
### Simulated Execution Patterns Found
| Severity | File | Line | Evidence |
|----------|------|------|----------|
| BLOCKER | {file} | {n} | `setTimeout...resolve({success:true})` |

### Placeholder Comments Found
| Severity | File | Line | Comment |
|----------|------|------|---------|
| WARNING | {file} | {n} | "// In v1, we just..." |

---

## LAYER 3: SECURITY VULNERABILITIES
### Critical (BLOCKER)
| Vulnerability | File | Line | Evidence |
|---------------|------|------|----------|
| SQL Injection | {file} | {n} | `query = "SELECT * FROM " + table` |

---

## LAYER 4: ARCHITECTURE ISSUES
### Hook Spillover Risks
| Severity | File | Line | Issue |
|----------|------|------|-------|
| BLOCKER | {file} | {n} | `isMantaAgent(agent)` where agent can be undefined |

### Import Cycles
| Cycle | Severity | Files |
|-------|----------|-------|
| A → B → A | BLOCKER | file1.ts, file2.ts |

---

## LAYER 5: QUALITY HOTSPOTS
### Empty Catch Blocks
| Severity | File | Line | Remediation |
|----------|------|------|-------------|
| WARNING | {file} | {n} | Add error logging |

---

## CRITICAL FINDINGS SUMMARY
### BLOCKERS (Must Fix)
1. **[Simulated Execution]** {file}:{line} - {description}

### WARNINGS (Should Fix)
1. **[Dead Code]** {file}:{line} - {description}

---

*Generated by Trident Brain - Code Review Mode v1.0*
*DO NOT EDIT - Injectable artifact*
```

---

## 6. FILE STRUCTURE

```
trident-brain-export/src/modes/
├── planning/index.ts              (existing)
├── problem-solving/index.ts       (existing)
├── context-synthesis/index.ts     (existing)
└── code-review/                   (NEW)
    ├── index.ts                   # CodeReviewMode class
    ├── layers.ts                  # 5 layer definitions + outputs
    ├── detectors/                # Self-contained detection
    │   ├── index.ts              # Detector registry
    │   ├── execution.ts          # Layer 2 detectors
    │   ├── security.ts           # Layer 3 detectors
    │   ├── architecture.ts       # Layer 4 detectors
    │   ├── quality.ts            # Layer 5 detectors
    │   └── structure.ts          # Layer 1 detectors
    ├── artifacts/
    │   └── review-report.ts      # Injectable markdown generator
    └── tests/
        └── detectors.test.ts      # Unit tests for detectors
```

---

## 7. GATE CHAIN

| Gate | Blocking Criteria | Evidence Required |
|------|-------------------|-------------------|
| **plan** | Target identified, files accessible | TargetSpec.json |
| **review** | All 5 layers completed | Layer1-5 outputs |
| **verify** | Critical issues confirmed, re-analysis passes | VerificationReport.json |
| **audit** | No new issues introduced | AuditReport.json |
| **delivery** | Review artifact generated | ReviewReport.md |

---

## 8. IMPLEMENTATION TASKS

### Task 1: Create Code Review Mode Skeleton
- Create `src/modes/code-review/index.ts`
- Create layer definitions in `layers.ts`
- Add to `ModeCoordinator` registry

### Task 2: Implement Layer 1 Detectors
- BundleSizeDetector
- DependencyGraphDetector
- EntryPointDetector
- FileSizeAnomalyDetector

### Task 3: Implement Layer 2 Detectors
- SimulatedExecutionDetector
- PlaceholderCommentDetector
- StubFunctionDetector
- DeadCodeDetector

### Task 4: Implement Layer 3 Detectors (Security)
- SQLInjectionDetector
- XSSDetector
- CommandInjectionDetector
- EvalUsageDetector
- HardcodedSecretDetector
- PathTraversalDetector

### Task 5: Implement Layer 4 Detectors (Architecture)
- ImportCycleDetector
- HookSpilloverDetector
- GlobalStateDetector
- AgentIsolationDetector
- ContextLeakDetector

### Task 6: Implement Layer 5 Detectors (Quality)
- EmptyCatchBlockDetector
- SilentFailureDetector
- MemoryLeakDetector
- TokenBloatDetector
- ComplexityHotspotDetector
- TestCoverageDetector

### Task 7: Implement Artifact Generator
- ReviewReportGenerator
- Injectable markdown formatting
- Severity aggregation

### Task 8: Add /trident Command Handler
- Parse `/trident review <target>`
- Initialize CodeReviewMode
- Route to Layer 1

---

## 9. SUCCESS CRITERIA

### Must Have
- [ ] `/trident review <path>` triggers full 5-layer analysis
- [ ] All 25 detectors implemented and functional
- [ ] Injectable markdown artifact generated
- [ ] No simulated execution patterns bypass detection
- [ ] Hook spillover risks identified

### Should Have
- [ ] Review history across iterations (V1.0 → V1.1)
- [ ] Git diff integration for version comparison
- [ ] Severity-based filtering

### Could Have
- [ ] Auto-fix suggestions
- [ ] CI/CD integration
- [ ] Real-time monitoring mode

---

## 10. REFERENCES

### Forensic Sources
| Source | Location | Key Learnings |
|--------|----------|---------------|
| Kraken V2.0 Catastrophic Failure | `DEBUG LOGS/13-kraken-catastrophic-failure-20260413_005709/` | Simulated execution, 100ms fake delays, 90% bundle reduction |
| Derailment Forensic Analysis | `DERAILMENT_FORENSIC_ANALYSIS.md` | 37 events, 14 categories, learned helplessness |
| Manta Hook Bypass | `manta-hook-bypass-critical-audit.md` | Agent undefined in hook inputs, all enforcement bypassed |
| Token Bloat Report | `token-bloat-forensic-report.md` | 100k tokens/message, no context truncation |
| Shark Memory Audit | `shark-agent-memory-audit-2026-04-09.md` | 5GB RAM/session, hook injection adds content |
| Cross-Plugin Audit | `KEY PLUGIN FAILURES/CROSS-PLUGIN-ARCHITECTURE-AUDIT.md` | _currentPhase globals, hook spillover |
| Reasoning Brain Failure | `06-system-failures/REASONING_BRAIN_CRITICAL_FAILURE_REPORT.md` | Unauthorized destructive commands, false success declarations |
| Firewall Crash Test | `06-system-failures/FIREWALL_CRASH_TEST_REPORT.md` | 8/9 firewalls failed, theatrical code allowed |
| Hive Mind Failure | `03-hive-mind/HIVE-MIND-PLUGIN-FAILURE-LOG.md` | Verification theater, 373 tests passing + broken core |
| Spider Agent Forensic | `01-spider-agent/SPIDER_AGENT_FORENSIC_REPORT.md` | 68k lines, 11 agents, hook system analysis |

### Architecture References
| Component | Location |
|-----------|----------|
| Trident Brain | `trident-brain-export/src/` |
| Shark Gates | `kraken-agent-v1.1/shark-agent/src/shared/gates.ts` |
| Manta Coordinator | `kraken-agent-v1.1/manta-agent/` |

---

## 11. DESIGN PRINCIPLES

1. **Pure Reasoning** — No execution, only analysis
2. **Injectable Output** — Artifacts designed for other agents
3. **Mechanical Gates** — Cannot advance without evidence
4. **Self-Contained** — No external SAST dependencies
5. **Layered Depth** — Each layer goes deeper into analysis
6. **First Principles** — Detect root causes, not symptoms

---

*Document Version: 1.0.0*
*Trident Brain - Code Review Mode Specification*
*Status: READY FOR IMPLEMENTATION*
*Created: 2026-04-13*
