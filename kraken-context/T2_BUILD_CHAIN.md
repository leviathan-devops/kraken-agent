# T2_BUILD_CHAIN.md
# Successful Build Chains from Kraken Hive
## Source: Kraken Hive - sessions/
## Last Updated: 2026-04-08

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
