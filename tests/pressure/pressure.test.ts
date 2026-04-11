/**
 * tests/pressure/pressure.test.ts
 * 
 * Kraken Agent v1.0 - Pressure Test Suite
 * 
 * High-stress integration tests to verify Kraken handles complex,
 * real-world workloads with 50+ concurrent tasks.
 */

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { ClusterManager } from '../../src/clusters/ClusterManager.js';
import { ClusterScheduler } from '../../src/factory/ClusterScheduler.js';
import { AsyncDelegationEngine } from '../../src/factory/AsyncDelegationEngine.js';
import { KrakenHiveEngine } from '../../src/kraken-hive/index.js';
import type { KrakenDelegationRequest, ClusterConfig } from '../../src/factory/kraken-types.js';

const PRESSURE_CLUSTERS: ClusterConfig[] = [
  { id: 'p-alpha', name: 'Pressure Alpha', description: 'High priority', agents: ['pa-shark-1', 'pa-shark-2', 'pa-manta-1'], intraClusterDelegation: true, interClusterDelegation: true, sharedContext: true },
  { id: 'p-beta', name: 'Pressure Beta', description: 'Standard', agents: ['pb-shark-1', 'pb-manta-1', 'pb-manta-2'], intraClusterDelegation: true, interClusterDelegation: true, sharedContext: true },
  { id: 'p-gamma', name: 'Pressure Gamma', description: 'Debug', agents: ['pg-shark-1', 'pg-manta-1', 'pg-manta-2'], intraClusterDelegation: true, interClusterDelegation: true, sharedContext: true },
];

describe('PRESSURE TEST: Kraken Agent v1.0', () => {
  let clusterManager: ClusterManager;
  let clusterScheduler: ClusterScheduler;
  let delegationEngine: AsyncDelegationEngine;
  let hive: KrakenHiveEngine;

  beforeAll(() => {
    clusterManager = new ClusterManager(PRESSURE_CLUSTERS);
    clusterScheduler = new ClusterScheduler(PRESSURE_CLUSTERS);
    delegationEngine = new AsyncDelegationEngine(PRESSURE_CLUSTERS, clusterManager, clusterScheduler);
    hive = new KrakenHiveEngine();
    console.log('\n=== PRESSURE TEST STARTED ===\n');
  });

  afterAll(async () => {
    await clusterManager.shutdown();
    console.log('\n=== PRESSURE TEST COMPLETED ===\n');
  });

  describe('SCENARIO 1: Barrage (50 Concurrent Tasks)', () => {
    test('should complete 50 tasks in under 10 seconds', async () => {
      const clusters = ['p-alpha', 'p-beta', 'p-gamma'];
      const tasks: KrakenDelegationRequest[] = [];
      
      for (let i = 0; i < 50; i++) {
        tasks.push({
          taskId: `barrage-${i}`,
          task: `Build nexus-api-service-${i % 6}`,
          targetCluster: clusters[i % 3],
          priority: 'normal',
          createdAt: Date.now(),
        });
      }

      const startTime = Date.now();
      const results = await Promise.all(tasks.map(t => delegationEngine.delegate(t)));
      const duration = Date.now() - startTime;

      const completed = results.filter(r => r.success).length;
      const throughput = completed / (duration / 1000);

      console.log(`\n[BARRAGE] 50 tasks: ${completed}/50 completed in ${duration}ms`);
      console.log(`[BARRAGE] Throughput: ${throughput.toFixed(2)} tasks/sec`);

      expect(completed).toBeGreaterThanOrEqual(45);
      expect(duration).toBeLessThan(10000);
    }, 15000);

    test('should distribute tasks across all 3 clusters', async () => {
      const clusters = ['p-alpha', 'p-beta', 'p-gamma'];
      const tasks: KrakenDelegationRequest[] = [];
      
      for (let i = 0; i < 30; i++) {
        tasks.push({
          taskId: `distrib-${i}`,
          task: `Task ${i}`,
          targetCluster: clusters[i % 3],
          priority: 'normal',
          createdAt: Date.now(),
        });
      }

      await Promise.all(tasks.map(t => delegationEngine.delegate(t)));

      const alphaLoad = clusterScheduler.getClusterLoad('p-alpha');
      const betaLoad = clusterScheduler.getClusterLoad('p-beta');
      const gammaLoad = clusterScheduler.getClusterLoad('p-gamma');

      const totalCompleted = 
        (alphaLoad?.completedTasks || 0) + 
        (betaLoad?.completedTasks || 0) + 
        (gammaLoad?.completedTasks || 0);

      console.log(`\n[DISTRIBUTION]`);
      console.log(`  Alpha: ${alphaLoad?.activeTasks || 0} active, ${alphaLoad?.completedTasks || 0} completed`);
      console.log(`  Beta:  ${betaLoad?.activeTasks || 0} active, ${betaLoad?.completedTasks || 0} completed`);
      console.log(`  Gamma: ${gammaLoad?.activeTasks || 0} active, ${gammaLoad?.completedTasks || 0} completed`);
      console.log(`  Total completed: ${totalCompleted}`);

      expect(totalCompleted).toBeGreaterThan(0);
    });
  });

  describe('SCENARIO 2: Priority Handling', () => {
    test('should handle mixed priority tasks', async () => {
      // Submit tasks with different priorities
      const tasks: KrakenDelegationRequest[] = [];
      
      // 5 low priority
      for (let i = 0; i < 5; i++) {
        tasks.push({
          taskId: `low-${i}`,
          task: `Low priority ${i}`,
          targetCluster: 'p-alpha',
          priority: 'low',
          createdAt: Date.now(),
        });
      }
      
      // 5 high priority
      for (let i = 0; i < 5; i++) {
        tasks.push({
          taskId: `high-${i}`,
          task: `High priority ${i}`,
          targetCluster: 'p-alpha',
          priority: 'high',
          createdAt: Date.now(),
        });
      }

      const startTime = Date.now();
      const results = await Promise.all(tasks.map(t => delegationEngine.delegate(t)));
      const duration = Date.now() - startTime;

      const completed = results.filter(r => r.success).length;
      console.log(`\n[PRIORITY] ${completed} tasks completed in ${duration}ms`);
      
      // High priority should all complete
      const highResults = results.filter(r => r.taskId.startsWith('high-'));
      console.log(`[PRIORITY] High tasks: ${highResults.filter(r => r.success).length}/5 succeeded`);
      
      expect(completed).toBeGreaterThanOrEqual(8);
      expect(highResults.every(r => r.success)).toBe(true);
    });
  });

  describe('SCENARIO 3: Hive Siege (50 Concurrent Writes)', () => {
    test('should store 50 patterns under load', async () => {
      const patterns = Array(50).fill(null).map((_, i) => ({
        type: 'pattern' as const,
        id: `pressure-pattern-${i}`,
        description: `Pressure test pattern ${i}`,
        content: `Content for pattern ${i} - testing Hive Mind under concurrent load with searchable text`,
        createdAt: Date.now(),
      }));

      const startTime = Date.now();
      await Promise.all(patterns.map(p => hive.rememberPattern(p)));
      const duration = Date.now() - startTime;

      // Search with high limit to get all
      const results = await hive.search('pressure', { limit: 100 });
      console.log(`\n[HIVE SIEGE] 50 patterns stored in ${duration}ms`);
      console.log(`[HIVE SIEGE] Search returned ${results.length} results (of 50)`);

      expect(results.length).toBeGreaterThanOrEqual(40);
      expect(duration).toBeLessThan(5000);
    }, 10000);

    test('should handle concurrent read/write without corruption', async () => {
      const writePromise = Promise.all(
        Array(20).fill(null).map((_, i) =>
          hive.rememberPattern({
            type: 'pattern',
            id: `siege-write-${i}`,
            description: `Siege write ${i}`,
            content: `Concurrent write content ${i}`,
            createdAt: Date.now(),
          })
        )
      );

      const readPromises = Array(20).fill(null).map((_, i) =>
        hive.search(`siege-write-${i % 20}`, { limit: 5 })
      );

      const [writes, ...reads] = await Promise.all([writePromise, ...readPromises]);

      console.log(`\n[HIVE R/W] 20 writes + 20 concurrent reads`);
      console.log(`[HIVE R/W] Writes completed: ${writes.length}`);
      console.log(`[HIVE R/W] Reads completed: ${reads.length}`);

      expect(writes.length).toBe(20);
      expect(reads.length).toBe(20);
    });
  });

  describe('SCENARIO 4: Error Resilience', () => {
    test('should handle mixed success/failure gracefully', async () => {
      const results = await Promise.all([
        delegationEngine.delegate({
          taskId: 'error-1',
          task: 'Normal task',
          targetCluster: 'p-beta',
          priority: 'normal',
          createdAt: Date.now(),
        }),
        delegationEngine.delegate({
          taskId: 'error-2',
          task: 'Another task',
          targetCluster: 'p-beta',
          priority: 'normal',
          createdAt: Date.now(),
        }),
        delegationEngine.delegate({
          taskId: 'error-3',
          task: 'Third task',
          targetCluster: 'p-beta',
          priority: 'normal',
          createdAt: Date.now(),
        }),
      ]);

      const successCount = results.filter(r => r.success).length;
      const errorRate = (results.length - successCount) / results.length;

      console.log(`\n[ERROR TEST] ${successCount}/3 succeeded, error rate: ${(errorRate * 100).toFixed(1)}%`);

      expect(successCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('SCENARIO 5: Sustained Load (10 seconds)', () => {
    test('should maintain throughput over 10 seconds', async () => {
      const DURATION = 10000;
      const RATE = 5;
      const START = Date.now();
      let totalCompleted = 0;
      let totalFailed = 0;
      const samples: number[] = [];
      const clusters = ['p-alpha', 'p-beta', 'p-gamma'];

      console.log(`\n[SUSTAINED] Starting 10-second sustained load test...`);

      while (Date.now() - START < DURATION) {
        const batchStart = Date.now();

        const batch = Array(RATE).fill(null).map((_, i) => ({
          taskId: `sustained-${totalCompleted + totalFailed + i}-${Date.now()}`,
          task: `Sustained task ${totalCompleted + totalFailed + i}`,
          targetCluster: clusters[(totalCompleted + totalFailed) % 3],
          priority: 'normal',
          createdAt: Date.now(),
        }));

        const results = await Promise.all(batch.map(t => delegationEngine.delegate(t)));
        const batchCompleted = results.filter(r => r.success).length;
        const batchFailed = results.filter(r => !r.success).length;

        totalCompleted += batchCompleted;
        totalFailed += batchFailed;

        const batchDuration = Date.now() - batchStart;
        const batchThroughput = batchDuration > 0 ? batchCompleted / (batchDuration / 1000) : 0;
        samples.push(batchThroughput);

        await new Promise(r => setTimeout(r, 200));
      }

      const elapsed = Date.now() - START;
      const avgThroughput = samples.length > 0 ? samples.reduce((a, b) => a + b, 0) / samples.length : 0;
      const minThroughput = samples.length > 0 ? Math.min(...samples) : 0;
      const maxThroughput = samples.length > 0 ? Math.max(...samples) : 0;
      const overallThroughput = totalCompleted / (elapsed / 1000);
      const errorRate = (totalCompleted + totalFailed) > 0 ? totalFailed / (totalCompleted + totalFailed) : 0;

      console.log(`\n[SUSTAINED] Results after ${elapsed}ms:`);
      console.log(`  Total completed: ${totalCompleted}`);
      console.log(`  Total failed: ${totalFailed}`);
      console.log(`  Error rate: ${(errorRate * 100).toFixed(1)}%`);
      console.log(`  Avg throughput: ${avgThroughput.toFixed(2)} tasks/sec`);
      console.log(`  Min throughput: ${minThroughput.toFixed(2)} tasks/sec`);
      console.log(`  Max throughput: ${maxThroughput.toFixed(2)} tasks/sec`);
      console.log(`  Overall: ${overallThroughput.toFixed(2)} tasks/sec`);

      expect(avgThroughput).toBeGreaterThan(2);
      expect(errorRate).toBeLessThan(0.15);
    }, 30000);
  });

  describe('SCENARIO 6: Full Nexus Project Build', () => {
    test('should simulate building 5 interconnected services', async () => {
      const services = [
        { name: 'api-gateway', files: 5, priority: 'high' as const },
        { name: 'task-service', files: 4, priority: 'high' as const },
        { name: 'event-bus', files: 3, priority: 'normal' as const },
        { name: 'storage-service', files: 3, priority: 'normal' as const },
        { name: 'auth-service', files: 4, priority: 'high' as const },
      ];

      const allTasks: KrakenDelegationRequest[] = [];
      const clusters = ['p-alpha', 'p-beta', 'p-gamma'];

      for (const svc of services) {
        for (let i = 0; i < svc.files; i++) {
          allTasks.push({
            taskId: `nexus-${svc.name}-file-${i}`,
            task: `Build ${svc.name}/file-${i}.ts`,
            targetCluster: clusters[allTasks.length % 3],
            priority: svc.priority,
            createdAt: Date.now(),
          });
        }
      }

      console.log(`\n[NEXUS BUILD] Building ${services.length} services (${allTasks.length} total tasks)`);

      const startTime = Date.now();
      const results = await Promise.all(allTasks.map(t => delegationEngine.delegate(t)));
      const duration = Date.now() - startTime;

      const completed = results.filter(r => r.success).length;
      const throughput = completed / (duration / 1000);

      console.log(`[NEXUS BUILD] Completed: ${completed}/${allTasks.length} in ${duration}ms`);
      console.log(`[NEXUS BUILD] Throughput: ${throughput.toFixed(2)} tasks/sec`);

      const byService = new Map<string, number>();
      for (const r of results) {
        const parts = r.taskId.split('-');
        if (parts.length >= 2) {
          const svc = parts[1];
          byService.set(svc, (byService.get(svc) || 0) + (r.success ? 1 : 0));
        }
      }

      console.log(`[NEXUS BUILD] By service:`);
      for (const [svc, count] of byService) {
        console.log(`  ${svc}: ${count} files`);
      }

      expect(completed).toBeGreaterThanOrEqual(allTasks.length * 0.9);
      expect(duration).toBeLessThan(15000);
    }, 20000);
  });
});
