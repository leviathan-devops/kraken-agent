/**
 * src/kraken-hive/index.ts
 * 
 * Kraken-Hive Engine
 * 
 * Self-contained Hive Mind for Kraken orchestrator only.
 * All data isolated to viking://resources/kraken-hive/
 * No other agents have access - they can't even see the tools.
 */

import * as fs from 'fs';
import * as path from 'path';

const KRAKEN_HIVE_NAMESPACE = 'viking://resources/kraken-hive';
const LOCAL_FALLBACK_DIR = '/home/leviathan/.local/share/opencode/kraken-hive';

const MEMORY_CATEGORIES = {
  CLUSTERS: 'clusters',
  SESSIONS: 'sessions',
  PATTERNS: 'patterns',
  DECISIONS: 'decisions',
  FAILURES: 'failures',
  BREAKTHROUGHS: 'breakthroughs',
} as const;

export interface HivememoryResult {
  uri: string;
  type: 'pattern' | 'failure' | 'session' | 'decision' | 'breakthrough';
  title: string;
  relevance: number;
  content?: string;
}

export interface HiveSearchFilters {
  category?: 'all' | 'clusters' | 'sessions' | 'patterns' | 'decisions' | 'failures';
  limit?: number;
  clusterId?: string;
}

export interface Pattern {
  type: 'pattern' | 'breakthrough';
  id: string;
  description: string;
  taskId?: string;
  clusterId?: string;
  content: string;
  createdAt: number;
}

export interface FailureRecord {
  id: string;
  pattern: string;
  cause: string;
  solution?: string;
  taskId?: string;
  clusterId?: string;
  createdAt: number;
}

export interface ClusterContext {
  clusterId: string;
  recentTasks: string[];
  commonPatterns: string[];
  knownFailures: string[];
}

export interface InjectedTaskContext {
  taskId: string;
  patterns: HivememoryResult[];
  failures: HivememoryResult[];
  previousWork: HivememoryResult[];
  clusterContext: ClusterContext;
}

export class KrakenHiveEngine {
  private localFallbackDir: string;

  constructor() {
    this.localFallbackDir = LOCAL_FALLBACK_DIR;
    this.ensureLocalStorage();
  }

  private ensureLocalStorage(): void {
    if (!fs.existsSync(this.localFallbackDir)) {
      fs.mkdirSync(this.localFallbackDir, { recursive: true });
    }
  }

  private getCategoryPath(category: string, subPath?: string): string {
    const base = path.join(this.localFallbackDir, category);
    if (subPath) {
      return path.join(base, subPath);
    }
    return base;
  }

  /**
   * Search across all Kraken Hive memories
   */
  async search(query: string, filters?: HiveSearchFilters): Promise<HivememoryResult[]> {
    const results: HivememoryResult[] = [];
    const limit = filters?.limit || 10;
    const queryLower = query.toLowerCase();

    // Determine categories to search
    const categories = this.getCategoriesToSearch(filters);

    for (const category of categories) {
      if (results.length >= limit) break;

      const categoryPath = this.getCategoryPath(category);
      if (!fs.existsSync(categoryPath)) continue;

      // Search within category
      const searchResults = await this.searchCategory(categoryPath, queryLower, limit - results.length);
      results.push(...searchResults);
    }

    // Sort by relevance (simple keyword match count)
    results.sort((a, b) => b.relevance - a.relevance);

    return results.slice(0, limit);
  }

  private getCategoriesToSearch(filters?: HiveSearchFilters): string[] {
    if (!filters?.category || filters.category === 'all') {
      return Object.values(MEMORY_CATEGORIES);
    }

    const categoryMap: Record<string, string> = {
      clusters: MEMORY_CATEGORIES.CLUSTERS,
      sessions: MEMORY_CATEGORIES.SESSIONS,
      patterns: MEMORY_CATEGORIES.PATTERNS,
      decisions: MEMORY_CATEGORIES.DECISIONS,
      failures: MEMORY_CATEGORIES.FAILURES,
    };

    return [categoryMap[filters.category] || MEMORY_CATEGORIES.CLUSTERS];
  }

  private async searchCategory(
    dirPath: string, 
    query: string, 
    limit: number
  ): Promise<HivememoryResult[]> {
    const results: HivememoryResult[] = [];

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (results.length >= limit) break;

        if (entry.isDirectory()) {
          // Recurse into subdirectories
          const subResults = await this.searchCategory(
            path.join(dirPath, entry.name),
            query,
            limit - results.length
          );
          results.push(...subResults);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          // Check file content
          const filePath = path.join(dirPath, entry.name);
          const content = fs.readFileSync(filePath, 'utf-8');
          const contentLower = content.toLowerCase();

          // Count keyword matches
          const queryWords = query.split(' ');
          let relevance = 0;
          for (const word of queryWords) {
            if (contentLower.includes(word)) {
              relevance++;
            }
          }

          if (relevance > 0) {
            // Determine type from path
            const type = this.determineTypeFromPath(dirPath);

            results.push({
              uri: `${KRAKEN_HIVE_NAMESPACE}/${path.relative(this.localFallbackDir, filePath)}`,
              type,
              title: entry.name.replace('.md', ''),
              relevance,
              content: content.slice(0, 500), // First 500 chars for context
            });
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read - skip
    }

    return results;
  }

  private determineTypeFromPath(filePath: string): HivememoryResult['type'] {
    if (filePath.includes(MEMORY_CATEGORIES.PATTERNS)) return 'pattern';
    if (filePath.includes(MEMORY_CATEGORIES.FAILURES)) return 'failure';
    if (filePath.includes(MEMORY_CATEGORIES.SESSIONS)) return 'session';
    if (filePath.includes(MEMORY_CATEGORIES.DECISIONS)) return 'decision';
    if (filePath.includes(MEMORY_CATEGORIES.BREAKTHROUGHS)) return 'breakthrough';
    return 'session';
  }

  /**
   * Store cluster-specific memory
   */
  async rememberCluster(clusterId: string, key: string, content: string): Promise<void> {
    const dirPath = this.getCategoryPath(MEMORY_CATEGORIES.CLUSTERS, clusterId);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const filePath = path.join(dirPath, `${key}.md`);
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  /**
   * Store session memory
   */
  async rememberSession(sessionId: string, key: string, content: string): Promise<void> {
    const dirPath = this.getCategoryPath(MEMORY_CATEGORIES.SESSIONS, sessionId);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const filePath = path.join(dirPath, `${key}.md`);
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  /**
   * Store pattern for future reuse
   */
  async rememberPattern(pattern: Pattern): Promise<void> {
    const dirPath = this.getCategoryPath(MEMORY_CATEGORIES.PATTERNS);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const content = `# Pattern: ${pattern.description}

## Type: ${pattern.type}
${pattern.taskId ? `## Task: ${pattern.taskId}` : ''}
${pattern.clusterId ? `## Cluster: ${pattern.clusterId}` : ''}
## Created: ${new Date(pattern.createdAt).toISOString()}

${pattern.content}
`;

    const filePath = path.join(dirPath, `${pattern.id}.md`);
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  /**
   * Store failure record
   */
  async rememberFailure(failure: FailureRecord): Promise<void> {
    const dirPath = this.getCategoryPath(MEMORY_CATEGORIES.FAILURES);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const content = `# Failure: ${failure.pattern}

## Cause
${failure.cause}

${failure.solution ? `## Solution\n${failure.solution}` : ''}
${failure.taskId ? `## Task: ${failure.taskId}` : ''}
${failure.clusterId ? `## Cluster: ${failure.clusterId}` : ''}
## Created: ${new Date(failure.createdAt).toISOString()}
`;

    const filePath = path.join(dirPath, `${failure.id}.md`);
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  /**
   * Get memories related to a specific cluster
   */
  async getClusterContext(clusterId: string): Promise<ClusterContext> {
    const context: ClusterContext = {
      clusterId,
      recentTasks: [],
      commonPatterns: [],
      knownFailures: [],
    };

    // Get recent cluster memories
    const clusterPath = this.getCategoryPath(MEMORY_CATEGORIES.CLUSTERS, clusterId);
    if (fs.existsSync(clusterPath)) {
      try {
        const files = fs.readdirSync(clusterPath);
        context.recentTasks = files.map(f => f.replace('.md', ''));
      } catch {
        // Directory doesn't exist
      }
    }

    // Get common patterns
    const patterns = await this.search('', { category: 'patterns', limit: 5 });
    context.commonPatterns = patterns.map(p => p.title);

    // Get known failures
    const failures = await this.search('', { category: 'failures', limit: 5 });
    context.knownFailures = failures.map(f => f.title);

    return context;
  }

  /**
   * Get context for a specific task
   */
  async getContextForTask(task: string): Promise<InjectedTaskContext> {
    const taskId = `task_${Date.now()}`;

    // Search for relevant memories
    const patterns = await this.search(task, { category: 'patterns', limit: 3 });
    const failures = await this.search(task, { category: 'failures', limit: 3 });
    const previousWork = await this.search(task, { category: 'sessions', limit: 3 });

    // Get cluster context if task mentions a cluster
    let clusterContext: ClusterContext | undefined;
    const clusterMatch = task.match(/cluster[_-]?(alpha|beta|gamma)/i);
    if (clusterMatch) {
      clusterContext = await this.getClusterContext(`cluster-${clusterMatch[1].toLowerCase()}`);
    }

    return {
      taskId,
      patterns,
      failures,
      previousWork,
      clusterContext: clusterContext || {
        clusterId: 'unknown',
        recentTasks: [],
        commonPatterns: [],
        knownFailures: [],
      },
    };
  }

  /**
   * Synthesize context for injection into task
   */
  synthesizeContext(
    memories: HivememoryResult[], 
    taskType: string
  ): InjectedTaskContext {
    const patterns = memories.filter(m => m.type === 'pattern');
    const failures = memories.filter(m => m.type === 'failure');
    const previousWork = memories.filter(m => m.type === 'session');

    return {
      taskId: `task_${Date.now()}`,
      patterns,
      failures,
      previousWork,
      clusterContext: {
        clusterId: 'synthesized',
        recentTasks: [],
        commonPatterns: patterns.map(p => p.title),
        knownFailures: failures.map(f => f.title),
      },
    };
  }
}
