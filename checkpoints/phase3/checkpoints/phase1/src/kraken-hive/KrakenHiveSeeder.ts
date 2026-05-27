/**
 * KrakenHiveSeeder — V1.2
 * 
 * Seeds the Kraken Hive Mind with initial patterns, failure modes, 
 * build chains, and architecture knowledge so kraken_hive_search returns real results.
 * 
 * Called at plugin init to populate the file-based Hive.
 */

import fs from 'node:fs';
import path from 'node:path';

const HIVE_BASE = path.join(
  process.env.HOME || '/root',
  '.local/share/opencode/kraken-hive'
);

const PATTERNS = {
  'patterns/delegation-pattern.md': `# Delegation Pattern
## When to delegate
- Multi-file changes: delegate to Shark (alpha cluster, steamroll)
- Debug/fix single bug: delegate to Manta (beta cluster, precision)
- Test/verify/audit: delegate to Manta (gamma cluster, testing)

## Never do directly
- Large builds: always delegate to shark-alpha-1 or shark-alpha-2
- Testing: always delegate to manta-gamma-1 or manta-gamma-2
- Code review: delegate to manta-beta-1 or manta-beta-2

## Anti-patterns
- fire-and-forget: spawn without tracking = L2_BLOCK
- wrong-cluster: build task to gamma = L4_BLOCK
- premature-completion: claim done without output retrieval = L2_BLOCK`,

  'patterns/cluster-routing.md': `# Cluster Routing
## Alpha Cluster (steamroll)
- Agents: shark-alpha-1, shark-alpha-2, manta-alpha-1
- Task types: build, create, implement, feature, write, scaffold, prototype
- Strategy: aggressive, full speed, no hesitation

## Beta Cluster (precision)
- Agents: shark-beta-1, manta-beta-1, manta-beta-2
- Task types: debug, fix, refactor, analyze, investigate, review, examine
- Strategy: precise, methodical, root cause isolation

## Gamma Cluster (testing)
- Agents: manta-gamma-1, manta-gamma-2, shark-gamma-1
- Task types: test, verify, validate, audit, assess, integration
- Strategy: thorough, evidence-based, gate enforcement`,

  'failures/fire-and-forget.md': `# Fire-and-Forget Failure Mode
## Pattern
Task spawned without output registration → task completed → outputs not retrieved → claimed done.

## Detection
- spawn_shark_agent called without output paths
- aggregate_results trusts boolean success without filesystem verification
- report_to_kraken claims complete without output evidence

## Fix
1. Register expected outputs on spawn (executionBrain.registerTaskOutputs)
2. After completion, verify outputs exist on host (L3 output inspection)
3. Only after verification, advance gate (L2 false completion block)

## Prevention
- L2 firewall layer: blocks completion claims without output retrieval
- Evidence collector: requires output evidence for gate passage`,

  'build-chain/typescript-build-pattern.md': `# TypeScript Build Pattern
## Build Pipeline
1. rm -rf dist/
2. bun build src/index.ts --outdir dist --target bun --format esm --bundle
3. Verify dist/index.js exists
4. Test with TUI container

## Common failures
- require() in ESM module: use import or dynamic import()
- Missing node: prefix on fs/path imports in Bun
- Circular dependency on state store/messenger
- Plugin peer dependency not externalized in bundle`,

  'architecture/v1.2-multi-brain.md': `# V1.2 Multi-Brain Architecture
## Brain Roles
- Planning Brain: T2 context loading, T1 generation, task decomposition, domain designation
- Execution Brain: Task supervision, output verification, override commands, quality enforcement
- System Brain: Workflow tracking, security enforcement, gate evaluation, L0-L7 firewall

## Communication
- Brain Messenger: priority queue (critical > high > normal > low)
- State Store: domain-owned shared state with write enforcement
- Brain Concurrency: independent async event loops per brain

## Gate Pipeline
plan → build → test → verify → audit → delivery
Each gate requires evidence before advancement.`,
};

export function seedKrakenHive(): { seeded: number; skipped: number; errors: number } {
  let seeded = 0;
  let skipped = 0;
  let errors = 0;

  try {
    for (const [relPath, content] of Object.entries(PATTERNS)) {
      const fullPath = path.join(HIVE_BASE, relPath);
      const dir = path.dirname(fullPath);

      try {
        fs.mkdirSync(dir, { recursive: true });

        if (fs.existsSync(fullPath)) {
          skipped++;
          continue;
        }

        fs.writeFileSync(fullPath, content);
        seeded++;
      } catch (err) {
        console.error(`[HiveSeed] Failed to seed ${relPath}:`, err);
        errors++;
      }
    }

    console.log(`[HiveSeed] Seeded ${seeded} patterns, ${skipped} existing, ${errors} errors`);
  } catch (err) {
    console.error('[HiveSeed] Fatal error:', err);
    errors++;
  }

  return { seeded, skipped, errors };
}

export function isHiveSeeded(): boolean {
  try {
    return fs.existsSync(path.join(HIVE_BASE, 'patterns', 'delegation-pattern.md'));
  } catch {
    return false;
  }
}
