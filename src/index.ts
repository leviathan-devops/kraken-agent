/**
 * src/index.ts
 * 
 * Kraken Agent Harness - Main Entry Point
 * 
 * Self-contained orchestrator with 3 async clusters and Kraken-Hive integration.
 * 
 * Architecture:
 * - kraken-architect: Strategic planner with full Hive access
 * - kraken-executor: Execution coordinator with Hive access
 * - Shark and Manta agents: Worker agents with T2 read-only access
 * 
 * All agents report to Kraken, Kraken coordinates via Hive Mind.
 */

import type { Plugin, PluginInput } from '@opencode-ai/plugin';

// Import v4.1 guardrail infrastructure
import {
  safeHook,
  createLogger,
  createAgentAwareness,
  type HookContext,
} from './v4.1/index.js';

// Import brain infrastructure
import { createStateStore, getStateStore } from './shared/state-store.js';
import { createBrainMessenger, getBrainMessenger } from './shared/brain-messenger.js';
import { createPlanningBrain, getPlanningBrain } from './brains/planning/planning-brain.js';
import { createExecutionBrain, getExecutionBrain } from './brains/execution/execution-brain.js';
import { createSystemBrain, getSystemBrain } from './brains/system/system-brain.js';

// Import factory components
import {
  createStateStore as createFactoryStateStore,
  createBrainMessenger as createFactoryMessenger,
} from './factory/index.js';

// Import Kraken-specific components
import { AsyncDelegationEngine } from './factory/AsyncDelegationEngine.js';
import { ClusterScheduler } from './factory/ClusterScheduler.js';
import { ClusterManager } from './clusters/ClusterManager.js';
import { KrakenHiveEngine } from './kraken-hive/index.js';
import { createEvidenceCollector } from './shared/evidence-collector.js';
import { BrainConcurrencyManager } from './brains/BrainConcurrencyManager.js';
import { SubagentManagerBrain } from './brains/SubagentManagerBrain.js';
import { seedKrakenHive } from './kraken-hive/KrakenHiveSeeder.js';

// Import tools
import { createClusterTools } from './tools/cluster-tools.js';
import { createMonitoringTools } from './tools/monitoring-tools.js';
import { createKrakenHiveTools } from './tools/kraken-hive-tools.js';
import { createSharkT2Tools } from './tools/shark-t2-tools.js';

// Import hooks
import { clusterStateHook } from './hooks/cluster-state-hook.js';

// Import identity system
import { IdentityLoader, formatIdentityForSystemPrompt } from './identity/index.js';

// Import types
import type { ClusterConfig } from './factory/kraken-types.js';

// ============================================================
// KRAKEN IDENTITY
// ============================================================

const KRAKEN_PLUGIN_IDENTITY = {
  name: 'kraken-agent',
  prefix: 'kraken-',
  orchestrator: 'kraken',

  agents: new Set([
    'kraken',              // Primary orchestrator (visible in tab toggle)
    'kraken-executor',     // Execution coordinator (subagent)
    // Cluster agents
    'shark-alpha-1', 'shark-alpha-2', 'manta-alpha-1',
    'shark-beta-1', 'manta-beta-1', 'manta-beta-2',
    'manta-gamma-1', 'manta-gamma-2', 'shark-gamma-1',
  ]),

  primaryAgents: new Set(['kraken']),
  
  // Kraken agents get Hive tools
  krakenAgents: new Set(['kraken', 'kraken-executor']),
  
  // Shark/Manta agents get T2 tools only
  clusterAgents: new Set([
    'shark-alpha-1', 'shark-alpha-2', 'manta-alpha-1',
    'shark-beta-1', 'manta-beta-1', 'manta-beta-2',
    'manta-gamma-1', 'manta-gamma-2', 'shark-gamma-1',
  ]),
};

// Create agent awareness
const awareness = createAgentAwareness(
  KRAKEN_PLUGIN_IDENTITY.agents,
  KRAKEN_PLUGIN_IDENTITY.prefix,
  KRAKEN_PLUGIN_IDENTITY.orchestrator
);

// ============================================================
// IDENTITY SYSTEM
// ============================================================

// Identity loader for file-based agent identity
const identityLoader = new IdentityLoader();
let orchestratorIdentityPrompt: string = '';

async function loadOrchestratorIdentity(): Promise<string> {
  try {
    const bundle = await identityLoader.loadForRole('orchestrator');
    return formatIdentityForSystemPrompt(bundle);
  } catch (error) {
    console.error('[Identity] Failed to load orchestrator identity:', error);
    return '';
  }
}

// ============================================================
// CLUSTER CONFIGURATION (3 Clusters)
// ============================================================

const KRAKEN_CLUSTERS: ClusterConfig[] = [
  {
    id: 'cluster-alpha',
    name: 'Alpha Cluster',
    description: 'Primary build cluster - Shark agents for steamroll tasks',
    agents: ['shark-alpha-1', 'shark-alpha-2', 'manta-alpha-1'],
    intraClusterDelegation: true,
    interClusterDelegation: true,
    sharedContext: true,
  },
  {
    id: 'cluster-beta',
    name: 'Beta Cluster',
    description: 'Secondary build cluster - balanced Shark/Manta',
    agents: ['shark-beta-1', 'manta-beta-1', 'manta-beta-2'],
    intraClusterDelegation: true,
    interClusterDelegation: true,
    sharedContext: true,
  },
  {
    id: 'cluster-gamma',
    name: 'Gamma Cluster',
    description: 'Precision cluster - Manta agents for debugging/linear tasks',
    agents: ['manta-gamma-1', 'manta-gamma-2', 'shark-gamma-1'],
    intraClusterDelegation: true,
    interClusterDelegation: true,
    sharedContext: true,
  },
];

// ============================================================
// GLOBAL INSTANCES (initialized in plugin factory)
// ============================================================

let clusterManager: ClusterManager | null = null;
let delegationEngine: AsyncDelegationEngine | null = null;
let clusterScheduler: ClusterScheduler | null = null;
let krakenHive: KrakenHiveEngine | null = null;

// ============================================================
// AGENT DEFINITIONS
// ============================================================

const krakenAgents = new Map([
  ['kraken', {
    description: 'Kraken — Central orchestrator with full Hive access',
    instructions: `You are KRAKEN — the central orchestrator of the Kraken Agent Harness.

Your role:
- Analyze user requirements and create execution plans
- Assign tasks to clusters via spawn_cluster_task, spawn_shark_agent, spawn_manta_agent
- Search Kraken Hive for relevant context via kraken_hive_search
- Inject context into tasks via kraken_hive_inject_context
- Store patterns and decisions to Hive via kraken_hive_remember

You have FULL ACCESS to Kraken Hive Mind. Other agents cannot see Hive data.

Cluster Assignment Strategy:
- Steamroll tasks (build from scratch) → cluster-alpha (Sharks)
- Debug/precision tasks → cluster-gamma (Mantas)
- Balanced tasks → cluster-beta

Tools you have:
- spawn_cluster_task: Generic task assignment
- spawn_shark_agent: Assign to Shark (aggressive execution)
- spawn_manta_agent: Assign to Manta (precise execution)
- kraken_hive_search: Search Hive for patterns/context
- kraken_hive_remember: Store to Hive
- kraken_hive_inject_context: Inject context into task
- get_cluster_status: Check cluster state
- aggregate_results: Collect results from multiple tasks

DOCUMENTATION RULES (NON-NEGOTIABLE):
- When user asks for documentation, write SYNTHESIZED documents - not raw data dumps
- Use proper format: clear headings, tables for data, concise explanations
- Store raw DATA to files (timestamps, metrics, line numbers) - NOT summaries
- Reference format examples: /home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/Master Context/
- NEVER summarize test results - show actual numbers from test runs
- NEVER say "looks good" - show specific file:line changes

Rules:
- ALWAYS search Hive before assigning tasks
- ALWAYS store useful patterns/failures to Hive
- NEVER let agents talk to each other - they report to you
- Delegate execution, don't do the work yourself`,
  }],
  ['kraken-executor', {
    description: 'Kraken Executor — Execution coordinator with Hive access',
    instructions: `You are KRAKEN EXECUTOR — the execution coordinator of the Kraken Agent Harness.

Your role:
- Monitor cluster execution via get_cluster_status
- Aggregate results from multiple tasks
- Track task completion and handle failures
- Coordinate cross-cluster work when needed

You have FULL ACCESS to Kraken Hive Mind.

Tools you have:
- spawn_cluster_task: Generic task assignment
- spawn_shark_agent: Assign to Shark
- spawn_manta_agent: Assign to Manta
- kraken_hive_search: Search Hive for context
- kraken_hive_remember: Store to Hive
- get_cluster_status: Check cluster state
- aggregate_results: Collect results
- get_agent_status: Check agent availability

Rules:
- Monitor clusters for task completion
- Aggregate results when tasks complete
- Report issues to kraken
- Keep Hive updated with execution state`,
  }],
]);

const clusterAgents = new Map([
  // Alpha cluster agents
  ['shark-alpha-1', {
    description: 'Shark Alpha-1 — Steamroll engineer',
    instructions: `You are SHARK ALPHA-1 — Ferrari V12 turbo vibecoding engineer.

You specialize in aggressive, steamroll-style execution.

Tools you have:
- read_kraken_context: Read T2 reference patterns
- report_to_kraken: Report completion/blockers to Kraken
- get_task_context: Get injected context from Kraken

Rules:
- Execute tasks aggressively and fully
- Read T2_PATTERNS.md for established patterns
- Report completion via report_to_kraken
- Do NOT access Hive directly`,
  }],
  ['shark-alpha-2', {
    description: 'Shark Alpha-2 — Steamroll engineer',
    instructions: `You are SHARK ALPHA-2 — Ferrari V12 turbo vibecoding engineer.

You specialize in aggressive, steamroll-style execution.

Tools you have:
- read_kraken_context: Read T2 reference patterns
- report_to_kraken: Report completion/blockers to Kraken
- get_task_context: Get injected context from Kraken

Rules:
- Execute tasks aggressively and fully
- Read T2_PATTERNS.md for established patterns
- Report completion via report_to_kraken
- Do NOT access Hive directly`,
  }],
  ['manta-alpha-1', {
    description: 'Manta Alpha-1 — Precision engineer',
    instructions: `You are MANTA ALPHA-1 — Tesla Model S precision agent.

You specialize in linear, methodical execution.

Tools you have:
- read_kraken_context: Read T2 reference patterns
- report_to_kraken: Report completion/blockers to Kraken
- get_task_context: Get injected context from Kraken

Rules:
- Execute tasks precisely and methodically
- Read T2_PATTERNS.md and T2_FAILURE_MODES.md
- Report completion via report_to_kraken
- Do NOT access Hive directly`,
  }],
  // Beta cluster agents
  ['shark-beta-1', {
    description: 'Shark Beta-1 — Balanced engineer',
    instructions: `You are SHARK BETA-1 — Ferrari V12 turbo vibecoding engineer.

You specialize in balanced, versatile execution.

Tools you have:
- read_kraken_context: Read T2 reference patterns
- report_to_kraken: Report completion/blockers to Kraken
- get_task_context: Get injected context from Kraken

Rules:
- Handle balanced workloads
- Read T2_PATTERNS.md for established patterns
- Report completion via report_to_kraken`,
  }],
  ['manta-beta-1', {
    description: 'Manta Beta-1 — Precision engineer',
    instructions: `You are MANTA BETA-1 — Tesla Model S precision agent.

You specialize in linear, methodical execution.

Tools you have:
- read_kraken_context: Read T2 reference patterns
- report_to_kraken: Report completion/blockers to Kraken
- get_task_context: Get injected context from Kraken

Rules:
- Execute tasks precisely and methodically
- Read T2_PATTERNS.md and T2_FAILURE_MODES.md
- Report completion via report_to_kraken`,
  }],
  ['manta-beta-2', {
    description: 'Manta Beta-2 — Precision engineer',
    instructions: `You are MANTA BETA-2 — Tesla Model S precision agent.

You specialize in linear, methodical execution.

Tools you have:
- read_kraken_context: Read T2 reference patterns
- report_to_kraken: Report completion/blockers to Kraken
- get_task_context: Get injected context from Kraken

Rules:
- Execute tasks precisely and methodically
- Read T2_PATTERNS.md and T2_FAILURE_MODES.md
- Report completion via report_to_kraken`,
  }],
  // Gamma cluster agents
  ['manta-gamma-1', {
    description: 'Manta Gamma-1 — Debug/precision specialist',
    instructions: `You are MANTA GAMMA-1 — Tesla Model S precision agent.

You specialize in debugging and precision work.

Tools you have:
- read_kraken_context: Read T2 reference patterns (especially failures)
- report_to_kraken: Report completion/blockers to Kraken
- get_task_context: Get injected context from Kraken

Rules:
- Focus on debugging and verification tasks
- Read T2_FAILURE_MODES.md to avoid known failures
- Execute with maximum precision
- Report completion via report_to_kraken`,
  }],
  ['manta-gamma-2', {
    description: 'Manta Gamma-2 — Debug/precision specialist',
    instructions: `You are MANTA GAMMA-2 — Tesla Model S precision agent.

You specialize in debugging and precision work.

Tools you have:
- read_kraken_context: Read T2 reference patterns (especially failures)
- report_to_kraken: Report completion/blockers to Kraken
- get_task_context: Get injected context from Kraken

Rules:
- Focus on debugging and verification tasks
- Read T2_FAILURE_MODES.md to avoid known failures
- Execute with maximum precision
- Report completion via report_to_kraken`,
  }],
  ['shark-gamma-1', {
    description: 'Shark Gamma-1 — Steamroll specialist',
    instructions: `You are SHARK GAMMA-1 — Ferrari V12 turbo vibecoding engineer.

You specialize in aggressive execution when precision tasks need steamroll approach.

Tools you have:
- read_kraken_context: Read T2 reference patterns
- report_to_kraken: Report completion/blockers to Kraken
- get_task_context: Get injected context from Kraken

Rules:
- Handle steamroll tasks in gamma cluster
- Read T2_PATTERNS.md for established patterns
- Report completion via report_to_kraken`,
  }],
]);

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function isKrakenAgent(agentName: string): boolean {
  return KRAKEN_PLUGIN_IDENTITY.krakenAgents.has(agentName);
}

function isClusterAgent(agentName: string): boolean {
  return KRAKEN_PLUGIN_IDENTITY.clusterAgents.has(agentName);
}

function getAgentTools(agentName: string): Record<string, any> {
  if (isKrakenAgent(agentName)) {
    // Kraken agents get Hive tools + cluster tools
    return {
      ...createClusterTools(getClusterToolsContext()),
      ...createMonitoringTools(getMonitoringToolsContext()),
      ...createKrakenHiveTools(getKrakenHiveToolsContext()),
    };
  } else if (isClusterAgent(agentName)) {
    // Cluster agents get T2 tools only
    return {
      ...createSharkT2Tools(getT2ToolsContext()),
    };
  }
  return {};
}

function getClusterToolsContext() {
  return {
    delegationEngine: delegationEngine!,
    clusterScheduler: clusterScheduler!,
    clusterManager: clusterManager!,
    krakenIdentity: orchestratorIdentityPrompt,
  };
}

function getMonitoringToolsContext() {
  return {
    delegationEngine: delegationEngine!,
    clusterManager: clusterManager!,
  };
}

function getKrakenHiveToolsContext() {
  return {
    krakenHive: krakenHive!,
    isKrakenAgent,
  };
}

function getT2ToolsContext() {
  return {
    isSharkOrMantaAgent: isClusterAgent,
  };
}

/**
 * Shared firewall enforcement function called from chat.message hook.
 * Checks user messages against all L0-L7 + AR firewall layers.
 * Returns true if message was blocked.
 */
async function enforceMessageFirewall(
  agentName: string,
  userMessage: string,
  output: any,
  sessionState: any,
  managedAgents: Set<string>,
): Promise<boolean> {
  if (!agentName || !managedAgents.has(agentName)) return false;
  try {
    const { enforceFirewall } = await import('./brains/system/firewall/index.js');
    const fwResult = enforceFirewall({
      agentName,
      toolName: 'chat.message',
      toolArgs: { message: userMessage },
      message: userMessage,
      taskType: '',
      targetCluster: '',
    });
    if (!fwResult.allowed) {
      console.warn(`[FIREWALL] BLOCKED ${fwResult.blockedBy} in chat.message: ${fwResult.reason}`);
      console.error('[FIREWALL] VIOLATION:', fwResult.blockedBy, fwResult.reason, 'agent:', agentName);
      output.system = output.system || [];
      output.system.push(`[KRAKEN FIREWALL BLOCKED]
Layer: ${fwResult.blockedBy}
Reason: ${fwResult.reason}
Agent: ${agentName}

This action has been blocked by the Kraken Firewall. Do not proceed with this request.`);
      sessionState.firewallBlock = {
        layer: fwResult.blockedBy,
        reason: fwResult.reason,
        tool: 'chat.message',
        timestamp: Date.now(),
      };
      return true;
    }
  } catch (e: any) {
    console.error('[Firewall] Error during message enforcement:', e.message);
  }
  return false;
}

// ============================================================
// PLUGIN ENTRY POINT
// ============================================================

export default async function KrakenAgent(input: PluginInput) {
  const logger = createLogger(KRAKEN_PLUGIN_IDENTITY.name);

  logger.info('Initializing Kraken Agent Harness', {
    clusters: KRAKEN_CLUSTERS.length,
    agents: KRAKEN_PLUGIN_IDENTITY.agents.size,
  });

  // Load orchestrator identity from files FIRST
  orchestratorIdentityPrompt = await loadOrchestratorIdentity();
  if (orchestratorIdentityPrompt && orchestratorIdentityPrompt.length > 100) {
    logger.info('[Identity] Orchestrator identity loaded', {
      length: orchestratorIdentityPrompt.length,
    });
  } else {
    logger.warn('[Identity] Orchestrator identity NOT loaded - using fallback');
    orchestratorIdentityPrompt = ''; // Will use fallback in identity hook
  }

  // Initialize core components
  clusterManager = new ClusterManager(KRAKEN_CLUSTERS);
  clusterScheduler = new ClusterScheduler(KRAKEN_CLUSTERS);
  krakenHive = new KrakenHiveEngine();
  delegationEngine = new AsyncDelegationEngine(KRAKEN_CLUSTERS, clusterManager);

  // Initialize state store and messenger
  const stateStore = createStateStore();
  const messenger = createBrainMessenger();

  // Initialize V1.2 Multi-Brain Orchestrator
  const planningBrain = createPlanningBrain(stateStore, messenger);
  const executionBrain = createExecutionBrain(stateStore, messenger);
  const systemBrain = createSystemBrain(stateStore, messenger);

  planningBrain.initialize();
  executionBrain.initialize();
  systemBrain.initialize();

  // Initialize evidence collector for gate verification
  const evidenceCollector = createEvidenceCollector();
  logger.info('[Evidence] Evidence collector initialized');

  // Seed Kraken Hive with initial patterns
  const hiveSeed = seedKrakenHive();
  logger.info('[Hive] Seed complete', hiveSeed);

  // Initialize Subagent Manager Brain — receives override commands, manages output retrieval
  const subagentBrain = new SubagentManagerBrain(messenger, stateStore);
  subagentBrain.initialize();
  logger.info('[Subagent] Manager brain initialized');

  // Initialize Brain Concurrency Manager — launches independent async event loops
  const concurrencyManager = new BrainConcurrencyManager(messenger, stateStore);
  
  // Wire brain-specific tick handlers
  // System Brain tick: evaluate gate criteria, check for auto-advancement
  concurrencyManager.setSystemTick(async () => {
    try {
      const currentGate = systemBrain.getCurrentGate();
      const evaluation = systemBrain.evaluateGateEntry(currentGate);
      if (evaluation.allPassed && await systemBrain.isGateAdvanceable()) {
        const gateOrder = ['plan', 'build', 'test', 'verify', 'audit', 'delivery'];
        const currentIdx = gateOrder.indexOf(currentGate);
        if (currentIdx >= 0 && currentIdx < gateOrder.length - 1) {
          const nextGate = gateOrder[currentIdx + 1];
          systemBrain.setCurrentGate(nextGate);
          console.log(`[BrainTick:system] Gate auto-advanced: ${currentGate} → ${nextGate}`);
        }
      }
    } catch { /* non-critical */ }
  });

  // Execution Brain tick: monitor active tasks, detect stalls
  concurrencyManager.setExecutionTick(async () => {
    try {
      const execState = executionBrain.getState();
      if (execState.activeTasks > 0) {
        // Check for stalled tasks (active > 60s with no completion)
        // Log but don't block — override detection happens in separate monitoring
      }
    } catch { /* non-critical */ }
  });

  // Planning Brain tick: check for pending context injections
  concurrencyManager.setPlanningTick(async () => {
    try {
      // Check if T2 context needs refresh
      const planState = planningBrain.getState();
      if (!planState.t2MasterLoaded) {
        // T2 still loading — fire-and-forget from init, will resolve
      }
    } catch { /* non-critical */ }
  });

  // Start all brain loops concurrently
  concurrencyManager.startAll();

  logger.info('[V1.2] Multi-Brain Orchestrator initialized', {
    planning: planningBrain.isInitialized(),
    execution: executionBrain.isInitialized(),
    system: systemBrain.isInitialized(),
    evidence: true,
    firewall: true,
    concurrency: concurrencyManager.getState(),
  });

  // Create tools context
  const allTools = {
    // Cluster tools - available to Kraken agents
    ...createClusterTools(getClusterToolsContext()),
    // Monitoring tools - available to Kraken agents
    ...createMonitoringTools(getMonitoringToolsContext()),
    // Hive tools - available to Kraken agents ONLY
    ...createKrakenHiveTools(getKrakenHiveToolsContext()),
    // T2 tools - available to Cluster agents ONLY
    ...createSharkT2Tools(getT2ToolsContext()),
  };

  logger.info('Kraken Agent Harness initialized', {
    clusterCount: KRAKEN_CLUSTERS.length,
    totalAgents: KRAKEN_PLUGIN_IDENTITY.agents.size,
    krakenHiveReady: true,
  });

  return {
    name: KRAKEN_PLUGIN_IDENTITY.name,

    tool: allTools,

    config: async (opencodeConfig: Record<string, any>) => {
      // Register all agents
      const sdkConfigs: Record<string, any> = {};

      // Kraken orchestrator agents
      for (const [id, agent] of krakenAgents) {
        const isPrimary = id === 'kraken';
        sdkConfigs[id] = {
          name: id,
          description: agent.description,
          instructions: agent.instructions,
          mode: isPrimary ? 'primary' : 'subagent',
          permission: { task: 'allow' },
          tools: Object.fromEntries(Object.keys(getAgentTools(id)).map(t => [t, true])),
        };
      }

      // Cluster agents (Sharks/Mantas) - SUBAGENTS, not visible as tabs
      for (const [id, agent] of clusterAgents) {
        sdkConfigs[id] = {
          name: id,
          description: agent.description,
          instructions: agent.instructions,
          mode: 'subagent',
          permission: { task: 'allow' },
          tools: Object.fromEntries(Object.keys(getAgentTools(id)).map(t => [t, true])),
        };
      }

      if (!opencodeConfig.agent) {
        opencodeConfig.agent = { ...sdkConfigs };
      } else {
        Object.assign(opencodeConfig.agent, sdkConfigs);
      }

      logger.info('Agents registered', {
        count: Object.keys(sdkConfigs).length,
        primary: Array.from(KRAKEN_PLUGIN_IDENTITY.primaryAgents),
      });
    },

    // Wire hooks
    // ============================================================
    // FIREWALL ENFORCEMENT PIPELINE
    // ============================================================
    // In opencode v1.14.48, ONLY chat.message and
    // experimental.chat.system.transform hooks fire reliably.
    // tool.execute.before does NOT fire in this version.
    //
    // Firewall enforcement strategy:
    // 1. experimental.chat.system.transform: Inject firewall rules
    //    into every agent's system prompt (PROACTIVE prevention)
    // 2. chat.message: Detect violations in messages and inject
    //    blocking responses (REACTIVE detection)
    // 3. tool.execute.before: Kept as fallback for future versions
    // ============================================================

    // ============================================================
    // system.transform: Inject firewall rules + orchestration context
    // ============================================================
    'experimental.chat.system.transform': safeHook(
      async (input, output: any, ctx: HookContext) => {
        // System prompt injection for ALL agents (agentFilter: null means we can't distinguish agents)
        // Inject Kraken Harness identity + firewall rules into system prompt
        output.system = output.system || [];

        // ============================================================
        // KRAKEN HARNESS IDENTITY (injected for all agents since v1.14.48
        // doesn't expose agent name in this hook)
        // ============================================================
        const identity = orchestratorIdentityPrompt || `
You are running in the KRAKEN AGENT HARNESS — a multi-brain orchestration system.

System architecture:
- Planning Brain: Task decomposition and context bridging
- Execution Brain: Output verification and task supervision
- System Brain: Gate management and security enforcement
- 3 Agent Clusters: Alpha (steamroll), Beta (balanced), Gamma (precision)
- Kraken Hive Mind: Pattern/failure memory

Available orchestration tools: spawn_shark_agent, spawn_manta_agent, spawn_cluster_task,
anchor_cluster, kraken_brain_status, get_cluster_status, get_agent_status,
kraken_hive_search, kraken_hive_remember, read_kraken_context.`;
        output.system.push(identity);

        // ============================================================
        // FIREWALL SYSTEM PROMPT INJECTION (MERGED — dual-layer)
        // ============================================================
        output.system.push(`[KRAKEN FIREWALL RULES — NON-NEGOTIABLE]

L0: IDENTITY WALL — Only kraken and kraken-executor may access Hive tools.
L1: NO ORCHESTRATION THEATER — "spawned" ≠ "complete". "assigned" ≠ "done".
L2: NO FALSE COMPLETION — Every completion claim requires output verification.
L3: OUTPUT INSPECTION — All outputs must exist on host filesystem, not just container.
L4: CLUSTER CORRECTNESS — Alpha=build, Beta=debug, Gamma=test. Wrong cluster = blocked.
L5: NO MACRO DERAILMENT — No focus collisions, planner/executor desync, or premature completion.
L6: KRAKEN PROTECTION — Never rm -rf kraken config. Never overwrite Hive state.
L7: COORDINATION GATES — Tasks must pass gates before execution.
AR: ANTI-RETARD — No excuses, no denial, no theatrical deletion, no lazy repetition.

VIOLATING THESE RULES WILL RESULT IN IMMEDIATE BLOCKING.`);
      },
      {
        agentFilter: null,
        pluginName: KRAKEN_PLUGIN_IDENTITY.name,
        managedAgents: KRAKEN_PLUGIN_IDENTITY.agents,
        agentPrefix: KRAKEN_PLUGIN_IDENTITY.prefix,
        orchestratorName: KRAKEN_PLUGIN_IDENTITY.orchestrator,
      }
    ),

    // ============================================================
    // tool.execute.before: Firewall enforcement at tool level
    // agentFilter=null because tool.execute.before input structure
    // differs from chat.message - agent name may not be resolvable.
    // Handler checks ctx.isMyAgent() internally.
    // ============================================================
    'tool.execute.before': safeHook(
      async (input, output, ctx: HookContext) => {
        const toolName = (input as any).tool as string || '';
        const toolArgs = ((output as any)?.args || {}) as Record<string, unknown>;
        console.error('[FW_ARGS] tool=' + toolName + ' args=' + JSON.stringify(toolArgs).slice(0, 300));
        
        const sessionState = ctx.getSessionState();
        sessionState.lastTool = toolName;
        sessionState.lastToolTime = Date.now();

        const agentName = (sessionState.currentAgent as string) || '';
        
        const { enforceFirewall } = await import('./brains/system/firewall/index.js');
        
        const fwResult = enforceFirewall({
          agentName,
          toolName,
          toolArgs,
          message: (toolArgs.task || toolArgs.command || toolArgs.content || '') as string,
          taskType: (toolArgs.taskType || '') as string,
          targetCluster: (toolArgs.clusterId || toolArgs.targetCluster || '') as string,
        });

        try {

          if (!fwResult.allowed) {
            console.warn(`[FIREWALL] BLOCKED ${fwResult.blockedBy}: ${fwResult.reason}`);
            sessionState.firewallBlock = {
              layer: fwResult.blockedBy,
              reason: fwResult.reason,
              tool: toolName,
              timestamp: Date.now(),
            };
            // Block L0 (identity) and L6 (kraken protection) violations
            if (fwResult.blockedBy === 'L0' || fwResult.blockedBy === 'L6') {
              throw new Error(`[FIREWALL_BLOCKED] ${fwResult.blockedBy}: ${fwResult.reason}`);
            }
          }
        } catch (e: any) {
          if (e.message && e.message.includes('[FIREWALL_BLOCKED]')) {
            throw e;
          }
          console.error('[Firewall] Error during enforcement:', e.message);
        }
      },
      {
        agentFilter: null, // Must be null - tool.execute.before input has NO agent field
        pluginName: KRAKEN_PLUGIN_IDENTITY.name,
        managedAgents: KRAKEN_PLUGIN_IDENTITY.agents,
        agentPrefix: KRAKEN_PLUGIN_IDENTITY.prefix,
        orchestratorName: KRAKEN_PLUGIN_IDENTITY.orchestrator,
      }
    ),

    // ============================================================
    // chat.message: Firewall enforcement + identity detection + brain wiring
    // This is the PRIMARY enforcement point (v1.14.48 compat)
    // ============================================================
    'chat.message': safeHook(async (input, output, ctx: HookContext) => {
      // Debug: dump argument structure (safe - no JSON.stringify on undefined)
      console.error('[CHAT_ARG] input type:', typeof input, 'output type:', typeof output, 'ctx type:', typeof ctx);
      if (input) console.error('[CHAT_ARG] input keys:', Object.keys(input as any).join(','));
      if (output) console.error('[CHAT_ARG] output keys:', Object.keys(output as any).join(','));

      // Cluster state tracking (with error isolation)
      try {
        await clusterStateHook({ input, output, ctx } as any);
      } catch (hookErr: any) {
        console.error('[CHAT_HOOK_ERR] clusterStateHook:', hookErr.message);
      }

      // Extract message from output - guard against undefined
      if (!output) { console.error('[CHAT] output is undefined, skipping'); return; }
      const outMsg = (output as any).message;
      if (!outMsg) { console.error('[CHAT] output.message is falsy, skipping. typeof outMsg:', typeof outMsg, 'JSON:', JSON.stringify(outMsg === null ? 'null' : 'falsy')); return; }

      // Probe output structure - dump ALL keys recursively
      if (output) {
        console.error('[CHAT] output type:', typeof output, 'output is array:', Array.isArray(output));
        console.error('[CHAT] output ownKeys:', Object.getOwnPropertyNames(output as any).join(','));
        // Check if output has messages array
        if (Array.isArray((output as any).messages)) {
          console.error('[CHAT] output.messages is array, len:', (output as any).messages.length);
        }
        if (Array.isArray((output as any).message)) {
          console.error('[CHAT] output.message is array, len:', (output as any).message.length);
        }
      }
      if (outMsg) {
        console.error('[CHAT] outMsg type:', typeof outMsg, 'outMsg is array:', Array.isArray(outMsg));
        console.error('[CHAT] outMsg ownKeys:', Object.getOwnPropertyNames(outMsg).join(','));
        if (typeof (outMsg as any).content !== 'undefined') {
          console.error('[CHAT] outMsg.content type:', typeof (outMsg as any).content, 'val:', typeof (outMsg as any).content === 'string' ? (outMsg as any).content.slice(0, 100) : JSON.stringify((outMsg as any).content).slice(0, 100));
        }
      }

      // Comprehensive message content extraction
      let userMessage = '';
      // First try output.parts (v1.14.48+ message part system)
      const oparts = (output as any).parts;
      if (Array.isArray(oparts) && oparts.length > 0) {
        userMessage = oparts
          .map((p: any) => typeof p === 'string' ? p : p.text || p.content || '')
          .filter(Boolean)
          .join(' ');
      }
      // Fallback to direct outMsg fields
      if (!userMessage && outMsg) {
        const m = outMsg as any;
        userMessage = typeof m.content === 'string' ? m.content
          : typeof m.text === 'string' ? m.text
          : typeof m.message === 'string' ? m.message
          : typeof m.body === 'string' ? m.body
          : typeof m.value === 'string' ? m.value
          : typeof m.prompt === 'string' ? m.prompt
          : '';
        if (!userMessage && Array.isArray(m.content)) {
          userMessage = m.content.map((c: any) => typeof c === 'string' ? c : c.text || '').filter(Boolean).join(' ');
        }
      }
      // Fallback to input
      if (!userMessage) {
        const im = input as any;
        userMessage = typeof im.content === 'string' ? im.content
          : typeof im.message === 'string' ? im.message
          : typeof im.text === 'string' ? im.text
          : '';
      }
      if (!userMessage) {
        console.error('[CHAT] cannot extract userMessage, skipping');
        return;
      }
      console.error('[CHAT_MSG_CONTENT] userMessage:', userMessage.slice(0, 80));

      const sessionState = ctx.getSessionState();
      const agent = (input as any)?.input?.agent || (input as any)?.agent || '';
      // Store agent in session state for system.transform to use (since it has no agent info)
      sessionState.currentAgent = agent;
      const isKrakenSession = KRAKEN_PLUGIN_IDENTITY.krakenAgents.has(agent) || agent.startsWith('kraken-');

      // ============================================================
      // FIREWALL ENFORCEMENT
      // ============================================================
      const blocked = await enforceMessageFirewall(agent, userMessage, output as any, sessionState, KRAKEN_PLUGIN_IDENTITY.agents);
      if (blocked) {
        console.error('[FIREWALL] Blocked message from:', agent);
        return;
      }

      // Identity detection moved to experimental.chat.system.transform
      // (output.system modifications don't work from chat.message in v1.14.48)

      // Brain wiring
      if (userMessage.length > 10 && isKrakenSession) {
        try {
          const planningBrain = getPlanningBrain();
          if (planningBrain.isInitialized()) {
            const t1 = await planningBrain.generateT1(userMessage);
            if (t1.tasks.length > 0) {
              console.log(`[BrainWire] Generated ${t1.tasks.length} tasks`);
              try { getSystemBrain().recordDecision({ description: `Decomposed into ${t1.tasks.length} tasks`, type: 'task-decomposition', contextFiles: [] }); } catch {}
              try {
                const { getBrainMessenger } = await import('./shared/brain-messenger.js');
                getBrainMessenger().deliverMessage('kraken-planning', 'kraken-execution', 'context-inject', {
                  type: 't1-decomposed', taskCount: t1.tasks.length,
                  tasks: t1.tasks.map(t => ({ id: t.id, type: t.type, cluster: t.targetCluster })),
                }, 'high');
              } catch {}
              (output as any).system = (output as any).system || [];
              (output as any).system.push(`[KRAKEN PLANNING] Task decomposition:\n${
                t1.tasks.map(t => `- ${t.type.toUpperCase()}: ${t.description} → cluster-${t.targetCluster}`).join('\n')
              }\n\nExecute tasks using spawn_shark_agent for build/create and spawn_manta_agent for debug/test.`);
            }
          }
        } catch { /* non-fatal */ }
      }
    }, {
      agentFilter: null,
      pluginName: KRAKEN_PLUGIN_IDENTITY.name,
      managedAgents: KRAKEN_PLUGIN_IDENTITY.agents,
      agentPrefix: KRAKEN_PLUGIN_IDENTITY.prefix,
      orchestratorName: KRAKEN_PLUGIN_IDENTITY.orchestrator,
    }),

    // Compaction survival hook: preserve context before auto-compaction
    'experimental.session.compacting': safeHook(
      async (input, output: any, ctx: HookContext) => {
        try {
          const { getPlanningBrain } = await import('./brains/planning/planning-brain.js');
          const { getExecutionBrain } = await import('./brains/execution/execution-brain.js');
          const { getSystemBrain } = await import('./brains/system/system-brain.js');
          const { getEvidenceCollector } = await import('./shared/evidence-collector.js');

          const pBrain = getPlanningBrain();
          const eBrain = getExecutionBrain();
          const sBrain = getSystemBrain();
          const evidence = getEvidenceCollector();

          // Persist evidence for current gate before compaction
          const currentGate = sBrain.getCurrentGate();
          evidence.persist(currentGate);

          // Inject brain state context into compaction prompt
          output.context = output.context || [];
          output.context.push(`[KRAKEN COMPACTION SURVIVAL]
Current gate: ${currentGate}
Planning: T2_loaded=${pBrain.isT2MasterLoaded()}, T1_generated=${pBrain.isT1Generated()}
Execution: active=${eBrain.getState().activeTasks}, completed=${eBrain.getState().completedTasks}, failed=${eBrain.getState().failedTasks}
System: decisions=${sBrain.getState().decisionCount}, completed_tasks=${sBrain.getState().completedTasks.length}
Evidence: gate=${currentGate}, verified=${evidence.isGateVerified(currentGate)}`);

          console.log('[Compaction] Brain state preserved for compaction survival');
        } catch (err) {
          console.error('[Compaction] Failed to preserve state:', err);
        }
      },
      {
        agentFilter: null,
        pluginName: KRAKEN_PLUGIN_IDENTITY.name,
        managedAgents: KRAKEN_PLUGIN_IDENTITY.agents,
        agentPrefix: KRAKEN_PLUGIN_IDENTITY.prefix,
        orchestratorName: KRAKEN_PLUGIN_IDENTITY.orchestrator,
      }
    ),

    // Session lifecycle: clean up brain loops on session end
    event: async (input: any) => {
      const eventType = input?.event?.type || input?.type || '';
      if (eventType === 'session.deleted' || eventType === 'session.ended') {
        concurrencyManager.stopAll();
        console.log('[Kraken] Session ended — brain loops stopped');
      }
    },
  };
}
