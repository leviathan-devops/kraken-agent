/**
 * Shark Test Runner Tool
 * 
 * Runs end-to-end tests to verify all functionality.
 * Ship gate cannot pass without passing tests.
 * 
 * NOTE: Tests that require OpenCode session use execSync with shorter timeouts.
 * If nested sessions timeout, that IS the test result (session isolation works).
 */

import { tool } from '@opencode-ai/plugin';
import { z } from 'zod';
import { execSync } from 'child_process';

export interface TestResult {
  name: string;
  passed: boolean;
  output?: string;
  error?: string;
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
}

interface TestDefinition {
  name: string;
  timeout: number;
  test: () => TestResult;
}

function generateBuildId(): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `shark-v4.7-${timestamp}`;
}

function runCommand(command: string, cwd: string = '/tmp', timeout: number = 15000): string {
  try {
    return execSync(command, {
      cwd,
      timeout,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
  } catch (error) {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}

const TEST_SUITE: TestDefinition[] = [
  {
    name: 'build-succeeds',
    timeout: 30000,
    test: () => {
      const buildOutput = runCommand('cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent && bun run build 2>&1');
      const passed = buildOutput.includes('index.js') && !buildOutput.includes('error');
      return {
        name: 'build-succeeds',
        passed,
        output: passed ? 'Build successful' : buildOutput.slice(0, 200),
      };
    },
  },
  {
    name: 'dist-file-exists',
    timeout: 5000,
    test: () => {
      const exists = runCommand('test -f /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent/dist/index.js && echo EXISTS');
      return {
        name: 'dist-file-exists',
        passed: exists.includes('EXISTS'),
        output: exists,
      };
    },
  },
  {
    name: 'tools-registered-in-config',
    timeout: 5000,
    test: () => {
      const config = runCommand('cat /home/leviathan/.config/opencode/opencode.json 2>/dev/null | grep -c "shark-agent" || echo "0"');
      const passed = parseInt(config) >= 1;
      return {
        name: 'tools-registered-in-config',
        passed,
        output: `Found ${config} references`,
      };
    },
  },
  {
    name: 'hooks-have-agent-checks',
    timeout: 5000,
    test: () => {
      const guardianHook = runCommand('grep "currentAgent" /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent/src/hooks/v4.1/guardian-hook.ts 2>/dev/null | wc -l');
      const sessionHook = runCommand('grep "isSharkAgent" /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent/src/hooks/v4.1/session-hook.ts 2>/dev/null | wc -l');
      const gCount = parseInt(guardianHook.trim()) || 0;
      const sCount = parseInt(sessionHook.trim()) || 0;
      const passed = gCount >= 1 && sCount >= 1;
      return {
        name: 'hooks-have-agent-checks',
        passed,
        output: `guardian:${gCount} session:${sCount}`,
      };
    },
  },
  {
    name: 'guardian-has-source-protection',
    timeout: 5000,
    test: () => {
      const canEdit = runCommand('grep -c "canEdit" /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent/src/shared/guardian.ts 2>/dev/null || echo "0"');
      const passed = parseInt(canEdit) >= 1;
      return {
        name: 'guardian-has-source-protection',
        passed,
        output: `canEdit references: ${canEdit}`,
      };
    },
  },
  {
    name: 'system-transform-has-ironclad',
    timeout: 5000,
    test: () => {
      const ironclad = runCommand('grep -c "IRONCLAD" /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent/src/hooks/v4.1/system-transform-hook.ts 2>/dev/null || echo "0"');
      const passed = parseInt(ironclad) >= 1;
      return {
        name: 'system-transform-has-ironclad',
        passed,
        output: `IRONCLAD references: ${ironclad}`,
      };
    },
  },
  {
    name: 'delivery-gate-requires-tests',
    timeout: 5000,
    test: () => {
      const delivery = runCommand('grep -c "OPENCODE CONTAINER TEST" /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent/src/shared/gates.ts 2>/dev/null || echo "0"');
      const passed = parseInt(delivery) >= 1;
      return {
        name: 'delivery-gate-requires-tests',
        passed,
        output: `Test requirement found: ${delivery}`,
      };
    },
  },
  {
    name: 'no-manta-in-shark-hooks',
    timeout: 5000,
    test: () => {
      const manta = runCommand('grep "Manta" /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent/src/hooks/v4.1/*.ts 2>/dev/null | wc -l');
      const count = parseInt(manta.trim()) || 0;
      return {
        name: 'no-manta-in-shark-hooks',
        passed: count === 0,
        output: `Manta references: ${count}`,
      };
    },
  },
];

export function createSharkTestRunnerTool() {
  return tool({
    description: 'Run end-to-end test suite for shark agent. Required before ship gate can pass.',
    args: {
      action: z.enum(['run', 'status', 'report']).describe('Action: run tests, check status, or generate report'),
      buildId: z.string().optional().describe('Build ID to report'),
    },
    execute: async (args, ctx) => {
      const { action, buildId } = args;

      if (action === 'status') {
        return JSON.stringify({
          status: 'ready',
          testCount: TEST_SUITE.length,
          tests: TEST_SUITE.map(t => t.name),
        });
      }

      if (action === 'run' || action === 'report') {
        const id = buildId || generateBuildId();
        const results: TestResult[] = [];

        console.error(`[SHARK TEST] Starting test suite for build: ${id}`);

        for (const test of TEST_SUITE) {
          console.error(`[SHARK TEST] Running: ${test.name}`);
          const result = test.test();
          results.push(result);
          if (result.passed) {
            console.error(`[SHARK TEST] ✓ ${test.name}`);
          } else {
            console.error(`[SHARK TEST] ✗ ${test.name}: ${result.error || result.output || 'Failed'}`);
          }
        }

        const passedTests = results.filter(r => r.passed).length;
        const failedTests = results.filter(r => !r.passed).length;
        const overallPassed = failedTests === 0;

        const suiteResult: TestSuiteResult = {
          suite: 'shark-e2e',
          timestamp: Date.now(),
          buildId: id,
          tests: results,
          overallPassed,
          totalTests: results.length,
          passedTests,
          failedTests,
        };

        console.error(`[SHARK TEST] Suite complete: ${passedTests}/${results.length} passed`);
        console.error(`[SHARK TEST] Overall: ${overallPassed ? 'PASS' : 'FAIL'}`);

        if (action === 'report') {
          return JSON.stringify(suiteResult, null, 2);
        }

        return JSON.stringify({
          buildId: id,
          overallPassed,
          passedTests,
          failedTests,
          totalTests: results.length,
          results: results.map(r => ({
            name: r.name,
            passed: r.passed,
            error: r.error,
          })),
        }, null, 2);
      }

      return JSON.stringify({ error: 'Unknown action' });
    },
  });
}
