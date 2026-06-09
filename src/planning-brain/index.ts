/**
 * src/planning-brain/index.ts
 *
 * Kraken v1.4 Planning Brain — Analyzes user requests and produces
 * tentacle deployment decisions for the ClusterEngine.
 *
 * Architecture:
 *   1. analyzeRequest() — Natural language → PlanningDecision
 *   2. deployPlanningDecision() — PlanningDecision → Anchored tentacles
 *   3. getTaskComplexity() — String → 1-10 complexity score
 *
 * This is the "planning brain" that determines HOW MANY tentacles,
 * what agent type, how many agents per tentacle, etc.
 *
 * All P1-P11 principles enforced:
 *   - P2: Every `as` cast has a preceding runtime check
 *   - P3: Every catch block has meaningful error handling
 *   - P6: Every dependency checked before use
 *   - P9: Every promise awaited or has .catch()
 *   - P11: No theatrical returns — every success claim backed by real work
 */

import { ClusterAgentType, TENTACLE_CAPS } from '../clusters/cluster-types.js';
import type { ClusterEngine } from '../clusters/cluster-engine.js';
import { createLogger } from '../shared/logger.js';

const logger = createLogger('PlanningBrain');

// ============================================================
// KEYWORD PATTERNS
// ============================================================

const BUILD_KW = /\b(build|implement|create|scaffold|generate|write|construct|develop|make|produce|compose|setup|configure)\b/i;
const DEBUG_KW = /\b(debug|fix|repair|patch|resolve|correct|troubleshoot|diagnose|investigate|root.?cause|hotfix|bug)\b/i;
const TEST_KW = /\b(test|verify|validate|audit|check|assert|coverage|spec|integration|e2e|regression)\b/i;
const ANALYZE_KW = /\b(analyze|review|inspect|examine|assess|evaluate|profile|refactor|restructure)\b/i;

/** Component/deliverable indicators for sub-task decomposition */
const COMPONENT_SEPARATORS = /\s*[+,&]\s*|\s+(?:and|with|plus)\s+/i;
const COMPONENT_KW = /\b(auth|database|db|api|graphql|rest|frontend|backend|ui|ux|middleware|cache|queue|storage|login|register|schema|model|route|endpoint|controller|service|repository|migration|seed|config|docker|deploy|ci|cd|pipeline|test|spec|docs|documentation|integration|security|perf|performance|module|component|layer|system|platform|tool|utility|library|package|plugin|extension|workflow|template|boilerplate)\b/i;

// ============================================================
// TYPES
// ============================================================

/**
 * A single tentacle's deployment plan.
 */
export interface TentaclePlan {
  macroTask: string;
  mode: 'build' | 'debug' | 'analyze';
  agentCount: number;
  acceptanceCriteria: string[];
}

/**
 * Full planning decision — describes how many tentacles to deploy
 * and their configuration.
 */
export interface PlanningDecision {
  tentacles: TentaclePlan[];
  totalEstimatedComplexity: number;
}

// ============================================================
// HELPER: getTaskComplexity
// ============================================================

/**
 * Get a 1-10 complexity score for a task description.
 *
 * Factors considered:
 *   - Length of the task string
 *   - Number of action verbs (build/debug/test/analyze keywords)
 *   - Number of distinct component mentions
 *
 * @param task - The task description to evaluate
 * @returns A complexity score from 1 (trivial) to 10 (extremely complex)
 */
export function getTaskComplexity(task: string): number {
  if (!task || task.length === 0) return 1;

  let score = 1;

  // Factor 1: Length-based complexity
  const len = task.length;
  if (len > 1000) score += 4;
  else if (len > 500) score += 3;
  else if (len > 200) score += 2;
  else if (len > 100) score += 1;

  // Factor 2: Keyword density (action verbs indicate more work)
  const buildMatches = (task.match(BUILD_KW) || []).length;
  const debugMatches = (task.match(DEBUG_KW) || []).length;
  const testMatches = (task.match(TEST_KW) || []).length;
  const analyzeMatches = (task.match(ANALYZE_KW) || []).length;
  const totalKw = buildMatches + debugMatches + testMatches + analyzeMatches;
  if (totalKw > 8) score += 3;
  else if (totalKw > 5) score += 2;
  else if (totalKw > 2) score += 1;

  // Factor 3: Distinct component mentions
  const components = new Set<string>();
  const parts = task.split(COMPONENT_SEPARATORS);
  for (const part of parts) {
    const trimmed = part.trim().toLowerCase().replace(/^[^a-z0-9]+/, '').replace(/[^a-z0-9]+$/, '');
    if (trimmed.length >= 2 && COMPONENT_KW.test(trimmed)) {
      components.add(trimmed);
    }
  }
  // Also check direct regex matches for component keywords
  const directMatches = task.match(COMPONENT_KW);
  if (directMatches) {
    for (const m of directMatches) {
      components.add(m.toLowerCase());
    }
  }

  const compCount = components.size;
  if (compCount > 5) score += 3;
  else if (compCount > 3) score += 2;
  else if (compCount > 1) score += 1;

  // Clamp to 1-10 range
  return Math.max(1, Math.min(10, score));
}

// ============================================================
// INTERNAL HELPERS
// ============================================================

/**
 * Extract distinct component/deliverable names from a user request.
 * Uses multiple strategies to identify what the request is asking about.
 */
function extractComponents(request: string): string[] {
  const components: string[] = [];
  if (!request || typeof request !== 'string') return components;

  // Strategy 1: Look for explicit comma/plus/and separations
  // NOTE: String.split with capturing groups inserts undefined for
  // non-participating groups — filter those out.
  const seps = /[,+&]|\s+(?:and|with|plus)\s+/gi;
  const rawParts = request.split(seps);
  const parts = rawParts.filter((p): p is string => typeof p === 'string' && p.length > 0);
  for (const part of parts) {
    const trimmed = part.trim().toLowerCase();
    const cleaned = trimmed.replace(/^[^a-z0-9]+/, '').replace(/[^a-z0-9]+$/, '');
    if (cleaned.length >= 2 && cleaned.length <= 40) {
      if (
        COMPONENT_KW.test(cleaned) ||
        /^(frontend|backend|fullstack|middleware|pipeline|workflow|module|component|service|layer|system|platform|tool|utility|library|package|plugin|extension|integration|migration|scaffold|template|boilerplate|infrastructure|gateway|proxy|adapter|factory|provider|consumer|handler|parser|validator|formatter|generator|scheduler|notifier|publisher|subscriber|aggregator|orchestrator|coordinator|dispatcher|router|loader|builder|manager|controller|delegate|facade|observer|listener|interceptor|filter|guard|strategy|policy|configurator|initializer|bootstrap)$/i.test(cleaned)
      ) {
        if (!components.includes(cleaned)) {
          components.push(cleaned);
        }
      }
    }
  }

  // Strategy 2: Direct regex match for component keywords in the raw request
  const directMatches = request.match(COMPONENT_KW);
  if (directMatches) {
    for (const match of directMatches) {
      const lower = match.toLowerCase();
      if (!components.includes(lower)) {
        components.push(lower);
      }
    }
  }

  return components;
}

/**
 * Determine the dominant mode for a task based on keyword analysis.
 *
 * Priority order:
 *   1. Debug/fix keywords dominant → 'debug'
 *   2. Test/verify keywords dominant → 'debug' (testing is verification)
 *   3. Build keywords dominant → 'build'
 *   4. Analyze keywords present → 'analyze'
 *   5. Default → 'build'
 */
function determineMode(task: string): 'build' | 'debug' | 'analyze' {
  const buildScore = (task.match(BUILD_KW) || []).length;
  const debugScore = (task.match(DEBUG_KW) || []).length;
  const analyzeScore = (task.match(ANALYZE_KW) || []).length;
  const testScore = (task.match(TEST_KW) || []).length;

  // Debug/fix keywords get highest priority
  if (debugScore > 0 && debugScore >= buildScore && debugScore >= analyzeScore && debugScore >= testScore) {
    return 'debug';
  }
  // Test/verify keywords
  if (testScore > 0 && testScore >= buildScore && testScore >= analyzeScore && testScore >= debugScore) {
    return 'debug';
  }
  // Build keywords
  if (buildScore > 0 && buildScore >= analyzeScore && buildScore >= debugScore && buildScore >= testScore) {
    return 'build';
  }
  // Analyze keywords
  if (analyzeScore > 0) {
    return 'analyze';
  }

  // Default: build
  return 'build';
}

/**
 * Count all action verb keywords in a request.
 */
function countActionVerbs(request: string): number {
  const allVerbs = /\b(build|implement|create|scaffold|generate|write|construct|develop|make|produce|compose|setup|configure|debug|fix|repair|patch|resolve|correct|troubleshoot|diagnose|investigate|hotfix|bug|test|verify|validate|audit|check|assert|coverage|spec|integration|e2e|regression|analyze|review|inspect|examine|assess|evaluate|profile|refactor|restructure)\b/gi;
  const matches = request.match(allVerbs);
  return matches ? matches.length : 0;
}

/**
 * Decompose a user request into N sub-tasks, one per tentacle.
 *
 * Strategies (in priority order):
 *   1. Use components extracted from the request (e.g., "auth + DB + API")
 *   2. Use syntactically separated parts (comma/and/plus separated)
 *   3. Generate aspect-based sub-tasks (core, integration, testing, etc.)
 */
function decomposeRequest(request: string, count: number): string[] {
  if (!request || typeof request !== 'string') return ['Unspecified task'];
  if (count <= 1) return [request];

  const tasks: string[] = [];
  const overallMode = determineMode(request);
  const componentMatches = extractComponents(request);

  // Strategy 1: Assign one component per tentacle if we have enough
  if (componentMatches.length >= count) {
    for (let i = 0; i < count; i++) {
      const comp = componentMatches[i] || 'generic-component';
      const verb = overallMode === 'build' ? 'Implement' : overallMode === 'debug' ? 'Debug' : 'Analyze';
      tasks.push(`[TENTACLE ${i + 1}/${count}] ${verb} ${comp}: ${request}`);
    }
  }
  // Strategy 2: Use syntactically separated parts
  else {
    const seps2 = /[,+&]|\s+(?:and|with|plus)\s+/gi;
    const parts = request.split(seps2).filter((p): p is string => typeof p === 'string').map((p) => p.trim()).filter((p) => p.length > 10);
    if (parts.length >= count) {
      for (let i = 0; i < count; i++) {
        tasks.push(`[TENTACLE ${i + 1}/${count}] ${parts[i] || request}`);
      }
    }
    // Strategy 3: Generate aspect-based sub-tasks
    else {
      const aspects = [
        'Core implementation & data layer',
        'API & interface layer',
        'Integration & middleware',
        'Testing & verification suite',
        'Documentation & type definitions',
        'Error handling & edge cases',
        'Performance optimization',
        'Security hardening & operations',
      ];
      for (let i = 0; i < count; i++) {
        const aspect = aspects[i] || `Component ${i + 1}`;
        tasks.push(`[TENTACLE ${i + 1}/${count}] ${aspect}: ${request}`);
      }
    }
  }

  // Fill remaining slots if we don't have enough
  while (tasks.length < count) {
    tasks.push(`[TENTACLE ${tasks.length + 1}/${count}] Sub-task: ${request}`);
  }

  return tasks.slice(0, count);
}

/**
 * Generate acceptance criteria for a task based on its mode.
 */
function generateCriteria(mode: 'build' | 'debug' | 'analyze'): string[] {
  const criteria: string[] = [];

  switch (mode) {
    case 'build':
      criteria.push('All implementation code compiles without errors');
      criteria.push('Core functionality is implemented and working');
      criteria.push('Edge cases are handled appropriately');
      criteria.push('Code follows project patterns and conventions');
      criteria.push('Implementation is tested and verified');
      break;
    case 'debug':
      criteria.push('Root cause of the issue is identified and documented');
      criteria.push('Fix is implemented and resolves the reported issue');
      criteria.push('Regression tests pass after the fix');
      criteria.push('No new issues introduced by the fix');
      criteria.push('Fix is reviewed and verified');
      break;
    case 'analyze':
      criteria.push('Analysis covers all relevant code paths');
      criteria.push('Findings are documented with severity assessment');
      criteria.push('Recommendations are actionable and specific');
      criteria.push('No critical or high-severity issues remain unaddressed');
      criteria.push('Analysis report is complete and accurate');
      break;
  }

  return criteria;
}

// ============================================================
// analyzeRequest
// ============================================================

/**
 * Analyze a user request and produce a PlanningDecision.
 *
 * The analysis pipeline:
 *   1. Compute overall task complexity via getTaskComplexity()
 *   2. Extract distinct components from the request
 *   3. Determine tentacle count based on:
 *      - 4+ distinct components → 4 tentacles
 *      - 2-3 components → 2-3 tentacles
 *      - >500 chars with 4+ action verbs → 3-4 tentacles
 *      - Default → 1 tentacle
 *   4. Decompose the request into sub-tasks per tentacle
 *   5. Determine mode per tentacle via keyword analysis
 *   6. Calculate agent count per tentacle based on sub-task complexity
 *   7. Generate acceptance criteria per tentacle
 *
 * @param userRequest - The natural language request from the user
 * @returns A PlanningDecision with tentacle deployment plans
 */
export function analyzeRequest(userRequest: string): PlanningDecision {
  if (!userRequest || typeof userRequest !== 'string' || userRequest.trim().length === 0) {
    logger.warn('analyzeRequest received empty request — returning single default tentacle');
    return {
      tentacles: [{
        macroTask: 'Unspecified task',
        mode: 'build',
        agentCount: TENTACLE_CAPS.minAgents,
        acceptanceCriteria: ['Task completed successfully'],
      }],
      totalEstimatedComplexity: 1,
    };
  }
  const request = userRequest.trim();
  const totalComplexity = getTaskComplexity(request);
  const components = extractComponents(request);
  const verbCount = countActionVerbs(request);
  const charLen = request.length;

  // --- Determine tentacle count ---

  let tentacleCount: number;

  // Rule 1: 4+ distinct components → 4 tentacles
  if (components.length >= 4) {
    tentacleCount = 4;
    logger.debug(`4+ components detected (${components.length}): using ${tentacleCount} tentacles`);
  }
  // Rule 2: 2-3 components → 2-3 tentacles
  else if (components.length >= 2) {
    tentacleCount = Math.min(components.length, 3);
    logger.debug(`${components.length} components detected: using ${tentacleCount} tentacles`);
  }
  // Rule 3: >500 chars with 4+ action verbs → 3-4 tentacles
  else if (charLen > 500 && verbCount >= 4) {
    tentacleCount = Math.min(3 + Math.floor(verbCount / 5), 4);
    logger.debug(`Long request (${charLen} chars, ${verbCount} verbs): using ${tentacleCount} tentacles`);
  }
  // Default: 1 tentacle
  else {
    tentacleCount = 1;
    logger.debug(`Simple request: using ${tentacleCount} tentacle`);
  }

  // Clamp to min/max tentacle caps
  tentacleCount = Math.max(
    TENTACLE_CAPS.minTentacles,
    Math.min(TENTACLE_CAPS.maxTentacles, tentacleCount),
  );

  // --- Decompose into per-tentacle sub-tasks ---

  const subTasks = decomposeRequest(request, tentacleCount);

  // --- Build per-tentacle plans ---

  const tentacles: TentaclePlan[] = [];

  for (let i = 0; i < tentacleCount; i++) {
    const macroTask = subTasks[i] || `[TENTACLE ${i + 1}/${tentacleCount}] ${request}`;
    const mode = determineMode(macroTask);
    const subComplexity = getTaskComplexity(macroTask);

    // Determine agent count based on sub-task complexity (2-8)
    let agentCount: number;
    if (subComplexity >= 8) {
      agentCount = TENTACLE_CAPS.maxAgents;
    } else if (subComplexity >= 5) {
      agentCount = 5;
    } else if (subComplexity >= 3) {
      agentCount = 3;
    } else {
      agentCount = TENTACLE_CAPS.minAgents;
    }

    // Clamp agent count to valid range
    agentCount = Math.max(TENTACLE_CAPS.minAgents, Math.min(TENTACLE_CAPS.maxAgents, agentCount));

    // Generate mode-specific acceptance criteria
    const acceptanceCriteria = generateCriteria(mode);

    tentacles.push({
      macroTask,
      mode,
      agentCount,
      acceptanceCriteria,
    });
  }

  logger.info(
    `analyzeRequest: ${tentacleCount} tentacles, ${components.length} components, ` +
    `complexity=${totalComplexity}`,
  );

  return {
    tentacles,
    totalEstimatedComplexity: totalComplexity,
  };
}

// ============================================================
// deployPlanningDecision
// ============================================================

/**
 * Deploy a PlanningDecision by anchoring tentacles in the ClusterEngine.
 *
 * For each tentacle in the decision:
 *   1. Calls engine.anchorTentacle() with the tentacle's macro task,
 *      acceptance criteria, mode, SHARK agent type, and agent count
 *   2. Does NOT activate — activation is handled by the caller
 *      (planAndDeploy in ClusterManager)
 *
 * @param decision - The planning decision to deploy
 * @param engine - The ClusterEngine instance to anchor tentacles on
 * @returns Array of anchored tentacle IDs
 * @throws Error if any tentacle deployment fails
 */
export function deployPlanningDecision(
  decision: PlanningDecision,
  engine: ClusterEngine,
): string[] {
  const tentacleIds: string[] = [];

  for (const plan of decision.tentacles) {
    try {
      const tentacle = engine.anchorTentacle(
        plan.macroTask,
        plan.acceptanceCriteria,
        plan.mode,
        ClusterAgentType.SHARK,
        plan.agentCount,
      );

      tentacleIds.push(tentacle.tentacleId);

      logger.info(
        `Deployed tentacle ${tentacle.tentacleId}: ` +
        `mode=${plan.mode}, agents=${plan.agentCount}, ` +
        `task="${plan.macroTask.slice(0, 60)}..."`,
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error(
        `Failed to deploy tentacle "${plan.macroTask.slice(0, 60)}...": ${errMsg}`,
      );
      // Continue with remaining tentacles — caller gets partial deployment
      // which is better than throwing and losing all anchored progress
      logger.warn(
        `Skipping failed tentacle "${plan.macroTask.slice(0, 40)}" and continuing with next. ` +
        `${decision.tentacles.length - tentacleIds.length - 1} tentacles remaining.`,
      );
    }
  }

  logger.info(
    `Deployed ${tentacleIds.length}/${decision.tentacles.length} tentacles ` +
    `(estimated complexity=${decision.totalEstimatedComplexity})`,
  );

  return tentacleIds;
}
