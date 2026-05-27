/**
 * Firewall Layer Unit Test
 * Tests L0-L7 + AR + L6 enforcement functions directly
 */
import { enforceFirewall } from './brains/system/firewall/index.js';

const tests: { name: string; ctx: Parameters<typeof enforceFirewall>[0]; expect: { allowed?: boolean; blockedBy?: string } }[] = [
  // === L6: KRAKEN PROTECTION ===
  {
    name: 'L6: rm -rf opencode config should block',
    ctx: { agentName: 'kraken', toolName: 'bash', toolArgs: { command: 'rm -rf /root/.config/opencode/hive-data' }, message: 'rm -rf /root/.config/opencode/hive-data' },
    expect: { allowed: false, blockedBy: 'L6' },
  },
  {
    name: 'L6: write to kraken-hive should block',
    ctx: { agentName: 'kraken', toolName: 'write', toolArgs: { filePath: '/root/.local/share/opencode/kraken-hive/test.txt' }, message: '' },
    expect: { allowed: false, blockedBy: 'L6' },
  },
  {
    name: 'L6: write to /tmp should pass',
    ctx: { agentName: 'kraken', toolName: 'write', toolArgs: { filePath: '/tmp/test.txt' }, message: '' },
    expect: { allowed: true },
  },
  // === L0: IDENTITY WALL ===
  {
    name: 'L0: non-kraken agent accessing Hive should block',
    ctx: { agentName: 'shark-alpha-1', toolName: 'kraken_hive_search', toolArgs: {}, message: '' },
    expect: { allowed: false, blockedBy: 'L0' },
  },
  {
    name: 'L0: kraken agent accessing Hive should pass',
    ctx: { agentName: 'kraken', toolName: 'kraken_hive_search', toolArgs: {}, message: '' },
    expect: { allowed: true },
  },
  // === L1: ORCHESTRATION THEATER ===
  {
    name: 'L1: report_to_kraken spawned-implies-complete should block',
    ctx: { agentName: 'shark-alpha-1', toolName: 'report_to_kraken', toolArgs: { status: 'complete', task: 'spawned work done' }, message: '', taskType: '' },
    expect: { allowed: false, blockedBy: 'L1' },
  },
  // === L2: FALSE COMPLETION ===
  {
    name: 'L2: report complete without output verification should block',
    ctx: { agentName: 'shark-alpha-1', toolName: 'report_to_kraken', toolArgs: { status: 'complete' }, message: 'completed the task', taskType: '', outputsRetrieved: false },
    expect: { allowed: false, blockedBy: 'L2' },
  },
  // === L4: WRONG CLUSTER ===
  {
    name: 'L4: debug task sent to alpha should block',
    ctx: { agentName: 'kraken', toolName: 'spawn_shark_agent', toolArgs: { taskType: 'debug', targetCluster: 'alpha', clusterId: 'cluster-alpha' }, message: '', taskType: 'debug', targetCluster: 'cluster-alpha' },
    expect: { allowed: false, blockedBy: 'L4' },
  },
  {
    name: 'L4: build task sent to alpha should pass',
    ctx: { agentName: 'kraken', toolName: 'spawn_shark_agent', toolArgs: { taskType: 'build', targetCluster: 'alpha', clusterId: 'cluster-alpha' }, message: '', taskType: 'build', targetCluster: 'cluster-alpha' },
    expect: { allowed: true },
  },
  // === L5: MACRO DERAILMENT ===
  {
    name: 'L5: simple tool call passes',
    ctx: { agentName: 'kraken', toolName: 'bash', toolArgs: { command: 'ls' }, message: 'list files' },
    expect: { allowed: true },
  },
  // === L7: COORDINATION GATES ===
  {
    name: 'L7: standard tool call passes gates',
    ctx: { agentName: 'kraken', toolName: 'spawn_cluster_task', toolArgs: { task: 'do work' }, message: '' },
    expect: { allowed: true },
  },
];

let passed = 0, failed = 0;
for (const t of tests) {
  try {
    const result = enforceFirewall(t.ctx);
    const ok = result.allowed === t.expect.allowed && (!t.expect.blockedBy || result.blockedBy === t.expect.blockedBy);
    if (ok) { console.log(`  PASS: ${t.name}`); passed++; }
    else {
      console.log(`  FAIL: ${t.name}`);
      console.log(`    Expected: ${JSON.stringify(t.expect)}  Got: allowed=${result.allowed} blockedBy=${result.blockedBy}`);
      failed++;
    }
  } catch(e: any) {
    console.log(`  ERROR: ${t.name} — ${e.message || e}`);
    failed++;
  }
}
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
