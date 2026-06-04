# Kraken v1.3 — Execution Brain

## Architecture

RGE + SRE = Execution Brain (100% algorithmic enforcement)

### RGE (Runtime Grade Engine) — 7 Layers
| Layer | Name | Method |
|-------|------|--------|
| L0 | Syntactic | Regex pre-filter for P1-P11 patterns |
| L1 | Type Contract | TypeScript Compiler API — `checker.getSignatureFromDeclaration()` |
| L2 | Control Flow | Resource leak, torn state, floating promise detection |
| L3 | Symbol Resolution | `checker.getSymbolAtLocation()` — import verification |
| L4 | Side-Effect Truth | P11 theatrical return detection via AST |
| L5 | Pattern Database | Known anti-pattern detection |
| L6 | Compliance | Zero CRITICAL = pass verdict |

### SRE (Slop Removal Engine) — P1-P11
| Principle | Description |
|-----------|-------------|
| P1 | Defensive Import — import resolution + export extraction via AST |
| P2 | Type Certainty — validation marker tracking within function scope |
| P3 | Error Completeness — 3-level catch analysis (empty/comment-only/non-meaningful) |
| P4 | Resource Lifecycle — files, intervals, connections cleaned up |
| P5 | Atomic State — no partial states survive errors |
| P6 | Dependency Check — API verified before use |
| P7 | Path Resolution — os.homedir() + path.join, no hardcoded paths |
| P8 | Config Validation — type, range, presence checked |
| P9 | Async Discipline — every Promise has .catch or try/catch |
| P10 | Output Contract — functions return what they promise in ALL paths |
| P11 | Output IS The Work — claims backed by side effects |

## Three-Tier Identity
- Orchestrator (kraken, kraken-executor) → FULL identity
- Cluster agents (shark-*, manta-*) → TASK CONTEXT only
- Non-Kraken agents → Nothing
