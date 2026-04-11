# T2_PATTERNS.md
# Discovered Patterns from Kraken Hive
## Built by: Kraken Hive Engine
## Last Updated: 2026-04-08

## Overview
This is the T2 reference library for Sharks and Mantas. These patterns have been discovered through Kraken orchestration and stored in the Kraken Hive Mind. Read this file to get context on established patterns.

## Common Patterns

### Pattern: API Error Handling
When building APIs, use this error handling pattern:
- Check input validity before processing
- Return structured errors with codes
- Log errors for Kraken monitoring
- Never expose internal stack traces

### Pattern: File Organization  
Projects should follow this structure:
- /src for source code
- /tests for tests
- /docs for documentation
- /dist for compiled output

### Pattern: TypeScript Best Practices
- Always use explicit types, never `any`
- Export types from index files
- Use interfaces for object shapes
- Prefer `unknown` over `any` for generic inputs

### Pattern: Async Task Execution
When executing async tasks:
- Always await promises or handle rejections
- Set timeouts to prevent hanging
- Log progress for Kraken monitoring
- Report completion to Kraken via report_to_kraken

### Pattern: Modular Code Structure
- Single responsibility per module
- Clear public API surface
- Minimal dependencies between modules
- Testable in isolation

---

## Shark-Specific Patterns (Use for Steamroll Tasks)

### Building from Scratch
When building a new feature/module:
1. Create SPEC.md first
2. Scaffold the file structure
3. Implement core logic
4. Add error handling
5. Test and verify

### Handling Complex Problems
Sharks approach complex problems by:
- Breaking down into smaller pieces
- Starting with the core functionality
- Adding features iteratively
- Fixing issues as they arise
- Not over-engineering upfront

---

## Manta-Specific Patterns (Use for Precision Tasks)

### Debugging
When debugging:
1. Reproduce the error consistently
2. Isolate the root cause
3. Apply minimal fix
4. Verify the fix
5. Check for side effects

### Testing
When testing:
1. Cover happy path first
2. Add edge case tests
3. Test error handling
4. Verify cleanup/finalization
5. Check performance implications
