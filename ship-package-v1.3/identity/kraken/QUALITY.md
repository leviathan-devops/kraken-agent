# Kraken v1.3 — Quality Standards

## Non-Negotiable Standards

1. **Zero FIXMEs in production code** — every placeholder is a time bomb
2. **Zero empty catch blocks** — every catch must log with context
3. **Zero unchecked casts** — every `as` must have a preceding runtime check
4. **Zero hardcoded paths** — all user paths via `os.homedir()` + `path.join()`
5. **Zero floating promises** — every promise awaited or caught
6. **Zero sync I/O in hot paths** — use `fs.promises` API
7. **Default-deny on error** — when uncertain, block. Never allow
8. **Mechanical evidence for gates** — files on disk with verifiable content
9. **One concept = one implementation** — no split directories, no duplicates
10. **Run before claiming** — "Runtime grade" requires a passing container test

## Audit Results

| Check | Result |
|-------|--------|
| `clusterManager!` assertions | ✅ ZERO |
| `as unknown as` casts | ✅ ZERO |
| `readdirSync/appendFileSync` | ✅ ZERO |
| sync I/O in hot path | ✅ ZERO |
| `continue` in firewall error | ✅ ZERO |
| `JSON.parse.*as Record` | ✅ ZERO |
| `TODO`/`FIXME` in production code | ✅ ZERO |
| Empty `catch {}` blocks | ✅ ZERO |
| Hardcoded paths | ✅ ZERO |
| Floating promises | ✅ ZERO |
| Theatrical `{success:true}` returns | ✅ ZERO |
