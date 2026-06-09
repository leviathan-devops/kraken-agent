# T2_FAILURE_MODES.md
# Known Failure Modes from Kraken Hive
## Source: Kraken Hive - failures/
## Last Updated: 2026-04-08

## Overview
This is the T2 reference library for known failure modes. These failures have been recorded by Kraken through agent reports andHive Mind analysis. Read this to avoid repeating past mistakes.

## Critical Failures

### Failure: Circular Dependencies
**Cause:** Modules importing each other creating circular references
**Detection:** TypeScript errors about types not being found
**Solution:** 
- Use dependency injection
- Import types only (not implementations)
- Restructure module boundaries
- Use interface segregation

### Failure: Type Errors in Production
**Cause:** Not running type check before deploy
**Detection:** `tsc` failing silently or not run
**Solution:**
- Always run `npm run typecheck` or `bun tsc --noEmit` before ship
- Add typecheck to pre-push hook
- Never bypass TypeScript errors
- Use `strict: true` in tsconfig

### Failure: Missing Error Handling
**Cause:** Async operations without try/catch or .catch()
**Detection:** Unhandled promise rejections
**Solution:**
- Always wrap async calls in try/catch
- Add .catch() to all promises
- Use explicit error types
- Log errors with context

### Failure: Memory Leaks
**Cause:** Event listeners not cleaned up, intervals not cleared
**Detection:** Memory usage growing over time
**Solution:**
- Clean up all event listeners
- Clear intervals/timeouts
- Use weak references where appropriate
- Track resource allocation

## Common Implementation Failures

### Failure: Premature "Done" Declaration
**Cause:** Declaring task complete without verification
**Detection:** Features that don't work as expected
**Solution:**
- Run tests after implementation
- Verify against acceptance criteria
- Check error logs
- Report actual completion to Kraken

### Failure: Scope Creep
**Cause:** Adding features beyond original task
**Detection:** Tasks taking longer than expected
**Solution:**
- Stick to SPEC.md exactly
- Report scope questions to Kraken
- Don't "improve" unrelated code
- Ask for clarification when uncertain

### Failure: Guardian Zone Violations
**Cause:** Writing to blocked directories (PERSONAL, CONFIG, SYSTEM)
**Detection:** Guardian blocks the operation
**Solution:**
- Only work in WORKSPACE and SANDBOX zones
- Never touch ~/.ssh, ~/.aws, /etc
- Ask Kraken if unsure about zone

## Agent-Specific Failures

### Shark Failure: Over-Engineering
Sharks sometimes over-engineer solutions by:
- Adding abstractions too early
- Building for "future" features
- Creating unnecessary complexity
**Fix:** Start simple, iterate based on actual needs

### Manta Failure: Analysis Paralysis
Mantas sometimes get stuck in:
- Excessive error case analysis
- Over-testing trivial cases
- Over-thinking simple solutions
**Fix:** Implement first, refine based on actual failures

---

## How to Use This Library

When working on a task:
1. Read T2_FAILURE_MODES.md for relevant failures
2. Check if your approach repeats a known failure pattern
3. Apply the documented solution proactively
4. If you encounter a new failure, report it to Kraken via `report_to_kraken`

This library is updated by Kraken as new failures are discovered through agent reports and Hive Mind analysis.
