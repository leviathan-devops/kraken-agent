# Debug Log — Kraken v1.2 Firewall v11

## Issues Resolved

### L6 SILENT BLOCKING (CRITICAL — FIXED)
**Problem:** Only L0/L6 threw [FIREWALL_BLOCKED]. L8/L9/L10/AR blocks were silent.
**Fix:** All layers now throw. Model sees every block.

### TOOL DESCRIPTION GAP (ARCHITECTURE — DOCUMENTED)
**Finding:** OpenCode v1.14.48 strips model descriptions from write/glob output.args. Bash preserves them.
**Verified:** Runtime dump confirmed `{filePath, content}` for write, `{command, description}` for bash.
**Mitigation:** chat.message firewall + identity injection + L10 content checks compensate.

### V10 THEATRICAL NEVER CALLED (CRITICAL — FIXED)
**Problem:** checkTheatricalFirewall() defined but never invoked in enforceFirewall().
**Fix:** Now called after AR check, before L1.

### L6-AR CATCH-ALL IN DEFAULT_LAYERS (MODERATE — FIXED)
**Problem:** L6_ANTI_RETARD LayerRule had /.*/ pattern — blocked everything when evaluated by layer-engine.
**Fix:** Disabled in DEFAULT_LAYERS. Function-based checkAntiRetardPattern() handles AR.

### CHAT.MESSAGE FIELD MISMATCH (MODERATE — FIXED)
**Problem:** chat.message stored text in args.message but firewall checked args.description.
**Fix:** chat.message now stores in args.content + args.description + args.message.

### CONFIDENCE THRESHOLD TOO HIGH (MODERATE — FIXED)
**Problem:** MIN_CONFIDENCE_FOR_BLOCK=0.60 was too high for single-arm matches (confidence ~0.52).
**Fix:** Lowered to 0.30. Single pattern match now blocks.

### GEMMA MODELS FALLBACK (API — NOTED)
**Finding:** google/gemma-3-12b-it, gemma-4-26b, gemma-3n-e2b all fall back to Gemini.
**Impact:** Can't test with truly dumb models via Google API. OpenRouter free tier same behavior.

### L2 FALSE POSITIVE RISK (MODERATE — TUNED)
**Problem:** L2 pattern `task.*complete` catches legitimate pipeline commands.
**Fix:** L2 now pattern-first (mechanical checks only after pattern match). Reduced false positives.

## Container Test Bugs

### Write Description Gap (VERIFIED — NOT HALLUCINATED)
**Claim verified:** write tool output.args lacks description field.
**Evidence:** Runtime dump: `{"tool":"write","argsKeys":["filePath","content"],"hasDescription":false}`.
**Resolution:** Documented limitation. Compensating controls in place.
