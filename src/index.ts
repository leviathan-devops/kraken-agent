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

// Import factory components
import {
  createStateStore,
  createBrainMessenger,
} from './factory/index.js';

// Import Kraken-specific components
import { AsyncDelegationEngine } from './factory/AsyncDelegationEngine.js';
import { ClusterScheduler } from './factory/ClusterScheduler.js';
import { ClusterManager } from './clusters/ClusterManager.js';
import { KrakenHiveEngine } from './kraken-hive/index.js';

// Import tools
import { createClusterTools } from './tools/cluster-tools.js';
import { createMonitoringTools } from './tools/monitoring-tools.js';
import { createKrakenHiveTools } from './tools/kraken-hive-tools.js';
import { createSharkT2Tools } from './tools/shark-t2-tools.js';

// Import hooks
import { clusterStateHook } from './hooks/cluster-state-hook.js';

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

// ============================================================
// PLUGIN ENTRY POINT
// ============================================================

export default async function KrakenAgent(input: PluginInput) {
  const logger = createLogger(KRAKEN_PLUGIN_IDENTITY.name);

  logger.info('Initializing Kraken Agent Harness', {
    clusters: KRAKEN_CLUSTERS.length,
    agents: KRAKEN_PLUGIN_IDENTITY.agents.size,
  });

  // Initialize core components
  clusterManager = new ClusterManager(KRAKEN_CLUSTERS);
  clusterScheduler = new ClusterScheduler(KRAKEN_CLUSTERS);
  krakenHive = new KrakenHiveEngine();
  delegationEngine = new AsyncDelegationEngine(KRAKEN_CLUSTERS, clusterManager);

  // Initialize state store and messenger
  const stateStore = createStateStore();
  const messenger = createBrainMessenger();

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
          tools: getAgentTools(id),
        };
      }

      // Cluster agents (Sharks/Mantas)
      for (const [id, agent] of clusterAgents) {
        sdkConfigs[id] = {
          name: id,
          description: agent.description,
          instructions: agent.instructions,
          mode: 'subagent',
          permission: { task: 'allow' },
          tools: getAgentTools(id),
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
    'experimental.chat.system.transform': safeHook(
      async (input, output: any, ctx: HookContext) => {
        if (!ctx.isMyAgent()) return;

        const agentName = ctx.agentName || '';
        let contextInjection = '';

        if (isKrakenAgent(agentName)) {
          contextInjection = `
[${agentName}] Operating in KRAKEN ORCHESTRATOR mode.
You have FULL ACCESS to Kraken Hive Mind.
Search patterns, store decisions, coordinate clusters.
`;
        } else if (isClusterAgent(agentName)) {
          contextInjection = `
[${agentName}] Operating in CLUSTER AGENT mode.
You have READ-ONLY access to T2 reference library.
Report to Kraken via report_to_kraken.
Do NOT access Hive directly.
`;
        }

        output.system = output.system || [];
        output.system.push(contextInjection);
      },
      {
        agentFilter: Array.from(KRAKEN_PLUGIN_IDENTITY.agents),
        pluginName: KRAKEN_PLUGIN_IDENTITY.name,
        managedAgents: KRAKEN_PLUGIN_IDENTITY.agents,
        agentPrefix: KRAKEN_PLUGIN_IDENTITY.prefix,
        orchestratorName: KRAKEN_PLUGIN_IDENTITY.orchestrator,
      }
    ),

    'tool.execute.before': safeHook(
      async (input, output, ctx: HookContext) => {
        if (!ctx.isMyAgent()) return;

        const sessionState = ctx.getSessionState();
        sessionState.lastTool = (input as any).tool;
        sessionState.lastToolTime = Date.now();
      },
      {
        agentFilter: Array.from(KRAKEN_PLUGIN_IDENTITY.agents),
        pluginName: KRAKEN_PLUGIN_IDENTITY.name,
        managedAgents: KRAKEN_PLUGIN_IDENTITY.agents,
        agentPrefix: KRAKEN_PLUGIN_IDENTITY.prefix,
        orchestratorName: KRAKEN_PLUGIN_IDENTITY.orchestrator,
      }
    ),

    // Track cluster activity for all agents
    'chat.message': clusterStateHook,
  };
}
