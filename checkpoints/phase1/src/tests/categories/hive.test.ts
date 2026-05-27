/**
 * src/tests/categories/hive.test.ts
 * 
 * Hive Mind Mechanical Tests
 * 
 * Tests Kraken Hive Mind storage, search, and retrieval.
 */

import { describe, test, expect, beforeAll, afterEach } from 'bun:test';
import { KrakenHiveEngine } from '../../kraken-hive/index.js';
import * as fs from 'fs';
import * as path from 'path';

const TEST_HIVE_DIR = '/tmp/kraken-hive-test';

describe('Hive Mind Mechanical Tests', () => {
  let hive: KrakenHiveEngine;

  beforeAll(() => {
    hive = new KrakenHiveEngine();
  });

  afterEach(() => {
    // Clean up test files after each test
    try {
      if (fs.existsSync(TEST_HIVE_DIR)) {
        fs.rmSync(TEST_HIVE_DIR, { recursive: true, force: true });
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Test 2.1: Hive Namespace Isolation', () => {
    test('should use kraken-hive namespace', async () => {
      // Store a pattern
      await hive.rememberPattern({
        type: 'pattern',
        id: 'isolation-test',
        description: 'Namespace isolation test',
        content: 'Testing namespace isolation',
        createdAt: Date.now(),
      });

      // Should exist in kraken-hive directory
      const expectedPath = '/home/leviathan/.local/share/opencode/kraken-hive/patterns/isolation-test.md';
      
      // Verify it's NOT in hive-mind
      const hiveMindPath = '/home/leviathan/.local/share/opencode/hive-mind/patterns/isolation-test.md';
      expect(fs.existsSync(hiveMindPath)).toBe(false);

      // Verify it IS in kraken-hive
      expect(fs.existsSync(expectedPath)).toBe(true);
    });
  });

  describe('Test 2.2: Pattern Storage', () => {
    test('should store pattern correctly', async () => {
      await hive.rememberPattern({
        type: 'pattern',
        id: 'test-pattern',
        description: 'Test pattern',
        content: 'This is a test pattern for verification',
        createdAt: Date.now(),
      });

      const filePath = '/home/leviathan/.local/share/opencode/kraken-hive/patterns/test-pattern.md';
      expect(fs.existsSync(filePath)).toBe(true);

      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('Test pattern');
      expect(content).toContain('This is a test pattern');
    });

    test('should store with correct format', async () => {
      await hive.rememberPattern({
        type: 'pattern',
        id: 'format-test',
        description: 'Format test pattern',
        content: 'Testing pattern format',
        taskId: 'task-123',
        clusterId: 'cluster-alpha',
        createdAt: Date.now(),
      });

      const filePath = '/home/leviathan/.local/share/opencode/kraken-hive/patterns/format-test.md';
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('# Pattern: Format test pattern');
      expect(content).toContain('## Type: pattern');
      expect(content).toContain('## Task: task-123');
      expect(content).toContain('## Cluster: cluster-alpha');
    });
  });

  describe('Test 2.3: Pattern Search', () => {
    test('should find stored patterns', async () => {
      // Store a pattern
      await hive.rememberPattern({
        type: 'pattern',
        id: 'searchable-pattern',
        description: 'Searchable pattern for testing',
        content: 'This pattern should be searchable',
        createdAt: Date.now(),
      });

      // Search for it
      const results = await hive.search('searchable');

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.title === 'searchable-pattern')).toBe(true);
    });

    test('should return relevance score', async () => {
      await hive.rememberPattern({
        type: 'pattern',
        id: 'relevance-test',
        description: 'Relevance scoring test',
        content: 'Testing relevance scoring algorithm',
        createdAt: Date.now(),
      });

      const results = await hive.search('relevance');

      expect(results.length).toBeGreaterThan(0);
      const found = results.find(r => r.title === 'relevance-test');
      expect(found?.relevance).toBeGreaterThan(0);
    });
  });

  describe('Test 2.4: Pattern Retrieval', () => {
    test('should return full content on search', async () => {
      const testContent = 'Full content retrieval test - specific content';
      await hive.rememberPattern({
        type: 'pattern',
        id: 'full-content-test',
        description: 'Full content test',
        content: testContent,
        createdAt: Date.now(),
      });

      const results = await hive.search('specific content');

      expect(results.length).toBeGreaterThan(0);
      const found = results.find(r => r.title === 'full-content-test');
      expect(found?.content).toContain('specific content');
    });
  });

  describe('Test 2.5: Category Filtering', () => {
    test('should filter patterns by category', async () => {
      // Store a pattern
      await hive.rememberPattern({
        type: 'pattern',
        id: 'filter-test-pattern',
        description: 'Filter test',
        content: 'Testing category filter',
        createdAt: Date.now(),
      });

      // Search patterns only
      const patternResults = await hive.search('filter', { category: 'patterns' });
      expect(patternResults.some(r => r.type === 'pattern')).toBe(true);
    });
  });

  describe('Test 2.6: Failure Storage', () => {
    test('should store failure records', async () => {
      await hive.rememberFailure({
        id: 'test-failure',
        pattern: 'Test failure pattern',
        cause: 'Testing failure storage',
        solution: 'This is how to fix it',
        taskId: 'task-456',
        clusterId: 'cluster-beta',
        createdAt: Date.now(),
      });

      const filePath = '/home/leviathan/.local/share/opencode/kraken-hive/failures/test-failure.md';
      expect(fs.existsSync(filePath)).toBe(true);

      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('# Failure: Test failure pattern');
      expect(content).toContain('Testing failure storage');
      expect(content).toContain('This is how to fix it');
    });
  });

  describe('Test 2.7: Session Memory', () => {
    test('should store session memories with session isolation', async () => {
      await hive.rememberSession('session-123', 'test-session-memory', 'This is session 123 data');

      const filePath = '/home/leviathan/.local/share/opencode/kraken-hive/sessions/session-123/test-session-memory.md';
      expect(fs.existsSync(filePath)).toBe(true);

      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('This is session 123 data');
    });

    test('session memories should be isolated', async () => {
      await hive.rememberSession('session-A', 'memory-A', 'Data for session A');
      await hive.rememberSession('session-B', 'memory-B', 'Data for session B');

      const pathA = '/home/leviathan/.local/share/opencode/kraken-hive/sessions/session-A/memory-A.md';
      const pathB = '/home/leviathan/.local/share/opencode/kraken-hive/sessions/session-B/memory-B.md';

      expect(fs.existsSync(pathA)).toBe(true);
      expect(fs.existsSync(pathB)).toBe(true);

      const contentA = fs.readFileSync(pathA, 'utf-8');
      const contentB = fs.readFileSync(pathB, 'utf-8');

      expect(contentA).toContain('Data for session A');
      expect(contentB).toContain('Data for session B');
      expect(contentA).not.toContain('Data for session B');
      expect(contentB).not.toContain('Data for session A');
    });
  });

  describe('Test 2.8: Search Relevance Ordering', () => {
    test('should order results by relevance', async () => {
      // Store multiple patterns with different relevance
      await hive.rememberPattern({
        type: 'pattern',
        id: 'high-relevance',
        description: 'TypeScript testing patterns',
        content: 'TypeScript is a typed superset of JavaScript',
        createdAt: Date.now(),
      });

      await hive.rememberPattern({
        type: 'pattern',
        id: 'low-relevance',
        description: 'Java code without TypeScript',
        content: 'Java is a separate programming language',
        createdAt: Date.now(),
      });

      // Search for TypeScript
      const results = await hive.search('TypeScript testing');

      if (results.length >= 2) {
        expect(results[0].relevance).toBeGreaterThanOrEqual(results[1].relevance);
      }
    });
  });
});

describe('Hive Mind getContextForTask', () => {
  let hive: KrakenHiveEngine;

  beforeAll(async () => {
    hive = new KrakenHiveEngine();
    
    // Setup test data
    await hive.rememberPattern({
      type: 'pattern',
      id: 'context-test-pattern',
      description: 'Task context test',
      content: 'Testing getContextForTask',
      createdAt: Date.now(),
    });

    await hive.rememberFailure({
      id: 'context-test-failure',
      pattern: 'Context failure test',
      cause: 'Testing failure injection',
      createdAt: Date.now(),
    });
  });

  afterEach(() => {
    try {
      if (fs.existsSync('/home/leviathan/.local/share/opencode/kraken-hive')) {
        fs.rmSync('/home/leviathan/.local/share/opencode/kraken-hive', { recursive: true, force: true });
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  test('should return context for task', async () => {
    const context = await hive.getContextForTask('Testing get context for task');

    expect(context).toBeDefined();
    expect(context.taskId).toBeDefined();
    expect(Array.isArray(context.patterns)).toBe(true);
    expect(Array.isArray(context.failures)).toBe(true);
    expect(Array.isArray(context.previousWork)).toBe(true);
  });

  test('should synthesize context correctly', () => {
    const memories = [
      { type: 'pattern' as const, title: 'pattern1', relevance: 2, uri: 'test://1' },
      { type: 'failure' as const, title: 'failure1', relevance: 1, uri: 'test://2' },
      { type: 'session' as const, title: 'session1', relevance: 3, uri: 'test://3' },
    ];

    const context = hive.synthesizeContext(memories, 'test');

    expect(context.patterns.length).toBe(1);
    expect(context.failures.length).toBe(1);
    expect(context.previousWork.length).toBe(1);
    expect(context.clusterContext.commonPatterns).toContain('pattern1');
    expect(context.clusterContext.knownFailures).toContain('failure1');
  });
});
