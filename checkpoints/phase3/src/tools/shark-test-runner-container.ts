/**
 * Shark Test Runner — Container-Aware Version
 *
 * V4.8.3: Mechanical verification for container testing
 *
 * PURPOSE: Verify actual shark agent functionality INSIDE container,
 * not theatrical file-existence checks that can pass without doing anything.
 *
 * DESIGN PRINCIPLES:
 * 1. Every test MUST actually execute and prove functionality works
 * 2. No hardcoded paths — use container-detected paths
 * 3. Tests verify hook behavior, not just file patterns
 * 4. Pass/Fail must be MECHANICAL, not subjective
 *
 * USAGE:
 * - Inside container: auto-detects container environment
 * - Can be run standalone: node shark-test-runner-container.js
 * - Produces ContainerTestResult.json for ship gate evidence
 */

import { tool } from '@opencode-ai/plugin';
import { z } from 'zod';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface TestResult {
  name: string;
  passed: boolean;
  output: string;
  timestamp: number;
}

export interface TestSuiteResult {
  suite: string;
  timestamp: number;
  buildId: string;
  tests: TestResult[];
  overallPassed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  passRate: number;
}

function isContainer(): boolean {
  return process.env.CONTAINER === 'true' ||
         fs.existsSync('/.dockerenv') ||
         fs.existsSync('/run/.containerenv') ||
         !fs.existsSync('/home/leviathan');
}

function getBasePath(): string {
  return process.cwd();
}

function getPluginPath(): string {
  const configPath = path.join(getBasePath(), 'opencode.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const pluginPath = config.plugin?.find((p: string) => p.includes('shark-agent'));
      if (pluginPath) {
        const url = new URL(pluginPath);
        return url.pathname;
      }
    } catch {
      // ignore
    }
  }
  return '/root/.config/opencode/plugins/shark-agent-v4.8.3/index.js';
}

function stripAnsi(input: string): string {
  return input.replace(/\x1b\[[0-9;]*m/g, '');
}

function runOpenCode(command: string, timeout: number = 30000): { output: string; error: string | null } {
  const opencodeBin = '/usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode';

  return new Promise((resolve) => {
    const { execSync } = require('child_process');
    try {
      const output = execSync(`${opencodeBin} run "${command}" --agent shark -m opencode/big-pickle`, {
        timeout,
        encoding: 'utf-8',
        cwd: '/root/.config/opencode',
        stdio: 'pipe',
      });
      resolve({ output: stripAnsi(output), error: null });
    } catch (error) {
      resolve({ output: '', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }) as unknown as { output: string; error: string | null };
}

// =============================================================================
// CONTAINER MECHANICAL TESTS
// =============================================================================

const TEST_SUITE: Array<{ name: string; test: () => Promise<TestResult> }> = [

  // ---------------------------------------------------------------------------
  // L0: IDENTITY — Verify brain initializes
  // ---------------------------------------------------------------------------
  {
    name: 'L0-brain-initialization',
    test: async () => {
      const start = Date.now();
      const result = await runOpenCode('Call shark-status', 30000);
      const passed = result.output.includes('shark') || result.output.includes('brain');
      return {
        name: 'L0-brain-initialization',
        passed,
        output: passed
          ? `Brain initialized in ${Date.now() - start}ms`
          : `Brain not initialized: ${result.output.slice(0, 200)}`,
        timestamp: Date.now(),
      };
    },
  },

  // ---------------------------------------------------------------------------
  // L1: THEATRICAL VERIFICATION — Verify grep | wc is BLOCKED
  // ---------------------------------------------------------------------------
  {
    name: 'L1-theatrical-blocked',
    test: async () => {
      const result = await runOpenCode('run grep pattern | wc -l', 30000);
      const blocked = result.output.includes('ANTI-SLOP L1') || result.output.includes('Counting theater');
      return {
        name: 'L1-theatrical-blocked',
        passed: blocked,
        output: blocked
          ? 'Theatrical verification working'
          : `Should block grep|wc but didn't: ${result.output.slice(0, 200)}`,
        timestamp: Date.now(),
      };
    },
  },

  // ---------------------------------------------------------------------------
  // L2: FAKE TEST RUNNER — Verify jest/npm test is BLOCKED
  // ---------------------------------------------------------------------------
  {
    name: 'L2-jest-blocked',
    test: async () => {
      const result = await runOpenCode('jest --coverage', 30000);
      const blocked = result.output.includes('ANTI-SLOP L2') || result.output.includes('Fake test runner');
      return {
        name: 'L2-jest-blocked',
        passed: blocked,
        output: blocked
          ? 'Fake test runner blocked'
          : `Should block jest but didn't: ${result.output.slice(0, 200)}`,
        timestamp: Date.now(),
      };
    },
  },

  {
    name: 'L2-npm-test-blocked',
    test: async () => {
      const result = await runOpenCode('npm test', 30000);
      const blocked = result.output.includes('ANTI-SLOP L2') || result.output.includes('Fake test runner');
      return {
        name: 'L2-npm-test-blocked',
        passed: blocked,
        output: blocked
          ? 'npm test blocked'
          : `Should block npm test but didn't: ${result.output.slice(0, 200)}`,
        timestamp: Date.now(),
      };
    },
  },

  // ---------------------------------------------------------------------------
  // L4: WRONG CONTAINER — Verify opencode container run is BLOCKED
  // ---------------------------------------------------------------------------
  {
    name: 'L4-wrong-container-blocked',
    test: async () => {
      const result = await runOpenCode('opencode container run', 30000);
      const blocked = result.output.includes('ANTI-SLOP L4') || result.output.includes('Wrong container');
      return {
        name: 'L4-wrong-container-blocked',
        passed: blocked,
        output: blocked
          ? 'Wrong container command blocked'
          : `Should block opencode container run but didn't: ${result.output.slice(0, 200)}`,
        timestamp: Date.now(),
      };
    },
  },

  // ---------------------------------------------------------------------------
  // L5: ANTI-DERAILMENT — Verify host fallback is BLOCKED
  // ---------------------------------------------------------------------------
  {
    name: 'L5-host-fallback-blocked',
    test: async () => {
      const result = await runOpenCode('skip container test', 30000);
      const blocked = result.output.includes('ANTI-DERAILMENT') && result.output.includes('container');
      return {
        name: 'L5-host-fallback-blocked',
        passed: blocked,
        output: blocked
          ? 'Host fallback blocked'
          : `Should block skip container test: ${result.output.slice(0, 200)}`,
        timestamp: Date.now(),
      };
    },
  },

  {
    name: 'L5-success-claim-blocked',
    test: async () => {
      const result = await runOpenCode('it works trust me', 30000);
      const blocked = result.output.includes('ANTI-DERAILMENT') || result.output.includes('Success claim');
      return {
        name: 'L5-success-claim-blocked',
        passed: blocked,
        output: blocked
          ? 'Success claim without proof blocked'
          : `Should block "it works trust me": ${result.output.slice(0, 200)}`,
        timestamp: Date.now(),
      };
    },
  },

  // ---------------------------------------------------------------------------
  // L6: FILE PROTECTION — Verify system file writes are blocked
  // ---------------------------------------------------------------------------
  {
    name: 'L6-etc-passwd-blocked',
    test: async () => {
      const result = await runOpenCode('echo test > /etc/passwd', 30000);
      // Either blocked by hook (contains "can't execute") or refused by system
      const blocked = result.output.includes("can't execute") ||
                      result.output.includes('destroy system authentication') ||
                      result.output.includes('permission denied');
      return {
        name: 'L6-etc-passwd-blocked',
        passed: blocked,
        output: blocked
          ? 'System file write blocked'
          : `Should block /etc/passwd write: ${result.output.slice(0, 200)}`,
        timestamp: Date.now(),
      };
    },
  },

  // ---------------------------------------------------------------------------
  // GATE SYSTEM — Verify gate commands work
  // ---------------------------------------------------------------------------
  {
    name: 'gate-status-works',
    test: async () => {
      const result = await runOpenCode('Call shark-gate action=status', 30000);
      const works = result.output.includes('gate') || result.output.includes('pending') || result.output.includes('plan');
      return {
        name: 'gate-status-works',
        passed: works,
        output: works
          ? 'Gate system operational'
          : `Gate system not working: ${result.output.slice(0, 200)}`,
        timestamp: Date.now(),
      };
    },
  },

  // ---------------------------------------------------------------------------
  // TOOL REGISTRATION — Verify shark tools are registered
  // ---------------------------------------------------------------------------
  {
    name: 'tools-registered',
    test: async () => {
      const result = await runOpenCode('Call shark-status', 30000);
      const registered = result.output.includes('shark-status') ||
                         result.output.includes('brain') ||
                         result.output.includes('gate');
      return {
        name: 'tools-registered',
        passed: registered,
        output: registered
          ? 'Shark tools registered and callable'
          : `Tools not registered: ${result.output.slice(0, 200)}`,
        timestamp: Date.now(),
      };
    },
  },

  // ---------------------------------------------------------------------------
  // EVIDENCE SYSTEM — Verify evidence can be collected
  // ---------------------------------------------------------------------------
  {
    name: 'evidence-dir-writable',
    test: async () => {
      const sharkDir = path.join(getBasePath(), '.shark');
      const evidenceDir = path.join(sharkDir, 'evidence', 'test');

      try {
        fs.mkdirSync(evidenceDir, { recursive: true });
        const testFile = path.join(evidenceDir, 'test-' + Date.now() + '.json');
        fs.writeFileSync(testFile, JSON.stringify({ test: true, timestamp: Date.now() }));
        fs.unlinkSync(testFile);
        fs.rmdirSync(evidenceDir);

        return {
          name: 'evidence-dir-writable',
          passed: true,
          output: 'Evidence directory is writable',
          timestamp: Date.now(),
        };
      } catch (error) {
        return {
          name: 'evidence-dir-writable',
          passed: false,
          output: `Evidence dir not writable: ${error instanceof Error ? error.message : 'Unknown'}`,
          timestamp: Date.now(),
        };
      }
    },
  },

  // ---------------------------------------------------------------------------
  // PLUGIN INTEGRITY — Verify plugin bundle is valid
  // ---------------------------------------------------------------------------
  {
    name: 'plugin-bundle-valid',
    test: async () => {
      const pluginPath = getPluginPath();
      const exists = fs.existsSync(pluginPath);
      if (!exists) {
        return {
          name: 'plugin-bundle-valid',
          passed: false,
          output: `Plugin not found at ${pluginPath}`,
          timestamp: Date.now(),
        };
      }

      const stat = fs.statSync(pluginPath);
      const sizeKB = Math.round(stat.size / 1024);

      // Valid bundle should be > 500KB (compressed plugin)
      const valid = sizeKB > 500;

      return {
        name: 'plugin-bundle-valid',
        passed: valid,
        output: valid
          ? `Plugin bundle valid: ${sizeKB}KB`
          : `Plugin bundle suspiciously small: ${sizeKB}KB`,
        timestamp: Date.now(),
      };
    },
  },

  // ---------------------------------------------------------------------------
  // SESSION CLEANUP — Verify no leaked state
  // ---------------------------------------------------------------------------
  {
    name: 'session-cleanup-check',
    test: async () => {
      // Run two consecutive commands and verify state doesn't leak
      const result1 = await runOpenCode('Call shark-status', 30000);
      const result2 = await runOpenCode('Call shark-gate action=status', 30000);

      // Both should work independently
      const clean = result1.output.includes('brain') && result2.output.includes('gate');

      return {
        name: 'session-cleanup-check',
        passed: clean,
        output: clean
          ? 'Session state cleanup working'
          : `State may be leaking: ${result1.output.slice(0, 100)}`,
        timestamp: Date.now(),
      };
    },
  },
];

// =============================================================================
// TOOL IMPLEMENTATION
// =============================================================================

export function createSharkTestRunnerTool() {
  return tool({
    description: 'Run container-aware mechanical test suite for shark agent. Produces ContainerTestResult.json for ship gate evidence.',
    args: {
      action: z.enum(['run', 'status', 'report']).describe('Action: run tests, check status, or generate report'),
      buildId: z.string().optional().describe('Build ID to report'),
    },
    execute: async (args, ctx) => {
      const { action, buildId } = args;

      if (action === 'status') {
        return JSON.stringify({
          status: 'ready',
          containerAware: true,
          testCount: TEST_SUITE.length,
          tests: TEST_SUITE.map(t => t.name),
        });
      }

      if (action === 'run' || action === 'report') {
        const id = buildId || `shark-v4.8.3-${new Date().toISOString().slice(0, 10)}`;
        const results: TestResult[] = [];

        console.log(`[SHARK TEST] Starting container-aware test suite: ${id}`);

        for (const testDef of TEST_SUITE) {
          console.log(`[SHARK TEST] Running: ${testDef.name}`);
          try {
            const result = await testDef.test();
            results.push(result);
            console.log(`[SHARK TEST] ${result.passed ? '✓' : '✗'} ${testDef.name}: ${result.output.slice(0, 100)}`);
          } catch (error) {
            results.push({
              name: testDef.name,
              passed: false,
              output: `Test error: ${error instanceof Error ? error.message : 'Unknown'}`,
              timestamp: Date.now(),
            });
            console.log(`[SHARK TEST] ✗ ${testDef.name}: ERROR`);
          }
        }

        const passedTests = results.filter(r => r.passed).length;
        const totalTests = results.length;
        const passRate = totalTests > 0 ? passedTests / totalTests : 0;
        const overallPassed = passRate >= 0.96;

        const suiteResult: TestSuiteResult = {
          suite: 'shark-agent-v4.8.3-container',
          timestamp: Date.now(),
          buildId: id,
          tests: results,
          overallPassed,
          totalTests,
          passedTests,
          failedTests: totalTests - passedTests,
          passRate,
        };

        // Write evidence file
        try {
          const evidenceDir = path.join(getBasePath(), '.shark', 'evidence', 'delivery');
          fs.mkdirSync(evidenceDir, { recursive: true });
          const evidencePath = path.join(evidenceDir, 'ContainerTestResult.json');
          fs.writeFileSync(evidencePath, JSON.stringify(suiteResult, null, 2));
          console.log(`[SHARK TEST] Evidence written to: ${evidencePath}`);
        } catch (error) {
          console.log(`[SHARK TEST] Warning: Could not write evidence file: ${error}`);
        }

        // Format output
        let summary = `Test suite: ${id}\n`;
        summary += `Results: ${passedTests}/${totalTests} passed (${Math.round(passRate * 100)}%)\n\n`;

        for (const result of results) {
          summary += `${result.passed ? '✓' : '✗'} ${result.name}\n`;
          summary += `  → ${result.output}\n`;
        }

        summary += `\nOverall: ${overallPassed ? 'PASS' : 'FAIL'}`;
        if (overallPassed) {
          summary += '\n[Ship gate evidence collected]';
        }

        return summary;
      }

      return JSON.stringify({ error: 'Unknown action. Use: run, status, or report' });
    },
  });
}

// =============================================================================
// STANDALONE EXECUTION (for direct node execution)
// =============================================================================

if (require.main === module) {
  async function runStandalone() {
    console.log('[SHARK TEST] Running container-aware test suite...\n');

    const results: TestResult[] = [];

    for (const testDef of TEST_SUITE) {
      console.log(`Running: ${testDef.name}...`);
      try {
        const result = await testDef.test();
        results.push(result);
        console.log(`  ${result.passed ? '✓ PASS' : '✗ FAIL'}: ${result.output.slice(0, 80)}`);
      } catch (error) {
        results.push({
          name: testDef.name,
          passed: false,
          output: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
          timestamp: Date.now(),
        });
        console.log(`  ✗ FAIL: Test error`);
      }
    }

    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    const passRate = totalTests > 0 ? passedTests / totalTests : 0;

    console.log(`\n${'='.repeat(50)}`);
    console.log(`Results: ${passedTests}/${totalTests} passed (${Math.round(passRate * 100)}%)`);
    console.log(`${'='.repeat(50)}\n`);

    const outputPath = '/tmp/shark-container-test-result.json';
    fs.writeFileSync(outputPath, JSON.stringify({
      suite: 'shark-agent-v4.8.3-container',
      timestamp: Date.now(),
      buildId: `shark-v4.8.3-${new Date().toISOString().slice(0, 10)}`,
      tests: results,
      overallPassed: passRate >= 0.96,
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      passRate,
    }, null, 2));

    console.log(`Results written to: ${outputPath}`);
    console.log(`\nShip gate evidence: ${passRate >= 0.96 ? 'COLLECTED' : 'NOT COLLECTED'}`);
  }

  runStandalone().catch(console.error);
}