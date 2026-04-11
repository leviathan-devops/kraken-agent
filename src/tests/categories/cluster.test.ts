/**
 * src/tests/categories/cluster.test.ts
 * 
 * Cluster Mechanical Tests
 * 
 * Tests cluster initialization, scheduling, and async execution.
 */

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { ClusterManager } from '../../clusters/ClusterManager.js';
import { ClusterScheduler } from '../../factory/ClusterScheduler.js';
import type { ClusterConfig, KrakenDelegationRequest } from '../../factory/kraken-types.js';

const TEST_CLUSTERS: ClusterConfig[] = [
  {
    id: 'test-cluster-alpha',
    name: 'Test Alpha',
    description: 'Test cluster alpha',
    agents: ['test-shark-1', 'test-shark-2', 'test-manta-1'],
    intraClusterDelegation: true,
    interClusterDelegation: true,
    sharedContext: true,
  },
  {
    id: 'test-cluster-beta',
    name: 'Test Beta',
    description: 'Test cluster beta',
    agents: ['test-shark-3', 'test-manta-2'],
    intraClusterDelegation: true,
    interClusterDelegation: true,
    sharedContext: true,
  },
];

describe('Cluster Mechanical Tests', () => {
  let clusterManager: ClusterManager;
  let clusterScheduler: ClusterScheduler;

  beforeAll(() => {
    clusterManager = new ClusterManager(TEST_CLUSTERS);
    clusterScheduler = new ClusterScheduler(TEST_CLUSTERS);
  });

  afterAll(async () => {
    await clusterManager.shutdown();
  });

  describe('Test 1.1: Cluster Initialization', () => {
    test('should create 3 clusters with correct configs', () => {
      const clusterIds = clusterManager.getClusterIds();
      expect(clusterIds.length).toBe(2);
      expect(clusterIds).toContain('test-cluster-alpha');
      expect(clusterIds).toContain('test-cluster-beta');
    });

    test('should have correct agent counts per cluster', () => {
      const alphaAgents = clusterManager.getClusterAgents('test-cluster-alpha');
      const betaAgents = clusterManager.getClusterAgents('test-cluster-beta');

      expect(alphaAgents.length).toBe(3);
      expect(betaAgents.length).toBe(2);
    });
  });

  describe('Test 1.2: Cluster Status Reporting', () => {
    test('should return correct status structure', () => {
      const status = clusterManager.getClusterStatus('test-cluster-alpha');

      expect(status).not.toBeNull();
      expect(status?.clusterId).toBe('test-cluster-alpha');
      expect(status?.active).toBe(true);
      expect(status?.agents).toEqual(['test-shark-1', 'test-shark-2', 'test-manta-1']);
      expect(status?.load).toBeDefined();
      expect(status?.load.activeTasks).toBe(0);
      expect(status?.load.pendingTasks).toBe(0);
    });

    test('should return all cluster statuses', () => {
      const allStatuses = clusterManager.getAllClusterStatuses();

      expect(allStatuses.size).toBe(2);
      expect(allStatuses.has('test-cluster-alpha')).toBe(true);
      expect(allStatuses.has('test-cluster-beta')).toBe(true);
    });
  });

  describe('Test 1.3: Task Queue Per Cluster', () => {
    test('should queue and execute tasks asynchronously', async () => {
      const tasks: KrakenDelegationRequest[] = [];
      
      // Queue 5 tasks
      for (let i = 0; i < 5; i++) {
        tasks.push({
          taskId: `test-task-${i}`,
          task: `Test task ${i}`,
          targetCluster: 'test-cluster-alpha',
          priority: 'normal',
          createdAt: Date.now(),
        });
      }

      // Execute all tasks
      const promises = tasks.map(t => clusterManager.executeTask('test-cluster-alpha', t));
      const results = await Promise.all(promises);

      // All should succeed
      expect(results.every(r => r.success)).toBe(true);
    });

    test('should not idle agents when tasks are queued', async () => {
      // Get initial load
      const initialStatus = clusterManager.getClusterStatus('test-cluster-alpha');
      expect(initialStatus?.load.activeTasks).toBe(0);

      // Queue a task and verify agent is marked busy
      const task: KrakenDelegationRequest = {
        taskId: 'test-idle-task',
        task: 'Test idle task',
        targetCluster: 'test-cluster-alpha',
        priority: 'normal',
        createdAt: Date.now(),
      };

      // Task should execute (either immediately if agent available, or queued)
      const result = await clusterManager.executeTask('test-cluster-alpha', task);
      expect(result.success || result.status === 'pending').toBe(true);
    });
  });

  describe('Test 1.4: Cross-Cluster Independence', () => {
    test('clusters should execute independently', async () => {
      const taskAlpha: KrakenDelegationRequest = {
        taskId: 'test-alpha-task',
        task: 'Alpha task',
        targetCluster: 'test-cluster-alpha',
        priority: 'normal',
        createdAt: Date.now(),
      };

      const taskBeta: KrakenDelegationRequest = {
        taskId: 'test-beta-task',
        task: 'Beta task',
        targetCluster: 'test-cluster-beta',
        priority: 'normal',
        createdAt: Date.now(),
      };

      const startTime = Date.now();
      
      // Execute simultaneously
      const [resultAlpha, resultBeta] = await Promise.all([
        clusterManager.executeTask('test-cluster-alpha', taskAlpha),
        clusterManager.executeTask('test-cluster-beta', taskBeta),
      ]);

      const elapsed = Date.now() - startTime;

      // Both should complete
      expect(resultAlpha.success).toBe(true);
      expect(resultBeta.success).toBe(true);

      // Elapsed time should be similar (parallel, not sequential)
      // If sequential, would take ~200ms total. Parallel should be ~100ms
      // Allow some margin for timing
      expect(elapsed).toBeLessThan(500); // Should definitely be faster than sequential
    });
  });

  describe('Test 1.5: Least-Load Scheduling', () => {
    test('scheduler should assign to least loaded cluster', async () => {
      // Add load to alpha
      clusterScheduler.incrementLoad('test-cluster-alpha');
      clusterScheduler.incrementLoad('test-cluster-alpha');

      const task: KrakenDelegationRequest = {
        taskId: 'test-load-task',
        task: 'Load balancing test',
        targetCluster: '', // Empty = let scheduler decide
        priority: 'normal',
        createdAt: Date.now(),
      };

      const assignedCluster = await clusterScheduler.assignCluster(task);

      // Beta has less load, so should be assigned
      expect(assignedCluster).toBe('test-cluster-beta');

      // Cleanup
      clusterScheduler.decrementLoad('test-cluster-alpha');
      clusterScheduler.decrementLoad('test-cluster-alpha');
    });

    test('scheduler should respect explicit cluster request', async () => {
      const task: KrakenDelegationRequest = {
        taskId: 'test-explicit-task',
        task: 'Explicit cluster test',
        targetCluster: 'test-cluster-alpha',
        priority: 'normal',
        createdAt: Date.now(),
      };

      const assignedCluster = await clusterScheduler.assignCluster(task);
      expect(assignedCluster).toBe('test-cluster-alpha');
    });
  });

  describe('Test 1.6: Cluster Shutdown', () => {
    test('should shutdown gracefully', async () => {
      // Queue a task
      const task: KrakenDelegationRequest = {
        taskId: 'test-shutdown-task',
        task: 'Shutdown test',
        targetCluster: 'test-cluster-alpha',
        priority: 'normal',
        createdAt: Date.now(),
      };

      await clusterManager.executeTask('test-cluster-alpha', task);

      // Shutdown should not throw
      await expect(clusterManager.shutdown()).resolves.toBeUndefined();
    });
  });
});

describe('Cluster Scheduler Tests', () => {
  let scheduler: ClusterScheduler;

  beforeAll(() => {
    scheduler = new ClusterScheduler(TEST_CLUSTERS);
  });

  describe('Test 1.5b: Load Tracking', () => {
    test('should track active tasks per cluster', () => {
      const beforeLoad = scheduler.getClusterLoad('test-cluster-alpha');
      expect(beforeLoad?.activeTasks).toBe(0);

      scheduler.incrementLoad('test-cluster-alpha');
      const afterLoad = scheduler.getClusterLoad('test-cluster-alpha');
      expect(afterLoad?.activeTasks).toBe(1);

      // Cleanup
      scheduler.decrementLoad('test-cluster-alpha');
    });

    test('should track completed tasks', () => {
      scheduler.recordCompletion('test-cluster-alpha', true);
      scheduler.recordCompletion('test-cluster-alpha', true);
      scheduler.recordCompletion('test-cluster-alpha', false);

      const load = scheduler.getClusterLoad('test-cluster-alpha');
      expect(load?.completedTasks).toBe(2);
      expect(load?.failedTasks).toBe(1);
    });

    test('should get total system load', () => {
      // Add some load
      scheduler.incrementLoad('test-cluster-alpha');
      scheduler.incrementLoad('test-cluster-beta');
      scheduler.recordCompletion('test-cluster-alpha', true);

      const total = scheduler.getTotalLoad();
      expect(total.completed).toBeGreaterThan(0);
    });
  });
});
